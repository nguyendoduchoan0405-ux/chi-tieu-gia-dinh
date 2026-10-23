# Chi tiêu gia đình

App ghi chi tiêu bằng giọng nói tiếng Việt, chạy trên điện thoại (PWA).

- Bấm nút, nói: "ăn sáng ba mươi nghìn" -> app tách thành Nội dung và Số tiền
- Bảng STT / Nội dung / Số tiền, sửa/xóa trực tiếp
- Xuất file Excel

## Cấu trúc
- `index.html`: giao diện + nhận giọng nói + xuất Excel
- `parse.js`: tách nội dung và số tiền từ câu nói
- `parse.test.js`: test, chạy `node parse.test.js`
- `supabase/schema.sql`: bảng dữ liệu dùng chung (chưa nối)

## iPhone
- Mở link bằng Safari
- Bật Cài đặt > Siri, và Cài đặt > Bàn phím > Đọc chính tả
- Mỗi lần bấm nút ghi 1 khoản
