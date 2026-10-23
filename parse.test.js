// Chạy: node parse.test.js
const { parseExpense } = require('./parse.js');

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
];

let fail = 0;
for (const [input, nd, st] of cases) {
  const r = parseExpense(input);
  const ok = r.noiDung === nd && r.soTien === st;
  if (!ok) fail++;
  console.log(`${ok ? 'OK  ' : 'SAI '} "${input}" -> ${r.noiDung} | ${r.soTien}${ok ? '' : `  (cần: ${nd} | ${st})`}`);
}
console.log(`\n${cases.length - fail}/${cases.length} đúng`);
process.exit(fail ? 1 : 0);
