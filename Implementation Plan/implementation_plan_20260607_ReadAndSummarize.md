# Implementation Plan: Read and Summarize ACE Exporter

## 1. Đề bài (Task Description)
- Đọc tất cả tài liệu và tổng hợp thông tin về dự án ACE Exporter.
- Giải thích cấu trúc thư mục, chức năng của từng file, cơ chế hoạt động, các cấu hình mặc định (default configurations), các adapter hỗ trợ (Claude, Codex, Kiro), các chế độ xuất (Clean vs Audit), định dạng đầu ra (Markdown), và các bài test tích hợp (Integration Tests).

## 2. Hiện trạng (Current State)
- Workspace: `c:\Users\vu.hoang\.gemini\antigravity\scratch\ace-exporter`
- Dự án là một VS Code Extension (`ace-exporter` - Antigravity Chat Exporter) viết bằng TypeScript.
- Chưa có tài liệu hướng dẫn sử dụng hay giải thích kiến trúc chi tiết (như README.md hay ARCHITECTURE.md).
- Toàn bộ codebase đã được đọc và phân tích thành công bởi Agent (đọc các file: `package.json`, `tsconfig.json`, `esbuild.js`, `src/extension.ts`, `src/types/index.ts`, `src/adapters/*`, `src/services/*`, `src/test-run.ts`).

## 3. Giải pháp kỹ thuật (Technical Solution)
- Viết một báo cáo tổng hợp chi tiết và trực quan dưới định dạng Markdown, lưu tại đường dẫn repo-visible: `c:\Users\vu.hoang\.gemini\antigravity\scratch\ace-exporter\Artifacts\ace_exporter_summary.md` để người dùng tiện tham khảo lâu dài.
- Nội dung báo cáo sẽ bao gồm:
  - **Giới thiệu tổng quan**: Tên, mô tả, chức năng chính của extension.
  - **Kiến trúc hệ thống**: Sơ đồ Mermaid biểu diễn luồng dữ liệu (Data flow) từ các session logs đến file Markdown đầu ra.
  - **Cấu trúc thư mục chi tiết**: Giải thích vai trò của từng file và thư mục.
  - **Phân tích chi tiết các Adapter**:
    - `ClaudeAdapter`: Parser cho Claude Code session logs (đọc từ file JSONL, xử lý `tool_use`, `tool_result`).
    - `CodexAdapter`: Parser cho OpenAI Codex session logs (đọc từ file JSONL, xử lý `response_item`, `function_call`, `function_call_output`, `commentary`).
    - `KiroAdapter`: Parser cho AWS Kiro session logs (xử lý cấu trúc envelope tương tự Claude Code hoặc định dạng phẳng).
  - **Chế độ xuất dữ liệu**:
    - `Clean` (Chỉ xuất tin nhắn của User & Assistant).
    - `Audit` (Xuất đầy đủ tin nhắn, bao gồm cả Developer messages, Tool calls và Commentary).
  - **Cấu hình & Settings**: Liệt kê chi tiết các cài đặt trong `package.json` (`defaultSource`, `defaultMode`, `sessionLimit`, `outputFolder`, `autoSave`, `toolOutputMaxChars`).
  - **Tích hợp & Kiểm thử**: Giải thích cơ chế test trong `src/test-run.ts`.

## 4. Các file bị ảnh hưởng (Impacted Files)
- **Tạo mới**: `c:\Users\vu.hoang\.gemini\antigravity\scratch\ace-exporter\Artifacts\ace_exporter_summary.md` (Lưu báo cáo tổng hợp dự án).
- **Tạo mới kế hoạch**: `c:\Users\vu.hoang\.gemini\antigravity\scratch\ace-exporter\Implementation Plan\implementation_plan_20260607_ReadAndSummarize.md` (Bản sao kế hoạch lưu trong project).

## 5. Rủi ro tiềm ẩn & Lưu ý (Risks & Notes)
- Dự án không thay đổi logic code hay cấu hình hệ thống nên không có rủi ro làm hỏng extension.
- Cần tuân thủ quy tắc song ngữ giải thích thuật ngữ tiếng Anh lần đầu xuất hiện trong báo cáo gửi người dùng.

## 6. Auditor Review (Codex/Claude Reviewer)
- Xem xét tính chính xác của tài liệu so với mã nguồn thực tế.
- Đảm bảo tuân thủ cấu trúc thư mục chuẩn và các quy tắc của repo.
