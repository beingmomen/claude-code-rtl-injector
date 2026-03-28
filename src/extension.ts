import * as vscode from 'vscode';
import * as fs from 'fs';
import { detectClaudeCode, hasVersionChanged, saveVersion, extractCurrentHashes, hasRtlVersionChanged, saveRtlVersion } from './detector';
import { injectRtlCss, removeRtlCss, isAlreadyInjected, injectRtlJs, removeRtlJs, isJsAlreadyInjected } from './injector';

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
  const cssInjected = isAlreadyInjected(cssContent);
  const jsContent = fs.existsSync(info.jsFilePath) ? fs.readFileSync(info.jsFilePath, 'utf-8') : '';
  const jsInjected = isJsAlreadyInjected(jsContent);
  const versionChanged = hasVersionChanged(context, info);
  const rtlVersionChanged = hasRtlVersionChanged(context);

  if (cssInjected && jsInjected && !versionChanged && !rtlVersionChanged) {
    return; // Already injected and both versions unchanged, nothing to do
  }

  const currentHashes = extractCurrentHashes(cssContent);
  const cssResult = injectRtlCss(info.cssFilePath, context.extensionPath, currentHashes);
  const jsResult = injectRtlJs(info.jsFilePath, context.extensionPath);

  if (cssResult.success) {
    await saveVersion(context, info);
    await saveRtlVersion(context);

    const reloadAction = 'Reload Now';
    const jsStatus = jsResult.success ? ' + JS observer' : '';
    const message = cssResult.unmatchedBases.length > 0
      ? `Claude Code RTL: CSS${jsStatus} injected (v${info.version}). ${cssResult.unmatchedBases.length} classes not found. Reload to apply.`
      : `Claude Code RTL: CSS${jsStatus} injected for v${info.version}. Reload to apply.`;

    const action = await vscode.window.showInformationMessage(message, reloadAction);
    if (action === reloadAction) {
      await vscode.commands.executeCommand('workbench.action.reloadWindow');
    }
  } else {
    vscode.window.showErrorMessage(cssResult.message);
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
  const cssResult = injectRtlCss(info.cssFilePath, context.extensionPath, currentHashes);
  const jsResult = injectRtlJs(info.jsFilePath, context.extensionPath);

  if (cssResult.success) {
    await saveVersion(context, info);
    await saveRtlVersion(context);

    const jsStatus = jsResult.success ? ' + JS observer' : '';
    const reloadAction = 'Reload Now';
    const action = await vscode.window.showInformationMessage(
      `${cssResult.message}${jsStatus} Reload to apply changes.`,
      reloadAction,
    );
    if (action === reloadAction) {
      await vscode.commands.executeCommand('workbench.action.reloadWindow');
    }
  } else {
    vscode.window.showErrorMessage(cssResult.message);
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

  const cssResult = removeRtlCss(info.cssFilePath);
  const jsResult = removeRtlJs(info.jsFilePath);

  if (cssResult.success || jsResult.success) {
    const reloadAction = 'Reload Now';
    const action = await vscode.window.showInformationMessage(
      `RTL CSS and JS removed successfully. Reload to apply changes.`,
      reloadAction,
    );
    if (action === reloadAction) {
      await vscode.commands.executeCommand('workbench.action.reloadWindow');
    }
  } else {
    vscode.window.showWarningMessage('No injected RTL CSS or JS found.');
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
  const cssInjected = isAlreadyInjected(cssContent);
  const jsContent = fs.existsSync(info.jsFilePath) ? fs.readFileSync(info.jsFilePath, 'utf-8') : '';
  const jsInjected = isJsAlreadyInjected(jsContent);
  const versionChanged = hasVersionChanged(context, info);

  const cssStatus = cssInjected ? 'CSS ✓' : 'CSS ✗';
  const jsStatus = jsInjected ? 'JS ✓' : 'JS ✗';
  const versionNote = versionChanged ? ' (version changed since last injection!)' : '';

  vscode.window.showInformationMessage(
    `Claude Code RTL Status: ${cssStatus}, ${jsStatus}. Claude Code v${info.version}.${versionNote}`
  );
}

export function deactivate() {
  // Nothing to clean up
}
