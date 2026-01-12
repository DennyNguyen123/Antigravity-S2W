import * as path from "path";
import * as os from "os";
import * as fs from "fs";

/**
 * GlobalRulesManager
 * 負責管理 ~/.gemini/GEMINI.md 的全域規則設定
 */
export class GlobalRulesManager {
  private homeDir: string;
  private geminiMdPath: string;

  // 用於識別的標記
  private static readonly SKILLS_SECTION_MARKER = "## Available Skills";

  constructor() {
    this.homeDir = os.homedir();
    this.geminiMdPath = path.join(this.homeDir, ".gemini", "GEMINI.md");
  }

  /**
   * 確保 Available Skills 區塊存在於 GEMINI.md
   * 首次安裝時附加，之後不重複添加
   */
  public ensureSkillsSection(): void {
    // 確保目錄存在
    const geminiDir = path.dirname(this.geminiMdPath);
    if (!fs.existsSync(geminiDir)) {
      fs.mkdirSync(geminiDir, { recursive: true });
    }

    // 讀取現有內容
    let existingContent = "";
    if (fs.existsSync(this.geminiMdPath)) {
      existingContent = fs.readFileSync(this.geminiMdPath, "utf8");
    }

    // 檢查是否已存在 Available Skills 區塊
    if (existingContent.includes(GlobalRulesManager.SKILLS_SECTION_MARKER)) {
      return; // 已存在，不重複添加
    }

    // 附加 Available Skills 區塊
    const skillsSection = this.getSkillsSection();
    const newContent = existingContent + "\n" + skillsSection;
    fs.writeFileSync(this.geminiMdPath, newContent, "utf8");
  }

  /**
   * 檢查 Available Skills 區塊是否存在
   */
  public hasSkillsSection(): boolean {
    if (!fs.existsSync(this.geminiMdPath)) {
      return false;
    }
    const content = fs.readFileSync(this.geminiMdPath, "utf8");
    return content.includes(GlobalRulesManager.SKILLS_SECTION_MARKER);
  }

  /**
   * 取得 Available Skills 區塊內容
   */
  private getSkillsSection(): string {
    return `
## Available Skills

You have access to skills in trusted directories. The \`~\` symbol represents the user's home directory (\`%USERPROFILE%\` on Windows, \`$HOME\` on macOS/Linux).

1. **Trusted Skill Directories** (scan at conversation start):
   - \`~/.gemini/skills/\` — Gemini native skills
   - \`~/.gemini/antigravity/skills/\` — Antigravity managed skills
   - \`~/.claude/skills/\` — Claude native skills
   - \`~/.codex/skills/\` — Codex skills
   - \`~/.antigravity/superpowers/skills/\` — Superpowers skills

2. **How to Use**:
   - Scan directories above to discover available skills
   - Read \`SKILL.md\` or \`README.md\` in each skill folder
   - Activate matching skills when a task requires specific capabilities
   - Execute helper scripts only with explicit user approval

3. **Skill Structure**: Each skill folder contains \`SKILL.md\` (primary) or \`README.md\` (alternative), plus optional supporting files.
`;
  }

  /**
   * 取得 GEMINI.md 路徑
   */
  public getGeminiMdPath(): string {
    return this.geminiMdPath;
  }
}
