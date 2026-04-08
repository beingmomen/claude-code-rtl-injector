# Claude Code RTL Injector - Project Guidelines

VS Code extension that automatically injects RTL CSS/JS into Claude Code's webview. Handles CSS Module hash remapping across Claude Code version updates.

See [README.md](../README.md) for project overview and installation.

---

## Architecture

**Core Challenge:** Claude Code uses CSS Modules with version-dependent hashes (e.g., `.userMessage_07S1Yg`). When Claude Code updates, both the hashes **and** the class names may change.

**Module Responsibilities:**
- **[detector.ts](../src/detector.ts)** - Locates Claude Code extension, extracts current CSS module hashes via regex, tracks version changes
- **[injector.ts](../src/injector.ts)** - Hash remapping engine: reads RTL template, finds current hashes in Claude Code CSS, search-replaces placeholder→current hashes, appends between markers
- **[extension.ts](../src/extension.ts)** - Auto-injection orchestrator (on startup & extension changes) + 3 user commands
- **[constants.ts](../src/constants.ts)** - 22 CSS class name bases, marker strings, VS Code state keys

**Injection Flow:**
1. Detect Claude Code path → read `webview/index.css`
2. Extract current hashes from CSS (regex on 22 known class bases)
3. Read RTL template from [css/rtl-support.css](../css/rtl-support.css)
4. Remap placeholder hashes → current hashes
5. Append remapped CSS between markers + backup original
6. Inject [js/rtl-observer.js](../js/rtl-observer.js) (sets `dir="auto"` via MutationObserver)

---

## Build and Test

```bash
npm run compile     # TypeScript → /out/ (one-time)
npm run watch       # Watch mode for development
npm run test        # Mocha tests via @vscode/test-electron
npm run package     # Create .vsix bundle
```

**Test Discovery:** `**/*.test.js` glob in compiled `out/test/suite/`  
**Activation:** `onStartupFinished` event (VS Code ≥1.94.0)  
**Entry Point:** `out/extension.js`

---

## Code Style

**Error Handling Pattern:**
Return result objects instead of throwing. All operations return `{ success: boolean; message: string; ... }`:
```typescript
{
  success: true,
  message: "RTL CSS injected successfully. 5 hashes remapped.",
  hashesRemapped: 5,
  unmatchedBases: []
}
```

**State Management:**
- Use `context.globalState` for cross-session storage
- Keys: `claudeCodeRtl.lastInjectedVersion`, `claudeCodeRtl.lastRtlExtensionVersion`
- Re-inject when either version changes

**Naming:**
- Function prefixes: `detect*`, `inject*`, `remove*`, `is*` (Boolean checks)
- Backup suffix: `.rtl-backup`
- Markers: `/* === RTL_INJECTOR_START === */` (CSS comments)

---

## Conventions

**Hash Extraction Takes First Match Only:**
`extractCurrentHashes()` uses regex `exec()` which stops at first hit per class base. If Claude Code has multiple variations of a class (e.g., `.userMessage_abc`, `.userMessage_xyz`), only the first is detected. This is intentional—assumes one primary hash per base.

**Unmatched Classes are Warnings, Not Errors:**
If a class base isn't found in current Claude Code CSS (e.g., UI element removed), it's marked "unmatched" but injection continues. User sees warning in notification.

**File Path Assumptions:**
Hardcoded `webview/index.css` and `webview/index.js`. If Claude Code reorganizes files, extension fails silently—no error shown to user.

**User Edits Between Markers are Lost:**
Re-injection clears and rewrites the marked block. Mitigation: `.rtl-backup` files preserve original.

---

## Maintenance: When Claude Code Updates

If RTL support breaks after Claude Code update:

1. **Extract new hashes:** Run `npm run test` to see which hashes failed to remap
2. **Update RTL template:** Modify [css/rtl-support.css](../css/rtl-support.css) with new hashes from Claude Code's `webview/index.css`
3. **Update class bases:** If class names changed (not just hashes), update `CLASS_NAME_BASES` in [constants.ts](../src/constants.ts)
4. **Update JS selectors:** If DOM structure changed, update wildcard selectors in [js/rtl-observer.js](../js/rtl-observer.js) (e.g., `[class*="userMessage_"]`)
5. **Test:** Run `npm run test` to verify hash remapping and marker detection pass

**Key Test Files:**
- [detector.test.ts](../src/test/suite/detector.test.ts) - Hash extraction tests
- [injector.test.ts](../src/test/suite/injector.test.ts) - Hash remapping and marker detection (critical reference for understanding `remapHashes()` behavior)

---

## Critical Files

**Must sync with Claude Code changes:**
- [css/rtl-support.css](../css/rtl-support.css) - RTL rules template (placeholder hashes)
- [src/constants.ts](../src/constants.ts) - `CLASS_NAME_BASES` array (22 class name patterns)
- [js/rtl-observer.js](../js/rtl-observer.js) - DOM observer selectors

**Core logic (modify carefully):**
- [src/injector.ts](../src/injector.ts) - `remapHashes()` function is the heart of the extension
- [src/detector.ts](../src/detector.ts) - Version tracking and hash extraction regex

---

## Common Pitfalls

1. **Silent failures when Claude Code not found:** `detectClaudeCode()` returns `undefined`; auto-injection silently skips. Manual commands show warnings.

2. **Version change triggers re-injection on every activation:** If Claude Code version constant changes in package.json (even patch updates), user sees reload notification repeatedly. This is intentional—ensures CSS stays in sync.

3. **JavaScript selector fragility:** JS observer uses `[class*="userMessage_"]` wildcards. If Claude Code renames these classes entirely (not just hash changes), observer stops working.

4. **Mocha timeout on slow systems:** Default 10s timeout in [src/test/suite/index.ts](../src/test/suite/index.ts). Increase if tests timeout on slow machines.
