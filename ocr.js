// Từ chữ OCR của ảnh hóa đơn / chuyển khoản / thanh toán -> { noiDung, soTien, ngay }
// Chỉ là đoán: app luôn cho Hoan xem lại và sửa trước khi thêm vào bảng.

const bd = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');

const TONG = /tong cong|tong tien|tong thanh toan|thanh tien|thanh toan|so tien|total|amount|phai tra|tong so|tong gia tri|grand total|gia tri giao dich/;
const LOAI = /thua|khach dua|change|giam|chiet khau|discount|phi |fee|vat|thue|tax|diem|point|so du|balance|tien hang/;
const SO = /(?<![\d.,])(\d{1,3}(?:[.,]\d{3})+|\d{4,9})(?![\d])/g;

const NGAY_RE = [
  /(\d{1,2})\s*[\/\-.]\s*(\d{1,2})\s*[\/\-.]\s*(\d{4})/,                     // 23/10/2026
  /(\d{4})\s*[\/\-.]\s*(\d{1,2})\s*[\/\-.]\s*(\d{1,2})/,                     // 2026-10-23
  /(\d{1,2})\s*(?:thg|th|thang)\s*(\d{1,2})[,\s]+(\d{4})/,                   // 23 Th10 2026, 23 Thg 10, 2026
  /ngay\s*(\d{1,2})\s*thang\s*(\d{1,2})\s*nam\s*(\d{4})/,                    // ngày 23 tháng 10 năm 2026
];

function soTrongDong(line) {
  const s = line.replace(/(\d{1,2})\s*[\/\-.]\s*(\d{1,2})\s*[\/\-.]\s*\d{2,4}/g, ' ')   // bỏ ngày
                .replace(/\d{1,2}:\d{2}(:\d{2})?/g, ' ');                              // bỏ giờ
  return [...s.matchAll(SO)].map(m => Number(m[1].replace(/[.,]/g, ''))).filter(n => n >= 1000);
}

function timSoTien(lines) {
  const nhan = lines.map(bd);
  const tong = [];
  lines.forEach((l, i) => {
    if (!TONG.test(nhan[i]) || LOAI.test(nhan[i])) return;
    let ns = soTrongDong(l);
    if (!ns.length && lines[i + 1]) ns = soTrongDong(lines[i + 1]);        // số nằm ở dòng kế
    tong.push(...ns);
  });
  if (tong.length) return Math.max(...tong);
  const coDonVi = [];
  lines.forEach((l, i) => { if (/vnd|vnđ|₫|\dđ|\d\s*d\b/i.test(nhan[i])) coDonVi.push(...soTrongDong(l)); });
  if (coDonVi.length) return Math.max(...coDonVi);
  const het = lines.flatMap(soTrongDong);
  return het.length ? Math.max(...het) : 0;
}

function timNgay(lines) {
  const hienTai = new Date();
  for (const l of lines) {
    const t = bd(l);
    for (const [k, re] of NGAY_RE.entries()) {
      const m = t.match(re);
      if (!m) continue;
      const [d, mo, y] = k === 1 ? [+m[3], +m[2], +m[1]] : [+m[1], +m[2], +m[3]];
      const dt = new Date(y, mo - 1, d);
      if (dt.getDate() === d && dt.getMonth() === mo - 1 && y >= 2000 && dt <= new Date(+hienTai + 2 * 864e5))
        return { d, m: mo, y };
    }
  }
  return null;
}

// Giá trị của nhãn: "Nội dung: abc" hoặc "Nội dung" xuống dòng "abc"
function giaTri(lines, nhanRe) {
  for (let i = 0; i < lines.length; i++) {
    const t = bd(lines[i]);
    const m = t.match(nhanRe);
    if (!m) continue;
    const sau = lines[i].slice(m.index + m[0].length).replace(/^\s*[:\-–]\s*/, '').trim();
    if (sau.length >= 2) return sau;
    const ke = (lines[i + 1] || '').trim();
    if (ke.length >= 2 && !nhanRe.test(bd(ke))) return ke;
  }
  return '';
}

const KHONG_PHAI_TEN = /hoa don|receipt|invoice|bill|phieu|dia chi|^dc|hotline|tel|sdt|mst|ma so thue|www|http|ban hang|cam on|thanh cong|giao dich/;

function timNoiDung(lines) {
  const chung = bd(lines.join(' '));
  const chuyenKhoan = /chuyen khoan|chuyen tien|nguoi nhan|ten nguoi nhan|transfer|beneficiary|tai khoan nhan/.test(chung);
  const nd = giaTri(lines, /noi dung(?: chuyen khoan| chuyen tien)?|loi nhan|message|description|mo ta/);
  const ncc = giaTri(lines, /nha cung cap|cua hang|merchant|don vi thu huong|noi nhan thanh toan/);
  const nhan = giaTri(lines, /ten nguoi nhan|nguoi nhan|nguoi thu huong|beneficiary|den|toi/);

  if (chuyenKhoan) {
    const ten = nhan.replace(/\s*\d{6,}.*$/, '').trim();      // bỏ số tài khoản dính phía sau
    return ['Chuyển khoản', ten, nd && `(${nd})`].filter(Boolean).join(' ');
  }
  if (ncc) return nd ? `${ncc} - ${nd}` : ncc;
  // Hóa đơn cửa hàng: lấy dòng tên đầu tiên có chữ
  for (const l of lines.slice(0, 7)) {
    const chu = (l.match(/\p{L}/gu) || []).length;
    if (chu >= 3 && chu >= l.replace(/\s/g, '').length * 0.6 && !KHONG_PHAI_TEN.test(bd(l))) return l.trim();
  }
  return nd || 'Hóa đơn';
}

function parseBill(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  return { noiDung: timNoiDung(lines), soTien: timSoTien(lines), ngay: timNgay(lines) };
}

if (typeof module !== 'undefined') module.exports = { parseBill };
