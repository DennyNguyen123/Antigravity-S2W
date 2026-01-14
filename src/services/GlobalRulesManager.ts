import * as path from "path";
import * as os from "os";
import * as fs from "fs";

/**
 * GlobalRulesManager
 * Manages global rules configuration in ~/.gemini/GEMINI.md
 *
 * Update 2026-01-14:
 * Since Gemini CLI v0.24+ natively supports skills discovery, we no longer need to
 * inject the "Available Skills" section. This manager now solely ensures that
 * any legacy "Available Skills" section is CLEANED UP (removed) to avoid conflicts.
 */
export class GlobalRulesManager {
  private homeDir: string;
  private geminiMdPath: string;

  // Markers for identification
  private static readonly SKILLS_SECTION_MARKER = "## Available Skills";
  private static readonly RULE_VERSION_MARKER = "<!-- S2W_RULE_VERSION:";

  constructor() {
    this.homeDir = os.homedir();
    this.geminiMdPath = path.join(this.homeDir, ".gemini", "GEMINI.md");
  }

  /**
   * Cleanup legacy Available Skills section from GEMINI.md
   * This is run on activation to ensure compatibility with native Gemini CLI skills.
   */
  public ensureSkillsSection(): void {
    // 1. Check file existence
    if (!fs.existsSync(this.geminiMdPath)) {
      return; // No file, nothing to clean up
    }

    // 2. Read existing content
    let existingContent = fs.readFileSync(this.geminiMdPath, "utf8");

    // 3. Check if legacy section exists
    if (existingContent.includes(GlobalRulesManager.SKILLS_SECTION_MARKER)) {
      console.log(
        "[Antigravity] Cleaning up legacy Available Skills section..."
      );

      // 4. Remove it
      const newContent = this.removeOldSkillsSection(existingContent);

      // 5. Save if changed
      if (newContent !== existingContent) {
        fs.writeFileSync(this.geminiMdPath, newContent, "utf8");
        console.log("[Antigravity] Legacy skills section removed.");
      }
    }
  }

  /**
   * Remove old Available Skills section
   * @param content Original file content
   * @returns Content after removing the section
   */
  private removeOldSkillsSection(content: string): string {
    // Find the start position of Available Skills section
    const sectionStart = content.indexOf(
      GlobalRulesManager.SKILLS_SECTION_MARKER
    );
    if (sectionStart === -1) {
      return content;
    }

    // Find version marker start position (might be before section marker)
    // Legacy format: <!-- S2W_RULE_VERSION:x.x.x -->
    const versionStart = content.lastIndexOf(
      GlobalRulesManager.RULE_VERSION_MARKER,
      sectionStart
    );
    const removalStart = versionStart !== -1 ? versionStart : sectionStart;

    // Find next ## heading (section end position)
    const nextSectionMatch = content
      .substring(sectionStart + GlobalRulesManager.SKILLS_SECTION_MARKER.length)
      .match(/\n##\s/);

    let removalEnd: number;
    if (nextSectionMatch && nextSectionMatch.index !== undefined) {
      // Found next section, remove up to that position
      removalEnd =
        sectionStart +
        GlobalRulesManager.SKILLS_SECTION_MARKER.length +
        nextSectionMatch.index!;
    } else {
      // No next section, remove to end of file
      removalEnd = content.length;
    }

    // Remove section and clean up extra blank lines
    const before = content.substring(0, removalStart).trimEnd();
    const after = content.substring(removalEnd).trimStart();

    return before + (after ? "\n\n" + after : "");
  }

  /**
   * Get GEMINI.md file path
   */
  public getGeminiMdPath(): string {
    return this.geminiMdPath;
  }
}
