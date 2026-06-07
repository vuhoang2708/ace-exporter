import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { SessionDiscovery } from './services/SessionDiscovery';
import { CodexAdapter } from './adapters/CodexAdapter';
import { ClaudeAdapter } from './adapters/ClaudeAdapter';
import { KiroAdapter } from './adapters/KiroAdapter';
import { MarkdownFormatter } from './services/MarkdownFormatter';
import { ChatSource, ExportMode } from './types';

let outputChannel: vscode.OutputChannel;
let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
    outputChannel = vscode.window.createOutputChannel("ACE Exporter");
    outputChannel.appendLine("ACE Exporter extension is now active.");

    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'ace.exportLatest';
    statusBarItem.text = '$(export) ACE';
    statusBarItem.tooltip = 'ACE Exporter: Quick export latest session';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    context.subscriptions.push(
        vscode.commands.registerCommand('ace.exportChat', () => runExportFlow(false)),
        vscode.commands.registerCommand('ace.exportLatest', () => runExportFlow(true)),
        vscode.commands.registerCommand('ace.openOutputFolder', openOutputFolder),
        vscode.commands.registerCommand('ace.showStatus', showStatus)
    );
}

async function runExportFlow(quickMode: boolean) {
    const config = vscode.workspace.getConfiguration('aceExporter');
    const defaultSource = config.get<ChatSource>('defaultSource', 'claude');
    const defaultMode = config.get<ExportMode>('defaultMode', 'clean');

    try {
        let source: ChatSource;
        let mode: ExportMode;
        let sessionFilePath: string;

        if (quickMode) {
            source = defaultSource;
            mode = defaultMode;
            const sessions = await SessionDiscovery.discover(source);
            if (sessions.length === 0) {
                vscode.window.showWarningMessage(`ACE Exporter: No ${source} session logs found.`);
                return;
            }
            sessionFilePath = sessions[0].filePath;
            outputChannel.appendLine(`Quick export: ${source} latest → ${path.basename(sessionFilePath)}`);
        } else {
            const sourcePick = await vscode.window.showQuickPick(
                [
                    { label: 'Claude', description: 'Anthropic Claude session logs', value: 'claude' as ChatSource },
                    { label: 'Codex', description: 'OpenAI Codex session logs', value: 'codex' as ChatSource },
                    { label: 'Kiro', description: 'AWS Kiro session logs', value: 'kiro' as ChatSource }
                ],
                { placeHolder: 'Select chat history source', title: 'ACE Exporter' }
            );
            if (!sourcePick) { return; }
            source = sourcePick.value;

            outputChannel.appendLine(`Scanning sessions for: ${source}`);
            const sessions = await SessionDiscovery.discover(source);

            if (sessions.length === 0) {
                vscode.window.showWarningMessage(`ACE Exporter: No ${sourcePick.label} session logs found.`);
                return;
            }

            const sessionPick = await vscode.window.showQuickPick(
                sessions.map(s => ({ label: s.label, description: s.description, filePath: s.filePath })),
                { placeHolder: `Select a ${sourcePick.label} session to export`, title: 'ACE Exporter' }
            );
            if (!sessionPick) { return; }
            sessionFilePath = sessionPick.filePath;

            const modePick = await vscode.window.showQuickPick(
                [
                    { label: 'Clean', description: 'User & AI messages only', value: 'clean' as ExportMode },
                    { label: 'Audit', description: 'Full history including tool calls, commentary', value: 'audit' as ExportMode }
                ],
                { placeHolder: 'Select export mode', title: 'ACE Exporter' }
            );
            if (!modePick) { return; }
            mode = modePick.value;
        }

        outputChannel.appendLine(`Parsing: ${sessionFilePath} [${mode}]`);

        const messages = await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'ACE Exporter',
            cancellable: false
        }, async (progress) => {
            progress.report({ message: 'Parsing session...' });
            const adapter = source === 'codex'
                ? new CodexAdapter()
                : source === 'kiro'
                    ? new KiroAdapter()
                    : new ClaudeAdapter();
            let lastPercent = 0;
            return adapter.parse(sessionFilePath, mode, (percent) => {
                progress.report({ increment: percent - lastPercent, message: `${percent}%` });
                lastPercent = percent;
            });
        });

        if (messages.length === 0) {
            vscode.window.showInformationMessage('ACE Exporter: No messages found in selected session.');
            return;
        }

        const base = path.basename(sessionFilePath, '.jsonl');
        let sessionId = base;
        const match = base.match(/rollout-[\d-T]+-(.+)/);
        if (match?.[1]) { sessionId = match[1]; }

        const markdownContent = MarkdownFormatter.format(messages, source, sessionId, mode);
        const filename = buildFilename(source, sessionId);

        await saveOrOpenMarkdown(filename, markdownContent);

        outputChannel.appendLine(`Export complete: ${filename} (${messages.length} messages)`);
        statusBarItem.text = `$(export) ACE ✓`;
        setTimeout(() => { statusBarItem.text = '$(export) ACE'; }, 3000);

    } catch (err: any) {
        outputChannel.appendLine(`Error: ${err.message}`);
        vscode.window.showErrorMessage(`ACE Exporter Error: ${err.message}`);
    }
}

