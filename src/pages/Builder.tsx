// src/pages/Builder.tsx - PROFESSIONAL VS CODE STYLE IDE WITH AGENTIC FEATURES
import { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Editor from '@monaco-editor/react';
import gsap from 'gsap';
import {
  Send, Download, FileCode, Loader2, Copy, Check,
  Home, Eye, Code2, Sparkles, Split, User, Bot,
  X, Zap, TrendingUp, AlertTriangle, Lock, Edit3, Save, Crown,
  FileJson, FileText, PanelLeftClose, PanelLeft,
  Settings, ChevronRight, ChevronDown, File,
  GitBranch, Bell, Search, Command, Terminal as TerminalIcon
} from 'lucide-react';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/FirebaseClient';
import { generateExtensionCode, GeneratedFile, Message, TerminalCommand, StreamCallbacks } from '../methods/services/aiService';
import { getUserCredits, hasCreditsAvailable, useCredit, UserCredits, getPromptsRemaining } from '../methods/services/CreditService';
import { CREDITS_PER_PROMPT } from '../types/plans';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import CodePreview from '../components/CodePreview';
import Terminal from '../components/Terminal';
import AgentStatus from '../components/AgentStatus';
import BuyCreditsModal from '../components/BuyCreditsModal';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

// File icon component
const FileIcon = ({ filename }: { filename: string }) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  const iconMap: Record<string, { icon: typeof FileJson; color: string }> = {
    'json': { icon: FileJson, color: '#cbcb41' },
    'html': { icon: FileCode, color: '#e34c26' },
    'css': { icon: FileCode, color: '#264de4' },
    'js': { icon: FileCode, color: '#f7df1e' },
    'ts': { icon: FileCode, color: '#3178c6' },
  };
  const config = iconMap[ext || ''] || { icon: FileText, color: '#6e7681' };
  const Icon = config.icon;
  return <Icon className="w-4 h-4" style={{ color: config.color }} />;
};

