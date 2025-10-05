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

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "YOUR_GEMINI_KEY_HERE";
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

// ============================================
// ENHANCED SYSTEM PROMPT WITH KNOWLEDGE BASE
// ============================================

const SYSTEM_PROMPT = `You are an EXPERT Chrome Extension developer with access to a comprehensive knowledge base.

=== KNOWLEDGE BASE ===
${JSON.stringify(knowledgeBase, null, 2)}

=== CRITICAL REQUIREMENTS ===
1. Create STUNNING UI with modern design (gradients, shadows, smooth animations)
2. ALL buttons MUST work with proper event listeners
3. Use chrome.storage.local for data persistence
4. You can create ANY files needed: manifest.json, popup.html, popup.css, popup.js, background.js, content.js, options.html, etc.
5. Add visual feedback (hover effects, loading states, animations)
6. Make it responsive and professional
7. Use modern CSS (flexbox, grid, transitions)
8. NEVER use smart quotes - only straight quotes ' and "
9. All buttons should be functional and working
10. Create as many files as needed for the feature
11. If user asks for background script, create background.js
12. If user asks for content script, create content.js
13. If user asks for options page, create options.html, options.css, options.js
14. Think properly and write ERROR-FREE code
15. Each button should be well working and functional
16. When updating, ONLY change what user requested, keep everything else intact

=== FILE NAMING FLEXIBILITY ===
You can create ANY of these files (or others as needed):
- manifest.json (REQUIRED)
- popup.html, popup.css, popup.js (for popup UI)
- background.js (for background service worker)
- content.js (for content scripts on web pages)
- options.html, options.css, options.js (for settings)
- utils.js, storage.js, api.js (for utilities)
- ANY other .js, .html, .css files needed!

=== TEMPLATE MATCHING ===
- If user says "todo" or "task": Use todo_list template
- If user says "timer" or "pomodoro": Use pomodoro_timer template
- If user says "bookmark" or "save": Use bookmark_manager template
- If user says "notes" or "memo": Use note_taking template
- If user says "dark mode" or "theme": Use dark_mode template

=== OUTPUT FORMAT (STRICT) ===

EXPLANATION: [One sentence describing what was created/updated]

=== manifest.json ===
{
  "manifest_version": 3,
  "name": "Extension Name",
  "version": "1.0.0",
  "description": "Description here",
  "permissions": ["storage"],
  "action": {
    "default_popup": "popup.html",
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

=== popup.html ===
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Extension Title</title>
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <div class="container">
    <!-- content -->
  </div>
  <script src="popup.js"></script>
</body>
</html>

=== popup.css ===
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  width: 400px;
  min-height: 500px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* More styles... */

=== popup.js ===
document.addEventListener('DOMContentLoaded', function() {
  'use strict';
  console.log('Extension loaded');
  
  // Initialize and setup event listeners
});

=== background.js ===
// Background service worker (if needed)
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});

=== content.js ===
// Content script (if needed)
console.log('Content script loaded');

CREATE ALL FILES NEEDED WITH COMPLETE WORKING CODE!`;

// ============================================
// HELPER FUNCTIONS
// ============================================

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
// IMPROVED FILE PARSING - DYNAMIC
// ============================================

function parseGeneratedFiles(text: string, onFileComplete?: (file: GeneratedFile) => void): GeneratedFile[] {
  const newFiles: GeneratedFile[] = [];
  
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
    
    // Clean code blocks
    content = cleanCodeBlock(content);
    content = fixSmartQuotes(content);
    content = content.replace(/\n*===.*$/s, '').trim();
    
    if (content.length < 10) {
      console.warn(`⚠️ File ${filename} too short (${content.length} chars), skipping`);
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
    
    if (onFileComplete) {
      onFileComplete(file);
    }
  }
  
  // If no files found with === markers, try alternative parsing
  if (newFiles.length === 0) {
    console.warn('⚠️ No files found with === markers, trying alternative parsing...');
    newFiles.push(...tryAlternativeParsing(text));
  }
  
  return newFiles;
}

