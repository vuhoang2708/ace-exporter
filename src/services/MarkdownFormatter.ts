import * as vscode from 'vscode';
import { Message, ExportMode, ChatSource } from '../types';

const SOURCE_ICON: Record<ChatSource, string> = {
    claude: '🤖',
    codex: '⚡',
    kiro: '🪄'
};

const ROLE_HEADING: Record<string, string> = {
    user: '## 👤 User',
    assistant: '## 🤖 Assistant',
    developer: '## 🛠 Developer',
    commentary: '> 💬 **Commentary'
};

export class MarkdownFormatter {
    public static format(
        messages: Message[],
        source: ChatSource,
        sessionId: string,
        mode: ExportMode
    ): string {
        const config = vscode.workspace.getConfiguration('aceExporter');
        const maxToolChars = config.get<number>('toolOutputMaxChars', 2000);

        const now = new Date();
        const exportDate = now.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
        const icon = SOURCE_ICON[source] ?? '💬';
        const sourceLabel = source.charAt(0).toUpperCase() + source.slice(1);

        const userCount = messages.filter(m => m.role === 'user').length;
        const assistantCount = messages.filter(m => m.role === 'assistant').length;
        const toolCount = messages.filter(m => m.role === 'system' && m.toolCalls?.length).length;

        let md = `# ${icon} Chat Export — ${sourceLabel}\n\n`;
        md += `| Field | Value |\n`;
        md += `|---|---|\n`;
        md += `| **Source** | ${sourceLabel} |\n`;
        md += `| **Session** | \`${sessionId}\` |\n`;
        md += `| **Exported** | ${exportDate} |\n`;
        md += `| **Mode** | ${mode.charAt(0).toUpperCase() + mode.slice(1)} |\n`;
        md += `| **Messages** | 👤 ${userCount} user / 🤖 ${assistantCount} assistant |\n`;
        if (mode === 'audit') {
            md += `| **Tool calls** | ${toolCount} |\n`;
        }
        md += `\n---\n\n`;

        for (const msg of messages) {
            const tsStr = msg.timestamp ? ` <sub>${msg.timestamp}</sub>` : '';

            if (msg.role === 'user') {
                md += `${ROLE_HEADING.user}${tsStr}\n\n${msg.content}\n\n---\n\n`;
            } else if (msg.role === 'assistant') {
                md += `${ROLE_HEADING.assistant}${tsStr}\n\n${msg.content}\n\n---\n\n`;
            } else if (msg.role === 'developer') {
                md += `${ROLE_HEADING.developer}${tsStr}\n\n${msg.content}\n\n---\n\n`;
            } else if (msg.role === 'commentary') {
                const ts = msg.timestamp ? ` (${msg.timestamp})` : '';
                md += `${ROLE_HEADING.commentary}${ts}:** ${msg.content}\n\n---\n\n`;
            } else if (msg.role === 'system' && msg.toolCalls?.length) {
                for (const tool of msg.toolCalls) {
                    const idStr = tool.callId ? ` \`${tool.callId}\`` : '';
                    md += `## 🔧 Tool: \`${tool.name}\`${idStr}${tsStr}\n\n`;
                    md += `**Arguments:**\n`;
                    let args = tool.arguments;
                    try {
                        args = JSON.stringify(JSON.parse(tool.arguments), null, 2);
                    } catch { /* keep as-is */ }
                    md += `\`\`\`json\n${args}\n\`\`\`\n\n`;

                    if (tool.output !== undefined) {
                        md += `**Output:**\n`;
                        const out = tool.output.length > maxToolChars
                            ? tool.output.slice(0, maxToolChars) + `\n\n…[truncated ${tool.output.length - maxToolChars} chars]`
                            : tool.output;
                        md += `\`\`\`\n${out}\n\`\`\`\n\n`;
                    }
                }
                md += `---\n\n`;
            }
        }

        return md.trimEnd() + '\n';
    }
}

export default MarkdownFormatter;
