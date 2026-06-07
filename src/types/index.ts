export type ExportMode = 'clean' | 'audit';

export type ChatSource = 'codex' | 'claude' | 'kiro';

export interface SessionFile {
    filePath: string;
    label: string;
    description: string;
    mtime: number;
    size: number;
}

export interface ToolCall {
    callId?: string;
    name: string;
    arguments: string;
    output?: string;
}

export interface Message {
    role: 'user' | 'assistant' | 'developer' | 'system' | 'commentary';
    content: string;
    timestamp?: string;
    toolCalls?: ToolCall[];
}

export interface IChatParser {
    parse(filePath: string, mode: ExportMode, progressCallback?: (percent: number) => void): Promise<Message[]>;
}
