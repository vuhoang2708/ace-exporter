import * as fs from 'fs';
import * as readline from 'readline';
import { IChatParser, Message, ExportMode, ToolCall } from '../types';

export class CodexAdapter implements IChatParser {
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
                const timestamp = obj.timestamp;
                const type = obj.type;
                const payload = obj.payload;

                if (!payload) {
                    continue;
                }

                if (type === 'response_item') {
                    const payloadType = payload.type;

                    if (payloadType === 'message') {
                        const role = payload.role;
                        const contentParts = payload.content || [];
                        let text = '';

                        for (const part of contentParts) {
                            if (part && typeof part.text === 'string') {
                                text += part.text;
                            }
                        }

                        // Filter based on mode
                        if (mode === 'clean') {
                            if (role === 'user' || role === 'assistant') {
                                messages.push({
                                    role,
                                    content: text,
                                    timestamp
                                });
                            }
                        } else {
                            // Audit mode: keep all roles (user, assistant, developer)
                            if (role === 'user' || role === 'assistant' || role === 'developer') {
                                messages.push({
                                    role: role as any,
                                    content: text,
                                    timestamp
                                });
                            }
                        }
                    } else if (payloadType === 'function_call' && mode === 'audit') {
                        const callId = payload.call_id;
                        const name = payload.name;
                        const args = typeof payload.arguments === 'string' 
                            ? payload.arguments 
                            : JSON.stringify(payload.arguments, null, 2);

                        const toolCall: ToolCall = {
                            callId,
                            name,
                            arguments: args
                        };

                        toolCallMap.set(callId, toolCall);

                        // Push a placeholder message that will render the tool call (grouped)
                        messages.push({
                            role: 'system',
                            content: '',
                            timestamp,
                            toolCalls: [toolCall]
                        });
                    } else if (payloadType === 'function_call_output' && mode === 'audit') {
                        const callId = payload.call_id;
                        const output = payload.output;

                        const toolCall = toolCallMap.get(callId);
                        if (toolCall) {
                            toolCall.output = output;
                        } else {
                            // Fallback if output appears before call (unlikely but safe)
                            const fallbackToolCall: ToolCall = {
                                callId,
                                name: 'Unknown Tool',
                                arguments: '',
                                output
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
                } else if (type === 'event_msg' && mode === 'audit') {
                    const payloadType = payload.type;
                    if (payloadType === 'agent_message' && payload.phase === 'commentary') {
                        messages.push({
                            role: 'commentary',
                            content: payload.message || '',
                            timestamp
                        });
                    }
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
export default CodexAdapter;
