/* Logika murni Cuti Online. Tanpa DOM, tanpa storage.
   Dipakai mock.js sekarang, dan disalin jadi gas/Logika.gs di fase 6. */
(function (root) {
  'use strict';

  var JENIS = {
    TAHUNAN: { label: 'Cuti tahunan', satuan: 'hari kerja' },
    LAPANGAN: { label: 'Cuti lapangan', satuan: 'hari kalender' },
    OUTSTANDING: { label: 'Cuti outstanding', satuan: 'hari kerja' }
  };
  var TAHAP = { 1: 'Atasan', 2: 'Head Dept', 3: 'HR', 4: 'GM' };
  var PERAN_TAHAP = { 1: 'atasan', 2: 'head', 3: 'hr', 4: 'gm' };

  function keTanggal(s) {
    if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
    var p = s.split('-').map(Number);
    var d = new Date(Date.UTC(p[0], p[1] - 1, p[2]));
    if (d.getUTCFullYear() !== p[0] || d.getUTCMonth() !== p[1] - 1 || d.getUTCDate() !== p[2]) return null;
    return d;
  }
  function keIso(d) { return d.toISOString().slice(0, 10); }
  function tambahHari(iso, n) { var d = keTanggal(iso); d.setUTCDate(d.getUTCDate() + n); return keIso(d); }
  function selisihHari(a, b) { return Math.round((keTanggal(b) - keTanggal(a)) / 86400000); }

  // Hitung jumlah hari cuti. libur = [{tanggal, keterangan}]
  function hitungHari(jenis, mulai, selesai, libur) {
    if (!JENIS[jenis]) throw new Error('Jenis cuti tidak dikenal');
    var a = keTanggal(mulai), b = keTanggal(selesai);
    if (!a || !b) throw new Error('Tanggal mulai dan selesai wajib diisi');
    if (a > b) throw new Error('Tanggal selesai tidak boleh sebelum tanggal mulai');
    var rentang = selisihHari(mulai, selesai) + 1;
    if (rentang > 60) throw new Error('Rentang cuti maksimal 60 hari kalender');
    if (jenis === 'LAPANGAN') return { jumlahHari: rentang, satuan: JENIS[jenis].satuan, liburDilewati: [] };
    var petaLibur = {};
    (libur || []).forEach(function (l) { petaLibur[l.tanggal] = l.keterangan; });
    var n = 0, lewat = [];
    for (var i = 0; i < rentang; i++) {
      var iso = tambahHari(mulai, i);
      var hari = keTanggal(iso).getUTCDay();
      if (hari === 0 || hari === 6) continue;
      if (petaLibur[iso] !== undefined) { lewat.push({ tanggal: iso, keterangan: petaLibur[iso] }); continue; }
      n++;
    }
    return { jumlahHari: n, satuan: JENIS[jenis].satuan, liburDilewati: lewat };
  }

  // Cari pengajuan aktif yang tumpang tindih
  function cekBentrok(pengajuan, mulai, selesai, kecualiNo) {
    for (var i = 0; i < pengajuan.length; i++) {
      var p = pengajuan[i];
      if (p.no === kecualiNo) continue;
      if (p.status !== 'MENUNGGU' && p.status !== 'DISETUJUI') continue;
      if (p.mulai <= selesai && mulai <= p.selesai) return p;
    }
    return null;
  }

  // saldo = jumlah mutasi; tersedia = saldo - hari yang masih MENUNGGU
  function saldoDari(mutasi, pengajuan, jenis) {
    var saldo = 0, menunggu = 0;
    mutasi.forEach(function (m) { if (m.jenis === jenis) saldo += m.jumlah; });
    pengajuan.forEach(function (p) { if (p.jenis === jenis && p.status === 'MENUNGGU') menunggu += p.jumlahHari; });
    return { jenis: jenis, label: JENIS[jenis].label, saldo: saldo, menunggu: menunggu, tersedia: saldo - menunggu };
  }

  // Tentukan tahap berikutnya mulai dari `dari`, lewati yang approvernya kosong
  // atau satu-satunya approver = yang barusan setuju. approverTahap(t) -> [nik] tanpa pengaju.
  function tahapBerikut(dari, approverTahap, nikTerakhir) {
    var dilewati = [];
    for (var t = dari; t <= 4; t++) {
      var daftar = approverTahap(t);
      if (daftar.length === 0) { dilewati.push({ tahap: t, alasan: 'Tidak ada approver lain' }); continue; }
      if (nikTerakhir && daftar.length === 1 && daftar[0] === nikTerakhir) {
        dilewati.push({ tahap: t, alasan: 'Approver sama dengan tahap sebelumnya' }); continue;
      }
      return { tahap: t, dilewati: dilewati };
    }
    return { tahap: null, dilewati: dilewati }; // semua tahap habis -> DISETUJUI
  }

  function labelStatus(p) {
    if (p.status === 'MENUNGGU') return 'Menunggu ' + TAHAP[p.tahap];
    if (p.status === 'DISETUJUI') return 'Disetujui';
    if (p.status === 'DITOLAK') return 'Ditolak di tahap ' + TAHAP[p.tahap];
    if (p.status === 'DIBATALKAN') return 'Dibatalkan';
    return p.status;
  }

  function pinLemah(pin, nik) {
    if (!/^\d{6}$/.test(pin)) return 'PIN harus 6 angka';
    if (/^(\d)\1{5}$/.test(pin)) return 'PIN tidak boleh angka sama semua';
    if ('0123456789'.indexOf(pin) >= 0 || '9876543210'.indexOf(pin) >= 0) return 'PIN tidak boleh angka berurutan';
    if (nik && String(nik).indexOf(pin) >= 0) return 'PIN tidak boleh bagian dari NIK';
    return '';
  }

  var L = { JENIS: JENIS, TAHAP: TAHAP, PERAN_TAHAP: PERAN_TAHAP, keTanggal: keTanggal, keIso: keIso,
    tambahHari: tambahHari, selisihHari: selisihHari, hitungHari: hitungHari, cekBentrok: cekBentrok,
    saldoDari: saldoDari, tahapBerikut: tahapBerikut, labelStatus: labelStatus, pinLemah: pinLemah };
  if (typeof module !== 'undefined' && module.exports) module.exports = L; else root.Logika = L;
})(this);
