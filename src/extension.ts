import * as vscode from 'vscode';
import { SkillsViewProvider } from './SkillsViewProvider';
import { GlobalRulesManager } from './services/GlobalRulesManager';
import { SuperpowersInstaller } from './services/SuperpowersInstaller';
import { AnthropicSkillsInstaller } from './services/AnthropicSkillsInstaller';

export function activate(context: vscode.ExtensionContext) {

	// Ensure global rules are set up (cleanup legacy rules)
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

	context.subscriptions.push(
		vscode.commands.registerCommand('antigravity.getChromeDevtoolsMcpUrl', () => {
			console.log('[Antigravity] getChromeDevtoolsMcpUrl called');
			return undefined; 
		})
	);

	// Auto-update disabled per user request
	// autoUpdateSkills();
}

/**
 * Check and auto-update installed skills on extension activation
 */
async function autoUpdateSkills(): Promise<void> {
	const superpowersInstaller = new SuperpowersInstaller();
	const anthropicInstaller = new AnthropicSkillsInstaller();

	const updates: string[] = [];

	// Check and update Superpowers
	if (superpowersInstaller.isInstalled()) {
		try {
			await superpowersInstaller.update();
			updates.push("Superpowers");
		} catch (e) {
			console.error("Failed to auto-update Superpowers:", e);
		}
	}

	// Check and update Anthropic Skills
	if (anthropicInstaller.isInstalled()) {
		try {
			await anthropicInstaller.update();
			updates.push("Anthropic Skills");
		} catch (e) {
			console.error("Failed to auto-update Anthropic Skills:", e);
		}
	}

	// Show notification if any updates were performed
	if (updates.length > 0) {
		vscode.window.showInformationMessage(`已自動更新: ${updates.join(", ")}`);
	}
}

export function deactivate() {}

