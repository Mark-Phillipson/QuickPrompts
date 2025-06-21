# QuickPrompts

QuickPrompts is a Visual Studio Code extension that allows you to select code or text and run it through a set of AI-powered quick prompts, returning the results directly in your editor. The extension streamlines your workflow by providing a variety of helpful prompts for code fixes, formatting, conversions, and more.

## Features

- **Run any prompt on selected text:** Use the Command Palette to run any user-defined prompt on your current selection. Prompts are powered by OpenAI (gpt-4o) completions.
- **Prompt management UI:** Add, edit, or delete prompts using a user-friendly, dark mode-compatible webview interface.
- **Persistent prompt storage:** Prompts are stored in VS Code's global state and persist across sessions.
- **Import from Markdown:** On first activation, prompts are imported from a markdown list and made available for editing.
- **OpenAI integration:** Securely uses your OpenAI API key (from settings or environment variable) to generate completions.
- **QuickPick command:** Instantly select and run any prompt via a single command (`QuickPrompts: Run Prompt...`).
- **Dark mode support:** All UI is styled for a seamless experience in dark mode.
- **Robust error handling:** Clear error messages for missing API keys, no selection, or OpenAI errors.

## Requirements

- Visual Studio Code version 1.70.0 or higher.
- OpenAI API key (for AI-powered features). Set via `quickprompts.openaiApiKey` in settings or the `OPENAI_API_KEY` environment variable.

## Extension Settings

- `quickprompts.openaiApiKey`: Set your OpenAI API key for completions.

## Usage

1. **Select text/code** in your editor.
2. Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`).
3. Run `QuickPrompts: Run Prompt...` and pick a prompt to apply.
4. To manage prompts, run `QuickPrompts: Manage Prompts` for a full-featured UI.

## Known Issues

If you encounter any issues or bugs, please report them on the extension's GitHub repository. Known issues will be tracked and updated in this section to help prevent duplicate reports.

## Release Notes

See [CHANGELOG.md](./CHANGELOG.md) for details.

---

## Extension Guidelines

For best practices and more information on developing VS Code extensions, refer to the [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines).

**Enjoy using QuickPrompts!**
