# Antigravity-S2W Git Workflow & Policies

This document outlines the Git workflow and versioning policies for the `Antigravity-S2W` project.

## 1. Versioning Strategy (Semantic Versioning)

This project follows [Semantic Versioning 2.0.0](https://semver.org/).

**Version Format**: `MAJOR.MINOR.PATCH`

* **MAJOR**: Incompatible API changes.
* **MINOR**: Backward-compatible functionality (New Features), such as:
  * New skills or workflows.
  * Significant UI changes.
  * New configuration options.
* **PATCH**: Backward-compatible bug fixes.

**Release Workflow**:

1. **Update Version**: Manually update `version` in `package.json`.
2. **Update Changelog**: Document changes in `CHANGELOG.md`.
3. **Commit**: Commit changes (e.g., `chore: bump version to 0.1.0`).
4. **Tag**: Create and push a git tag (e.g., `v0.1.0`) to trigger the CI release pipeline.

## 2. Commit Message Convention

Follow the **Conventional Commits** specification.

**Language Requirement**:

* **Subject & Body**: MUST be in **English**.

**Format**: `<type>(<scope>): <subject>`

**Common Types**:

* `feat`: A new feature
* `fix`: A bug fix
* `docs`: Documentation only changes
* `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc)
* `refactor`: A code change that neither fixes a bug nor adds a feature
* `perf`: A code change that improves performance
* `test`: Adding missing tests or correcting existing tests
* `chore`: Changes to the build process or auxiliary tools and libraries

**Examples**:

* `feat: add webview compatibility warning`
* `fix(zip): resolve extraction path issue`
* `docs: update README requirements`
* `chore: exclude .agent directory from version control`

## 3. Workflow Summary

1. Make changes locally.
45: 1. Make changes locally.
46: 2. Ensure `package.json` version is updated (if applicable).
2. Commit using the naming convention (e.g., `git commit -m "feat: description"`).
3. Push to `main`.
4. **To Release**:
    * Create a tag: `git tag v0.0.x`
    * Push the tag: `git push origin v0.0.x`
