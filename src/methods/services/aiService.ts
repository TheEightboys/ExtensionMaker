import knowledgeBase from './../../../src/Knowledge/extension-knowledge-base.json';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface GeneratedFile {
  name: string;
  path: string;
  content: string;
  language: string;
}

export interface BuildInstructions {
  hasReact: boolean;
  needsInstall: boolean;
}

export interface GenerateResponse {
  response: string;
  explanation: string;
  files: GeneratedFile[];
  buildInstructions: BuildInstructions;
}

// Terminal command types for agentic UI
export interface TerminalCommand {
  type: 'info' | 'success' | 'error' | 'warning' | 'command';
  message: string;
  timestamp: Date;
}

// Streaming callbacks for agentic experience
export interface StreamCallbacks {
  onChunk?: (text: string) => void;
  onFileStart?: (filename: string) => void;
  onFileProgress?: (filename: string, progress: number) => void;
  onFileComplete?: (file: GeneratedFile) => void;
  onTerminalCommand?: (command: TerminalCommand) => void;
  onStatusChange?: (status: string) => void;
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

// Fallback AI providers
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || "";
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile'; // Updated to current model

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || "";
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// ============================================
// BEST FREE OPENROUTER MODELS FOR CODE GENERATION (2024-2025)
// ============================================
// Carefully selected for optimal Chrome extension code generation
const OPENROUTER_FREE_MODELS = [
  'deepseek/deepseek-r1-0528:free',           // #1 Best reasoning & code - top tier
  'qwen/qwen3-235b-a22b:free',                // #2 Excellent code generation  
  'meta-llama/llama-3.3-70b-instruct:free',   // #3 Strong instruction following
  'deepseek/deepseek-chat:free',              // #4 Fast and reliable coding
  'qwen/qwen-2.5-coder-32b-instruct:free',    // #5 Specialized coder model
  'microsoft/phi-4:free',                      // #6 Compact but capable
];

// Provider priority order - OpenRouter first with BEST free models
type AIProvider = 'openrouter' | 'gemini' | 'groq';
const PROVIDER_PRIORITY: AIProvider[] = ['openrouter', 'gemini', 'groq'];

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAYS = [2000, 5000, 10000]; // Exponential backoff delays

// ============================================
// ENHANCED SYSTEM PROMPT WITH KNOWLEDGE BASE
// ============================================

const SYSTEM_PROMPT = `You are an EXPERT Chrome Extension developer. You MUST generate COMPLETE, PRODUCTION-READY, BEAUTIFUL extensions.

# CRITICAL RULES - READ CAREFULLY

1. **BUILD EXACTLY WHAT USER ASKS** - Read their request carefully. If they want a YouTube extension, build YouTube features. If todo app, build todo features. NEVER build a generic template.

2. **EVERY BUTTON MUST WORK** - Every single button, input, and interactive element MUST have complete JavaScript functionality. NO placeholders. NO "// TODO".

3. **MODERN BEAUTIFUL UI** - Use gradients, animations, glassmorphism. The extension must look PROFESSIONAL and STUNNING.

4. **DATA PERSISTENCE** - Always use chrome.storage.local to save and load data.

5. **MANIFEST V3 ONLY** - Always use manifest_version: 3.

# MANDATORY OUTPUT FORMAT

You MUST output files in this EXACT format:

EXPLANATION: [One sentence describing what this extension does]

=== manifest.json ===
{
  "manifest_version": 3,
  "name": "[Extension Name]",
  "version": "1.0.0",
  "description": "[Description]",
  "permissions": ["storage"],
  "action": {
    "default_popup": "index.html",
    "default_icon": {
      "16": "icon16.png",
      "48": "icon48.png",
      "128": "icon128.png"
    }
  },
  "icons": {
    "16": "icon16.png",
    "48": "icon48.png",
    "128": "icon128.png"
  }
}

=== index.html ===
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[Extension Name]</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <!-- Your HTML content here -->
  </div>
  <script src="script.js"></script>
</body>
</html>

=== styles.css ===
/* Modern CSS with variables, gradients, animations */
:root {
  --primary: #667eea;
  --secondary: #764ba2;
  --accent: #f093fb;
  --bg-dark: #1a1a2e;
  --bg-card: rgba(255, 255, 255, 0.1);
  --text: #ffffff;
  --text-muted: rgba(255, 255, 255, 0.7);
  --border-radius: 12px;
  --shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  width: 380px;
  min-height: 500px;
  font-family: 'Segoe UI', system-ui, sans-serif;
  background: linear-gradient(135deg, var(--bg-dark) 0%, #16213e 50%, #0f3460 100%);
  color: var(--text);
  overflow-x: hidden;
}

.container {
  padding: 20px;
}

/* Add glassmorphism cards, hover effects, animations */

=== script.js ===
document.addEventListener('DOMContentLoaded', function() {
  'use strict';

  // 1. Get ALL DOM elements by ID
  // 2. Load saved data from chrome.storage.local
  // 3. Add event listeners to ALL buttons
  // 4. Each button handler MUST do something visible

  // Example chrome.storage usage:
  // Load: chrome.storage.local.get(['data'], (result) => { ... });
  // Save: chrome.storage.local.set({ data: value });
});

# COMPLETE CODE EXAMPLES

## TODO LIST JAVASCRIPT PATTERN:
\`\`\`javascript
document.addEventListener('DOMContentLoaded', function() {
  'use strict';
  
  const taskInput = document.getElementById('taskInput');
  const addBtn = document.getElementById('addBtn');
  const taskList = document.getElementById('taskList');
  const clearBtn = document.getElementById('clearBtn');
  
  let tasks = [];
  
  // Load tasks on startup
  chrome.storage.local.get(['tasks'], (result) => {
    tasks = result.tasks || [];
    renderTasks();
  });
  
  function saveTasks() {
    chrome.storage.local.set({ tasks: tasks });
  }
  
  function renderTasks() {
    taskList.innerHTML = '';
    if (tasks.length === 0) {
      taskList.innerHTML = '<p class="empty-state">No tasks yet. Add one above!</p>';
      return;
    }
    tasks.forEach((task, index) => {
      const div = document.createElement('div');
      div.className = 'task-item' + (task.completed ? ' completed' : '');
      div.innerHTML = \`
        <span class="task-text">\${task.text}</span>
        <div class="task-actions">
          <button class="complete-btn" data-index="\${index}">✓</button>
          <button class="delete-btn" data-index="\${index}">×</button>
        </div>
      \`;
      taskList.appendChild(div);
    });
    
    // Add click handlers for complete/delete buttons
    document.querySelectorAll('.complete-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const index = parseInt(this.dataset.index);
        tasks[index].completed = !tasks[index].completed;
        saveTasks();
        renderTasks();
      });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const index = parseInt(this.dataset.index);
        tasks.splice(index, 1);
        saveTasks();
        renderTasks();
      });
    });
  }
  
  addBtn.addEventListener('click', function() {
    const text = taskInput.value.trim();
    if (text) {
      tasks.unshift({ id: Date.now(), text: text, completed: false });
      taskInput.value = '';
      saveTasks();
      renderTasks();
    }
  });
  
  taskInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') addBtn.click();
  });
  
  clearBtn.addEventListener('click', function() {
    if (confirm('Clear all tasks?')) {
      tasks = [];
      saveTasks();
      renderTasks();
    }
  });
});
\`\`\`

## MODERN CSS PATTERN:
\`\`\`css
:root {
  --primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --accent: #f093fb;
  --dark: #1a1a2e;
  --card: rgba(255, 255, 255, 0.1);
  --glass: rgba(255, 255, 255, 0.05);
}

body {
  width: 380px;
  min-height: 500px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  color: #fff;
}

.container { padding: 20px; }

.header {
  text-align: center;
  margin-bottom: 20px;
}

.header h1 {
  font-size: 24px;
  background: linear-gradient(135deg, #667eea, #f093fb);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.input-group {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 14px;
  outline: none;
  transition: all 0.3s ease;
}

input:focus {
  border-color: #667eea;
  box-shadow: 0 0 20px rgba(102, 126, 234, 0.3);
}

input::placeholder { color: rgba(255, 255, 255, 0.5); }

.btn {
  padding: 12px 20px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.btn:active { transform: translateY(0); }

.card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateX(5px);
  border-color: #667eea;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animated { animation: fadeIn 0.3s ease; }
\`\`\`

# CHROME APIS REFERENCE

## Storage (ALWAYS USE):
chrome.storage.local.get(['key'], (result) => { const value = result.key || defaultValue; });
chrome.storage.local.set({ key: value });

## Tabs (for tab extensions):
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => { const tab = tabs[0]; });
chrome.tabs.create({ url: 'https://example.com' });

## Alarms (for timers):
chrome.alarms.create('myAlarm', { delayInMinutes: 1 });
chrome.alarms.onAlarm.addListener((alarm) => { if (alarm.name === 'myAlarm') { ... } });

## Notifications:
chrome.notifications.create({ type: 'basic', iconUrl: 'icon48.png', title: 'Title', message: 'Message' });

# PERMISSIONS REFERENCE
- "storage" - for saving data (ALWAYS include)
- "tabs" - for accessing tab URLs
- "activeTab" - for current tab access
- "notifications" - for desktop notifications
- "alarms" - for timers and scheduling
- "clipboardWrite" / "clipboardRead" - for clipboard access
- "bookmarks" - for bookmark management

# REMEMBER
1. Generate COMPLETE, WORKING code - never partial
2. Every button MUST have a click handler
3. Use modern, beautiful CSS with gradients and animations
4. Always include chrome.storage.local for data persistence
5. Match the output format EXACTLY with === filename === markers
6. Build what the USER asked for, not a generic template`;



// ============================================
// HELPER FUNCTIONS
// ============================================

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fixSmartQuotes(content: string): string {
  return content
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-');
}

function cleanCodeBlock(content: string): string {
  content = content.replace(/^```(?:[a-zA-Z]+\n)?/, '');
  content = content.replace(/\n?```$/gm, '');
  return content.trim();
}

function mergeFiles(existingFiles: GeneratedFile[], newFiles: GeneratedFile[]): GeneratedFile[] {
  const merged = [...existingFiles];
  newFiles.forEach(newFile => {
    const existingIndex = merged.findIndex(f => f.name === newFile.name);
    if (existingIndex >= 0) {
      merged[existingIndex] = newFile;
      console.log(`🔄 Updated: ${newFile.name}`);
    } else {
      merged.push(newFile);
      console.log(`➕ Added: ${newFile.name}`);
    }
  });
  return merged;
}

// ============================================
// TEMPLATE DETECTION
// ============================================

function detectTemplate(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();
  let templateContext = '';

  Object.entries(knowledgeBase.templates).forEach(([key, template]) => {
    if (template.keywords.some((keyword: string) => lowerPrompt.includes(keyword))) {
      templateContext += `\n\n=== MATCHED TEMPLATE: ${template.name} ===\n`;
      templateContext += `Structure: ${JSON.stringify(template.structure, null, 2)}\n`;
      templateContext += `Code Patterns: ${JSON.stringify(template.code_patterns, null, 2)}\n`;
      console.log('✅ Matched template:', template.name);
    }
  });

  // Add best practices
  templateContext += `\n\n=== BEST PRACTICES ===\n`;
  templateContext += JSON.stringify(knowledgeBase.best_practices, null, 2);

  // Add UI patterns
  templateContext += `\n\n=== UI PATTERNS ===\n`;
  templateContext += JSON.stringify(knowledgeBase.ui_patterns, null, 2);

  // Add common patterns
  templateContext += `\n\n=== COMMON PATTERNS ===\n`;
  templateContext += JSON.stringify(knowledgeBase.common_patterns, null, 2);

  return templateContext;
}

// ============================================
// IMPROVED FILE PARSING - STREAMING SUPPORT
// ============================================

function parseGeneratedFiles(
  text: string,
  callbacks?: StreamCallbacks
): GeneratedFile[] {
  const newFiles: GeneratedFile[] = [];

  // Send terminal command
  callbacks?.onTerminalCommand?.({
    type: 'info',
    message: 'Parsing generated files...',
    timestamp: new Date()
  });

  // Flexible regex that catches ANY filename with extension
  const fileMarkerRegex = /===\s*([a-zA-Z0-9._\-\/]+\.[a-zA-Z0-9]+)\s*===\s*\n([\s\S]*?)(?=\n===\s*[a-zA-Z0-9._\-\/]+\.[a-zA-Z0-9]+\s*===|$)/g;
  let match;

  console.log('📄 Parsing generated files...');

  while ((match = fileMarkerRegex.exec(text)) !== null) {
    const filename = match[1].trim();
    let content = match[2].trim();

    if (!filename) {
      console.warn('⚠️ Empty filename, skipping');
      continue;
    }

    // Notify file start
    callbacks?.onFileStart?.(filename);
    callbacks?.onTerminalCommand?.({
      type: 'command',
      message: `Creating ${filename}...`,
      timestamp: new Date()
    });

    // Clean code blocks
    content = cleanCodeBlock(content);
    content = fixSmartQuotes(content);
    content = content.replace(/\n*===.*$/s, '').trim();

    if (content.length < 10) {
      console.warn(`⚠️ File ${filename} too short (${content.length} chars), skipping`);
      callbacks?.onTerminalCommand?.({
        type: 'warning',
        message: `Skipped ${filename} (too short)`,
        timestamp: new Date()
      });
      continue;
    }

    // Detect language from extension
    let language = 'plaintext';
    const ext = filename.split('.').pop()?.toLowerCase();

    switch (ext) {
      case 'json': language = 'json'; break;
      case 'html': case 'htm': language = 'html'; break;
      case 'css': language = 'css'; break;
      case 'js': case 'mjs': language = 'javascript'; break;
      case 'ts': language = 'typescript'; break;
      case 'jsx': language = 'javascript'; break;
      case 'tsx': language = 'typescript'; break;
      case 'md': language = 'markdown'; break;
      case 'txt': language = 'plaintext'; break;
    }

    const file = {
      name: filename,
      path: filename,
      content,
      language
    };

    newFiles.push(file);
    console.log(`✅ Parsed: ${filename} (${language}, ${content.length} chars)`);

    // Notify file complete
    callbacks?.onFileComplete?.(file);
    callbacks?.onTerminalCommand?.({
      type: 'success',
      message: `Created ${filename} (${content.length} chars)`,
      timestamp: new Date()
    });
  }

  // If no files found with === markers, try alternative parsing
  if (newFiles.length === 0) {
    console.warn('⚠️ No files found with === markers, trying alternative parsing...');
    callbacks?.onTerminalCommand?.({
      type: 'warning',
      message: 'Using alternative file parsing...',
      timestamp: new Date()
    });
    newFiles.push(...tryAlternativeParsing(text, callbacks));
  }

  return newFiles;
}

// Alternative parsing for when AI doesn't use === markers
function tryAlternativeParsing(text: string, callbacks?: StreamCallbacks): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const MAX_FILES = 6; // Limit total files to prevent runaway parsing

