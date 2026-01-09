# AGENTS.md for Antigravity-S2W Project

## Project Overview

**Antigravity-S2W** (Skills To Workflow) is a VS Code extension that transforms AI skill definition files (`SKILL.md`) from various providers into executable workflow files.

## Purpose

This extension bridges the gap between static skill documentation and actionable IDE workflows, enabling seamless integration with AI coding assistants.

## Supported Skill Sources

| Provider | Path |
| ---------- | ------ |
| Gemini | `~/.gemini/skills/` |
| Claude | `~/.claude/skills/` |
| Codex | `~/.codex/skills/` |

## Output

Generated workflows are saved to:

```txt
~/.gemini/antigravity/global_workflows/
```

## Key Features

1. **Multi-Source Support**: Scan and process skills from Gemini, Claude, and Codex directories.
2. **ZIP Installation**: Import skill packages via ZIP files.
3. **GitHub Download**: Download skills directly from GitHub repository URLs.
4. **Workflow Management**: Enable, disable, edit, and delete generated workflows.
5. **Theme Adaptive UI**: Supports both light and dark VS Code themes.

## Development Notes

- **Language**: TypeScript
- **Build**: Webpack
- **Extension API**: VS Code Extension API v1.90+

## File Structure

```txt
src/
├── extension.ts          # Entry point
├── SkillsViewProvider.ts # Webview provider
└── services/
    ├── PathManager.ts    # Path resolution
    └── WorkflowGenerator.ts # Workflow creation
```

## License

See LICENSE file for details.
