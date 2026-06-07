# ⚡ Báo cáo tổng hợp dự án ACE Exporter

Tài liệu này tổng hợp toàn bộ kiến thức, cấu trúc, thiết kế kỹ thuật và cơ chế hoạt động của dự án **ACE Exporter** (Antigravity Chat Exporter - Công cụ xuất nhật ký hội thoại Antigravity).

---

## 1. Giới thiệu tổng quan (Overview)

**ACE Exporter** là một `VS Code Extension` (phần mở rộng dành cho trình soạn thảo Visual Studio Code) được viết bằng ngôn ngữ `TypeScript`.

- **Mục tiêu chính**: Hỗ trợ nhà phát triển xuất các `session log` (nhật ký phiên làm việc) từ các trợ lý lập trình AI như **OpenAI Codex**, **Anthropic Claude** (Claude Code), và **AWS Kiro** sang định dạng `Markdown` để dễ dàng lưu trữ, chia sẻ hoặc kiểm toán.
- **Tính năng nổi bật**:
  - Tự động phát hiện các tập tin log nằm trong các thư mục hệ thống cục bộ.
  - Hỗ trợ nhiều adapter (bộ tương thích) riêng biệt cho từng nguồn log khác nhau.
  - Cung cấp hai chế độ xuất: **Clean** (chỉ giữ lại hội thoại chính) và **Audit** (giữ lại toàn bộ dữ liệu gọi công cụ, bình luận nội bộ).
  - Tích hợp tiến trình xử lý trực quan và cơ chế tự động lưu hoặc mở tab chưa lưu trên VS Code.

---

## 2. Kiến trúc & Luồng dữ liệu (Architecture & Data Flow)

Dưới đây là sơ đồ `data flow` (luồng dữ liệu) mô tả cách thức hoạt động khi người dùng kích hoạt lệnh xuất log của ACE Exporter:

```mermaid
graph TD
    User([Người dùng kích hoạt lệnh]) --> |ace.exportChat / ace.exportLatest| Extension[Extension Activation - extension.ts]
    Extension --> |1. Yêu cầu danh sách| Discovery[SessionDiscovery - SessionDiscovery.ts]
    Discovery --> |Quét thư mục cục bộ| LocalFiles[(Thư mục .claude, .codex, .kiro)]
    LocalFiles --> |Trả về danh sách file| Discovery
    Discovery --> |Hiển thị danh sách chọn| Extension
    
    Extension --> |2. Chọn file & chế độ xuất| User
    User --> |Chọn Clean hoặc Audit| Extension
    
    Extension --> |3. Gọi adapter phù hợp| Parser{Adapter Selector}
    Parser --> |Nguồn: claude| Claude[ClaudeAdapter.ts]
    Parser --> |Nguồn: codex| Codex[CodexAdapter.ts]
    Parser --> |Nguồn: kiro| Kiro[KiroAdapter.ts]
    
    Claude & Codex & Kiro --> |Phân tích cú pháp JSON/JSONL| MsgList[Mảng thông điệp - Message[]]
    MsgList --> |4. Định dạng Markdown| Formatter[MarkdownFormatter - MarkdownFormatter.ts]
    Formatter --> |Trả về chuỗi Markdown hoàn chỉnh| Extension
    
    Extension --> |5. Lưu trữ hoặc hiển thị| Output{Auto Save?}
    Output --> |True & Có outputFolder| SaveFile[Lưu trực tiếp vào ổ đĩa]
    Output --> |False / Không cấu hình| OpenTab[Mở tab untitled mới trên VS Code]
```

---

## 3. Cấu trúc thư mục dự án (Project Directory Structure)

Dự án được tổ chức gọn gàng và modular (chia nhỏ thành các khối độc lập):