  // Try to extract JSON blocks for manifest (only first one)
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/);
  if (jsonMatch && files.length < MAX_FILES) {
    callbacks?.onFileStart?.('manifest.json');
    files.push({
      name: 'manifest.json',
      path: 'manifest.json',
      content: jsonMatch[1].trim(),
      language: 'json'
    });
    callbacks?.onFileComplete?.(files[files.length - 1]);
  }

  // Try to extract HTML (max 2)
  const htmlMatches = text.matchAll(/```html\s*([\s\S]*?)```/g);
  let htmlIndex = 0;
  for (const match of htmlMatches) {
    if (htmlIndex >= 2 || files.length >= MAX_FILES) break;
    const filename = htmlIndex === 0 ? 'index.html' : 'options.html';
    callbacks?.onFileStart?.(filename);
    files.push({
      name: filename,
      path: filename,
      content: match[1].trim(),
      language: 'html'
    });
    callbacks?.onFileComplete?.(files[files.length - 1]);
    htmlIndex++;
  }

  // Try to extract CSS (max 1)
  const cssMatch = text.match(/```css\s*([\s\S]*?)```/);
  if (cssMatch && files.length < MAX_FILES) {
    callbacks?.onFileStart?.('styles.css');
    files.push({
      name: 'styles.css',
      path: 'styles.css',
      content: cssMatch[1].trim(),
      language: 'css'
    });
    callbacks?.onFileComplete?.(files[files.length - 1]);
  }

  // Try to extract JavaScript (max 2 - script.js and optionally background.js)
  const jsMatches = text.matchAll(/```(?:javascript|js)\s*([\s\S]*?)```/g);
  let jsIndex = 0;
  for (const match of jsMatches) {
    if (jsIndex >= 2 || files.length >= MAX_FILES) break;
    const filename = jsIndex === 0 ? 'script.js' : 'background.js';
    callbacks?.onFileStart?.(filename);
    files.push({
      name: filename,
      path: filename,
      content: match[1].trim(),
      language: 'javascript'
    });
    callbacks?.onFileComplete?.(files[files.length - 1]);
    jsIndex++;
  }

  console.log(`✅ Alternative parsing found ${files.length} files (max ${MAX_FILES})`);
  return files;
}

