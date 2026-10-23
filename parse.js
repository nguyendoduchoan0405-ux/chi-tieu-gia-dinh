// Tách "nội dung" và "số tiền" từ câu nói tiếng Việt.
// Ví dụ: "ăn sáng ba mươi nghìn" -> { noiDung: "ăn sáng", soTien: 30000 }

const DIGIT_WORDS = {
  'không': 0, 'một': 1, 'mốt': 1, 'hai': 2, 'ba': 3, 'bốn': 4, 'tư': 4,
  'năm': 5, 'lăm': 5, 'sáu': 6, 'bảy': 7, 'bẩy': 7, 'tám': 8, 'chín': 9,
};
const UNITS = {
  'nghìn': 1e3, 'ngàn': 1e3, 'k': 1e3, 'cành': 1e3,
  'triệu': 1e6, 'tr': 1e6, 'củ': 1e6, 'm': 1e6,
  'tỷ': 1e9, 'tỉ': 1e9,
};
const FILLERS = ['hết', 'mất', 'giá', 'là', 'khoảng', 'tốn', 'tổng', 'cộng', 'đồng', 'vnđ', 'vnd'];

// Giữ nguyên chữ hoa (tên thương hiệu); so khớp thì dùng bản chữ thường
function tokenize(text) {
  return text
    .replace(/(\d)([a-zđ]+)/gi, '$1 $2')     // 30k -> 30 k, 1tr2 -> 1 tr2
    .replace(/([a-zđ]+)(\d)/gi, '$1 $2')     // tr2 -> tr 2
    .replace(/[^\p{L}\d.,\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function numberValue(tok) {
  if (/^\d{1,3}([.,]\d{3})+$/.test(tok)) return Number(tok.replace(/[.,]/g, '')); // 30.000
  if (/^\d+[.,]\d{1,2}$/.test(tok)) return Number(tok.replace(',', '.'));        // 1,5
  if (/^\d+$/.test(tok)) return Number(tok);
  return null;
}

function isMoneyToken(tok) {
  return numberValue(tok) !== null || tok in DIGIT_WORDS || tok in UNITS ||
    ['mười', 'mươi', 'trăm', 'rưỡi', 'lẻ', 'linh'].includes(tok);
}

// Đổi một dãy token số thành giá trị VND
function toAmount(tokens) {
  let total = 0, cur = 0, pending = 0, lastUnit = 0, afterTram = false;
  for (const t of tokens) {
    const n = numberValue(t);
    if (n !== null) pending = n;
    else if (t in DIGIT_WORDS) {
      if (pending > 0) { cur += pending * 10; }                // "hai lăm" = 25
      pending = DIGIT_WORDS[t];
    }
    else if (t === 'mười') cur += 10;
    else if (t === 'mươi') { cur += pending * 10; pending = 0; }
    else if (t === 'trăm') { cur += pending * 100; pending = 0; afterTram = true; }
    else if (t in UNITS) {
      total += (cur + pending) * UNITS[t];
      lastUnit = UNITS[t]; cur = 0; pending = 0; afterTram = false;
    } else if (t === 'rưỡi') {
      if (cur === 0 && pending === 0 && lastUnit) total += lastUnit / 2; // 1 triệu rưỡi
      else if (afterTram) cur += 50;                                      // hai trăm rưỡi
    }
  }
  const rest = cur + pending;
  if (lastUnit) {
    // "1 triệu 2" = 1.200.000, "1 triệu 25" = 1.250.000, "1 triệu 250" = 1.250.000
    if (rest > 0) total += rest < 10 ? rest * lastUnit / 10 : rest < 100 ? rest * lastUnit / 100 : rest * lastUnit / 1000;
  } else {
    total = rest < 1000 ? rest * 1000 : rest; // không nói đơn vị: "ăn sáng 30" hiểu là 30 nghìn
  }
  return Math.round(total);
}

function parseExpense(text) {
  const raw = tokenize(text);
  const tokens = raw.map(t => t.toLowerCase());
  // Tìm các cụm token số liên tiếp
  const runs = [];
  let start = -1;
  tokens.forEach((t, i) => {
    if (isMoneyToken(t)) { if (start < 0) start = i; }
    else if (start >= 0) { runs.push([start, i]); start = -1; }
  });
  if (start >= 0) runs.push([start, tokens.length]);

  // Ưu tiên cụm có đơn vị tiền hoặc chữ số; nếu nhiều thì lấy cụm cuối
  const score = ([s, e]) => tokens.slice(s, e).some(t => t in UNITS || numberValue(t) !== null) ? 1 : 0;
  let best = null;
  for (const r of runs) if (!best || score(r) >= score(best)) best = r;

  if (!best) return { noiDung: text.trim(), soTien: 0 };

  const soTien = toAmount(tokens.slice(best[0], best[1]));
  const words = [...raw.slice(0, best[0]), ...raw.slice(best[1])];
  while (words.length && FILLERS.includes(words[words.length - 1].toLowerCase())) words.pop();
  const noiDung = words.join(' ');
  return { noiDung: noiDung.charAt(0).toUpperCase() + noiDung.slice(1), soTien };
}

if (typeof module !== 'undefined') module.exports = { parseExpense, toAmount, tokenize };
