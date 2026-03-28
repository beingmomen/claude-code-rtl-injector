import * as fs from 'fs';
import * as path from 'path';
import { MARKER_START, MARKER_END, JS_MARKER_START, JS_MARKER_END, OLD_MANUAL_MARKER, CLASS_NAME_BASES } from './constants';
import { HashMap } from './detector';

export interface InjectResult {
  success: boolean;
  message: string;
  hashesRemapped: number;
  unmatchedBases: string[];
}

/**
 * Read the RTL CSS template bundled with this extension.
 */
export function readRtlTemplate(extensionPath: string): string {
  const templatePath = path.join(extensionPath, 'css', 'rtl-support.css');
  return fs.readFileSync(templatePath, 'utf-8');
}

/**
 * Extract hashes used in the RTL CSS template itself.
 * Returns a map of baseName -> hash found in the template.
 */
function extractTemplateHashes(templateCss: string): HashMap {
  const hashMap: HashMap = {};
  for (const baseName of CLASS_NAME_BASES) {
    const regex = new RegExp(`\\.${baseName}_([a-zA-Z0-9_-]+)`, 'g');
    const match = regex.exec(templateCss);
    if (match) {
      hashMap[baseName] = match[1];
    }
  }
  return hashMap;
}

/**
 * Remap hashes in the RTL CSS template to match current Claude Code hashes.
 * Returns the remapped CSS and statistics.
 */
export function remapHashes(
  templateCss: string,
  currentHashes: HashMap
): { css: string; remapped: number; unmatched: string[] } {
  const templateHashes = extractTemplateHashes(templateCss);
  let css = templateCss;
  let remapped = 0;
  const unmatched: string[] = [];

  for (const baseName of CLASS_NAME_BASES) {
    const templateHash = templateHashes[baseName];
    const currentHash = currentHashes[baseName];

    if (!templateHash) {
      // This base name isn't used in the template, skip
      continue;
    }

    if (!currentHash) {
      // Can't find this class in the current Claude Code CSS
      unmatched.push(baseName);
      continue;
    }

    if (templateHash !== currentHash) {
      // Replace all occurrences of the old hash with the new one for this base name
      const oldClass = `${baseName}_${templateHash}`;
      const newClass = `${baseName}_${currentHash}`;
      css = css.split(oldClass).join(newClass);
      remapped++;
    }
  }

  return { css, remapped, unmatched };
}

/**
 * Check if RTL CSS is already injected (by our extension markers).
 */
export function isAlreadyInjected(cssContent: string): boolean {
  return cssContent.includes(MARKER_START) && cssContent.includes(MARKER_END);
}

/**
 * Remove previously injected RTL CSS (between markers).
 */
function removeInjectedBlock(cssContent: string): string {
  const startIdx = cssContent.indexOf(MARKER_START);
  const endIdx = cssContent.indexOf(MARKER_END);

  if (startIdx === -1 || endIdx === -1) {
    return cssContent;
  }

  const before = cssContent.substring(0, startIdx).trimEnd();
  const after = cssContent.substring(endIdx + MARKER_END.length).trimStart();

  return after ? `${before}\n${after}` : before;
}

/**
 * Remove old manual injection (everything from the old marker to the end).
 */
function removeOldManualInjection(cssContent: string): string {
  const idx = cssContent.indexOf(OLD_MANUAL_MARKER);
  if (idx === -1) {
    return cssContent;
  }
  return cssContent.substring(0, idx).trimEnd();
}

/**
 * Create a backup of the original CSS file if one doesn't already exist.
 */
function ensureBackup(cssFilePath: string): void {
  const backupPath = cssFilePath + '.rtl-backup';
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(cssFilePath, backupPath);
  }
}

/**
 * Inject RTL CSS into Claude Code's webview CSS file.
 */
export function injectRtlCss(
  cssFilePath: string,
  extensionPath: string,
  currentHashes: HashMap
): InjectResult {
  try {
    // Backup original
    ensureBackup(cssFilePath);

    // Read current CSS
    let cssContent = fs.readFileSync(cssFilePath, 'utf-8');

    // Remove existing injection if present
    if (isAlreadyInjected(cssContent)) {
      cssContent = removeInjectedBlock(cssContent);
    }

    // Remove old manual injection if present
    cssContent = removeOldManualInjection(cssContent);

    // Read and remap RTL template
    const template = readRtlTemplate(extensionPath);
    const { css: remappedCss, remapped, unmatched } = remapHashes(template, currentHashes);

    // Build injection block
    const injectionBlock = [
      '',
      '',
      MARKER_START,
      `/* Injected by Claude Code RTL Support extension */`,
      `/* Do not edit manually - this block is managed automatically */`,
      '',
      remappedCss,
      '',
      MARKER_END,
    ].join('\n');

    // Append to CSS
    cssContent = cssContent.trimEnd() + injectionBlock + '\n';

    // Write back
    fs.writeFileSync(cssFilePath, cssContent, 'utf-8');

    const unmatchedMsg = unmatched.length > 0
      ? ` (${unmatched.length} unmatched classes: ${unmatched.join(', ')})`
      : '';

    return {
      success: true,
      message: `RTL CSS injected successfully. ${remapped} hashes remapped.${unmatchedMsg}`,
      hashesRemapped: remapped,
      unmatchedBases: unmatched,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `Failed to inject RTL CSS: ${msg}`,
      hashesRemapped: 0,
      unmatchedBases: [],
    };
  }
}

