# Changelog
<!-- markdownlint-disable -->

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.


## [0.2.2]

### Added

- **OneKey Install Skills**: Name and Description columns can now be resized independently.
- **UI Enhancement**: Added text wrapping support for long skill names.

### Fixed

- **Superpowers Status**: Fixed status sync issue where installed skills appeared as not installed.
- **Table Resizing**: Improved column resizer usability and visibility.

## [0.2.1]

### Added

- **CODE_COMMENT_RULE.md**: Comprehensive comment guidelines document (188 lines)
  - Language requirements (English-only policy)
  - JSDoc format guidelines
  - Translation examples and 40+ common phrase pairs
  - Enforcement mechanisms and migration checklist

### Changed

- **Code Internationalization**: Migrated all code comments from Chinese to English (79 comments translated)
  - **GlobalRulesManager.ts**: 15 comments translated
    - Class and method documentation
    - Version checking and section management logic
  - **SuperpowersInstaller.ts**: 39 comments translated
    - Installation workflow documentation
    - Repository cloning and configuration steps
    - Workflow generation and removal processes
  - **AnthropicSkillsInstaller.ts**: 11 comments translated
    - Installation and update workflow documentation
    - Repository and workflow management
  - **SkillsViewProvider.ts**: 14 comments translated
    - Frontend-backend communication handlers
    - Installation progress and status management

- **Version Management System**: Implemented S2W_RULE_VERSION mechanism
  - Automatic version tracking for Global Rules (`GEMINI.md`)
  - Smart detection and replacement of outdated rules
  - Backward compatibility for legacy installations (treats missing version as v0.0.0)
  - Current version marker: `<!-- S2W_RULE_VERSION:1.0.0 -->`

- **Documentation Updates**: Enhanced README files with version management warnings
  - Added important notice about manual modifications
  - Provided upgrade instructions for existing users
  - Explained how versioning works (4-point explanation)

## [0.1.0] - 2026-01-12

### Added

- **OneKey Install Skills**: New table layout for quickly installing/toggling system skills (Superpowers, Anthropic Skills).
- **Resizable Columns**: Users can now drag to resize the "Name" column in both Skills and Workflows tables.
- **Global Rules Manager**: Automatic configuration of Antigravity Global Rules (`GEMINI.md`) upon activation.

### Changed

- **UI Refinement**: Adopted "Refined Utility" design theme.
  - Standardized button sizes (28px) and border radius (6px/12px).
  - Unified header colors to primary blue.
  - Improved grid alignment and spacing.
- **Renamed Section**: "QUICKLY INSTALL SKILLS" is now "ONEKEY INSTALL SKILLS".
- **Compact Toggles**: Reduced toggle switch size in the Skills table for a cleaner look.

### Fixed

- **File Selection Bug**: Fixed an issue where cancelling the "Select ZIP Files" dialog would leave the UI in a frozen "Waiting" state.
- **Button Deformation**: Fixed reset button aspect ratio issues.
