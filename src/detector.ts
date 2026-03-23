import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { CLAUDE_EXTENSION_ID, WEBVIEW_CSS_PATH, CLASS_NAME_BASES, STATE_KEY_VERSION } from './constants';

export interface ClaudeCodeInfo {
  extensionPath: string;
  cssFilePath: string;
  version: string;
}

export interface HashMap {
  [baseName: string]: string; // baseName -> hash suffix
}

/**
 * Detect the Claude Code extension using VS Code API.
 * Returns extension info or undefined if not installed.
 */
export function detectClaudeCode(): ClaudeCodeInfo | undefined {
  const ext = vscode.extensions.getExtension(CLAUDE_EXTENSION_ID);
  if (!ext) {
    return undefined;
  }

  const cssFilePath = path.join(ext.extensionPath, WEBVIEW_CSS_PATH);
  if (!fs.existsSync(cssFilePath)) {
    return undefined;
  }

  return {
    extensionPath: ext.extensionPath,
    cssFilePath,
    version: ext.packageJSON?.version ?? 'unknown',
  };
}

/**
 * Check if Claude Code version has changed since last injection.
 */
export function hasVersionChanged(context: vscode.ExtensionContext, info: ClaudeCodeInfo): boolean {
  const lastVersion = context.globalState.get<string>(STATE_KEY_VERSION);
  return lastVersion !== info.version;
}

/**
 * Save the current Claude Code version to global state.
 */
export async function saveVersion(context: vscode.ExtensionContext, info: ClaudeCodeInfo): Promise<void> {
  await context.globalState.update(STATE_KEY_VERSION, info.version);
}

/**
 * Extract current CSS module hashes from Claude Code's index.css.
 * Scans for patterns like .baseName_hashSuffix and builds a mapping.
 */
export function extractCurrentHashes(cssContent: string): HashMap {
  const hashMap: HashMap = {};

  for (const baseName of CLASS_NAME_BASES) {
    // Match .baseName_hashSuffix (hash can contain letters, digits, hyphens, underscores)
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
