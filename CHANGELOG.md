# Changelog

All notable changes to the "Claude Code RTL Support" extension will be documented in this file.

## [0.8.0] - 2026-04-08

### Fixed
- **Copilot Chat RTL now actually works**: Previous Shadow DOM JS approach targeted `suggestionsPanelWebview.js` which only powers inline code suggestions, NOT the chat panel
- Copilot Chat's CHAT panel uses VS Code's **native Chat Provider API** — its UI is rendered by VS Code's workbench, not a custom webview

### Changed
- New `injectionMode: 'workbench-css'` strategy: injects RTL CSS directly into VS Code's `workbench.desktop.main.css`
- Created `css/rtl-copilot-chat.css` — RTL template targeting native chat classes (`.interactive-session`, `.interactive-item-container`, `.rendered-markdown`, etc.)
- Updated `detector.ts` — added `resolveWorkbenchCssPath()` using `vscode.env.appRoot` for cross-platform path resolution
- Updated `injector.ts` — added `injectRtlWorkbenchCss()` and `removeRtlWorkbenchCss()` functions
- Updated `extension.ts` — workbench-css branch in `injectForTarget()`, `manualRemove()`, and `checkStatus()`
- Added `workbenchCssPath` to `ExtensionInfo` interface

### Notes
- Writing to VS Code's workbench files requires write permissions on the installation directory
- VS Code may show an "[Unsupported]" warning after workbench modification — this is expected and harmless
- VS Code updates will overwrite the workbench file — the extension re-injects automatically on startup

## [0.7.0] - 2026-04-08

### Added
- **GitHub Copilot Chat support**: RTL injection now works with `github.copilot-chat` using a new Shadow DOM JS injection mode
- New `injectionMode: 'shadow-dom-js'` strategy that patches `adoptedStyleSheets` on all open shadow roots via a `MutationObserver`
- New bundled asset `js/rtl-shadow-dom.js` — IIFE that injects `unicode-bidi: plaintext` into every shadow root discovered in the webview
- `ExtensionTarget.injectionMode` field in `constants.ts` to support multiple injection strategies per extension

### Changed
- `webviewCssPath` is now optional in `ExtensionTarget` (not needed for shadow-dom-js targets)
- `cssFilePath` in `ExtensionInfo` is now optional
- `detectExtensions()` branches on `injectionMode` to handle CSS vs Shadow DOM JS targets separately
- All commands (`inject`, `remove`, `status`) now route correctly based on the target's injection mode
- Package description updated to mention Copilot Chat

### Supported Extensions
- `anthropic.claude-code` — CSS + hash remapping + JS observer
- `openai.chatgpt` (Codex) — Direct CSS injection with attribute selectors
- `github.copilot-chat` — Shadow DOM JS injection via `adoptedStyleSheets`

## [0.6.0] - 2026-03-29

### Fixed
- **Per-line direction detection in chat input**: Each line now independently detects its text direction (Arabic RTL, English LTR) even in mixed multi-line input (fixes #1)
- Root cause: `mentionMirror` (visible text overlay) lacked `unicode-bidi: plaintext` — it's a sibling of `.messageInput`, not a child, so `*` selector didn't reach it

### Added
- `unicode-bidi: plaintext` CSS rules for `mentionMirror` and `messageInputContainer`
- `mentionMirror` and `messageInputContainer` added to hash remapping class list

### Changed
- Removed per-keystroke `dir` override from JS — now relies on CSS `unicode-bidi: plaintext` for per-paragraph direction detection
- JS observer simplified to only set `dir="auto"` on element creation

## [0.5.0] - 2026-03-28

### Fixed
- **Input caret desync with Arabic text**: Added `input` event listener that detects text direction on every keystroke and propagates `dir` to the contenteditable, its mirror element (`mentionMirror`), and parent container (fixes #1)

### Changed
- JS observer now uses explicit `dir="rtl"` / `dir="ltr"` based on first strong character detection instead of relying solely on `dir="auto"` for input fields
- Direction propagated to `mentionMirror` (visible text overlay) and `messageInputContainer` (parent layout)

## [0.4.0] - 2026-03-28

### Fixed
- **English messages incorrectly RTL**: Replaced CSS-only `direction: rtl` with JavaScript `dir="auto"` injection — browser now auto-detects text direction per message (fixes #1)
- **Input caret desync**: `dir="auto"` on the contenteditable input field properly syncs caret with Arabic text direction (fixes #1)
- **Auto-inject not updating on RTL extension upgrade**: Tracks RTL extension version to re-inject when upgraded

### Added
- **JavaScript injection**: MutationObserver script injected into Claude Code's `webview/index.js` alongside CSS
- `dir="auto"` automatically applied to `.userMessage` and `.messageInput` elements
- JS backup system (`index.js.rtl-backup`) mirrors CSS backup approach
- JS injection status shown in "Check Status" command

### Changed
- Removed CSS `direction: rtl` from `.userMessage` and `.messageInput` — direction now handled by `dir="auto"` from JS
- Injection system now manages both CSS and JS files

## [0.1.0] - 2026-03-23

### Added
- Automatic RTL CSS injection into Claude Code webview
- Hash auto-remapping for CSS module class names across Claude Code versions
- Auto-detection of Claude Code updates with re-injection
- Manual inject/remove/status commands via Command Palette
- Automatic backup of original CSS files before modification
- Support for 22+ UI elements (user messages, assistant responses, input field, etc.)
- Code blocks remain LTR (left-to-right) as expected
- Old manual injection cleanup
- Bilingual README (Arabic/English)
