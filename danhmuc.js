// Danh mục chi tiêu: bảng màu/icon và đoán danh mục từ nội dung (chạy trên máy, không cần mạng)
const DM = {
  'Ăn uống': ['#f97316', 'M4 3v7a2 2 0 0 0 2 2v9M8 3v7M6 3v7M16 3c-2 1-3 3-3 6s1 4 3 4v8'],
  'Đi lại': ['#0ea5e9', 'M5 16h14M6 16l1.5-5h9L18 16M7 19v-3M17 19v-3'],
  'Nhà & hóa đơn': ['#8b5cf6', 'M3 11l9-7 9 7M5 10v10h14V10'],
  'Mua sắm': ['#ec4899', 'M6 7h12l1 13H5L6 7zM9 7a3 3 0 0 1 6 0'],
  'Con cái': ['#f59e0b', 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM8 14s1.5 2 4 2 4-2 4-2M9 10h.01M15 10h.01'],
  'Sức khỏe': ['#ef4444', 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.5-7 10-7 10z'],
  'Giải trí': ['#14b8a6', 'M4 7h16v10H4zM9 7v10'],
  'Giáo dục': ['#6366f1', 'M4 5h6a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H4zM20 5h-6a2 2 0 0 0-2 2v12a2 2 0 0 1 2-2h6z'],
  'Quà & hiếu hỉ': ['#d946ef', 'M4 11h16v9H4zM3 8h18v3H3zM12 8v12'],
  'Đầu tư': ['#10b981', 'M3 17l6-6 4 4 8-8M15 7h6v6'],
  'Thu nhập': ['#22c55e', 'M4 7h14a2 2 0 0 1 2 2v9H4zM4 7V6a2 2 0 0 1 2-2h10M16 13h2'],
  'Khác': ['#94a3b8', 'M6 12h.01M12 12h.01M18 12h.01'],
};

// Luật theo thứ tự ưu tiên: [danh mục, regex trên chữ không dấu, regex trên chữ có dấu (tùy chọn)]
const DM_LUAT = [
  ['Đầu tư', /vang|tiet kiem|chung khoan|co phieu|crypto|bitcoin|trai phieu|quy dau tu/],
  ['Nhà & hóa đơn', /tien (dien|nuoc|nha|net|rac|gas|wifi)|(^| )(dien|internet|wifi|chung cu|phi quan ly|thue nha|dien thoai|cuoc|hoa don|viettel|vnpt|fpt|mobifone|vinaphone)( |$)/],
  ['Giáo dục', /hoc phi|tien hoc|hoc them|khoa hoc|tieng anh|mam non|dong phuc|giao duc|(^| )(sach|vo viet|lop|truong)( |$)/],
  ['Sức khỏe', /thuoc|kham |benh vien|nha khoa|bao hiem|vien phi|xet nghiem|vitamin|phong kham|(^| )(rang|y te)( |$)/],
  ['Đi lại', /xang|grab(?! ?food)|taxi|gui xe|ve (xe|may bay|tau)|cau duong|bao duong|sua xe|rua xe|dang kiem|(^| )(etc|xe om)( |$)/],
  ['Con cái', /ta bim|bim |do choi|xe day|binh sua|em be|tre em/, /sữa|tã |(^| )bé( |$)|(^| )con( |$)/],
  ['Giải trí', /phim|karaoke|game|netflix|spotify|youtube|du lich|khach san|homestay|resort|cong vien|vui choi|picnic|cam trai|(^| )spa( |$)/],
  ['Quà & hiếu hỉ', /mung (cuoi|sinh nhat|tho)|mung |phong bi|li xi|(^| )qua( |$)|(^| )tang( |$)|dam (cuoi|ma|hoi)|tu thien|ung ho|phung duong|bieu |vieng /],
  ['Ăn uống', /(^| )an( |$)|uong|ca phe|cafe|tra sua|(^| )(com|pho|bun|banh)( |$)|nha hang|(^| )quan( |$)|sieu thi|(^| )cho( |$)|thuc pham|(^| )(rau|thit|bia|ruou|lau)( |$)|hai san|nuong|food|kfc|lotteria|highlands|starbucks|phuc long|winmart|bach hoa|coop|aeon|(^| )bhx( |$)/],
  ['Mua sắm', /shopee|lazada|tiki|quan ao|(^| )(ao|quan|giay|tui|dep)( |$)|my pham|do gia dung|noi that|dien may|tivi|mua sam/],
];

const boDauDm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');

// Trả về tên danh mục; thu = true khi khoản là tiền vào
function doanDanhMuc(noiDung, thu) {
  const goc = (noiDung || '').normalize('NFC').toLowerCase(), kd = boDauDm(goc);
  const dt = DM_LUAT[0];
  if (dt[1].test(kd)) return 'Đầu tư';                       // mua/bán vàng, gửi/rút tiết kiệm: đầu tư dù là thu hay chi
  if (thu) return 'Thu nhập';
  for (const [ten, re, reGoc] of DM_LUAT) if (re.test(kd) || (reGoc && reGoc.test(goc))) return ten;
  return 'Khác';
}

if (typeof module !== 'undefined') module.exports = { DM, doanDanhMuc };
