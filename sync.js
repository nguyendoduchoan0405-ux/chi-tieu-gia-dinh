// Đồng bộ chi tiêu + danh sách nguồn tiền giữa các máy qua Supabase (REST, không cần thư viện).
// Cách làm: mỗi dòng chi tiêu là 1 hàng trong bảng expenses; dòng bị xóa được đánh dấu xoa=true để máy kia cũng xóa theo.
// So khớp bằng bản chụp "lần cuối đã đồng bộ" (localStorage 'sync_da'): khác bản chụp = máy này vừa sửa -> đẩy lên.
const SB_URL = 'https://wpxsvsbtvcoctrmwebhr.supabase.co';
const SB_KEY = 'sb_publishable_QggNleRle-uWS98NiboTiw_HmQBlsLu';

window.dongBo = (() => {
  const $ = id => document.getElementById(id);
  const doc = (k, mac) => { try { return JSON.parse(localStorage.getItem(k)) ?? mac; } catch { return mac; } };
  const ghi = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  let phien = doc('sb_phien', null);                       // { access_token, refresh_token, expires_at, email }
  let da = doc('sync_da', {});                              // id -> JSON dòng đã đồng bộ ('__nguon' cho danh sách nguồn)
  let moc = doc('sync_moc', { expenses: '1970-01-01T00:00:00Z' });
  let dangChay = false, canChayLai = false, hen = null;

  const hienTrang = (t, loi) => { const e = $('dongbo'); e.textContent = t; e.className = loi ? 'loi' : ''; };

  // ----- Đăng nhập -----
  async function auth(duong, body) {
    const r = await fetch(SB_URL + duong, { method: 'POST', headers: { apikey: SB_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.msg || j.error_description || j.message || 'Lỗi ' + r.status);
    return j;
  }
  function luuPhien(j, email) {
    phien = { access_token: j.access_token, refresh_token: j.refresh_token, expires_at: Date.now() + (j.expires_in || 3600) * 1000, email: email || phien?.email || j.user?.email };
    ghi('sb_phien', phien);
  }
  async function token() {
    if (!phien) throw new Error('chưa đăng nhập');
    if (Date.now() > phien.expires_at - 60000) {
      try { luuPhien(await auth('/auth/v1/token?grant_type=refresh_token', { refresh_token: phien.refresh_token })); }
      catch (e) { phien = null; ghi('sb_phien', null); throw new Error('phiên hết hạn, đăng nhập lại'); }
    }
    return phien.access_token;
  }
  async function api(duong, opt = {}) {
    const r = await fetch(SB_URL + '/rest/v1' + duong, { ...opt, headers: { apikey: SB_KEY, Authorization: 'Bearer ' + await token(), 'Content-Type': 'application/json', ...(opt.headers || {}) } });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      throw new Error(r.status === 403 || j.code === '42501' ? 'email này chưa được thêm vào nhóm' : (j.message || 'Lỗi ' + r.status));
    }
    return r.status === 204 ? null : r.json().catch(() => null);
  }

  // ----- Chuyển đổi dòng <-> hàng -----
  const raHang = it => ({ id: it.id, noi_dung: it.noiDung, so_tien: it.soTien, thoi_gian: it.thoiGian, nguon: it.nguon || '', cau_goc: it.cauGoc || '', xoa: false });
  const tuHang = h => ({ id: h.id, noiDung: h.noi_dung, soTien: Number(h.so_tien), thoiGian: new Date(h.thoi_gian).toISOString(), nguon: h.nguon || '', cauGoc: h.cau_goc || '' });
  const chup = h => JSON.stringify([h.noi_dung, h.so_tien, new Date(h.thoi_gian).getTime(), h.nguon, h.cau_goc]);

  async function dongBoMot() {
    // 1. Kéo về những gì máy khác đã sửa
    let thayDoi = false;
    for (;;) {
      const ds = await api(`/expenses?select=*&updated_at=gt.${encodeURIComponent(moc.expenses)}&order=updated_at.asc&limit=1000`);
      if (!ds.length) break;
      for (const h of ds) {
        const i = items.findIndex(x => x.id === h.id);
        const choDay = i >= 0 && da[h.id] !== chup(raHang(items[i]));   // máy này đang sửa dở: để máy này thắng, lát nữa đẩy lên
        if (h.xoa) { if (i >= 0 && !choDay) { items.splice(i, 1); thayDoi = true; } delete da[h.id]; }
        else if (!choDay) {
          const it = tuHang(h);
          if (i >= 0) items[i] = { ...items[i], ...it }; else items.push(it);
          da[h.id] = chup(h); thayDoi = true;
        }
      }
      moc.expenses = ds[ds.length - 1].updated_at;
      if (ds.length < 1000) break;
    }
    // 2. Đẩy lên những gì máy này đã thêm/sửa/xóa
    const len = [];
    for (const it of items) { const h = raHang(it); if (da[it.id] !== chup(h)) len.push(h); }
    const co = new Set(items.map(x => x.id));
    for (const id of Object.keys(da)) if (id !== '__nguon' && !co.has(id)) len.push({ id, noi_dung: '', so_tien: 0, thoi_gian: new Date().toISOString(), nguon: '', cau_goc: '', xoa: true });
    if (len.length) {
      await api('/expenses?on_conflict=id', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(len) });
      for (const h of len) { if (h.xoa) delete da[h.id]; else da[h.id] = chup(h); }
    }
    // 3. Danh sách nguồn tiền (thắng theo lần sửa gần nhất; máy mới chưa từng đồng bộ thì lấy bản trên mạng)
    const cs = await api('/cai_dat?khoa=eq.nguon_ds&select=gia_tri,updated_at');
    const tren = cs && cs[0], local = JSON.stringify(nguonDs);
    if (tren && da.__nguon === undefined) { nguonDs = tren.gia_tri; da.__nguon = JSON.stringify(nguonDs); thayDoi = true; }
    else if (tren && da.__nguon === local && JSON.stringify(tren.gia_tri) !== local) { nguonDs = tren.gia_tri; da.__nguon = JSON.stringify(nguonDs); thayDoi = true; }
    else if (!tren || da.__nguon !== local) {
      await api('/cai_dat?on_conflict=khoa', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify([{ khoa: 'nguon_ds', gia_tri: nguonDs }]) });
      da.__nguon = local;
    }
    ghi('sync_da', da); ghi('sync_moc', moc);
    if (thayDoi) {
      xepNgay(); try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
      luuNguon(); lamMoiNguon();
    }
  }

  async function chay() {
    if (!phien) { hienTrang('Chưa đồng bộ — chạm để đăng nhập'); return; }
    if (dangChay) { canChayLai = true; return; }
    if (!navigator.onLine) { hienTrang('Đang offline — sẽ đồng bộ khi có mạng', true); return; }
    dangChay = true; hienTrang('Đang đồng bộ...');
    try {
      await dongBoMot();
      hienTrang(`Đã đồng bộ ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} · ${phien.email}`);
    } catch (e) { hienTrang('Lỗi đồng bộ: ' + e.message + ' — chạm để xem', true); }
    dangChay = false;
    if (canChayLai) { canChayLai = false; setTimeout(chay, 500); }
  }

  // ----- Giao diện đăng nhập -----
  const mo = () => {
    $('dn').classList.add('mo'); $('dn-loi').textContent = '';
    $('dn-form').style.display = phien ? 'none' : ''; $('dn-xong').style.display = phien ? '' : 'none';
    $('dn-ai').textContent = phien ? 'Đang đăng nhập: ' + phien.email : '';
  };
  async function vao(taoMoi) {
    const email = $('dn-email').value.trim().toLowerCase(), pw = $('dn-pw').value;
    if (!email || pw.length < 6) { $('dn-loi').textContent = 'Nhập email và mật khẩu (từ 6 ký tự).'; return; }
    $('dn-loi').textContent = 'Đang xử lý...';
    try {
      let j = taoMoi ? await auth('/auth/v1/signup', { email, password: pw }) : await auth('/auth/v1/token?grant_type=password', { email, password: pw });
      if (!j.access_token) throw new Error('Cần xác nhận email trước (hoặc tắt "Confirm email" trong Supabase).');
      luuPhien(j, email); $('dn').classList.remove('mo'); $('dn-pw').value = ''; chay();
    } catch (e) { $('dn-loi').textContent = e.message; }
  }
  $('dongbo').onclick = mo;
  $('dn-vao').onclick = () => vao(false);
  $('dn-moi').onclick = () => vao(true);
  $('dn-dong').onclick = () => $('dn').classList.remove('mo');
  $('dn-ra').onclick = () => { phien = null; ghi('sb_phien', null); $('dn').classList.remove('mo'); chay(); };
  $('dn-lai').onclick = () => { $('dn').classList.remove('mo'); chay(); };

  document.addEventListener('visibilitychange', () => { if (!document.hidden) chay(); });
  window.addEventListener('online', chay);
  setInterval(() => { if (!document.hidden) chay(); }, 30000);
  chay();
  return { hen: () => { clearTimeout(hen); hen = setTimeout(chay, 1500); } };   // gọi sau mỗi lần lưu
})();
