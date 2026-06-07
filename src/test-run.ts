import * as path from 'path';
import * as fs from 'fs';
import { SessionDiscovery } from './services/SessionDiscovery';
import { CodexAdapter } from './adapters/CodexAdapter';
import { ClaudeAdapter } from './adapters/ClaudeAdapter';
import { MarkdownFormatter } from './services/MarkdownFormatter';

async function main() {
    console.log("🔍 Running ACE Exporter Integration Test...");
    
    // Test Directory
    const testOutputDir = path.join(__dirname, '..', 'scratch_test_output');
    if (!fs.existsSync(testOutputDir)) {
        fs.mkdirSync(testOutputDir, { recursive: true });
    }
    
    console.log(`\n--- 1. Discovering Codex Sessions ---`);
    const codexSessions = await SessionDiscovery.discover('codex');
    console.log(`Discovered ${codexSessions.length} Codex sessions.`);
    for (const s of codexSessions.slice(0, 3)) {
        console.log(`- ${s.label} (${s.description})`);
    }

    console.log(`\n--- 2. Discovering Claude Sessions ---`);
    const claudeSessions = await SessionDiscovery.discover('claude');
    console.log(`Discovered ${claudeSessions.length} Claude sessions.`);
    for (const s of claudeSessions.slice(0, 3)) {
        console.log(`- ${s.label} (${s.description})`);
    }

    // Run Parser and Formatter on Codex
    if (codexSessions.length > 0) {
        const codexSession = codexSessions[0];
        console.log(`\n--- 3. Testing Codex Parsing (${codexSession.filePath}) ---`);
        
        const codexAdapter = new CodexAdapter();
        
        console.log("Parsing in 'clean' mode...");
        const cleanMsgs = await codexAdapter.parse(codexSession.filePath, 'clean', (p) => {
            console.log(`Clean mode parsing progress: ${p}%`);
        });
        console.log(`Extracted ${cleanMsgs.length} messages.`);
        
        const cleanMD = MarkdownFormatter.format(cleanMsgs, 'codex', codexSession.label, 'clean');
        const cleanPath = path.join(testOutputDir, `Codex_${codexSession.label}_clean.md`);
        fs.writeFileSync(cleanPath, cleanMD, 'utf8');
        console.log(`Saved clean Markdown to: ${cleanPath}`);

        console.log("Parsing in 'audit' mode...");
        const auditMsgs = await codexAdapter.parse(codexSession.filePath, 'audit', (p) => {
            console.log(`Audit mode parsing progress: ${p}%`);
        });
        console.log(`Extracted ${auditMsgs.length} messages.`);
        
        const auditMD = MarkdownFormatter.format(auditMsgs, 'codex', codexSession.label, 'audit');
        const auditPath = path.join(testOutputDir, `Codex_${codexSession.label}_audit.md`);
        fs.writeFileSync(auditPath, auditMD, 'utf8');
        console.log(`Saved audit Markdown to: ${auditPath}`);
    } else {
        console.log("\n⚠️ No Codex sessions found, skipping Codex parsing test.");
    }

    // Run Parser and Formatter on Claude
    if (claudeSessions.length > 0) {
        const claudeSession = claudeSessions[0];
        console.log(`\n--- 4. Testing Claude Parsing (${claudeSession.filePath}) ---`);
        
        const claudeAdapter = new ClaudeAdapter();
        
        console.log("Parsing in 'clean' mode...");
        const cleanMsgs = await claudeAdapter.parse(claudeSession.filePath, 'clean', (p) => {
            console.log(`Clean mode parsing progress: ${p}%`);
        });
        console.log(`Extracted ${cleanMsgs.length} messages.`);
        
        const cleanMD = MarkdownFormatter.format(cleanMsgs, 'claude', claudeSession.label, 'clean');
        const cleanPath = path.join(testOutputDir, `Claude_${claudeSession.label}_clean.md`);
        fs.writeFileSync(cleanPath, cleanMD, 'utf8');
        console.log(`Saved clean Markdown to: ${cleanPath}`);

        console.log("Parsing in 'audit' mode...");
        const auditMsgs = await claudeAdapter.parse(claudeSession.filePath, 'audit', (p) => {
            console.log(`Audit mode parsing progress: ${p}%`);
        });
        console.log(`Extracted ${auditMsgs.length} messages.`);
        
        const auditMD = MarkdownFormatter.format(auditMsgs, 'claude', claudeSession.label, 'audit');
        const auditPath = path.join(testOutputDir, `Claude_${claudeSession.label}_audit.md`);
        fs.writeFileSync(auditPath, auditMD, 'utf8');
        console.log(`Saved audit Markdown to: ${auditPath}`);
    } else {
        console.log("\n⚠️ No Claude sessions found, skipping Claude parsing test.");
    }

    console.log("\n✨ Integration test complete!");
}

main().catch(err => {
    console.error("❌ Test failed:", err);
});
