# Changelog

All notable changes to the "Claude Code RTL Support" extension will be documented in this file.

## [0.2.0] - 2026-03-28

### Fixed
- **Input caret desync**: Arabic typing now has synchronized caret and text direction in chat input field (fixes #1)
- **User message bubble alignment**: Sent Arabic messages now render as proper RTL inside the user message bubble (fixes #1)

### Added
- `direction: rtl` on `.messageInput` container for correct caret positioning
- `direction: rtl` on `.userMessage` container for proper bubble alignment
- LTR protection for code blocks inside user messages (`pre`, `code`)

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
