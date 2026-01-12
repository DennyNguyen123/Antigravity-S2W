import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import { WorkflowGenerator } from "./WorkflowGenerator";

const execAsync = promisify(exec);

/**
 * AnthropicSkillsInstaller
 * 負責 Anthropic Official Skills 的一鍵安裝流程。
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
   * 檢查是否已安裝
   */
  public isInstalled(): boolean {
    const skillsDir = this.getSkillsPath();
    return fs.existsSync(skillsDir);
  }

  /**
   * 執行完整安裝流程
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
   * 更新已安裝的 skills
   */
  public async update(onProgress?: (step: string) => void): Promise<void> {
    if (!fs.existsSync(this.skillsRepoDir)) {
      throw new Error("Anthropic Skills not installed. Please install first.");
    }

    onProgress?.("Updating Anthropic Skills...");
    await execAsync("git pull", { cwd: this.skillsRepoDir });

    onProgress?.("Regenerating workflows...");
    await this.generateWorkflows();

    onProgress?.("Update complete!");
  }

  /**
   * 克隆專案
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
   * 產生 workflows
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
    await generator.generate(skillsDir, this.globalWorkflowsDir);
  }

  /**
   * 移除安裝
   */
  public async uninstall(onProgress?: (step: string) => void): Promise<void> {
    onProgress?.("Removing generated workflows...");
    await this.removeGeneratedWorkflows();

    onProgress?.("Removing repository...");
    this.removeRepository();

    onProgress?.("Uninstallation complete!");
  }

  /**
   * 移除產生的 workflow 檔案
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
      const workflowFile = path.join(
        this.globalWorkflowsDir,
        `${skillName}.md`
      );
      const workflowFileDisabled = path.join(
        this.globalWorkflowsDir,
        `${skillName}.md.disable`
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
   * 移除 repository 目錄
   */
  private removeRepository(): void {
    if (fs.existsSync(this.skillsRepoDir)) {
      fs.rmSync(this.skillsRepoDir, { recursive: true, force: true });
    }
  }

  /**
   * 取得 skills 目錄路徑
   */
  public getSkillsPath(): string {
    return path.join(this.skillsRepoDir, "skills");
  }

  /**
   * 取得安裝路徑
   */
  public getInstallPath(): string {
    return this.skillsRepoDir;
  }
}
