# Chi tiêu gia đình

App ghi chi tiêu bằng giọng nói tiếng Việt, chạy trên điện thoại (PWA).

- Bấm nút, nói: "ăn sáng ba mươi nghìn" -> app tách thành Nội dung và Số tiền
- Bảng STT / Nội dung / Số tiền, sửa/xóa trực tiếp
- Xuất file Excel

## Cấu trúc
- `index.html`: giao diện + nhận giọng nói + xuất Excel
- `parse.js`: tách nội dung và số tiền từ câu nói
- `parse.test.js`: test, chạy `node parse.test.js`
- `ocr.js` + `ocr.test.js`: đoán Nội dung, Số tiền, Ngày từ chữ đọc được trong ảnh hóa đơn/chuyển khoản
- `supabase/schema.sql`: bảng dữ liệu dùng chung (chưa nối)

## iPhone
- Mở link bằng Safari
- Bật Cài đặt > Siri, và Cài đặt > Bàn phím > Đọc chính tả
- Mỗi lần bấm nút ghi 1 khoản

## Đồng bộ (Supabase)
- `sync.js`: đăng nhập email + mật khẩu, đẩy/kéo chi tiêu và danh sách nguồn tiền qua REST. Xóa mềm (`xoa`), máy sửa sau thắng.
- Chạy `supabase/schema.sql` 1 lần trong SQL Editor; tắt "Confirm email" ở Authentication > Providers > Email.
