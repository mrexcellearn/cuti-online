const assert = require('assert');
const M = require('../web/mock.js');
const L = require('../web/logika.js');
M._reset();
const call = (aksi, data, token) => JSON.parse(M.proses(JSON.stringify({ aksi, token, data })));
const login = nik => { const r = call('login', { nik, pin: '123456' }); assert(r.ok, JSON.stringify(r)); return r.data.token; };
let n = 0; const t = (nama, f) => { try { f(); n++; } catch (e) { console.error('GAGAL: ' + nama); throw e; } };
const budi = login('90022');
const hariIni = call('beranda', {}, budi).data.hariIni;
let senin = hariIni; while (L.keTanggal(senin).getUTCDay() !== 1) senin = L.tambahHari(senin, 1);
const mulai = L.tambahHari(senin, 28), selesai = L.tambahHari(mulai, 13);
let no;
t('beranda saldo', () => { const b = call('beranda', {}, budi).data; assert.strictEqual(b.saldo.length, 3); assert.strictEqual(b.saldo.find(s => s.jenis === 'TAHUNAN').saldo, 10); });
t('hitung lapangan', () => { const h = call('hitung', { jenis: 'LAPANGAN', mulai, selesai }, budi).data; assert.strictEqual(h.jumlahHari, 14); assert(h.boleh, h.pesan); });
t('saldo kurang', () => { const h = call('hitung', { jenis: 'TAHUNAN', mulai, selesai: L.tambahHari(mulai, 30) }, budi).data; assert(!h.boleh); assert(/tidak cukup/.test(h.pesan)); });
t('ajukan', () => { const r = call('ajukan', { jenis: 'LAPANGAN', mulai, selesai, alasan: 'Off roster' }, budi); assert(r.ok, r.error); no = r.data.no; assert(/^CUTI-\d{6}-007$/.test(no), no); });
t('bentrok', () => { const r = call('ajukan', { jenis: 'TAHUNAN', mulai: L.tambahHari(mulai, 2), selesai: L.tambahHari(mulai, 3), alasan: 'x' }, budi); assert(!r.ok); assert(/bentrok/.test(r.error)); });
t('karyawan tak boleh antrian', () => assert.strictEqual(call('antrian', {}, budi).kode, 'DITOLAK'));
t('karyawan tak boleh putuskan', () => assert.strictEqual(call('putuskan', { no, keputusan: 'setujui' }, budi).kode, 'DITOLAK'));
t('agus tak boleh lihat detail budi', () => assert.strictEqual(call('detail', { no }, login('90023')).kode, 'DITOLAK'));
t('head belum bisa (tahap 1)', () => assert.strictEqual(call('putuskan', { no, keputusan: 'setujui' }, login('90020')).kode, 'DITOLAK'));
const urut = ['90021', '90020', '90011', '90001'];
t('rantai approval', () => urut.forEach((nik, i) => {
  const tk = login(nik);
  assert(call('antrian', {}, tk).data.items.some(x => x.no === no), 'antrian ' + nik);
  const r = call('putuskan', { no, keputusan: 'setujui' }, tk); assert(r.ok, r.error);
  if (i === 3) assert.strictEqual(r.data.status, 'DISETUJUI');
}));
t('sudah diproses', () => assert.strictEqual(call('putuskan', { no, keputusan: 'setujui' }, login('90001')).kode, 'SUDAH_DIPROSES'));
t('saldo terpotong', () => { const s = call('beranda', {}, budi).data.saldo.find(s => s.jenis === 'LAPANGAN'); assert.strictEqual(s.saldo, 0); });
t('mutasi PAKAI', () => assert(call('mutasi', {}, budi).data.items.some(m => m.tipe === 'PAKAI' && m.refNo === no)));
t('HR batal -> saldo kembali', () => { const hr = login('90011'); assert(!call('batal', { no }, hr).ok); assert(call('batal', { no, alasan: 'Tidak jadi berangkat' }, hr).ok);
  assert.strictEqual(call('beranda', {}, budi).data.saldo.find(s => s.jenis === 'LAPANGAN').saldo, 14); });
