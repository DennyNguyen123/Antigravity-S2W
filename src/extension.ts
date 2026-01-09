import * as vscode from 'vscode';
import { SkillsViewProvider } from './SkillsViewProvider';

export function activate(context: vscode.ExtensionContext) {

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
