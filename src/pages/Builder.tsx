import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Editor from '@monaco-editor/react';
import {
  Send, Download, FileCode, Loader2, Copy, Check,
  Home, Eye, Code2, Sparkles, Split, User, Bot,
  ChevronLeft, ChevronRight, X, Minimize2, Maximize2,
  Zap, CreditCard, AlertTriangle
} from 'lucide-react';
import { generateExtensionCode, GeneratedFile, Message, validateExtension } from './../../src/methods/services/aiService';
import { getUserCredits, hasCreditsAvailable, useCredit } from './../../src/methods/services/CreditService';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import CodePreview from '../components/CodePreview';
import { initializeUserCredits } from './../../src/methods/services/CreditService';
import { signInWithPopup } from 'firebase/auth';

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

  // Credits state
  const [credits, setCredits] = useState<any>(null);
  const [showLowCreditsAlert, setShowLowCreditsAlert] = useState(false);
  const [creditsLoaded, setCreditsLoaded] = useState(false);

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(340);
  const [isResizing, setIsResizing] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, streamingText]);

  // Optimized credit loading with timeout
  const loadUserCredits = async () => {
    if (!user) return;
    
    const loadWithTimeout = Promise.race([
      getUserCredits(user.uid),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000))
    ]);

    try {
      const userCredits = await loadWithTimeout;
      if (userCredits) {
        setCredits(userCredits);
        setCreditsLoaded(true);
        
        if (userCredits.creditsRemaining <= 3 && userCredits.plan === 'free') {
          setShowLowCreditsAlert(true);
        }
      } else {
        // Timeout - set default
        setCredits({
          plan: 'free',
          creditsRemaining: 10,
          totalCredits: 10,
          billingPeriod: 'monthly'
        });
        setCreditsLoaded(true);
      }
    } catch (error) {
      console.error('Failed to load credits:', error);
      // Set default on error
      setCredits({
        plan: 'free',
        creditsRemaining: 10,
        totalCredits: 10,
        billingPeriod: 'monthly'
      });
      setCreditsLoaded(true);
    }
  };

  // Load credits on mount (non-blocking)
  useEffect(() => {
    if (user) {
      loadUserCredits();
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigate('/signup');
      return;
    }
    if (initialPrompt) {
      setPrompt(initialPrompt);
      setTimeout(() => handleGenerate(initialPrompt), 100);
    }
  }, []);

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

  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (!isResizing) return;
      
      const touch = e.touches[0];
      const newWidth = touch.clientX;
      
      if (newWidth >= 280 && newWidth <= 500) {
        setSidebarWidth(newWidth);
      }
    };

    const handleTouchEnd = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isResizing]);
const handleGoogleSignIn = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    
    // Initialize credits for user
    await initializeUserCredits(result.user.uid);
    
    navigate('/builder');
  } catch (error) {
    console.error('Sign in error:', error);
  }
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

  // OPTIMIZED: Fast credit check with 1.5 second timeout
  if (user && creditsLoaded) {
    const checkCreditsWithTimeout = Promise.race([
      hasCreditsAvailable(user.uid),
      new Promise<boolean>((resolve) => setTimeout(() => resolve(true), 1500))
    ]);

    try {
      const hasCredits = await checkCreditsWithTimeout;
      if (hasCredits === false) {
        alert('⚠️ You have run out of prompts! Please upgrade your plan to continue.');
        navigate('/pricing');
        return;
      }
    } catch (error) {
      console.error('Credit check failed, proceeding anyway:', error);
    }
  }

  // Start generation immediately
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

    if (result.files.length > 0) {
      const correctedFiles = result.files.map(file => ensureCorrectLanguage(file));
      
      setFiles(correctedFiles);
      
      const validation = validateExtension(correctedFiles);
      if (!validation.isValid) {
        console.warn('⚠️ Missing files:', validation.missingFiles);
      }
      
      if (!selectedFile || !correctedFiles.find(f => f.name === selectedFile.name)) {
        setSelectedFile(correctedFiles[0]);
      } else {
        const updatedSelected = correctedFiles.find(f => f.name === selectedFile.name);
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
        content: finalMessage + `\n\n📁 Generated ${result.files.length} files:\n${result.files.map(f => `• ${f.name}`).join('\n')}`,
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
      console.log('💳 Deducting credit for user:', user.uid);
      try {
        const creditUsed = await useCredit(user.uid);
        if (creditUsed) {
          console.log('✅ Credit deducted successfully');
          // Force reload credits and update UI
          const updatedCredits = await getUserCredits(user.uid);
          if (updatedCredits) {
            setCredits(updatedCredits);
            console.log('✅ Credits updated in UI:', updatedCredits.creditsRemaining);
          }
        } else {
          console.error('⚠️ Failed to deduct credit - user may be out of credits');
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

## Testing
- Click the extension icon in the toolbar
- All features should work immediately
- Check the console (F12) for any errors

Generated on: ${new Date().toLocaleString()}
`;
      
      zip.file('README.md', readme);

      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, 'chrome-extension.zip');
      
      console.log('✅ Extension downloaded');
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
          {/* Credits Display */}
          {user && credits && (
            <div className={`credits-display-header ${credits.plan === 'free' && credits.creditsRemaining <= 3 ? 'credits-low' : ''}`}>
              <div className="credits-badge-header">
                <Zap size={18} className="credits-icon-header" />
                <div className="credits-info-header">
                  <span className="credits-count-header">
                    <strong>{credits.creditsRemaining}</strong> / {credits.totalCredits}
                  </span>
                  <span className="credits-label-header">Prompts</span>
                </div>
              </div>
              {credits.plan === 'free' && (
                <button 
                  onClick={() => navigate('/pricing')}
                  className="credits-upgrade-btn-header"
                >
                  <CreditCard size={14} />
                  Upgrade
                </button>
              )}
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
      {showLowCreditsAlert && credits && credits.creditsRemaining <= 3 && credits.plan === 'free' && (
        <div className="low-credits-alert">
          <AlertTriangle size={20} className="alert-icon" />
          <div className="alert-content">
            <strong>Running low on prompts!</strong>
            <p>You have only {credits.creditsRemaining} prompt{credits.creditsRemaining !== 1 ? 's' : ''} left.</p>
          </div>
          <button onClick={() => navigate('/pricing')} className="alert-upgrade-btn">
            View Plans
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
                  onTouchStart={() => setIsResizing(true)}
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
                disabled={isGenerating}
                className="chat-input"
              />
              <button
                type="submit"
                disabled={isGenerating || !prompt.trim()}
                className="send-btn"
                title="Generate"
              >
                {isGenerating ? (
                  <Loader2 className="spin" size={20} />
                ) : (
                  <Send size={20} />
                )}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
