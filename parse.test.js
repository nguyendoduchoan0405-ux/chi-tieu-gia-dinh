// Chạy: node parse.test.js
const { parseExpense } = require('./parse.js');
const { fixBrands } = require('./brands.js');

const cases = [
  ['ăn sáng ba mươi nghìn', 'Ăn sáng', 30000],
  ['ăn sáng 30k', 'Ăn sáng', 30000],
  ['đổ xăng 50.000', 'Đổ xăng', 50000],
  ['tiền điện 1 triệu 2', 'Tiền điện', 1200000],
  ['tiền điện một triệu hai', 'Tiền điện', 1200000],
  ['mua áo 1tr2', 'Mua áo', 1200000],
  ['đi chợ hai trăm rưỡi', 'Đi chợ', 250000],
  ['học phí 1 triệu rưỡi', 'Học phí', 1500000],
  ['cà phê hai lăm nghìn', 'Cà phê', 25000],
  ['cà phê hai mươi lăm nghìn', 'Cà phê', 25000],
  ['bánh mì mười lăm nghìn', 'Bánh mì', 15000],
  ['tiền nhà 5 triệu', 'Tiền nhà', 5000000],
  ['sửa xe hết 350 nghìn', 'Sửa xe', 350000],
  ['mua một cái quạt 800k', 'Mua một cái quạt', 800000],
  ['ăn trưa 45', 'Ăn trưa', 45000],
  ['siêu thị 1,5 triệu', 'Siêu thị', 1500000],
  ['tiền học 2 triệu 350', 'Tiền học', 2350000],
  ['gửi tiết kiệm 1 tỷ', 'Gửi tiết kiệm', 1000000000],
  ['mua sữa ba trăm linh năm nghìn', 'Mua sữa', 305000],
  // Tên thương hiệu
  ['ăn hai đi lao 1 triệu 2', 'Ăn Haidilao', 1200000],
  ['lẩu man qua 800 nghìn', 'Lẩu Manwah', 800000],
  ['cà phê ca ti nát 55k', 'Cà phê Katinat', 55000],
  ['cà phê hai lần 59 nghìn', 'Cà phê Highlands', 59000],
  ['highland 45k', 'Highlands', 45000],
  ['đi grap 35 nghìn', 'Đi Grab', 35000],
  ['ăn Ca FC 150k', 'Ăn KFC', 150000],
  ['ca fc 2 trăm rưỡi', 'KFC', 250000],
];

let fail = 0;
for (const [input, nd, st] of cases) {
  const r = parseExpense(fixBrands(input));
  const ok = r.noiDung === nd && r.soTien === st;
  if (!ok) fail++;
  console.log(`${ok ? 'OK  ' : 'SAI '} "${input}" -> ${r.noiDung} | ${r.soTien}${ok ? '' : `  (cần: ${nd} | ${st})`}`);
}
// Ngày ở đầu câu
const { tachNgay } = require('./parse.js');
const hn = new Date(2026, 9, 26);
const ngayCases = [
  ['01/02/2027 Lương 40tr', [1, 2, 2027], 'Lương 40tr'],
  ['ngày 5/10 ăn trưa 50k', [5, 10, 2026], 'ăn trưa 50k'],
  ['3-2-27 chợ 100k', [3, 2, 2027], 'chợ 100k'],
  ['1.2.2027 xăng 50k', [1, 2, 2027], 'xăng 50k'],
  ['1.5 triệu tiền nhà', null, '1.5 triệu tiền nhà'],
  ['30/40 chợ 10k', null, '30/40 chợ 10k'],
  ['31/02/2027 chợ 10k', null, '31/02/2027 chợ 10k'],
  ['ăn trưa 50k', null, 'ăn trưa 50k'],
  ['05/10', null, '05/10'],
];
for (const [input, ngay, rest] of ngayCases) {
  const r = tachNgay(input, hn), got = r.ngay ? [r.ngay.d, r.ngay.m, r.ngay.y] : null;
  const ok = JSON.stringify(got) === JSON.stringify(ngay) && r.text === rest;
  if (!ok) fail++;
  console.log(`${ok ? 'OK  ' : 'SAI '} ngày "${input}" -> ${JSON.stringify(got)} | ${r.text}`);
}
console.log(`\n${cases.length + ngayCases.length - fail}/${cases.length + ngayCases.length} đúng`);
process.exit(fail ? 1 : 0);
