import * as fs from "fs";
import * as path from "path";

export class WorkflowGenerator {
  constructor() {}

  /**
   * Generates AgentOS-compatible workflows from a given skill source directory.
   * @param sourcePath The absolute path to the skills folder (e.g. ~/.gemini/skills)
   * @param outputDir The absolute path to the .agent/workflows directory
   */
  public async generate(
    sourcePath: string,
    outputDir: string,
    prefix?: string,
    targetAgent: string = 'gemini'
  ): Promise<{ success: number; failed: number }> {
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Source path does not exist: ${sourcePath}`);
    }

    // Ensure output dir exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const entries = await fs.promises.readdir(sourcePath, {
      withFileTypes: true,
    });
    const results = { success: 0, failed: 0 };

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const skillName = entry.name;
        const skillDir = path.join(sourcePath, skillName);

        try {
          const skillContent = await this.readSkillContent(skillDir);
          if (skillContent) {
            // Updated: Pass skillDir (absolute path) to the generator
            const workflowContent = this.createAgentOSMarkdown(
              skillName,
              skillContent,
              skillDir,
              prefix
            );

            let extension = ".md";
            if (targetAgent === 'github') extension = ".instructions.md";
            else if (targetAgent === 'agents') extension = ".agent.md";

            let fileName = prefix ? `${prefix}_${skillName}` : skillName;
            if (fileName.toLowerCase().endsWith(".md")) {
              fileName = fileName.slice(0, -3);
            }
            fileName += extension;

            const outputPath = path.join(outputDir, fileName);
            await fs.promises.writeFile(outputPath, workflowContent, "utf8");
            results.success++;
          } else {
            // Skip folders that don't look like skills
            console.warn(
              `Skipping ${skillName}: No recognized documentation found.`
            );
          }
        } catch (error) {
          console.error(`Failed to process skill ${skillName}:`, error);
          results.failed++;
        }
      }
    }

    return results;
  }

  private async readSkillContent(skillDir: string): Promise<string | null> {
    // Priority 1: SKILL.md
    // Priority 2: README.md
    const candidates = ["SKILL.md", "README.md"];

    for (const file of candidates) {
      const filePath = path.join(skillDir, file);
      if (fs.existsSync(filePath)) {
        return fs.promises.readFile(filePath, "utf8");
      }
    }
    return null;
  }

  /**
   * Converts raw skill markdown into a structured AgentOS workflow.
   * Updated: Now uses a "Pointer Strategy" referencing the absolute path.
   */
  private createAgentOSMarkdown(
    folderName: string,
    rawContent: string,
    skillDir: string,
    prefix?: string
  ): string {
    // Attempt to extract name and description from metadata
    let name = folderName;
    if (prefix) {
      name = `${prefix}:${folderName}`;
    }
    let description = `Workflow for ${folderName}`;

    const nameMatch = rawContent.match(/name:\s*["']?(.*?)["']?(\r?\n|$)/i);
    if (nameMatch && nameMatch[1]) {
      const extractedName = nameMatch[1].trim();
      name = prefix ? `${prefix}:${extractedName}` : extractedName;
    }

    // 1. Try Multi-line Block Scalar (| or >)
    const multiLineMatch = rawContent.match(
      /description:\s*[|>].*?\r?\n((?:[ \t]+.*\r?\n?)+)/i
    );
    if (multiLineMatch && multiLineMatch[1]) {
      description = multiLineMatch[1]
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .join(" ");
    } else {
      // 2. Try Standard Single Line
      const descMatch = rawContent.match(
        /description:\s*["']?(.*?)["']?(\r?\n|$)/i
      );
      // Ensure we didn't match the start of a block without capturing body (if regex failed above)
      if (
        descMatch &&
        descMatch[1] &&
        !descMatch[1].trim().startsWith("|") &&
        !descMatch[1].trim().startsWith(">")
      ) {
        description = descMatch[1];
      } else {
        // Fallback: try to grab first paragraph if no frontmatter
        const firstPara = rawContent.split(/\r?\n\r?\n/)[0];
        // If it looks like frontmatter (starts with ---), skip it
        if (!firstPara.trim().startsWith("---") && firstPara.length < 200) {
          description = firstPara.replace(/[#*]/g, "").trim();
        }
      }
    }

    // Normalize path for cross-platform (forward slashes are safer in markdown usually, but OS absolute path works)
    // Let's keep it as OS path but JSON stringified to handle backslashes correctly in the markdown code block if needed.
    // Actually, just simple replacement.
    const skillPath = path.join(skillDir, "SKILL.md").replace(/\\/g, "/");

    // The Trigger Template (Pointer-based)
    return `---
name: ${name}
description: "${description.replace(/"/g, '\\"')}"
version: 1.0.0
---

# Activate Skill: ${name}

Please read and internalize the skill documentation located at:
**\`${skillPath}\`**

(And any other relevant files in that directory)

## Mission
${description}

## Instructions
1.  **Load Context**: Read the file path provided above.
2.  **Activate Persona**: Adopt the role and expertise defined in that document.
3.  **Execute**: Await further user instructions acting as this expert.
`;
  }
}
