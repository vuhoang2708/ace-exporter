# Implementation Plan: Create README.md and Premium HTML User Guide

## 1. Đề bài (Task Description)
- Tạo file tài liệu `README.md` giới thiệu dự án dưới dạng chuẩn GitHub Markdown.
- Tạo file hướng dẫn sử dụng HTML (`huong_dan_su_dung.html`) với thiết kế thẩm mỹ cao (Premium UI/UX design) giới thiệu cách cài đặt, cấu hình, phím tắt và hướng dẫn sử dụng chi tiết cho người dùng cuối.

## 2. Hiện trạng (Current State)
- Thư mục dự án: `c:\Users\vu.hoang\.gemini\antigravity\scratch\ace-exporter`
- Hiện tại chưa có file `README.md` tại thư mục gốc, gây khó khăn cho việc đọc thông tin trực tiếp trên GitHub.
- Chưa có tài liệu hướng dẫn sử dụng trực quan dạng HTML cho người dùng đầu cuối.

## 3. Giải pháp kỹ thuật (Technical Solution)

### 3.1. Tạo file `README.md`
- Viết file `README.md` chuẩn tiếng Anh & tiếng Việt giới thiệu:
  - Tên dự án, logo/emoji, mô tả ngắn gọn.
  - Các tính năng chính (Features).
  - Hướng dẫn cài đặt nhanh (Quick Start).
  - Các chế độ xuất (Export Modes) và cấu hình cài đặt (Settings).
  - Tuyên bố bản quyền & đóng góp.

### 3.2. Thiết kế file `huong_dan_su_dung.html` (Hướng dẫn sử dụng cao cấp)
Triển khai giao diện web hiện đại với cấu trúc sau:
- **Công nghệ**: HTML5, Vanilla CSS3 (không dùng thư viện ngoài ngoại trừ Google Fonts và FontAwesome icon), JavaScript thuần.
- **Phong cách thiết kế (Aesthetics)**:
  - Sleek Dark Theme (Chủ đề tối huyền ảo) với dải màu HSL tùy chỉnh (Deep blue, Neon purple, Glassmorphism).
  - Typography: Sử dụng font `Outfit` và `Inter` từ Google Fonts.
  - Hiệu ứng chuyển động (Micro-animations): Các nút bấm có hiệu ứng hover mịn màng, thanh tiến trình động, và hiệu ứng nhấp nháy neon tinh tế.
- **Tính năng tương tác (Interactive Features)**:
  - **Sidebar navigation**: Điều hướng nhanh giữa các chương mục (Tổng quan, Cài đặt, Lệnh VS Code, Cấu hình, Khắc phục lỗi).
  - **Live Configuration Generator** (Bộ tạo cấu hình trực quan): Cho phép người dùng tick chọn các setting (mặc định nguồn, chế độ lưu, giới hạn session...) và tự động render mã cấu hình `settings.json` tương ứng để copy trực tiếp vào VS Code.
  - **Interactive Terminal**: Code block có nút sao chép thông minh (hiển thị "Copied! ✓" khi bấm).
  - **Interactive Session Simulator** (Mô phỏng bộ lọc): Cho phép click đổi tab giữa chế độ `Clean` (chỉ hiện User/Assistant) và `Audit` (hiện thêm Tool Call, Commentary) để người dùng thấy trực quan sự khác biệt của dữ liệu đầu ra.

## 4. Các file bị ảnh hưởng (Impacted Files)
- **Tạo mới**: `c:\Users\vu.hoang\.gemini\antigravity\scratch\ace-exporter\README.md`
- **Tạo mới**: `c:\Users\vu.hoang\.gemini\antigravity\scratch\ace-exporter\huong_dan_su_dung.html`
- **Tạo mới kế hoạch**: `c:\Users\vu.hoang\.gemini\antigravity\scratch\ace-exporter\Implementation Plan\implementation_plan_20260607_CreateDocs.md`

## 5. Rủi ro tiềm ẩn & Lưu ý (Risks & Notes)
- Đảm bảo tính tương thích và phản hồi (responsive layout) của giao diện hướng dẫn trên cả máy tính lẫn thiết bị di động.
- Không thay đổi mã nguồn logic của VS Code Extension, không có rủi ro làm hỏng chương trình.

## 6. Auditor Review (Codex/Claude Reviewer)
- Xem xét tính đầy đủ của tài liệu cài đặt.
- Kiểm tra tính đúng đắn của các cấu hình phím tắt và cài đặt VS Code.
