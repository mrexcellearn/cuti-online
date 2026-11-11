const assert = require('assert');
const L = require('../web/logika.js');
const libur = [{ tanggal: '2026-12-25', keterangan: 'Natal' }, { tanggal: '2026-12-24', keterangan: 'Cuti bersama' }];
let n = 0; const t = (nama, f) => { f(); n++; };
t('Jumat-Senin = 2 hari kerja', () => assert.strictEqual(L.hitungHari('TAHUNAN', '2026-11-13', '2026-11-16', []).jumlahHari, 2));
t('lewati libur', () => { const r = L.hitungHari('TAHUNAN', '2026-12-21', '2026-12-25', libur); assert.strictEqual(r.jumlahHari, 3); assert.strictEqual(r.liburDilewati.length, 2); });
t('lapangan 14 kalender', () => assert.strictEqual(L.hitungHari('LAPANGAN', '2026-12-20', '2027-01-02', libur).jumlahHari, 14));
t('kabisat', () => assert.strictEqual(L.hitungHari('LAPANGAN', '2028-02-28', '2028-03-01', []).jumlahHari, 3));
t('mulai > selesai', () => assert.throws(() => L.hitungHari('TAHUNAN', '2026-11-20', '2026-11-19', [])));
t('tanggal invalid', () => assert.throws(() => L.hitungHari('TAHUNAN', '2026-02-30', '2026-03-01', [])));
t('akhir pekan = 0', () => assert.strictEqual(L.hitungHari('TAHUNAN', '2026-11-14', '2026-11-15', []).jumlahHari, 0));
t('maks 60', () => assert.throws(() => L.hitungHari('LAPANGAN', '2026-11-01', '2027-01-15', [])));
t('bentrok', () => {
  const p = [{ no: 'A', status: 'MENUNGGU', mulai: '2026-11-10', selesai: '2026-11-12' }, { no: 'B', status: 'DITOLAK', mulai: '2026-11-20', selesai: '2026-11-21' }];
  assert.strictEqual(L.cekBentrok(p, '2026-11-12', '2026-11-13').no, 'A');
  assert.strictEqual(L.cekBentrok(p, '2026-11-20', '2026-11-20'), null);
  assert.strictEqual(L.cekBentrok(p, '2026-11-13', '2026-11-14'), null);
});
t('saldo', () => {
  const s = L.saldoDari([{ jenis: 'TAHUNAN', jumlah: 12 }, { jenis: 'TAHUNAN', jumlah: -2 }, { jenis: 'LAPANGAN', jumlah: 14 }], [{ jenis: 'TAHUNAN', status: 'MENUNGGU', jumlahHari: 3 }], 'TAHUNAN');
  assert.deepStrictEqual([s.saldo, s.menunggu, s.tersedia], [10, 3, 7]);
});
t('lewati tahap', () => {
  const ap = { 1: ['H'], 2: ['H'], 3: ['R', 'S'], 4: [] };
  const r = L.tahapBerikut(2, x => ap[x], 'H');
  assert.strictEqual(r.tahap, 3); assert.strictEqual(r.dilewati.length, 1);
  assert.strictEqual(L.tahapBerikut(4, x => ap[x], 'R').tahap, null);
});
t('pin lemah', () => { assert(L.pinLemah('123456')); assert(L.pinLemah('111111')); assert(L.pinLemah('12a456')); assert.strictEqual(L.pinLemah('583920', '90022'), ''); });
console.log('Logika: ' + n + ' tes lulus');
