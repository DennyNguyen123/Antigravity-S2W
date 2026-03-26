import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { PathManager } from "./services/PathManager";
import { WorkflowGenerator } from "./services/WorkflowGenerator";
import { SuperpowersInstaller } from "./services/SuperpowersInstaller";
import { AnthropicSkillsInstaller } from "./services/AnthropicSkillsInstaller";
import { DavilaSkillsInstaller } from "./services/DavilaSkillsInstaller";
import { UiUxProMaxInstaller } from "./services/UiUxProMaxInstaller";
import { GalleryProxyServer } from "./services/GalleryProxyServer";
import { SkillsMpProxyServer } from "./services/SkillsMpProxyServer";
// Note: Installer logic can be simple enough to be inline or imported if we had a separate file.
import * as JSZip from "jszip";
import * as os from "os";
import * as cp from "child_process"; // Added for CLI

export class SkillsViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "antigravityInstructions";

  private _view?: vscode.WebviewView;
  private pathManager: PathManager;
  private workflowGenerator: WorkflowGenerator;
  private superpowersInstaller: SuperpowersInstaller;
  private anthropicInstaller: AnthropicSkillsInstaller;
  private davilaInstaller: DavilaSkillsInstaller;
  private uiUxInstaller: UiUxProMaxInstaller;

  constructor(private readonly _extensionUri: vscode.Uri) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const rootPath = workspaceFolders && workspaceFolders.length > 0 ? workspaceFolders[0].uri.fsPath : undefined;
    const appName = vscode.env.appName;

    this.pathManager = new PathManager(rootPath, appName);
    this.workflowGenerator = new WorkflowGenerator();
    this.superpowersInstaller = new SuperpowersInstaller();
    this.anthropicInstaller = new AnthropicSkillsInstaller();
    this.davilaInstaller = new DavilaSkillsInstaller();
    this.uiUxInstaller = new UiUxProMaxInstaller();
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.command) {
        case "getConfigs":
          this.sendInitData();
          break;
        case "updateSettings":
          // @ts-ignore
          this.pathManager.setSettings(data.installMode, data.targetAgent);
          this.sendInitData();
          break;
        case "refresh":
          this.sendWorkflowList();
          break;
        case "generate":
          await this.handleGenerate(data.sourcePath);
          break;
        case "delete":
          await this.handleDelete(data.filename);
          break;
        case "openFilePicker":
          await this.handleOpenFilePicker();
          break;
        case "install":
          await this.handleInstall(data.zipPaths);
          break;
        case "openFile":
          await this.handleOpenFile(data.filename);
          break;
        case "toggle":
          await this.handleToggle(data.filename);
          break;
        case "installData":
          await this.handleInstallData(data.zipName, data.data);
          break;
        case "debug":
          vscode.window.showInformationMessage(
            `[WebView Debug] ${data.message}`
          );
          break;
        case "selectCustomSource":
          await this.handleSelectCustomSource();
          break;
        case "openUrlInput":
          // Deprecated - kept for compatibility/debug
          await this.handleOpenUrlInput();
          break;
        case "downloadUrl":
           if (data.url) {
               try {
                   await this.downloadSkillFromGitHub(data.url);
               } catch (e: any) {
                   vscode.window.showErrorMessage(`Download Failed: ${e.message}`);
                   this._view?.webview.postMessage({ command: "status", type: "error", text: `Error: ${e.message}` });
               }
           }
           break;
        case "installSuperpowers":
           await this.handleInstallSuperpowers();
           break;
        case "uninstallSuperpowers":
           await this.handleUninstallSuperpowers();
           break;
        case "toggleSuperpowers":
           if (data.enabled) {
             await this.handleInstallSuperpowers();
           } else {
             await this.handleUninstallSuperpowers();
           }
           break;
        case "checkSuperpowers":
           this.sendSuperpowersStatus();
           break;
        case "updateSuperpowers":
           await this.handleUpdateSuperpowers();
           break;
        // Anthropic Skills handlers
        case "toggleAnthropic":
           if (data.enabled) {
             await this.handleInstallAnthropic();
           } else {
             await this.handleUninstallAnthropic();
           }
           break;
        case "checkAnthropic":
           this.sendAnthropicStatus();
           break;
        case "updateAnthropic":
           await this.handleUpdateAnthropic();
           break;
        // Davila Skills handlers
        case "installDavila":
           await this.handleInstallDavila(data.categories);
           break;
        case "uninstallDavila":
           await this.handleUninstallDavila();
           break;
        case "checkDavila":
           this.sendDavilaStatus();
           break;
        case "updateDavila":
           await this.handleUpdateDavila();
           break;

        // UI/UX Pro Max Handlers
        case "installUiUxProMax":
           await this.handleInstallUiUxProMax();
           break;
        case "openUiUxGallery":
           this.handleOpenGallery();
           break;
        case "checkUiUxProMax":
           this.sendUiUxProMaxStatus();
           break;

        case "openSkillsMp":
           this.handleOpenSkillsMp();
           break;

        case "searchSkills":
           this.handleSearchSkills(data.query);
           break;
        case "installFromCli":
           this.handleInstallFromCli(data.repo);
           break;
        case "openExternal":
           if (data.url) vscode.env.openExternal(vscode.Uri.parse(data.url));
           break;
      }
    });
  }

  // --- GitHub Download Logic ---

  private async handleOpenUrlInput() {
      // Legacy - kept empty
  }

  private async downloadSkillFromGitHub(url: string) {
    const regexFull = /github\.com\/([^\/]+)\/([^\/]+)\/tree\/([^\/]+)\/(.+)/;
    const regexRoot = /github\.com\/([^\/]+)\/([^\/]+)\/?$/;
    
    let owner, repo, branch, folderPath;

    const matchFull = url.match(regexFull);
    if (matchFull) {
        [, owner, repo, branch, folderPath] = matchFull;
    } else {
        const matchRoot = url.match(regexRoot);
        if (matchRoot) {
             [, owner, repo] = matchRoot;
             branch = 'HEAD';
             folderPath = '';
        } else {
             throw new Error("Invalid URL. Supported formats:\n1. https://github.com/owner/repo\n2. https://github.com/owner/repo/tree/branch/path");
        }
    }

    const skillsDir = this.pathManager.getSkillsPath();
    if (!fs.existsSync(skillsDir)) {
      fs.mkdirSync(skillsDir, { recursive: true });
    }

    // Check if target folder contains SKILL.md directly or has subfolders with skills
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${folderPath}?ref=${branch}`;
    const items = await this.httpsGet_Json(apiUrl);
    
    if (!Array.isArray(items)) {
      throw new Error(`Remote path is not a directory: ${folderPath}`);
    }

    // Check if this folder directly contains SKILL.md or README.md
    const hasSkillFile = items.some((item: any) => 
      item.type === 'file' && (item.name.toLowerCase() === 'skill.md' || item.name.toLowerCase() === 'readme.md')
    );

    let installedSkills: string[] = [];

    if (hasSkillFile) {
      // This is a single skill folder - install directly
      const skillName = folderPath ? path.basename(folderPath) : repo;
      const destDir = path.join(skillsDir, skillName);
      
      if (fs.existsSync(destDir)) {
        fs.rmSync(destDir, { recursive: true, force: true });
      }
      fs.mkdirSync(destDir, { recursive: true });
      
      await this.recursiveDownload(owner, repo, branch, folderPath, destDir);
      installedSkills.push(skillName);
    } else {
      // This is a parent folder - scan subfolders for skills
      const subDirs = items.filter((item: any) => item.type === 'dir');
      
      for (const subDir of subDirs) {
        // Check if subfolder contains SKILL.md
        const subApiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${subDir.path}?ref=${branch}`;
        try {
          const subItems = await this.httpsGet_Json(subApiUrl);
          const hasSkill = subItems.some((item: any) => 
            item.type === 'file' && (item.name.toLowerCase() === 'skill.md' || item.name.toLowerCase() === 'readme.md')
          );
          
          if (hasSkill) {
            const skillName = subDir.name;
            const destDir = path.join(skillsDir, skillName);
            
            if (fs.existsSync(destDir)) {
              fs.rmSync(destDir, { recursive: true, force: true });
            }
            fs.mkdirSync(destDir, { recursive: true });
            
            await this.recursiveDownload(owner, repo, branch, subDir.path, destDir);
            installedSkills.push(skillName);
          }
        } catch (e) {
          // Skip folders that can't be accessed
          console.error(`Failed to scan ${subDir.name}:`, e);
        }
      }
    }

    if (installedSkills.length === 0) {
      throw new Error("No skills found. Ensure the folder contains SKILL.md or README.md.");
    }

    // Generate workflows
    const workflowsDir = this.pathManager.getDestinationPath();
    const settings = this.pathManager.getSettings();
    await this.workflowGenerator.generate(skillsDir, workflowsDir, undefined, settings.targetAgent);
    this.sendWorkflowList();
    
    const message = installedSkills.length === 1 
      ? `Installed '${installedSkills[0]}' from GitHub`
      : `Installed ${installedSkills.length} skills: ${installedSkills.join(', ')}`;
    
    this._view?.webview.postMessage({ 
        command: "status", 
        type: "success", 
        text: message
    });
  }

  private async recursiveDownload(owner: string, repo: string, branch: string, remotePath: string, localDir: string) {
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${remotePath}?ref=${branch}`;
    
    // Use simple https helper
    const items = await this.httpsGet_Json(apiUrl);
    
    if (!Array.isArray(items)) {
        throw new Error(`Remote path is not a directory: ${remotePath}`);
    }

    for (const item of items) {
        if (item.type === 'file') {
            const fileContent = await this.httpsGet_String(item.download_url);
            fs.writeFileSync(path.join(localDir, item.name), fileContent);
        } else if (item.type === 'dir') {
            const newLocalDir = path.join(localDir, item.name);
            fs.mkdirSync(newLocalDir, { recursive: true });
            await this.recursiveDownload(owner, repo, branch, item.path, newLocalDir);
        }
    }
  }

  private httpsGet_Json(url: string): Promise<any> {
    return this.httpsGet_Common(url).then(str => JSON.parse(str));
  }

  private httpsGet_String(url: string): Promise<string> {
    return this.httpsGet_Common(url);
  }

  private httpsGet_Common(url: string): Promise<string> {
      const https = require('https');
      return new Promise((resolve, reject) => {
          const options = {
              headers: {
                  'User-Agent': 'VSCode-Antigravity-Extension'
              }
          };
          https.get(url, options, (res: any) => {
              if (res.statusCode < 200 || res.statusCode >= 300) {
                  return reject(new Error(`Status Code: ${res.statusCode}`));
              }
              const data: any[] = [];
              res.on('data', (chunk: any) => data.push(chunk));
              res.on('end', () => resolve(Buffer.concat(data).toString()));
           }).on('error', (err: any) => reject(err));
      });
  }

  public sendInitData() {
    try {
      if (this._view) {
        const sources = this.pathManager.getAvailableSources();
        const workflows = this.getExistingWorkflows();
        const settings = this.pathManager.getSettings();
        this._view.webview.postMessage({
          command: "init",
          locale: vscode.env.language,
          sources: sources,
          workflows: workflows,
          settings: settings,
        });
      }
    } catch (e: any) {
        console.error("sendInitData Failed:", e);
        this._view?.webview.postMessage({ command: "status", type: "error", text: `Init Failed: ${e.message}` });
        vscode.window.showErrorMessage(`Extension Init Failed: ${e.message}`);
    }
  }

  public sendWorkflowList() {
    if (this._view) {
      const workflows = this.getExistingWorkflows();
      // Debug: Show user what we found
      // vscode.window.showInformationMessage(`[Debug] Refreshing. Found ${workflows.length} workflows in global storage.`);
      
      this._view.webview.postMessage({
        command: "refresh",
        workflows: workflows,
      });
    }
  }

  private getExistingWorkflows() {
    // REFACTOR: Now scanning Global Workflows Dir instead of Skills Dir
    const workflowsDir = this.pathManager.getDestinationPath();
    // console.log(`[Backend] Scanning flows in: ${workflowsDir}`);
    
    if (!fs.existsSync(workflowsDir)) {
      // console.log(`[Backend] Workflows dir not found: ${workflowsDir}`);
      return [];
    }

    try {
      const dirents = fs.readdirSync(workflowsDir, { withFileTypes: true });
      const workflows = [];
      // console.log(`[Backend] Found ${dirents.length} entries.`);

      for (const dirent of dirents) {
        if (!dirent.isFile()) continue; // Only files now
        
        const fileName = dirent.name;
        // Check extension
        const isMd = fileName.toLowerCase().endsWith('.md');
        const isDisabled = fileName.toLowerCase().endsWith('.md.disable');
        
        if (!isMd && !isDisabled) continue;

        const filePath = path.join(workflowsDir, fileName);
        const isEnabled = isMd;
        
        let description = "No description available.";
        let name = fileName.replace(/\.md(\.disable)?$/i, ''); // Fallback name

        // Parse Frontmatter
        try {
            const content = fs.readFileSync(filePath, "utf8");
            
            // Name
            const nameMatch = content.match(/name:\s*["']?(.*?)["']?(\r?\n|$)/i);
            if (nameMatch && nameMatch[1]) {
                name = nameMatch[1].trim();
            }

            // Description (Multi-line or Single)
            const multiLineMatch = content.match(/description:\s*[|>].*?\r?\n((?:[ \t]+.*\r?\n?)+)/i);
            
            if (multiLineMatch && multiLineMatch[1]) {
                description = multiLineMatch[1]
                    .split(/\r?\n/)
                    .map(line => line.trim())
                    .filter(line => line.length > 0)
                    .join(' ');
            } else {
                const match = content.match(/description:\s*["']?(.*?)["']?(\r?\n|$)/i);
                if (match && match[1] && !match[1].trim().startsWith('|') && !match[1].trim().startsWith('>')) {
                  description = match[1];
                }
            }
        } catch (e) {
            /* Ignore read errors */
        }

        if (!isEnabled) {
          description += " (Disabled)";
        }

        workflows.push({
          name: name,
          filename: fileName, // This IS the filename now (e.g. "skill.md" or "skill.md.disable")
          description,
          enabled: isEnabled,
        });
      }

      return workflows;
    } catch (err) {
      console.error("Error reading workflows dir:", err);
      return [];
    }
  }

  private async handleGenerate(sourcePath: string) {
    if (!sourcePath) return;

    const skillsDir = this.pathManager.getSkillsPath();
    const destDir = this.pathManager.getDestinationPath();
    
    // Normalize paths for comparison
    const normSource = path.resolve(sourcePath);
    const normDest = path.resolve(skillsDir);

    let effectiveSource = sourcePath;
    let importedCount = 0;

    // If the source is NOT the internal skills directory, we should IMPORT (Copy) them first.
    // This allows the user to "install" skills from a custom folder.
    if (normSource.toLowerCase() !== normDest.toLowerCase()) {
        try {
            importedCount = await this.importSkills(sourcePath, skillsDir);
            // After import, we generate workflows based on the INTERNAL copy, 
            // so the paths in the MD file point to the stable internal location.
            effectiveSource = skillsDir; 
        } catch (e: any) {
             vscode.window.showErrorMessage(`Import failed: ${e.message}`);
             // If import fails, do we abort? Or try to generate anyway?
             // Let's abort to be safe, or just continue with original source?
             // Continuing with original source keeps old behavior. 
             // But let's stick to the "Copy then Analyze" rule.
             return; 
        }
    }

    try {
      const settings = this.pathManager.getSettings();
      const result = await this.workflowGenerator.generate(effectiveSource, destDir, undefined, settings.targetAgent);
      
      let msg = `Generated ${result.success} workflows (${result.failed} failed) to ${destDir}`;
      if (importedCount > 0) {
          msg = `Imported ${importedCount} skills & ` + msg;
      }

      if (this._view) {
        this._view.webview.postMessage({
          command: "status",
          type: "success",
          text: msg,
        });
        
        // Refresh the list - Add a small delay to ensure FS is caught up
        // Although await importSkills is awaited, sometimes FS events or list refresh might be too fast?
        setTimeout(() => {
             this.sendWorkflowList();
        }, 500);
      }
    } catch (e: any) {
      this._view?.webview.postMessage({
        command: "status",
        type: "error",
        text: `Error: ${e.message}`,
      });
    }
  }

  /**
   * Copies skill directories from source to destination.
   * Only copies directories that look like skills (contain SKILL.md/README.md).
   */
  private async importSkills(sourceDir: string, destDir: string): Promise<number> {
      if (!fs.existsSync(sourceDir)) return 0;
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

      const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
      let count = 0;

      for (const entry of entries) {
          if (!entry.isDirectory()) continue;
          
          const skillName = entry.name;
          const sourcePath = path.join(sourceDir, skillName);
          const targetPath = path.join(destDir, skillName);

          // Check if it's a valid skill
          if (fs.existsSync(path.join(sourcePath, 'SKILL.md')) || 
              fs.existsSync(path.join(sourcePath, 'README.md'))) {
              
              // Copy Recursively
              // cpSync is available in Node 16.7+. VS Code ships with newer Node usually.
              // Fallback to custom recursive copy if needed, but fs.cpSync is best.
              try {
                  // Ensure target doesn't exist or overwrite? Overwrite is usually expected for "Update".
                  fs.cpSync(sourcePath, targetPath, { recursive: true, force: true });
                  count++;
              } catch (e) {
                  console.error(`Failed to copy ${skillName}`, e);
              }
          }
      }
      return count;
  }

  private async handleToggle(fileName: string) {
    // console.log(`[Backend] Toggling Workflow: ${fileName}`);
    const workflowsDir = this.pathManager.getDestinationPath();
    const filePath = path.join(workflowsDir, fileName);

    if (!fs.existsSync(filePath)) {
      vscode.window.showErrorMessage(`Workflow file not found: ${fileName}`);
      return;
    }

    // Determine target name
    let targetName = "";
    let action = ""; // 'enable' or 'disable'

    if (fileName.toLowerCase().endsWith('.disable')) {
        // Enable: Remove .disable
        targetName = fileName.substring(0, fileName.lastIndexOf('.disable'));
        action = "enable";
    } else {
         // Disable: Add .disable
         targetName = fileName + ".disable";
         action = "disable";
    }

    const targetPath = path.join(workflowsDir, targetName);

    try {
        fs.renameSync(filePath, targetPath);
        vscode.window.showInformationMessage(`Workflow ${action}d: ${targetName}`); // e.g. enabled: foo.md
        this.sendWorkflowList();
    } catch (e: any) {
        vscode.window.showErrorMessage(`Failed to ${action} workflow: ${e.message}`);
    }
  }

  private async handleOpenFile(fileName: string) {
    if (!fileName) return;
    const workflowsDir = this.pathManager.getDestinationPath();
    const filePath = path.join(workflowsDir, fileName);

    if (fs.existsSync(filePath)) {
      const uri = vscode.Uri.file(filePath);
      await vscode.commands.executeCommand("vscode.open", uri);
    } else {
      vscode.window.showErrorMessage(
        `File not found: ${filePath}`
      );
    }
  }

  private async handleDelete(fileName: string) {
    // Delete both the generated workflow file AND the source skill folder
    const workflowsDir = this.pathManager.getDestinationPath();
    const filePath = path.join(workflowsDir, fileName);
    
    // Derive skill name from filename (e.g., "my-skill.md" -> "my-skill")
    const skillName = fileName.replace(/\.md(\.disable)?$/, '');
    const skillsDir = this.pathManager.getSkillsPath();
    const skillFolderPath = path.join(skillsDir, skillName);

    // Confirmation dialog
    const confirm = await vscode.window.showWarningMessage(
      `Delete workflow '${skillName}' and its source files?`,
      { modal: true },
      'Delete'
    );

    if (confirm !== 'Delete') {
      return; // User cancelled
    }

    try {
      // 1. Delete workflow file
      if (fs.existsSync(filePath)) {
        fs.rmSync(filePath, { force: true });
      }
      
      // 2. Delete source skill folder
      if (fs.existsSync(skillFolderPath)) {
        fs.rmSync(skillFolderPath, { recursive: true, force: true });
      }

      // vscode.window.showInformationMessage(`Workflow '${skillName}' and source files deleted.`);
      this.sendWorkflowList(); // Refresh UI
    } catch (e: any) {
      console.error(e);
      vscode.window.showErrorMessage(`Failed to delete: ${e.message}`);
    }
  }

  private async handleOpenFilePicker() {
    const uris = await vscode.window.showOpenDialog({
      canSelectFiles: true,
      canSelectFolders: false,
      canSelectMany: true,
      filters: {
        "Zip Files": ["zip"],
      },
    });

    if (uris && uris.length > 0) {
      const paths = uris.map((u) => u.fsPath);
      await this.handleInstall(paths);
    } else {
      // User cancelled
      this._view?.webview.postMessage({
        command: "status",
        type: "info",
        text: "Selection cancelled",
        target: "install"
      });
    }
  }

  private async handleSelectCustomSource() {
    const uris = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        openLabel: 'Select Skills Folder'
    });

    if (uris && uris.length > 0) {
        const customPath = uris[0].fsPath;
        if (this._view) {
            this._view.webview.postMessage({
                command: 'addCustomSource',
                path: customPath
            });
        }
    }
  }

  private async handleInstall(zipPaths: string[]) {
    let successCount = 0;

    for (const zipPath of zipPaths) {
      try {
        // Fix: Explicitly cast Buffer to any to bypass strict ArrayBuffer checks in this specific TS/Node setup
        const data = fs.readFileSync(zipPath);

        // @ts-ignore
        const zip = await JSZip.loadAsync(data);
        const zipName = path.basename(zipPath, ".zip");

        await this.processZip(zip, zipName);
        successCount++;
      } catch (e: any) {
        console.error("Install Error", e);
        vscode.window.showErrorMessage(
          `Install Failed for ${path.basename(zipPath)}: ${e.message}`
        );
      }
    }

    this.sendStatus(successCount, zipPaths.length);
  }

  private async handleInstallData(zipName: string, base64Data: string) {
    try {
      const data = Buffer.from(base64Data, "base64");
      // @ts-ignore
      const zip = await JSZip.loadAsync(data);
      const cleanName = path.basename(zipName, ".zip"); // Ensure no extension

      await this.processZip(zip, cleanName);

      this.sendStatus(1, 1);
    } catch (e: any) {
      console.error("Install Data Error", e);
      vscode.window.showErrorMessage(
        `Install Failed for ${zipName}: ${e.message}`
      );
      this.sendStatus(0, 1);
    }
  }

  private async processZip(zip: JSZip, zipName: string) {
    // PRE-VALIDATION: Check if SKILL.md exists in the ZIP archive *before* extracting
    const filePaths = Object.keys(zip.files);
    const hasSkillDef = filePaths.some(p => 
        p.match(/(^|[\/\\])(SKILL\.md)$/i)
    );
    
    if (!hasSkillDef) {
        throw new Error("Invalid Skill Package: Missing 'SKILL.md'.");
    }

    // Updated: Install to the standard skill directory so PathManager can see it.
    const targetBaseDir = this.pathManager.getSkillsPath();
    const extractTarget = path.join(targetBaseDir, zipName);

    if (!fs.existsSync(extractTarget))
      fs.mkdirSync(extractTarget, { recursive: true });

    for (const filename of Object.keys(zip.files)) {
      // Extract all files
      const file = zip.files[filename];
      const dest = path.join(extractTarget, filename);

      if (file.dir) {
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
      } else {
        const content = await file.async("nodebuffer");
        const pdir = path.dirname(dest);
        if (!fs.existsSync(pdir)) fs.mkdirSync(pdir, { recursive: true });
        // @ts-ignore
        fs.writeFileSync(dest, content);
      }
    }

    // FIX: Strip top level directory if it exists (Flattening)
    // Check if extractTarget contains ONLY one directory and nothing else
    const extractedItems = fs.readdirSync(extractTarget);
    if (extractedItems.length === 1) {
      const onlyItem = path.join(extractTarget, extractedItems[0]);
      if (fs.statSync(onlyItem).isDirectory()) {
        // Move everything from onlyItem up to extractTarget
        const innerFiles = fs.readdirSync(onlyItem);
        for (const inner of innerFiles) {
          fs.renameSync(
            path.join(onlyItem, inner),
            path.join(extractTarget, inner)
          );
        }
        fs.rmdirSync(onlyItem); // Remove empty nested dir
      }
    }

    // Trigger Generation on this new folder
    // Note: workflowGenerator expects a "Source Path" containing MULTIPLE skills.
    // Since we installed into the *root* skills dir (targetBaseDir), we can just scan that dir.

    // [RE-ENABLED] GENERATION at User Request
    // We now generate the workflow file immediately upon installation.
    const destDir = this.pathManager.getDestinationPath();
    
    // We generate from the internal skills directory to the global workflows directory
    const settings = this.pathManager.getSettings();
    await this.workflowGenerator.generate(
      targetBaseDir,
      destDir,
      undefined,
      settings.targetAgent
    );

    // Just refresh the view
    this.sendWorkflowList();
  }

  // --- Superpowers Installation ---

  /**
   * Handle Superpowers installation request
   */
  private async handleInstallSuperpowers() {
    try {
      // Send installation progress
      this._view?.webview.postMessage({
        command: "superpowersProgress",
        text: "Installing Superpowers..."
      });

      await this.superpowersInstaller.install((step) => {
        this._view?.webview.postMessage({
          command: "superpowersProgress",
          text: step
        });
      });

      // Installation successful
      this._view?.webview.postMessage({
        command: "superpowersStatus",
        installed: true,
        text: "Superpowers installed successfully!"
      });

      // Refresh Workflow list (new workflow commands added)
      this.sendWorkflowList();

      vscode.window.showInformationMessage(
        "Superpowers installed! Reload Antigravity IDE to activate."
      );
    } catch (e: any) {
      this._view?.webview.postMessage({
        command: "superpowersStatus",
        installed: false,
        text: `Installation failed: ${e.message}`
      });
      vscode.window.showErrorMessage(`Superpowers installation failed: ${e.message}`);
    }
  }

  /**
   * Send Superpowers installation status to frontend
   */
  private sendSuperpowersStatus() {
    if (this._view) {
      const installed = this.superpowersInstaller.isInstalled();
      this._view.webview.postMessage({
        command: "superpowersStatus",
        installed: installed,
        path: this.superpowersInstaller.getInstallPath()
      });
    }
  }

  /**
   * Handle Superpowers removal request
   */
  private async handleUninstallSuperpowers() {
    try {
      // Send removal progress
      this._view?.webview.postMessage({
        command: "superpowersProgress",
        text: "Uninstalling Superpowers..."
      });

      await this.superpowersInstaller.uninstall((step) => {
        this._view?.webview.postMessage({
          command: "superpowersProgress",
          text: step
        });
      });

      // Removal successful
      this._view?.webview.postMessage({
        command: "superpowersStatus",
        installed: false,
        text: "Superpowers removed successfully!"
      });

      // Refresh Workflow list
      this.sendWorkflowList();

      vscode.window.showInformationMessage(
        "Superpowers removed successfully!"
      );
    } catch (e: any) {
      this._view?.webview.postMessage({
        command: "superpowersStatus",
        installed: true,
        text: `Uninstallation failed: ${e.message}`
      });
      vscode.window.showErrorMessage(`Superpowers removal failed: ${e.message}`);
    }
  }

  /**
   * Handle Superpowers update request
   */
  private async handleUpdateSuperpowers() {
    try {
      this._view?.webview.postMessage({
        command: "superpowersProgress",
        text: "Updating Superpowers..."
      });

      await this.superpowersInstaller.update((step) => {
        this._view?.webview.postMessage({
          command: "superpowersProgress",
          text: step
        });
      });

      this._view?.webview.postMessage({
        command: "superpowersStatus",
        installed: true,
        text: "Superpowers updated successfully!"
      });

      this.sendWorkflowList();
      vscode.window.showInformationMessage("Superpowers updated successfully!");
    } catch (e: any) {
      this._view?.webview.postMessage({
        command: "superpowersStatus",
        installed: true,
        text: `Update failed: ${e.message}`
      });
      vscode.window.showErrorMessage(`Superpowers update failed: ${e.message}`);
    }
  }

  // --- Anthropic Skills ---

  /**
   * Handle Anthropic Skills installation request
   */
  private async handleInstallAnthropic() {
    try {
      this._view?.webview.postMessage({
        command: "anthropicProgress",
        text: "Installing Anthropic Skills..."
      });

      await this.anthropicInstaller.install((step) => {
        this._view?.webview.postMessage({
          command: "anthropicProgress",
          text: step
        });
      });

      this._view?.webview.postMessage({
        command: "anthropicStatus",
        installed: true,
        text: "Anthropic Skills installed successfully!"
      });

      this.sendWorkflowList();
      vscode.window.showInformationMessage("Anthropic Skills installed!");
    } catch (e: any) {
      this._view?.webview.postMessage({
        command: "anthropicStatus",
        installed: false,
        text: `Installation failed: ${e.message}`
      });
      vscode.window.showErrorMessage(`Anthropic Skills installation failed: ${e.message}`);
    }
  }

  /**
   * Handle Anthropic Skills removal request
   */
  private async handleUninstallAnthropic() {
    try {
      this._view?.webview.postMessage({
        command: "anthropicProgress",
        text: "Uninstalling Anthropic Skills..."
      });

      await this.anthropicInstaller.uninstall((step) => {
        this._view?.webview.postMessage({
          command: "anthropicProgress",
          text: step
        });
      });

      this._view?.webview.postMessage({
        command: "anthropicStatus",
        installed: false,
        text: "Anthropic Skills removed successfully!"
      });

      this.sendWorkflowList();
      vscode.window.showInformationMessage("Anthropic Skills removed!");
    } catch (e: any) {
      this._view?.webview.postMessage({
        command: "anthropicStatus",
        installed: true,
        text: `Uninstallation failed: ${e.message}`
      });
      vscode.window.showErrorMessage(`Anthropic Skills removal failed: ${e.message}`);
    }
  }

  /**
   * Handle Anthropic Skills update request
   */
  private async handleUpdateAnthropic() {
    try {
      this._view?.webview.postMessage({
        command: "anthropicProgress",
        text: "Updating Anthropic Skills..."
      });

      await this.anthropicInstaller.update((step) => {
        this._view?.webview.postMessage({
          command: "anthropicProgress",
          text: step
        });
      });

      this._view?.webview.postMessage({
        command: "anthropicStatus",
        installed: true,
        text: "Anthropic Skills updated successfully!"
      });

      this.sendWorkflowList();
      vscode.window.showInformationMessage("Anthropic Skills updated!");
    } catch (e: any) {
      this._view?.webview.postMessage({
        command: "anthropicStatus",
        installed: true,
        text: `Update failed: ${e.message}`
      });
      vscode.window.showErrorMessage(`Anthropic Skills update failed: ${e.message}`);
    }
  }

  /**
   * Send Anthropic Skills installation status to frontend
   */
  private sendAnthropicStatus() {
    if (this._view) {
      const installed = this.anthropicInstaller.isInstalled();
      this._view.webview.postMessage({
        command: "anthropicStatus",
        installed: installed,
        path: this.anthropicInstaller.getInstallPath()
      });
    }
  }

  private sendStatus(successCount: number, total: number) {
    if (this._view) {
      this._view.webview.postMessage({
        command: "status",
        type: successCount > 0 ? "success" : "error",
        text: `Installed ${successCount}/${total} skills.`,
      });
    }
  }

  // Removed _getWarningHtml as the extension now officially supports multiple IDEs

  private _getHtmlForWebview(webview: vscode.Webview) {
    // Load file contents
    const htmlPath = path.join(this._extensionUri.fsPath,"src","webview","index.html");
    const jsPath = path.join(this._extensionUri.fsPath,"src","webview","main.js");
    const cssPath = path.join(this._extensionUri.fsPath,"src","webview","style.css");

    let htmlContent = fs.readFileSync(htmlPath, "utf8");
    const jsContent = fs.readFileSync(jsPath, "utf8");
    const cssContent = fs.readFileSync(cssPath, "utf8");

    // Inline CSS
    const styleTag = `<style>\n${cssContent}\n</style>`;
    if (htmlContent.includes('<link href="style.css" rel="stylesheet" />')) {
        htmlContent = htmlContent.replace('<link href="style.css" rel="stylesheet" />', styleTag);
    } else {
        // Fallback: Inject into head
        htmlContent = htmlContent.replace('</head>', `${styleTag}\n</head>`);
    }
    
    // Inline JS
    const scriptTag = `<script>\n${jsContent}\n</script>`;
    if (htmlContent.includes('<script src="main.js"></script>')) {
        htmlContent = htmlContent.replace('<script src="main.js"></script>', scriptTag);
    } else {
        // Fallback: Inject at end of body
        htmlContent = htmlContent.replace('</body>', `${scriptTag}\n</body>`);
    }



    // Generate and Inject CSP
    const nonce = 'antigravity-' + Date.now(); // Simple nonce (or just use unsafe-inline which user context likely needs)
    // Note: For simplicity and compatibility with existing inline styles/scripts, we use unsafe-inline mostly.
    // Important: we must include webview.cspSource to allow loading resources from the extension/webview origin
    const csp = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource} 'unsafe-inline'; img-src ${webview.cspSource} https: data:; font-src ${webview.cspSource};">`;
    
    // Inject CSP into head
    htmlContent = htmlContent.replace('<!-- CSP will be injected dynamically -->', csp);
    // Fallback if placeholder missing (legacy check)
    if (!htmlContent.includes(csp) && htmlContent.includes('<head>')) {
         htmlContent = htmlContent.replace('<head>', `<head>${csp}`);
    }

    return htmlContent;
  }

  // --- Davila Skills ---

  private async handleInstallDavila(categories: string[]) {
    try {
      this._view?.webview.postMessage({
        command: "davilaProgress",
        text: "Syncing Community Skills..."
      });

      await this.davilaInstaller.install(categories, (step) => {
        this._view?.webview.postMessage({
          command: "davilaProgress",
          text: step
        });
      });

      this.sendDavilaStatus("Community Skills synced!");
      this.sendWorkflowList();
      vscode.window.showInformationMessage("Community Skills synced!");
    } catch (e: any) {
      this._view?.webview.postMessage({
        command: "davilaStatus",
        installed: false,
        text: `Installation failed: ${e.message}`,
        categories: []
      });
      vscode.window.showErrorMessage(`Davila Skills installation failed: ${e.message}`);
    }
  }

  private async handleUninstallDavila() {
    try {
      this._view?.webview.postMessage({
         command: "davilaProgress",
         text: "Uninstalling Davila Skills..."
      });

      await this.davilaInstaller.uninstall((step) => {
        this._view?.webview.postMessage({
          command: "davilaProgress",
          text: step
        });
      });

      this.sendDavilaStatus("Davila Skills removed!");
      this.sendWorkflowList();
      vscode.window.showInformationMessage("Davila Skills removed!");
    } catch (e: any) {
       this._view?.webview.postMessage({
         command: "davilaProgress",
         text: `Error: ${e.message}`
       });
       vscode.window.showErrorMessage(`Removal failed: ${e.message}`);
    }
  }

  private async handleUpdateDavila() {
      try {
        const info = this.davilaInstaller.getInstallInfo();
        const currentCategories = info?.categories || [];
        
        if (currentCategories.length === 0) {
           vscode.window.showInformationMessage("No Community Skills installed to update.");
           return;
        }

        this._view?.webview.postMessage({
           command: "davilaProgress",
           text: "Updating installed categories..."
        });

        // Sync with existing categories = Re-download/Update (force=true)
        await this.davilaInstaller.sync(currentCategories, (step) => {
           this._view?.webview.postMessage({
             command: "davilaProgress",
             text: step
           });
        }, true);

        this.sendDavilaStatus("Community Skills updated!");
        this.sendWorkflowList();
        vscode.window.showInformationMessage("Community Skills updated!");
      } catch (e: any) {
        this._view?.webview.postMessage({
           command: "davilaProgress",
           text: `Update failed: ${e.message}`
        });
        vscode.window.showErrorMessage(`Update failed: ${e.message}`);
      }
  }

  private sendDavilaStatus(message?: string) {
     if (this._view) {
       const info = this.davilaInstaller.getInstallInfo();
       const installed = this.davilaInstaller.isInstalled();
       
       this._view.webview.postMessage({
         command: "davilaStatus",
         installed: installed,
         text: message,
         categories: info?.categories || [],
         availableCategories: DavilaSkillsInstaller.CATEGORIES 
       });
     }
  }

  // --- UI/UX Pro Max ---

  private async handleInstallUiUxProMax() {
    try {
      this._view?.webview.postMessage({
        command: "uiUxProgress",
        text: "Installing UI/UX Pro Max..."
      });

      await this.uiUxInstaller.install((step) => {
        this._view?.webview.postMessage({
          command: "uiUxProgress",
          text: step
        });
      });

      this.sendUiUxProMaxStatus();
      this.sendWorkflowList();
      vscode.window.showInformationMessage("UI/UX Pro Max Skill installed!");
    } catch (e: any) {
      this._view?.webview.postMessage({
        command: "uiUxStatus",
        installed: false,
        text: `Installation failed: ${e.message}`
      });
      vscode.window.showErrorMessage(`UI/UX Pro Max installation failed: ${e.message}`);
    }
  }

  private sendUiUxProMaxStatus() {
    if (this._view) {
      const installed = this.uiUxInstaller.isInstalled();
      this._view.webview.postMessage({
        command: "uiUxStatus",
        installed: installed,
        path: this.uiUxInstaller.getInstallPath()
      });
    }
  }

  private galleryProxy: GalleryProxyServer | null = null;

  private async handleOpenGallery() {
    
    const panel = vscode.window.createWebviewPanel(
      'uiUxGallery',
      'UI/UX Gallery',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );

    // Initial Loading State
    panel.webview.html = `<!DOCTYPE html>
    <html lang="en">
    <body style="background:#1a1a1a;color:#ccc;display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;">
        <div style="text-align:center;">
            <h2>Starting Local Proxy...</h2>
            <p>Connecting to UI/UX Pro Max...</p>
        </div>
    </body>
    </html>`;

    // Handle messages (From Bridge)
    panel.webview.onDidReceiveMessage(async (message) => {
      if (message.command === 'copy') {
        await vscode.env.clipboard.writeText(message.text);
        vscode.window.showInformationMessage("Prompt copied to clipboard!");
      } else if (message.command === 'error') {
        // vscode.window.showErrorMessage("Gallery Error: " + message.text);
        console.error("Gallery Webview Error:", message.text);
      }
    });

    try {
        // Start Proxy
        if (!this.galleryProxy) {
            this.galleryProxy = new GalleryProxyServer();
        }
        let port = this.galleryProxy.getPort();
        if (port === 0) {
             console.log("Starting Gallery Proxy Server...");
             port = await this.galleryProxy.start();
        }
        
        const targetUrl = `http://127.0.0.1:${port}/`;
        console.log(`Gallery Proxy running at ${targetUrl}`);

        // Set HTML (Parent Bridge)
        // Iframe points to Localhost Proxy
        panel.webview.html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>UI/UX Gallery</title>
                <style>
                    body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; background-color: #1a1a1a; }
                    iframe { width: 100%; height: 100%; border: none; }
                </style>
            </head>
            <body>
                <iframe 
                    src="${targetUrl}" 
                    allow="clipboard-write"
                ></iframe>
                
                <script>
                    const vscode = acquireVsCodeApi();
                    
                    // Bridge: Listen for messages from Iframe Proxy
                    window.addEventListener('message', (e) => {
                         // Forward from Iframe to Extension
                         if (e.data && e.data.command) {
                             console.log("Bridge received:", e.data);
                             vscode.postMessage(e.data);
                         }
                    });
                </script>
            </body>
            </html>`;

    } catch (e: any) {
        vscode.window.showErrorMessage(`Failed to start gallery proxy: ${e.message}`);
        panel.webview.html = `<html><body><h2>Error starting proxy</h2><p>${e.message}</p></body></html>`;
    }
    
    // Cleanup on close
    panel.onDidDispose(() => {
        if (this.galleryProxy) {
            this.galleryProxy.stop();
            this.galleryProxy = null;
        }
    });
  }

  private skillsMpProxy: SkillsMpProxyServer | null = null;

  private async handleOpenSkillsMp() {
    // Create specific panel for SkillsMP
    const panel = vscode.window.createWebviewPanel(
      'skillsMpBrowser',
      'Skills Marketplace',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );

    // Initial Loading Interface
    const loadingHtml = `<!DOCTYPE html>
    <html lang="en">
    <body style="background:#1a1a1a;color:#ccc;display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;">
        <div style="text-align:center;">
            <h2>Connecting to SkillsMP...</h2>
            <p>Setting up secure proxy...</p>
        </div>
    </body>
    </html>`;
    panel.webview.html = loadingHtml;

    // Handle messages from the Webview (including fallback page)
    panel.webview.onDidReceiveMessage(async (message) => {
        if (message.command === 'openExternal') {
             if (message.url) {
                 await vscode.env.openExternal(vscode.Uri.parse(message.url));
             }
        }
    });

    try {
        if (!this.skillsMpProxy) {
            this.skillsMpProxy = new SkillsMpProxyServer();
            
            // Set up ZIP listener
            this.skillsMpProxy.onZipDownloaded = async (zipPath) => {
                // Determine skill name - timestamped default
                // Ideally we parse it from the URL or Headers, but temp file is skill-timestamp.zip
                // Let's rely on handleInstall's capability or processZip's capability
                
                vscode.window.showInformationMessage("Skill ZIP captured! Installing...");
                
                try {
                     // We use the existing logic which takes an array of paths
                     await this.handleInstall([zipPath]);
                     
                     // Notify that it worked
                     vscode.window.showInformationMessage("Skill installed successfully!");
                } catch (e: any) {
                     vscode.window.showErrorMessage(`Failed to install intercepted skill: ${e.message}`);
                } finally {
                    // Start Cleanup of temp file? handleInstall doesn't move it, it reads it.
                    // So we should delete it after.
                    try { fs.unlinkSync(zipPath); } catch {}
                }
            };
        }

        let port = this.skillsMpProxy.getPort();
        if (port === 0) {
             port = await this.skillsMpProxy.start();
        }

        const targetUrl = `http://127.0.0.1:${port}/`;
        console.log(`SkillsMP Proxy running at ${targetUrl}`);

        panel.webview.html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Skills Marketplace</title>
                <style>
                    body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; background-color: #1a1a1a; }
                    iframe { width: 100%; height: 100%; border: none; }
                </style>
            </head>
            <body>
                <iframe 
                    src="${targetUrl}" 
                    allow="clipboard-write"
                ></iframe>
                <script>
                    const vscode = acquireVsCodeApi();
                    window.addEventListener('message', (e) => {
                         // Forward messages from Iframe (Fallback Page) to Extension Host
                         if (e.data && e.data.command === 'openExternal') {
                             vscode.postMessage(e.data);
                         }
                    });
                </script>
            </body>
            </html>`;

    } catch (e: any) {
        vscode.window.showErrorMessage(`Failed to start SkillsMP proxy: ${e.message}`);
        panel.dispose();
    }

    // Note: We don't stop the proxy immediately on dispose because user might reopen.
    // Ideally we stop it when extension deactivates or user explicit stop command.
    // Or we rely on lazy restart.
    panel.onDidDispose(() => {
        // Optional: Stop proxy to save resources
        // if (this.skillsMpProxy) { this.skillsMpProxy.stop(); this.skillsMpProxy = null; }
    });
  }

  // --- CLI Integration ---
  
  private async handleSearchSkills(query: string) {
      if (!query) return;

      try {
          // Run npx skills find query
          // We need to parse output.
          // Output format example:
          /*
            vercel-labs/agent-skills@vercel-react-best-practices
            └ https://skills.sh/vercel-labs/agent-skills/vercel-react-best-practices
          */
          
          const output = await this.runNpxCommand(`npx skills find "${query}"`);
          console.log('[DEBUG] Raw CLI Output:', JSON.stringify(output)); // Debug log for user to see in dev tools
          
          // Strip ANSI codes and carriage returns
          const cleanOutput = output.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
          
          console.log('[DEBUG] Clean Output Lines:', cleanOutput.split('\n'));

          const lines = cleanOutput.split('\n');
          const results: any[] = [];
          
          // Regex to match "owner/repo@skill" OR just "owner/repo"
          for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed) continue;
              // Skip known non-result lines
              if (trimmed.startsWith('└') || trimmed.startsWith('Run') || trimmed.startsWith('Install') || trimmed.startsWith('Discover') || trimmed.startsWith('Usage')) continue;
              if (trimmed.startsWith('http')) continue; // Skip URL lines if they are on their own

              // Match pattern: something/something@something
              if (trimmed.includes('@') && trimmed.includes('/')) {
                  // Format: owner/repo@skill
                  const parts = trimmed.split('@');
                  if (parts.length >= 2) {
                      const repo = parts[0].trim(); // owner/repo
                      const skill = parts[1].trim(); // skillname
                      
                      // Enhance: Create a friendly name/description
                      const friendlyName = skill.replace(/-/g, ' ').replace(/_/g, ' ');
                      // Capitalize
                      const title = friendlyName.replace(/\b\w/g, l => l.toUpperCase());

                      results.push({
                          repo: repo, 
                          skill: skill,
                          title: title, 
                          description: `Skill from ${repo}` 
                      });
                  }
              }
          }
          
          // Limit results
          const limited = results.slice(0, 50);

          if (limited.length === 0) {
              // DEBUG: If no results found, send the raw output to webview for inspection
              this._view?.webview.postMessage({
                  command: "searchError",
                  error: `No results parsed. Raw output excerpt: ${cleanOutput.substring(0, 200)}...`
              });
              return;
          }

          this._view?.webview.postMessage({
              command: "searchResults",
              results: limited
          });

      } catch (e: any) {
          this._view?.webview.postMessage({
              command: "searchError",
              error: e.message
          });
      }
  }

  private async handleInstallFromCli(repo: string) {
      if (!repo) return;

      try {
           this._view?.webview.postMessage({ command: "status", type: "info", text: `Invoking CLI to install ${repo}...` });
           
           // Create Temp Dir
           const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'antigravity-cli-'));
           
           // Run Install
           // npx skills add owner/repo --yes
           // We run in tempDir so it creates .agents/skills there
           await this.runNpxCommand(`npx skills add ${repo} --yes`, tempDir);
           
           // Scan for .agents/skills
           const generatedSkillsDir = path.join(tempDir, '.agents', 'skills');
           
           if (!fs.existsSync(generatedSkillsDir)) {
               throw new Error("CLI finished but no .agents/skills folder found.");
           }
           
           // Move Skills to Antigravity Skills Path
           const targetBaseDir = this.pathManager.getSkillsPath();
           if (!fs.existsSync(targetBaseDir)) fs.mkdirSync(targetBaseDir, { recursive: true });

           const skills = fs.readdirSync(generatedSkillsDir);
           let count = 0;
           
           for (const skill of skills) {
               const src = path.join(generatedSkillsDir, skill);
               const dest = path.join(targetBaseDir, skill);
               
               // Force Move/Copy
               if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true, force: true });
               
               // Rename if possible (same drive), else copy
               try {
                   fs.renameSync(src, dest);
               } catch {
                   fs.cpSync(src, dest, { recursive: true });
               }
               count++;
           }
           
           // Cleanup
           try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
           
           if (count > 0) {
               // Generate Workflows
               await this.workflowGenerator.generate(targetBaseDir, this.pathManager.getDestinationPath());
               this.sendWorkflowList();
               
               this._view?.webview.postMessage({ command: "status", type: "success", text: `Installed ${count} skills from CLI!` });
               vscode.window.showInformationMessage(`Successfully installed ${count} skills from ${repo}`);
           } else {
               throw new Error("No skills found in package.");
           }

      } catch (e: any) {
           console.error("CLI Install Error", e);
           this._view?.webview.postMessage({ command: "status", type: "error", text: `CLI Install Failed: ${e.message}` });
           vscode.window.showErrorMessage(`CLI Install Failed: ${e.message}`);
      }
  }
  
  private runNpxCommand(command: string, cwd?: string): Promise<string> {
      return new Promise((resolve, reject) => {
          cp.exec(command, { cwd: cwd || this._extensionUri.fsPath }, (err, stdout, stderr) => {
               // Note: npx might exit 1 if some warnings, but output is there.
               // skills find exits 0 usually.
               if (err) {
                   // If stderr has info, reject with it
                   // reject(err);
                   // Sometimes npx has non-fatal errors?
                   // Consider checking stdout too.
                   if (stdout && command.includes('find')) {
                       resolve(stdout);
                       return;
                   }
                   reject(new Error(stderr || err.message));
                   return;
               }
               resolve(stdout);
          });
      });
  }
}

