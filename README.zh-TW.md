# Antigravity-S2W

[English](README.md)

> [!NOTE]
> **更新於 2026-01-13**
>
> - **Gemini CLI** 預覽版現已原生支援 Skills！前往 [google-gemini/gemini-cli](https://github.com/google-gemini/gemini-cli) 了解更多。
> - **一鍵安裝 Superpowers** 為實驗性功能，正等待官方合併：[feat: Add Antigravity IDE integration](https://github.com/obra/superpowers/pull/192)。Bootstrap 指令會失敗，但本擴充套件會自動將 Superpowers 技能轉換為 Global Workflows，可透過 `/` 指令使用。

![Antigravity-S2W Screenshot](resources/screenshot.jpg)

## 系統需求

> [!IMPORTANT]
> 本擴充套件需要 **Google Antigravity IDE** 才能運作。

## 功能特色

將您安裝的 AI Skills 轉換為 Antigravity Global Workflow 檔案。整合來自不同 AI 工具的技能，在 Antigravity 中用 `/` 指令快速使用。

### 1. 工作流程生成器

- 掃描多個供應商的技能目錄（Claude / Codex / Gemini）
- 從 `SKILL.md` 讀取中繼資料（名稱 + `description` frontmatter）
- 生成標準化的 Global Workflow `.md` 檔案

### 2. 技能匯入器

- **ZIP 匯入**：從一個或多個 ZIP 檔案解壓縮技能套件
- **GitHub 下載**：直接從 GitHub 資料夾 URL 下載安裝
- 支援 [Skills Marketplace](https://skillsmp.com) 技能包

### 3. 技能來源開關

- **Superpowers**：一鍵安裝/移除 [obra/superpowers](https://github.com/obra/superpowers)
- **Anthropic Skills**：一鍵安裝/移除 [anthropics/skills](https://github.com/anthropics/skills)
- 安裝後自動產生對應的工作流程
- 附帶更新按鈕以拉取最新變更

### 4. 工作流程管理器

- 在同一介面瀏覽所有已生成的工作流程
- 啟用/停用工作流程（`.md` ⇄ `.md.disable`）
- 直接開啟並編輯工作流程檔案
- 刪除工作流程及其對應的來源技能資料夾

### 5. 自動設定

- 首次啟動自動在 `~/.gemini/GEMINI.md` 加入「Available Skills」區塊
- AI 代理會自動從信任目錄發現可用技能
- **版本追蹤更新**：當延伸模組更新規則時，會自動替換舊版本區塊
- 版本標記：`<!-- S2W_RULE_VERSION:1.0.0 -->`

> [!IMPORTANT]
> **關於手動修改的重要提醒**
>
> - ❌ **請勿**手動編輯 `GEMINI.md` 中的 `## Available Skills` 區塊
> - ✅ **請將**您的自訂規則放在 `GEMINI.md` 的其他區塊中
> - ⚠️ **從舊版升級？**建議先手動移除 `GEMINI.md` 內的舊版 `## Available Skills` 區塊，再更新延伸模組，以確保新版本能正確附加

**版本化機制說明：**

- 首次安裝：附加規則並加上版本標記
- 版本相同：不做任何變更
- 新版本：自動替換舊規則為最新內容
- 無版本標記（舊版）：視為 v0.0.0 並更新至目前版本

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
| **開關技能來源** | 開啟 = 安裝，關閉 = 移除 |
| **管理工作流程** | ⏻ 開關 · ✎ 編輯 · ✕ 刪除 |

## 檔案位置

| 類型 | 路徑 |
| ------ | ------ |
| 技能來源 | `~/.gemini/skills/`、`~/.claude/skills/`、`~/.codex/skills/` |
| 產生的工作流程 | `~/.gemini/antigravity/global_workflows/` |
| 全域規則 | `~/.gemini/GEMINI.md` |
| Superpowers | `~/.antigravity/superpowers/` |
| Anthropic Skills | `~/.antigravity/anthropic-skills/` |

## 技能檔案格式

技能定義在 `SKILL.md` 中，使用 YAML frontmatter：

```markdown
---
description: 此技能功能的簡短描述
---

# 技能名稱

詳細的文件說明與使用指南...
```

## 意見回饋與貢獻

發現問題或有功能建議？歡迎 [開 Issue](../../issues) — 期待您的意見！

## 授權條款

MIT 授權 - 詳見 [LICENSE](LICENSE)

## 致謝

- [jszip](https://github.com/Stuk/jszip) - ZIP 檔案處理（MIT）
- [Superpowers](https://github.com/obra/superpowers) - AI 技能：腦力激盪與規劃
- [Anthropic Skills](https://github.com/anthropics/skills) - Anthropic 官方 Claude 技能
