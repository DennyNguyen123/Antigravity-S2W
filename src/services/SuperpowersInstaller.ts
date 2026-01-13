import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import { WorkflowGenerator } from "./WorkflowGenerator";

const execAsync = promisify(exec);

/**
 * SuperpowersInstaller
 * Handles one-click installation workflow for Superpowers project.
 */
export class SuperpowersInstaller {
  private homeDir: string;
  private superpowersDir: string;
  private geminiMdPath: string;
  private globalWorkflowsDir: string;

  constructor() {
    this.homeDir = os.homedir();
    this.superpowersDir = path.join(
      this.homeDir,
      ".antigravity",
      "superpowers"
    );
    this.geminiMdPath = path.join(this.homeDir, ".gemini", "GEMINI.md");
    this.globalWorkflowsDir = path.join(
      this.homeDir,
      ".gemini",
      "antigravity",
      "global_workflows"
    );
  }

  /**
   * Check if Superpowers is already installed
   */
  public isInstalled(): boolean {
    // Check if marker file exists
    const markerFile = path.join(
      this.superpowersDir,
      ".antigravity",
      "superpowers-antigravity"
    );
    return fs.existsSync(markerFile);
  }

  /**
   * Execute complete installation workflow
   * @param onProgress Progress callback (optional)
   */
  public async install(onProgress?: (step: string) => void): Promise<void> {
    // Step 1: Clone Repository
    onProgress?.("Cloning Superpowers repository...");
    await this.cloneRepository();

    // Step 2: Configure GEMINI.md
    onProgress?.("Configuring GEMINI.md...");
    this.configureGeminiMd();

    // Step 3: Copy Workflow Commands
    onProgress?.("Installing workflow commands...");
    this.copyWorkflowCommands();

    // Step 4: Generate Workflows from Superpowers Skills
    onProgress?.("Converting skills to workflows...");
    await this.generateWorkflowsFromSkills();

    onProgress?.("Installation complete!");
  }

  /**
   * Update installed Superpowers
   */
  public async update(onProgress?: (step: string) => void): Promise<void> {
    if (!fs.existsSync(this.superpowersDir)) {
      throw new Error("Superpowers not installed. Please install first.");
    }

    // Step 1: Clean old data (Mirror-like update)
    onProgress?.("Cleaning old workflows and commands...");
    await this.removeGeneratedWorkflows();
    this.removeWorkflowCommands();

    // Step 2: Git pull
    onProgress?.("Pulling latest changes...");
    await execAsync("git pull", { cwd: this.superpowersDir });

    // Step 3: Update commands
    onProgress?.("Updating workflow commands...");
    this.copyWorkflowCommands();

    // Step 4: Regenerate workflows
    onProgress?.("Regenerating workflows...");
    await this.generateWorkflowsFromSkills();

    onProgress?.("Update complete!");
  }

  /**
   * Clone Superpowers project to local directory
   */
  private async cloneRepository(): Promise<void> {
    const repoUrl = "https://github.com/obra/superpowers.git";

    // Ensure parent directory exists
    const parentDir = path.dirname(this.superpowersDir);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    // If directory exists, use git pull to update; otherwise clone
    if (fs.existsSync(this.superpowersDir)) {
      // Update existing project
      await execAsync("git pull", { cwd: this.superpowersDir });
    } else {
      // Fresh installation
      await execAsync(`git clone "${repoUrl}" "${this.superpowersDir}"`);
    }
  }

  /**
   * Configure ~/.gemini/GEMINI.md, add bootstrap command
   */
  private configureGeminiMd(): void {
    const bootstrapBlock = this.getBootstrapBlock();

    // Ensure directory exists
    const geminiDir = path.dirname(this.geminiMdPath);
    if (!fs.existsSync(geminiDir)) {
      fs.mkdirSync(geminiDir, { recursive: true });
    }

    // Read existing content (if exists)
    let existingContent = "";
    if (fs.existsSync(this.geminiMdPath)) {
      existingContent = fs.readFileSync(this.geminiMdPath, "utf8");
    }

    // If already contains bootstrap block, don't add again
    if (
      existingContent.includes("<EXTREMELY_IMPORTANT>") &&
      existingContent.includes("superpowers")
    ) {
      return; // Already configured
    }

    // Append bootstrap block
    const newContent = existingContent + "\n" + bootstrapBlock;
    fs.writeFileSync(this.geminiMdPath, newContent, "utf8");
  }

