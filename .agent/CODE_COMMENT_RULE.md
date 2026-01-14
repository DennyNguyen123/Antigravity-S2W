# Code Comment Rules

## Language Requirement

**All code comments MUST be written in English.**

### Rationale

1. **International Collaboration**: English is the universal language for software development
2. **Maintainability**: Future contributors may not understand Chinese
3. **Consistency**: Aligns with industry best practices
4. **Open Source**: Makes the project accessible to global developers

---

## Comment Style Guidelines

### 1. File-Level Comments

Use JSDoc-style comments at the top of files:

```typescript
/**
 * ModuleName
 * Brief description of what this module does
 */
```

### 2. Class/Function Comments

Use JSDoc format with proper annotations:

```typescript
/**
 * Brief description of what this function does
 * @param paramName Parameter description
 * @returns Return value description
 */
```

### 3. Inline Comments

Use concise English for complex logic:

```typescript
// Check if Available Skills section already exists
if (existingContent.includes(SKILLS_SECTION_MARKER)) {
  // Check version number
  const versionMatch = existingContent.match(/<!-- S2W_RULE_VERSION:(\S+) -->/);
}
```

**Guidelines:**

- Keep brief and focused
- Explain **WHY**, not just **WHAT**
- Use proper capitalization and punctuation

### 4. TODO/FIXME/NOTE Comments

```typescript
// TODO: Implement error retry logic
// FIXME: Handle edge case when directory is locked
// NOTE: This behavior changed in v2.0
```

---

## Translation Examples

### ❌ Bad (Chinese)

```typescript
/**
 * 處理 Superpowers 安裝請求
 */
private async handleInstallSuperpowers() {
  // 發送安裝進度
  this._view?.webview.postMessage({...});
}
```

### ✅ Good (English)

```typescript
/**
 * Handle Superpowers installation request
 */
private async handleInstallSuperpowers() {
  // Send installation progress
  this._view?.webview.postMessage({...});
}
```

---

## Common Translation Patterns

| Chinese | English |
| --------- | --------- |
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
| 成功 | Success / Successful |
| 失敗 | Failure / Failed |
| 已安裝 | Installed |
| 已存在 | Already exists |
| 刷新 | Refresh |
| 複製 | Copy |
| 產生 | Generate |
| 附加 | Append |
| 目錄 | Directory |
| 檔案 | File |
| 路徑 | Path |
| 版本 | Version |
| 內容 | Content |

---

## Documentation Best Practices

### Updating CHANGELOG.md

When migrating code comments, **always update CHANGELOG.md** with details:

**Include:**

1. File-specific details with comment count
2. Translation examples (before/after)
3. Impact summary

**Format:**

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Changed

- **Code Internationalization**: Summary (total count)
  - **FileName.ts**: N comments translated
    - Category of changes
```

**Example:**

```markdown
## [0.2.1] - 2026-01-13

### Changed

- **Code Internationalization**: 79 comments translated
  - **SuperpowersInstaller.ts**: 39 comments
  - **AnthropicSkillsInstaller.ts**: 11 comments
```

---

## Tools & Automation

### Checking Chinese Characters

Use this regex to find Chinese characters in comments:

```regex
[\u4e00-\u9fff]
```

**VS Code Search:**

1. Open Search (`Ctrl+Shift+F`)
2. Enable regex mode
3. Pattern: `[\u4e00-\u9fff]`
4. Include: `**/*.ts`, `**/*.js`

---

## Enforcement

1. **Code Review**: All PRs must have English comments
2. **AI Assistant**: Always use English when generating code
3. **New Code**: All new code MUST use English from the start

## Exceptions

None. All comments must be in English.

---

## Migration Checklist

- [x] `GlobalRulesManager.ts` - ✅ Completed (15 comments)
- [x] `SuperpowersInstaller.ts` - ✅ Completed (39 comments)
- [x] `AnthropicSkillsInstaller.ts` - ✅ Completed (11 comments)
- [x] `SkillsViewProvider.ts` - ✅ Completed (14 comments)
- [x] `PathManager.ts` - ✅ No Chinese comments found
- [x] `WorkflowGenerator.ts` - ✅ No Chinese comments found
- [x] `DavilaSkillsInstaller.ts` - ✅ Completed (New file, English only)
- [x] All source files - ✅ Fully migrated

**Status**: 🎉 **100% Complete** - All code comments are now in English!

---

## Last Updated

2026-01-15 (Davila7 Integration Added)

---

**Remember**: Writing comments in English is about making the code accessible to a global audience and ensuring long-term maintainability.