// ============================================
// AUTO-UPDATE MANIFEST FOR NEW FILES
// ============================================

function updateManifestForFiles(files: GeneratedFile[]): GeneratedFile[] {
  const manifestFile = files.find(f => f.name === 'manifest.json');
  if (!manifestFile) return files;

  try {
    const manifest = JSON.parse(manifestFile.content);
    const hasBackground = files.some(f => f.name === 'background.js');
    const hasContent = files.some(f => f.name === 'content.js');
    const hasOptions = files.some(f => f.name === 'options.html');

    let updated = false;

    // Add background service worker if exists
    if (hasBackground && !manifest.background) {
      manifest.background = {
        service_worker: 'background.js'
      };
      updated = true;
      console.log('➕ Added background to manifest');
    }

    // Add content scripts if exists
    if (hasContent && !manifest.content_scripts) {
      manifest.content_scripts = [{
        matches: ['<all_urls>'],
        js: ['content.js']
      }];
      updated = true;
      console.log('➕ Added content_scripts to manifest');
    }

    // Add options page if exists
    if (hasOptions && !manifest.options_page && !manifest.options_ui) {
      manifest.options_ui = {
        page: 'options.html',
        open_in_tab: true
      };
      updated = true;
      console.log('➕ Added options_ui to manifest');
    }

    // Update manifest file if changed
    if (updated) {
      const updatedFiles = files.map(f =>
        f.name === 'manifest.json'
          ? { ...f, content: JSON.stringify(manifest, null, 2) }
          : f
      );
      return updatedFiles;
    }

  } catch (error) {
    console.error('❌ Failed to update manifest:', error);
  }

  return files;
}

