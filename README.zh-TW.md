# Antigravity-S2W

[English](README.md)

---

> [!NOTE]
> **Gemini CLI** 預覽版現已原生支援 Skills 功能！前往 [google-gemini/gemini-cli](https://github.com/google-gemini/gemini-cli) 了解更多。
>
---

## 概述

**Antigravity-S2W** 是一個 Google Antigravity 延伸模組，用來把你已安裝的 AI Skills（通常是包含 `SKILL.md` 的資料夾）批次轉成 Antigravity 可使用的 Global Workflow（Markdown）檔案。

如果你在不同 AI 工具之間蒐集了不少 Skills，想要在 Antigravity 對話中用 `/` 指令就能快速選取並啟用，這個延伸模組就是為此而生。也支援從 ZIP 匯入技能包，或直接用 GitHub 資料夾網址下載安裝。

![Antigravity-S2W Screenshot](resources/screenshot.jpg)

## 功能特色

### 🔄 工作流程生成器

- 掃描多個 AI 供應商的技能目錄（Claude / Codex / Gemini）
- 解析 `SKILL.md` 的中繼資料（名稱、`description` frontmatter）
- 產生標準化的 Global Workflow `.md` 檔案

### 📦 技能匯入器

- **ZIP 匯入**：選擇並解壓縮技能套件（可一次匯入多個）
- **GitHub 下載**：直接從 GitHub 資料夾 URL 下載並安裝技能

### 📋 工作流程管理器

- 檢視所有已生成的工作流程
- 啟用/停用工作流程（改名 `.md` ⇄ `.md.disable`）
- 直接開啟並編輯工作流程檔案
- 刪除工作流程，並移除對應的來源技能資料夾

## 檔案位置與動作

- **技能來源（掃描）**
  - `~/.gemini/skills/`
  - `~/.claude/skills/`
  - `~/.codex/skills/`
  - 或你選擇的自訂資料夾
- **工作流程輸出（寫入）**
  - `~/.gemini/antigravity/global_workflows/`
- **啟用/停用**
  - 啟用：`skill-name.md`
  - 停用：`skill-name.md.disable`（同一個檔案，只是改名）
- **刪除**
  - 會從 `global_workflows/` 刪除工作流程檔案
  - 並移除 `~/.gemini/skills/` 內對應的來源技能資料夾

## 安裝方式

### 從 VSIX 安裝（手動）

1. 從 [Releases](../../releases) 下載 `.vsix` 檔案
2. 在 Google Antigravity 中：`Ctrl+Shift+P` → `Extensions: Install from VSIX...`
3. 選擇下載的檔案

## 使用說明

### 生成工作流程

1. 點擊活動列中的 **Antigravity-S2W** 圖示
2. 從下拉選單選擇 **技能來源**：
   - Gemini Skills（`~/.gemini/skills/`）
   - Claude Skills（`~/.claude/skills/`）
   - Codex Skills（`~/.codex/skills/`）
   - 或選擇自訂資料夾
3. 點擊 **Generate Workflows**
4. 工作流程會建立在 `~/.gemini/antigravity/global_workflows/`

### 從 ZIP 匯入技能

> 小提示：你可以從 [Skills Marketplace](https://skillsmp.com) 下載技能包。

1. 點擊 **Select ZIP Files...**
2. 選擇一個或多個包含技能資料夾的 `.zip` 檔案
3. 延伸模組會：
   - 解壓縮內容至 `~/.gemini/skills/[技能名稱]/`
   - 自動產生對應的工作流程

### 從 GitHub 下載技能

1. 點擊 **Download from URL...**
2. 輸入 GitHub 資料夾 URL，例如：

   ```text
   https://github.com/user/repo/tree/main/skills/my-skill
   ```

3. 延伸模組會：
   - 下載該資料夾中的所有檔案
   - 儲存至 `~/.gemini/skills/[技能名稱]/`
   - 自動產生工作流程

### 管理工作流程

| 操作 | 說明 |
| --- | --- |
| **⏻**（切換） | **啟用/停用**：將 `~/.gemini/antigravity/global_workflows/` 中的副檔名在 `.md`（啟用）與 `.md.disable`（停用）之間切換。 |
| **✎**（編輯） | **開啟檔案**：在編輯器中開啟已生成的工作流程 `.md` 檔案以進行修改。 |
| **✕**（刪除） | **移除**：從 `global_workflows/` 刪除工作流程檔案，並移除 `~/.gemini/skills/` 中的對應來源資料夾。 |

## 技能檔案格式

技能通常定義在 `SKILL.md` 中，並使用 YAML frontmatter 來放描述資訊：

```markdown
---
description: 此技能功能的簡短描述
---

# 技能名稱

詳細的文件說明與使用指南...
```

## 產生的工作流程格式

```markdown
---
description: [從 SKILL.md 擷取]
---

# 啟用技能：[技能名稱]

請閱讀並內化以下路徑的技能文件：
**`~/.gemini/skills/[技能名稱]/SKILL.md`**

## 任務
[擷取的描述]

## 指示
1. **載入脈絡**：閱讀上方提供的檔案路徑。
2. **啟用人格**：採用該文件中定義的角色。
3. **執行**：等待進一步的使用者指示。
```

## 系統需求

- Google Antigravity IDE

## 授權條款

MIT 授權 - 詳見 [LICENSE](LICENSE)

## 致謝

- [jszip](https://github.com/Stuk/jszip) - ZIP 檔案處理（MIT 授權）
