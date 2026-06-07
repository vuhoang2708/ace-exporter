# Implementation Plan: Hybrid Git Push & Vercel Deploy (Dashboard & Guide)

## 1. Đề bài (Task Description)
- Đẩy mã nguồn an toàn lên GitHub repository `vuhoang2708/ace-exporter` trên nhánh `main` (không đẩy file dashboard 30MB).
- Triển khai toàn bộ dự án lên Vercel, **bao gồm cả Dashboard** (`recent_exports_dashboard.html`) và Hướng dẫn sử dụng (`huong_dan_su_dung.html`).

## 2. Hiện trạng (Current State)
- File `recent_exports_dashboard.html` (30MB) chứa toàn bộ log hội thoại hiện đang bị ignore trong `.gitignore`.
- Nếu không có cấu hình đặc biệt, Vercel CLI sẽ tự động đọc `.gitignore` và bỏ qua file dashboard này khi deploy.
- Cần giải pháp kết hợp để **chặn đẩy lên GitHub (public) nhưng vẫn cho phép đẩy lên Vercel (để có link truy cập online)**.

## 3. Giải pháp kỹ thuật (Technical Solution)

### 3.1. Giải pháp Hybrid Ignore (Bỏ qua lai)
- **Git (`.gitignore`)**: Tiếp tục ignore `recent_exports_dashboard.html` để file này **không bao giờ bị đẩy lên GitHub public**, tránh rò rỉ dữ liệu lịch sử hội thoại lên public repo.
- **Vercel (`.vercelignore`)**: Tạo file `.vercelignore` để ghi đè cấu hình bỏ qua của Vercel. 
  - Trong `.vercelignore`, chúng ta chỉ liệt kê:
    ```
    node_modules/
    out/
    scratch_test_output/
    .DS_Store
    *.log
    ```
  - Vì `recent_exports_dashboard.html` **không nằm trong `.vercelignore`**, Vercel CLI sẽ tải tệp tin này lên máy chủ Vercel bình thường khi deploy.

### 3.2. Cấu hình định tuyến Vercel (`vercel.json`)
Cấu hình định tuyến động cho link Vercel:
- Truy cập trang chủ `/` -> Mở Dashboard (`recent_exports_dashboard.html`).
- Truy cập `/guide` -> Mở Hướng dẫn sử dụng (`huong_dan_su_dung.html`).
```json
{
  "cleanUrls": true,
  "rewrites": [
    { "source": "/", "destination": "/recent_exports_dashboard.html" },
    { "source": "/guide", "destination": "/huong_dan_su_dung.html" }
  ]
}
```

### 3.3. Thực thi triển khai
1. Tạo file `.vercelignore` và `vercel.json` trong dự án.
2. Kiểm tra `git status` để xác nhận file dashboard vẫn bị Git ignore.
3. Thực hiện `git add`, `git commit` và `git push origin main` để cập nhật code sạch lên GitHub.
4. Chạy lệnh `vercel --prod --yes` bằng Vercel CLI để deploy cả dashboard và user guide lên Vercel.
5. Kiểm chứng (UAT) bằng browser để truy cập live URL.

## 4. Các file bị ảnh hưởng (Impacted Files)
- **Tạo mới**: `c:\Users\vu.hoang\.gemini\antigravity\scratch\ace-exporter\vercel.json`
- **Tạo mới**: `c:\Users\vu.hoang\.gemini\antigravity\scratch\ace-exporter\.vercelignore`
- **Sửa đổi**: `c:\Users\vu.hoang\.gemini\antigravity\scratch\ace-exporter\.gitignore`
- **Cập nhật kế hoạch**: `c:\Users\vu.hoang\.gemini\antigravity\scratch\ace-exporter\Implementation Plan\implementation_plan_20260607_PushAndDeploy.md`

## 5. Rủi ro tiềm ẩn & Lưu ý (Risks & Notes)
- **Bảo mật**: Triển khai dashboard chứa hội thoại cá nhân lên Vercel sẽ sinh ra một link public (mặc dù URL ngẫu nhiên hoặc theo tên project). Bất kỳ ai có link này đều có thể xem và tìm kiếm hội thoại của anh. Nếu muốn bảo mật hơn trong tương lai, cần tích hợp xác thực mật khẩu.
- **Dung lượng**: Tệp tin dashboard 30MB nằm trong giới hạn cho phép (100MB) của Vercel đối với static file nên việc deploy sẽ diễn ra thành công.

## 6. Auditor Review (Codex/Claude Reviewer)
- Đảm bảo `.vercelignore` được cấu hình chính xác và không kế thừa `.gitignore`.
- Kiểm tra các rewrite rules trong `vercel.json`.
