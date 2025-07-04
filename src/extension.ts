// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "quickprompts" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('quickprompts.helloWorld', () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No editor is active');
			return;
		}

		// 2. Get the selection and the selected text
		const selection = editor.selection;
		const selectedText = editor.document.getText(selection);

		if (!selectedText) {
			vscode.window.showInformationMessage('No code selected');
			return;
		}

		// 3. Now you have the selected code in `selectedText`
		//    You can pass it to whatever processing logic you need:
		console.log('User selected:', selectedText);

		// 4. (Example) Show the selected snippet back to the user
		vscode.window.showInformationMessage(`You selected: ${selectedText}`);
	});

	// The first prompt from Talon GPT Prompt List.md
	const FIRST_PROMPT = `fix grammar formally: Fix any mistakes or irregularities in grammar, spelling, or formatting. Use a professional business tone. The text was created using voice dictation. Thus, there are likely to be issues regarding homophones and other misrecognitions. Do not change the original structure of the text.`;

	// Helper to get OpenAI API key from settings or environment variable
	function getOpenAIApiKey(): string | undefined {
		const keyFromSettings = vscode.workspace.getConfiguration('quickprompts').get('openaiApiKey');
		if (keyFromSettings && typeof keyFromSettings === 'string' && keyFromSettings.trim() !== '') {
			return keyFromSettings;
		}
		// Fallback to environment variable
		return process.env.OPENAI_API_KEY;
	}

	// Helper to get OpenAI model from settings
	function getOpenAIModel(): string {
		return vscode.workspace.getConfiguration('quickprompts').get('openaiModel', 'gpt-4o');
	}

	// Function to call OpenAI chat completions (for gpt-4o and similar models)
	async function getOpenAICompletion(prompt: string, input: string): Promise<string> {
		const apiKey = getOpenAIApiKey();
		if (!apiKey) {
			vscode.window.showErrorMessage('OpenAI API key not set. Please set quickprompts.openaiApiKey in your settings.');
			return '';
		}
		const openai = new OpenAI({ apiKey });
		const model = getOpenAIModel();
		const completion = await openai.chat.completions.create({
			model,
			messages: [
				{ role: 'system', content: prompt },
				{ role: 'user', content: input }
			],
			max_tokens: 256,
			temperature: 0.2,
		});
		return completion.choices[0]?.message?.content?.trim() || '';
	}

	// Command: fix grammar formally (uses the first prompt)
	const fixGrammarFormallyDisposable = vscode.commands.registerCommand('quickprompts.fixGrammarFormally', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No editor is active');
			return;
		}
		const selection = editor.selection;
		const selectedText = editor.document.getText(selection);
		if (!selectedText) {
			vscode.window.showInformationMessage('No text selected');
			return;
		}
		vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: 'Getting OpenAI completion...' }, async () => {
			try {
				const result = await getOpenAICompletion(FIRST_PROMPT, selectedText);
				vscode.window.showInformationMessage('result back ' + result);
				if (result) {
					await editor.edit(editBuilder => {
						editBuilder.replace(selection, result);
					});
					vscode.window.showInformationMessage('OpenAI completion applied!');
				}
			} catch (error: any) {
				console.error('OpenAI error:', error);
				vscode.window.showErrorMessage('Error from OpenAI: ' + (error?.message || error));
			}
		});
	});

	// --- PROMPT STORAGE INITIALIZATION ---
	const PROMPT_KEY = 'quickprompts.prompts';
	interface PromptWithCategory {
		key: string;
		value: string;
		category: string;
	}
	async function loadDefaultPromptsIfNeeded() {
		const existing = context.globalState.get<PromptWithCategory[]>(PROMPT_KEY);
		if (existing) { return; } // Already initialized
		const mdPath = path.join(context.extensionPath, 'Talon GPT Prompt List.md');
		try {
			const md = fs.readFileSync(mdPath, 'utf8');
			const lines = md.split(/\r?\n/);
			let currentCategory = '';
			const prompts: PromptWithCategory[] = [];
			for (const line of lines) {
				const headingMatch = line.match(/^##+\s*(.+)$/);
				if (headingMatch) {
					currentCategory = headingMatch[1].trim();
					continue;
				}
				const promptMatch = line.match(/^(\w[\w\s-]+):(.+)$/);
				if (promptMatch) {
					const key = promptMatch[1].trim();
					const value = promptMatch[2].trim();
					prompts.push({ key, value, category: currentCategory });
				}
			}
			await context.globalState.update(PROMPT_KEY, prompts);
			console.log('Default prompts with categories loaded into global state.');
		} catch (err) {
			console.error('Failed to load default prompts:', err);
		}
	}
	loadDefaultPromptsIfNeeded();

	// --- PROMPT MANAGER WEBVIEW ---
	const promptManagerDisposable = vscode.commands.registerCommand('quickprompts.managePrompts', async () => {
		const panel = vscode.window.createWebviewPanel(
			'quickpromptsPromptManager',
			'QuickPrompts: Manage Prompts',
			vscode.ViewColumn.One,
			{ enableScripts: true }
		);

		// Load prompts from global state
		const prompts: PromptWithCategory[] = context.globalState.get(PROMPT_KEY) || [];

		// Add CSS for red border on focus for mandatory fields
		panel.webview.html = `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<title>Manage Prompts</title>
	<style>
		body {
			background-color: #1e1e1e;
			color: #d4d4d4;
			font-family: var(--vscode-font-family, 'Segoe UI', Arial, sans-serif);
		}
		h2 { color: #d7ba7d; }
		table {
			width: 100%;
			border-collapse: collapse;
			background: #252526;
		}
		th, td {
			border: 1px solid #333;
			padding: 6px 8px;
		}
		th {
			background: #2d2d30;
			color: #d7ba7d;
		}
		tr:nth-child(even) { background: #232323; }
		tr:nth-child(odd) { background: #252526; }
		input.prompt-key {
			background: #1e1e1e;
			color: #d4d4d4;
			border: 1px solid #444; 
			border-radius: 3px;
			padding: 4px;
		}
		textarea.prompt-value {
			width: 100%;
			min-height: 60px;
			height: 100%;
			resize: vertical;
			display: block;
			box-sizing: border-box;
			background: #1e1e1e;
			color: #d4d4d4;
			border: 1px solid #444;
			border-radius: 3px;
			font-family: var(--vscode-font-family, 'Segoe UI', Arial, sans-serif);
		}
		input.prompt-category {
			background: #1e1e1e;
			color: #d4d4d4;
			border: 1px solid #444;
			border-radius: 3px;
			padding: 4px;
		}
		td {
			vertical-align: top;
		}
		button {
			background: #0e639c;
			color: #fff;
			border: none;
			border-radius: 3px;
			padding: 6px 12px;
			margin: 2px;
			cursor: pointer;
			transition: background 0.2s;
		}
		button:hover {
			background: #1177bb;
		}
		th.name-col, td.name-col {
			width: 220px;
			max-width: 240px;
			min-width: 120px;
			white-space: nowrap;
		}
		th.prompt-col, td.prompt-col {
			width: 100%;
		}
		th.category-col, td.category-col {
			width: 180px;
			max-width: 200px;
			min-width: 100px;
			white-space: nowrap;
		}
		#search-box {
			width: 60%;
			margin-bottom: 12px;
			padding: 6px;
			font-size: 1em;
			background: #232323;
			color: #d4d4d4;
			border: 1px solid #444;
			border-radius: 3px;
		}
		input.prompt-key:focus, textarea.prompt-value:focus, input.prompt-category:focus {
			border: 2px solid #f48771 !important;
			outline: none;
		}
		input.prompt-key, textarea.prompt-value, input.prompt-category {
			border: 1px solid #444;
		}
	</style>
</head>
<body>
	<h2>Manage Prompts</h2>
	<input id="search-box" type="text" placeholder="Search by name or prompt contents..." />
	<div id="prompt-table"></div>
	<script>
	(function() {
		const vscode = acquireVsCodeApi();
		let allPrompts = ${JSON.stringify(prompts)};

		function escapeHtml(text) {
			return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
		}

		function getPromptsHtml(prompts) {
			var html = '<button id="add" accesskey="a"><span style="text-decoration: underline">A</span>dd New Prompt</button>';
			html += '<table border="1" style="width:100%">';
			html += '<tr><th class="name-col">Name</th><th class="prompt-col">Prompt</th><th class="category-col">Category</th><th>Action</th></tr>';
			for (var i = 0; i < prompts.length; i++) {
				const isNew = prompts[i].__new;
				html += '<tr>' +
					'<td class="name-col"><input type="text" value="' + escapeHtml(prompts[i].key) + '" data-idx="' + i + '" class="prompt-key" /></td>' +
					'<td class="prompt-col"><textarea data-idx="' + i + '" class="prompt-value">' + escapeHtml(prompts[i].value) + '</textarea></td>' +
					'<td class="category-col"><input type="text" value="' + escapeHtml(prompts[i].category) + '" data-idx="' + i + '" class="prompt-category" /></td>' +
					'<td><button data-action="delete" data-idx="' + i + '"' + (isNew ? ' disabled' : '') + '>Delete</button></td>' +
				'</tr>';
			}
			html += '</table>';
			html += '<button id="add" accesskey="a"><span style="text-decoration: underline">A</span>dd New Prompt</button>';
			html += '<div id="error-message" style="color:#f48771;min-height:1.5em;margin-top:8px;"></div>';
			html += '<button id="save" accesskey="c">Save <span style="text-decoration: underline">C</span>hanges</button>';
			return html;
		}

		function renderTable(filteredPrompts) {
			document.getElementById('prompt-table').innerHTML = getPromptsHtml(filteredPrompts);
			attachRowHandlers();
		}

		function attachRowHandlers() {
			const addBtns = document.querySelectorAll('#add');
			addBtns.forEach(function(addBtn) {
				addBtn.onclick = function() {
					const table = document.querySelector('table');
					const row = table.insertRow(-1);
					row.innerHTML = '<td class="name-col"><input type="text" class="prompt-key" /></td><td class="prompt-col"><textarea class="prompt-value"></textarea></td><td class="category-col"><input type="text" class="prompt-category" /></td><td><button data-action="delete" disabled>Delete</button></td>';
					row.querySelector('button[data-action="delete"]').onclick = function(e) {
						const r = e.target.closest('tr');
						r.parentNode.removeChild(r);
					};
					// Focus the prompt name field in the new row
					const lastPromptKey = row.querySelector('.prompt-key');
					if (lastPromptKey) lastPromptKey.focus();
				};
			});
			const saveBtn = document.getElementById('save');
			if (saveBtn) {
				saveBtn.onclick = function() {
					const keys = document.querySelectorAll('.prompt-key');
					const values = document.querySelectorAll('.prompt-value');
					const categories = document.querySelectorAll('.prompt-category');
					const prompts = [];
					let hasError = false;
					for (let i = 0; i < keys.length; i++) {
						const key = keys[i].value.trim();
						const value = values[i].value.trim();
						const category = categories[i].value.trim();
						if (!key || !value || !category) {
							hasError = true;
							break;
						}
						prompts.push({ key, value, category });
					}
					const errorDiv = document.getElementById('error-message');
					if (hasError) {
						errorDiv.textContent = 'All fields (Name, Prompt, and Category) must be filled in for every record.';
						return;
					} else {
						errorDiv.textContent = '';
					}
					// After save, all prompts are considered saved (remove __new)
					prompts.forEach(p => { delete p.__new; });
					vscode.postMessage({ type: 'save', prompts });
					allPrompts = prompts;
					// Enable all delete buttons after successful save
					document.querySelectorAll('button[data-action="delete"]').forEach(function(btn) {
						btn.disabled = false;
					});
				};
			}
			document.querySelectorAll('button[data-action="delete"]').forEach(function(btn) {
				btn.onclick = function(e) {
					const row = e.target.closest('tr');
					row.parentNode.removeChild(row);
				};
			});
		}

		// Initial render
		// Mark new/unsaved prompts with __new property
		allPrompts = allPrompts.map(p => ({ ...p }));
		renderTable(allPrompts);

		document.getElementById('search-box').addEventListener('input', function(e) {
			const val = e.target.value.toLowerCase();
			const filtered = allPrompts.filter(function(p) {
				return p.key.toLowerCase().includes(val) || p.value.toLowerCase().includes(val);
			});
			renderTable(filtered);
		});

		document.getElementById('search-box').focus();
	})();
	</script>
</body>
</html>`;

		panel.webview.onDidReceiveMessage(async msg => {
			if (msg.type === 'save') {
				await context.globalState.update(PROMPT_KEY, msg.prompts);
				vscode.window.showInformationMessage('Prompts saved!');
			}
		});
	});
	context.subscriptions.push(disposable);
	context.subscriptions.push(fixGrammarFormallyDisposable);
	context.subscriptions.push(promptManagerDisposable);

	// Command: Run any prompt via quick pick
	const runPromptDisposable = vscode.commands.registerCommand('quickprompts.runPrompt', async () => {
		const prompts: PromptWithCategory[] = context.globalState.get(PROMPT_KEY) || [];
		if (prompts.length === 0) {
			vscode.window.showWarningMessage('No prompts available. Please add prompts first.');
			return;
		}
		// Group prompts by category
		const categories = Array.from(new Set(prompts.map(p => p.category).filter(Boolean)));
		let selectedCategory: string | undefined = categories[0];
		if (categories.length > 1) {
			// Create category items with preview of first few prompts in each category
			const categoryItems = categories.map(category => {
				const categoryPrompts = prompts.filter(p => p.category === category);
				const firstFewNames = categoryPrompts.slice(0, 4).map(p => p.key);
				const preview = firstFewNames.join(', ');
				const moreCount = categoryPrompts.length - 4;
				const description = moreCount > 0 ? `${preview}, +${moreCount} more` : preview;

				return {
					label: category,
					description: description,
					detail: `${categoryPrompts.length} prompt${categoryPrompts.length === 1 ? '' : 's'} in this category`
				};
			});

			const selectedCategoryItem = await vscode.window.showQuickPick(categoryItems, {
				placeHolder: 'Select a prompt category',
				matchOnDescription: true, // Allow searching within the prompt names
			});
			if (!selectedCategoryItem) { return; }
			selectedCategory = selectedCategoryItem.label;
		}
		const filteredPrompts = prompts.filter(p => p.category === selectedCategory);

		// Create QuickPickItems with prompt previews
		const promptItems = filteredPrompts.map(p => {
			// Truncate prompt to first 100 characters for preview
			const preview = p.value.length > 100 ? p.value.substring(0, 100) + '...' : p.value;
			return {
				label: p.key,
				description: preview,
				detail: `Category: ${p.category}`,
				promptValue: p.value
			};
		});

		const selected = await vscode.window.showQuickPick(promptItems, {
			placeHolder: 'Select a prompt to run on the selected text',
			matchOnDescription: true, // Allow searching within the prompt preview
		});
		if (!selected) { return; }
		const prompt = selected.promptValue;
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No editor is active');
			return;
		}
		const selection = editor.selection;
		const selectedText = editor.document.getText(selection);
		if (!selectedText) {
			vscode.window.showInformationMessage('No text selected');
			return;
		}
		vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: `Running prompt: ${selected.label}` }, async () => {
			try {
				const result = await getOpenAICompletion(prompt, selectedText);
				if (result) {
					await editor.edit(editBuilder => {
						editBuilder.replace(selection, result);
					});
					vscode.window.showInformationMessage(`Prompt '${selected.label}' applied!`);
				}
			} catch (error: any) {
				console.error('OpenAI error:', error);
				vscode.window.showErrorMessage('Error from OpenAI: ' + (error?.message || error));
			}
		});
	});
	context.subscriptions.push(runPromptDisposable);

	// Command: Set OpenAI Model
	const setModelDisposable = vscode.commands.registerCommand('quickprompts.setOpenAIModel', async () => {
		// List of current, non-deprecated OpenAI models (update as needed)
		const models = [
			{ label: 'gpt-4o', description: 'Latest flagship model (recommended)' },
			{ label: 'gpt-4-turbo', description: 'High performance, lower cost' },
			{ label: '$(pencil) Enter custom model name...', description: 'Type a model name not listed here' }
		];
		const pick = await vscode.window.showQuickPick(models, {
			placeHolder: 'Select the OpenAI model to use for completions or enter a custom model name',
		});
		if (!pick) { return; }
		let modelName = pick.label;
		if (modelName.startsWith('$(pencil)')) {
			const input = await vscode.window.showInputBox({
				prompt: 'Enter the OpenAI model name (e.g., gpt-4o, gpt-4-turbo, etc.)',
				placeHolder: 'gpt-4o',
			});
			if (!input) { return; }
			modelName = input.trim();
		}
		await vscode.workspace.getConfiguration('quickprompts').update('openaiModel', modelName, vscode.ConfigurationTarget.Global);
		vscode.window.showInformationMessage(`QuickPrompts: OpenAI model set to ${modelName}`);
	});
	context.subscriptions.push(setModelDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() { }
