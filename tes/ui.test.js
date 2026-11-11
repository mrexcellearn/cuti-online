// Fase 4: alur demo per peran di browser, screenshot HP + laptop, tanpa error console.
const { chromium } = require('playwright');
const L = require('../web/logika.js');
const URL = process.env.URL || 'http://localhost:8765/index.html';
const OUT = process.env.OUT || 'tes/screenshot';
require('fs').mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch();
  const errs = [];
  for (const [nama, vp] of [['hp', { width: 390, height: 844 }], ['laptop', { width: 1366, height: 800 }]]) {
    const ctx = await b.newContext({ viewport: vp });
    const p = await ctx.newPage();
    p.on('console', m => { if (m.type() === 'error') errs.push(nama + ': ' + m.text()); });
    p.on('pageerror', e => errs.push(nama + ' pageerror: ' + e.message));
    const shot = async n => p.screenshot({ path: `${OUT}/${nama}-${n}.png`, fullPage: true });
    const tunggu = () => p.waitForFunction(() => !document.querySelector('.muat, .tombol[disabled] .putar'), null, { timeout: 8000 });
    const akun = async nik => {
      if (await p.locator('.banner-demo button').count() && await p.locator('main#isi').count()) {
        await p.click('.banner-demo button'); await p.click(`.laci button[data-nik="${nik}"]`); await p.waitForSelector('.toast:has-text("Masuk sebagai")'); await p.waitForFunction(() => location.hash === '#/beranda' && document.querySelector('main .saldo'));
      } else { await p.click(`.akun-demo button[data-nik="${nik}"]`); }
      await p.waitForSelector('main#isi'); await tunggu();
    };
    await p.goto(URL); await p.evaluate(() => { localStorage.clear(); }); await p.reload();
    await p.waitForSelector('.akun-demo button'); await shot('01-masuk');
    // PIN salah
    await p.fill('#nik', '90022'); await p.fill('#pin', '000000'); await p.click('form button[type=submit]');
    await p.waitForSelector('.pesan-salah'); 
    // (1) operator ajukan cuti lapangan
    await p.fill('#pin', '123456'); await p.click('form button[type=submit]'); await p.waitForSelector('.saldo'); await tunggu(); await shot('02-beranda-karyawan');
    const hariIni = await p.evaluate(() => CutiMock._db() && new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10));
    let senin = hariIni; while (L.keTanggal(senin).getUTCDay() !== 1) senin = L.tambahHari(senin, 1);
    const m1 = L.tambahHari(senin, 28);
    await p.click('nav a[href="#/ajukan"] >> visible=true'); await p.waitForSelector('#jenis');
    await p.selectOption('#jenis', 'LAPANGAN'); await p.fill('#mulai', m1); await p.dispatchEvent('#mulai', 'change');
    await p.fill('#selesai', L.tambahHari(m1, 13)); await p.dispatchEvent('#selesai', 'change');
    await p.waitForSelector('.perkiraan .besar'); await p.fill('#alasan', 'Off roster, pulang ke Manado'); await shot('03-ajukan-perkiraan');
    await p.click('form button[type=submit]'); await p.waitForSelector('.modal'); await shot('04-terkirim');
    const no = await p.textContent('.modal .pin-besar');
    await p.click('.modal button:has-text("Lihat detail")'); await p.waitForSelector('.waktu-garis'); await tunggu(); await shot('05-detail');
    // (8) bentrok + saldo kurang
    await p.goto(URL + '#/ajukan'); await p.waitForSelector('#jenis');
    await p.selectOption('#jenis', 'TAHUNAN'); await p.fill('#mulai', L.tambahHari(m1, 2)); await p.dispatchEvent('#mulai', 'change');
    await p.fill('#selesai', L.tambahHari(m1, 2)); await p.dispatchEvent('#selesai', 'change');
    await p.waitForSelector('.perkiraan.gagal'); if (!/bentrok/.test(await p.textContent('.perkiraan'))) throw new Error('bentrok tidak muncul');
    await shot('06-bentrok');
    await p.fill('#mulai', L.tambahHari(m1, 20)); await p.dispatchEvent('#mulai', 'change'); await p.fill('#selesai', L.tambahHari(m1, 45)); await p.dispatchEvent('#selesai', 'change');
    await p.waitForFunction(() => /tidak cukup/.test(document.querySelector('.perkiraan').textContent)); await shot('07-saldo-kurang');
    // (2) approval berurutan
    for (const [nik, n] of [['90021', 'atasan'], ['90020', 'head'], ['90011', 'hr'], ['90001', 'gm']]) {
      await akun(nik);
      await p.goto(URL + '#/approval'); await p.waitForSelector('.daftar'); await tunggu();
      if (n === 'atasan') await shot('08-antrian-atasan');
      try { await p.click(`a.item[href*="${no}"]`, { timeout: 5000 }); } catch (e) { await shot("GAGAL-" + n); console.log(await p.evaluate(() => document.body.innerText.slice(0, 800))); throw e; } await p.waitForSelector('.tombol.gelap:has-text("Setujui")'); await tunggu();
      if (n === 'gm') await shot('09-keputusan-gm');
      await p.click('.tombol.gelap:has-text("Setujui")'); await p.waitForSelector('.modal');
      await p.click('.modal .tombol.gelap'); await p.waitForSelector('.toast.sukses'); await tunggu();
    }
    // (4) saldo terpotong + mutasi
    await akun('90022'); await shot('10-beranda-sesudah');
    await p.goto(URL + '#/mutasi'); await p.waitForSelector('table.tabel'); await shot('11-mutasi');
    // (3) tolak dengan alasan
    await akun('90021'); await p.goto(URL + '#/approval'); await p.waitForSelector('.daftar'); await tunggu(); await p.waitForSelector('a.item');
    await p.click('a.item >> nth=0'); await p.waitForSelector('.tombol:has-text("Tolak")'); await p.click('.tombol:has-text("Tolak")');
    await p.click('.modal .tombol.bahaya'); await p.waitForSelector('.modal .pesan-salah');
    await p.fill('#catatan', 'Unit EX-03 kekurangan operator minggu itu'); await p.click('.modal .tombol.bahaya'); await p.waitForSelector('.toast.sukses');
    // (5) HR koreksi saldo
    await akun('90011'); await p.goto(URL + '#/lainnya'); await p.waitForSelector('.menu-lain'); await shot('12-lainnya-hr');
    await p.goto(URL + '#/hr/saldo'); await p.waitForSelector('tr[data-nik]'); await shot('13-saldo-karyawan');
    await p.click('tr[data-nik="90022"]'); await p.waitForSelector('a:has-text("Penyesuaian saldo")'); await tunggu(); await shot('14-profil');
    await p.click('a:has-text("Penyesuaian saldo")'); await p.waitForSelector('#jumlah'); await tunggu();
    await p.selectOption('#jenisSesuai', 'TAHUNAN'); await p.fill('#jumlah', '1'); await p.fill('#alasanSesuai', 'Kompensasi kerja hari libur 17 Agustus'); await shot('15-penyesuaian');
    await p.click('form button[type=submit]'); await p.click('.modal .tombol.utama'); await p.waitForSelector('.toast.sukses');
    // (6) reset PIN
    await p.goto(URL + '#/hr/reset-pin'); await p.waitForSelector('button[data-nik="90023"]'); await p.click('button[data-nik="90023"]');
    await p.click('.modal .tombol.gelap'); await p.waitForSelector('#pinSementara'); await shot('16-pin-sementara');
    const pin = await p.textContent('#pinSementara'); await p.click('.modal .tombol.utama');
    // (7) rekap
    await p.goto(URL + '#/rekap'); await p.waitForSelector('table.tabel'); await tunggu(); await shot('17-rekap');
    // login dengan PIN sementara -> wajib ganti
    await p.click('.banner-demo button'); await p.waitForSelector('.laci'); await p.waitForSelector('.laci .email'); await shot('18-panel-demo');
    await p.click('.laci .kepala button');
    await p.goto(URL + '#/lainnya'); await p.waitForSelector('.menu-lain'); await p.click('button:has-text("Keluar")'); await p.waitForSelector('#nik');
    await p.fill('#nik', '90023'); await p.fill('#pin', pin); await p.click('form button[type=submit]'); await p.waitForSelector('#pinBaru'); await shot('19-wajib-ganti-pin');
    await p.fill('#pinLama', pin); await p.fill('#pinBaru', '583920'); await p.fill('#pinUlang', '583920'); await p.click('form button[type=submit]');
    await p.waitForSelector('.saldo'); await tunggu();
    // karyawan tidak lihat menu approval, tidak bisa buka detail orang lain
    if (await p.locator('nav a[href="#/approval"]').count()) throw new Error('karyawan lihat menu approval');
    await p.goto(URL + '#/pengajuan/' + no); await p.waitForSelector('.pesan-salah');
    // token kedaluwarsa
    await p.evaluate(() => localStorage.setItem('cuti-token', 'kedaluwarsa')); await p.goto(URL + '#/riwayat'); await p.reload(); await p.waitForSelector('#nik');
    console.log(nama + ': alur lengkap lulus, nomor ' + no);
    await ctx.close();
  }
  await b.close();
  if (errs.length) { console.error('Error console:\n' + errs.join('\n')); process.exit(1); }
  console.log('Tanpa error console');
})().catch(async e => { console.error(e); process.exit(1); });
