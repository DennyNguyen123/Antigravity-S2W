import * as path from "path";
import * as os from "os";
import * as fs from "fs";

/**
 * GlobalRulesManager
 * Manages global rules configuration in ~/.gemini/GEMINI.md
 */
export class GlobalRulesManager {
  private homeDir: string;
  private geminiMdPath: string;

  // Markers for identification
  private static readonly SKILLS_SECTION_MARKER = "## Available Skills";
  private static readonly RULE_VERSION_MARKER = "<!-- S2W_RULE_VERSION:";
  private static readonly CURRENT_RULE_VERSION = "1.0.0";

  constructor() {
    this.homeDir = os.homedir();
    this.geminiMdPath = path.join(this.homeDir, ".gemini", "GEMINI.md");
  }

  /**
   * Ensure Available Skills section exists in GEMINI.md
   * Appends on first install, automatically replaces old section on version update
   */
  public ensureSkillsSection(): void {
    // Ensure directory exists
    const geminiDir = path.dirname(this.geminiMdPath);
    if (!fs.existsSync(geminiDir)) {
      fs.mkdirSync(geminiDir, { recursive: true });
    }

    // Read existing content
    let existingContent = "";
    if (fs.existsSync(this.geminiMdPath)) {
      existingContent = fs.readFileSync(this.geminiMdPath, "utf8");
    }

    // Check if Available Skills section already exists
    if (existingContent.includes(GlobalRulesManager.SKILLS_SECTION_MARKER)) {
      // Check version number
      const versionMatch = existingContent.match(/<!-- S2W_RULE_VERSION:(\S+) -->/);
      const installedVersion = versionMatch ? versionMatch[1] : "0.0.0";

      if (installedVersion === GlobalRulesManager.CURRENT_RULE_VERSION) {
        return; // Same version, no update needed
      }

      // Different version, remove old section for update
      existingContent = this.removeOldSkillsSection(existingContent);
    }

    // Append new version of Available Skills section
    const skillsSection = this.getSkillsSection();
    const versionedSection = `${GlobalRulesManager.RULE_VERSION_MARKER}${GlobalRulesManager.CURRENT_RULE_VERSION} -->\n${skillsSection}`;
    const newContent = existingContent + "\n" + versionedSection;
    fs.writeFileSync(this.geminiMdPath, newContent, "utf8");
  }

