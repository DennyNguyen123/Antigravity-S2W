# Antigravity-S2W

[繁體中文](README.zh-TW.md)

---

> [!NOTE]
> **Gemini CLI** preview now natively supports Skills! Learn more at [google-gemini/gemini-cli](https://github.com/google-gemini/gemini-cli).
>

---

## Overview

**Antigravity-S2W** is a Google Antigravity extension that turns your installed AI Skills (typically folders containing `SKILL.md`) into Antigravity Global Workflow Markdown files.

If you’ve collected skills across different tools and want them usable in Antigravity with a simple `/` command, this extension helps you generate and manage them in one place. You can also import skills from ZIP files or install them directly from a GitHub folder URL.

![Antigravity-S2W Screenshot](resources/screenshot.jpg)

## Features

### 🔄 Workflow Generator

- Scan skill directories from multiple providers (Claude / Codex / Gemini)
- Read metadata from `SKILL.md` (name + `description` frontmatter)
- Generate clean, standardized Global Workflow `.md` files

### 📦 Skill Importer

- **ZIP import**: Pick one or more ZIPs and extract skill folders
- **GitHub download**: Install skills from a GitHub folder URL

### 📋 Workflow Manager

- Browse all generated workflows
- Enable/disable workflows by renaming `.md` ⇄ `.md.disable`
- Open and edit workflow files directly
- Remove workflows and their corresponding source skill folders

## File Locations & Actions

- **Skill sources (scanned)**
  - `~/.gemini/skills/`
  - `~/.claude/skills/`
  - `~/.codex/skills/`
  - Or a custom folder you choose
- **Generated workflows (written to)**
  - `~/.gemini/antigravity/global_workflows/`
- **Enable/disable**
  - Enabled: `skill-name.md`
  - Disabled: `skill-name.md.disable` (same file, just renamed)
- **Delete**
  - Removes the workflow file from `global_workflows/`
  - Also removes the corresponding folder under `~/.gemini/skills/`

## Installation

### From VSIX (Manual)

1. Download the `.vsix` file from [Releases](../../releases)
2. In Google Antigravity: `Ctrl+Shift+P` → `Extensions: Install from VSIX...`
3. Select the downloaded file

## Usage

### Generate Workflows

1. Click the **Antigravity-S2W** icon in the Activity Bar
2. Pick a **Skill Source** from the dropdown:
   - Gemini Skills (`~/.gemini/skills/`)
   - Claude Skills (`~/.claude/skills/`)
   - Codex Skills (`~/.codex/skills/`)
   - Or select a custom folder
3. Click **Generate Workflows**
4. Workflows are created in `~/.gemini/antigravity/global_workflows/`

### Import Skills from ZIP

> Tip: You can download skill packages from [Skills Marketplace](https://skillsmp.com).

1. Click **Select ZIP Files...**
2. Choose one or more `.zip` files containing skill folders
3. The extension will:
   - Extract contents to `~/.gemini/skills/[skill-name]/`
   - Generate workflows automatically

### Download Skills from GitHub

1. Click **Download from URL...**
2. Enter a GitHub folder URL, for example:

   ```text
   https://github.com/user/repo/tree/main/skills/my-skill
   ```

3. The extension will:
   - Download all files from that folder
   - Save them to `~/.gemini/skills/[skill-name]/`
   - Generate workflows automatically

### Manage Workflows

| Action | Description |
| --- | --- |
| **⏻** (Toggle) | **Enable/Disable**: Renames the workflow file in `~/.gemini/antigravity/global_workflows/` between `.md` (enabled) and `.md.disable` (disabled). |
| **✎** (Edit) | **Open File**: Opens the generated workflow `.md` file for editing. |
| **✕** (Delete) | **Remove**: Deletes the workflow file from `global_workflows/` and removes the corresponding source folder from `~/.gemini/skills/`. |

## Skill File Format

Skills are usually defined in `SKILL.md` using YAML frontmatter:

```markdown
---
description: A brief description of what this skill does
---

# Skill Name

Detailed documentation and instructions...
```

## Generated Workflow Format

```markdown
---
description: [Extracted from SKILL.md]
---

# Activate Skill: [skill-name]

Please read and internalize the skill documentation located at:
**`~/.gemini/skills/[skill-name]/SKILL.md`**

## Mission
[Extracted description]

## Instructions
1. **Load Context**: Read the file path provided above.
2. **Activate Persona**: Adopt the role defined in that document.
3. **Execute**: Await further user instructions.
```

## Requirements

- Google Antigravity IDE

## License

MIT License - See [LICENSE](LICENSE) for details.

## Acknowledgments

- [jszip](https://github.com/Stuk/jszip) - ZIP file handling (MIT License)
