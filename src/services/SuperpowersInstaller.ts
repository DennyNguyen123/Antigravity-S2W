import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import { WorkflowGenerator } from "./WorkflowGenerator";

const execAsync = promisify(exec);

/**
 * SuperpowersInstaller
 * 負責 Superpowers 專案的一鍵安裝流程。
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
   * 檢查 Superpowers 是否已安裝
   */
  public isInstalled(): boolean {
    // 檢查標誌性檔案存在
    const markerFile = path.join(
      this.superpowersDir,
      ".antigravity",
      "superpowers-antigravity"
    );
    return fs.existsSync(markerFile);
  }

  /**
   * 執行完整安裝流程
   * @param onProgress 進度回呼（可選）
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
   * 更新已安裝的 Superpowers
   */
  public async update(onProgress?: (step: string) => void): Promise<void> {
    if (!fs.existsSync(this.superpowersDir)) {
      throw new Error("Superpowers not installed. Please install first.");
    }

    // Step 1: Git pull
    onProgress?.("Pulling latest changes...");
    await execAsync("git pull", { cwd: this.superpowersDir });

    // Step 2: Update commands
    onProgress?.("Updating workflow commands...");
    this.copyWorkflowCommands();

    // Step 3: Regenerate workflows
    onProgress?.("Regenerating workflows...");
    await this.generateWorkflowsFromSkills();

    onProgress?.("Update complete!");
  }

  /**
   * 克隆 Superpowers 專案到本地
   */
  private async cloneRepository(): Promise<void> {
    const repoUrl = "https://github.com/obra/superpowers.git";

    // 確保父目錄存在
    const parentDir = path.dirname(this.superpowersDir);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    // 如果目錄已存在，使用 git pull 更新；否則 clone
    if (fs.existsSync(this.superpowersDir)) {
      // 更新現有專案
      await execAsync("git pull", { cwd: this.superpowersDir });
    } else {
      // 全新安裝
      await execAsync(`git clone "${repoUrl}" "${this.superpowersDir}"`);
    }
  }

  /**
   * 設定 ~/.gemini/GEMINI.md，加入 bootstrap 指令
   */
  private configureGeminiMd(): void {
    const bootstrapBlock = this.getBootstrapBlock();

    // 確保目錄存在
    const geminiDir = path.dirname(this.geminiMdPath);
    if (!fs.existsSync(geminiDir)) {
      fs.mkdirSync(geminiDir, { recursive: true });
    }

    // 讀取現有內容（如果存在）
    let existingContent = "";
    if (fs.existsSync(this.geminiMdPath)) {
      existingContent = fs.readFileSync(this.geminiMdPath, "utf8");
    }

    // 如果已經包含 bootstrap 區塊，則不重複添加
    if (
      existingContent.includes("<EXTREMELY_IMPORTANT>") &&
      existingContent.includes("superpowers")
    ) {
      return; // 已設定
    }

    // 附加 bootstrap 區塊
    const newContent = existingContent + "\n" + bootstrapBlock;
    fs.writeFileSync(this.geminiMdPath, newContent, "utf8");
  }

  /**
   * 複製 workflow 指令到 global_workflows 目錄
   */
  private copyWorkflowCommands(): void {
    const commandsDir = path.join(
      this.superpowersDir,
      ".antigravity",
      "commands"
    );

    // 確保目標目錄存在
    if (!fs.existsSync(this.globalWorkflowsDir)) {
      fs.mkdirSync(this.globalWorkflowsDir, { recursive: true });
    }

    // 如果 commands 目錄不存在，跳過
    if (!fs.existsSync(commandsDir)) {
      return;
    }

    // 複製所有 .md 檔案
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
   * 產生 bootstrap 區塊內容
   */
  private getBootstrapBlock(): string {
    // 根據作業系統決定執行指令
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
   * 取得安裝路徑（供 UI 顯示用）
   */
  public getInstallPath(): string {
    return this.superpowersDir;
  }

  /**
   * 取得 Superpowers skills 目錄路徑
   */
  public getSkillsPath(): string {
    return path.join(this.superpowersDir, "skills");
  }

  /**
   * 將 Superpowers skills 轉換為 workflows
   */
  private async generateWorkflowsFromSkills(): Promise<void> {
    const skillsDir = this.getSkillsPath();
    
    // 如果 skills 目錄不存在，跳過
    if (!fs.existsSync(skillsDir)) {
      return;
    }

    // 確保目標目錄存在
    if (!fs.existsSync(this.globalWorkflowsDir)) {
      fs.mkdirSync(this.globalWorkflowsDir, { recursive: true });
    }

    // 使用 WorkflowGenerator 轉換 skills
    const generator = new WorkflowGenerator();
    await generator.generate(skillsDir, this.globalWorkflowsDir);
  }

  /**
   * 移除 Superpowers 安裝
   * @param onProgress 進度回呼（可選）
   */
  public async uninstall(onProgress?: (step: string) => void): Promise<void> {
    // Step 1: 移除產生的 workflows (來自 Superpowers skills)
    onProgress?.("Removing generated workflows...");
    await this.removeGeneratedWorkflows();

    // Step 2: 移除 commands
    onProgress?.("Removing workflow commands...");
    this.removeWorkflowCommands();

    // Step 3: 移除 GEMINI.md 中的 bootstrap 區塊
    onProgress?.("Cleaning GEMINI.md...");
    this.removeGeminiMdBlock();

    // Step 4: 移除 Superpowers 目錄
    onProgress?.("Removing Superpowers directory...");
    this.removeSuperpowersDirectory();

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

    // 列出所有 skill 名稱
    const skillDirs = fs.readdirSync(skillsDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);

    // 移除對應的 workflow 檔案
    for (const skillName of skillDirs) {
      const workflowFile = path.join(this.globalWorkflowsDir, `${skillName}.md`);
      const workflowFileDisabled = path.join(this.globalWorkflowsDir, `${skillName}.md.disable`);
      
      if (fs.existsSync(workflowFile)) {
        fs.rmSync(workflowFile, { force: true });
      }
      if (fs.existsSync(workflowFileDisabled)) {
        fs.rmSync(workflowFileDisabled, { force: true });
      }
    }
  }

  /**
   * 移除複製的 command 檔案
   */
  private removeWorkflowCommands(): void {
    const commandsDir = path.join(this.superpowersDir, ".antigravity", "commands");
    
    if (!fs.existsSync(commandsDir) || !fs.existsSync(this.globalWorkflowsDir)) {
      return;
    }

    // 列出所有 command 檔案
    const commandFiles = fs.readdirSync(commandsDir)
      .filter(f => f.endsWith(".md"));

    // 移除對應的檔案
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
   * 從 GEMINI.md 移除 Superpowers bootstrap 區塊
   */
  private removeGeminiMdBlock(): void {
    if (!fs.existsSync(this.geminiMdPath)) {
      return;
    }

    let content = fs.readFileSync(this.geminiMdPath, "utf8");
    
    // 移除 Superpowers System 區塊
    // 匹配 ## Superpowers System 開頭到 </EXTREMELY_IMPORTANT> 結尾
    const regex = /\n*## Superpowers System[\s\S]*?<\/EXTREMELY_IMPORTANT>\s*/g;
    content = content.replace(regex, "");

    fs.writeFileSync(this.geminiMdPath, content, "utf8");
  }

  /**
   * 移除 Superpowers 目錄
   */
  private removeSuperpowersDirectory(): void {
    if (fs.existsSync(this.superpowersDir)) {
      fs.rmSync(this.superpowersDir, { recursive: true, force: true });
    }
  }
}
