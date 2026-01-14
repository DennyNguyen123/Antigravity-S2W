import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import { WorkflowGenerator } from "./WorkflowGenerator";

const execAsync = promisify(exec);

/**
 * AnthropicSkillsInstaller
 * Uses Git Sparse Checkout to download only the /skills/ folder
 */
export class AnthropicSkillsInstaller {
  private homeDir: string;
  private skillsDir: string;
  private workflowsDir: string;
  private tempDir: string;
  private static readonly REPO_URL = "https://github.com/anthropics/skills.git";

  constructor() {
    this.homeDir = os.homedir();
    this.skillsDir = path.join(this.homeDir, ".gemini", "antigravity", "skills");
    this.workflowsDir = path.join(this.homeDir, ".gemini", "antigravity", "global_workflows");
    this.tempDir = path.join(this.homeDir, ".antigravity", "anthropic-temp");
  }

  /**
   * Check if any Anthropic skills are installed
   */
  public isInstalled(): boolean {
    if (!fs.existsSync(this.skillsDir)) {
      return false;
    }
    // Check if any skill folder exists (we track by marker file)
    const markerFile = path.join(this.skillsDir, ".anthropic-installed");
    return fs.existsSync(markerFile);
  }

  /**
   * Get installation path (for UI display)
   */
  public getInstallPath(): string {
    return this.skillsDir;
  }

  /**
   * Get skills path (same as install path)
   */
  public getSkillsPath(): string {
    return this.skillsDir;
  }

  /**
   * Execute installation using Git Sparse Checkout (non-blocking)
   */
  public async install(onProgress?: (step: string) => void): Promise<void> {
    // Run in background with setImmediate to avoid blocking UI
    return new Promise((resolve, reject) => {
      setImmediate(async () => {
        try {
          await this.doInstall(onProgress);
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  /**
   * Actual installation logic
   */
  private async doInstall(onProgress?: (step: string) => void): Promise<void> {
    onProgress?.("Preparing sparse checkout...");
    
    // Ensure target directories exist
    if (!fs.existsSync(this.skillsDir)) {
      fs.mkdirSync(this.skillsDir, { recursive: true });
    }
    if (!fs.existsSync(this.workflowsDir)) {
      fs.mkdirSync(this.workflowsDir, { recursive: true });
    }

    // Clean temp directory
    if (fs.existsSync(this.tempDir)) {
      fs.rmSync(this.tempDir, { recursive: true, force: true });
    }
    fs.mkdirSync(this.tempDir, { recursive: true });

    try {
      // Initialize sparse checkout
      onProgress?.("Cloning skills folder...");
      await execAsync(`git clone --filter=blob:none --no-checkout --depth 1 "${AnthropicSkillsInstaller.REPO_URL}" "${this.tempDir}"`);
      await execAsync("git sparse-checkout init --cone", { cwd: this.tempDir });
      await execAsync("git sparse-checkout set skills", { cwd: this.tempDir });
      await execAsync("git checkout", { cwd: this.tempDir });

      // Copy skills to destination
      onProgress?.("Installing skills...");
      const sourceSkillsDir = path.join(this.tempDir, "skills");
      const installedSkills: string[] = [];
      
      if (fs.existsSync(sourceSkillsDir)) {
        const entries = fs.readdirSync(sourceSkillsDir, { withFileTypes: true });
        for (const entry of entries) {
          if (!entry.isDirectory()) continue;
          
          const sourcePath = path.join(sourceSkillsDir, entry.name);
          const targetPath = path.join(this.skillsDir, entry.name);
          
          // Copy skill folder (overwrite if exists)
          fs.cpSync(sourcePath, targetPath, { recursive: true, force: true });
          installedSkills.push(entry.name);
        }
      }

      // Save installed skill names to marker file
      fs.writeFileSync(
        path.join(this.skillsDir, ".anthropic-installed"), 
        JSON.stringify({ date: new Date().toISOString(), skills: installedSkills })
      );

      // Generate workflows from installed skills
      onProgress?.("Generating workflows...");
      const generator = new WorkflowGenerator();
      await generator.generate(this.skillsDir, this.workflowsDir);

      onProgress?.("Installation complete!");
    } finally {
      // Cleanup temp directory
      if (fs.existsSync(this.tempDir)) {
        fs.rmSync(this.tempDir, { recursive: true, force: true });
      }
    }
  }

  /**
   * Update installed skills
   */
  public async update(onProgress?: (step: string) => void): Promise<void> {
    onProgress?.("Removing old skills...");
    this.removeGeneratedWorkflows();
    this.removeInstalledSkills();
    
    onProgress?.("Re-downloading skills...");
    await this.doInstall(onProgress);
  }

  /**
   * Remove all Anthropic skills
   */
  public async uninstall(onProgress?: (step: string) => void): Promise<void> {
    onProgress?.("Removing Anthropic skills...");
    this.removeGeneratedWorkflows();
    this.removeInstalledSkills();
    onProgress?.("Uninstallation complete!");
  }

  /**
   * Get list of installed skill names from marker file
   */
  private getInstalledSkillNames(): string[] {
    const markerFile = path.join(this.skillsDir, ".anthropic-installed");
    if (!fs.existsSync(markerFile)) {
      return [];
    }
    try {
      const content = fs.readFileSync(markerFile, "utf8");
      const data = JSON.parse(content);
      return data.skills || [];
    } catch {
      return [];
    }
  }

  /**
   * Remove all installed Anthropic skills
   */
  private removeInstalledSkills(): void {
    const skillNames = this.getInstalledSkillNames();
    
    // Remove skill folders
    for (const skillName of skillNames) {
      const skillPath = path.join(this.skillsDir, skillName);
      if (fs.existsSync(skillPath)) {
        fs.rmSync(skillPath, { recursive: true, force: true });
      }
    }

    // Remove marker file
    const markerFile = path.join(this.skillsDir, ".anthropic-installed");
    if (fs.existsSync(markerFile)) {
      fs.rmSync(markerFile, { force: true });
    }
  }

  /**
   * Remove generated workflow files
   */
  private removeGeneratedWorkflows(): void {
    const skillNames = this.getInstalledSkillNames();
    
    for (const skillName of skillNames) {
      const workflowFile = path.join(this.workflowsDir, `${skillName}.md`);
      const workflowFileDisabled = path.join(this.workflowsDir, `${skillName}.md.disable`);
      
      if (fs.existsSync(workflowFile)) {
        fs.rmSync(workflowFile, { force: true });
      }
      if (fs.existsSync(workflowFileDisabled)) {
        fs.rmSync(workflowFileDisabled, { force: true });
      }
    }
  }
}
