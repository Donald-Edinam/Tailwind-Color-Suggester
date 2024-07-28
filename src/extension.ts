import * as vscode from 'vscode';
import { loadTailwindColors } from './helper';

export type TailwindColorType = { [key: string]: string };

let tailwindColors: TailwindColorType = {};

export function activate(context: vscode.ExtensionContext) {
	console.log('Extension "tailwind-color-suggester" is now active!');

	// Load initial colors
	updateTailwindColors();

	// Set up file watcher
	const watcher = vscode.workspace.createFileSystemWatcher('**/tailwind.config.js');
	watcher.onDidChange(() => updateTailwindColors());
	watcher.onDidCreate(() => updateTailwindColors());
	watcher.onDidDelete(() => updateTailwindColors());

	context.subscriptions.push(watcher);

	// Activate hover provider
	activateHoverProvider(context);

	// Activate completion provider
	activateCompletionProvider(context);

	// Register a command (you can remove this if you don't need it)
	let disposable = vscode.commands.registerCommand("tailwind-color-suggester.suggestTailwindColor",
		function () {
			vscode.window.showInformationMessage("Hello World from Tailwind!");
		}
	);

	context.subscriptions.push(disposable);
}


// Load tailwind colors in variable
function updateTailwindColors() {
	const colors = loadTailwindColors();
	if (colors) {
		tailwindColors = colors;
	} else {
		console.log('Failed to load Tailwind colors');
		tailwindColors = {};
	}
}

// Hover action handler -> This will show the Tailwind color name when hovering over a hex color code
function activateHoverProvider(context: vscode.ExtensionContext) {
	console.log("hover function started");
	const hoverProvider = vscode.languages.registerHoverProvider(
		['css', 'postcss', 'javascript', 'typescript', 'javascriptreact', 'typescriptreact'],
		{
			provideHover(document, position, token) {
				const range = document.getWordRangeAtPosition(position, /#[0-9A-Fa-f]{6}/);
				if (range) {
					const hexColor = document.getText(range);
					const colorName = Object.entries(tailwindColors).find(([name, hex]) => hex.toLowerCase() === hexColor.toLowerCase());
					if (colorName) {
						return new vscode.Hover(`Tailwind color: ${colorName[0]}`);
					}
				}
				return null;
			}
		}
	);

	console.log("hover function activated/finished");

	context.subscriptions.push(hoverProvider);
}


// Suggest Tailwind color names when you start typing a hex color code
function activateCompletionProvider(context: vscode.ExtensionContext) {
	const completionProvider = vscode.languages.registerCompletionItemProvider(
		['css', 'postcss', 'javascript', 'typescript', 'javascriptreact', 'typescriptreact'],
		{
			provideCompletionItems(document, position, token, context) {
				const linePrefix = document.lineAt(position).text.substring(0, position.character);

				// Check if we're inside square brackets and after a '#'
				if (!/\[#[0-9A-Fa-f]*$/.test(linePrefix)) {
					return undefined;
				}

				const typedColor = linePrefix.match(/#([0-9A-Fa-f]*)$/)?.[1] || '';

				return Object.entries(tailwindColors)
					.filter(([name, hex]) => hex.toLowerCase().startsWith(`#${typedColor.toLowerCase()}`))
					.map(([name, hex]) => {
						const item = new vscode.CompletionItem(hex, vscode.CompletionItemKind.Color);
						item.detail = name;
						item.documentation = new vscode.MarkdownString(`Tailwind color: \`${name}\``);
						item.insertText = name;
						return item;
					});
			}
		},
	);

	context.subscriptions.push(completionProvider);
}

export function deactivate() { }