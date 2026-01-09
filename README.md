# Antigravity-S2W (Skills To Workflow)

> **Transform AI skill definitions into executable IDE workflows**

[繁體中文](README.zh-TW.md)

---

> [!NOTE]
> **Gemini CLI** preview now natively supports Skills! Learn more at [google-gemini/gemini-cli](https://github.com/google-gemini/gemini-cli).
>
> This project provides a alternative way for [Antigravity IDE](https://antigravity.dev) users. It generates workflow files that direct Antigravity to locate and execute skills from `SKILL.md` definitions. Once generated, users can invoke skills using the **`/` (slash command)** in the chat interface.

---

## Overview

**Antigravity-S2W** is a VS Code extension that batch-analyzes installed Skill files. It converts them into simple Global Workflows, allowing you to select and invoke skills via the `/` command in Antigravity chat. It also supports manually selecting Skill ZIP files or installing Skills directly from GitHub URLs.

## Features

### 🔄 Workflow Generator

- Scan skill directories from multiple AI providers
- Parse `SKILL.md` metadata (name, description)
- Generate standardized workflow files

### 📦 Skill Importer

- **ZIP Import**: Select and extract skill packages
- **GitHub Download**: Fetch skills directly from GitHub repository URLs

### 📋 Workflow Manager

- View all generated workflows
- Enable/Disable workflows (toggle `.disable` suffix)
- Edit workflow files directly
- Delete workflows and source files

## How It Works

```text
┌─────────────────────────────────────────────────────────────────┐
│                        SKILL SOURCES                            │
├─────────────────────────────────────────────────────────────────┤
│  ~/.gemini/skills/      (Gemini Skills)                         │
│  ~/.claude/skills/      (Claude Skills)                         │
│  ~/.codex/skills/       (Codex Skills)                          │
│  [Custom Folder]        (User-selected)                         │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ANTIGRAVITY-S2W                              │
├─────────────────────────────────────────────────────────────────┤
│  1. Scan selected source directory                              │
│  2. Find SKILL.md or README.md in each subdirectory             │
│  3. Parse YAML frontmatter (name, description)                  │
│  4. Generate workflow .md file with skill reference             │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        OUTPUT                                   │
├─────────────────────────────────────────────────────────────────┤
│  ~/.gemini/antigravity/global_workflows/                        │
│  ├── skill-name-1.md                                            │
│  ├── skill-name-2.md                                            │
│  └── skill-name-3.md.disable  (disabled)                        │
└─────────────────────────────────────────────────────────────────┘
```

## Installation

### From VSIX (Manual)

1. Download the `.vsix` file from [Releases](../../releases)
2. In VS Code: `Ctrl+Shift+P` → `Extensions: Install from VSIX...`
3. Select the downloaded file

### From Source

```bash
git clone https://github.com/YOUR_USERNAME/antigravity-s2w.git
cd antigravity-s2w
npm install
npm run compile
# Press F5 in VS Code to launch Extension Development Host
```

## Usage

### Generate Workflows

1. Click the **Antigravity-S2W** icon in the Activity Bar
2. Select a **Skill Source** from the dropdown:
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
   - Automatically generate workflows

### Download Skills from GitHub

1. Click **Download from URL...**
2. Enter a GitHub folder URL, e.g.:

   ```text
   https://github.com/user/repo/tree/main/skills/my-skill
   ```

3. The extension will:
   - Download all files from the folder
   - Save to `~/.gemini/skills/[skill-name]/`
   - Generate workflows

### Manage Workflows

| Action | Description |
| --- | --- |
| **⏻** (Toggle) | **Enable/Disable**: Renames the file extension in `~/.gemini/antigravity/global_workflows/` between `.md` (enabled) and `.md.disable` (disabled). |
| **✎** (Edit) | **Open File**: Opens the generated workflow `.md` file in the editor for direct modification. |
| **✕** (Delete) | **Remove**: Deletes the workflow file from `global_workflows/` AND removes the corresponding source folder from `~/.gemini/skills/`. |

## Skill File Format

Skills are defined in `SKILL.md` with YAML frontmatter:

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

- VS Code 1.90.0 or higher
- Node.js (for development)

## License

MIT License - See [LICENSE](LICENSE) for details.

## Acknowledgments

- [jszip](https://github.com/Stuk/jszip) - ZIP file handling (MIT License)
