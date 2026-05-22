import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import * as JSZip from "jszip";
import * as https from "https";
import { WorkflowGenerator } from "./WorkflowGenerator";

/**
 * Installer for UI/UX Pro Max Skill
 * Downloads from GitHub, extracts assets, and generates SKILL.md
 */
export class UiUxProMaxInstaller {
  private homeDir: string;
  private skillsDir: string;
  private destSkillDir: string;
  private workflowsDir: string;
  private static readonly ZIP_URL = "https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/archive/refs/heads/main.zip";
  
  // Hardcoded config from agent.json to avoid extra reads
  private static readonly SKILL_CONFIG = {
    title: "ui-ux-pro-max",
    description: "Comprehensive design guide for web and mobile applications. Contains 67 styles, 96 color palettes, 57 font pairings, 99 UX guidelines, and 25 chart types across 13 technology stacks. Searchable database with priority-based recommendations.",
    scriptPath: "skills/ui-ux-pro-max/scripts/search.py",
    skillOrWorkflow: "Skill"
  };

  /**
   * Template content for SKILL.md (Base template)
   * Replacing placeholders: {{TITLE}}, {{DESCRIPTION}}, {{SCRIPT_PATH}}, {{SKILL_OR_WORKFLOW}}
   */
  private static readonly SKILL_TEMPLATE = `
# Activate Skill: {{TITLE}}

Please read and internalize the skill documentation located at:
**\`{{SCRIPT_PATH}}\`** (and related files)

## Mission
{{DESCRIPTION}}

## Instructions
1. Load Context: Read the skill documentation and data files.
2. Activate Persona: Adopt the role of a Senior UI/UX Designer.
3. Execute: Use the provided scripts to search for design patterns.
`;

    // Note: The actual content of SKILL.md on GitHub is quite complex.
    // Instead of hardcoding a simplified version, we should extract the actual template from the ZIP 
    // if possible, OR use a known good 'starter' SKILL.md content.
    // However, the uipro-cli uses a template system. 
    // Let's implement logic to READ the template from the extracted ZIP.

  constructor() {
    this.homeDir = os.homedir();
    // Default location: .gemini/antigravity-ide/skills
    this.skillsDir = path.join(this.homeDir, ".gemini", "antigravity-ide", "skills");
    this.destSkillDir = path.join(this.skillsDir, "ui-ux-pro-max");
    this.workflowsDir = path.join(this.homeDir, ".gemini", "config", "global_workflows");
  }

  public isInstalled(): boolean {
    // Check if SKILL.md exists
    return fs.existsSync(path.join(this.destSkillDir, "SKILL.md"));
  }

  public getInstallPath(): string {
    return this.destSkillDir;
  }

