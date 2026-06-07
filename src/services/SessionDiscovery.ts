import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { SessionFile, ChatSource } from '../types';

export class SessionDiscovery {
    public static async discover(source: ChatSource): Promise<SessionFile[]> {
        const config = vscode.workspace.getConfiguration('aceExporter');
        const limit = config.get<number>('sessionLimit', 50);

        const userProfile = process.env.USERPROFILE || process.env.HOME || 'C:\\Users\\vu.hoang';
        let baseDirs: string[] = [];

        if (source === 'codex') {
            baseDirs = [path.join(userProfile, '.codex', 'sessions')];
        } else if (source === 'kiro') {
            baseDirs = [
                path.join(userProfile, '.kiro', 'sessions'),
                path.join(userProfile, '.kiro', 'logs')
            ];
        } else {
            baseDirs = [path.join(userProfile, '.claude', 'projects')];
        }

        const files: SessionFile[] = [];
        for (const dir of baseDirs) {
            if (fs.existsSync(dir)) {
                this.walkDirectory(dir, files);
            }
        }

        files.sort((a, b) => b.mtime - a.mtime);
        return files.slice(0, limit);
    }

    private static walkDirectory(dir: string, resultList: SessionFile[]) {
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    this.walkDirectory(fullPath, resultList);
                } else if (entry.isFile() && (entry.name.endsWith('.jsonl') || entry.name.endsWith('.json'))) {
                    try {
                        const stat = fs.statSync(fullPath);
                        const sizeMB = (stat.size / (1024 * 1024)).toFixed(2);
                        const mtimeDate = new Date(stat.mtime);
                        const formattedTime = mtimeDate.toLocaleString();

                        let parentLabel = path.basename(path.dirname(fullPath));
                        const parts = fullPath.split(path.sep);
                        const sessionsIdx = parts.lastIndexOf('sessions');
                        if (sessionsIdx !== -1 && parts.length > sessionsIdx + 3) {
                            parentLabel = parts.slice(sessionsIdx + 1, sessionsIdx + 4).join('/');
                        }

                        resultList.push({
                            filePath: fullPath,
                            label: entry.name,
                            description: `[${parentLabel}] ${formattedTime} (${sizeMB} MB)`,
                            mtime: stat.mtimeMs,
                            size: stat.size
                        });
                    } catch {
                        // skip locked / permission-denied files
                    }
                }
            }
        } catch {
            // skip unreadable directories
        }
    }
}
export default SessionDiscovery;
