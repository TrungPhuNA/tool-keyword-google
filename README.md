# Keyword SEO Tool

Tool Node.js để thu thập từ khóa SEO từ Google Search một cách tự động.

## Tính năng

### Scraper Tool:
- 🔍 Tìm kiếm từ khóa trên Google
- 📊 Thu thập từ khóa từ phần "Mọi người cũng tìm kiếm"
- 💾 Lưu trữ vào MySQL database với kiểm tra trùng lặp
- 🔄 Tự động loop qua các từ khóa mới tìm được
- 📈 Theo dõi tiến độ và thống kê
- ⏸️ Có thể dừng và tiếp tục
- 👁️ Browser không tự động đóng để theo dõi tiến trình

### Web Interface:
- 🌐 Giao diện web quản lý keywords
- 📋 Xem danh sách keywords với phân trang
- 🔍 Tìm kiếm và lọc keywords
- ✏️ Thêm, sửa, xóa keywords
- 📊 Thống kê real-time
- 🔄 Reset trạng thái keywords
- ✅ Chọn và xóa nhiều keywords cùng lúc

## Cài đặt

1. Clone hoặc tải project
2. Cài đặt dependencies:

```bash
npm install
```

3. Cài đặt MySQL và tạo database:

```bash
# Đăng nhập MySQL
mysql -u root -p

# Chạy script tạo database
source setup-database.sql
```

4. Cấu hình kết nối database trong file `.env`:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=keyword_seo
```

## Sử dụng

### Chạy với từ khóa mặc định:
```bash
npm start
```

### Chạy với từ khóa tùy chỉnh:
```bash
node index.js "từ khóa của bạn"
```

### Chạy ở chế độ development:
```bash
npm run dev
```

### Chạy web interface để quản lý keywords:
```bash
npm run web
```
Sau đó truy cập: http://localhost:3000

### Chạy riêng scraper:
```bash
npm run scraper
```

## Cấu hình

Chỉnh sửa file `.env` để thay đổi cấu hình:

- `SEARCH_DELAY`: Thời gian chờ giữa các lần tìm kiếm (ms)
- `MAX_DEPTH`: Độ sâu tối đa cho việc thu thập
- `HEADLESS`: Chạy browser ẩn hay hiển thị
- `PAGE_TIMEOUT`: Timeout cho các thao tác trang

## Cấu trúc Database

Tool sử dụng MySQL với bảng `keywords`:

- `id`: ID tự tăng (INT AUTO_INCREMENT PRIMARY KEY)
- `keyword`: Từ khóa (VARCHAR(500) UNIQUE NOT NULL)
- `source_keyword`: Từ khóa nguồn (VARCHAR(500))
- `created_at`: Thời gian tạo (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- `processed`: Đã xử lý hay chưa (BOOLEAN DEFAULT FALSE)

Database được tối ưu với các index:
- `idx_keyword`: Index cho cột keyword
- `idx_processed`: Index cho cột processed
- `idx_created_at`: Index cho cột created_at
- `idx_source_keyword`: Index cho cột source_keyword

## Cách hoạt động

1. Bắt đầu với từ khóa ban đầu (mặc định: "Code đồ án")
2. Tìm kiếm trên Google
3. Thu thập từ khóa từ phần "Mọi người cũng tìm kiếm"
4. Lưu vào database (bỏ qua nếu đã tồn tại)
5. Lặp lại với các từ khóa mới tìm được
6. Dừng khi đạt độ sâu tối đa hoặc không còn từ khóa mới

## Lưu ý

- Tool sử dụng Puppeteer để điều khiển browser
- Có delay giữa các lần tìm kiếm để tránh bị Google chặn
- Database MySQL cần được cài đặt và cấu hình trước
- Nhấn Ctrl+C để dừng tool một cách an toàn
- Đảm bảo MySQL service đang chạy trước khi start tool

## Troubleshooting

- Nếu bị lỗi timeout, tăng `PAGE_TIMEOUT` trong `.env`
- Nếu bị Google chặn, tăng `SEARCH_DELAY`
- Nếu không tìm thấy từ khóa, thử chạy với `HEADLESS=false` để debug