  /**
   * Copy workflow commands to global_workflows directory
   */
  private copyWorkflowCommands(): void {
    const commandsDir = path.join(
      this.superpowersDir,
      ".antigravity",
      "commands"
    );

    // Ensure target directory exists
    if (!fs.existsSync(this.globalWorkflowsDir)) {
      fs.mkdirSync(this.globalWorkflowsDir, { recursive: true });
    }

    // Skip if commands directory doesn't exist
    if (!fs.existsSync(commandsDir)) {
      return;
    }

    // Copy all .md files
    const files = fs.readdirSync(commandsDir);
    for (const file of files) {
      if (file.endsWith(".md")) {
        const srcPath = path.join(commandsDir, file);
        const destPath = path.join(this.globalWorkflowsDir, file);
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  /**
   * Generate bootstrap block content
   */
  private getBootstrapBlock(): string {
    // Determine run command based on operating system
    const isWindows = os.platform() === "win32";
    const runCommand = isWindows
      ? "node $env:USERPROFILE\\.antigravity\\superpowers\\.antigravity\\superpowers-antigravity bootstrap"
      : "~/.antigravity/superpowers/.antigravity/superpowers-antigravity bootstrap";

    return `
## Superpowers System

<EXTREMELY_IMPORTANT>
You have superpowers. Superpowers teach you new skills and capabilities.
**RIGHT NOW** run: \`${runCommand}\` and follow the instructions it returns!!!
</EXTREMELY_IMPORTANT>
`;
  }

  /**
   * Get installation path (for UI display)
   */
  public getInstallPath(): string {
    return this.superpowersDir;
  }

  /**
   * Get Superpowers skills directory path
   */
  public getSkillsPath(): string {
    return path.join(this.superpowersDir, "skills");
  }

  /**
   * Convert Superpowers skills to workflows
   */
  private async generateWorkflowsFromSkills(): Promise<void> {
    const skillsDir = this.getSkillsPath();
    
    // Skip if skills directory doesn't exist
    if (!fs.existsSync(skillsDir)) {
      return;
    }

    // Ensure target directory exists
    if (!fs.existsSync(this.globalWorkflowsDir)) {
      fs.mkdirSync(this.globalWorkflowsDir, { recursive: true });
    }

    // Use WorkflowGenerator to convert skills
    const generator = new WorkflowGenerator();
    await generator.generate(skillsDir, this.globalWorkflowsDir, "superpowers");
  }

  /**
   * Remove Superpowers installation
   * @param onProgress Progress callback (optional)
   */
  public async uninstall(onProgress?: (step: string) => void): Promise<void> {
    // Step 1: Remove generated workflows (from Superpowers skills)
    onProgress?.("Removing generated workflows...");
    await this.removeGeneratedWorkflows();

    // Step 2: Remove commands
    onProgress?.("Removing workflow commands...");
    this.removeWorkflowCommands();

    // Step 3: Remove bootstrap block from GEMINI.md
    onProgress?.("Cleaning GEMINI.md...");
    this.removeGeminiMdBlock();

    // Step 4: Remove Superpowers directory
    onProgress?.("Removing Superpowers directory...");
    this.removeSuperpowersDirectory();

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

    // List all skill names
    const skillDirs = fs.readdirSync(skillsDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);

    // Remove corresponding workflow files
    for (const skillName of skillDirs) {
      const fileName = `superpowers_${skillName}.md`;
      const workflowFile = path.join(this.globalWorkflowsDir, fileName);
      const workflowFileDisabled = path.join(this.globalWorkflowsDir, `${fileName}.disable`);
      
      if (fs.existsSync(workflowFile)) {
        fs.rmSync(workflowFile, { force: true });
      }
      if (fs.existsSync(workflowFileDisabled)) {
        fs.rmSync(workflowFileDisabled, { force: true });
      }
    }
  }

  /**
   * Remove copied command files
   */
  private removeWorkflowCommands(): void {
    const commandsDir = path.join(this.superpowersDir, ".antigravity", "commands");
    
    if (!fs.existsSync(commandsDir) || !fs.existsSync(this.globalWorkflowsDir)) {
      return;
    }

    // List all command files
    const commandFiles = fs.readdirSync(commandsDir)
      .filter(f => f.endsWith(".md"));

    // Remove corresponding files
    for (const file of commandFiles) {
      const targetFile = path.join(this.globalWorkflowsDir, file);
      const targetFileDisabled = path.join(this.globalWorkflowsDir, `${file}.disable`);
      
      if (fs.existsSync(targetFile)) {
        fs.rmSync(targetFile, { force: true });
      }
      if (fs.existsSync(targetFileDisabled)) {
        fs.rmSync(targetFileDisabled, { force: true });
      }
    }
  }

  /**
   * Remove Superpowers bootstrap block from GEMINI.md
   */
  private removeGeminiMdBlock(): void {
    if (!fs.existsSync(this.geminiMdPath)) {
      return;
    }

    let content = fs.readFileSync(this.geminiMdPath, "utf8");
    
    // Remove Superpowers System block
    // Match from ## Superpowers System to </EXTREMELY_IMPORTANT>
    const regex = /\n*## Superpowers System[\s\S]*?<\/EXTREMELY_IMPORTANT>\s*/g;
    content = content.replace(regex, "");

    fs.writeFileSync(this.geminiMdPath, content, "utf8");
  }

  /**
   * Remove Superpowers directory
   */
  private removeSuperpowersDirectory(): void {
    if (fs.existsSync(this.superpowersDir)) {
      fs.rmSync(this.superpowersDir, { recursive: true, force: true });
    }
  }
}
