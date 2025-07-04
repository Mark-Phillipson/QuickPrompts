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

## [1.1.1] - 2025-06-24
### Improved
- Added a red border to all mandatory fields (Name, Prompt, Category) when focused in the prompt manager webview, to visually indicate they are required.
- Improved accessibility and usability of the prompt management UI.

### Known Issues
- The Delete button is intended to be disabled for new/unsaved records, but is currently not disabled due to a UI logic issue. This will be addressed in a future update.

## [1.2.0] - 2025-07-04
### Added
- Enhanced prompt selection with preview functionality: The prompt picker now displays the first 100 characters of each prompt content as a description, providing better context when choosing prompts.
- Improved category selection with prompt previews: Category selection now shows the first 4 prompt names in each category, along with a count of additional prompts (e.g., "prompt1, prompt2, prompt3, prompt4, +3 more").
- Search functionality for both category and prompt selection: Users can now search within prompt names and content during selection.
- Enhanced QuickPick interface with detailed information including prompt counts per category.

### Improved
- Better user experience when selecting prompts with more contextual information.
- Faster prompt discovery through enhanced search capabilities.
- More informative category selection showing what types of prompts are available in each category.