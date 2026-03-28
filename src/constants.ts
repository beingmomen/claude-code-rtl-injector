export const CLAUDE_EXTENSION_ID = 'anthropic.claude-code';
export const WEBVIEW_CSS_PATH = 'webview/index.css';
export const WEBVIEW_JS_PATH = 'webview/index.js';
export const MARKER_START = '/* === RTL_INJECTOR_START === */';
export const MARKER_END = '/* === RTL_INJECTOR_END === */';
export const JS_MARKER_START = '/* === RTL_JS_INJECTOR_START === */';
export const JS_MARKER_END = '/* === RTL_JS_INJECTOR_END === */';
export const OLD_MANUAL_MARKER = '/* === RTL / Arabic Support === */';

// Global state keys
export const STATE_KEY_VERSION = 'claudeCodeRtl.lastInjectedVersion';
export const STATE_KEY_RTL_VERSION = 'claudeCodeRtl.lastRtlExtensionVersion';

// CSS module class name bases used in the RTL CSS template.
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
];
