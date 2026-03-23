import * as vscode from 'vscode';
import * as fs from 'fs';
import { detectClaudeCode, hasVersionChanged, saveVersion, extractCurrentHashes } from './detector';
import { injectRtlCss, removeRtlCss, isAlreadyInjected } from './injector';

export function activate(context: vscode.ExtensionContext) {
  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('claudeCodeRtl.inject', () => manualInject(context)),
    vscode.commands.registerCommand('claudeCodeRtl.remove', () => manualRemove()),
    vscode.commands.registerCommand('claudeCodeRtl.status', () => checkStatus(context)),
  );

  // Auto-inject on activation
  autoInject(context);

  // Re-inject when extensions change (install/update/uninstall)
  context.subscriptions.push(
    vscode.extensions.onDidChange(() => {
      autoInject(context);
    }),
  );
}

/**
 * Automatically inject RTL CSS if needed (new version or not yet injected).
 */
async function autoInject(context: vscode.ExtensionContext): Promise<void> {
  const info = detectClaudeCode();
  if (!info) {
    return; // Claude Code not installed, silently skip
  }

  const cssContent = fs.readFileSync(info.cssFilePath, 'utf-8');
  const alreadyInjected = isAlreadyInjected(cssContent);
  const versionChanged = hasVersionChanged(context, info);

  if (alreadyInjected && !versionChanged) {
    return; // Already injected and same version, nothing to do
  }

  const currentHashes = extractCurrentHashes(cssContent);
  const result = injectRtlCss(info.cssFilePath, context.extensionPath, currentHashes);

  if (result.success) {
    await saveVersion(context, info);

    const reloadAction = 'Reload Now';
    const message = result.unmatchedBases.length > 0
      ? `Claude Code RTL: CSS injected (v${info.version}). ${result.unmatchedBases.length} classes not found - some elements may not be styled. Reload to apply.`
      : `Claude Code RTL: CSS injected for v${info.version}. Reload to apply.`;

    const action = await vscode.window.showInformationMessage(message, reloadAction);
    if (action === reloadAction) {
      await vscode.commands.executeCommand('workbench.action.reloadWindow');
    }
  } else {
    vscode.window.showErrorMessage(result.message);
  }
}

/**
 * Manual inject command.
 */
async function manualInject(context: vscode.ExtensionContext): Promise<void> {
  const info = detectClaudeCode();
  if (!info) {
    vscode.window.showWarningMessage('Claude Code extension not found. Please install it first.');
    return;
  }

  const cssContent = fs.readFileSync(info.cssFilePath, 'utf-8');
  const currentHashes = extractCurrentHashes(cssContent);
  const result = injectRtlCss(info.cssFilePath, context.extensionPath, currentHashes);

  if (result.success) {
    await saveVersion(context, info);

    const reloadAction = 'Reload Now';
    const action = await vscode.window.showInformationMessage(
      `${result.message} Reload to apply changes.`,
      reloadAction,
    );
    if (action === reloadAction) {
      await vscode.commands.executeCommand('workbench.action.reloadWindow');
    }
  } else {
    vscode.window.showErrorMessage(result.message);
  }
}

/**
 * Manual remove command.
 */
async function manualRemove(): Promise<void> {
  const info = detectClaudeCode();
  if (!info) {
    vscode.window.showWarningMessage('Claude Code extension not found.');
    return;
  }

  const result = removeRtlCss(info.cssFilePath);

  if (result.success) {
    const reloadAction = 'Reload Now';
    const action = await vscode.window.showInformationMessage(
      `${result.message} Reload to apply changes.`,
      reloadAction,
    );
    if (action === reloadAction) {
      await vscode.commands.executeCommand('workbench.action.reloadWindow');
    }
  } else {
    vscode.window.showWarningMessage(result.message);
  }
}

/**
 * Check injection status command.
 */
function checkStatus(context: vscode.ExtensionContext): void {
  const info = detectClaudeCode();
  if (!info) {
    vscode.window.showInformationMessage('Claude Code RTL Status: Claude Code extension not found.');
    return;
  }

  const cssContent = fs.readFileSync(info.cssFilePath, 'utf-8');
  const injected = isAlreadyInjected(cssContent);
  const versionChanged = hasVersionChanged(context, info);

  const status = injected
    ? `RTL CSS is injected. Claude Code v${info.version}.${versionChanged ? ' (version changed since last injection!)' : ''}`
    : `RTL CSS is NOT injected. Claude Code v${info.version}.`;

  vscode.window.showInformationMessage(`Claude Code RTL Status: ${status}`);
}

export function deactivate() {
  // Nothing to clean up
}
