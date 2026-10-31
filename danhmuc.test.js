// Chạy: node danhmuc.test.js
const { doanDanhMuc } = require('./danhmuc.js');
const cases = [
  ['Cà phê sáng', false, 'Ăn uống'], ['Siêu thị Winmart', false, 'Ăn uống'], ['Ăn sáng', false, 'Ăn uống'], ['Đi chợ', false, 'Ăn uống'],
  ['Đổ xăng', false, 'Đi lại'], ['Grab đi làm', false, 'Đi lại'], ['Grab food', false, 'Ăn uống'], ['Sửa xe', false, 'Đi lại'],
  ['Tiền điện', false, 'Nhà & hóa đơn'], ['Tiền nước', false, 'Nhà & hóa đơn'], ['Internet tháng 10', false, 'Nhà & hóa đơn'],
  ['Mua áo', false, 'Mua sắm'], ['Mua áo cho bé', false, 'Con cái'], ['Mua sữa cho con', false, 'Con cái'], ['Shopee', false, 'Mua sắm'],
  ['Tiền học tiếng Anh cho bé', false, 'Giáo dục'], ['Mua thuốc cảm', false, 'Sức khỏe'], ['Khám bệnh', false, 'Sức khỏe'],
  ['Xem phim', false, 'Giải trí'], ['Mừng cưới', false, 'Quà & hiếu hỉ'], ['Mua vàng 1 chỉ SJC', false, 'Đầu tư'],
  ['Gửi tiết kiệm MB 12 tháng', false, 'Đầu tư'], ['Rút tiết kiệm MB', true, 'Đầu tư'], ['Bán vàng 1 chỉ', true, 'Đầu tư'],
  ['Lương tháng 10', true, 'Thu nhập'], ['Thưởng', true, 'Thu nhập'], ['Linh tinh', false, 'Khác'], ['', false, 'Khác'],
  ['ca phe sang', false, 'Ăn uống'], ['do xang', false, 'Đi lại'],
];
let sai = 0;
for (const [nd, thu, mong] of cases) { const kq = doanDanhMuc(nd, thu); if (kq !== mong) { sai++; console.log(`SAI: "${nd}" -> ${kq}, mong ${mong}`); } }
console.log(sai ? `${cases.length - sai}/${cases.length} đúng` : `${cases.length}/${cases.length} đúng`);
process.exit(sai ? 1 : 0);