  /**
   * Main install method
   */
  public async install(onProgress?: (step: string) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      // Use setImmediate to not block the main thread if called synchronously
      setImmediate(async () => {
        try {
          // 1. Download
          onProgress?.("Downloading UI/UX Pro Max Skill...");
          const zipBuffer = await this.downloadZip();

          // 2. Extract and Process
          onProgress?.("Extracting files...");
          await this.processZip(zipBuffer);

          // 3. Generate Workflows
          onProgress?.("Generating Workflows...");
          const generator = new WorkflowGenerator();
          await generator.generate(this.skillsDir, this.workflowsDir);

          onProgress?.("Installation Complete!");
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  /**
   * Download the ZIP from GitHub
   */
  private downloadZip(): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const options = {
        headers: {
          "User-Agent": "VSCode-Antigravity-Extension"
        }
      };

      https.get(UiUxProMaxInstaller.ZIP_URL, options, (res) => {
        if (res.statusCode === 302 || res.statusCode === 301) {
          // Follow redirect
          if (res.headers.location) {
            https.get(res.headers.location, options, (res2) => {
               this.handleResponse(res2, resolve, reject);
            }).on('error', reject);
            return;
          }
        }
        this.handleResponse(res, resolve, reject);
      }).on('error', reject);
    });
  }

  private handleResponse(res: any, resolve: (data: Buffer) => void, reject: (err: Error) => void) {
      if (res.statusCode !== 200) {
          reject(new Error(`Failed to download: Status Code ${res.statusCode}`));
          return;
      }
      const chunks: any[] = [];
      res.on('data', (chunk: any) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
  }

  /**
   * Process the ZIP file
   */
  private async processZip(zipBuffer: Buffer): Promise<void> {
    const zip = await JSZip.loadAsync(zipBuffer as any);
    
    // Ensure destination exists
    if (fs.existsSync(this.destSkillDir)) {
      fs.rmSync(this.destSkillDir, { recursive: true, force: true });
    }
    fs.mkdirSync(this.destSkillDir, { recursive: true });

    // We need to find the root folder name (e.g., "ui-ux-pro-max-skill-main/")
    const rootDir = Object.keys(zip.files).find(name => name.endsWith('/') && name.indexOf('/') === name.length - 1);
    if (!rootDir) {
      throw new Error("Invalid ZIP structure: Root directory not found.");
    }

    // 1. Extract 'cli/assets/data' -> 'data'
    await this.extractFolder(zip, rootDir + "cli/assets/data/", path.join(this.destSkillDir, "data"));

    // 2. Extract 'cli/assets/scripts' -> 'scripts'
    await this.extractFolder(zip, rootDir + "cli/assets/scripts/", path.join(this.destSkillDir, "scripts"));

    // 3. Generate SKILL.md
    // Try to read template from ZIP
    const templatePath = rootDir + "cli/assets/templates/base/skill-content.md";
    let templateContent = "";
    
    if (zip.files[templatePath]) {
        templateContent = await zip.files[templatePath].async("string");
    } else {
        // Fallback: simplified template
        templateContent = UiUxProMaxInstaller.SKILL_TEMPLATE;
    }

    const skillMdContent = this.generateSkillMd(templateContent);
    fs.writeFileSync(path.join(this.destSkillDir, "SKILL.md"), skillMdContent);
  }

  /**
   * Extract key folders from ZIP
   */
  private async extractFolder(zip: JSZip, srcFolder: string, destFolder: string): Promise<void> {
    // Standardize srcFolder to end with /
    if (!srcFolder.endsWith('/')) srcFolder += '/';

    const files = Object.keys(zip.files).filter(name => name.startsWith(srcFolder));
    
    for (const filename of files) {
      const file = zip.files[filename];
      const relativePath = filename.substring(srcFolder.length);
      
      if (!relativePath) continue; // Skip the folder itself

      const destPath = path.join(destFolder, relativePath);
      
      if (file.dir) {
        if (!fs.existsSync(destPath)) fs.mkdirSync(destPath, { recursive: true });
      } else {
        const content = await file.async("nodebuffer");
        const pdir = path.dirname(destPath);
        if (!fs.existsSync(pdir)) fs.mkdirSync(pdir, { recursive: true });
        
        // Fix: Explicitly cast Buffer for writeFileSync in VS Code env
        // @ts-ignore
        fs.writeFileSync(destPath, content);
      }
    }
  }

  /**
   * Replace placeholders in template
   */
  private generateSkillMd(template: string): string {
    const config = UiUxProMaxInstaller.SKILL_CONFIG;
    
    // Frontmatter
    const frontmatter = `---
name: ui-ux-pro-max
description: "${config.description}"
---

`;

    // Replace placeholders
    let body = template
      .replace(/\{\{TITLE\}\}/g, config.title)
      .replace(/\{\{DESCRIPTION\}\}/g, config.description)
      .replace(/\{\{SCRIPT_PATH\}\}/g, config.scriptPath)
      .replace(/\{\{SKILL_OR_WORKFLOW\}\}/g, config.skillOrWorkflow)
      .replace(/\{\{QUICK_REFERENCE\}\}/g, ""); // No quick reference for now

    return frontmatter + body;
  }

  /**
   * Fetch gallery data (styles.csv) from GitHub
   */
  public async fetchGalleryData(): Promise<any[]> {
    const url = 'https://raw.githubusercontent.com/NextLevelBuilder/ui-ux-pro-max-skill/main/cli/assets/data/styles.csv';
    
    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Failed to fetch gallery data: ${res.statusCode}`));
          return;
        }

        const data: Buffer[] = [];
        res.on('data', (chunk) => data.push(chunk));
        res.on('end', () => {
          const buffer = Buffer.concat(data as any);
          const csvText = buffer.toString('utf-8');
          try {
            const parsed = this.parseCsv(csvText);
            resolve(parsed);
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', (err) => reject(err));
    });
  }

  private parseCsv(text: string): any[] {
    const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
    if (lines.length < 2) return [];

    const headers = this.parseCsvLine(lines[0]);
    const results = [];

    for (let i = 1; i < lines.length; i++) {
      const currentline = this.parseCsvLine(lines[i]);
      if (currentline.length === headers.length) {
        const obj: any = {};
        for (let j = 0; j < headers.length; j++) {
          obj[headers[j].trim()] = currentline[j].trim();
        }
        results.push(obj);
      }
    }
    return results;
  }

  private parseCsvLine(line: string): string[] {
    const result = [];
    let start = 0;
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') { // Toggle quotes
            inQuotes = !inQuotes;
        } else if (line[i] === ',' && !inQuotes) { // Found separator
            let field = line.substring(start, i);
            field = field.trim();
            if (field.startsWith('"') && field.endsWith('"')) {
                field = field.slice(1, -1).replace(/""/g, '"');
            }
            result.push(field);
            start = i + 1;
        }
    }
    let lastField = line.substring(start);
    lastField = lastField.trim();
    if (lastField.startsWith('"') && lastField.endsWith('"')) {
        lastField = lastField.slice(1, -1).replace(/""/g, '"');
    }
    result.push(lastField);
    return result;
  }


}
