// src/pages/Builder.tsx - COMPLETE FINAL VERSION WITH PRO EDITING

import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Editor from '@monaco-editor/react';
import {
  Send, Download, FileCode, Loader2, Copy, Check,
  Home, Eye, Code2, Sparkles, Split, User, Bot,
  ChevronLeft, ChevronRight, X, Minimize2, Maximize2,
  Zap, TrendingUp, AlertTriangle, Lock, Edit3, Save, Crown
} from 'lucide-react';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/FirebaseClient';
import { FloatingProfile } from '../components/FloatingProfile';
import { generateExtensionCode, GeneratedFile, Message, validateExtension } from './../../src/methods/services/aiService';
import { getUserCredits, hasCreditsAvailable, useCredit, getDaysUntilReset, UserCredits } from './../../src/methods/services/CreditService';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import CodePreview from '../components/CodePreview';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export default function Builder() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const initialPrompt = searchParams.get('prompt') || '';

  const [prompt, setPrompt] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [files, setFiles] = useState<GeneratedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<GeneratedFile | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'code' | 'split' | 'preview'>('split');
  const [error, setError] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState('');

  // Pro editing states
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [editingFile, setEditingFile] = useState<GeneratedFile | null>(null);
  const [editedCode, setEditedCode] = useState('');

  // Project history states
  const [projectName, setProjectName] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');

  // Credits state
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [showLowCreditsAlert, setShowLowCreditsAlert] = useState(false);
  const [creditsLoaded, setCreditsLoaded] = useState(false);
  const [daysUntilReset, setDaysUntilReset] = useState(0);

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(340);
  const [isResizing, setIsResizing] = useState(false);

  const [hasProcessedInitialPrompt, setHasProcessedInitialPrompt] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, streamingText]);

  // Load user credits with real-time updates
  useEffect(() => {
    if (!user) return;

    const userCreditsRef = doc(db, 'userCredits', user.uid);
    const unsubscribe = onSnapshot(userCreditsRef, async (snapshot) => {
      try {
        const data = snapshot.data();
        if (data) {
          const userCredits: UserCredits = {
            plan: data.plan || 'free',
            credits: data.creditsRemaining || data.credits || 30,
            maxCredits: data.maxCredits || 30,
            billingPeriod: data.billingPeriod || 'monthly',
            lastResetDate: data.lastResetDate || new Date().toISOString(),
            nextResetDate: data.nextResetDate || getNextResetDate(),
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString(),
            dailyCreditsUsed: data.dailyCreditsUsed || 0,
            dailyLimit: data.dailyLimit || 5,
            lastDailyReset: data.lastDailyReset || new Date().toISOString(),
            monthlyCreditsUsed: data.monthlyCreditsUsed || 0,
            lastMonthlyReset: data.lastMonthlyReset || new Date().toISOString()
          };

          setCredits(userCredits);
          
          if (userCredits.nextResetDate) {
            const days = getDaysUntilReset(userCredits.nextResetDate);
            setDaysUntilReset(days);
          }
          
          if (userCredits.credits <= 3 && userCredits.plan === 'free') {
            setShowLowCreditsAlert(true);
          }
          
        } else {
          setCredits({
            plan: 'free',
            credits: 30,
            maxCredits: 30,
            billingPeriod: 'monthly',
            lastResetDate: new Date().toISOString(),
            nextResetDate: getNextResetDate(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            dailyCreditsUsed: 0,
            dailyLimit: 5,
            lastDailyReset: new Date().toISOString(),
            monthlyCreditsUsed: 0,
            lastMonthlyReset: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('❌ Error processing credits:', error);
      } finally {
        setCreditsLoaded(true);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Handle initial prompt
  useEffect(() => {
    if (!user) {
      navigate('/signup');
      return;
    }
    
    if (initialPrompt && !hasProcessedInitialPrompt && creditsLoaded) {
      setHasProcessedInitialPrompt(true);
      setPrompt(initialPrompt);
      setTimeout(() => handleGenerate(initialPrompt), 500);
    }
  }, [user, initialPrompt, hasProcessedInitialPrompt, creditsLoaded]);

  // Load project from Firestore
  useEffect(() => {
    const loadProject = async () => {
      const projectParam = searchParams.get('project');
      if (!projectParam || !user) return;

      try {
        const projectRef = doc(db, 'users', user.uid, 'projects', projectParam);
        const projectSnap = await getDoc(projectRef);

        if (projectSnap.exists()) {
          const project = projectSnap.data();
          console.log('📂 Loading project:', project.name);
          
          setProjectName(project.name);
          setProjectId(project.id);
          setFiles(project.files || []);
          
          if (project.files && project.files.length > 0) {
            setSelectedFile(project.files[0]);
          }
        } else {
          console.warn('⚠️ Project not found');
        }
      } catch (error) {
        console.error('❌ Error loading project:', error);
      }
    };

    loadProject();
  }, [searchParams, user]);

  // Auto-save project when files change
  useEffect(() => {
    if (files.length > 0 && projectName && user) {
      const saveTimer = setTimeout(() => {
        saveProjectToFirestore(projectName, files);
      }, 2000);

      return () => clearTimeout(saveTimer);
    }
  }, [files, projectName, user]);

  // Handle sidebar resize
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = e.clientX;
      if (newWidth >= 280 && newWidth <= 500) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const getNextResetDate = (): string => {
    const nextReset = new Date();
    nextReset.setDate(nextReset.getDate() + 30);
    return nextReset.toISOString();
  };

  // Save project to Firestore
  const saveProjectToFirestore = async (name: string, projectFiles: GeneratedFile[]) => {
    if (!user || projectFiles.length === 0) return;

    try {
      const projectData = {
        id: projectId || Date.now().toString(),
        name: name,
        lastModified: new Date().toISOString(),
        files: projectFiles.map(f => ({
          name: f.name,
          path: f.path,
          content: f.content,
          language: f.language
        })),
        userId: user.uid,
        firstPrompt: name,
        createdAt: projectId ? undefined : new Date().toISOString()
      };

      const projectRef = doc(db, 'users', user.uid, 'projects', projectData.id);
      await setDoc(projectRef, projectData, { merge: true });

      console.log('✅ Project saved to Firestore:', projectData.name);
    } catch (error) {
      console.error('❌ Error saving project:', error);
    }
  };

  // Pro editing functions
  const handleOpenCodeEditor = (file: GeneratedFile) => {
    if (credits?.plan !== 'pro') {
      alert('⚠️ Code editing is a Pro feature!\n\nUpgrade to Pro to edit code and see live changes in the preview.');
      navigate('/#pricing');
      return;
    }
    
    setEditingFile(file);
    setEditedCode(file.content);
    setShowCodeEditor(true);
  };

  const handleSaveEditedCode = () => {
    if (!editingFile) return;
    
    const updatedFiles = files.map(f => 
      f.name === editingFile.name 
        ? { ...f, content: editedCode }
        : f
    );
    
    setFiles(updatedFiles);
    
    if (selectedFile?.name === editingFile.name) {
      setSelectedFile({ ...editingFile, content: editedCode });
    }
    
    setShowCodeEditor(false);
    setEditingFile(null);
  };

  const ensureCorrectLanguage = (file: GeneratedFile): GeneratedFile => {
    const filename = file.name.toLowerCase();
    let correctLanguage = 'plaintext';

    if (filename.endsWith('.json')) {
      correctLanguage = 'json';
    } else if (filename.endsWith('.html') || filename.endsWith('.htm')) {
      correctLanguage = 'html';
    } else if (filename.endsWith('.css')) {
      correctLanguage = 'css';
    } else if (filename.endsWith('.js') || filename.endsWith('.mjs')) {
      correctLanguage = 'javascript';
    }

    return { ...file, language: correctLanguage };
  };

  const handleGenerate = async (customPrompt?: string) => {
    const promptText = customPrompt || prompt;
    if (!promptText.trim()) return;

    if (user && creditsLoaded) {
      try {
        const hasCredits = await hasCreditsAvailable(user.uid);
        
        if (!hasCredits) {
          if (credits?.plan === 'free') {
            const dailyUsed = credits.dailyCreditsUsed || 0;
            const dailyLimit = credits.dailyLimit || 5;
            
            if (dailyUsed >= dailyLimit) {
              alert('⏰ Daily Limit Reached!\n\nYou\'ve used all 5 daily prompts today. Come back tomorrow for more, or upgrade to Pro for unlimited prompts!');
              return;
            }
          }
          
          alert('⚠️ You have run out of monthly prompts! Please upgrade your plan or wait for monthly reset.');
          navigate('/#pricing');
          return;
        }
      } catch (error) {
        console.error('❌ Credit check failed:', error);
      }
    }

    if (isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setStreamingText('');
    setPrompt('');

    const userMessage: ChatMessage = {
      role: 'user',
      content: promptText,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, userMessage]);

    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    };
    setChatMessages(prev => [...prev, assistantMessage]);

    const newHistory: Message[] = [
      ...conversationHistory,
      { role: 'user', content: promptText }
    ];
    setConversationHistory(newHistory);

    const existingFiles = files.length > 0 ? files : [];

    try {
      let streamedContent = '';
      
      const result = await generateExtensionCode(
        promptText,
        existingFiles,
        newHistory,
        (chunk: string) => {
          streamedContent += chunk;
          setStreamingText(streamedContent);
        },
        (file: GeneratedFile) => {
          const correctedFile = ensureCorrectLanguage(file);
          
          setFiles(prev => {
            const existing = prev.findIndex(f => f.name === correctedFile.name);
            if (existing >= 0) {
              const updated = [...prev];
              updated[existing] = correctedFile;
              return updated;
            }
            return [...prev, correctedFile];
          });
        }
      );

      if (result.files.length > 0) {
        const correctedFiles = result.files.map((file: any) => ensureCorrectLanguage(file));
        setFiles(correctedFiles);
        
        if (!projectName && promptText) {
          const newProjectName = promptText.length > 50 
            ? promptText.substring(0, 50) + '...' 
            : promptText;
          setProjectName(newProjectName);
          
          if (!projectId) {
            const newId = Date.now().toString();
            setProjectId(newId);
          }
          
          setTimeout(() => {
            saveProjectToFirestore(newProjectName, correctedFiles);
          }, 1000);
        }
        
        const validation = validateExtension(correctedFiles);
        if (!validation.isValid) {
          console.warn('⚠️ Missing files:', validation.missingFiles);
        }
        
        if (!selectedFile || !correctedFiles.find((f: { name: any; }) => f.name === selectedFile.name)) {
          setSelectedFile(correctedFiles[0]);
        } else {
          const updatedSelected = correctedFiles.find((f: { name: any; }) => f.name === selectedFile.name);
          if (updatedSelected) {
            setSelectedFile(updatedSelected);
          }
        }
      }

      const finalMessage = result.explanation || result.response;
      setChatMessages(prev => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        updated[lastIndex] = {
          role: 'assistant',
          content: finalMessage + `\n\n📁 Generated ${result.files.length} files:\n${result.files.map((f: { name: any; }) => `• ${f.name}`).join('\n')}`,
          timestamp: new Date(),
          isStreaming: false
        };
        return updated;
      });

      setConversationHistory([
        ...newHistory,
        { role: 'assistant', content: finalMessage }
      ]);

      if (user) {
        try {
          const creditUsed = await useCredit(user.uid);
          
          if (creditUsed) {
            const updatedCredits = await getUserCredits(user.uid);
            if (updatedCredits) {
              setCredits(updatedCredits);
              
              if (updatedCredits.nextResetDate) {
                const days = getDaysUntilReset(updatedCredits.nextResetDate);
                setDaysUntilReset(days);
              }
            }
          }
        } catch (err) {
          console.error('❌ Credit deduction error:', err);
        }
      }

    } catch (error: any) {
      console.error('❌ Generation error:', error);
      setError(error.message);
      
      setChatMessages(prev => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        updated[lastIndex] = {
          role: 'assistant',
          content: `❌ Error: ${error.message}`,
          timestamp: new Date(),
          isStreaming: false
        };
        return updated;
      });

      setConversationHistory([
        ...newHistory,
        { role: 'assistant', content: `Error: ${error.message}` }
      ]);
    } finally {
      setIsGenerating(false);
      setStreamingText('');
    }
  };

  const handleDownload = async () => {
    if (files.length === 0) return;

    try {
      const zip = new JSZip();
      
      files.forEach(file => {
        zip.file(file.path, file.content);
      });

      const readme = `# Chrome Extension

Generated by Extension Builder

## Files Included
${files.map(f => `- ${f.name} (${(f.content.length / 1024).toFixed(1)}kb)`).join('\n')}

## Installation
1. Open Chrome and go to chrome://extensions/
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select the extracted folder

Generated on: ${new Date().toLocaleString()}
`;
      
      zip.file('README.md', readme);

      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, 'chrome-extension.zip');
    } catch (error) {
      console.error('❌ Download error:', error);
      setError('Failed to download extension');
    }
  };

  const handleCopy = () => {
    if (!selectedFile) return;
    
    navigator.clipboard.writeText(selectedFile.content)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('❌ Copy failed:', err);
      });
  };

  const handleFileSelect = (file: GeneratedFile) => {
    const correctedFile = ensureCorrectLanguage(file);
    setSelectedFile(correctedFile);
  };

  const handleCodeChange = (value: string | undefined) => {
    if (credits?.plan !== 'pro') return; // Prevent free users from editing
    
    if (value !== undefined && selectedFile) {
      const updatedFiles = files.map(f => 
        f.name === selectedFile.name 
          ? { ...f, content: value }
          : f
      );
      setFiles(updatedFiles);
      setSelectedFile({ ...selectedFile, content: value });
    }
  };

  const validFiles = files.filter(f => 
    f.name && 
    f.name.length > 0 && 
    !f.name.startsWith('=') &&
    f.content &&
    f.content.length > 0
  );

  // Code Editor Modal Component
  const CodeEditorModal = () => {
    if (!showCodeEditor || !editingFile) return null;

    return (
      <div className="code-editor-modal-overlay" onClick={() => setShowCodeEditor(false)}>
        <div className="code-editor-modal" onClick={(e) => e.stopPropagation()}>
          <div className="code-editor-header">
            <div className="header-left">
              <Edit3 size={20} />
              <div>
                <h3>Advanced Code Editor</h3>
                <p>Editing: {editingFile.name}</p>
              </div>
            </div>
            <button 
              onClick={() => setShowCodeEditor(false)} 
              className="close-modal-btn"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="code-editor-content">
            <Editor
              height="100%"
              language={editingFile.language}
              value={editedCode}
              theme="vs-dark"
              options={{
                minimap: { enabled: true },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on',
                readOnly: false,
                formatOnPaste: true,
                formatOnType: true,
                quickSuggestions: true,
                suggest: {
                  enabled: true
                }
              }}
              onChange={(value) => setEditedCode(value || '')}
            />
          </div>
          
          <div className="code-editor-footer">
            <div className="footer-info">
              <span className="pro-badge-small">
                <Crown size={12} />
                PRO FEATURE
              </span>
              <span className="file-info">
                {editingFile.language.toUpperCase()} • {(editedCode.length / 1024).toFixed(1)} KB
              </span>
            </div>
            <div className="footer-actions">
              <button 
                onClick={() => setShowCodeEditor(false)} 
                className="cancel-btn"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEditedCode} 
                className="save-btn"
              >
                <Save size={16} />
                Save & Preview
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!creditsLoaded) {
    return (
      <>
        <FloatingProfile />
        <div className="builder-container">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <Loader2 size={48} className="spin" style={{ color: '#3b82f6' }} />
            <p style={{ color: '#6b7280', fontSize: '16px' }}>Loading your workspace...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <FloatingProfile />
      <CodeEditorModal />
      
      <div className="builder-container">
        <header className="builder-header">
          <div className="header-left">
            <button onClick={() => navigate('/')} className="home-btn">
              <Home size={20} />
            </button>
            <div className="header-title">
              <h1>Extension Builder</h1>
              <span className="header-subtitle">AI-Powered Development</span>
            </div>
          </div>
          <div className="header-actions">
            {user && credits && (
              <div className="credits-container-header">
                <div className="credits-card-header">
                  <div className={`credits-badge ${credits.plan}`}>
                    <Zap className="credits-icon-badge" size={16} />
                    <span className="plan-name">{credits.plan.toUpperCase()}</span>
                  </div>
                  <div className="credits-stats">
                    <div className="credits-number">
                      <span className="current">{credits.credits}</span>
                      <span className="separator">/</span>
                      <span className="max">{credits.maxCredits}</span>
                    </div>
                    <span className="credits-label">prompts left</span>
                    {credits.plan === 'free' && (
                      <span className="daily-limit-label">
                        {credits.dailyCreditsUsed || 0}/{credits.dailyLimit || 5} today
                      </span>
                    )}
                  </div>
                  {credits.plan === 'free' && daysUntilReset > 0 && (
                    <div className="reset-info">
                      <span className="reset-text">Resets in {daysUntilReset} days</span>
                    </div>
                  )}
                  {credits.plan === 'free' && (
                    <button 
                      onClick={() => navigate('/#pricing')}
                      className="upgrade-btn-compact"
                    >
                      <TrendingUp size={14} />
                      <span className="upgrade-text">Upgrade</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {validFiles.length > 0 && (
              <>
                <div className="view-mode-switcher">
                  <button
                    onClick={() => setViewMode('code')}
                    className={`view-btn ${viewMode === 'code' ? 'active' : ''}`}
                    title="Code Only"
                  >
                    <Code2 size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode('split')}
                    className={`view-btn ${viewMode === 'split' ? 'active' : ''}`}
                    title="Split View"
                  >
                    <Split size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode('preview')}
                    className={`view-btn ${viewMode === 'preview' ? 'active' : ''}`}
                    title="Preview Only"
                  >
                    <Eye size={18} />
                  </button>
                </div>
                <button onClick={handleDownload} className="action-btn primary">
                  <Download size={18} />
                  <span className="download-text">Download</span>
                </button>
              </>
            )}
          </div>
        </header>

        {showLowCreditsAlert && credits && credits.credits <= 3 && credits.plan === 'free' && (
          <div className="low-credits-alert">
            <AlertTriangle size={20} className="alert-icon" />
            <div className="alert-content">
              <strong>Running low on prompts!</strong>
              <p>You have only {credits.credits} prompt{credits.credits !== 1 ? 's' : ''} left. {daysUntilReset > 0 && `Resets in ${daysUntilReset} days.`}</p>
            </div>
            <button onClick={() => navigate('/#pricing')} className="alert-upgrade-btn">
              Upgrade Now
            </button>
            <button onClick={() => setShowLowCreditsAlert(false)} className="alert-close-btn">
              ✕
            </button>
          </div>
        )}

        {credits && credits.plan === 'free' && credits.dailyCreditsUsed && credits.dailyCreditsUsed >= (credits.dailyLimit || 5) && (
          <div className="daily-limit-alert">
            <AlertTriangle size={20} className="alert-icon" />
            <div className="alert-content">
              <strong>Daily Limit Reached!</strong>
              <p>You've used all {credits.dailyLimit || 5} prompts today. Come back tomorrow or upgrade to Pro!</p>
            </div>
            <button onClick={() => navigate('/#pricing')} className="alert-upgrade-btn">
              Upgrade to Pro
            </button>
          </div>
        )}

        <div className="builder-layout">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="sidebar-toggle-btn"
              title="Open Sidebar"
            >
              <ChevronRight size={20} />
            </button>
          )}

          {sidebarOpen && (
            <>
              {window.innerWidth < 768 && (
                <div 
                  className="sidebar-overlay"
                  onClick={() => setSidebarOpen(false)}
                />
              )}

              <aside 
                ref={sidebarRef}
                className={`builder-sidebar ${sidebarMinimized ? 'minimized' : ''} ${isResizing ? 'resizing' : ''}`}
                style={{ width: sidebarMinimized ? '60px' : `${sidebarWidth}px` }}
              >
                {!sidebarMinimized && (
                  <div
                    className="resize-handle"
                    onMouseDown={handleMouseDown}
                  >
                    <div className="resize-indicator" />
                  </div>
                )}

                <div className="sidebar-header-actions">
                  <button
                    onClick={() => setSidebarMinimized(!sidebarMinimized)}
                    className="sidebar-action-btn"
                    title={sidebarMinimized ? "Expand" : "Minimize"}
                  >
                    {sidebarMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                  </button>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="sidebar-action-btn close"
                    title="Close Sidebar"
                  >
                    <X size={16} />
                  </button>
                </div>

                {!sidebarMinimized && (
                  <>
                    <div className="chat-section">
                      <div className="chat-header">
                        <Sparkles size={18} />
                        <span>AI Assistant</span>
                      </div>
                      
                      <div className="chat-messages">
                        {chatMessages.length === 0 && (
                          <div className="chat-empty">
                            <Sparkles size={48} className="empty-icon" />
                            <p>Start a conversation</p>
                            <span className="empty-hint">Describe your extension idea</span>
                          </div>
                        )}

                        {chatMessages.map((msg, idx) => (
                          <div key={idx} className={`chat-message ${msg.role}`}>
                            <div className="message-icon">
                              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                            </div>
                            <div className="message-content">
                              <div className="message-role">
                                {msg.role === 'user' ? 'You' : 'AI Assistant'}
                              </div>
                              <div className="message-text">
                                {msg.content}
                                {msg.isStreaming && <span className="cursor-blink">▋</span>}
                              </div>
                              <div className="message-time">
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        <div ref={chatEndRef} />
                      </div>
                    </div>

                    <div className="files-section">
                      <div className="sidebar-header">
                        <Code2 size={18} />
                        <span>Files</span>
                        {validFiles.length > 0 && (
                          <span className="file-count">{validFiles.length}</span>
                        )}
                      </div>
                      
                      <div className="file-tree">
                        {validFiles.length === 0 && !isGenerating && (
                          <div className="empty-files">
                            <FileCode size={32} className="empty-icon" />
                            <p>No files yet</p>
                          </div>
                        )}

                        {validFiles.map((file, index) => (
                          <div
                            key={`${file.name}-${index}`}
                            className={`file-item ${selectedFile?.name === file.name ? 'active' : ''}`}
                            onClick={() => handleFileSelect(file)}
                          >
                            <FileCode size={14} />
                            <span className="file-name">{file.name}</span>
                            <span className="file-size">{(file.content.length / 1024).toFixed(1)}kb</span>
                          </div>
                        ))}

                        {isGenerating && (
                          <div className="generating-indicator">
                            <Loader2 className="spin" size={16} />
                            <span>Generating...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </aside>
            </>
          )}

          <main className="builder-main">
            <div className="content-area">
              {viewMode !== 'preview' && (
                <div className={`editor-panel ${viewMode === 'split' ? 'split' : 'full'}`}>
                  {selectedFile ? (
                    <div className="editor-section">
                      <div className="editor-toolbar">
                        <div className="toolbar-left">
                          <FileCode size={16} />
                          <span className="current-file">{selectedFile.name}</span>
                          <span className="file-lang">{selectedFile.language}</span>
                          {credits?.plan === 'free' && (
                            <span className="read-only-badge">
                              <Lock size={12} />
                              Read-Only
                            </span>
                          )}
                          {credits?.plan === 'pro' && (
                            <span className="pro-edit-badge">
                              <Edit3 size={12} />
                              Editable
                            </span>
                          )}
                        </div>
                        <div className="toolbar-actions">
                          {credits?.plan === 'pro' && (
                            <button 
                              onClick={() => handleOpenCodeEditor(selectedFile)} 
                              className="edit-code-btn"
                              title="Edit in Advanced Editor"
                            >
                              <Edit3 size={16} />
                              <span>Advanced Edit</span>
                            </button>
                          )}
                          <button onClick={handleCopy} className="copy-btn">
                            {copied ? <Check size={16} /> : <Copy size={16} />}
                            {copied ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                      </div>

                      <Editor
                        height="100%"
                        language={selectedFile.language}
                        value={selectedFile.content}
                        theme="vs-dark"
                        options={{
                          minimap: { enabled: viewMode === 'code' },
                          fontSize: 14,
                          lineNumbers: 'on',
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                          tabSize: 2,
                          wordWrap: 'on',
                          readOnly: credits?.plan === 'free',
                          formatOnPaste: true,
                          formatOnType: true
                        }}
                        onChange={handleCodeChange}
                      />
                    </div>
                  ) : (
                    <div className="empty-state">
                      <Sparkles size={64} className="empty-icon" />
                      <h2>Create Amazing Extensions</h2>
                      <p>AI-powered Browser extension builder</p>
                    </div>
                  )}
                </div>
              )}

              {viewMode !== 'code' && validFiles.length > 0 && (
                <div className={`preview-panel ${viewMode === 'split' ? 'split' : 'full'}`}>
                  <CodePreview files={validFiles} />
                </div>
              )}
            </div>

            <div className="chat-input-wrapper">
              <form onSubmit={(e) => { e.preventDefault(); handleGenerate(); }} className="chat-form">
                <input
                  ref={inputRef}
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={validFiles.length > 0 ? "Ask to update, explain, or add features..." : "Describe your Chrome extension..."}
                  disabled={isGenerating || (credits?.credits === 0)}
                  className="chat-input"
                />
                <button
                  type="submit"
                  disabled={isGenerating || !prompt.trim() || (credits?.credits === 0)}
                  className="send-btn"
                  title={credits?.credits === 0 ? "No prompts left" : "Generate"}
                >
                  {isGenerating ? (
                    <Loader2 className="spin" size={20} />
                  ) : (
                    <Send size={20} />
                  )}
                </button>
              </form>
              {credits && credits.credits === 0 && (
                <div className="no-credits-message">
                  ⚠️ No prompts left. <button onClick={() => navigate('/#pricing')} className="upgrade-link">Upgrade</button> or wait for reset.
                </div>
              )}
            </div>
          </main>
        </div>

        <style>{`
          /* COMPLETE RESPONSIVE STYLES */
          
          .credits-container-header {
            margin-right: 1rem;
          }

          .credits-card-header {
            display: flex;
            align-items: center;
            gap: 12px;
            background: white;
            padding: 8px 16px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            border: 1px solid #e5e7eb;
          }

          .credits-badge {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 4px 10px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
          }

          .credits-badge.free {
            background: linear-gradient(135deg, #6b7280, #4b5563);
            color: white;
          }

          .credits-badge.pro {
            background: linear-gradient(135deg, #8b5cf6, #6366f1);
            color: white;
          }

          .credits-icon-badge {
            animation: pulse 2s infinite;
          }

          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }

          .credits-stats {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .credits-number {
            display: flex;
            align-items: baseline;
            gap: 4px;
            font-weight: 700;
          }

          .credits-number .current {
            font-size: 20px;
            color: #111827;
          }

          .credits-number .separator {
            font-size: 14px;
            color: #9ca3af;
          }

          .credits-number .max {
            font-size: 14px;
            color: #6b7280;
          }

          .credits-label {
            font-size: 11px;
            color: #6b7280;
          }

          .daily-limit-label {
            font-size: 10px;
            color: #f59e0b;
            font-weight: 700;
            margin-top: 2px;
          }

          .reset-info {
            font-size: 10px;
            color: #6b7280;
          }

          .upgrade-btn-compact {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 6px 12px;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
          }

          .upgrade-btn-compact:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
          }

          /* Read-Only Badge */
          .read-only-badge {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 4px 8px;
            background: #fbbf24;
            color: #000;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.5px;
          }

          /* Pro Edit Badge */
          .pro-edit-badge {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 4px 8px;
            background: linear-gradient(135deg, #8b5cf6, #6366f1);
            color: white;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.5px;
            animation: shimmer 2s infinite;
          }

          @keyframes shimmer {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
          }

          /* Toolbar Actions */
          .toolbar-actions {
            display: flex;
            gap: 8px;
            align-items: center;
          }

          .edit-code-btn {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px 14px;
            background: linear-gradient(135deg, #8b5cf6, #6366f1);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
          }

          .edit-code-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
          }

          /* Code Editor Modal */
          .code-editor-modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.75);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            padding: 20px;
          }

          .code-editor-modal {
            width: 100%;
            max-width: 1200px;
            height: 90vh;
            background: #1e1e1e;
            border-radius: 16px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
          }

          .code-editor-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 20px 24px;
            background: #252526;
            border-bottom: 1px solid #3e3e42;
          }

          .header-left {
            display: flex;
            align-items: center;
            gap: 12px;
            color: white;
          }

          .header-left h3 {
            margin: 0;
            font-size: 18px;
            font-weight: 700;
            color: white;
          }

          .header-left p {
            margin: 0;
            font-size: 13px;
            color: #8b8b8b;
          }

          .close-modal-btn {
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #3e3e42;
            border: none;
            border-radius: 8px;
            color: white;
            cursor: pointer;
            transition: all 0.2s;
          }

          .close-modal-btn:hover {
            background: #505050;
          }

          .code-editor-content {
            flex: 1;
            overflow: hidden;
          }

          .code-editor-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 24px;
            background: #252526;
            border-top: 1px solid #3e3e42;
          }

          .footer-info {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .pro-badge-small {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 4px 10px;
            background: linear-gradient(135deg, #fbbf24, #f59e0b);
            color: #000;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.5px;
          }

          .file-info {
            font-size: 12px;
            color: #8b8b8b;
            font-weight: 600;
          }

          .footer-actions {
            display: flex;
            gap: 10px;
          }

          .cancel-btn,
          .save-btn {
            padding: 10px 20px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          }

          .cancel-btn {
            background: #3e3e42;
            color: white;
          }

          .cancel-btn:hover {
            background: #505050;
          }

          .save-btn {
            display: flex;
            align-items: center;
            gap: 8px;
            background: linear-gradient(135deg, #8b5cf6, #6366f1);
            color: white;
          }

          .save-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
          }

          /* Daily Limit Alert */
          .daily-limit-alert {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 20px;
            background: linear-gradient(135deg, #fef3c7, #fde68a);
            border-bottom: 2px solid #f59e0b;
          }

          .low-credits-alert {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 20px;
            background: linear-gradient(135deg, #fef3c7, #fde68a);
            border-bottom: 2px solid #f59e0b;
          }

          .alert-icon {
            color: #f59e0b;
            flex-shrink: 0;
          }

          .alert-content {
            flex: 1;
          }

          .alert-content strong {
            display: block;
            font-size: 14px;
            color: #92400e;
            margin-bottom: 2px;
          }

          .alert-content p {
            font-size: 12px;
            color: #78350f;
            margin: 0;
          }

          .alert-upgrade-btn {
            padding: 6px 16px;
            background: #f59e0b;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            white-space: nowrap;
          }

          .alert-upgrade-btn:hover {
            background: #d97706;
          }

          .alert-close-btn {
            padding: 4px 8px;
            background: transparent;
            border: none;
            color: #92400e;
            cursor: pointer;
            font-size: 18px;
          }

          .no-credits-message {
            text-align: center;
            padding: 8px;
            font-size: 13px;
            color: #f59e0b;
            background: #fef3c7;
            border-radius: 8px;
            margin-top: 8px;
          }

          .upgrade-link {
            background: none;
            border: none;
            color: #2563eb;
            text-decoration: underline;
            cursor: pointer;
            font-weight: 600;
          }

          .spin {
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          .builder-layout {
            padding-bottom: 100px;
          }

          /* RESPONSIVE STYLES */
          @media (max-width: 1024px) {
            .credits-card-header {
              padding: 6px 12px;
              gap: 10px;
            }

            .credits-number .current {
              font-size: 18px;
            }
          }

          @media (max-width: 768px) {
            .credits-container-header {
              margin-right: 0.5rem;
            }

            .credits-card-header {
              padding: 6px 10px;
              gap: 8px;
            }

            .credits-badge {
              padding: 3px 8px;
              font-size: 10px;
            }

            .credits-number .current {
              font-size: 16px;
            }

            .credits-number .separator,
            .credits-number .max {
              font-size: 12px;
            }

            .credits-label,
            .daily-limit-label {
              font-size: 10px;
            }

            .reset-info {
              display: none;
            }

            .upgrade-btn-compact {
              padding: 5px 10px;
              font-size: 11px;
            }

            .upgrade-text {
              display: none;
            }

            .builder-layout {
              padding-bottom: 80px;
            }

            .header-actions {
              flex-wrap: wrap;
              gap: 8px;
            }

            .view-mode-switcher {
              order: 3;
            }

            .action-btn.primary {
              padding: 8px 12px;
            }

            .download-text {
              display: none;
            }

            .edit-code-btn span {
              display: none;
            }

            .code-editor-modal {
              height: 95vh;
              border-radius: 12px;
            }

            .code-editor-header {
              padding: 16px;
            }

            .header-left h3 {
              font-size: 16px;
            }

            .code-editor-footer {
              padding: 12px 16px;
              flex-direction: column;
              gap: 12px;
            }

            .footer-actions {
              width: 100%;
            }

            .cancel-btn,
            .save-btn {
              flex: 1;
            }

            .alert-content strong {
              font-size: 13px;
            }

            .alert-content p {
              font-size: 11px;
            }

            .alert-upgrade-btn {
              padding: 5px 12px;
              font-size: 12px;
            }
          }

          @media (max-width: 480px) {
            .credits-card-header {
              flex-wrap: wrap;
            }

            .daily-limit-alert,
            .low-credits-alert {
              flex-wrap: wrap;
              padding: 10px 12px;
            }

            .alert-icon {
              width: 100%;
              text-align: center;
              margin-bottom: 8px;
            }

            .alert-upgrade-btn {
              width: 100%;
            }
          }
        `}</style>
      </div>
    </>
  );
}
