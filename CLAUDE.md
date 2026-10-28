# Ngữ cảnh dự án (đọc trước khi làm)

App ghi chi tiêu gia đình cho Hoan và vợ. Chạy trên iPhone (Safari, PWA), không có bước build: HTML/JS thuần, host trên GitHub Pages
(https://nguyendoduchoan0405-ux.github.io/chi-tieu-gia-dinh/). Đẩy lên nhánh `main` là web tự cập nhật sau 1–2 phút.

## Về người dùng
- Hoan: kỹ sư điện ngoài khơi, mới học lập trình. Trả lời tiếng Việt, ngắn gọn, gạch đầu dòng, không emoji, góp ý thẳng.
- Chỉ sửa phần cần sửa, không viết lại cả file.

## Cấu trúc
- `index.html`: toàn bộ giao diện và logic (tab Tổng quan (có ô "Thu - chi năm" bấm để sang màn bảng Tiny Family (nút ‹ quay lại): tháng, tổng thu, tổng chi, số dư, nhóm theo năm) / Sổ giao dịch (tên cũ Chi tiết; xem từng tháng một, quẹt trái = tháng sau, quẹt phải = tháng trước; thẻ tổng Tiền vào/Tiền ra/Còn lại; các khoản gom theo ngày, bố cục giống Money Lover), giọng nói, quét ảnh, xuất Excel).
  - Tab Tổng quan là màn các ô: Sao kê tín dụng (thẻ khai báo ở `the_td`: nguồn, số thẻ, ngân hàng, ngày chốt, ngày thanh toán, độ trễ `tre` ngày; chi trong kỳ = ngày chi + tre nằm trong kỳ, bấm thẻ để xổ chi tiết; `nhacSaoKe()` hiện banner `#nhac` khi hạn thanh toán còn 0-2 ngày, chưa có push khi app đóng), Vàng vật chất (màn "Lịch sử tích lũy vàng": nền vàng ánh kim, mỗi lần mua là một thẻ "Mua N chỉ <nơi>", ngày • giá/chỉ, thành tiền bên phải, dòng Tổng giá trị mua gốc ở cuối; chạm số chỉ = ảnh hóa đơn, chạm thẻ = sửa; `vang`: đồng bộ hai chiều với Sổ giao dịch: lệnh vàng và dòng giao dịch dùng chung `id` (`vangSangGd`, `gdSangVang`, `xoaVangCungId`), nội dung dòng dạng "Mua/Bán vàng N chỉ <nơi>", "bán vàng" tính là thu trong `laThu`, gõ "mua vàng 2 chỉ SJC 30tr" ở ô nhập sẽ tạo luôn lệnh vàng; lệnh cũ chưa có dòng giao dịch; `loai` = 'ban' cho lệnh bán (không có = mua; bán tính theo giá vốn bình quân gia quyền, `vangTinh()`; không cho bán quá số chỉ đang có), ngày, nơi mua `noi`, số chỉ, giá/chỉ, `hd` = link hóa đơn điện tử, `anh` = có ảnh hóa đơn; blob trong IndexedDB khóa `vang_<id>`, Storage `hoa-don/vang_<id>.jpg`), Tổng tài sản (tiền mặt + tiết kiệm đang gửi + vàng theo giá hiện tại nếu đã nhập, không thì giá mua); ô Vàng tích lũy ở Tổng quan (thiết kế kiểu Modern Card, font Inter nạp từ Google Fonts, không nạp được thì dùng font hệ thống) có nhãn % lãi/lỗ, số lượng, giá trị khi mua, giá vàng hiện tại nhập tay (`vang_gia`, đồng/chỉ, đồng bộ qua `cai_dat`), lãi/lỗ, thanh tiến độ và giá mua bình quân, Thu - chi năm (bảng Tiny Family), Tiền mặt (Σ thu − Σ chi), Tiền tiết kiệm (bảng sổ gửi, lãi đơn). Chuyển màn bằng `moMan()`.
  - Sổ tiết kiệm: localStorage `tiet_kiem` `{id, ngay, soTien, ky (tháng), lai (%/năm), nganHang}`, đồng bộ qua `cai_dat` khóa `tiet_kiem`; `the_td` và `vang` đồng bộ cùng cách.
- `parse.js`: tách nội dung + số tiền từ câu nói tiếng Việt. `brands.js`: sửa tên thương hiệu nước ngoài bị nhận sai.
- `ocr.js`: đoán nội dung, số tiền, ngày từ chữ OCR của ảnh hóa đơn/chuyển khoản (Tesseract.js chạy trên máy, tải từ CDN).
- `sync.js`: đồng bộ Supabase qua REST (đăng nhập email+mật khẩu, xóa mềm, ảnh trong Storage bucket `hoa-don`).
- `supabase/schema.sql`, `supabase/anh.sql`: SQL chạy tay trong Supabase SQL Editor.
- Test: `node parse.test.js` (42 ca), `node ocr.test.js` (12 ca). Sau khi sửa script trong `index.html` hãy chạy `node --check` trên script inline.

## Quy ước dữ liệu
- Mỗi dòng: `{id, noiDung, soTien (luôn dương), thoiGian (ISO), nguon, cauGoc, anh}`.
- Thu hay chi KHÔNG lưu, suy ra từ nội dung (`laThu`): có lương/thưởng/thu nhập/thu khác là thu, còn lại là chi.
- Nguồn tiền: danh sách chung (localStorage `nguon_ds`, đồng bộ qua bảng `cai_dat`); lọc/xuất riêng theo nguồn ở tab Sổ giao dịch.
- localStorage: `chitieu`, `nguon_ds`, `nguon_md`, `sync_*`; ảnh trong IndexedDB `chitieu_anh`.

## Lưu ý
- iOS Safari: input phải font-size 16px (tránh zoom); Web Speech chỉ ghi 1 khoản mỗi lần bấm; không chạy trong trình duyệt nhúng.
- Supabase project `wpxsvsbtvcoctrmwebhr` (Tokyo). Khóa publishable nằm trong `sync.js` (công khai được). Không bao giờ ghi service_role key hay mật khẩu DB.
- Môi trường cloud của Claude không gọi được Supabase (proxy chặn): thay đổi SQL phải nhờ Hoan chạy tay; kiểm thử đồng bộ bằng bản giả lập (mock) trong Playwright.
