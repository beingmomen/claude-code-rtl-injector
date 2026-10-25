# Changelog

All notable changes to the "Claude Code RTL Support" extension will be documented in this file.

## [0.6.1] - 2026-10-25

### Fixed
- **List markers on the wrong side in Arabic assistant replies**: Bullets (`•`) and numbers (`1.` `2.`) were drawn on the left while the Arabic item text was right-aligned
- Root cause: `unicode-bidi: plaintext` on `li` fixes each line's text direction, but the `ul`/`ol` containers kept the inherited LTR direction, so marker placement stayed left

### Changed
- JS observer now also sets `dir="auto"` on `ul`/`ol` inside the assistant markdown root (matched by the `root_` class prefix, so it survives Claude Code hash changes) — Arabic lists get markers on the right, English lists stay on the left, nested lists and streamed replies included

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
