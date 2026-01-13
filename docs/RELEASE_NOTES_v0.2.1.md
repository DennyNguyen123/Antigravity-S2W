# v0.2.1 Release Notes - Detailed Changes

## Overview

This release focuses on code internationalization and implementing a versioned rule management system.

## Major Changes

### 1. Code Comments Migration to English

All Chinese comments across the codebase have been translated to English to improve international collaboration and maintainability.

#### Files Modified (79 comments translated):

##### `src/services/GlobalRulesManager.ts` (15 comments)
- Translated all JSDoc comments for class and method documentation
- Examples:
  - `負責管理 ~/.gemini/GEMINI.md 的全域規則設定` → `Manages global rules configuration in ~/.gemini/GEMINI.md`
  - `確保 Available Skills 區塊存在於 GEMINI.md` → `Ensure Available Skills section exists in GEMINI.md`
  - `檢查版本號` → `Check version number`

##### `src/services/SuperpowersInstaller.ts` (39 comments)
- Complete translation of all installation workflow comments
- Key translations:
  - `負責 Superpowers 專案的一鍵安裝流程` → `Handles one-click installation workflow for Superpowers project`
  - `執行完整安裝流程` → `Execute complete installation workflow`
  - `克隆 Superpowers 專案到本地` → `Clone Superpowers project to local directory`
  - `移除產生的 workflow 檔案` → `Remove generated workflow files`
  - `從 GEMINI.md 移除 Superpowers bootstrap 區塊` → `Remove Superpowers bootstrap block from GEMINI.md`

##### `src/services/AnthropicSkillsInstaller.ts` (11 comments)
- Translated all method and parameter documentation
- Key translations:
  - `負責 Anthropic Official Skills 的一鍵安裝流程` → `Handles one-click installation workflow for Anthropic Official Skills`
  - `檢查是否已安裝` → `Check if already installed`
  - `執行完整安裝流程` → `Execute complete installation workflow`
  - `更新已安裝的 skills` → `Update installed skills`
  - `移除 repository 目錄` → `Remove repository directory`

##### `src/SkillsViewProvider.ts` (14 comments)
- Translated frontend-backend communication comments
- Key translations:
  - `處理 Superpowers 安裝請求` → `Handle Superpowers installation request`
  - `發送安裝進度` → `Send installation progress`
  - `安裝成功` → `Installation successful`
  - `刷新 Workflow 列表` → `Refresh Workflow list`
  - `發送 Anthropic Skills 安裝狀態給前端` → `Send Anthropic Skills installation status to frontend`

### 2. Comment Guidelines Documentation

**New File: `.agent/CODE_COMMENT_RULE.md`** (188 lines)

Comprehensive documentation including:
- Language requirements (English-only policy)
- JSDoc format guidelines
- Translation examples and common patterns
- Translation reference table (40+ phrase pairs)
- Enforcement mechanisms
- Migration checklist

### 3. Versioned Rule Management System

**Modified: `src/services/GlobalRulesManager.ts`**

Implemented automatic version tracking for Global Rules:
- Added `S2W_RULE_VERSION` marker system
- Version detection and comparison logic
- Automatic replacement of outdated rules
- Backward compatibility for legacy installations

Key features:
- Current version: `1.0.0`
- Version marker: `<!-- S2W_RULE_VERSION:1.0.0 -->`
- Automatic update when version changes
- Smart section removal and replacement

### 4. Documentation Updates

**Modified: `README.md` and `README.zh-TW.md`**

Added comprehensive warnings and instructions:
- Version tracking explanation
- Manual modification warnings
- Upgrade instructions for existing users
- How versioning works (4-point explanation)

## Impact Summary

### Code Quality
- ✅ **Internationalization**: All comments now in English
- ✅ **Consistency**: Unified comment style across codebase
- ✅ **Maintainability**: Easier for global contributors

### Documentation
- ✅ **Comprehensive**: 188-line comment guideline document
- ✅ **Accessible**: Clear examples and reference tables
- ✅ **Enforceable**: Defined standards and checklists

### Version Management
- ✅ **Automated**: Rules auto-update with version changes
- ✅ **Safe**: Backward compatible with legacy installations
- ✅ **Transparent**: Clear version markers and documentation

## Translation Statistics

| File | Comments Translated | Lines Changed |
|------|---------------------|---------------|
| GlobalRulesManager.ts | 15 | +257 -20 |
| SuperpowersInstaller.ts | 39 | +108 (edits) |
| AnthropicSkillsInstaller.ts | 11 | +35 (edits) |
| SkillsViewProvider.ts | 14 | +28 (edits) |
| **Total** | **79** | **+679 -217** |

## Breaking Changes

None. All changes are backward compatible.

## Migration Notes

For users upgrading from v0.2.0 or earlier:
1. The Global Rules in `~/.gemini/GEMINI.md` will be automatically updated
2. No manual intervention required
3. Custom rules should be placed in separate sections

## Contributors

- Code internationalization: AI-assisted translation with manual review
- Version system design: Based on semantic versioning principles
- Documentation: Comprehensive guidelines for future development

---

**Release Date**: 2026-01-13  
**Version**: 0.2.1  
**Type**: Documentation & Code Quality Improvement