// Animated file item in explorer with delete option
const AnimatedFileItem = ({
  file,
  isSelected,
  isGenerating,
  onClick,
  onDelete
}: {
  file: GeneratedFile;
  isSelected: boolean;
  isGenerating: boolean;
  onClick: () => void;
  onDelete?: () => void;
}) => {
  const itemRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (itemRef.current && isGenerating) {
      gsap.fromTo(itemRef.current,
        { opacity: 0, x: -20, scale: 0.9 },
        { opacity: 1, x: 0, scale: 1, duration: 0.4, ease: 'power2.out' }
      );
    }
  }, [isGenerating]);

  return (
    <div className="file-tree-item-wrapper">
      <button
        ref={itemRef}
        onClick={onClick}
        className={`file-tree-item ${isSelected ? 'active' : ''} ${isGenerating ? 'generating' : ''}`}
      >
        <FileIcon filename={file.name} />
        <span className="file-tree-name">{file.name}</span>
        {isGenerating && <span className="file-generating-indicator">●</span>}
      </button>
      {onDelete && (
        <button
          className="file-delete-btn"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          title="Delete file"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
};


export default function Builder() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const initialPrompt = searchParams.get('prompt') || '';

  // Core states
  const [prompt, setPrompt] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [files, setFiles] = useState<GeneratedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<GeneratedFile | null>(null);
  const [openTabs, setOpenTabs] = useState<GeneratedFile[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'code' | 'split' | 'preview'>('split');
  const [streamingText, setStreamingText] = useState('');

  // Agentic UI states
  const [terminalCommands, setTerminalCommands] = useState<TerminalCommand[]>([]);
  const [terminalMinimized, setTerminalMinimized] = useState(false);
  const [agentStatus, setAgentStatus] = useState<'idle' | 'thinking' | 'writing' | 'complete' | 'error'>('idle');
  const [currentGeneratingFile, setCurrentGeneratingFile] = useState<string>('');
  const [filesCompleted, setFilesCompleted] = useState(0);
  const [totalFilesToGenerate, setTotalFilesToGenerate] = useState(0);
  const [generationStartTime, setGenerationStartTime] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [, setStreamingFileContent] = useState('');
  const [, setIsStreaming] = useState(false);

  // UI states
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(true);
  const [explorerExpanded, setExplorerExpanded] = useState(true);
  const [activePanel, setActivePanel] = useState<'explorer' | 'search' | 'git' | 'terminal'>('explorer');
  const [searchQuery, setSearchQuery] = useState('');
  const [, setShowSettings] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  // Pro editing states
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [editingFile,] = useState<GeneratedFile | null>(null);
  const [editedCode, setEditedCode] = useState('');

  // Project states
  const [projectName, setProjectName] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');

  // Credits state
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [creditsLoaded, setCreditsLoaded] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [hasProcessedInitialPrompt, setHasProcessedInitialPrompt] = useState(false);

  // Refs
  const _inputRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, streamingText]);

  // Elapsed time counter
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating && generationStartTime > 0) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - generationStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isGenerating, generationStartTime]);

  // GSAP entrance animation
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.ide-activity-bar', { x: -20, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, ease: 'power2.out' });
      gsap.fromTo('.ide-sidebar', { x: -30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, delay: 0.1, ease: 'power2.out' });
      gsap.fromTo('.ide-editor-area', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, delay: 0.2, ease: 'power2.out' });
    }, workspaceRef);
    return () => ctx.revert();
  }, []);

  // Load credits
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
            lastDailyResetDate: data.lastDailyResetDate || new Date().toISOString().split('T')[0]
          };
          setCredits(userCredits);
        } else {
          setCredits({
            plan: 'free', credits: 30, maxCredits: 30, billingPeriod: 'monthly',
            lastResetDate: new Date().toISOString(), nextResetDate: getNextResetDate(),
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
            dailyCreditsUsed: 0, dailyLimit: 5, lastDailyResetDate: new Date().toISOString().split('T')[0]
          });
        }
      } catch (err) {
        console.error('Error processing credits:', err);
      } finally {
        setCreditsLoaded(true);
      }
    });
    return () => unsubscribe();
  }, [user]);

  // Handle initial prompt
  useEffect(() => {
    if (!user) { navigate('/signup'); return; }
    if (initialPrompt && !hasProcessedInitialPrompt && creditsLoaded) {
      setHasProcessedInitialPrompt(true);
      setPrompt(initialPrompt);
      setTimeout(() => handleGenerate(initialPrompt), 500);
    }
  }, [user, initialPrompt, hasProcessedInitialPrompt, creditsLoaded]);

  // Load project
  useEffect(() => {
    const loadProject = async () => {
      const projectParam = searchParams.get('project');
      if (!projectParam || !user) return;
      try {
        const projectRef = doc(db, 'users', user.uid, 'projects', projectParam);
        const projectSnap = await getDoc(projectRef);
        if (projectSnap.exists()) {
          const project = projectSnap.data();
          setProjectName(project.name);
          setProjectId(project.id);
          setFiles(project.files || []);
          if (project.files?.length > 0) {
            setSelectedFile(project.files[0]);
            setOpenTabs([project.files[0]]);
          }
        }
      } catch (err) {
        console.error('Error loading project:', err);
      }
    };
    loadProject();
  }, [searchParams, user]);

  // Auto-save
  useEffect(() => {
    if (files.length > 0 && projectName && user) {
      const saveTimer = setTimeout(() => saveProjectToFirestore(projectName, files), 2000);
      return () => clearTimeout(saveTimer);
    }
  }, [files, projectName, user]);

  const getNextResetDate = (): string => {
    const nextReset = new Date();
    nextReset.setDate(nextReset.getDate() + 30);
    return nextReset.toISOString();
  };

  const saveProjectToFirestore = async (name: string, projectFiles: GeneratedFile[]) => {
    if (!user || projectFiles.length === 0) return;
    try {
      const currentProjectId = projectId || Date.now().toString();
      const projectData: Record<string, unknown> = {
        id: currentProjectId,
        name,
        lastModified: new Date().toISOString(),
        files: projectFiles.map(f => ({ name: f.name, path: f.path, content: f.content, language: f.language })),
        userId: user.uid,
        firstPrompt: name,
      };
      // Only add createdAt for new projects
      if (!projectId) {
        projectData.createdAt = new Date().toISOString();
      }
      const projectRef = doc(db, 'users', user.uid, 'projects', currentProjectId);
      await setDoc(projectRef, projectData, { merge: true });
    } catch (err) {
      console.error('Error saving project:', err);
    }
  };

  const ensureCorrectLanguage = (file: GeneratedFile): GeneratedFile => {
    const filename = file.name.toLowerCase();
    let correctLanguage = 'plaintext';
    if (filename.endsWith('.json')) correctLanguage = 'json';
    else if (filename.endsWith('.html') || filename.endsWith('.htm')) correctLanguage = 'html';
    else if (filename.endsWith('.css')) correctLanguage = 'css';
    else if (filename.endsWith('.js') || filename.endsWith('.mjs')) correctLanguage = 'javascript';
    return { ...file, language: correctLanguage };
  };

  const addTerminalCommand = (command: TerminalCommand) => {
    setTerminalCommands(prev => [...prev, command]);
  };

  const clearTerminal = () => {
    setTerminalCommands([]);
  };

  const handleGenerate = async (customPrompt?: string) => {
    const promptText = customPrompt || prompt;
    if (!promptText.trim() || isGenerating) return;

    if (user && creditsLoaded) {
      try {
        const hasCredits = await hasCreditsAvailable(user.uid);
        if (!hasCredits) {
          // Show upgrade modal instead of alert
          setShowUpgradeModal(true);
          return;
        }
        // Check if free user has used their trial
        if (credits?.plan === 'free' && credits?.hasUsedFreeTrial) {
          setShowUpgradeModal(true);
          return;
        }
      } catch (err) {
        console.error('Credit check failed:', err);
      }
    }

    // Reset agentic UI state
    setIsGenerating(true);
    setAgentStatus('thinking');
    setStreamingText('');
    setPrompt('');
    setFilesCompleted(0);
    setTotalFilesToGenerate(0);
    setCurrentGeneratingFile('');
    setGenerationStartTime(Date.now());
    setElapsedTime(0);
    setStatusMessage('Analyzing request...');
    setIsStreaming(true);
    setStreamingFileContent('');

    // Add initial terminal command
    addTerminalCommand({
      type: 'command',
      message: `> Building extension: "${promptText.substring(0, 60)}${promptText.length > 60 ? '...' : ''}"`,
      timestamp: new Date()
    });

    const userMessage: ChatMessage = { role: 'user', content: promptText, timestamp: new Date() };
    setChatMessages(prev => [...prev, userMessage]);

    const assistantMessage: ChatMessage = { role: 'assistant', content: '', timestamp: new Date(), isStreaming: true };
    setChatMessages(prev => [...prev, assistantMessage]);

    const newHistory: Message[] = [...conversationHistory, { role: 'user', content: promptText }];
    setConversationHistory(newHistory);

    // Create streaming callbacks
    const streamCallbacks: StreamCallbacks = {
      onChunk: (chunk: string) => {
        setStreamingText(chunk);
        setStreamingFileContent(chunk);
      },
      onFileStart: (filename: string) => {
        setCurrentGeneratingFile(filename);
        setAgentStatus('writing');
        setStatusMessage(`Creating ${filename}...`);
      },
      onFileProgress: (filename: string, progress: number) => {
        setStatusMessage(`Writing ${filename}... ${Math.round(progress)}%`);
      },
      onFileComplete: (file: GeneratedFile) => {
        setFilesCompleted(prev => prev + 1);
        const correctedFile = ensureCorrectLanguage(file);

        // Add file with animation
        setFiles(prev => {
          const existing = prev.findIndex(f => f.name === correctedFile.name);
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = correctedFile;
            return updated;
          }
          return [...prev, correctedFile];
        });
      },
      onTerminalCommand: (command: TerminalCommand) => {
        addTerminalCommand(command);
      },
      onStatusChange: (status: string) => {
        setStatusMessage(status);
        if (status === 'Complete!') {
          setAgentStatus('complete');
        } else if (status === 'Error') {
          setAgentStatus('error');
        } else if (status.includes('Generating') || status.includes('Writing')) {
          setAgentStatus('writing');
        } else if (status.includes('Analyzing') || status.includes('Connecting')) {
          setAgentStatus('thinking');
        }
      }
    };

    try {
      const result = await generateExtensionCode(
        promptText,
        files.length > 0 ? files : [],
        newHistory,
        streamCallbacks.onChunk,
        streamCallbacks.onFileComplete,
        streamCallbacks
      );

      if (result.files.length > 0) {
        const correctedFiles = result.files.map(f => ensureCorrectLanguage(f));

        // MERGE files: update existing, add new - don't replace all
        setFiles(prev => {
          const merged = [...prev];
          correctedFiles.forEach(newFile => {
            const existingIndex = merged.findIndex(f => f.name === newFile.name);
            if (existingIndex >= 0) {
              // Update existing file
              merged[existingIndex] = newFile;
              console.log(`📝 Updated: ${newFile.name}`);
            } else {
              // Add new file
              merged.push(newFile);
              console.log(`➕ Added: ${newFile.name}`);
            }
          });
          return merged;
        });

        setTotalFilesToGenerate(correctedFiles.length);
        setFilesCompleted(correctedFiles.length);

        if (!projectName && promptText) {
          const newProjectName = promptText.length > 50 ? promptText.substring(0, 50) + '...' : promptText;
          setProjectName(newProjectName);
          if (!projectId) setProjectId(Date.now().toString());
          setTimeout(() => saveProjectToFirestore(newProjectName, correctedFiles), 1000);
        }

        // Auto-select first file and open tabs
        if (!selectedFile || !correctedFiles.find(f => f.name === selectedFile.name)) {
          setSelectedFile(correctedFiles[0]);
          setOpenTabs(tabs => {
            const newTabs = [...tabs];
            correctedFiles.forEach(f => {
              if (!newTabs.find(t => t.name === f.name)) {
                newTabs.push(f);
              }
            });
            return newTabs.slice(0, 6);
          });
        }
      }

      const finalMessage = result.explanation || result.response;
      setChatMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: finalMessage + `\n\n✅ Generated ${result.files.length} files`,
          timestamp: new Date(),
          isStreaming: false
        };
        return updated;
      });

      setConversationHistory([...newHistory, { role: 'assistant', content: finalMessage }]);
      setAgentStatus('complete');
      setStatusMessage('Build complete!');

      addTerminalCommand({
        type: 'success',
        message: `✓ Build successful! ${result.files.length} files generated`,
        timestamp: new Date()
      });

      if (user) {
        const creditUsed = await useCredit(user.uid);
        if (creditUsed) {
          const updatedCredits = await getUserCredits(user.uid);
          if (updatedCredits) setCredits(updatedCredits);
        }
      }
    } catch (err: any) {
      setAgentStatus('error');
      setStatusMessage('Build failed');

      addTerminalCommand({
        type: 'error',
        message: `✗ Error: ${err.message}`,
        timestamp: new Date()
      });

      setChatMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: `❌ ${err.message}`,
          timestamp: new Date(),
          isStreaming: false
        };
        return updated;
      });
    } finally {
      setIsGenerating(false);
      setIsStreaming(false);
      setStreamingText('');
      setStreamingFileContent('');
    }
  };

  const handleDownload = async () => {
    if (files.length === 0) return;
    try {
      const zip = new JSZip();
      files.forEach(file => zip.file(file.path, file.content));
      const readme = `# Chrome Extension\nGenerated by Extension Builder\n\n## Files\n${files.map(f => `- ${f.name}`).join('\n')}\n\n## Installation\n1. Open chrome://extensions/\n2. Enable Developer mode\n3. Click Load unpacked\n4. Select this folder`;
      zip.file('README.md', readme);
      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, `${projectName || 'extension'}.zip`);

      addTerminalCommand({
        type: 'success',
        message: `Downloaded ${files.length} files as ${projectName || 'extension'}.zip`,
        timestamp: new Date()
      });
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const handleCopy = () => {
    if (!selectedFile) return;
    navigator.clipboard.writeText(selectedFile.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleFileSelect = (file: GeneratedFile) => {
    const corrected = ensureCorrectLanguage(file);
    setSelectedFile(corrected);
    if (!openTabs.find(t => t.name === corrected.name)) {
      setOpenTabs(prev => [...prev, corrected]);
    }
  };

  const handleCloseTab = (file: GeneratedFile, e: React.MouseEvent) => {
    e.stopPropagation();
    const newTabs = openTabs.filter(t => t.name !== file.name);
    setOpenTabs(newTabs);
    if (selectedFile?.name === file.name && newTabs.length > 0) {
      setSelectedFile(newTabs[newTabs.length - 1]);
    } else if (newTabs.length === 0) {
      setSelectedFile(null);
    }
  };

  const handleCodeChange = (value: string | undefined) => {
    if (credits?.plan !== 'pro' || value === undefined || !selectedFile) return;
    const updatedFiles = files.map(f => f.name === selectedFile.name ? { ...f, content: value } : f);
    setFiles(updatedFiles);
    setSelectedFile({ ...selectedFile, content: value });
    setOpenTabs(prev => prev.map(t => t.name === selectedFile.name ? { ...t, content: value } : t));
  };

  const validFiles = files.filter(f => f.name && f.name.length > 0 && !f.name.startsWith('=') && f.content && f.content.length > 0);

  if (!creditsLoaded) {
    return (
      <div className="ide-loading">
        <div className="ide-loading-content">
          <div className="ide-loading-logo">
            <Sparkles className="w-12 h-12" />
          </div>
          <h2>Extension Builder</h2>
          <p>Initializing workspace...</p>
          <div className="ide-loading-bar"><div className="ide-loading-progress"></div></div>
        </div>
      </div>
    );
  }

  return (
    <div className="ide-container" ref={workspaceRef}>

      {/* Title Bar */}
      <header className="ide-titlebar">
        <div className="titlebar-left">
          <button onClick={() => navigate('/')} className="titlebar-btn home">
            <Home className="w-4 h-4" />
          </button>
          <div className="titlebar-breadcrumb">
            <span className="breadcrumb-item">Extension Builder</span>
            <ChevronRight className="w-3 h-3" />
            <span className="breadcrumb-item active">{projectName || 'New Project'}</span>
          </div>
        </div>

        <div className="titlebar-center">
          <div className="titlebar-search" onClick={() => setShowCommandPalette(true)}>
            <Command className="w-3 h-3" />
            <span>Command Palette</span>
            <kbd>Ctrl+Shift+P</kbd>
          </div>
        </div>

        <div className="titlebar-right">
          {credits && (
            <div className={`titlebar-credits ${credits.plan}`}>
              <Zap className="w-4 h-4" />
              <span>{credits.credits}/{credits.maxCredits}</span>
              {credits.plan === 'free' && (
                <button onClick={() => navigate('/#pricing')} className="credits-upgrade">
                  <TrendingUp className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
          <div className="titlebar-actions">
            <button className="titlebar-btn"><Bell className="w-4 h-4" /></button>
            <button className="titlebar-btn"><Settings className="w-4 h-4" /></button>
          </div>
        </div>
      </header>

      {/* Agent Status Bar */}
      <AgentStatus
        status={agentStatus}
        currentFile={currentGeneratingFile}
        filesCompleted={filesCompleted}
        totalFiles={totalFilesToGenerate || validFiles.length}
        elapsedTime={elapsedTime}
        message={statusMessage}
      />

      <div className="ide-main">
        {/* Activity Bar */}
        <aside className="ide-activity-bar">
          <div className="activity-top">
            <button onClick={() => setActivePanel('explorer')} className={`activity-btn ${activePanel === 'explorer' ? 'active' : ''}`} title="Explorer">
              <File className="w-5 h-5" />
            </button>
            <button onClick={() => setActivePanel('search')} className={`activity-btn ${activePanel === 'search' ? 'active' : ''}`} title="Search">
              <Search className="w-5 h-5" />
            </button>
            <button onClick={() => setActivePanel('git')} className={`activity-btn ${activePanel === 'git' ? 'active' : ''}`} title="Source Control">
              <GitBranch className="w-5 h-5" />
            </button>
            <button onClick={() => { setActivePanel('terminal'); setTerminalMinimized(false); }} className={`activity-btn ${activePanel === 'terminal' ? 'active' : ''}`} title="Terminal">
              <TerminalIcon className="w-5 h-5" />
            </button>
          </div>
          <div className="activity-bottom">
            <button onClick={() => navigate('/#pricing')} className="activity-btn pro-badge" title="Upgrade">
              <Crown className="w-5 h-5" />
            </button>
          </div>
        </aside>

        {/* Sidebar */}
        {!sidebarCollapsed && (
          <aside className="ide-sidebar" style={{ width: 280 }}>
            <div className="sidebar-header">
              <span className="sidebar-title">
                {activePanel === 'explorer' ? 'EXPLORER' : activePanel === 'search' ? 'SEARCH' : activePanel === 'terminal' ? 'TERMINAL' : 'SOURCE CONTROL'}
              </span>
              <div className="sidebar-actions">
                <button onClick={() => setSidebarCollapsed(true)} className="sidebar-btn">
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Search Panel */}
            {activePanel === 'search' && (
              <div className="sidebar-section">
                <div className="search-panel">
                  <input
                    type="text"
                    placeholder="Search in files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                  {searchQuery && validFiles.length > 0 ? (
                    <div className="search-results">
                      {validFiles.filter(f =>
                        f.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        f.name.toLowerCase().includes(searchQuery.toLowerCase())
                      ).map((file, i) => (
                        <button key={i} onClick={() => handleFileSelect(file)} className="search-result-item">
                          <FileIcon filename={file.name} />
                          <span>{file.name}</span>
                        </button>
                      ))}
                    </div>
                  ) : searchQuery ? (
                    <p className="search-empty">No results found</p>
                  ) : (
                    <p className="search-hint">Enter search term to find in files</p>
                  )}
                </div>
              </div>
            )}

            {/* Git Panel */}
            {activePanel === 'git' && (
              <div className="sidebar-section">
                <div className="git-panel">
                  <div className="git-status">
                    <GitBranch className="w-4 h-4" />
                    <span>main</span>
                  </div>
                  <div className="git-info">
                    <p>{validFiles.length} files in project</p>
                    <p className="git-hint">Generated extensions are ready to download</p>
                  </div>
                </div>
              </div>
            )}

            {/* Explorer Panel */}
            {activePanel === 'explorer' && (
              <>
                {/* Project Explorer */}
                <div className="sidebar-section">
                  <button onClick={() => setExplorerExpanded(!explorerExpanded)} className="section-header">
                    {explorerExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    <span>{projectName || 'NEW PROJECT'}</span>
                  </button>
                  {explorerExpanded && (
                    <div className="file-tree">
                      {validFiles.length === 0 ? (
                        <div className="file-tree-empty">
                          <p>No files generated yet</p>
                          <span>Use the AI chat to create your extension</span>
                        </div>
                      ) : (
                        validFiles.map((file, i) => (
                          <AnimatedFileItem
                            key={i}
                            file={file}
                            isSelected={selectedFile?.name === file.name}
                            isGenerating={currentGeneratingFile === file.name}
                            onClick={() => handleFileSelect(file)}
                            onDelete={() => {
                              setFiles(prev => prev.filter(f => f.name !== file.name));
                              setOpenTabs(prev => prev.filter(t => t.name !== file.name));
                              if (selectedFile?.name === file.name) {
                                setSelectedFile(null);
                              }
                            }}
                          />
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* AI Chat Panel */}
                <div className="sidebar-section chat-section">
                  <button onClick={() => setChatExpanded(!chatExpanded)} className="section-header">
                    {chatExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    <span>AI ASSISTANT</span>
                  </button>
                  {chatExpanded && (
                    <div className="chat-container">
                      <div className="chat-messages-mini">
                        {chatMessages.length === 0 ? (
                          <div className="chat-empty-mini">
                            <Bot className="w-8 h-8" />
                            <p>Describe your extension</p>
                            <span>Use prompt box below</span>
                          </div>
                        ) : (
                          chatMessages.slice(-3).map((msg, idx) => (
                            <div key={idx} className={`chat-msg-mini ${msg.role}`}>
                              <div className="msg-avatar">
                                {msg.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                              </div>
                              <p>{msg.content.slice(0, 100)}{msg.content.length > 100 ? '...' : ''}</p>
                            </div>
                          ))
                        )}
                        <div ref={chatEndRef} />
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Terminal Panel in Sidebar */}
            {activePanel === 'terminal' && (
              <div className="sidebar-section terminal-sidebar">
                <Terminal
                  commands={terminalCommands}
                  isGenerating={isGenerating}
                  onClear={clearTerminal}
                  onMinimize={() => setTerminalMinimized(true)}
                  isMinimized={false}
                />
              </div>
            )}
          </aside>
        )}

        {/* Collapsed Sidebar Toggle */}
        {sidebarCollapsed && (
          <button onClick={() => setSidebarCollapsed(false)} className="sidebar-collapsed-btn">
            <PanelLeft className="w-4 h-4" />
          </button>
        )}

        {/* Editor Area */}
        <main className="ide-editor-area">
          {/* Editor Tabs */}
          <div className="editor-tabs-bar">
            <div className="editor-tabs">
              {openTabs.map((tab, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedFile(tab)}
                  className={`editor-tab ${selectedFile?.name === tab.name ? 'active' : ''}`}
                >
                  <FileIcon filename={tab.name} />
                  <span>{tab.name}</span>
                  <button onClick={(e) => handleCloseTab(tab, e)} className="tab-close">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="editor-tabs-actions">
              <div className="view-mode-toggle">
                <button onClick={() => setViewMode('code')} className={viewMode === 'code' ? 'active' : ''} title="Code Only">
                  <Code2 className="w-4 h-4" />
                </button>
                <button onClick={() => setViewMode('split')} className={viewMode === 'split' ? 'active' : ''} title="Split View">
                  <Split className="w-4 h-4" />
                </button>
                <button onClick={() => setViewMode('preview')} className={viewMode === 'preview' ? 'active' : ''} title="Preview Only">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
              {validFiles.length > 0 && (
                <button onClick={handleDownload} className="download-btn-mini">
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
              )}
            </div>
          </div>

          {/* Editor Content */}
          <div className="editor-content">
            {viewMode !== 'preview' && (
              <div className={`editor-pane ${viewMode === 'split' ? 'split' : 'full'}`}>
                {selectedFile ? (
                  <>
                    {/* Breadcrumb */}
                    <div className="editor-breadcrumb">
                      <span className="breadcrumb-path">{selectedFile.name}</span>
                      <div className="breadcrumb-info">
                        <span className="lang-badge">{selectedFile.language}</span>
                        {credits?.plan === 'free' && (
                          <span className="readonly-indicator"><Lock className="w-3 h-3" />Read-only</span>
                        )}
                        <button onClick={handleCopy} className="copy-btn-mini">
                          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                    <div className="monaco-container">
                      <Editor
                        height="100%"
                        language={selectedFile.language}
                        value={selectedFile.content}
                        theme="vs-dark"
                        options={{
                          minimap: { enabled: true, scale: 1, showSlider: 'mouseover' },
                          fontSize: 13,
                          fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                          fontLigatures: true,
                          lineNumbers: 'on',
                          renderLineHighlight: 'all',
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                          tabSize: 2,
                          wordWrap: 'on',
                          readOnly: credits?.plan === 'free',
                          padding: { top: 16, bottom: 16 },
                          smoothScrolling: true,
                          cursorBlinking: 'smooth',
                          cursorSmoothCaretAnimation: 'on',
                          bracketPairColorization: { enabled: true },
                          guides: { bracketPairs: true, indentation: true }
                        }}
                        onChange={handleCodeChange}
                      />
                    </div>
                  </>
                ) : (
                  <div className="editor-welcome">
                    <div className="welcome-content">
                      <Sparkles className="w-16 h-16" />
                      <h2>Extension Builder</h2>
                      <p>Create browser extensions with AI</p>
                      <div className="welcome-hints">
                        <div className="hint-item"><kbd>Ctrl</kbd>+<kbd>Enter</kbd> to generate</div>
                        <div className="hint-item"><kbd>Ctrl</kbd>+<kbd>S</kbd> to save</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {viewMode !== 'code' && validFiles.length > 0 && (
              <div className={`preview-pane ${viewMode === 'split' ? 'split' : 'full'}`}>
                <CodePreview files={validFiles} />
              </div>
            )}
          </div>

          {/* Terminal Panel - Bottom */}
          {!terminalMinimized && activePanel !== 'terminal' && (
            <div className="editor-terminal-panel">
              <Terminal
                commands={terminalCommands}
                isGenerating={isGenerating}
                onClear={clearTerminal}
                onMinimize={() => setTerminalMinimized(true)}
                isMinimized={false}
              />
            </div>
          )}

          {/* Minimized Terminal */}
          {terminalMinimized && (
            <Terminal
              commands={terminalCommands}
              isGenerating={isGenerating}
              onMinimize={() => setTerminalMinimized(false)}
              isMinimized={true}
            />
          )}

          {/* Bottom Panel - Prompt Input */}
          <div className="editor-bottom-panel">
            <form onSubmit={(e) => { e.preventDefault(); handleGenerate(); }} className="prompt-form-full">
              <div className="prompt-container-full">
                <Sparkles className="prompt-icon-full" />
                <textarea
                  value={prompt}
                  onChange={(e) => {
                    setPrompt(e.target.value);
                    // Auto-expand textarea like Bolt/Lovable
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
                  }}
                  placeholder={validFiles.length > 0 ? "Ask AI to update, fix, or add features to your extension..." : "Describe your Chrome extension idea..."}
                  disabled={isGenerating || credits?.credits === 0}
                  rows={1}
                  style={{ resize: 'none', overflow: 'hidden', minHeight: '44px', maxHeight: '200px' }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
                />
                <button type="submit" disabled={isGenerating || !prompt.trim()} className="prompt-send-full">
                  {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
              {credits?.credits === 0 && (
                <div className="no-credits-bar">
                  <AlertTriangle className="w-4 h-4" />
                  <span>No credits left.</span>
                  <button type="button" onClick={() => navigate('/#pricing')}>Upgrade</button>
                </div>
              )}
            </form>
          </div>
        </main>
      </div>

      {/* Status Bar */}
      <footer className="ide-statusbar">
        <div className="status-left">
          <div className="status-item branch"><GitBranch className="w-3 h-3" />main</div>
          <div className="status-item">{validFiles.length} files</div>
          {selectedFile && <div className="status-item">Ln 1, Col 1</div>}
        </div>
        <div className="status-right">
          {selectedFile && (
            <>
              <div className="status-item">{selectedFile.language.toUpperCase()}</div>
              <div className="status-item">UTF-8</div>
            </>
          )}
          <div className="status-item">
            {credits?.plan === 'pro' ? (
              <span className="pro-indicator"><Crown className="w-3 h-3" />Pro</span>
            ) : (
              <span className="free-indicator">Free</span>
            )}
          </div>
          <div className="status-item notifications"><Bell className="w-3 h-3" /></div>
        </div>
      </footer>

      {/* Code Editor Modal */}
      {showCodeEditor && editingFile && (
        <div className="modal-overlay" onClick={() => setShowCodeEditor(false)}>
          <div className="code-editor-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <Edit3 className="w-5 h-5" />
                <span>Editing: {editingFile.name}</span>
              </div>
              <button onClick={() => setShowCodeEditor(false)} className="modal-close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="modal-content">
              <Editor
                height="100%"
                language={editingFile.language}
                value={editedCode}
                theme="vs-dark"
                options={{ fontSize: 14, minimap: { enabled: true }, automaticLayout: true }}
                onChange={(v) => setEditedCode(v || '')}
              />
            </div>
            <div className="modal-footer">
              <span className="pro-indicator"><Crown className="w-4 h-4" />Pro Feature</span>
              <div className="modal-actions">
                <button onClick={() => setShowCodeEditor(false)} className="btn-secondary">Cancel</button>
                <button onClick={() => {
                  const updated = files.map(f => f.name === editingFile.name ? { ...f, content: editedCode } : f);
                  setFiles(updated);
                  if (selectedFile?.name === editingFile.name) setSelectedFile({ ...editingFile, content: editedCode });
                  setOpenTabs(prev => prev.map(t => t.name === editingFile.name ? { ...t, content: editedCode } : t));
                  setShowCodeEditor(false);
                }} className="btn-primary"><Save className="w-4 h-4" />Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Buy Credits Modal */}
      <BuyCreditsModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        creditsRemaining={credits?.credits || 0}
        hasUsedFreeTrial={credits?.hasUsedFreeTrial || false}
      />
    </div>
  );
}
