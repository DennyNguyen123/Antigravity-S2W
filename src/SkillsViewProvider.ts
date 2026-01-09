import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { PathManager } from "./services/PathManager";
import { WorkflowGenerator } from "./services/WorkflowGenerator";
// Note: Installer logic can be simple enough to be inline or imported if we had a separate file.
import * as JSZip from "jszip";
import * as os from "os";

export class SkillsViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "antigravityInstructions";

  private _view?: vscode.WebviewView;
  private pathManager: PathManager;
  private workflowGenerator: WorkflowGenerator;

  constructor(private readonly _extensionUri: vscode.Uri) {
    this.pathManager = new PathManager();
    this.workflowGenerator = new WorkflowGenerator();
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
             branch = 'HEAD'; // Use default branch via HEAD ref
             folderPath = ''; // Root
        } else {
             throw new Error("Invalid URL. Supported formats:\n1. https://github.com/owner/repo\n2. https://github.com/owner/repo/tree/branch/path");
        }
    }

    const skillName = folderPath ? path.basename(folderPath) : repo; 
    
    // Prepare Destination
    const skillsDir = this.pathManager.getSkillsPath();
    const destDir = path.join(skillsDir, skillName);
    
    if (fs.existsSync(destDir)) {
        fs.rmSync(destDir, { recursive: true, force: true });
    }
    fs.mkdirSync(destDir, { recursive: true });

    // vscode.window.showInformationMessage(`Downloading '${skillName}' from GitHub...`);

    // Recursive Download
    await this.recursiveDownload(owner, repo, branch, folderPath, destDir);
    
    // vscode.window.showInformationMessage(`Download complete: ${skillName}`);

    // Generate & Refresh
    const workflowsDir = this.pathManager.getDestinationPath();
    await this.workflowGenerator.generate(skillsDir, workflowsDir);
    this.sendWorkflowList();
    
    this._view?.webview.postMessage({ 
        command: "status", 
        type: "success", 
        text: `Installed '${skillName}' from GitHub` 
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
    if (this._view) {
      const sources = this.pathManager.getAvailableSources();
      const workflows = this.getExistingWorkflows();
      this._view.webview.postMessage({
        command: "init",
        locale: vscode.env.language,
        sources: sources,
        workflows: workflows,
      });
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
      const result = await this.workflowGenerator.generate(effectiveSource, destDir);
      
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
    // Updated: Install to the standard skill directory so PathManager can see it.
    const targetBaseDir = path.join(
      os.homedir(),
      ".gemini",
      "antigravity",
      "skills"
    );
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
    await this.workflowGenerator.generate(
      targetBaseDir,
      destDir
    );

    // Just refresh the view
    this.sendWorkflowList();
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

  private _getHtmlForWebview(webview: vscode.Webview) {
    // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "src", "webview", "main.js")
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "src", "webview", "style.css")
    );

    // Load index.html content
    const htmlPath = path.join(
      this._extensionUri.fsPath,
      "src",
      "webview",
      "index.html"
    );
    let htmlContent = fs.readFileSync(htmlPath, "utf8");

    // Inject URIs
    htmlContent = htmlContent.replace("style.css", styleUri.toString());
    htmlContent = htmlContent.replace("main.js", scriptUri.toString());

    return htmlContent;
  }
}
