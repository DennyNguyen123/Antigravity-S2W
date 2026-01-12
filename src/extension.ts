import * as vscode from 'vscode';
import { SkillsViewProvider } from './SkillsViewProvider';
import { GlobalRulesManager } from './services/GlobalRulesManager';

export function activate(context: vscode.ExtensionContext) {

	// Ensure global rules are set up (only runs once)
	const globalRulesManager = new GlobalRulesManager();
	globalRulesManager.ensureSkillsSection();

	const provider = new SkillsViewProvider(context.extensionUri);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(SkillsViewProvider.viewType, provider)
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('antigravity.refresh', () => {
			provider.sendInitData();
		})
	);
}

export function deactivate() {}