```text
ace-exporter/
├── .vscode/
│   └── launch.json            # Cấu hình gỡ lỗi (debugging) để chạy extension host test
├── out/                       # Thư mục chứa mã nguồn JavaScript sau khi biên dịch
├── scratch_test_output/       # Thư mục lưu kết quả chạy thử của integration tests
├── src/                       # Thư mục mã nguồn chính (TypeScript)
│   ├── adapters/              # Chứa các bộ phân tích cú pháp cho từng nguồn log cụ thể
│   │   ├── ClaudeAdapter.ts   # Adapter xử lý log của Claude Code
│   │   ├── CodexAdapter.ts    # Adapter xử lý log của OpenAI Codex
│   │   └── KiroAdapter.ts     # Adapter xử lý log của AWS Kiro
│   ├── services/              # Các dịch vụ xử lý logic dùng chung
│   │   ├── MarkdownFormatter.ts # Chuyển đổi dữ liệu tin nhắn đã parse sang Markdown
│   │   └── SessionDiscovery.ts  # Tự động quét và phát hiện file log trong hệ thống
│   ├── types/                 # Định nghĩa các cấu trúc dữ liệu dùng chung
│   │   └── index.ts           # Chứa Type & Interface định hình hệ thống
│   ├── extension.ts           # Điểm khởi đầu (entry point) đăng ký các lệnh VS Code
│   └── test-run.ts            # Script chạy test tích hợp trực tiếp trên Node.js
├── esbuild.js                 # Cấu hình đóng gói (bundling) extension bằng esbuild
├── package.json               # Khai báo metadata, lệnh kích hoạt và settings của extension
├── tsconfig.json              # Cấu hình biên dịch TypeScript
└── package-lock.json          # Quản lý phiên bản chi tiết của các dependency
```

---

## 4. Chi tiết các tệp nguồn & Chức năng (File-by-File Details)

### 4.1. Khai báo kiểu dữ liệu: `src/types/index.ts`
Chứa các `interface` (giao diện khai báo cấu trúc dữ liệu chuẩn) cốt lõi của hệ thống:
- `ExportMode`: Định nghĩa chế độ xuất, chỉ nhận giá trị `'clean'` hoặc `'audit'`.
- `ChatSource`: Các nguồn log được hỗ trợ: `'codex' | 'claude' | 'kiro'`.
- `SessionFile`: Cấu trúc lưu thông tin file log được tìm thấy bao gồm `filePath`, `label`, `description`, `mtime` (thời gian sửa đổi cuối), và `size` (kích thước file).
- `ToolCall`: Cấu trúc mô tả một lượt gọi tool từ AI trợ lý, bao gồm `callId`, `name` (tên công cụ), `arguments` (tham số truyền vào), và `output` (kết quả trả về).
- `Message`: Cấu trúc lưu thông điệp chuẩn hóa sau khi parse:
  - `role`: Vai trò (`'user' | 'assistant' | 'developer' | 'system' | 'commentary'`).
  - `content`: Nội dung văn bản của thông điệp.
  - `timestamp`: Mốc thời gian phát sinh tin nhắn.
  - `toolCalls`: Mảng các lượt gọi tool (nếu có).
- `IChatParser`: Khai báo bắt buộc cho mọi Adapter phải triển khai phương thức `parse(filePath, mode, progressCallback)`.

### 4.2. Phát hiện log tự động: `src/services/SessionDiscovery.ts`
Chịu trách nhiệm quét đệ quy các thư mục lưu trữ cục bộ của các tool AI trên máy tính của người dùng:
- Đường dẫn cơ sở quét tương ứng:
  - **Codex**: `%USERPROFILE%\.codex\sessions`
  - **Claude**: `%USERPROFILE%\.claude\projects`
  - **Kiro**: `%USERPROFILE%\.kiro\sessions` và `%USERPROFILE%\.kiro\logs`
- Sử dụng phương thức đọc đệ quy đồng bộ `walkDirectory` để thu thập các tập tin có đuôi mở rộng `.json` hoặc `.jsonl`.
- Giới hạn số lượng tập tin hiển thị thông qua cấu hình cấu hình `sessionLimit` (mặc định là 50).
- Trả về danh sách được sắp xếp theo thời gian chỉnh sửa mới nhất (`mtimeMs`).

### 4.3. Các Adapter phân tích dữ liệu: `src/adapters/`

#### a. `ClaudeAdapter.ts`
- Phân tích cú pháp nhật ký của Claude Code. Nhật ký này được ghi dưới dạng `JSONL` (JSON Lines - mỗi dòng là một đối tượng JSON độc lập).
- Chỉ lọc lấy các dòng có `type` là `'user'` hoặc `'assistant'`.
- Nội dung tin nhắn của Claude nằm trong cấu trúc mảng `message.content`. Adapter sẽ lặp qua mảng này để trích xuất văn bản (`part.type === 'text'`).
- Nếu ở chế độ **Audit**:
  - Trích xuất dữ liệu gọi công cụ (`part.type === 'tool_use'`), đẩy vào bản đồ định danh `toolCallMap` và tạo tin nhắn tạm với vai trò `system`.
  - Khi gặp phản hồi kết quả (`part.type === 'tool_result'`), adapter sẽ đối chiếu theo ID để điền thêm dữ liệu đầu ra `output` vào đối tượng tool call tương ứng.

