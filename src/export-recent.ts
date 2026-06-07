import * as path from 'path';
import * as fs from 'fs';
import { Module } from 'module';

// Mock vscode module before imports
const originalRequire = (Module.prototype as any).require;
(Module.prototype as any).require = function(id: string) {
    if (id === 'vscode') {
        return {
            workspace: {
                getConfiguration: () => ({
                    get: (key: string, defaultValue: any) => {
                        if (key === 'sessionLimit') return 500; // allow large scans
                        if (key === 'toolOutputMaxChars') return 10000;
                        return defaultValue;
                    }
                })
            }
        };
    }
    return originalRequire.apply(this, arguments);
};

// Now import the rest of our modules
import { SessionDiscovery } from './services/SessionDiscovery';
import { CodexAdapter } from './adapters/CodexAdapter';
import { ClaudeAdapter } from './adapters/ClaudeAdapter';
import { MarkdownFormatter } from './services/MarkdownFormatter';

async function runExport() {
    console.log("🚀 Starting ACE Exporter - Recent Conversations Export (7 days)...");
    
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
    const nowMs = Date.now();
    const cutOffMs = nowMs - oneWeekMs;
    const cutOffDate = new Date(cutOffMs);
    console.log(`Filtering files modified since: ${cutOffDate.toLocaleString()}`);

    const exportDir = path.join(__dirname, '..', 'scratch_test_output', 'recent_exports');
    if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
    }

    // Export function for a source
    async function exportSource(source: 'claude' | 'codex', adapter: any) {
        console.log(`\n=== Scanning ${source.toUpperCase()} Sessions ===`);
        const sessions = await SessionDiscovery.discover(source);
        const recentSessions = sessions.filter(s => s.mtime >= cutOffMs);
        console.log(`Discovered ${sessions.length} sessions, ${recentSessions.length} within the last 7 days.`);

        let count = 0;
        for (const session of recentSessions) {
            console.log(`\n[${++count}/${recentSessions.length}] Parsing: ${session.label}`);
            console.log(`   Path: ${session.filePath}`);
            console.log(`   Modified: ${new Date(session.mtime).toLocaleString()}`);

            try {
                // Parse and format clean mode
                const cleanMsgs = await adapter.parse(session.filePath, 'clean', () => {});
                if (cleanMsgs.length > 0) {
                    const cleanMD = MarkdownFormatter.format(cleanMsgs, source, session.label, 'clean');
                    const cleanFileName = `${source.toUpperCase()}_${path.basename(session.label, path.extname(session.label))}_clean.md`;
                    fs.writeFileSync(path.join(exportDir, cleanFileName), cleanMD, 'utf8');
                    console.log(`   ✅ Exported clean: ${cleanFileName}`);
                } else {
                    console.log(`   ⚠️ No clean messages extracted.`);
                }

                // Parse and format audit mode
                const auditMsgs = await adapter.parse(session.filePath, 'audit', () => {});
                if (auditMsgs.length > 0) {
                    const auditMD = MarkdownFormatter.format(auditMsgs, source, session.label, 'audit');
                    const auditFileName = `${source.toUpperCase()}_${path.basename(session.label, path.extname(session.label))}_audit.md`;
                    fs.writeFileSync(path.join(exportDir, auditFileName), auditMD, 'utf8');
                    console.log(`   ✅ Exported audit: ${auditFileName}`);
                }
            } catch (err: any) {
                console.error(`   ❌ Failed parsing ${session.label}:`, err.message || err);
            }
        }
        return recentSessions.length;
    }

    const codexCount = await exportSource('codex', new CodexAdapter());
    const claudeCount = await exportSource('claude', new ClaudeAdapter());

    console.log(`\n✨ Export complete! Total sessions exported: Codex: ${codexCount}, Claude: ${claudeCount}`);
    console.log(`Output folder: ${exportDir}`);
}

runExport().catch(err => {
    console.error("❌ Export script failed:", err);
});
