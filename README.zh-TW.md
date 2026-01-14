# Antigravity-S2W

[English](README.md)

> [!NOTE]
> **更新於 2026-01-14**
>
> - **Gemini CLI** 已正式支援 Agent Skills！詳見 [v0.24.0 Release](https://github.com/google-gemini/gemini-cli/releases/tag/v0.24.0)。

## 系統需求

本擴充套件需要 **Google Antigravity IDE** 才能運作。關於 Antigravity Skill 可參考
[官方文檔](https://antigravity.google/docs/skills#example-a-code-review-skill)

## 延伸模組截圖

![Antigravity-S2W Screenshot](resources/screenshot.jpg)

## 功能特色

將您安裝的 AI Skills 轉換為 Antigravity Global Workflow 檔案。整合來自不同 AI 工具的技能，在 Antigravity 中用 `/` 指令快速呼叫。

### 1. 工作流程生成器

- 掃描 Gemini 的技能目錄
- 從 `SKILL.md` 讀取中繼資料（名稱 + `description` frontmatter）
- 生成標準化的 Global Workflow `.md` 檔案

### 2. 技能匯入器

- **ZIP 匯入**：從一個或多個 ZIP 檔案解壓縮技能套件
- **GitHub 下載**：直接從 GitHub 資料夾 URL 下載安裝
- 支援 [Skills Marketplace](https://skillsmp.com) 技能包

### 3. 一鍵匯入技能 (OneKey Install)

提供簡易替代方式，直接從 Github 官方儲藏庫抓取技能：

- **Superpowers**：一鍵安裝 [obra/superpowers](https://github.com/obra/superpowers) 技能
- **Anthropic Skills**：一鍵安裝 [anthropics/skills](https://github.com/anthropics/skills) 技能
- **Community Skills (Davila7)**：一鍵安裝 [davila7](https://github.com/davila7/claude-code-templates) 社群技能，支援複選多種主題分類。
- **同步更新 (Sync & Apply)**：透過「Apply Changes」按鈕一次更新所有選取的分類及項目。
- **手動更新 (Manual Update)**：點擊項目右側的 ↻ 圖示手動抓取 GitHub 最新版本。
- **檔案目錄**：技能安裝至 `~/.gemini/antigravity/skills/`，維持原始目錄結構。

### 4. 工作流程管理器

- 在同一介面瀏覽所有已生成的工作流程
- 啟用/停用工作流程（`.md` ⇄ `.md.disable`）
- 直接開啟並編輯工作流程檔案
- 刪除工作流程及其對應的來源技能資料夾

## 安裝方式

### 1. 從 Open VSX 安裝（推薦）

直接從 [Open VSX Registry](https://open-vsx.org/extension/kerryang56/antigravity-skill-to-workflow) 安裝

### 2. 從 VSIX 安裝（手動）

1. 從 [Releases](../../releases) 下載 `.vsix` 檔案
2. 在 Antigravity 中：`Ctrl+Shift+P` → `Extensions: Install from VSIX...`
3. 選擇下載的檔案

## 快速開始

| 操作 | 步驟 |
| ------ | ------ |
| **生成工作流程** | 選擇技能來源 → 點擊「Generate Workflows」 |
| **從 ZIP 匯入** | 點擊「Select ZIP Files...」→ 選擇 `.zip` 檔案 |
| **從 GitHub 匯入** | 點擊「Import from URL...」→ 貼上 GitHub 資料夾網址 |
| **一鍵匯入技能** | 開啟/選取分類 → 點擊「Apply Changes」 |
| **手動更新技能** | 點擊 ↻ 圖示直接抓取最新資料 |
| **管理工作流程** | ⏻ 開關 · ✎ 編輯 · ✕ 刪除 |

## 檔案位置

| 類型 | 路徑 |
| ------ | ------ |
| 技能 | `~/.gemini/antigravity/skills/` |
| 工作流程 | `~/.gemini/antigravity/global_workflows/` |

## 意見回饋與貢獻

發現問題、新功能建議、一鍵匯入更多Skills？都歡迎與我聯繫。期待您的意見！ [Open an issue](../../issues)

## 授權條款

MIT 授權 - 詳見 [LICENSE](LICENSE)

## 致謝

- [jszip](https://github.com/Stuk/jszip) by Stuk (MIT License)
- [Superpowers](https://github.com/obra/superpowers) by obra (MIT License)
- [Anthropic Skills](https://github.com/anthropics/skills) by Anthropic
- [claude-code-templates](https://github.com/davila7/claude-code-templates/tree/main/cli-tool/components/skills) by davila7 (MIT License)
