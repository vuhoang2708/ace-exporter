# ⚡ ACE Exporter (Antigravity Chat Exporter)

[![VS Code Extension](https://img.shields.io/badge/VS%20Code-Extension-blue.svg)](https://marketplace.visualstudio.com/)
[![GitHub license](https://img.shields.io/github/license/vuhoang2708/ace-exporter)](https://github.com/vuhoang2708/ace-exporter/blob/main/LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/vuhoang2708/ace-exporter)](https://github.com/vuhoang2708/ace-exporter/stargazers)

**ACE Exporter** is a VS Code extension designed to export chat session logs from AI programming assistants (**Anthropic Claude**, **OpenAI Codex**, and **AWS Kiro**) to clean, readable Markdown documents.

**ACE Exporter** là một phần mở rộng dành cho VS Code giúp xuất nhật ký hội thoại (session logs) từ các trợ lý lập trình AI (**Anthropic Claude**, **OpenAI Codex**, và **AWS Kiro**) sang định dạng Markdown sạch sẽ, trực quan và dễ đọc.

---

## 🚀 Key Features (Tính năng nổi bật)

- **Multi-Source Discovery (Tự động quét nguồn)**: Scans default system log folders for Claude Code, Codex, and Kiro automatically.
- **Dual Export Modes (Chế độ xuất kép)**:
  - **Clean Mode (Chế độ tối giản)**: Keeps only the core User and Assistant conversation messages.
  - **Audit Mode (Chế độ kiểm toán)**: Retains full history including Developer/System system prompts, tool calls (arguments, outputs), and AI internal commentary.
- **Smart Truncation (Rút gọn thông minh)**: Automatically truncates long tool outputs to keep Markdown files clean and readable.
- **Auto-Save & Untitled Tab (Tự động lưu & Mở tab)**: Save files directly to a designated folder or open them instantly in a VS Code editor tab.

---

## 🛠 Installation (Hướng dẫn cài đặt)

1. Clone or download this project.
2. Build the extension package:
   ```bash
   npm install
   npm run compile
   npm run bundle
   ```
3. Run or debug in VS Code by pressing `F5` (opens a new VS Code window with the extension loaded).

---

## ⌨ VS Code Commands & Shortcuts (Các lệnh & Phím tắt)

Open the **Command Palette** (`Ctrl+Shift+P` / `Cmd+Shift+P`) and type:

- `Export Chat Session...` (`ace.exportChat`): Select AI source, choose session, and choose mode.
- `Export Latest Session (Quick)` (`ace.exportLatest`): Instantly exports the latest session of your default source using default settings.
- `Open Output Folder` (`ace.openOutputFolder`): Opens the directory configured in `aceExporter.outputFolder`.
- `Show Status` (`ace.showStatus`): Displays current settings in the ACE Exporter Output Channel.

---

## ⚙ Configurations (Cấu hình chi tiết)

Go to **VS Code Settings** (`Ctrl+,`) and search for `ACE Exporter`:

| Config Option | Type | Default | Description |
|---|---|---|---|
| `aceExporter.defaultSource` | `string` | `"claude"` | Default source pre-selected for quick export (`claude`, `codex`, `kiro`). |
| `aceExporter.defaultMode` | `string` | `"clean"` | Default export mode (`clean` or `audit`). |
| `aceExporter.sessionLimit` | `number` | `50` | Maximum number of sessions to list. |
| `aceExporter.outputFolder` | `string` | `""` | Folder to save files. Leave blank to open in a new tab. |
| `aceExporter.autoSave` | `boolean` | `false` | Enable to auto-save files directly to output folder. |
| `aceExporter.toolOutputMaxChars`| `number`| `2000` | Max characters of tool output to include in Audit mode. |

---

## 🧪 Development & Testing (Phát triển & Kiểm thử)

You can run integration tests outside VS Code by executing:
```bash
npm run compile
node out/test-run.js
```
This runs the parsers on local logs and outputs sample Markdown files in the `scratch_test_output/` folder.

---

## 📄 License (Bản quyền)

MIT © [vuhoang2708](https://github.com/vuhoang2708)