// Alternative parsing for when AI doesn't use === markers
function tryAlternativeParsing(text: string): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  
  // Try to extract JSON blocks for manifest
  const jsonMatch = text.match(/``````/);
  if (jsonMatch) {
    files.push({
      name: 'manifest.json',
      path: 'manifest.json',
      content: jsonMatch[1].trim(),
      language: 'json'
    });
  }
  
  // Try to extract HTML
  const htmlMatches = text.matchAll(/``````/g);
  let htmlIndex = 0;
  for (const match of htmlMatches) {
    const filename = htmlIndex === 0 ? 'popup.html' : 
                     htmlIndex === 1 ? 'options.html' : 
                     `page${htmlIndex}.html`;
    files.push({
      name: filename,
      path: filename,
      content: match[1].trim(),
      language: 'html'
    });
    htmlIndex++;
  }
  
  // Try to extract CSS
  const cssMatches = text.matchAll(/``````/g);
  let cssIndex = 0;
  for (const match of cssMatches) {
    const filename = cssIndex === 0 ? 'popup.css' : 
                     cssIndex === 1 ? 'options.css' : 
                     `style${cssIndex}.css`;
    files.push({
      name: filename,
      path: filename,
      content: match[1].trim(),
      language: 'css'
    });
    cssIndex++;
  }
  
  // Try to extract JavaScript
  const jsMatches = text.matchAll(/``````/g);
  let jsIndex = 0;
  for (const match of jsMatches) {
    const filename = jsIndex === 0 ? 'popup.js' : 
                     jsIndex === 1 ? 'background.js' : 
                     jsIndex === 2 ? 'content.js' :
                     `script${jsIndex}.js`;
    files.push({
      name: filename,
      path: filename,
      content: match[1].trim(),
      language: 'javascript'
    });
    jsIndex++;
  }
  
  console.log(`✅ Alternative parsing found ${files.length} files`);
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
// API CALL
// ============================================

async function callGemini(prompt: string, existingFiles: GeneratedFile[], onChunk?: (chunk: string) => void): Promise<string> {
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
    console.log('🤖 Calling Gemini 2.0 Flash with knowledge base...');
    console.log('📊 Prompt length:', fullPrompt.length, 'chars');
    
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: fullPrompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8000,
          topP: 0.9,
          topK: 40
        }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('Gemini returned no response candidates');
    }
    
    const text = data.candidates[0].content.parts[0].text;
    
    if (onChunk) onChunk(text);
    
    console.log('✅ Gemini generated:', text.length, 'chars');
    return text;
    
  } catch (error: any) {
    console.error('❌ Gemini API error:', error);
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
  onFileComplete?: (file: GeneratedFile) => void
): Promise<GenerateResponse> {
  try {
    console.log('🚀 Starting code generation...');
    console.log('📝 Prompt:', prompt);
    console.log('📁 Existing files:', existingFiles.length);
    
    const isUpdate = existingFiles.length > 0 && 
      /(update|change|modify|fix|add|improve|create|new file|add file|enhance)/i.test(prompt);
    
    console.log('🔄 Is update:', isUpdate);
    
    const text = await callGemini(prompt, existingFiles, onChunk);
    
    // Parse generated files
    const newFiles = parseGeneratedFiles(text, onFileComplete);
    
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
    
    // Merge with existing files if updating
    let finalFiles = isUpdate && existingFiles.length > 0 
      ? mergeFiles(existingFiles, newFiles) 
      : newFiles;
    
    // Auto-update manifest for new files
    finalFiles = updateManifestForFiles(finalFiles);
    
    // Smart sorting - manifest first, then html, css, js, then others
    const order = [
      'manifest.json', 
      'popup.html', 'popup.css', 'popup.js',
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
