import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";
import { exec } from "child_process";
import { promisify } from "util";
import { PathManager } from "./PathManager";
import { WorkflowGenerator } from "./WorkflowGenerator";

const execAsync = promisify(exec);

interface DavilaManifest {
  date: string;
  categories: string[];
  skills: string[]; // Flat list (legacy support + easy access)
  skillMap?: { [category: string]: string[] }; // Map category -> skills
}

/**
 * Manages installation of Community Skills (Davila7)
 * Repository: https://github.com/davila7/claude-code-templates
 * Path: cli-tool/components/skills
 */
export class DavilaSkillsInstaller {
  private static readonly REPO_URL = "https://github.com/davila7/claude-code-templates.git";
  
  public static readonly CATEGORIES = [
    "ai-research",
    "business-marketing",
    "creative-design",
    "database",
    "development",
    "document-processing",
    "enterprise-communication",
    "media",
    "productivity",
    "railway",
    "scientific",
    "sentry",
    "utilities",
    "workflow-automation"
  ];

  private context: vscode.ExtensionContext | undefined;
  private pathManager: PathManager;
  private skillsDir: string;
  private workflowsDir: string;
  private tempDir: string;

  constructor() {
    this.pathManager = new PathManager();
    this.skillsDir = this.pathManager.getSkillsPath();
    this.workflowsDir = this.pathManager.getDestinationPath();
    this.tempDir = path.join(os.tmpdir(), "antigravity-davila-temp");
  }

  public setContext(context: vscode.ExtensionContext) {
    this.context = context;
  }

  public isInstalled(): boolean {
    const markerFile = path.join(this.skillsDir, ".davila-installed");
    return fs.existsSync(markerFile);
  }

  public getInstallInfo(): DavilaManifest | null {
    const markerFile = path.join(this.skillsDir, ".davila-installed");
    if (!fs.existsSync(markerFile)) return null;
    
    try {
      return JSON.parse(fs.readFileSync(markerFile, 'utf8'));
    } catch {
      return null;
    }
  }

  /**
   * Syncs installed categories with the desired list.
   * Installs missing categories, removes unselected categories.
   * @param force If true, re-downloads all desired categories even if already installed.
   */
  public async sync(desiredCategories: string[], onProgress?: (step: string) => void, force: boolean = false): Promise<void> {
    const currentInfo = this.getInstallInfo();
    const currentCategories = currentInfo?.categories || [];
    const currentSkillMap = currentInfo?.skillMap || {};

    // 1. Calculate Diff
    const toAdd = desiredCategories.filter(c => !currentCategories.includes(c));
    const toRemove = currentCategories.filter(c => !desiredCategories.includes(c));
    const toKeep = currentCategories.filter(c => desiredCategories.includes(c));

    if (!force && toAdd.length === 0 && toRemove.length === 0) {
      onProgress?.("No changes detected.");
      return;
    }

    onProgress?.(force 
      ? `Updating ${desiredCategories.length} categories...`
      : `Syncing: Adding ${toAdd.length}, Removing ${toRemove.length}...`
    );

    // 2. Remove Phase
    if (toRemove.length > 0) {
      onProgress?.("Removing unselected categories...");
      const skillsToRemove: Set<string> = new Set();
      
      // Identify candidates for removal
      for (const cat of toRemove) {
        const skillsInCat = currentSkillMap[cat] || [];
        for (const skill of skillsInCat) {
           skillsToRemove.add(skill);
        }
      }

      // Protection: Don't remove if needed by a Kept category (unless we are forcing update, in which case we might overwrite anyway, but removal is for Clean Up)
      // If force=true, toKeep is everything desired. toRemove is only what is NOT desired.
      // So logic holds.
      for (const cat of toKeep) {
        const skillsInKept = currentSkillMap[cat] || [];
        for (const skill of skillsInKept) {
          if (skillsToRemove.has(skill)) {
            skillsToRemove.delete(skill); // Keep it
          }
        }
      }

      // Execute Removal
      for (const skillName of skillsToRemove) {
        this.removeSkillFiles(skillName);
      }

      // Update Map
      for (const cat of toRemove) {
        delete currentSkillMap[cat];
      }
    }

    // 3. Add/Update Phase
    const categoriesToDownload = force ? desiredCategories : toAdd;
    
    if (categoriesToDownload.length > 0) {
      onProgress?.(force ? "Re-downloading categories..." : "Downloading new categories...");
      const newSkillsMap = await this.downloadCategories(categoriesToDownload, onProgress);
      // Merge maps
      Object.assign(currentSkillMap, newSkillsMap);
    }

    // 4. Update Marker
    const finalCategories = [...toKeep, ...toAdd].sort();
    const finalSkills = new Set<string>();
    for (const cat of finalCategories) {
      const skills = currentSkillMap[cat] || [];
      skills.forEach(s => finalSkills.add(s));
    }

    const newManifest: DavilaManifest = {
      date: new Date().toISOString(),
      categories: finalCategories,
      skills: Array.from(finalSkills).sort(),
      skillMap: currentSkillMap
    };

    if (!fs.existsSync(this.skillsDir)) {
      fs.mkdirSync(this.skillsDir, { recursive: true });
    }
    fs.writeFileSync(path.join(this.skillsDir, ".davila-installed"), JSON.stringify(newManifest, null, 2));

    // 5. Regenerate Workflows
    onProgress?.("Regenerating workflows...");
    const generator = new WorkflowGenerator();
    await generator.generate(this.skillsDir, this.workflowsDir);

    onProgress?.("Sync complete!");
  }

