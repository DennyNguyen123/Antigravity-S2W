import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

export type SkillSourceType = 'gemini' | 'claude' | 'codex';

export interface SkillSource {
    type: SkillSourceType;
    path: string;
    exists: boolean;
}

export class PathManager {
    private homeDir: string;

    constructor() {
        this.homeDir = os.homedir();
    }

    public getAvailableSources(): SkillSource[] {
        const sources: SkillSource[] = [
            {
                type: 'claude',
                path: this.resolvePath('.claude/skills'),
                exists: false
            },
            {
                type: 'gemini',
                path: this.resolvePath('.gemini/skills'),
                exists: false
            },
            {
                type: 'codex',
                path: this.resolvePath('.codex/skills'), // Defaulting, might need adjust for Windows/WSL
                exists: false
            }
        ];

        return sources.map(source => ({
            ...source,
            exists: fs.existsSync(source.path)
        })).filter(s => s.exists);
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

    public getDestinationPath(workspaceRoot?: string): string {
        // Always global, per user request
        return path.join(this.homeDir, '.gemini', 'antigravity', 'global_workflows');
    }

    public getSkillsPath(): string {
        return path.join(this.homeDir, '.gemini', 'skills');
    }
}