  /**
   * Remove old Available Skills section
   * @param content Original file content
   * @returns Content after removing the section
   */
  private removeOldSkillsSection(content: string): string {
    // Find the start position of Available Skills section
    const sectionStart = content.indexOf(GlobalRulesManager.SKILLS_SECTION_MARKER);
    if (sectionStart === -1) {
      return content;
    }

    // Find version marker start position (might be before section marker)
    const versionStart = content.lastIndexOf(GlobalRulesManager.RULE_VERSION_MARKER, sectionStart);
    const removalStart = versionStart !== -1 ? versionStart : sectionStart;

    // Find next ## heading (section end position)
    const nextSectionMatch = content.substring(sectionStart + GlobalRulesManager.SKILLS_SECTION_MARKER.length).match(/\n##\s/);
    
    let removalEnd: number;
    if (nextSectionMatch && nextSectionMatch.index !== undefined) {
      // Found next section, remove up to that position
      removalEnd = sectionStart + GlobalRulesManager.SKILLS_SECTION_MARKER.length + nextSectionMatch.index;
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
   * Check if Available Skills section exists
   */
  public hasSkillsSection(): boolean {
    if (!fs.existsSync(this.geminiMdPath)) {
      return false;
    }
    const content = fs.readFileSync(this.geminiMdPath, "utf8");
    return content.includes(GlobalRulesManager.SKILLS_SECTION_MARKER);
  }

  /**
   * Get Available Skills section content
   */
  private getSkillsSection(): string {
    return `
## Available Skills

You have access to skills in trusted directories. The \`~\` symbol represents the user's home directory (\`%USERPROFILE%\` on Windows, \`$HOME\` on macOS/Linux).

### 1. **Trusted Skill Directories**

The following directories are scanned for available skills (in priority order):

| Priority | Path | Purpose |
|----------|------|---------|
| 1 | \`~/.gemini/skills/\` | Gemini native skills |
| 2 | \`~/.gemini/antigravity/skills/\` | Antigravity managed skills |
| 3 | \`~/.claude/skills/\` | Claude native skills |
| 4 | \`~/.codex/skills/\` | Codex skills |
| 5 | \`~/.antigravity/superpowers/skills/\` | Superpowers skills |

### 2. **Skill Discovery Process**

**Initial Scan** (at conversation start):
- Automatically scan all trusted directories once when conversation begins
- For each subdirectory, look for \`SKILL.md\` (primary) or \`README.md\` (fallback)
- If directory doesn't exist → skip silently (no error)
- If skill definition exists → load and register for potential use

**Mid-Conversation Reload**:
- Triggered when user explicitly requests skill reload/refresh
- Triggered when user clicks the "refresh" button in workflow manager
- When reload is requested, re-scan all directories and update available skills list
- Notify user of newly discovered or removed skills

**Disable Mechanism**:
- Skills with \`.disable\` extension are ignored (e.g., \`SKILL.md.disable\`)
- To disable a skill: rename \`SKILL.md\` → \`SKILL.md.disable\`
- To enable a skill: rename \`SKILL.md.disable\` → \`SKILL.md\`

### 3. **SKILL.md Format Requirements**

Each skill definition file MUST follow this structure:

\`\`\`markdown
---
name: skill-identifier-in-kebab-case
description: One-line description (used for automatic matching when user needs this capability)
license: (optional) License information
---

# Skill Instructions

[Detailed instructions on how to execute this skill]
[Include examples, guidelines, and any necessary context]
\`\`\`

**Required Fields in YAML Frontmatter**:
- \`name\`: Unique identifier (kebab-case format)
- \`description\`: Brief description used for automatic activation matching

**Body Content**:
- Detailed instructions for executing the skill
- These instructions are treated as additional system prompts when skill is active
- Can include multiple sections, examples, code snippets, and guidelines

### 4. **Skill Activation Methods**

**Method 1: Automatic Activation** (AI-driven):
- Agent analyzes user's request semantics
- Compares against all registered skill \`description\` fields
- If strong match detected → **ASK USER**: "I found a skill called '[name]' that might help with this. Should I activate it?"
- Only proceed after user confirmation
- Example: User says "create a poster" → AI suggests activating \`canvas-design\` skill

**Method 2: Slash Command** (explicit invocation):
- Format: \`/skill-name\` (e.g., \`/canvas-design\`)
- When invoked via slash command, activate immediately without asking
- If multiple skills are invoked via slash (e.g., multiple steps in a workflow), they should **collaborate**:
  - Agent determines the logical execution order based on task context
  - Execute skills in the most efficient sequence
  - Results from one skill can inform the next

**Method 3: Direct Mention** (conversational):
- User directly mentions skill name in conversation
- Example: "Please use the canvas-design skill to make a poster"
- Activate immediately without asking (explicit user intent)

**Priority Resolution**:
- If multiple skills match a user request → ask user which one to use
- If invoked via slash command → no need to ask, execute all mentioned skills in logical order
- If name conflicts exist across directories → use directory priority order (table in section 1)

### 5. **Skill Execution Rules**

**Instruction Integration**:
- When skill is activated, load its entire SKILL.md content
- Treat skill instructions as part of your system prompt for current task
- Integrate skill guidelines with your existing capabilities
- Follow skill instructions precisely while maintaining conversation context

**Helper Scripts**:
- Definition: Executable files (\`.sh\`, \`.py\`, \`.js\`, etc.) in skill directories
- **CRITICAL RULE**: NEVER auto-run helper scripts
- MUST request explicit user approval before execution
- Before asking, show: script path, brief content preview, and intended purpose
- Only execute after user grants permission

**Supporting Files**:
- Skills may contain additional resources (fonts, templates, examples, images)
- Access these files as instructed by the skill documentation
- All file operations follow standard safety and permission rules

### 6. **Error Handling**

When skill loading or execution fails, handle as follows:

| Scenario | Action | User Notification |
|----------|--------|-------------------|
| Directory doesn't exist | Skip silently | None (expected behavior) |
| SKILL.md has malformed YAML | Attempt to parse body only | ⚠️ Warn: "Skill '[name]' has invalid frontmatter, partially loaded" |
| No SKILL.md or README.md found | Skip this subdirectory | None |
| Duplicate skill names | Use first match (priority order) | ⚠️ Warn: "Duplicate skill '[name]' found, using version from [path]" |
| Skill execution fails | Fallback to normal capabilities | ⚠️ Error: "Skill '[name]' encountered an error: [details]" |
| Helper script execution blocked | Do not proceed | ℹ️ Info: "Helper script requires your approval to run" |

**Error Reporting Level**:
- All warnings (⚠️) and errors (🚨) MUST be reported in conversation
- Informational messages (ℹ️) should be shown when relevant to user's action
- Silent skips (directories not found) do not require notification

### 7. **Skill Collaboration & Workflow Integration**

**Multiple Skills in One Task**:
- When multiple skills are activated (especially via slash commands):
  - Analyze task requirements and determine logical execution order
  - Execute skills sequentially or in parallel as appropriate
  - Pass context and results between skills when beneficial
  - Synthesize final output combining all skill contributions

**Interaction with Workflows**:
- **Workflows** (\`.agent/workflows/\`): Project-specific automation steps
- **Skills** (global directories): Reusable capabilities across all projects
- Workflows can invoke skills by referencing them
- Skills operate independently of workflows
- Some skills may have corresponding slash command workflows for easier access

### 8. **Best Practices for AI Agents**

1. **At Conversation Start**:
   - Scan all trusted directories
   - Mentally catalog available skills
   - Be ready to suggest relevant skills when user requests align

2. **During Task Execution**:
   - Continuously assess if available skills could enhance task quality
   - Suggest skills proactively when highly relevant (with user confirmation)
   - Respect user's choice if they decline skill activation

3. **Transparency**:
   - When activating a skill, briefly mention it: "I'm using the [skill-name] skill for this task"
   - If skill provides specific guidelines, acknowledge them in your work

4. **Graceful Degradation**:
   - If skill fails or is unavailable, fall back to standard capabilities
   - Inform user of the fallback and any limitations

5. **Resource Management**:
   - Don't load all skills into context simultaneously (memory intensive)
   - Load skill instructions only when activated
   - Unload when task is complete or context switches

### 9. **Mid-Conversation Skill Reload Triggers**

Re-scan and reload all skills when:
- User says phrases like: "reload skills", "refresh skills", "check for new skills"
- User clicks "refresh" button in the workflow/skill manager extension
- User explicitly requests: "scan for skills again"

After reload, respond with:
- "✅ Skills reloaded. [X] skills available."
- List any newly discovered skills
- List any removed/disabled skills (if applicable)
`;
  }

  /**
   * Get GEMINI.md file path
   */
  public getGeminiMdPath(): string {
    return this.geminiMdPath;
  }
}