// ============================================
// GROQ API CALL (FALLBACK 1)
// ============================================

async function callGroq(
  prompt: string,
  callbacks?: StreamCallbacks,
  existingFiles?: GeneratedFile[]
): Promise<string> {
  if (!GROQ_API_KEY || GROQ_API_KEY === "") {
    throw new Error('Groq API key not configured');
  }

  // Build context from existing files
  let existingContext = '';
  if (existingFiles && existingFiles.length > 0) {
    existingContext = '\n\n=== EXISTING PROJECT FILES ===\n';
    existingFiles.forEach(file => {
      existingContext += `--- ${file.name} ---\n`;
      const preview = file.content.length > 500 ? file.content.substring(0, 500) + '...' : file.content;
      existingContext += preview + '\n';
    });
    existingContext += '\n⚠️ Keep existing functionality!\n';
  }

  const fullPrompt = `${existingContext}\n${prompt}`;

  console.log('🦙 Calling Groq (Llama 3.1 70B)...');
  callbacks?.onTerminalCommand?.({
    type: 'info',
    message: 'Switching to Groq (Llama 3.1)...',
    timestamp: new Date()
  });

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT.substring(0, 4000) },
        { role: 'user', content: fullPrompt }
      ],
      temperature: 0.4,       // Lower for consistent code
      max_tokens: 16000       // Higher for complete code
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';

  callbacks?.onTerminalCommand?.({
    type: 'success',
    message: 'Groq response received',
    timestamp: new Date()
  });

  return text;
}

