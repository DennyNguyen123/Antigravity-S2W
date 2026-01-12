# Antigravity-S2W

[繁體中文](README.zh-TW.md)

> [!NOTE]
> **Updated on 2026-01-12**
>
> - **Gemini CLI** preview now natively supports Skills! Learn more at [google-gemini/gemini-cli](https://github.com/google-gemini/gemini-cli).
> - **OneKey Install Superpowers** is an experimental feature pending upstream merge: [feat: Add Antigravity IDE integration](https://github.com/obra/superpowers/pull/192). The bootstrap command will fail, but this extension automatically converts Superpowers skills to Global Workflows, making them available via `/` commands.

![Antigravity-S2W Screenshot](resources/screenshot.jpg)

## Requirements

> [!IMPORTANT]
> This extension requires **Google Antigravity IDE** to function.

## Features

Transform your installed AI Skills into Antigravity Global Workflow files. Collect skills from different AI tools and use them in Antigravity with a simple `/` command.

### 1. Workflow Generator

- Scan skill directories from multiple providers (Claude / Codex / Gemini)
- Read metadata from `SKILL.md` (name + `description` frontmatter)
- Generate standardized Global Workflow `.md` files

### 2. Skill Importer

- **ZIP import**: Extract skill packages from one or more ZIP files
- **GitHub download**: Install skills directly from a GitHub folder URL
- Supports [Skills Marketplace](https://skillsmp.com) packages

### 3. Skills Source Toggles

- **Superpowers**: One-click install/uninstall [obra/superpowers](https://github.com/obra/superpowers)
- **Anthropic Skills**: One-click install/uninstall [anthropics/skills](https://github.com/anthropics/skills)
- Automatic workflow generation from installed skills
- Update button to pull latest changes

### 4. Workflow Manager

- Browse all generated workflows in one place
- Enable/disable workflows by renaming `.md` ⇄ `.md.disable`
- Open and edit workflow files directly
- Delete workflows and their corresponding source skill folders

### 5. Auto-Configuration

- Automatically adds "Available Skills" section to `~/.gemini/GEMINI.md` on first activation
- AI agents will discover skills from trusted directories
- One-time setup, no duplicate entries

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
| **Toggle Skills Sources** | Turn ON to install, OFF to uninstall |
| **Manage Workflows** | ⏻ Toggle · ✎ Edit · ✕ Delete |

## File Locations

| Type | Path |
| ------ | ------ |
| Skill Sources | `~/.gemini/skills/`, `~/.claude/skills/`, `~/.codex/skills/` |
| Generated Workflows | `~/.gemini/antigravity/global_workflows/` |
| Global Rules | `~/.gemini/GEMINI.md` |
| Superpowers | `~/.antigravity/superpowers/` |
| Anthropic Skills | `~/.antigravity/anthropic-skills/` |

## Skill File Format

Skills are defined in `SKILL.md` using YAML frontmatter:

```markdown
---
description: A brief description of what this skill does
---

# Skill Name

Detailed documentation and instructions...
```

## Feedback & Contributions

Found a bug or have a feature request? [Open an issue](../../issues) — we welcome suggestions!

## License

MIT License - See [LICENSE](LICENSE) for details.

## Acknowledgments

- [jszip](https://github.com/Stuk/jszip) - ZIP file handling (MIT)
- [Superpowers](https://github.com/obra/superpowers) - AI skills for brainstorming & planning
- [Anthropic Skills](https://github.com/anthropics/skills) - Official Claude skills
