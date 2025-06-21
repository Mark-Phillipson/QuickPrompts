// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import OpenAI from 'openai';

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

	// Function to call OpenAI chat completions (for gpt-4o and similar models)
	async function getOpenAICompletion(prompt: string, input: string): Promise<string> {
		const apiKey = getOpenAIApiKey();
		if (!apiKey) {
			vscode.window.showErrorMessage('OpenAI API key not set. Please set quickprompts.openaiApiKey in your settings.');
			return '';
		}
		const openai = new OpenAI({ apiKey });
		const completion = await openai.chat.completions.create({
			model: 'gpt-4o',
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
				vscode.window.showInformationMessage('result back' + result);
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

	context.subscriptions.push(disposable);
	context.subscriptions.push(fixGrammarFormallyDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() { }
