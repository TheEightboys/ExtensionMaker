// src/pages/Builder.tsx - COMPLETE FIXED VERSION

import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Editor from '@monaco-editor/react';
import {
  Send, Download, FileCode, Loader2, Copy, Check,
  Home, Eye, Code2, Sparkles, Split, User, Bot,
  ChevronLeft, ChevronRight, X, Minimize2, Maximize2,
  Zap, TrendingUp, AlertTriangle
} from 'lucide-react';

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

  // Credits state - FIXED
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [showLowCreditsAlert, setShowLowCreditsAlert] = useState(false);
  const [creditsLoaded, setCreditsLoaded] = useState(false);
  const [daysUntilReset, setDaysUntilReset] = useState(0);

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(340);
  const [isResizing, setIsResizing] = useState(false);

  // Prevent double execution
  const [hasProcessedInitialPrompt, setHasProcessedInitialPrompt] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, streamingText]);

  // Load user credits - FIXED (only one useEffect)
  useEffect(() => {
    const loadCredits = async () => {
      if (!user) return;
      
      try {
        console.log('🔄 Loading credits for user:', user.uid);
        const userCredits = await getUserCredits(user.uid);
        
        if (userCredits) {
          console.log('✅ Credits loaded:', userCredits);
          setCredits(userCredits);
          setCreditsLoaded(true);
          
          // Calculate days until reset
          if (userCredits.nextResetDate) {
            const days = getDaysUntilReset(userCredits.nextResetDate);
            setDaysUntilReset(days);
          }
          
          // Show alert if low on credits
          if (userCredits.credits <= 3 && userCredits.plan === 'free') {
            setShowLowCreditsAlert(true);
          }
        } else {
          console.warn('⚠️ No credits data returned');
          // Set default free plan credits
          setCredits({
            plan: 'free',
            credits: 30,
            maxCredits: 30,
            billingPeriod: 'monthly',
            lastResetDate: new Date().toISOString(),
            nextResetDate: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          setCreditsLoaded(true);
        }
      } catch (error) {
        console.error('❌ Failed to load credits:', error);
        // Set fallback credits
        setCredits({
          plan: 'free',
          credits: 30,
          maxCredits: 30,
          billingPeriod: 'monthly',
          lastResetDate: new Date().toISOString(),
          nextResetDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        setCreditsLoaded(true);
      }
    };

    loadCredits();
  }, [user]);

  // Handle initial prompt - FIXED
  useEffect(() => {
    if (!user) {
      navigate('/signup');
      return;
    }
    
    // Only process initial prompt once and after credits are loaded
    if (initialPrompt && !hasProcessedInitialPrompt && creditsLoaded) {
      console.log('🚀 Processing initial prompt:', initialPrompt);
      setHasProcessedInitialPrompt(true);
      setPrompt(initialPrompt);
      setTimeout(() => handleGenerate(initialPrompt), 500);
    }
  }, [user, initialPrompt, hasProcessedInitialPrompt, creditsLoaded]);

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
    if (!promptText.trim()) {
      console.warn('⚠️ Empty prompt');
      return;
    }

    console.log('🚀 Starting generation with prompt:', promptText);

    // Check credits BEFORE generation
    if (user && creditsLoaded) {
      try {
        const hasCredits = await hasCreditsAvailable(user.uid);
        console.log('💳 Has credits:', hasCredits);
        
        if (!hasCredits) {
          alert('⚠️ You have run out of prompts! Please upgrade your plan or wait for monthly reset.');
          navigate('/#pricing');
          return;
        }
      } catch (error) {
        console.error('❌ Credit check failed:', error);
      }
    }

    // Prevent multiple simultaneous generations
    if (isGenerating) {
      console.log('⚠️ Generation already in progress');
      return;
    }

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
          
          setChatMessages(prev => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            if (updated[lastIndex].isStreaming) {
              updated[lastIndex].content = `Generating code...\n\n${streamedContent.substring(0, 200)}...`;
            }
            return updated;
          });
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

          setChatMessages(prev => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            if (updated[lastIndex].isStreaming) {
              updated[lastIndex].content = `✅ Generated: ${correctedFile.name}\n${updated[lastIndex].content || ''}`;
            }
            return updated;
          });
        }
      );

      console.log('✅ Generation complete, files:', result.files.length);

      if (result.files.length > 0) {
        const correctedFiles = result.files.map((file: any) => ensureCorrectLanguage(file));
        setFiles(correctedFiles);
        
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

      // Deduct credit AFTER successful generation
      if (user) {
        try {
          console.log('💳 Deducting credit...');
          const creditUsed = await useCredit(user.uid);
          
          if (creditUsed) {
            console.log('✅ Credit deducted successfully');
            // Reload credits to update UI
            const updatedCredits = await getUserCredits(user.uid);
            if (updatedCredits) {
              setCredits(updatedCredits);
              
              // Update days until reset
              if (updatedCredits.nextResetDate) {
                const days = getDaysUntilReset(updatedCredits.nextResetDate);
                setDaysUntilReset(days);
              }
            }
          } else {
            console.error('❌ Credit deduction failed');
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
      console.log('✅ Generation finished');
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

## Testing
- Click the extension icon in the toolbar
- All features should work immediately
- Check the console (F12) for any errors

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

  // Show loading state while credits are being fetched
  if (!creditsLoaded) {
    return (
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
    );
  }

  return (
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
          {/* Credits Display - FIXED */}
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
                    Upgrade
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
                Download
              </button>
            </>
          )}
        </div>
      </header>

      {/* Low Credits Alert */}
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
                      </div>
                      <button onClick={handleCopy} className="copy-btn">
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
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
                        readOnly: false,
                        formatOnPaste: true,
                        formatOnType: true
                      }}
                      onChange={handleCodeChange}
                    />
                  </div>
                ) : (
                  <div className="empty-state">
                    <Sparkles size={64} className="empty-icon" />
                    <h2>Create Amazing Extension Designs</h2>
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
                disabled={isGenerating || (credits && credits.credits === 0)}
                className="chat-input"
              />
              <button
                type="submit"
                disabled={isGenerating || !prompt.trim() || (credits && credits.credits === 0)}
                className="send-btn"
                title={credits && credits.credits === 0 ? "No prompts left" : "Generate"}
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

        .credits-badge.basic {
          background: linear-gradient(135deg, #ec4899, #be185d);
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

        @media (max-width: 768px) {
          .credits-card-header {
            padding: 6px 12px;
            gap: 8px;
          }

          .credits-number .current {
            font-size: 16px;
          }

          .reset-info {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
