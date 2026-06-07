# Implementation Plan: Create Interactive AI Sessions Dashboard

## 1. Đề bài (Task Description)
- Tạo một trang `dashboard` bằng HTML để thống kê, tìm kiếm (cơ bản và nâng cao/chuyên sâu), và sắp xếp toàn bộ 167 cuộc hội thoại đã được xuất ra trong thư mục `recent_exports/`.

## 2. Hiện trạng (Current State)
- Thư mục dự án: `c:\Users\vu.hoang\.gemini\antigravity\scratch\ace-exporter`
- Hiện tại, 167 file Markdown nằm rời rạc trong thư mục `scratch_test_output/recent_exports/`. Người dùng phải mở từng file thủ công, không có công cụ xem tổng quát, lọc hay tìm kiếm chéo nội dung.

## 3. Giải pháp kỹ thuật (Technical Solution)

### 3.1. Viết script tổng hợp dữ liệu (`src/generate-dashboard.ts`)
- Quét đệ quy tất cả các file `.md` trong `scratch_test_output/recent_exports/`.
- Với mỗi file, parse (phân tích) nội dung Markdown để lấy:
  - **Metadata**: AI Source (Claude/Codex), Session ID, Export Date, Export Mode (Clean/Audit), Message count (Số lượng tin nhắn User/Assistant), dung lượng file.
  - **Nội dung**: Trích xuất phần text (văn bản) hội thoại đầy đủ (để tìm kiếm chuyên sâu) và đoạn xem trước (preview snippet).
- Biên dịch toàn bộ dữ liệu này thành một mảng đối tượng JSON.
- Đọc file template (hoặc ghi trực tiếp) để chèn mảng JSON này vào biến JavaScript toàn cục của file HTML `dashboard.html`.

### 3.2. Thiết kế giao diện Dashboard (`recent_exports_dashboard.html`)
- **Aesthetics (Thẩm mỹ cao cấp)**: Giao diện tối hiện đại (Cyberpunk/Dark mode) với dải màu tím neon, xanh neon, kính mờ (glassmorphism), và các hiệu ứng chuyển động mượt mà.
- **Tính năng sắp xếp (Sorting)**:
  - Sắp xếp theo Thời gian xuất (mới nhất/cũ nhất).
  - Sắp xếp theo Dung lượng file hoặc Số lượng tin nhắn.
  - Sắp xếp theo Nguồn AI (Claude vs Codex).
- **Tính năng tìm kiếm (Search)**:
  - **Cơ bản**: Tìm nhanh theo tên file, session ID.
  - **Chuyên sâu**:
    - Tìm kiếm toàn văn (Full-text search) trong nội dung chi tiết của hội thoại.
    - Tìm kiếm theo biểu thức chính quy (Regex search).
    - Tìm kiếm phân biệt chữ hoa/thường (Case-sensitive toggle).
    - Lọc theo nguồn AI (Claude/Codex), chế độ (Clean/Audit).
    - Bộ lọc phạm vi (giới hạn số tin nhắn, khoảng ngày xuất).
- **Trình xem nội dung tích hợp (In-app viewer)**: Bấm vào mỗi card sẽ mở ra một cửa sổ đọc nội dung Markdown ngay trên trang dashboard (tự động highlight từ khóa tìm kiếm).

## 4. Các file bị ảnh hưởng (Impacted Files)
- **Tạo mới**: `c:\Users\vu.hoang\.gemini\antigravity\scratch\ace-exporter\src\generate-dashboard.ts`
- **Tạo mới**: `c:\Users\vu.hoang\.gemini\antigravity\scratch\ace-exporter\recent_exports_dashboard.html`
- **Tạo mới kế hoạch**: `c:\Users\vu.hoang\.gemini\antigravity\scratch\ace-exporter\Implementation Plan\implementation_plan_20260607_CreateDashboard.md`

## 5. Rủi ro tiềm ẩn & Lưu ý (Risks & Notes)
- File HTML dashboard sẽ chứa dữ liệu JSON tích hợp của 167 session nên dung lượng có thể đạt vài MB. Việc tìm kiếm cần được tối ưu hóa bằng JavaScript (debounce và regex compile an toàn) để không làm đơ trình duyệt.
- Cần thực hiện UAT bằng browser để kiểm tra tính năng tìm kiếm nâng cao hoạt động đúng.

## 6. Auditor Review (Codex/Claude Reviewer)
- Xem xét cấu trúc trích xuất nội dung từ Markdown.
- Kiểm tra tính bảo mật của biểu thức chính quy nhập từ người dùng (Regex ReDoS protection).
