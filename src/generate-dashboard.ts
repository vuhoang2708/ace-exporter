import * as fs from 'fs';
import * as path from 'path';

async function generateDashboard() {
    console.log("📊 Starting ACE Exporter Dashboard Generator...");

    const recentExportsDir = path.join(__dirname, '..', 'scratch_test_output', 'recent_exports');
    if (!fs.existsSync(recentExportsDir)) {
        console.error(`❌ Exports directory not found: ${recentExportsDir}`);
        process.exit(1);
    }

    const files = fs.readdirSync(recentExportsDir).filter(f => f.endsWith('.md'));
    console.log(`Found ${files.length} Markdown export files.`);

    const sessionsData: any[] = [];

    for (const file of files) {
        const filePath = path.join(recentExportsDir, file);
        const stats = fs.statSync(filePath);
        const content = fs.readFileSync(filePath, 'utf8');

        // Extract metadata using regex
        const sourceMatch = content.match(/\|\s*\*\*Source\*\*\s*\|\s*([^|\s]+)\s*\|/);
        const sessionMatch = content.match(/\|\s*\*\*Session\*\*\s*\|\s*`([^`]+)`\s*\|/);
        const exportedMatch = content.match(/\|\s*\*\*Exported\*\*\s*\|\s*([^|]+?)\s*\|/);
        const modeMatch = content.match(/\|\s*\*\*Mode\*\*\s*\|\s*([^|\s]+)\s*\|/);
        const msgMatch = content.match(/\|\s*\*\*Messages\*\*\s*\|\s*👤\s*(\d+)\s*user\s*\/\s*🤖\s*(\d+)\s*assistant\s*\|/);
        const toolMatch = content.match(/\|\s*\*\*Tool calls\*\*\s*\|\s*(\d+)\s*\|/);

        const source = sourceMatch ? sourceMatch[1].trim() : (file.startsWith('CLAUDE') ? 'Claude' : 'Codex');
        const session = sessionMatch ? sessionMatch[1].trim() : file;
        const exported = exportedMatch ? exportedMatch[1].trim() : new Date(stats.mtimeMs).toISOString();
        const mode = modeMatch ? modeMatch[1].trim() : (file.includes('_clean') ? 'Clean' : 'Audit');
        const userMsgs = msgMatch ? parseInt(msgMatch[1]) : 0;
        const assistantMsgs = msgMatch ? parseInt(msgMatch[2]) : 0;
        const toolCalls = toolMatch ? parseInt(toolMatch[1]) : 0;

        // Extract snippet (skipping header table)
        const parts = content.split('---\n\n');
        let preview = '';
        if (parts.length > 1) {
            // Get first message body and clean markdown headers
            const firstMsg = parts[1].replace(/^[#\s\S]+?\n\n/, '').trim();
            preview = firstMsg.slice(0, 200) + (firstMsg.length > 200 ? '...' : '');
        } else {
            preview = content.slice(0, 200) + (content.length > 200 ? '...' : '');
        }

        sessionsData.push({
            fileName: file,
            source,
            session,
            exported,
            mode,
            userMsgs,
            assistantMsgs,
            toolCalls,
            fileSize: stats.size,
            preview,
            content // full content for deep search
        });
    }

    // Sort by export date descending
    sessionsData.sort((a, b) => new Date(b.exported).getTime() - new Date(a.exported).getTime());

    // Read the template HTML
    const templatePath = path.join(__dirname, '..', 'src', 'dashboard_template.html');
    if (!fs.existsSync(templatePath)) {
        console.error(`❌ Template HTML file not found: ${templatePath}`);
        process.exit(1);
    }

    const templateContent = fs.readFileSync(templatePath, 'utf8');

    // Replace placeholder with JSON stringified sessions data
    const finalHtml = templateContent.replace('/*__SESSIONS_DATA__*/[]', JSON.stringify(sessionsData, null, 2));

    const outputPath = path.join(__dirname, '..', 'recent_exports_dashboard.html');
    fs.writeFileSync(outputPath, finalHtml, 'utf8');
    console.log(`✨ Dashboard HTML successfully created at: ${outputPath}`);
}

generateDashboard().catch(err => {
    console.error("❌ Dashboard generation failed:", err);
});
