// Sửa tên thương hiệu bị nhận giọng sai (máy nghe tiếng Việt nên phiên âm tên nước ngoài).
// Ví dụ: "hai đi lao" -> "Haidilao", "ca ti nát" -> "Katinat".
// Chạy TRƯỚC parseExpense, để "hai lần" (Highlands) không bị hiểu thành số 2.

const BRANDS = {
  'Haidilao':       ['hadilao', 'haidilao', 'ha di lao', 'hai di lao', 'hai di lau', 'hay di lao', 'hai dy lao', 'ha di lau'],
  'Manwah':         ['manwah', 'man wah', 'man wa', 'man qua', 'man oa', 'manh oa', 'man goa', 'mang wa', 'men wa', 'man hoa'],
  'Katinat':        ['katinat', 'ka ti nat', 'ca ti nat', 'ca ti net', 'cati nat', 'katy nat', 'ka ti na', 'ca ty nat'],
  'Highlands':      ['highlands', 'highland', 'high land', 'hai lan', 'hai len', 'hai lan dot', 'hai lands', 'hai lần'],
  'Starbucks':      ['starbucks', 'starbuck', 'star bucks', 'sta bac', 'so ta bac', 'sa ta bac'],
  'The Coffee House': ['the coffee house', 'coffee house', 'do cop phi hao', 'cop phi hao'],
  'Phúc Long':      ['phuc long'],
  'KFC':            ['kfc', 'ca fc', 'ca ep xe', 'ca ep xi', 'ca ef xi', 'ca ef ci', 'ka fc', 'k fc', 'k f c', 'ke ep xi', 'ke ef xi'],
  'Lotteria':       ['lotteria', 'lot te ri a', 'lo te ri a', 'lotte ria'],
  'Jollibee':       ['jollibee', 'jolibee', 'jo li bi', 'gio li bi', 'jolly bee'],
  "McDonald's":     ['mcdonalds', 'mcdonald', 'mac do nan', 'mac donald', 'mc donald'],
  'Pizza Hut':      ['pizza hut', 'pi za hut', 'pizza hat'],
  'Gogi':           ['gogi', 'go gi'],
  'Kichi Kichi':    ['kichi kichi', 'ki chi ki chi'],
  'Grab':           ['grab', 'grap', 'go rap', 'gờ ráp'],
  'Shopee':         ['shopee', 'shop pi', 'sop pi', 'shoppe'],
  'Lazada':         ['lazada', 'la za da'],
  'Circle K':       ['circle k', 'xo co ca', 'circle ca'],
  'WinMart':        ['winmart', 'win mart', 'uyn mart', 'win mat'],
  'Co.opmart':      ['coopmart', 'co op mart', 'co op mat', 'coop mart'],
};

// Bỏ dấu để so khớp: "Hài Đi Lào" -> "hai di lao"
function boDau(s) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
}

// Từ điển học được khi người dùng sửa tay (lưu trên máy)
function loadLearned() {
  try { return JSON.parse(localStorage.getItem('tudien')) || {}; } catch { return {}; }
}

function buildAliases() {
  const list = [];
  for (const [brand, aliases] of Object.entries(BRANDS))
    for (const a of aliases) list.push([boDau(a).split(' '), brand]);
  for (const [a, brand] of Object.entries(typeof localStorage !== 'undefined' ? loadLearned() : {}))
    list.push([a.split(' '), brand]);
  return list.sort((x, y) => y[0].length - x[0].length); // cụm dài khớp trước
}

function fixBrands(text) {
  const orig = text.trim().split(/\s+/);
  const norm = orig.map(w => boDau(w).replace(/[^a-z0-9.]/g, ''));
  const aliases = buildAliases();
  const out = [];
  for (let i = 0; i < orig.length; ) {
    const hit = aliases.find(([a]) => a.every((w, k) => norm[i + k] === w));
    if (hit) { out.push(hit[1]); i += hit[0].length; }
    else { out.push(orig[i]); i++; }
  }
  return out.join(' ');
}

// Khi sửa tay "Ăn hai đi lao" thành "Ăn Haidilao": nhớ "hai di lao" -> "Haidilao"
function learnFix(before, after) {
  const a = before.trim().split(/\s+/), b = after.trim().split(/\s+/);
  let s = 0;
  while (s < a.length && s < b.length && boDau(a[s]) === boDau(b[s])) s++;
  let ea = a.length, eb = b.length;
  while (ea > s && eb > s && boDau(a[ea - 1]) === boDau(b[eb - 1])) { ea--; eb--; }
  const sai = a.slice(s, ea), dung = b.slice(s, eb);
  if (!sai.length || !dung.length || sai.length > 4 || dung.length > 4) return;
  const d = loadLearned();
  d[boDau(sai.join(' '))] = dung.join(' ');
  try { localStorage.setItem('tudien', JSON.stringify(d)); } catch {}
}

if (typeof module !== 'undefined') module.exports = { fixBrands, boDau };
