import React, { useEffect, useState, useMemo } from 'react';
import { GeneratedFile } from './../methods/services/aiService';
import { RefreshCw, Eye, Maximize2, X, Info, ExternalLink, CheckCircle, FileCode } from 'lucide-react';

interface CodePreviewProps {
  files: GeneratedFile[];
}
const CHROME_LOGO = "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/chrome/chrome-original.svg";
const FIREFOX_LOGO = "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firefox/firefox-original.svg";
const InstallationGuide: React.FC<{ browser: 'chrome' | 'firefox' | 'edge' }> = ({ browser }) => {
  const guides = {
    chrome: {
      title: 'Chrome / Chromium Browsers',
      subtitle: 'Works for Chrome, Edge, Brave, Opera, Vivaldi',
      icon: '🎨',
      color: '#4285F4',
      steps: [
        { text: 'Download and extract the extension files', highlight: 'Download button above' },
        { text: 'Open Chrome and go to', code: 'chrome://extensions' },
        { text: 'Enable "Developer mode" in top right corner' },
        { text: 'Click "Load unpacked" button' },
        { text: 'Select the extracted folder' },
        { text: 'Your extension is now installed! 🎉' }
      ]
    },
    firefox: {
      title: 'Firefox Browser',
      subtitle: 'Mozilla Firefox & Firefox Developer Edition',
      icon: '🦊',
      color: '#FF6611',
      steps: [
        { text: 'Download the extension files', highlight: 'Download button above' },
        { text: 'Open Firefox and go to', code: 'about:debugging#/runtime/this-firefox' },
        { text: 'Click "Load Temporary Add-on"' },
        { text: 'Select manifest.json from your folder' },
        { text: 'Extension loads temporarily (until browser restart)' }
      ]
    },
    edge: {
      title: 'Microsoft Edge',
      subtitle: 'Chromium-based Edge Browser',
      icon: '🌐',
      color: '#0078D7',
      steps: [
        { text: 'Download and extract the files', highlight: 'Download button above' },
        { text: 'Open Edge and go to', code: 'edge://extensions' },
        { text: 'Turn on "Developer mode" (bottom left)' },
        { text: 'Click "Load unpacked"' },
        { text: 'Select your extension folder' }
      ]
    }
  };

  const guide = guides[browser];

  return (
    <div className="installation-guide">
      <div className="guide-header" style={{ borderLeftColor: guide.color }}>
        <div className="guide-title-row">
          <span className="guide-icon">{guide.icon}</span>
          <div>
            <h3 className="guide-title">{guide.title}</h3>
            <p className="guide-subtitle">{guide.subtitle}</p>
          </div>
        </div>
      </div>

      <div className="guide-content">
        <div className="guide-section">
          <h4 className="section-title">
            <CheckCircle size={16} />
            Installation Steps
          </h4>
          <ol className="steps-list">
            {guide.steps.map((step, i) => (
              <li key={i} className="step-item">
                <span className="step-number">{i + 1}</span>
                <div className="step-content">
                  <span>{step.text}</span>
                  {step.code && <code className="step-code">{step.code}</code>}
                  {step.highlight && <span className="step-highlight">({step.highlight})</span>}
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="guide-links">
          <a 
            href={browser === 'chrome' ? 'https://developer.chrome.com/docs/extensions/' : 
                  browser === 'firefox' ? 'https://extensionworkshop.com/' :
                  'https://learn.microsoft.com/en-us/microsoft-edge/extensions-chromium/'}
            target="_blank"
            rel="noopener noreferrer"
            className="guide-link"
          >
            <ExternalLink size={14} />
            Official Documentation
          </a>
        </div>
      </div>
    </div>
  );
};

const FilesList: React.FC<{ files: GeneratedFile[] }> = ({ files }) => (
  <div className="files-list-panel">
    <h4 className="files-list-title">
      <FileCode size={16} />
      Generated Files ({files.length})
    </h4>
    <div className="files-grid">
      {files.map((file, i) => (
        <div key={i} className="file-item">
          <div className="file-icon">
            {file.name.endsWith('.html') && '📄'}
            {file.name.endsWith('.css') && '🎨'}
            {file.name.endsWith('.js') && '⚡'}
            {file.name.endsWith('.json') && '📋'}
            {!file.name.match(/\.(html|css|js|json)$/) && '📁'}
          </div>
          <div className="file-info">
            <span className="file-name">{file.name}</span>
            <span className="file-size">{(file.content.length / 1024).toFixed(1)} KB</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const CodePreview: React.FC<CodePreviewProps> = ({ files }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedBrowser, setSelectedBrowser] = useState<'chrome' | 'firefox'>('chrome');

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // Dynamically detect entry point HTML file
  const entryFile = useMemo(() => {
    // Priority order: popup.html, index.html, first .html file
    return files.find(f => f.name === 'popup.html') ||
           files.find(f => f.name === 'index.html') ||
           files.find(f => f.name === 'options.html') ||
           files.find(f => f.name.endsWith('.html'));
  }, [files]);

  // Dynamically detect all CSS files
  const cssFiles = useMemo(() => {
    return files.filter(f => f.name.endsWith('.css') || f.language === 'css');
  }, [files]);

  // Dynamically detect all JS files
  const jsFiles = useMemo(() => {
    return files.filter(f => f.name.endsWith('.js') || f.language === 'javascript');
  }, [files]);

  const previewHtml = useMemo(() => {
    if (!entryFile) return null;

    try {
      let html = entryFile.content;

      // Inline ALL CSS files dynamically
      cssFiles.forEach(cssFile => {
        const cssLinkPattern = new RegExp(`<link[^>]*href=["']${cssFile.name}["'][^>]*>`, 'gi');
        html = html.replace(cssLinkPattern, `<style>${cssFile.content}</style>`);
      });

      // Also inline any CSS files not explicitly linked
      const linkedCssFiles = cssFiles.filter(cssFile => 
        html.includes(`href="${cssFile.name}"`) || html.includes(`href='${cssFile.name}'`)
      );
      
      const unlinkedCssFiles = cssFiles.filter(cssFile => 
        !linkedCssFiles.includes(cssFile)
      );
      
      if (unlinkedCssFiles.length > 0) {
        const additionalStyles = unlinkedCssFiles.map(f => `<style>${f.content}</style>`).join('\n');
        html = html.replace(/<\/head>/i, `${additionalStyles}</head>`);
      }

      // Browser-specific API
      const mockAPI = selectedBrowser === 'firefox' ? `
<script>
  (function() {
    const storageKey = 'firefox_ext_storage';
    window.browser = {
      storage: {
        local: {
          get: function(keys) {
            return new Promise((resolve) => {
              const data = JSON.parse(localStorage.getItem(storageKey) || '{}');
              const result = {};
              if (typeof keys === 'string') result[keys] = data[keys];
              else if (Array.isArray(keys)) keys.forEach(key => result[key] = data[key]);
              else Object.assign(result, data);
              resolve(result);
            });
          },
          set: function(items) {
            return new Promise((resolve) => {
              const data = JSON.parse(localStorage.getItem(storageKey) || '{}');
              Object.assign(data, items);
              localStorage.setItem(storageKey, JSON.stringify(data));
              console.log('🦊 Firefox storage:', items);
              resolve();
            });
          },
          remove: function(keys) {
            return new Promise((resolve) => {
              const data = JSON.parse(localStorage.getItem(storageKey) || '{}');
              if (Array.isArray(keys)) keys.forEach(key => delete data[key]);
              else delete data[keys];
              localStorage.setItem(storageKey, JSON.stringify(data));
              resolve();
            });
          }
        }
      },
      runtime: {
        sendMessage: (msg) => Promise.resolve({ success: true }),
        getURL: (path) => path
      },
      tabs: {
        query: (q) => Promise.resolve([{ id: 1 }]),
        sendMessage: (id, msg) => Promise.resolve({ success: true })
      }
    };
    window.chrome = window.browser;
    console.log('🦊 Firefox WebExtension API ready');
  })();
</script>` : `
<script>
  (function() {
    const storageKey = 'chrome_ext_storage';
    window.chrome = window.chrome || {};
    window.chrome.storage = {
      local: {
        get: function(keys, callback) {
          const data = JSON.parse(localStorage.getItem(storageKey) || '{}');
          const result = {};
          if (typeof keys === 'string') result[keys] = data[keys];
          else if (Array.isArray(keys)) keys.forEach(key => result[key] = data[key]);
          else Object.assign(result, data);
          if (callback) callback(result);
          return Promise.resolve(result);
        },
        set: function(items, callback) {
          const data = JSON.parse(localStorage.getItem(storageKey) || '{}');
          Object.assign(data, items);
          localStorage.setItem(storageKey, JSON.stringify(data));
          console.log('🎨 Chrome storage:', items);
          if (callback) callback();
          return Promise.resolve();
        },
        remove: function(keys, callback) {
          const data = JSON.parse(localStorage.getItem(storageKey) || '{}');
          if (Array.isArray(keys)) keys.forEach(key => delete data[key]);
          else delete data[keys];
          localStorage.setItem(storageKey, JSON.stringify(data));
          if (callback) callback();
          return Promise.resolve();
        }
      }
    };
    window.chrome.runtime = {
      sendMessage: (msg, cb) => { if (cb) cb({ success: true }); return Promise.resolve(); },
      getURL: (path) => path
    };
    window.chrome.tabs = {
      query: (q, cb) => { if (cb) cb([{ id: 1 }]); return Promise.resolve([{ id: 1 }]); },
      sendMessage: (id, msg, cb) => { if (cb) cb({ success: true }); return Promise.resolve(); }
    };
    console.log('🎨 Chrome Extension API ready');
  })();
</script>`;

      html = html.replace(/<\/head>/i, `${mockAPI}</head>`);

      // Inline ALL JS files dynamically
      jsFiles.forEach(jsFile => {
        const jsPattern = new RegExp(`<script[^>]*src=["']${jsFile.name}["'][^>]*><\/script>`, 'gi');
        html = html.replace(jsPattern, `<script>${jsFile.content}</script>`);
      });

      // Base responsive styles
      const baseStyles = `<style>
        html,body{margin:0;padding:0;width:100%;height:100%;overflow-x:hidden;}
        *{box-sizing:border-box;}
      </style>`;
      html = html.replace(/<\/head>/i, `${baseStyles}</head>`);

      return html;
    } catch (error) {
      console.error('Preview generation error:', error);
      return null;
    }
  }, [files, selectedBrowser, entryFile, cssFiles, jsFiles]);

  useEffect(() => {
    if (!previewHtml) return;

    try {
      const blob = new Blob([previewHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(url);
    } catch (error) {
      console.error('Preview error:', error);
    }

    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewHtml]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const blob = new Blob([previewHtml || ''], { type: 'text/html' });
      setPreviewUrl(URL.createObjectURL(blob));
      setIsRefreshing(false);
    }, 300);
  };

  if (files.length === 0) {
    return (
      <div className="preview-empty-state">
        <Eye size={48} strokeWidth={1.5} className="preview-empty-icon" />
        <p>No preview available</p>
        <p className="empty-hint">Generate an extension to see it in action</p>
      </div>
    );
  }

  if (!entryFile) {
    return (
      <div className="preview-empty-state">
        <FileCode size={48} strokeWidth={1.5} className="preview-empty-icon" />
        <p>No HTML file found</p>
        <p className="empty-hint">Extension needs an HTML file for preview</p>
        <FilesList files={files} />
      </div>
    );
  }

  return (
    <>
      <div className="preview-container">
        <div className="preview-topbar">
          <div className="preview-label">
            <Eye size={18} strokeWidth={2} />
            <span>Live Preview</span>
            <span className="file-indicator">{entryFile.name}</span>
          </div>
          
          <div className="preview-toolbar">
            <div className="browser-tabs">
  <button
    onClick={() => setSelectedBrowser('chrome')}
    className={`browser-tab ${selectedBrowser === 'chrome' ? 'active' : ''}`}
    type="button"
    title="Chrome Browser"
  >
    <img src={CHROME_LOGO} alt="Chrome" className="browser-logo" />
    <span>Chrome</span>
  </button>
  
  <button
    onClick={() => setSelectedBrowser('firefox')}
    className={`browser-tab ${selectedBrowser === 'firefox' ? 'active' : ''}`}
    type="button"
    title="Firefox Browser"
  >
    <img src={FIREFOX_LOGO} alt="Firefox" className="browser-logo" />
    <span>Firefox</span>
  </button>
</div>
            <div className="preview-actions-group">
              <button 
                onClick={() => setShowGuide(!showGuide)} 
                className={`icon-btn ${showGuide ? 'active' : ''}`}
                title="Installation Guide"
                type="button"
              >
                <Info size={16} />
              </button>
              <button 
                onClick={handleRefresh} 
                className="icon-btn"
                disabled={isRefreshing}
                title="Refresh"
                type="button"
              >
                <RefreshCw size={16} className={isRefreshing ? 'spinning' : ''} />
              </button>
              <button 
                onClick={() => setIsFullscreen(true)} 
                className="icon-btn"
                title="Fullscreen"
                type="button"
              >
                <Maximize2 size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="preview-content-wrapper">
          {showGuide ? (
            <div className="guide-panel">
              <FilesList files={files} />
              <InstallationGuide browser={selectedBrowser} />
            </div>
          ) : (
            <div className="preview-viewport">
              {previewUrl ? (
                <iframe
                  key={`${previewUrl}-${selectedBrowser}`}
                  src={previewUrl}
                  className="preview-iframe"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  title="Extension Preview"
                />
              ) : (
                <div className="preview-loading">Loading preview...</div>
              )}
              
              <div className="preview-info-bar">
                <div className="info-item">
                  <FileCode size={14} />
                  <span>{files.length} files</span>
                </div>
                <div className="info-item">
                  <span className={`api-badge ${selectedBrowser}`}>
                    {selectedBrowser === 'chrome' && '🎨 Chrome API'}
                    {selectedBrowser === 'firefox' && '🦊 Firefox API'}
                    
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {isFullscreen && (
        <div className="fullscreen-overlay" onClick={() => setIsFullscreen(false)}>
          <div className="fullscreen-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fullscreen-topbar">
              <div className="fullscreen-label">
                <Eye size={20} />
                <span>Live Preview</span>
                <span className="file-indicator">{entryFile.name}</span>
              </div>
              
              <div className="fullscreen-toolbar">
                <div className="browser-tabs">
                  <button
                    onClick={() => setSelectedBrowser('chrome')}
                    className={`browser-tab ${selectedBrowser === 'chrome' ? 'active' : ''}`}
                    type="button"
                  >
                    Chrome
                  </button>
                  <button
                    onClick={() => setSelectedBrowser('firefox')}
                    className={`browser-tab ${selectedBrowser === 'firefox' ? 'active' : ''}`}
                    type="button"
                  >
                    Firefox
                  </button>
               
               
                </div>
                
                <button onClick={handleRefresh} className="icon-btn" type="button">
                  <RefreshCw size={16} className={isRefreshing ? 'spinning' : ''} />
                </button>
                <button onClick={() => setIsFullscreen(false)} className="icon-btn close" type="button">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="fullscreen-viewport-wrapper">
              {previewUrl && (
                <iframe
                  key={`fullscreen-${previewUrl}-${selectedBrowser}`}
                  src={previewUrl}
                  className="fullscreen-iframe"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  title="Fullscreen Preview"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CodePreview;
