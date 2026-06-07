import * as fs from 'fs';
import * as readline from 'readline';
import { IChatParser, Message, ExportMode, ToolCall } from '../types';

/**
 * Kiro (AWS AI IDE) session log parser.
 * Kiro stores chat sessions as JSONL with a similar envelope structure to Claude Code.
 * Each line is a JSON object with { type, timestamp, message: { role, content[] } }
 * Content blocks follow the Anthropic content-block shape (text, tool_use, tool_result).
 */
export class KiroAdapter implements IChatParser {
    public async parse(
        filePath: string,
        mode: ExportMode,
        progressCallback?: (percent: number) => void
    ): Promise<Message[]> {
        if (!fs.existsSync(filePath)) {
            return [];
        }

        const stat = fs.statSync(filePath);
        const fileSize = stat.size || 1;
        let processedBytes = 0;

        const messages: Message[] = [];
        const toolCallMap = new Map<string, ToolCall>();

        const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });
        const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

        for await (const line of rl) {
            processedBytes += Buffer.byteLength(line, 'utf8') + 1;
            if (progressCallback) {
                progressCallback(Math.min(99, Math.round((processedBytes / fileSize) * 100)));
            }

            const trimmed = line.trim();
            if (!trimmed) { continue; }

            try {
                const obj = JSON.parse(trimmed);

                // Support both Claude-style { type: 'user'|'assistant', message }
                // and a flat { role, content[] } envelope Kiro may use
                const msgObj = obj.message ?? obj;
                const role: string = msgObj.role ?? obj.type;
                const timestamp: string | undefined = obj.timestamp ?? obj.ts;

                if (!role || !['user', 'assistant'].includes(role)) { continue; }

                const contentParts: any[] = Array.isArray(msgObj.content)
                    ? msgObj.content
                    : typeof msgObj.content === 'string'
                        ? [{ type: 'text', text: msgObj.content }]
                        : [];

                let textContent = '';

                for (const part of contentParts) {
                    if (!part) { continue; }

                    if (part.type === 'text' && typeof part.text === 'string') {
                        textContent += part.text;
                    } else if (part.type === 'tool_use' && mode === 'audit') {
                        const callId = part.id ?? part.call_id ?? `kiro-${Date.now()}`;
                        const args = typeof part.input === 'string'
                            ? part.input
                            : JSON.stringify(part.input ?? part.arguments ?? {}, null, 2);
                        const toolCall: ToolCall = { callId, name: part.name ?? 'tool', arguments: args };
                        toolCallMap.set(callId, toolCall);
                        messages.push({ role: 'system', content: '', timestamp, toolCalls: [toolCall] });
                    } else if (part.type === 'tool_result' && mode === 'audit') {
                        const callId = part.tool_use_id ?? part.call_id;
                        let outputText = '';
                        if (Array.isArray(part.content)) {
                            for (const block of part.content) {
                                if (block?.text) { outputText += block.text; }
                            }
                        } else if (typeof part.content === 'string') {
                            outputText = part.content;
                        }
                        const existing = toolCallMap.get(callId);
                        if (existing) {
                            existing.output = outputText;
                        }
                    }
                }

                if (textContent.trim()) {
                    messages.push({ role: role as 'user' | 'assistant', content: textContent, timestamp });
                }
            } catch {
                // skip malformed lines
            }
        }

        if (progressCallback) { progressCallback(100); }
        return messages;
    }
}

export default KiroAdapter;