// ============================================
// OPENROUTER API CALL (FALLBACK 2)
// ============================================

async function callOpenRouter(
  prompt: string,
  callbacks?: StreamCallbacks,
  existingFiles?: GeneratedFile[]
): Promise<string> {
  if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === "") {
    throw new Error('OpenRouter API key not configured');
  }

  // Build context from existing files (same as Gemini)
  let existingContext = '';
  if (existingFiles && existingFiles.length > 0) {
    existingContext = '\n\n=== EXISTING PROJECT FILES - DO NOT REPLACE, ONLY UPDATE ===\n';
    existingFiles.forEach(file => {
      existingContext += `\n--- ${file.name} ---\n`;
      const preview = file.content.length > 1000 ? file.content.substring(0, 1000) + '...[truncated]' : file.content;
      existingContext += preview + '\n';
    });
    existingContext += '\n⚠️ CRITICAL: Keep existing functionality! Only modify what user asked for.\n';
  }

  const fullUserPrompt = `${existingContext}\n\n=== USER REQUEST ===\n${prompt}\n\nGenerate COMPLETE, WORKING code that directly addresses the user's request!`;

  // Try each model until one works
  let lastError = '';
  for (let i = 0; i < OPENROUTER_FREE_MODELS.length; i++) {
    const model = OPENROUTER_FREE_MODELS[i];
    try {
      console.log(`🌐 Calling OpenRouter (${model})...`);
      callbacks?.onTerminalCommand?.({
        type: 'info',
        message: `Trying ${model.split('/')[1] || model}...`,
        timestamp: new Date()
      });

      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'ExtensionBuilder'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: fullUserPrompt }
          ],
          temperature: 0.4,     // Lower for more consistent code generation
          max_tokens: 16000,    // Higher for complete extension code
          top_p: 0.95,          // Nucleus sampling for quality
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        lastError = `${model}: ${response.status} - ${errorText}`;
        console.warn(`❌ ${model} failed:`, lastError);
        continue;
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';

      if (!text || text.length < 50) {
        lastError = `${model}: Empty or too short response`;
        console.warn(`❌ ${model} returned empty response`);
        continue;
      }

      callbacks?.onTerminalCommand?.({
        type: 'success',
        message: `Generated with ${model.split('/')[1] || model}`,
        timestamp: new Date()
      });

      return text;
    } catch (err: any) {
      lastError = `${model}: ${err.message}`;
      console.warn(`❌ ${model} error:`, err);
    }
  }

  throw new Error(`All OpenRouter free models failed. Last error: ${lastError}`);
}

