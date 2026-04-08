import * as vscode from 'vscode';
import * as fs from 'fs';
import { detectExtensions, hasVersionChanged, saveVersion, extractCurrentHashes, hasRtlVersionChanged, saveRtlVersion, ExtensionInfo } from './detector';
import { injectRtlCss, removeRtlCss, isAlreadyInjected, injectRtlJs, removeRtlJs, isJsAlreadyInjected, injectRtlShadowDomJs, injectRtlWorkbenchCss, removeRtlWorkbenchCss } from './injector';

export function activate(context: vscode.ExtensionContext) {
  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('aiRtl.inject', () => manualInject(context)),
    vscode.commands.registerCommand('aiRtl.remove', () => manualRemove()),
    vscode.commands.registerCommand('aiRtl.status', () => checkStatus(context)),
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
 * Attempt injection for a single target extension.
 * Returns true if injection succeeded.
 */
async function injectForTarget(
  info: ExtensionInfo,
  context: vscode.ExtensionContext,
  force: boolean
): Promise<{ injected: boolean; displayName: string; unmatchedCount: number }> {
  const mode = info.target.injectionMode ?? 'css';

  // ── Workbench CSS mode (e.g. Copilot Chat — native VS Code chat panel) ──
  if (mode === 'workbench-css') {
    if (!info.workbenchCssPath) {
      return { injected: false, displayName: info.target.displayName, unmatchedCount: 0 };
    }
    const cssContent = fs.existsSync(info.workbenchCssPath)
      ? fs.readFileSync(info.workbenchCssPath, 'utf-8')
      : '';
    const alreadyInjected = isAlreadyInjected(cssContent);
    const versionChanged = hasVersionChanged(context, info);
    const rtlVersionChanged = hasRtlVersionChanged(context);

    if (!force && alreadyInjected && !versionChanged && !rtlVersionChanged) {
      return { injected: false, displayName: info.target.displayName, unmatchedCount: 0 };
    }

    const result = injectRtlWorkbenchCss(info.workbenchCssPath, context.extensionPath, info.target);
    if (result.success) {
      await saveVersion(context, info);
      return { injected: true, displayName: info.target.displayName, unmatchedCount: 0 };
    } else {
      vscode.window.showErrorMessage(`${info.target.displayName} RTL: ${result.message}`);
      return { injected: false, displayName: info.target.displayName, unmatchedCount: 0 };
    }
  }

  // ── Shadow DOM JS mode (e.g. Copilot Chat) ──────────────────────────
  if (mode === 'shadow-dom-js') {
    if (!info.jsFilePath) {
      return { injected: false, displayName: info.target.displayName, unmatchedCount: 0 };
    }
    const jsContent = fs.existsSync(info.jsFilePath)
      ? fs.readFileSync(info.jsFilePath, 'utf-8')
      : '';
    const jsInjected = isJsAlreadyInjected(jsContent);
    const versionChanged = hasVersionChanged(context, info);
    const rtlVersionChanged = hasRtlVersionChanged(context);

    if (!force && jsInjected && !versionChanged && !rtlVersionChanged) {
      return { injected: false, displayName: info.target.displayName, unmatchedCount: 0 };
    }

    const result = injectRtlShadowDomJs(info.jsFilePath, context.extensionPath);
    if (result.success) {
      await saveVersion(context, info);
      return { injected: true, displayName: info.target.displayName, unmatchedCount: 0 };
    } else {
      vscode.window.showErrorMessage(`${info.target.displayName} RTL: ${result.message}`);
      return { injected: false, displayName: info.target.displayName, unmatchedCount: 0 };
    }
  }

  // ── CSS mode (Claude Code, Codex) ────────────────────────────────────
  if (!info.cssFilePath) {
    return { injected: false, displayName: info.target.displayName, unmatchedCount: 0 };
  }

  const cssContent = fs.readFileSync(info.cssFilePath, 'utf-8');
  const cssInjected = isAlreadyInjected(cssContent);
  const jsContent = info.jsFilePath && fs.existsSync(info.jsFilePath)
    ? fs.readFileSync(info.jsFilePath, 'utf-8')
    : '';
  const jsInjected = info.jsFilePath ? isJsAlreadyInjected(jsContent) : true;
  const versionChanged = hasVersionChanged(context, info);
  const rtlVersionChanged = hasRtlVersionChanged(context);

  if (!force && cssInjected && jsInjected && !versionChanged && !rtlVersionChanged) {
    return { injected: false, displayName: info.target.displayName, unmatchedCount: 0 };
  }

  const currentHashes = extractCurrentHashes(cssContent, info.target.classNameBases);
  const cssResult = injectRtlCss(info.cssFilePath, context.extensionPath, currentHashes, info.target);

  if (info.jsFilePath) {
    injectRtlJs(info.jsFilePath, context.extensionPath);
  }

  if (cssResult.success) {
    await saveVersion(context, info);
    return { injected: true, displayName: info.target.displayName, unmatchedCount: cssResult.unmatchedBases.length };
  } else {
    vscode.window.showErrorMessage(`${info.target.displayName} RTL: ${cssResult.message}`);
    return { injected: false, displayName: info.target.displayName, unmatchedCount: 0 };
  }
}

/**
 * Automatically inject RTL CSS for all detected AI extensions if needed.
 */
async function autoInject(context: vscode.ExtensionContext): Promise<void> {
  const extensions = detectExtensions();
  if (extensions.length === 0) {
    return;
  }

  const injectedNames: string[] = [];
  let totalUnmatched = 0;

  for (const info of extensions) {
    const result = await injectForTarget(info, context, false);
    if (result.injected) {
      injectedNames.push(result.displayName);
      totalUnmatched += result.unmatchedCount;
    }
  }

  if (injectedNames.length > 0) {
    await saveRtlVersion(context);
    const nameList = injectedNames.join(', ');
    const reloadAction = 'Reload Now';
    const message = totalUnmatched > 0
      ? `AI Extensions RTL: Injected into ${nameList}. ${totalUnmatched} classes not found. Reload to apply.`
      : `AI Extensions RTL: Injected into ${nameList}. Reload to apply.`;

    const action = await vscode.window.showInformationMessage(message, reloadAction);
    if (action === reloadAction) {
      await vscode.commands.executeCommand('workbench.action.reloadWindow');
    }
  }
}

/**
 * Manual inject command — forces re-injection for all detected extensions.
 */
async function manualInject(context: vscode.ExtensionContext): Promise<void> {
  const extensions = detectExtensions();
  if (extensions.length === 0) {
    vscode.window.showWarningMessage(
      'AI Extensions RTL: No supported AI extensions found. Install Claude Code or Codex first.'
    );
    return;
  }

  const injectedNames: string[] = [];
  let totalUnmatched = 0;

  for (const info of extensions) {
    const result = await injectForTarget(info, context, true);
    if (result.injected) {
      injectedNames.push(result.displayName);
      totalUnmatched += result.unmatchedCount;
    }
  }

  if (injectedNames.length > 0) {
    await saveRtlVersion(context);
    const nameList = injectedNames.join(', ');
    const reloadAction = 'Reload Now';
    const message = totalUnmatched > 0
      ? `AI Extensions RTL: Injected into ${nameList}. ${totalUnmatched} classes unmatched. Reload to apply.`
      : `AI Extensions RTL: Injected into ${nameList}. Reload to apply.`;

    const action = await vscode.window.showInformationMessage(message, reloadAction);
    if (action === reloadAction) {
      await vscode.commands.executeCommand('workbench.action.reloadWindow');
    }
  }
}

/**
 * Manual remove command — cleans RTL injection from all detected extensions.
 */
async function manualRemove(): Promise<void> {
  const extensions = detectExtensions();
  if (extensions.length === 0) {
    vscode.window.showWarningMessage('AI Extensions RTL: No supported AI extensions found.');
    return;
  }

  let anySuccess = false;

  for (const info of extensions) {
    const mode = info.target.injectionMode ?? 'css';
    if (mode === 'workbench-css') {
      if (info.workbenchCssPath) {
        const result = removeRtlWorkbenchCss(info.workbenchCssPath);
        if (result.success) { anySuccess = true; }
      }
    } else if (mode === 'shadow-dom-js') {
      if (info.jsFilePath) {
        const result = removeRtlJs(info.jsFilePath);
        if (result.success) { anySuccess = true; }
      }
    } else {
      if (info.cssFilePath) {
        const cssResult = removeRtlCss(info.cssFilePath);
        if (cssResult.success) { anySuccess = true; }
      }
      if (info.jsFilePath) {
        removeRtlJs(info.jsFilePath);
      }
    }
  }

  if (anySuccess) {
    const reloadAction = 'Reload Now';
    const action = await vscode.window.showInformationMessage(
      'AI Extensions RTL: Removed RTL injection. Reload to apply changes.',
      reloadAction,
    );
    if (action === reloadAction) {
      await vscode.commands.executeCommand('workbench.action.reloadWindow');
    }
  } else {
    vscode.window.showWarningMessage('AI Extensions RTL: No injected RTL CSS found.');
  }
}

/**
 * Status command — shows injection state for all detected extensions.
 */
function checkStatus(context: vscode.ExtensionContext): void {
  const extensions = detectExtensions();
  if (extensions.length === 0) {
    vscode.window.showInformationMessage('AI Extensions RTL: No supported AI extensions found.');
    return;
  }

  const lines: string[] = [];

  for (const info of extensions) {
    const mode = info.target.injectionMode ?? 'css';
    const versionChanged = hasVersionChanged(context, info);
    const versionNote = versionChanged ? ' ⚠ version changed' : '';

    if (mode === 'workbench-css') {
      const cssContent = info.workbenchCssPath && fs.existsSync(info.workbenchCssPath)
        ? fs.readFileSync(info.workbenchCssPath, 'utf-8')
        : '';
      const cssInjected = isAlreadyInjected(cssContent);
      lines.push(`${info.target.displayName} v${info.version}: Workbench CSS ${cssInjected ? '✓' : '✗'}${versionNote}`);
    } else if (mode === 'shadow-dom-js') {
      const jsContent = info.jsFilePath && fs.existsSync(info.jsFilePath)
        ? fs.readFileSync(info.jsFilePath, 'utf-8')
        : '';
      const jsInjected = isJsAlreadyInjected(jsContent);
      lines.push(`${info.target.displayName} v${info.version}: Shadow DOM JS ${jsInjected ? '✓' : '✗'}${versionNote}`);
    } else {
      const cssContent = info.cssFilePath ? fs.readFileSync(info.cssFilePath, 'utf-8') : '';
      const cssInjected = info.cssFilePath ? isAlreadyInjected(cssContent) : false;
      const jsContent = info.jsFilePath && fs.existsSync(info.jsFilePath)
        ? fs.readFileSync(info.jsFilePath, 'utf-8')
        : '';
      const jsInjected = info.jsFilePath ? isJsAlreadyInjected(jsContent) : null;

      const cssStatus = cssInjected ? 'CSS ✓' : 'CSS ✗';
      const jsStatus = jsInjected !== null ? (jsInjected ? 'JS ✓' : 'JS ✗') : '';
      const parts = [cssStatus, jsStatus].filter(Boolean).join(', ');

      lines.push(`${info.target.displayName} v${info.version}: ${parts}${versionNote}`);
    }
  }

  vscode.window.showInformationMessage(`AI Extensions RTL: ${lines.join(' | ')}`);
}

export function deactivate() {
  // Nothing to clean up
}

