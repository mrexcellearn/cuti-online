// Cek mode iframe (artifact): rute di memori, alur ajukan + approval jalan
const { chromium } = require('playwright');
(async () => {
  require('fs').writeFileSync(__dirname + '/../web/_iframe.html', '<!DOCTYPE html><html><body style="margin:0"><iframe src="index.html" style="width:390px;height:844px;border:0" sandbox="allow-scripts allow-same-origin allow-forms"></iframe></body></html>');
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 400, height: 860 } });
  const errs = []; pg.on('console', m => m.type() === 'error' && errs.push(m.text())); pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('http://localhost:8765/_iframe.html');
  const f = pg.frameLocator('iframe');
  await f.locator('.akun-demo button[data-nik="90021"]').click();
  await f.locator('.saldo').first().waitFor();
  await f.locator('nav.bawah a[href="#/approval"]').click();
  await f.locator('a.item').first().click();
  await f.locator('.tombol.gelap:has-text("Setujui")').click();
  await f.locator('.modal .tombol.gelap').click();
  await f.locator('.toast.sukses').waitFor();
  await f.locator('h1:has-text("Menunggu persetujuan")').waitFor();
  await f.locator('.banner-demo button').click(); await f.locator('.laci button[data-nik="90011"]').click();
  await f.locator('.toast:has-text("Masuk sebagai")').waitFor();
  await f.locator('nav.bawah a[href="#/lainnya"]').click(); await f.locator('a[href="#/rekap"]').click();
  await f.locator('table.tabel').waitFor();
  await f.locator('nav.bawah a[href="#/lainnya"]').click(); await f.locator('a[href="#/hr/saldo"]').click();
  await f.locator('tr[data-nik="90022"]').click(); await f.locator('a:has-text("Penyesuaian saldo")').waitFor();
  const url = pg.frames()[1].url();
  if (url.includes('#/')) throw new Error('hash berubah di iframe: ' + url);
  await pg.screenshot({ path: 'tes/screenshot/iframe-profil.png' });
  await b.close();
  if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
  console.log('Iframe: alur lulus, hash tidak dipakai, tanpa error console');
})().catch(e => { console.error(e); process.exit(1); });
