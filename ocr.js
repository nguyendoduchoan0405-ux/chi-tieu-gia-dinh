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
  return [...s.matchAll(SO)]
    .filter(m => !/^0\d*$/.test(m[1]))                       // 0947792449: số điện thoại / tài khoản
    .map(m => Number(m[1].replace(/[.,]/g, ''))).filter(n => n >= 1000);
}

// Trả về số tiền đoán được và chỉ số dòng chứa nó (để app đọc lại riêng dòng đó cho chính xác)
function timSoTien(lines) {
  const nhan = lines.map(bd);
  let tot = null;
  lines.forEach((l, i) => {
    if (!TONG.test(nhan[i]) || LOAI.test(nhan[i])) return;
    let j = i, ns = soTrongDong(l);
    if (!ns.length && lines[i + 1]) { j = i + 1; ns = soTrongDong(lines[j]); }     // số nằm ở dòng kế
    ns.forEach(n => { if (!tot || n > tot.soTien) tot = { soTien: n, dong: j }; });
  });
  if (tot) return tot;
  // Dòng có đơn vị tiền, kể cả khi OCR đọc số chưa ra (vd "898/192 VND")
  const iVnd = nhan.findIndex(t => /vnd|vnđ|₫|\dd\b/.test(t));
  if (iVnd >= 0) return { soTien: Math.max(0, ...soTrongDong(lines[iVnd])), dong: iVnd };
  let best = { soTien: 0, dong: null };
  lines.forEach((l, i) => soTrongDong(l).forEach(n => { if (n > best.soTien) best = { soTien: n, dong: i }; }));
  return best;
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

// Tên người nhận khi không có nhãn: dòng chữ HOA đứng ngay trên dòng ngân hàng / số tài khoản
function tenTruocNganHang(lines) {
  for (let i = 1; i < lines.length; i++) {
    if (!/bank|vcb|vietcombank|\b\d{4}\s?\d{4}\s?\d{2,}\b/i.test(bd(lines[i]))) continue;
    const ten = tenNganHang(lines[i - 1]);
    if (ten.split(' ').length >= 2 && hoaRatio(lines[i - 1]) >= 0.8) return ten;
  }
  return '';
}

const hoaRatio = l => { const ch = l.match(/\p{L}/gu) || []; return ch.length ? ch.filter(c => c === c.toUpperCase()).length / ch.length : 0; };
const boDauHoa = t => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
// "e{e] 2 PHAN ZION-NHA THUOC i5" -> "PHAN ZION-NHA THUOC"
const tenNganHang = t => boDauHoa(t).split(/\s+/).filter(w => /^[A-Z][A-Z\-]+$/.test(w.replace(/^[^A-Z]+|[^A-Z]+$/g, ''))).map(w => w.replace(/^[^A-Z]+|[^A-Z]+$/g, '')).join(' ');
const lamSach = t => t.replace(/^[\s\-–_.,;:|\[\]'"‘’“”@~<>]+|[\s\-–_.,;:|\[\]'"‘’“”@~<>]+$/g, '').trim();

// Các dòng nằm giữa dòng "giờ - ngày" và dòng ngân hàng/số tài khoản là tên người nhận
function dongTenTheoViTri(lines) {
  // Dòng ngắn "10:35 - 16/10/2026" (giờ có thể bị OCR đọc hỏng, nên chỉ cần dòng ngắn chứa ngày đủ năm)
  const iGio = lines.findIndex((l, i) => i < 14 && l.length < 32 && /\d{1,2}\s*[\/.\-]\s*\d{1,2}\s*[\/.\-]\s*\d{4}/.test(l));
  if (iGio < 0) return [];
  const kq = [];
  for (let i = iGio + 1; i < lines.length && kq.length < 3; i++) {
    const t = bd(lines[i]);
    if (/bank|ngan hang|\(\w{2,5}\)|\d{8,}|giao dich|chuyen tien\s*$/.test(t)) break;
    if ((lines[i].match(/\p{L}/gu) || []).length >= 3) kq.push(i);
  }
  return kq;
}

const KHONG_PHAI_TEN = /khach|tong|chuyen khoan|thanh toan|tien mat|hoa don|receipt|invoice|bill|phieu|dia chi|^dc|hotline|tel|sdt|mst|ma so thue|www|http|ban hang|cam on|thanh cong|giao dich/;

// Dòng OCR rác (vd "xxgGs tr reeri 4") thường có nhiều từ không có nguyên âm hoặc quá ngắn
const lanTu = l => {
  const tu = l.trim().split(/\s+/);
  return tu.filter(t => t.length >= 2 && /[aeiouyàáảãạăâêôơưéèẻẽẹíìỉĩịóòỏõọúùủũụýỳỷỹỵ]/i.test(t)).length >= tu.length * 0.8;
};

// Nội dung chuyển khoản có thể xuống dòng: nối dòng kế nếu nó ngắn, không phải nhãn/ngày/số
function noiDungDayDu(lines, nd) {
  const i = lines.findIndex(l => l.includes(nd));
  const ke = i >= 0 ? (lines[i + 1] || '').trim() : '';
  const bi = bd(ke);
  if (ke && ke.length <= 24 && !/[:\d]{3,}|\d{1,2}[\/:]\d{2}/.test(ke) && !/chuyen nhanh|luu mau|chia se|phi chuyen|ma giao dich|hinh thuc/.test(bi)) return `${nd} ${ke}`;
  return nd;
}

// MB Bank: không có nhãn "Nội dung", dòng nội dung nằm dưới dòng ngân hàng/số tài khoản, trước câu "Giao dịch được xác nhận"
function noiDungKhongNhan(lines) {
  let cuoi = lines.findIndex(l => /giao dich duoc|nhan boi|vui long|chinh sua|hinh anh/.test(bd(l)));   // OCR hay đọc sai chữ trong câu này, nên khớp nhiều mảnh
  if (cuoi < 0) cuoi = lines.length;
  const iNh = lines.findLastIndex((l, i) => i < cuoi && /bank|\(\w{2,5}\)|\d{8,}/i.test(bd(l)));
  const l = (lines[cuoi - 1] || '').trim();
  if (iNh < 0 || iNh >= cuoi - 1 || (l.match(/\p{L}/gu) || []).length < 6 || /\d{6,}|:/.test(l)) return '';
  return l;
}

function timNoiDung(lines, dongTen = []) {
  const chung = bd(lines.join(' '));
  // "Khách trả chuyển khoản: 0" trên hóa đơn không phải ảnh chuyển khoản
  const chuyenKhoan = /(?:tien|khoan)\s*th[a-z]{1,3}h\s*c[o0]ng|giao dich thanh cong|chuyen\s*th[a-z]{1,3}h\s*c[o0]ng|nguoi nhan|tai khoan nhan|beneficiary|transfer successful/.test(chung);
  const nd = giaTri(lines, /noi dung(?: chuyen khoan| chuyen tien)?|loi nhan|message|description|mo ta/);
  const ncc = giaTri(lines, /nha cung cap|cua hang|merchant|don vi thu huong|noi nhan thanh toan/);
  const nhan = giaTri(lines, /ten nguoi nhan|nguoi nhan|nguoi thu huong|beneficiary|den|toi/);

  if (chuyenKhoan) {
    const tenViTri = dongTen.map(i => lines[i]).filter(l => hoaRatio(l) >= 0.6).map(tenNganHang).filter(Boolean).join(' ');
    const ten = nhan ? nhan.replace(/\s*\d{6,}.*$/, '').trim() : (tenViTri || tenTruocNganHang(lines));   // bỏ số tài khoản dính phía sau
    if (nd) return noiDungDayDu(lines, nd);
    const ndMb = noiDungKhongNhan(lines);
    if (ndMb) return ndMb;                  // chỉ lấy phần "Nội dung" của giao dịch
    return ['Chuyển khoản', ten].filter(Boolean).join(' ');
  }
  if (ncc) return nd ? `${ncc} - ${nd}` : ncc;
  // Ảnh thanh toán của ngân hàng ("Thanh toán thành công"): tên nơi nhận nằm dưới dòng giờ - ngày
  const tenThanhToan = dongTen.map(i => lines[i]).filter(l => hoaRatio(l) >= 0.6).map(tenNganHang).filter(Boolean).join(' ');
  if (/(?:toan|toon)\s*th[a-z]{1,3}h\s*c[o0]ng/.test(chung) && tenThanhToan) return `Thanh toán ${tenThanhToan}`;
  // Ảnh đơn hàng sàn thương mại điện tử (Shopee...): tên shop nằm dưới dòng tab trạng thái, kế đó là tên sản phẩm
  if (/tong so tien \(|don da mua/.test(chung)) {
    const iTab = lines.findIndex(l => /cho\s*xac\s*nhan/.test(bd(l)) && /cho\s*giao\s*hang/.test(bd(l)));
    if (iTab >= 0 && lines[iTab + 1]) {
      const shop = lines[iTab + 1].replace(/^\W*(Yêu thích\+?|Mall)\s*/i, '')
        .replace(/\s*(Chờ\s*lấy\s*hàng|Chờ\s*giao\s*hàng|Chờ\s*xác\s*nhận|Đã\s*giao|Hoàn\s*thành|Đã\s*hủy).*$/i, '').trim();
      const sp = (lines[iTab + 2] || '').split(/\s+/);
      while (sp.length && /[^\p{L}\-]/u.test(sp[0])) sp.shift();   // bỏ rác OCR ở đầu ("q1 Z;")
      const ten = [shop, sp.join(' ')].filter(Boolean).join(' - ');
      if (ten) return ten;
    }
  }
  // Hóa đơn cửa hàng: lấy dòng tên đầu tiên có chữ
  for (const l of lines.slice(0, 5)) {
    const chu = (l.match(/\p{L}/gu) || []).length;
    if (chu >= 4 && chu >= l.replace(/\s/g, '').length * 0.8 && lanTu(l) && !KHONG_PHAI_TEN.test(bd(l))) return l.trim();
  }
  return nd || 'Hóa đơn';
}

// text: chuỗi, hoặc mảng các dòng (để chỉ số dòng trả về khớp với dòng OCR)
function parseBill(text) {
  const lines = (Array.isArray(text) ? text : text.split(/\r?\n/)).map(l => l.trim()).filter(Boolean);
  const { soTien, dong } = timSoTien(lines);
  const dongTen = dongTenTheoViTri(lines);
  return { noiDung: timNoiDung(lines, dongTen), soTien, dong, dongTen, ngay: timNgay(lines) };
}

if (typeof module !== 'undefined') module.exports = { parseBill, soTrongDong };
