# Antigravity-S2W

[繁體中文](README.zh-TW.md)

> [!NOTE]
> **Updated on 2026-01-14**
>
> - **Gemini CLI** now officially supports Agent Skills! See [v0.24.0 Release](https://github.com/google-gemini/gemini-cli/releases/tag/v0.24.0) for details.
> - **OneKey Install Superpowers** is an experimental feature pending upstream merge: [feat: Add Antigravity IDE integration](https://github.com/obra/superpowers/pull/192). The bootstrap command will fail, but this extension automatically converts Superpowers skills to Global Workflows, making them available via `/` commands.

![Antigravity-S2W Screenshot](resources/screenshot.jpg)

## Requirements

This extension requires **Google Antigravity IDE** to function.

## Features

Transform your installed AI Skills into Antigravity Global Workflow files. Collect skills from different AI tools and use them in Antigravity with a simple `/` command.

### 1. Workflow Generator

- Scan skill directories from Gemini
- Read metadata from `SKILL.md` (name + `description` frontmatter)
- Generate standardized Global Workflow `.md` files

### 2. Skill Importer

- **ZIP import**: Extract skill packages from one or more ZIP files
- **GitHub download**: Install skills directly from a GitHub folder URL
- Supports [Skills Marketplace](https://skillsmp.com) packages

### 3. OneKey Install Skills

A simplified alternative that fetches skills directly from official GitHub repositories:

- **Superpowers**: One-click install [obra/superpowers](https://github.com/obra/superpowers) skills.
- **Anthropic Skills**: One-click install [anthropics/skills](https://github.com/anthropics/skills) skills.
- **Community Skills (Davila7)**: One-click install community skills from [davila7](https://github.com/davila7/claude-code-templates), supports categorized selection.
- **Sync & Apply**: Use the "Apply Changes" button to sync all selected categories at once.
- **Manual Update**: Click the ↻ icon next to an item to manually fetch the latest version from GitHub.
- **File Structure**: Skills are installed to `~/.gemini/antigravity/skills/` without prefixes, maintaining original directory names.

### 4. Workflow Manager

- Browse all generated workflows in one place
- Enable/disable workflows by renaming `.md` ⇄ `.md.disable`
- Open and edit workflow files directly
- Delete workflows and their corresponding source skill folders

## Installation

### 1. From Open VSX (Recommended)

Install directly from [Open VSX Registry](https://open-vsx.org/extension/kerryang56/antigravity-skill-to-workflow)

### 2. From VSIX (Manual)

1. Download `.vsix` from [Releases](../../releases)
2. In Antigravity: `Ctrl+Shift+P` → `Extensions: Install from VSIX...`
3. Select the downloaded file

## Quick Start

| Action | Steps |
| ------ | ------ |
| **Generate Workflows** | Select skill source → Click "Generate Workflows" |
| **Import from ZIP** | Click "Select ZIP Files..." → Choose `.zip` files |
| **Import from GitHub** | Click "Import from URL..." → Paste GitHub folder URL |
| **OneKey Install Skills** | Select categories → Click "Apply Changes" |
| **Manual Update** | Click ↻ icon to fetch latest data |
| **Manage Workflows** | ⏻ Toggle · ✎ Edit · ✕ Delete |

## File Locations

| Type | Path |
| ------ | ------ |
| Skills | `~/.gemini/antigravity/skills/` |
| Workflows | `~/.gemini/antigravity/global_workflows/` |

## Feedback & Contributions

Found a bug, have a feature request, or want more OneKey Install skills? Feel free to reach out! [Open an issue](../../issues)

## License

MIT License - See [LICENSE](LICENSE) for details.

## Acknowledgments

- [jszip](https://github.com/Stuk/jszip) - ZIP file handling (MIT)
- [Superpowers](https://github.com/obra/superpowers) - AI skills for brainstorming & planning
- [Anthropic Skills](https://github.com/anthropics/skills) - Official Claude skills
- Antigravity Official [Skills Documentation](https://antigravity.google/docs/skills#example-a-code-review-skill)
- [claude-code-templates](https://github.com/davila7/claude-code-templates/tree/main/cli-tool/components/skills) by davila7 (MIT License)
