import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import { WorkflowGenerator } from "./WorkflowGenerator";

const execAsync = promisify(exec);

/**
 * AnthropicSkillsInstaller
 * Handles one-click installation workflow for Anthropic Official Skills.
 */
export class AnthropicSkillsInstaller {
  private homeDir: string;
  private skillsRepoDir: string;
  private globalWorkflowsDir: string;

  constructor() {
    this.homeDir = os.homedir();
    this.skillsRepoDir = path.join(
      this.homeDir,
      ".antigravity",
      "anthropic-skills"
    );
    this.globalWorkflowsDir = path.join(
      this.homeDir,
      ".gemini",
      "antigravity",
      "global_workflows"
    );
  }

  /**
   * Check if already installed
   */
  public isInstalled(): boolean {
    const skillsDir = this.getSkillsPath();
    return fs.existsSync(skillsDir);
  }

  /**
   * Execute complete installation workflow
   */
  public async install(onProgress?: (step: string) => void): Promise<void> {
    // Step 1: Clone Repository
    onProgress?.("Cloning Anthropic Skills repository...");
    await this.cloneRepository();

    // Step 2: Generate Workflows
    onProgress?.("Converting skills to workflows...");
    await this.generateWorkflows();

    onProgress?.("Installation complete!");
  }

  /**
   * Update installed skills
   */
  public async update(onProgress?: (step: string) => void): Promise<void> {
    if (!fs.existsSync(this.skillsRepoDir)) {
      throw new Error("Anthropic Skills not installed. Please install first.");
    }

    onProgress?.("Cleaning old workflows...");
    await this.removeGeneratedWorkflows();

    onProgress?.("Updating Anthropic Skills...");
    await execAsync("git pull", { cwd: this.skillsRepoDir });

    onProgress?.("Regenerating workflows...");
    await this.generateWorkflows();

    onProgress?.("Update complete!");
  }

  /**
   * Clone repository
   */
  private async cloneRepository(): Promise<void> {
    const repoUrl = "https://github.com/anthropics/skills.git";

    const parentDir = path.dirname(this.skillsRepoDir);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    if (fs.existsSync(this.skillsRepoDir)) {
      await execAsync("git pull", { cwd: this.skillsRepoDir });
    } else {
      await execAsync(`git clone "${repoUrl}" "${this.skillsRepoDir}"`);
    }
  }

  /**
   * Generate workflows
   */
  private async generateWorkflows(): Promise<void> {
    const skillsDir = this.getSkillsPath();

    if (!fs.existsSync(skillsDir)) {
      return;
    }

    if (!fs.existsSync(this.globalWorkflowsDir)) {
      fs.mkdirSync(this.globalWorkflowsDir, { recursive: true });
    }

    const generator = new WorkflowGenerator();
    await generator.generate(skillsDir, this.globalWorkflowsDir, "anthropic");
  }

  /**
   * Remove installation
   */
  public async uninstall(onProgress?: (step: string) => void): Promise<void> {
    onProgress?.("Removing generated workflows...");
    await this.removeGeneratedWorkflows();

    onProgress?.("Removing repository...");
    this.removeRepository();

    onProgress?.("Uninstallation complete!");
  }

  /**
   * Remove generated workflow files
   */
  private async removeGeneratedWorkflows(): Promise<void> {
    const skillsDir = this.getSkillsPath();

    if (!fs.existsSync(skillsDir) || !fs.existsSync(this.globalWorkflowsDir)) {
      return;
    }

    const skillDirs = fs
      .readdirSync(skillsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);

    for (const skillName of skillDirs) {
      const fileName = `anthropic_${skillName}.md`;
      const workflowFile = path.join(this.globalWorkflowsDir, fileName);
      const workflowFileDisabled = path.join(
        this.globalWorkflowsDir,
        `${fileName}.disable`
      );

      if (fs.existsSync(workflowFile)) {
        fs.rmSync(workflowFile, { force: true });
      }
      if (fs.existsSync(workflowFileDisabled)) {
        fs.rmSync(workflowFileDisabled, { force: true });
      }
    }
  }

  /**
   * Remove repository directory
   */
  private removeRepository(): void {
    if (fs.existsSync(this.skillsRepoDir)) {
      fs.rmSync(this.skillsRepoDir, { recursive: true, force: true });
    }
  }

  /**
   * Get skills directory path
   */
  public getSkillsPath(): string {
    return path.join(this.skillsRepoDir, "skills");
  }

  /**
   * Get installation path
   */
  public getInstallPath(): string {
    return this.skillsRepoDir;
  }
}
