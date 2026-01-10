# AGENTS.md (Antigravity-S2W)

## Repository Purpose

Antigravity-S2W is a VS Code extension that converts installed AI skill definition
folders (typically containing `SKILL.md`) into executable Antigravity workflow
Markdown files.

## Agent Operating Notes

- Prefer small, focused changes.
- Avoid adding new tooling unless requested.
- Do not `git commit` unless the user asks.

## Cursor / Copilot Rules

No Cursor rules were found (no `.cursor/rules/` or `.cursorrules`).
No Copilot instructions were found (no `.github/copilot-instructions.md`).

## Commands

### Install

- `npm ci` (preferred for CI/reproducible installs)
- `npm install` (acceptable for local development)

### Build

- `npm run compile` (Webpack dev build)
- `npm run watch` (Webpack watch)
- `npm run package` (Production build)
- `npm run vscode:prepublish` (Publish-time build)

### Lint

- `npm run lint` (ESLint over `src/**/*.ts`)

### Tests

- `npm test` (runs `node ./out/test/runTest.js`)
- `npm run pretest` (runs `compile-tests`, `compile`, `lint`)
- `npm run compile-tests` (compiles tests to `out/`)
- `npm run watch-tests` (watch test compilation)

#### Run A Single Test

This repo currently has no first-party test files checked in. If you add tests
(compiled to `out/test/`), run a single test file with:

```bash
npx mocha "out/test/yourTestFile.js"
```

Or run all compiled tests with a pattern:

```bash
npx mocha "out/test/**/*.js" --grep "pattern"
```

## Tech Stack

- TypeScript (`strict: true`), CommonJS, target ES6.
- Build via Webpack (Node target) + `ts-loader`.
- VS Code API externalized as `vscode` in webpack.
- ZIP handling uses `jszip`.

## Project Layout

```txt
src/
--extension.ts
--SkillsViewProvider.ts
--services/
----PathManager.ts
----WorkflowGenerator.ts
--webview/
----index.html
----main.js
----style.css
dist/        (webpack output)
out/         (test build output)
```

## Code Style Guidelines

### Formatting

- Indentation: tabs.
- Semicolons: required.
- Keep lines readable (aim ~100 chars).

### Imports

- Prefer namespace imports for Node/VS Code built-ins:
  - `import * as fs from "fs";`
  - `import * as path from "path";`
  - `import * as vscode from "vscode";`
- Local imports use relative paths.
- Prefer double quotes for new code; avoid quote-style churn.

### Naming

- Classes / types / interfaces: `PascalCase`.
- Functions / methods / variables: `camelCase`.
- Private VS Code provider fields: `_prefix` (e.g., `_view`).

### Types

- Keep strict TypeScript compatibility.
- Add explicit return types for exported/public methods.
- Prefer precise types over `any` (use `any` only when unavoidable).
- Async APIs return `Promise<T>`.

### Error Handling

- Use `try/catch` around file I/O, network calls, and workflow generation.
- Prefer `catch (e: any)` when you need `e.message`.
- Log unexpected errors via `console.error(...)`.
- User-facing errors should use `vscode.window.showErrorMessage(...)`.
- Webview errors should use `postMessage({ command: "status", type: "error", ... })`.

### File I/O

- Existence checks: `fs.existsSync(...)`.
- Create directories: `fs.mkdirSync(dir, { recursive: true })`.
- Remove files/folders: `fs.rmSync(path, { recursive: true, force: true })`.
- Prefer `path.join(...)` and `path.normalize(...)`.

### Async/Await

- Prefer `async/await` over raw Promises.
- Prefer `fs.promises.*` in async code.

### VS Code Patterns

- Commands are registered in `src/extension.ts`.
- Webview message handling uses `switch (data.command)`.
- Open files via `vscode.commands.executeCommand("vscode.open", uri)`.

### JSZip / TypeScript Interop

- `@ts-ignore` is acceptable only for known JSZip typing mismatches.
- Keep ignores localized and justified by types.

## Domain Notes

### Skill Sources

- Claude: `~/.claude/skills/`
- Gemini: `~/.gemini/skills/`
- Codex: `~/.codex/skills/`

### Output Location

Generated workflows are written to:

- `~/.gemini/antigravity/global_workflows/`

## Generated Artifacts

- `dist/` is the webpack output.
- `out/` is the TypeScript output for tests.
- Both are ignored via `.gitignore`.