// ============================================
// API CALL WITH RETRY AND FALLBACK LOGIC
// ============================================

async function callGeminiWithRetry(
  prompt: string,
  existingFiles: GeneratedFile[],
  callbacks?: StreamCallbacks,
  retryCount: number = 0
): Promise<string> {
  // Detect matching templates
  const templateContext = detectTemplate(prompt);

  // Build context from existing files
  let existingContext = '';
  if (existingFiles.length > 0) {
    existingContext = '\n\n=== EXISTING FILES (PRESERVE AND UPDATE) ===\n';
    existingFiles.forEach(file => {
      existingContext += `\n--- ${file.name} (${file.content.length} chars) ---\n`;
      // Only show first 500 chars to save tokens
      const preview = file.content.length > 500 ? file.content.substring(0, 500) + '...[truncated]' : file.content;
      existingContext += preview + '\n';
    });
    existingContext += '\n⚠️ IMPORTANT: Keep all existing functionality intact! Only add/modify what user requested.\n';
  }

  const fullPrompt = `${SYSTEM_PROMPT}\n${templateContext}\n${existingContext}\n\n=== USER REQUEST ===\n${prompt}\n\nGenerate COMPLETE, BEAUTIFUL, WORKING code following knowledge base patterns!`;

  try {
    console.log(`🤖 Calling Gemini 2.0 Flash (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
    console.log('📊 Prompt length:', fullPrompt.length, 'chars');

    callbacks?.onStatusChange?.('Connecting to AI...');
    callbacks?.onTerminalCommand?.({
      type: 'info',
      message: `Connecting to Gemini AI (attempt ${retryCount + 1})...`,
      timestamp: new Date()
    });

    // If Gemini API key is invalid, try OpenRouter FIRST
    if (!GEMINI_API_KEY || GEMINI_API_KEY === "" || GEMINI_API_KEY === "YOUR_GEMINI_KEY_HERE") {
      console.log('⚠️ Gemini API key not configured, trying OpenRouter...');

      // Try OpenRouter as PRIMARY when no Gemini key
      if (OPENROUTER_API_KEY && OPENROUTER_API_KEY !== "") {
        callbacks?.onStatusChange?.('Using OpenRouter (Free tier)...');
        callbacks?.onTerminalCommand?.({
          type: 'info',
          message: 'Gemini not configured. Using OpenRouter...',
          timestamp: new Date()
        });
        return await callOpenRouter(prompt, callbacks, existingFiles);
      }

      // Try Groq if OpenRouter also not available
      if (GROQ_API_KEY && GROQ_API_KEY !== "") {
        callbacks?.onStatusChange?.('Using Groq...');
        return await callGroq(prompt, callbacks, existingFiles);
      }

      throw new Error('No AI provider configured. Please add VITE_GEMINI_API_KEY, VITE_OPENROUTER_API_KEY, or VITE_GROQ_API_KEY to your .env file.');
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: fullPrompt }]
        }],
        generationConfig: {
          temperature: 0.4,         // Lower for consistent code
          maxOutputTokens: 16000,   // Higher for complete extensions
          topP: 0.95,
          topK: 40
        }
      })
    });

    // Handle rate limiting (429 error) - TRY FALLBACK PROVIDERS
    if (response.status === 429) {
      const errorData = await response.json().catch(() => ({}));
      console.warn(`⚠️ Rate limited (429). Retry ${retryCount + 1}/${MAX_RETRIES}`);

      callbacks?.onTerminalCommand?.({
        type: 'warning',
        message: `Gemini rate limited. Trying fallback providers...`,
        timestamp: new Date()
      });

      // Try Groq as fallback
      if (GROQ_API_KEY && GROQ_API_KEY !== "") {
        try {
          console.log('🔄 Falling back to Groq...');
          callbacks?.onStatusChange?.('Switching to Groq (Llama 3.1)...');
          const groqResult = await callGroq(prompt, callbacks, existingFiles);
          return groqResult;
        } catch (groqError) {
          console.warn('❌ Groq fallback failed:', groqError);
          callbacks?.onTerminalCommand?.({
            type: 'warning',
            message: 'Groq fallback failed, trying OpenRouter...',
            timestamp: new Date()
          });
        }
      }

      // Try OpenRouter as second fallback
      if (OPENROUTER_API_KEY && OPENROUTER_API_KEY !== "") {
        try {
          console.log('🔄 Falling back to OpenRouter...');
          callbacks?.onStatusChange?.('Switching to OpenRouter (Free tier)...');
          const orResult = await callOpenRouter(prompt, callbacks, existingFiles);
          return orResult;
        } catch (orError) {
          console.warn('❌ OpenRouter fallback failed:', orError);
        }
      }

      // If all fallbacks fail, retry Gemini with delay
      if (retryCount < MAX_RETRIES - 1) {
        callbacks?.onStatusChange?.(`All fallbacks failed. Retrying Gemini in ${RETRY_DELAYS[retryCount] / 1000}s...`);
        callbacks?.onTerminalCommand?.({
          type: 'warning',
          message: `Retrying Gemini in ${RETRY_DELAYS[retryCount] / 1000}s...`,
          timestamp: new Date()
        });
        await delay(RETRY_DELAYS[retryCount]);
        return callGeminiWithRetry(prompt, existingFiles, callbacks, retryCount + 1);
      } else {
        throw new Error(`All AI providers are rate limited. Please wait a few minutes and try again. Add VITE_GROQ_API_KEY or VITE_OPENROUTER_API_KEY to your .env file for fallback options.`);
      }
    }

    // Handle other errors
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);

      // Parse error for better message
      let errorMessage = `API error: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }

      // Retry on 500-level errors
      if (response.status >= 500 && retryCount < MAX_RETRIES - 1) {
        callbacks?.onTerminalCommand?.({
          type: 'warning',
          message: `Server error. Retrying in ${RETRY_DELAYS[retryCount] / 1000}s...`,
          timestamp: new Date()
        });
        await delay(RETRY_DELAYS[retryCount]);
        return callGeminiWithRetry(prompt, existingFiles, callbacks, retryCount + 1);
      }

      throw new Error(errorMessage);
    }

    callbacks?.onStatusChange?.('Processing response...');
    callbacks?.onTerminalCommand?.({
      type: 'success',
      message: 'Connected to Gemini AI successfully',
      timestamp: new Date()
    });

    const data = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('Gemini returned no response candidates');
    }

    const text = data.candidates[0].content.parts[0].text;

    // Stream the response in chunks for typewriter effect
    if (callbacks?.onChunk) {
      const chunkSize = 50;
      for (let i = 0; i < text.length; i += chunkSize) {
        callbacks.onChunk(text.substring(0, i + chunkSize));
        await delay(10); // Small delay for visual effect
      }
    }

    console.log('✅ Gemini generated:', text.length, 'chars');

    callbacks?.onTerminalCommand?.({
      type: 'success',
      message: `Received ${text.length} chars from AI`,
      timestamp: new Date()
    });

    return text;

  } catch (error: any) {
    console.error('❌ Gemini API error:', error);

    callbacks?.onTerminalCommand?.({
      type: 'error',
      message: `Error: ${error.message}`,
      timestamp: new Date()
    });

    // Don't retry on invalid API key
    if (error.message.includes('API key')) {
      throw error;
    }

    // Retry on network errors
    if (retryCount < MAX_RETRIES - 1 && (error.name === 'TypeError' || error.message.includes('network'))) {
      callbacks?.onStatusChange?.(`Network error. Retrying in ${RETRY_DELAYS[retryCount] / 1000}s...`);
      await delay(RETRY_DELAYS[retryCount]);
      return callGeminiWithRetry(prompt, existingFiles, callbacks, retryCount + 1);
    }

    throw new Error(`Failed to generate code: ${error.message}`);
  }
}