/**
 * Remove injected RTL CSS from Claude Code's webview CSS file.
 */
export function removeRtlCss(cssFilePath: string): { success: boolean; message: string } {
  try {
    let cssContent = fs.readFileSync(cssFilePath, 'utf-8');

    if (!isAlreadyInjected(cssContent)) {
      return { success: false, message: 'No injected RTL CSS found.' };
    }

    cssContent = removeInjectedBlock(cssContent);
    fs.writeFileSync(cssFilePath, cssContent + '\n', 'utf-8');

    return { success: true, message: 'RTL CSS removed successfully.' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Failed to remove RTL CSS: ${msg}` };
  }
}

// ─── JavaScript Injection ────────────────────────────────────────────

/**
 * Read the RTL JS observer template bundled with this extension.
 */
function readJsTemplate(extensionPath: string): string {
  const templatePath = path.join(extensionPath, 'js', 'rtl-observer.js');
  return fs.readFileSync(templatePath, 'utf-8');
}

/**
 * Check if RTL JS is already injected.
 */
export function isJsAlreadyInjected(jsContent: string): boolean {
  return jsContent.includes(JS_MARKER_START) && jsContent.includes(JS_MARKER_END);
}

/**
 * Remove previously injected RTL JS (between markers).
 */
function removeInjectedJsBlock(jsContent: string): string {
  const startIdx = jsContent.indexOf(JS_MARKER_START);
  const endIdx = jsContent.indexOf(JS_MARKER_END);

  if (startIdx === -1 || endIdx === -1) {
    return jsContent;
  }

  const before = jsContent.substring(0, startIdx).trimEnd();
  const after = jsContent.substring(endIdx + JS_MARKER_END.length).trimStart();

  return after ? `${before}\n${after}` : before;
}

/**
 * Inject RTL JS observer into Claude Code's webview JS file.
 */
export function injectRtlJs(
  jsFilePath: string,
  extensionPath: string
): { success: boolean; message: string } {
  try {
    if (!fs.existsSync(jsFilePath)) {
      return { success: false, message: 'Claude Code webview JS file not found.' };
    }

    // Backup original JS
    const backupPath = jsFilePath + '.rtl-backup';
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(jsFilePath, backupPath);
    }

    // Read current JS
    let jsContent = fs.readFileSync(jsFilePath, 'utf-8');

    // Remove existing injection if present
    if (isJsAlreadyInjected(jsContent)) {
      jsContent = removeInjectedJsBlock(jsContent);
    }

    // Read JS template
    const template = readJsTemplate(extensionPath);

    // Build injection block
    const injectionBlock = [
      '',
      JS_MARKER_START,
      template,
      JS_MARKER_END,
    ].join('\n');

    // Append to JS
    jsContent = jsContent.trimEnd() + '\n' + injectionBlock + '\n';

    // Write back
    fs.writeFileSync(jsFilePath, jsContent, 'utf-8');

    return { success: true, message: 'RTL JS observer injected successfully.' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Failed to inject RTL JS: ${msg}` };
  }
}

/**
 * Remove injected RTL JS from Claude Code's webview JS file.
 */
export function removeRtlJs(jsFilePath: string): { success: boolean; message: string } {
  try {
    if (!fs.existsSync(jsFilePath)) {
      return { success: false, message: 'Claude Code webview JS file not found.' };
    }

    let jsContent = fs.readFileSync(jsFilePath, 'utf-8');

    if (!isJsAlreadyInjected(jsContent)) {
      return { success: false, message: 'No injected RTL JS found.' };
    }

    jsContent = removeInjectedJsBlock(jsContent);
    fs.writeFileSync(jsFilePath, jsContent + '\n', 'utf-8');

    return { success: true, message: 'RTL JS removed successfully.' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Failed to remove RTL JS: ${msg}` };
  }
}
