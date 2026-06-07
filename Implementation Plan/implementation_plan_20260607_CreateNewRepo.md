# Implementation Plan: Create stand-alone Git repository for ace-exporter

## 1. Đề bài (Task Description)
- Tạo một Git repository (kho lưu trữ mã nguồn Git) độc lập cho dự án `ace-exporter` tại thư mục `c:\Users\vu.hoang\.gemini\antigravity\scratch\ace-exporter`.
- Đẩy (push) dự án lên một repo mới trên GitHub.

## 2. Hiện trạng (Current State)
- Thư mục dự án: `c:\Users\vu.hoang\.gemini\antigravity\scratch\ace-exporter`
- Hiện tại, dự án này nằm trong thư mục con `scratch/` của repo lớn `C:\Users\vu.hoang\.gemini\antigravity` (GitHub: `vuhoang2708/antigravity-sync-data`).
- Thư mục `scratch/ace-exporter` đang bị ignore (bỏ qua) bởi repo lớn (ngoại trừ một số file tài liệu vừa được add thủ công bằng tùy chọn `-f`).
- Chưa có file `.gitignore` cục bộ cho riêng dự án `ace-exporter`.

## 3. Giải pháp kỹ thuật (Technical Solution)
- **Bước 1**: Tạo file `.gitignore` tại thư mục gốc của `ace-exporter` để loại trừ các file build/dependencies:
  ```text
  node_modules/
  out/
  scratch_test_output/
  .DS_Store
  *.log
  ```
- **Bước 2**: Khởi tạo Git độc lập trong thư mục `ace-exporter`:
  - Thực hiện lệnh `git init -b main`.
- **Bước 3**: Commit các file hiện tại:
  - Chạy `git add .` và `git commit -m "initial commit: ace-exporter standalone project"`.
- **Bước 4**: Tạo Repo mới trên GitHub bằng GitHub CLI `gh`:
  - Kiểm tra trạng thái đăng nhập: `gh auth status`.
  - Tạo repo mới trên GitHub (public hoặc private theo mong muốn của người dùng):
    `gh repo create ace-exporter --public --source=. --remote=origin --push`
- **Bước 5** (Tùy chọn): Nếu cần thiết, dọn dẹp các file tài liệu đã force-add ở repo cha để tránh trùng lặp dữ liệu theo dõi.

## 4. Các file bị ảnh hưởng (Impacted Files)
- **Tạo mới**: `c:\Users\vu.hoang\.gemini\antigravity\scratch\ace-exporter\.gitignore`
- **Tạo mới kế hoạch**: `c:\Users\vu.hoang\.gemini\antigravity\scratch\ace-exporter\Implementation Plan\implementation_plan_20260607_CreateNewRepo.md`
- **Thay đổi hệ thống**: Thư mục ẩn `.git/` sẽ được khởi tạo trong `ace-exporter`.

## 5. Rủi ro tiềm ẩn & Lưu ý (Risks & Notes)
- **Nested Git Repositories** (Kho Git lồng nhau): Việc tạo repo mới sẽ khiến nó thành một repo Git lồng nhau. Tuy nhiên, do repo cha đã cấu hình ignore thư mục này, repo cha sẽ không tự động tracking các file bên trong nó, tránh xung đột.
- Cần sử dụng đường dẫn tuyệt đối của công cụ `gh` tại `C:\Users\vu.hoang\.gemini\antigravity\scratch\tools\gh\bin\gh.exe`.
- Cần sự xác nhận của người dùng về việc repo mới trên GitHub sẽ để ở chế độ **Public** (công khai) hay **Private** (riêng tư).

## 6. Auditor Review (Codex/Claude Reviewer)
- Xác nhận các file bị loại trừ trong `.gitignore` là đầy đủ và chính xác.
- Đảm bảo repo mới được liên kết đúng tài khoản GitHub của User.