// ============================================
// MAIN GENERATION FUNCTION
// ============================================

export async function generateExtensionCode(
  prompt: string,
  existingFiles: GeneratedFile[] = [],
  conversationHistory: Message[] = [],
  onChunk?: (chunk: string) => void,
  onFileComplete?: (file: GeneratedFile) => void,
  callbacks?: StreamCallbacks
): Promise<GenerateResponse> {
  // Create unified callbacks
  const unifiedCallbacks: StreamCallbacks = {
    onChunk: onChunk || callbacks?.onChunk,
    onFileComplete: onFileComplete || callbacks?.onFileComplete,
    onFileStart: callbacks?.onFileStart,
    onFileProgress: callbacks?.onFileProgress,
    onTerminalCommand: callbacks?.onTerminalCommand,
    onStatusChange: callbacks?.onStatusChange
  };

  try {
    console.log('🚀 Starting code generation...');
    console.log('📝 Prompt:', prompt);
    console.log('📁 Existing files:', existingFiles.length);

    unifiedCallbacks.onStatusChange?.('Analyzing request...');
    unifiedCallbacks.onTerminalCommand?.({
      type: 'command',
      message: `Received prompt: "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}"`,
      timestamp: new Date()
    });

    const isUpdate = existingFiles.length > 0 &&
      /(update|change|modify|fix|add|improve|create|new file|add file|enhance)/i.test(prompt);

    console.log('🔄 Is update:', isUpdate);

    unifiedCallbacks.onStatusChange?.('Generating code...');
    unifiedCallbacks.onTerminalCommand?.({
      type: 'info',
      message: isUpdate ? 'Updating existing extension...' : 'Generating new extension...',
      timestamp: new Date()
    });

    const text = await callGeminiWithRetry(prompt, existingFiles, unifiedCallbacks);

    // Parse generated files
    unifiedCallbacks.onStatusChange?.('Parsing files...');
    const newFiles = parseGeneratedFiles(text, unifiedCallbacks);

    // Extract explanation
    let explanation = '';
    const explainMatch = text.match(/EXPLANATION:\s*(.+?)(?=\n|$)/i);
    if (explainMatch) {
      explanation = explainMatch[1].trim();
    }

    if (newFiles.length === 0) {
      throw new Error('No files were generated. Please try a more specific prompt.');
    }

    console.log('📦 Generated files:', newFiles.map(f => f.name).join(', '));

    unifiedCallbacks.onTerminalCommand?.({
      type: 'info',
      message: `Generated ${newFiles.length} files: ${newFiles.map(f => f.name).join(', ')}`,
      timestamp: new Date()
    });

    // Merge with existing files if updating
    let finalFiles = isUpdate && existingFiles.length > 0
      ? mergeFiles(existingFiles, newFiles)
      : newFiles;

    // Auto-update manifest for new files
    finalFiles = updateManifestForFiles(finalFiles);

    // Smart sorting - manifest first, then html, css, js, then others
    const order = [
      'manifest.json',
      'index.html', 'styles.css', 'script.js',
      'background.js',
      'content.js',
      'options.html', 'options.css', 'options.js'
    ];

    finalFiles.sort((a, b) => {
      const ai = order.indexOf(a.name);
      const bi = order.indexOf(b.name);
      if (ai === -1 && bi === -1) return a.name.localeCompare(b.name);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });

    console.log('✅ Final files:', finalFiles.map(f => `${f.name} (${f.content.length} chars)`));

    unifiedCallbacks.onStatusChange?.('Complete!');
    unifiedCallbacks.onTerminalCommand?.({
      type: 'success',
      message: `✓ Build complete! ${finalFiles.length} files ready`,
      timestamp: new Date()
    });

    return {
      response: `Successfully generated ${finalFiles.length} file${finalFiles.length > 1 ? 's' : ''} with beautiful UI and working functionality!`,
      explanation: explanation || `Chrome extension with ${finalFiles.length} files including modern design and full functionality`,
      files: finalFiles,
      buildInstructions: {
        hasReact: false,
        needsInstall: false
      }
    };

  } catch (error: any) {
    console.error('❌ Generation error:', error);

    unifiedCallbacks.onStatusChange?.('Error');
    unifiedCallbacks.onTerminalCommand?.({
      type: 'error',
      message: `Build failed: ${error.message}`,
      timestamp: new Date()
    });

    throw new Error(`Code generation failed: ${error.message}`);
  }
}

