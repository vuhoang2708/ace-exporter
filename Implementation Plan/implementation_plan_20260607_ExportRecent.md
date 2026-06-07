# Implementation Plan: Export Recent Claude and Codex Conversations

## 1. Đề bài (Task Description)
- Viết script chạy thử nghiệm: Xuất toàn bộ cuộc hội thoại của Claude (Claude Code) và OpenAI Codex có thời gian cập nhật trong vòng 1 tuần gần đây (7 ngày qua).

## 2. Hiện trạng (Current State)
- Thư mục dự án: `c:\Users\vu.hoang\.gemini\antigravity\scratch\ace-exporter`
- Tập tin `src/test-run.ts` chỉ thực hiện chạy thử (test run) trên session đầu tiên tìm thấy của mỗi nguồn, không có tính năng lọc theo thời gian hoặc xuất hàng loạt (bulk export).
- Các dịch vụ quét file và định dạng (`SessionDiscovery`, `MarkdownFormatter`) sử dụng API `vscode` trực tiếp, do đó sẽ bị lỗi `Cannot find module 'vscode'` khi chạy độc lập qua Node.js ở terminal.

## 3. Giải pháp kỹ thuật (Technical Solution)
- **Bước 1**: Tạo một script chạy độc lập mới: `src/export-recent.ts`.
- **Bước 2**: Trong script, cài đặt cơ chế giả lập (mocking) mô-đun `vscode` bằng cách can thiệp vào bộ nạp mô-đun CommonJS của Node (`Module.prototype.require`). Điều này cho phép `SessionDiscovery` và `MarkdownFormatter` chạy bình thường ngoài môi trường VS Code.
- **Bước 3**: Gọi `SessionDiscovery.discover('claude')` và `SessionDiscovery.discover('codex')` để lấy toàn bộ các session.
- **Bước 4**: Lọc các session có thời gian sửa đổi (`mtime`) trong vòng 7 ngày qua:
  `stat.mtimeMs >= Date.now() - 7 * 24 * 60 * 60 * 1000`
- **Bước 5**: Với mỗi session thỏa mãn điều kiện, sử dụng `ClaudeAdapter` hoặc `CodexAdapter` để phân tích (parse) và xuất ra file Markdown tương ứng ở cả hai chế độ `clean` và `audit`.
- **Bước 6**: Lưu các file kết quả vào thư mục `scratch_test_output/recent_exports/`.

## 4. Các file bị ảnh hưởng (Impacted Files)
- **Tạo mới**: `c:\Users\vu.hoang\.gemini\antigravity\scratch\ace-exporter\src\export-recent.ts`
- **Tạo mới kế hoạch**: `c:\Users\vu.hoang\.gemini\antigravity\scratch\ace-exporter\Implementation Plan\implementation_plan_20260607_ExportRecent.md`
- **Tạo mới thư mục kết quả**: `c:\Users\vu.hoang\.gemini\antigravity\scratch\ace-exporter\scratch_test_output\recent_exports\`

## 5. Rủi ro tiềm ẩn & Lưu ý (Risks & Notes)
- Nếu số lượng log quá lớn, thời gian chạy có thể mất vài giây.
- Sau khi chạy, ta cần sử dụng trình duyệt hoặc lệnh hệ thống để xác minh sự tồn tại của các tệp xuất ra.

## 6. Auditor Review (Codex/Claude Reviewer)
- Kiểm tra logic tính toán mốc thời gian 7 ngày.
- Xác nhận cơ chế mock `vscode` hoạt động không xung đột với các lệnh chạy thật của extension.
