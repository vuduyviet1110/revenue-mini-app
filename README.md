# 🚀 Revenue Mini App - Quản Lý Doanh Thu & Đồng Bộ Google Sheets

Project Mini App chuyên biệt phục vụ ghi nhận doanh thu từng sản phẩm bán được, tự động phân loại **Ngày / Tháng / Quý / Năm** và **bắn dữ liệu về Google Sheets (Google Apps Script)**.

---

## 📁 Cấu Trúc Project

```
revenue-mini-app/
├── index.html              # Giao diện chính (Glassmorphic Dashboard UI)
├── src/
│   ├── main.ts             # Xử lý logic nhập liệu, tính toán Ngày/Tháng/Quý, bọc dữ liệu & đồng bộ API
│   ├── style.css           # Hệ thống CSS Design Tokens, gradient glow, responsive
│   └── google-script.js    # Mã nguồn Google Apps Script (Code.gs)
├── vite.config.ts          # Cấu hình Vite Dev Server (port 5174)
└── README.md               # Hướng dẫn sử dụng & Tích hợp vào Angular
```

---

## 🛠️ 1. Hướng Dẫn Chạy Project Độc Lập

1. Mở terminal tại thư mục project:
   ```bash
   cd /home/viet/projects/revenue-mini-app
   ```
2. Cài đặt dependencies:
   ```bash
   npm install
   ```
3. Chạy môi trường Dev:
   ```bash
   npm run dev
   ```
   *Ứng dụng sẽ chạy tại địa chỉ:* `http://localhost:5174`

---

## 📊 2. Hướng Dẫn Cấu Hình Google Apps Script (Trên Google Sheet)

1. Mở file **Google Sheet** của bạn (hoặc tạo sheet mới trên Google Drive).
2. Trên thanh menu Google Sheet: Chọn **Extensions (Tiện ích mở rộng)** -> **Apps Script**.
3. Xóa toàn bộ nội dung cũ trong file `Code.gs` và copy mã nguồn trong file [google-script.js](./src/google-script.js) dán vào.
4. Nhấp nút **Deploy (Triển khai)** -> **New deployment (Triển khai mới)**.
   - **Select type (Chọn loại):** Web App
   - **Description:** Revenue Sync API
   - **Execute as (Thực thi dưới danh nghĩa):** `Me` (Tôi)
   - **Who has access (Ai có quyền truy cập):** `Anyone` (Bất kỳ ai)
5. Nhấp **Deploy**, cấp quyền truy cập tài khoản Google, sau đó copy lấy đường dẫn **Web App URL** (Dạng: `https://script.google.com/macros/s/AKfycbx.../exec`).
6. Mở **Revenue Mini App** -> Bấm nút **"Cấu hình Web App URL"** ở góc trên -> Dán URL vừa copy vào và Lưu!

---

## 🔌 3. Hướng Dẫn Tích Hợp Vào Project Chính (Angular `ecommerce-angular`)

Có 2 cách tích hợp chuẩn mực và dễ thực hiện nhất vào project Angular hiện tại của bạn (`/home/viet/projects/ecommerce-angular/ecommerce-frontend`):

### Cách 1: Tích hợp qua iframe (Khuyên dùng - Nhanh nhất & Không vỡ CSS)

1. Build và deploy `revenue-mini-app` (hoặc chạy dev server ở port 5174).
2. Tạo một Component mới trong Angular:
   ```bash
   cd /home/viet/projects/ecommerce-angular/ecommerce-frontend
   ng g c components/admin-revenue-plugin
   ```
3. Trong file template Angular (`admin-revenue-plugin.component.html`):
   ```html
   <div class="revenue-plugin-container" style="width: 100%; height: 850px; border: none;">
     <iframe 
       src="http://localhost:5174" 
       width="100%" 
       height="100%" 
       style="border: none; border-radius: 12px;"
       title="Revenue Mini App">
     </iframe>
   </div>
   ```

### Cách 2: Tích hợp dưới dạng Web Component (Custom Element)

1. Đóng gói Mini App thành 1 file JavaScript duy nhất (`revenue-widget.js`).
2. Nhúng file script vào `index.html` của Angular:
   ```html
   <script src="path/to/revenue-widget.js"></script>
   ```
3. Sử dụng trực tiếp thẻ HTML trong bất kỳ trang nào của Angular:
   ```html
   <revenue-tracker-app></revenue-tracker-app>
   ```
