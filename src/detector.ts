import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { TARGET_EXTENSIONS, ExtensionTarget, CLASS_NAME_BASES, STATE_KEY_RTL_VERSION } from './constants';

export interface ExtensionInfo {
  target: ExtensionTarget;
  extensionPath: string;
  cssFilePath?: string;
  jsFilePath: string;
  version: string;
}

export interface HashMap {
  [baseName: string]: string; // baseName -> hash suffix
}

function getVersionStateKey(targetId: string): string {
  return `aiRtl.version.${targetId}`;
}

/**
 * Resolve the CSS file path for a target extension.
 * Supports both static paths and glob patterns (when webviewCssIsGlob=true).
 */
function discoverCssFile(extPath: string, target: ExtensionTarget): string | undefined {
  if (!target.webviewCssPath) {
    return undefined;
  }
  if (!target.webviewCssIsGlob) {
    const p = path.join(extPath, target.webviewCssPath);
    return fs.existsSync(p) ? p : undefined;
  }

  // Glob: find the first file matching the pattern in the target directory
  const cssPathPattern = target.webviewCssPath;
  const dir = path.join(extPath, path.dirname(cssPathPattern));
  const filePattern = path.basename(cssPathPattern);

  // Convert simple glob (* wildcard) to regex
  const regexStr = filePattern.replace(/\./g, '\\.').replace(/\*/g, '.*');
  const regex = new RegExp(`^${regexStr}$`);

  if (!fs.existsSync(dir)) {
    return undefined;
  }

  const files = fs.readdirSync(dir);
  const match = files.find(f => regex.test(f));
  return match ? path.join(dir, match) : undefined;
}

/**
 * Detect all supported AI extensions that are installed.
 * Returns info for each found extension.
 */
export function detectExtensions(): ExtensionInfo[] {
  const results: ExtensionInfo[] = [];

  for (const target of TARGET_EXTENSIONS) {
    const ext = vscode.extensions.getExtension(target.id);
    if (!ext) {
      continue;
    }

    const mode = target.injectionMode ?? 'css';

    if (mode === 'shadow-dom-js') {
      if (!target.webviewJsPath) { continue; }
      const jsFilePath = path.join(ext.extensionPath, target.webviewJsPath);
      if (!fs.existsSync(jsFilePath)) { continue; }
      results.push({
        target,
        extensionPath: ext.extensionPath,
        cssFilePath: undefined,
        jsFilePath,
        version: ext.packageJSON?.version ?? 'unknown',
      });
      continue;
    }

    // CSS mode
    const cssFilePath = discoverCssFile(ext.extensionPath, target);
    if (!cssFilePath) {
      continue;
    }

    const jsFilePath = target.webviewJsPath
      ? path.join(ext.extensionPath, target.webviewJsPath)
      : '';

    results.push({
      target,
      extensionPath: ext.extensionPath,
      cssFilePath,
      jsFilePath,
      version: ext.packageJSON?.version ?? 'unknown',
    });
  }

  return results;
}

/**
 * Check if a target extension's version has changed since last injection.
 */
export function hasVersionChanged(context: vscode.ExtensionContext, info: ExtensionInfo): boolean {
  const key = getVersionStateKey(info.target.id);
  const lastVersion = context.globalState.get<string>(key);
  return lastVersion !== info.version;
}

/**
 * Save the current version of a target extension to global state.
 */
export async function saveVersion(context: vscode.ExtensionContext, info: ExtensionInfo): Promise<void> {
  const key = getVersionStateKey(info.target.id);
  await context.globalState.update(key, info.version);
}

/**
 * Check if RTL extension version has changed since last injection.
 */
export function hasRtlVersionChanged(context: vscode.ExtensionContext): boolean {
  const lastVersion = context.globalState.get<string>(STATE_KEY_RTL_VERSION);
  const currentVersion = context.extension?.packageJSON?.version ?? 'unknown';
  return lastVersion !== currentVersion;
}

/**
 * Save the current RTL extension version to global state.
 */
export async function saveRtlVersion(context: vscode.ExtensionContext): Promise<void> {
  const currentVersion = context.extension?.packageJSON?.version ?? 'unknown';
  await context.globalState.update(STATE_KEY_RTL_VERSION, currentVersion);
}

/**
 * Extract current CSS module hashes from a webview CSS file.
 * Scans for patterns like .baseName_hashSuffix and builds a mapping.
 * @param cssContent - The raw CSS content to scan.
 * @param classNameBases - Class name bases to look for. Defaults to Claude Code bases.
 */
export function extractCurrentHashes(cssContent: string, classNameBases: string[] = CLASS_NAME_BASES): HashMap {
  const hashMap: HashMap = {};

  for (const baseName of classNameBases) {
    const regex = new RegExp(`\\.${escapeRegex(baseName)}_([a-zA-Z0-9_-]+)`, 'g');
    const match = regex.exec(cssContent);
    if (match) {
      hashMap[baseName] = match[1];
    }
  }

  return hashMap;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