async function saveOrOpenMarkdown(filename: string, content: string) {
    const config = vscode.workspace.getConfiguration('aceExporter');
    const autoSave = config.get<boolean>('autoSave', false);
    const outputFolder = config.get<string>('outputFolder', '').trim();

    if (autoSave && outputFolder) {
        const fullPath = path.join(outputFolder, filename);
        fs.mkdirSync(outputFolder, { recursive: true });
        fs.writeFileSync(fullPath, content, 'utf8');
        const uri = vscode.Uri.file(fullPath);
        await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(uri));
        vscode.window.showInformationMessage(`ACE Exporter: Saved to ${fullPath}`);
    } else {
        const uri = vscode.Uri.parse(`untitled:${filename}`);
        const doc = await vscode.workspace.openTextDocument(uri);
        const editor = await vscode.window.showTextDocument(doc);
        await editor.edit(b => b.insert(new vscode.Position(0, 0), content));
        vscode.window.showInformationMessage(`ACE Exporter: Opened as untitled tab. Press Ctrl+S to save.`);
    }
}

async function openOutputFolder() {
    const config = vscode.workspace.getConfiguration('aceExporter');
    const outputFolder = config.get<string>('outputFolder', '').trim();
    if (!outputFolder) {
        vscode.window.showWarningMessage('ACE Exporter: No output folder configured. Set aceExporter.outputFolder in settings.');
        return;
    }
    if (!fs.existsSync(outputFolder)) {
        vscode.window.showWarningMessage(`ACE Exporter: Output folder does not exist: ${outputFolder}`);
        return;
    }
    vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(outputFolder));
}

function showStatus() {
    const config = vscode.workspace.getConfiguration('aceExporter');
    const source = config.get<string>('defaultSource', 'claude');
    const mode = config.get<string>('defaultMode', 'clean');
    const limit = config.get<number>('sessionLimit', 50);
    const folder = config.get<string>('outputFolder', '') || '(untitled tab)';
    const autoSave = config.get<boolean>('autoSave', false);
    outputChannel.appendLine(`--- ACE Exporter Status ---`);
    outputChannel.appendLine(`Default source: ${source}`);
    outputChannel.appendLine(`Default mode:   ${mode}`);
    outputChannel.appendLine(`Session limit:  ${limit}`);
    outputChannel.appendLine(`Output folder:  ${folder}`);
    outputChannel.appendLine(`Auto-save:      ${autoSave}`);
    outputChannel.show(true);
}

function buildFilename(source: ChatSource, sessionId: string): string {
    const now = new Date();
    const d = now.toISOString().slice(0, 10).replace(/-/g, '');
    const t = now.toTimeString().slice(0, 8).replace(/:/g, '');
    const src = source.charAt(0).toUpperCase() + source.slice(1);
    return `${src}_${sessionId}_${d}_${t}.md`;
}

export function deactivate() {}
