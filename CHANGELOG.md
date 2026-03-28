# Changelog

All notable changes to the "Claude Code RTL Support" extension will be documented in this file.

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