t('tolak wajib catatan + email', () => {
  const r = call('ajukan', { jenis: 'TAHUNAN', mulai, selesai: L.tambahHari(mulai, 1), alasan: 'x' }, budi); assert(r.ok, r.error);
  const yu = login('90021'); assert.strictEqual(call('putuskan', { no: r.data.no, keputusan: 'tolak' }, yu).kode, 'VALIDASI');
  assert(call('putuskan', { no: r.data.no, keputusan: 'tolak', catatan: 'Unit kurang operator' }, yu).ok);
  assert(call('demoEmail', {}).data.items[0].subjek.indexOf('ditolak') >= 0);
});
t('lewati tahap: head mengajukan', () => {
  const he = login('90020'); const r = call('ajukan', { jenis: 'TAHUNAN', mulai, selesai: mulai, alasan: 'x' }, he); assert(r.ok, r.error);
  assert.strictEqual(r.data.tahap, 1); // atasan = GM
  assert(call('putuskan', { no: r.data.no, keputusan: 'setujui' }, login('90001')).ok);
  const d = call('detail', { no: r.data.no }, he).data; assert.strictEqual(d.pengajuan.tahap, 3); // tahap 2 dilewati (head = pengaju)
});
t('penyesuaian', () => { const hr = login('90011'); assert(!call('penyesuaian', { nik: '90022', jenis: 'TAHUNAN', jumlah: 1.5, alasan: 'a' }, hr).ok);
  assert(!call('penyesuaian', { nik: '90022', jenis: 'TAHUNAN', jumlah: 1 }, hr).ok);
  assert(call('penyesuaian', { nik: '90022', jenis: 'TAHUNAN', jumlah: 1, alasan: 'Koreksi lembur' }, hr).ok);
  assert.strictEqual(call('penyesuaian', { nik: '90022', jenis: 'TAHUNAN', jumlah: 1, alasan: 'x' }, budi).kode, 'DITOLAK'); });
t('reset pin + wajib ganti', () => {
  const r = call('resetPin', { nik: '90023' }, login('90011')); assert(r.ok);
  const l = call('login', { nik: '90023', pin: r.data.pinSementara }); assert(l.data.wajibGantiPin);
  assert.strictEqual(call('beranda', {}, l.data.token).kode, 'DITOLAK');
  assert(!call('gantiPin', { pinLama: r.data.pinSementara, pinBaru: '123456' }, l.data.token).ok);
  assert(call('gantiPin', { pinLama: r.data.pinSementara, pinBaru: '583920' }, l.data.token).ok);
  assert(call('beranda', {}, l.data.token).ok);
});
t('admin dept beda dept ditolak', () => assert.strictEqual(call('resetPin', { nik: '90022' }, login('90033')).kode, 'DITOLAK'));
t('kunci 5x', () => { for (let i = 0; i < 4; i++) assert.strictEqual(call('login', { nik: '90032', pin: '000000' }).kode, 'VALIDASI');
  assert.strictEqual(call('login', { nik: '90032', pin: '000000' }).kode, 'TERKUNCI'); assert.strictEqual(call('login', { nik: '90032', pin: '123456' }).kode, 'TERKUNCI'); });
t('token salah', () => assert.strictEqual(call('beranda', {}, 'ngawur').kode, 'BELUM_LOGIN'));
t('rekap', () => { const r = call('rekap', {}, login('90001')); assert(r.ok); assert(r.data.baris.length >= 3); assert.strictEqual(call('rekap', {}, budi).kode, 'DITOLAK'); });
t('libur dilewati', () => { const tahun = hariIni.slice(0, 4); const h = call('hitung', { jenis: 'TAHUNAN', mulai: tahun + '-12-21', selesai: tahun + '-12-25' }, login('90033')).data;
  assert.strictEqual(h.jumlahHari, 3); assert.strictEqual(h.liburDilewati.length, 2); });
console.log('Mock: ' + n + ' tes lulus');
