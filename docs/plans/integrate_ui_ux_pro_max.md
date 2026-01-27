# Implementation Plan: Integrate UI/UX Pro Max Skill One-Key Import

## Goal

Integrate the "One-Key Import" functionality for the [UI/UX Pro Max Skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) into the Antigravity-S2W VS Code Extension. This allows users to specific:

1. **Install** the skill with one click.
2. **Browse** the official design gallery within VS Code to copy prompts.

## Overview

The integration involves four main layers:

1. **Service Layer**: A new `UiUxProMaxInstaller` class to handle downloading, extracting, and configuring the skill files (simulating the `uipro-cli` logic).
2. **Controller Layer**: Updating `SkillsViewProvider` to handle installation and gallery opening requests.
3. **UI Layer (Manager)**: Adding "Install" and "Open Gallery" buttons in the main side-panel Webview.
4. **UI Layer (Gallery)**: A new Webview Panel acting as a dedicated tab to display the official demo website.

## Detailed Steps

### Phase 1: Installer Service (`src/services/UiUxProMaxInstaller.ts`)

Create a dedicated installer handling the GitHub ZIP download and extraction.

- **Dependencies**: `JSZip`, `fs`, `path`, `https` (native), `WorkflowGenerator`.
- **Key Methods**:
  - `install(onProgress)`: Main entry point.
  - `downloadZip()`: Downloads `https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/archive/refs/heads/main.zip`.
  - `extractAndConfigure()`:
    - Extracts `cli/assets/data/` -> `.agent/skills/ui-ux-pro-max/data/`
    - Extracts `cli/assets/scripts/` -> `.agent/skills/ui-ux-pro-max/scripts/`
  - `generateSkillFile()`: Combines `agent.json` (hardcoded config) and `skill-content.md` template into `.agent/skills/ui-ux-pro-max/SKILL.md`.

### Phase 2: Main Controller (`src/SkillsViewProvider.ts`)

Update the main provider to handle new commands from the frontend.

- **Import**: Import `UiUxProMaxInstaller`.
- **Properties**: `private uiUxInstaller: UiUxProMaxInstaller;`
- **Message Handling**:
  - `installUiUxProMax`: Calls `uiUxInstaller.install()`.
  - `openUiUxGallery`: Calls new method `handleOpenGallery()`.
  - `checkUiUxProMax`: Returns installation status.

### Phase 3: Gallery Controller (New Webview Panel)

Implement `handleOpenGallery()` in `SkillsViewProvider` (or a separate class/method).

- **Function**: `createWebviewPanel` to open a new tab.
- **Content**: A simple HTML shell containing a full-screen `<iframe>`.
- **Source**: `https://ui-ux-pro-max-skill.nextlevelbuilder.io/#styles`
- **Permissions**: Enable scripts and adjust `Content-Security-Policy` to allow framing the official site.
- **Singleton**: Ensure only one Gallery tab is open at a time (reveal if already open).

### Phase 4: Frontend UI (`src/webview/`)

Update the side-panel UI.

- **HTML (`index.html`)**:
  - Add a "Feature Spotlight" or "UI/UX Pro Max" card.
  - Button 1: "Install Skill" (calls `installUiUxProMax`).
  - Button 2: "Browse Gallery" (calls `openUiUxGallery`).
- **JS (`main.js`)**:
  - Event listeners for buttons.
  - Status updates (spinner during install, checkmark when done).

## Verification Plan

1. **Install Test**: Click "Install" -> Verify `.agent/skills/ui-ux-pro-max` exists and `SKILL.md` is correct.
2. **Gallery Test**: Click "Browse Gallery" -> Verify a new tab opens with the official website loaded.
3. **Copy Test**: In Gallery, click a "Copy Prompt" button -> Verify prompt is in system clipboard (User manual paste).