#### b. `CodexAdapter.ts`
- Phân tích cú pháp nhật ký của OpenAI Codex dưới dạng `JSONL`.
- Lọc các dòng theo `type === 'response_item'`:
  - Trích xuất vai trò (`role`) và nội dung (`payload.content`).
  - Trong chế độ **Clean**: Chỉ giữ lại vai trò `user` và `assistant`.
  - Trong chế độ **Audit**: Giữ thêm vai trò `developer`.
  - Trích xuất lượt gọi hàm (`payloadType === 'function_call'`) và đầu ra của hàm (`payloadType === 'function_call_output'`) tương tự như cơ chế của Claude Adapter thông qua ID gọi hàm `call_id`.
  - Trích xuất thêm các sự kiện ghi chú nội bộ từ hệ thống `event_msg` có pha làm việc là `commentary` (lời bình luận của AI) để đưa vào Markdown.

#### c. `KiroAdapter.ts`
- Phân tích cú pháp nhật ký của AWS Kiro.
- Kiro hỗ trợ cả phong bì dữ liệu kiểu Claude (đối tượng con `message` lồng bên trong) lẫn phong bì phẳng chứa thuộc tính `role` và `content` ở cấp cao nhất.
- Hỗ trợ trích xuất cả thông tin thời gian từ thuộc tính `timestamp` hoặc `ts`.
- Thực hiện phân tích dữ liệu gọi công cụ `tool_use`/`tool_result` tương thích khi bật chế độ **Audit**.

### 4.4. Định dạng Markdown: `src/services/MarkdownFormatter.ts`
- Tổng hợp mảng tin nhắn `Message[]` thành một tài liệu Markdown (`.md`) đẹp mắt, trực quan.
- **Tiêu đề & Bảng thông số**: Đầu trang chứa bảng tóm tắt thông tin phiên dịch bao gồm Nguồn, ID phiên làm việc, Thời điểm xuất, Chế độ xuất và số lượng tin nhắn trao đổi.
- **Biểu tượng vai trò**: Sử dụng emoji trực quan cho từng vai trò:
  - 👤 User: `## 👤 User`
  - 🤖 Assistant: `## 🤖 Assistant`
  - 🛠 Developer: `## 🛠 Developer`
  - 💬 Commentary: `> 💬 **Commentary**`
  - 🔧 Tool Call: `## 🔧 Tool: [tên_công_cụ]`
- **Xử lý rút gọn (Truncation)**: Ở chế độ Audit, dữ liệu đầu ra của tool call nếu vượt quá độ dài tối đa cấu hình (`toolOutputMaxChars`, mặc định 2000 ký tự) sẽ tự động bị cắt ngắn kèm hiển thị số ký tự bị lược bỏ để tránh làm nặng file Markdown.

### 4.5. Điểm điều khiển tích hợp: `src/extension.ts`
- Quản lý kích hoạt và vòng đời của extension.
- **Giao diện VS Code**:
  - Tạo thanh trạng thái (StatusBar) hiển thị nút lối tắt `$(export) ACE` ở góc dưới bên phải để xuất nhanh phiên làm việc mới nhất.
  - Tạo một kênh ghi log đầu ra (OutputChannel) mang tên "ACE Exporter".
- **Đăng ký các câu lệnh**:
  - `ace.exportChat`: Chạy luồng xuất thông thường. Hiển thị hộp thoại lựa chọn nguồn log (Claude/Codex/Kiro) -> hiển thị danh sách các phiên hội thoại tìm được -> chọn chế độ xuất (Clean/Audit) -> thực thi -> hiển thị tài liệu Markdown.
  - `ace.exportLatest`: Xuất nhanh phiên log mới nhất dựa trên các cài đặt mặc định trong Settings.
  - `ace.openOutputFolder`: Mở trực tiếp thư mục lưu trữ file Markdown tự động cấu hình bằng trình duyệt file của OS.
  - `ace.showStatus`: Hiển thị trạng thái các cài đặt cấu hình hiện tại lên Output Channel.
