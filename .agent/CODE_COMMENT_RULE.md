# Code Comment Rules

## Language Requirement

**All code comments MUST be written in English.**

### Rationale

1. **International Collaboration**: English is the universal language for software development
2. **Maintainability**: Future contributors may not understand Chinese
3. **Consistency**: Aligns with industry best practices
4. **Open Source**: Makes the project accessible to global developers

## Comment Style Guidelines

### 1. File-Level Comments

Use JSDoc-style comments at the top of files to describe the module's purpose:

```typescript
/**
 * ModuleName
 * Brief description of what this module does
 */
```

**Example:**

```typescript
/**
 * GlobalRulesManager
 * Manages global rules configuration in ~/.gemini/GEMINI.md
 */
```

### 2. Class/Function Comments

Use JSDoc format for classes and functions:

```typescript
/**
 * Brief description of what this function does
 * @param paramName Parameter description
 * @returns Return value description
 */
```

**Example:**

```typescript
/**
 * Ensure Available Skills section exists in GEMINI.md
 * Appends on first install, automatically replaces old section on version update
 */
public ensureSkillsSection(): void {
  // ...
}
```

### 3. Inline Comments

Use concise English comments for complex logic:

```typescript
// Check if Available Skills section already exists
if (existingContent.includes(SKILLS_SECTION_MARKER)) {
  // Check version number
  const versionMatch = existingContent.match(/<!-- S2W_RULE_VERSION:(\S+) -->/);
  //...
}
```

**Guidelines:**

- Keep inline comments brief and focused
- Explain **WHY**, not just **WHAT**
- Use proper capitalization and punctuation

### 4. TODO/FIXME/NOTE Comments

Use standard markers for action items:

```typescript
// TODO: Implement error retry logic
// FIXME: Handle edge case when directory is locked
// NOTE: This behavior changed in v2.0
```

## Comment Translation Examples

### ❌ Bad (Chinese)

```typescript
/**
 * 處理 Superpowers 安裝請求
 */
private async handleInstallSuperpowers() {
  // 發送安裝進度
  this._view?.webview.postMessage({
    command: "superpowersProgress",
    text: "Installing Superpowers..."
  });

  // 安裝成功
  //...
}
```

### ✅ Good (English)

```typescript
/**
 * Handle Superpowers installation request
 */
private async handleInstallSuperpowers() {
  // Send installation progress
  this._view?.webview.postMessage({
    command: "superpowersProgress",
    text: "Installing Superpowers..."
  });

  // Installation successful
  //...
}
```

## Common Translation Patterns

| Chinese | English |
|---------|---------|
| 處理...請求 | Handle ... request |
| 發送...給前端 | Send ... to frontend |
| 檢查是否... | Check if ... / Check whether ... |
| 確保...存在 | Ensure ... exists |
| 取得... | Get ... / Retrieve ... |
| 移除... | Remove ... / Delete ... |
| 更新... | Update ... |
| 執行... | Execute ... / Perform ... |
| 讀取... | Read ... / Load ... |
| 寫入... | Write ... / Save ... |
| 如果...則... | If ..., then ... |
| 成功 | Success / Successful |
| 失敗 | Failure / Failed |
| 已安裝 | Installed |
| 已存在 | Already exists / Exists |
| 刷新 | Refresh |
| 複製 | Copy |
| 產生 | Generate |
| 附加 | Append |
| 目錄 | Directory |
| 檔案 | File |
| 路徑 | Path |
| 版本 | Version |
| 內容 | Content |
| 設定 | Configuration / Settings |
| 進度 | Progress |

## Enforcement

1. **Code Review**: All PRs must have English comments
2. **AI Assistant**: When generating code, always use English comments
3. **Refactoring**: Gradually migrate existing Chinese comments to English
4. **New Code**: All new code MUST use English comments from the start

## Exceptions

None. All comments must be in English without exception.

## Tools & Automation

### Checking Chinese Characters in Comments

Use this regex pattern to find Chinese characters in code comments:

```regex
[\u4e00-\u9fff]
```

### VS Code Search

1. Open Search (Ctrl+Shift+F)
2. Enable regex mode
3. Search pattern: `[\u4e00-\u9fff]`
4. Include: `**/*.ts`, `**/*.js`

---

**Remember**: Writing comments in English is not just about translation—it's about making the code accessible to a global audience and ensuring long-term maintainability.