// ============================================
// VALIDATION & METADATA
// ============================================

export function validateExtension(files: GeneratedFile[]) {
  const required = ['manifest.json', 'popup.html', 'popup.js'];
  const names = files.map(f => f.name);
  const missing = required.filter(f => !names.includes(f));

  const warnings = [];

  // Check for popup.css
  if (!names.includes('popup.css')) {
    warnings.push('Missing popup.css - extension may not be styled');
  }

  // Check manifest content
  const manifest = files.find(f => f.name === 'manifest.json');
  if (manifest) {
    try {
      const parsed = JSON.parse(manifest.content);
      if (!parsed.manifest_version) warnings.push('Manifest missing manifest_version');
      if (!parsed.name) warnings.push('Manifest missing name');
      if (!parsed.version) warnings.push('Manifest missing version');
    } catch (e) {
      warnings.push('Manifest JSON is invalid');
    }
  }

  return {
    isValid: missing.length === 0,
    missingFiles: missing,
    warnings
  };
}

export function extractExtensionMetadata(files: GeneratedFile[]) {
  const manifest = files.find(f => f.name === 'manifest.json');
  if (!manifest) return { name: 'Extension', version: '1.0.0', description: 'Chrome Extension' };

  try {
    const parsed = JSON.parse(manifest.content);
    return {
      name: parsed.name || 'Extension',
      version: parsed.version || '1.0.0',
      description: parsed.description || 'Chrome Extension'
    };
  } catch (e) {
    return { name: 'Extension', version: '1.0.0', description: 'Chrome Extension' };
  }
}

export default {
  generateExtensionCode,
  validateExtension,
  extractExtensionMetadata
};
