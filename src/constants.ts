export const MARKER_START = '/* === RTL_INJECTOR_START === */';
export const MARKER_END = '/* === RTL_INJECTOR_END === */';
export const JS_MARKER_START = '/* === RTL_JS_INJECTOR_START === */';
export const JS_MARKER_END = '/* === RTL_JS_INJECTOR_END === */';
export const OLD_MANUAL_MARKER = '/* === RTL / Arabic Support === */';

// Global state keys
export const STATE_KEY_RTL_VERSION = 'aiRtl.lastRtlExtensionVersion';

// CSS module class name bases for Claude Code.
// The hash suffixes (e.g., _07S1Yg) change between Claude Code versions.
// We extract current hashes from the target CSS and remap them before injection.
export const CLASS_NAME_BASES = [
  'userMessage',
  'root',
  'messageInput',
  'timelineMessage',
  'progressContent',
  'permissionRequestContent',
  'permissionRequestDescription',
  'permissionRequestHeader',
  'content',
  'slashCommandResultMessage',
  'errorMessage',
  'metaMessage',
  'interruptedMessage',
  'questionText',
  'answerText',
  'questionTextLarge',
  'optionLabel',
  'optionDescription',
  'sessionName',
  'sessionsButtonText',
  'sessionsButtonContent',
  'bashCommand',
  'toolBodyRowContent',
  'mentionMirror',
  'messageInputContainer',
];

export interface ExtensionTarget {
  /** VS Code extension identifier (e.g. 'anthropic.claude-code') */
  id: string;
  /** Human-readable name shown in notifications */
  displayName: string;
  /** Injection strategy: 'css' (default) appends to CSS file; 'shadow-dom-js' injects a JS patch into a webview bundle */
  injectionMode?: 'css' | 'shadow-dom-js';
  /** Path to webview CSS relative to extensionPath. Supports glob (e.g. 'assets/index-*.css') when webviewCssIsGlob=true. Not required for shadow-dom-js mode. */
  webviewCssPath?: string;
  /** When true, webviewCssPath is treated as a glob pattern and the first match is used */
  webviewCssIsGlob?: boolean;
  /** Path to webview JS relative to extensionPath, or undefined if JS injection not supported */
  webviewJsPath?: string;
  /** CSS module class name bases whose hashes need remapping. Empty array = no hash remapping. */
  classNameBases: string[];
  /** Filename inside css/ directory to use as the RTL CSS template. Empty string for shadow-dom-js mode. */
  cssTplFile: string;
}

export const TARGET_EXTENSIONS: ExtensionTarget[] = [
  {
    id: 'anthropic.claude-code',
    displayName: 'Claude Code',
    webviewCssPath: 'webview/index.css',
    webviewJsPath: 'webview/index.js',
    classNameBases: CLASS_NAME_BASES,
    cssTplFile: 'rtl-support.css',
  },
  {
    id: 'openai.chatgpt',
    displayName: 'Codex',
    webviewCssPath: 'webview/assets/index-*.css',
    webviewCssIsGlob: true,
    classNameBases: [],
    cssTplFile: 'rtl-chatgpt.css',
  },
  {
    id: 'github.copilot-chat',
    displayName: 'Copilot Chat',
    injectionMode: 'shadow-dom-js',
    webviewJsPath: 'dist/suggestionsPanelWebview.js',
    classNameBases: [],
    cssTplFile: '',
  },
];
