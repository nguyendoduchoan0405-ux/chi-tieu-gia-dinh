// Chạy: node ocr.test.js
// Các đoạn chữ dưới đây mô phỏng kết quả OCR của hóa đơn / ảnh chuyển khoản thường gặp.
const { parseBill } = require('./ocr.js');

const cases = [
  {
    ten: 'Hóa đơn siêu thị',
    text: `WINMART
Địa chỉ: 123 Nguyễn Trãi, Q1
Hóa đơn bán hàng
Ngày: 21/10/2026 18:32
Sữa tươi 2 x 32.000   64.000
Bánh mì 15.000
Tổng tiền hàng   79.000
VAT 8%   6.320
Tổng cộng   85.320
Tiền khách đưa   100.000
Tiền thừa   14.680`,
    nd: 'WINMART', st: 85320, ngay: [21, 10, 2026],
  },
  {
    ten: 'Chuyển khoản ngân hàng',
    text: `Giao dịch thành công
Số tiền
2,500,000 VND
Người nhận
NGUYEN VAN A
Ngân hàng: Vietcombank 0123456789
Nội dung: Tien dien thang 10
Thời gian 23/10/2026 09:15`,
    nd: 'Chuyển khoản NGUYEN VAN A (Tien dien thang 10)', st: 2500000, ngay: [23, 10, 2026],
  },
  {
    ten: 'Ví điện tử (MoMo)',
    text: `Thanh toán thành công
-150.000đ
Nhà cung cấp
Highlands Coffee
Thời gian 22 Th10 2026 - 08:05
Mã giao dịch 4829104857`,
    nd: 'Highlands Coffee', st: 150000, ngay: [22, 10, 2026],
  },
  {
    ten: 'Hóa đơn quán ăn, không có nhãn',
    text: `QUÁN CƠM BÀ NĂM
SĐT: 0901234567
Cơm gà 45.000
Canh 10.000
Thành tiền: 55.000đ`,
    nd: 'QUÁN CƠM BÀ NĂM', st: 55000, ngay: null,
  },
  {
    ten: 'MB Bank, OCR đọc hỏng số tiền (ảnh thật của Hoan)',
    text: `Chuyển tiền thành công
898/192 VND
08:12 - 15/10/2026
NH ANH THOAI -
Shinhan Bank
0947792449
NGUYEN HUYNH ANH THOAI chuyen tien`,
    nd: 'Chuyển khoản NH ANH THOAI', st: 0, ngay: [15, 10, 2026], dong: 1,
  },
  {
    ten: 'MB thanh toán (ảnh thật của Hoan)',
    text: `MB
Thanh toán thành công
335,000 VND
10:35 - 16/10/2026
FPT LONG CHAU PHARMA JOINT
STOCK COMPANY
MBBank (MB)
8408018256550 (VQRQAMVCD8390)
Số tiền thanh toán 335,000 VND
Mã giao dịch FT26289541628729`,
    nd: 'Thanh toán FPT LONG CHAU PHARMA JOINT STOCK COMPANY', st: 335000, ngay: [16, 10, 2026],
  },
  {
    ten: 'MB chuyển tiền tới công ty (OCR lần đầu)',
    text: `Chuyển tiền thành công
1,004,800 VND
10:31 - 16/10/2026
CONG TY CO PHAN ZION-NHA THUOC
LONG CHAU
VPBank (VPB)
ZLP26289120179583
NGUYEN HUYNH ANH THOAI chuyen tien`,
    nd: 'Chuyển khoản CONG TY CO PHAN ZION-NHA THUOC LONG CHAU', st: 1004800, ngay: [16, 10, 2026],
  },
  {
    ten: 'Đơn Shopee (ảnh thật của Hoan)',
    text: `13:55 R 1H 56 (3
<4MoMo
< Đơn đã mua o #
lắtcả Chờxácnhận Chờlấyhàng Chờgiaohàng Đãg
V-Baby Care Chờ lấy hàng
q1 Z; Bệ Thu Nhỏ Bồn Cầu Có Thang Đi Vệ Sinh C...
*i W2 NEW BEIGE x
le=z, L 389.000đ 319.000đ
Tổng số tiền (1 sản phẩm): 227.300đ
Thời gian đảm bảo nhận hàng: 23 Thg 10 – 24 Thg
10`,
    nd: 'V-Baby Care - Bệ Thu Nhỏ Bồn Cầu Có Thang Đi Vệ Sinh C...', st: 227300, ngay: null,
  },
  {
    ten: 'Phiếu thu tiền: "Khách trả chuyển khoản: 0" không phải ảnh chuyển khoản',
    text: `xxgGs tr reeri 4
Phiếu thu tiền
Ngày 22/00/2026
Tổng tiền: 2,006,000
Tổng tiền thanh toán: 2,006,000
Khách trả tiền mặt: 2,006,000
Khách trả chuyển khoản: 0
Thẻ thành viên 0834541174`,
    nd: 'Hóa đơn', st: 2006000, ngay: null,
  },
  {
    ten: 'Không có số tiền',
    text: `Cảm ơn quý khách`,
    nd: 'Hóa đơn', st: 0, ngay: null,
  },
];

let fail = 0;
for (const c of cases) {
  const r = parseBill(c.text);
  const ngay = r.ngay ? [r.ngay.d, r.ngay.m, r.ngay.y] : null;
  const ok = r.noiDung === c.nd && r.soTien === c.st && JSON.stringify(ngay) === JSON.stringify(c.ngay) && (c.dong === undefined || r.dong === c.dong);
  if (!ok) fail++;
  console.log(`${ok ? 'OK  ' : 'SAI '} ${c.ten}: ${r.noiDung} | ${r.soTien} | ${JSON.stringify(ngay)}${ok ? '' : `  (cần: ${c.nd} | ${c.st} | ${JSON.stringify(c.ngay)})`}`);
}
console.log(`\n${cases.length - fail}/${cases.length} đúng`);
process.exit(fail ? 1 : 0);