  /**
   * Helper: Download specific categories and return map of { category: [installedSkills] }
   */
  private async downloadCategories(categories: string[], onProgress?: (step: string) => void): Promise<{ [key: string]: string[] }> {
     const resultMap: { [key: string]: string[] } = {};
     
     if (fs.existsSync(this.tempDir)) {
       fs.rmSync(this.tempDir, { recursive: true, force: true });
     }
     fs.mkdirSync(this.tempDir, { recursive: true });

     try {
       onProgress?.("Cloning repository...");
       await execAsync(`git clone --filter=blob:none --no-checkout --depth 1 "${DavilaSkillsInstaller.REPO_URL}" "${this.tempDir}"`);
       await execAsync("git sparse-checkout init --cone", { cwd: this.tempDir });

       const pathsToCheckout = categories.map(c => `cli-tool/components/skills/${c}`);
       await execAsync(`git sparse-checkout set ${pathsToCheckout.join(" ")}`, { cwd: this.tempDir });
       await execAsync("git checkout", { cwd: this.tempDir });

       const sourceBase = path.join(this.tempDir, "cli-tool", "components", "skills");
       
       for (const category of categories) {
         const catDir = path.join(sourceBase, category);
         resultMap[category] = [];

         if (fs.existsSync(catDir)) {
            const entries = fs.readdirSync(catDir, { withFileTypes: true });
            for (const entry of entries) {
              if (!entry.isDirectory()) continue;
              const skillName = entry.name;
              const sourcePath = path.join(catDir, skillName);
              const targetPath = path.join(this.skillsDir, skillName);

              if (!fs.existsSync(this.skillsDir)) fs.mkdirSync(this.skillsDir, { recursive: true });
              
              // Copy/Install
              fs.cpSync(sourcePath, targetPath, { recursive: true, force: true });
              resultMap[category].push(skillName);
            }
         }
       }

     } finally {
       if (fs.existsSync(this.tempDir)) {
         fs.rmSync(this.tempDir, { recursive: true, force: true });
       }
     }

     return resultMap;
  }

  private removeSkillFiles(skillName: string) {
      const skillPath = path.join(this.skillsDir, skillName);
      if (fs.existsSync(skillPath)) {
        fs.rmSync(skillPath, { recursive: true, force: true });
      }
      
      const workflowFile = path.join(this.workflowsDir, `${skillName}.md`);
      const workflowFileDisabled = path.join(this.workflowsDir, `${skillName}.md.disable`);
      if (fs.existsSync(workflowFile)) fs.rmSync(workflowFile, { force: true });
      if (fs.existsSync(workflowFileDisabled)) fs.rmSync(workflowFileDisabled, { force: true });
  }

  // Legacy/Compatibility Adapter
  public async install(categories: string[], onProgress?: (step: string) => void): Promise<void> {
    // Treat 'install' as 'merge' or 'sync'? 
    // Given the previous behavior was additive, let's map it to sync BUT we need to know existing categories.
    // Actually, 'sync' is safer. Let's redirect to sync, assuming input 'categories' is the NEW DESIRED STATE.
    // If the UI sends ONLY keys that are checked, then sync is exactly what we want.
    return this.sync(categories, onProgress);
  }

  public async uninstall(onProgress?: (step: string) => void): Promise<void> {
      return this.sync([], onProgress); // Sync with empty list = remove all
  }
}
