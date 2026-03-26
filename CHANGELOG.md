# Changelog
<!-- markdownlint-disable -->

All notable changes to this project will be documented in this file.


## [0.5.0] - 2026-03-11

### Added

- **Target IDE Selection**: Support generating workflows for different AI agents and IDEs, including Antigravity (`.gemini`), GitHub Copilot (`.github`), Vendor Agnostic (`.agents`), OpenCode (`.opencode`), and Kilo (`.kilo`).
- **Installation Mode Selection**: Added the ability to choose between `Global (Home Dir)` and `Local (Workspace)` installation paths for targeted workflow deployment.
- **Auto-Detect Environment**: The UI now automatically selects the most appropriate Target IDE based on the host editor (e.g. Cursor, Windsurf) and automatically defaults to Local Workspace mode if standard configuration folders (like `.github` or `.agents`) are detected.

## [0.4.1] - 2026-03-03

### Added

- **Skills MP Proxy Server**: Built-in local proxy server to resolve CORS issues when downloading packages directly from the Skills Marketplace.
- **Frontend Pagination**: Implemented pagination controls in the Webview to efficiently browse and manage large numbers of workflows.
- **UI/UX Pro Max Skill**: Added one-click install support and a dedicated visual toggle for the UI/UX Pro Max design intelligence skill.

## [0.3.0] - 2026-01-15

### Added

- **Community Skills (Davila7)**: Integrated massive community skill collection with categorized selection.
- **OneKey Install Skills**: Quick install/remove for Superpowers, Anthropic, and Community skills.
- **Direct Skills Download**: Skills are downloaded directly from GitHub to `~/.gemini/antigravity/skills/` without path prefixes.
- **Categorized Sync**: "Apply Changes" button to sync multiple categories at once.
- **Manual Update Buttons**: Added ↻ icons for all skill sources to allow manual fetching of latest data.
- **UI Improvements**: 
  - Larger font size and better spacing for category checkboxes.
  - Teal accent color for Davila7 UI.
  - Improved column alignment and widths for better readability.
- **Resizable Columns**: Drag to resize columns in Skills and Workflows tables.
- **Status Reporting**: Unified status display bar with real-time feedback during syncing operations.

### Removed

- **Auto-Configuration**: No longer injects rules into GEMINI.md. Because Antigravity will auto scan skills folder.
