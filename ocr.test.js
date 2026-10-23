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
    ten: 'Không có số tiền',
    text: `Cảm ơn quý khách`,
    nd: 'Hóa đơn', st: 0, ngay: null,
  },
];

let fail = 0;
for (const c of cases) {
  const r = parseBill(c.text);
  const ngay = r.ngay ? [r.ngay.d, r.ngay.m, r.ngay.y] : null;
  const ok = r.noiDung === c.nd && r.soTien === c.st && JSON.stringify(ngay) === JSON.stringify(c.ngay);
  if (!ok) fail++;
  console.log(`${ok ? 'OK  ' : 'SAI '} ${c.ten}: ${r.noiDung} | ${r.soTien} | ${JSON.stringify(ngay)}${ok ? '' : `  (cần: ${c.nd} | ${c.st} | ${JSON.stringify(c.ngay)})`}`);
}
console.log(`\n${cases.length - fail}/${cases.length} đúng`);
process.exit(fail ? 1 : 0);
