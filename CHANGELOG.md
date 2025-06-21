# Change Log

All notable changes to the "quickprompts" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

- Initial release

## [1.1.0] - 2025-06-21
### Added
- OpenAI GPT-4o completions for all prompts, with robust error handling.
- QuickPick command (`QuickPrompts: Run Prompt...`) to run any prompt on selected text.
- Webview UI for managing prompts (add, edit, delete) with dark mode support.
- Persistent prompt storage in VS Code global state.
- Automatic import of prompts from markdown on first activation.
- Settings for OpenAI API key (from settings or environment variable).
- Improved user feedback and error messages.

### Changed
- All commands are now registered in `package.json` for Command Palette access.
- UI and code refactored for scalability and user-friendliness.