import * as path from "path";
import * as os from "os";
import * as fs from "fs";

export type SkillSourceType = "gemini" | "claude" | "codex" | "custom";

export interface SkillSource {
  type: string;
  path: string;
  exists: boolean;
}

export type InstallMode = "global" | "local";
export type TargetAgent = "gemini" | "github" | "agents" | "opencode" | "kilo";

export class PathManager {
  private homeDir: string;
  private workspaceRoot?: string;
  private installMode: InstallMode = "global";
  private targetAgent: TargetAgent = "gemini";

  private appName?: string;

  constructor(workspaceRoot?: string, appName?: string) {
    this.homeDir = os.homedir();
    this.workspaceRoot = workspaceRoot;
    this.appName = appName;
    this.autoDetectSettings();
  }

  private autoDetectSettings() {
    let defaultAgent: TargetAgent = "gemini"; // default

    if (this.appName) {
      const appNameLower = this.appName.toLowerCase();
      if (appNameLower.includes("opencode")) {
        defaultAgent = "opencode";
      } else if (appNameLower.includes("kilo")) {
        defaultAgent = "kilo";
      } else if (appNameLower.includes("github")) {
        defaultAgent = "github";
      } else if (appNameLower.includes("cursor") || appNameLower.includes("windsurf")) {
        defaultAgent = "agents"; // Cursor and Windsurf default to Vendor Agnostic
      }
    }

    if (!this.workspaceRoot) {
      this.installMode = "global";
      this.targetAgent = defaultAgent;
      return;
    }

    const checks: { agent: TargetAgent; dir: string }[] = [
      { agent: "github", dir: ".github" },
      { agent: "agents", dir: ".agents" },
      { agent: "gemini", dir: ".gemini" },
      { agent: "opencode", dir: ".opencode" },
      { agent: "kilo", dir: ".kilo" },
    ];

    for (const check of checks) {
      if (fs.existsSync(path.join(this.workspaceRoot, check.dir))) {
        this.installMode = "local";
        this.targetAgent = check.agent;
        return;
      }
    }

    // Default to global with IDE-based default agent if no local folders are found
    this.installMode = "global";
    this.targetAgent = defaultAgent;
  }

  public setSettings(mode: InstallMode, agent: TargetAgent) {
    this.installMode = mode;
    this.targetAgent = agent;
  }

  public getSettings() {
    return {
      installMode: this.installMode,
      targetAgent: this.targetAgent,
      hasWorkspace: !!this.workspaceRoot,
    };
  }

  private getBasePath(): string {
    if (this.installMode === "local" && this.workspaceRoot) {
      return this.workspaceRoot;
    }
    return this.homeDir;
  }

  public getAvailableSources(): SkillSource[] {
    const dynamicPath = this.getSkillsPath();
    const sources: SkillSource[] = [
      {
        type: "claude",
        path: this.resolvePath(".claude/skills"),
        exists: false,
      },
      {
        type: this.targetAgent,
        path: dynamicPath,
        exists: false,
      },
      {
        type: "codex",
        path: this.resolvePath(".codex/skills"),
        exists: false,
      },
    ];

    return sources
      .map((source) => ({
        ...source,
        exists: fs.existsSync(source.path),
      }))
      .filter((s) => s.exists);
  }

  /**
   * Resolves paths supporting `~` for home directory regardless of OS.
   * On Windows, it handles standard paths.
   */
  private resolvePath(relativePath: string): string {
    // Normalize path separators for the current OS
    const normalized = path.normalize(relativePath);
    return path.join(this.homeDir, normalized);
  }

  public getDestinationPath(): string {
    const base = this.getBasePath();

    switch (this.targetAgent) {
      case "gemini":
        return this.installMode === "global"
          ? path.join(base, ".gemini", "config", "global_workflows")
          : path.join(base, ".gemini", "antigravity-ide", "workflows");
      case "github":
        return path.join(base, ".github");
      case "agents":
        return path.join(base, ".agents", "workflows");
      case "opencode":
      case "kilo":
      default:
        return path.join(base, `.${this.targetAgent}`, "workflows");
    }
  }

  public getSkillsPath(): string {
    if (this.targetAgent === "gemini") {
      return this.installMode === "global"
        ? path.join(this.getBasePath(), ".gemini", "antigravity-ide", "skills")
        : path.join(this.getBasePath(), ".gemini", "skills");
    }
    return path.join(this.getBasePath(), `.${this.targetAgent}`, "skills");
  }
}
