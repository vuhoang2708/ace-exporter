import * as fs from 'fs';
import * as readline from 'readline';
import { IChatParser, Message, ExportMode, ToolCall } from '../types';

export class ClaudeAdapter implements IChatParser {
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
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        for await (const line of rl) {
            processedBytes += Buffer.byteLength(line, 'utf8') + 1; // Estimate newline byte
            if (progressCallback) {
                const percent = Math.min(99, Math.round((processedBytes / fileSize) * 100));
                progressCallback(percent);
            }

            const trimmed = line.trim();
            if (!trimmed) {
                continue;
            }

            try {
                const obj = JSON.parse(trimmed);
                
                // Only process user and assistant messages, skip metadata, snapshots, etc.
                if (obj.type !== 'user' && obj.type !== 'assistant') {
                    continue;
                }

                const timestamp = obj.timestamp;
                const message = obj.message;
                if (!message) {
                    continue;
                }

                const role = message.role;
                const contentParts = message.content;
                if (!Array.isArray(contentParts)) {
                    continue;
                }

                let textContent = '';

                for (const part of contentParts) {
                    if (!part) {
                        continue;
                    }

                    if (part.type === 'text' && typeof part.text === 'string') {
                        textContent += part.text;
                    } else if (part.type === 'tool_use') {
                        const callId = part.id;
                        const name = part.name;
                        const args = typeof part.input === 'string'
                            ? part.input
                            : JSON.stringify(part.input, null, 2);

                        const toolCall: ToolCall = {
                            callId,
                            name,
                            arguments: args
                        };

                        toolCallMap.set(callId, toolCall);

                        if (mode === 'audit') {
                            messages.push({
                                role: 'system',
                                content: '',
                                timestamp,
                                toolCalls: [toolCall]
                            });
                        }
                    } else if (part.type === 'tool_result') {
                        const callId = part.tool_use_id;
                        let outputText = '';

                        if (Array.isArray(part.content)) {
                            for (const block of part.content) {
                                if (block) {
                                    if (typeof block.text === 'string') {
                                        outputText += block.text;
                                    } else if (typeof block.content === 'string') {
                                        outputText += block.content;
                                    }
                                }
                            }
                        } else if (typeof part.content === 'string') {
                            outputText = part.content;
                        }

                        const toolCall = toolCallMap.get(callId);
                        if (toolCall) {
                            toolCall.output = outputText;
                        } else if (mode === 'audit') {
                            const fallbackToolCall: ToolCall = {
                                callId,
                                name: 'Unknown Tool',
                                arguments: '',
                                output: outputText
                            };
                            toolCallMap.set(callId, fallbackToolCall);
                            messages.push({
                                role: 'system',
                                content: '',
                                timestamp,
                                toolCalls: [fallbackToolCall]
                            });
                        }
                    }
                }

                if (textContent.trim()) {
                    messages.push({
                        role: role as 'user' | 'assistant',
                        content: textContent,
                        timestamp
                    });
                }
            } catch (err) {
                // Ignore parse errors for individual lines (robustness)
            }
        }

        if (progressCallback) {
            progressCallback(100);
        }

        return messages;
    }
}

export default ClaudeAdapter;
