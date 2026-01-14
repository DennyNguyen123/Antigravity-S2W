# Changelog
<!-- markdownlint-disable -->

All notable changes to this project will be documented in this file.


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