- **Tiến trình xử lý (Progress)**: Sử dụng API `vscode.window.withProgress` hiển thị thanh phần trăm tải trong suốt thời gian phân tích tệp log lớn.

---

## 5. Cấu hình Extension (Extension Settings)

Các thuộc tính thiết lập cấu hình trong `package.json` cho phép người dùng tùy biến hành vi của ACE Exporter:

| Thuộc tính (Settings Key) | Kiểu dữ liệu | Giá trị mặc định | Mô tả chi tiết |
|---|---|---|---|
| `aceExporter.defaultSource` | `string` | `"claude"` | Nguồn log mặc định khi xuất nhanh (`claude`, `codex`, hoặc `kiro`). |
| `aceExporter.defaultMode` | `string` | `"clean"` | Chế độ xuất mặc định (`clean` hoặc `audit`). |
| `aceExporter.sessionLimit` | `number` | `50` | Giới hạn số lượng tệp log hiển thị tối đa trong hộp thoại tìm kiếm (từ 5 đến 500). |
| `aceExporter.outputFolder` | `string` | `""` (Trống) | Thư mục lưu trữ tự động các tập tin Markdown. Nếu để trống sẽ mở tab untitled mới. |
| `aceExporter.autoSave` | `boolean` | `false` | Tự động ghi trực tiếp file Markdown xuống `outputFolder` thay vì mở tab tạm. |
| `aceExporter.toolOutputMaxChars`| `number` | `2000` | Giới hạn ký tự tối đa cho kết quả đầu ra của tool call trong chế độ Audit. |

---

## 6. Cơ chế kiểm thử tích hợp (Integration Tests)

Dự án cung cấp tệp `src/test-run.ts` cho phép chạy kiểm thử độc lập mà không cần khởi chạy toàn bộ môi trường VS Code Extension Host:
- **Cơ chế chạy**: Đọc các phiên làm việc Codex và Claude hiện có trong máy thật của nhà phát triển, tiến hành parse cả hai chế độ `clean` và `audit`.
- **Kết quả đầu ra**: Tạo trực tiếp các file kết quả Markdown lưu vào thư mục `scratch_test_output/` để nhà phát triển có thể kiểm tra định dạng và cấu trúc dữ liệu thực tế.
- Thư mục `scratch_test_output/` hiện đã chứa sẵn các tệp kết quả test mẫu có kích thước rất lớn (file audit của Codex lên đến **2.6 MB**), cho thấy adapter đã được kiểm chứng hoạt động ổn định và xử lý dữ liệu lớn rất hiệu quả.

---

## 7. Báo cáo kiểm chứng thông tin (Verification Report)

Dưới đây là bảng phân loại các khẳng định và mức độ kiểm chứng đối với dự án:

| Khẳng định (Claim) | Mức độ kiểm chứng (Claim Level) | Bằng chứng kiểm chứng (Evidence) |
|---|---|---|
| Mã nguồn sử dụng TypeScript và biên dịch qua esbuild | **VERIFIED** | Đã xác thực qua file `package.json` (phần scripts compile, bundle) và file cấu hình `esbuild.js` thực tế. |
| Extension hỗ trợ 3 adapter: Claude, Codex, Kiro | **VERIFIED** | Đã đọc trực tiếp logic bên trong thư mục `src/adapters/` và các lệnh import, xử lý điều kiện tương ứng tại `src/extension.ts`. |
| Chế độ Audit trích xuất tool call & commentary | **VERIFIED** | Xác nhận qua dòng mã xử lý `tool_use`/`tool_result` tại `ClaudeAdapter.ts#L69-L128`, `function_call`/`function_call_output` tại `CodexAdapter.ts#L83-L128` và `commentary` tại `CodexAdapter.ts#L129-L138`. |
| Kết quả kiểm thử mẫu thực tế đã được lưu | **VERIFIED** | Kiểm tra danh sách file tại `scratch_test_output/` thấy tồn tại 4 file Markdown mẫu của Claude và Codex với dung lượng từ 36 KB đến 2.6 MB. |
| Extension có chức năng lưu tự động | **VERIFIED** | Xác nhận qua mã nguồn hàm `saveOrOpenMarkdown` tại `src/extension.ts#L136-L155` sử dụng cấu hình cấu hình `autoSave` và `outputFolder` to call `fs.writeFileSync`. |
