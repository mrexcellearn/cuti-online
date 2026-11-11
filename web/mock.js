/* Mock server Cuti Online. Meniru kontrak docs/api.md, data fiktif di localStorage.
   Dipanggil lewat api.js; tidak pernah dipanggil layar langsung. */
(function (root) {
  'use strict';
  var L = root.Logika || (typeof require !== 'undefined' ? require('./logika.js') : null);
  var KUNCI = 'cuti-demo-v1';
  var PIN_DEMO = '123456';
  var memori = null; // cadangan kalau localStorage tidak bisa dipakai

  // ---------- util ----------
  function hariIni() {
    var d = new Date(Date.now() + 7 * 3600000); // Asia/Jakarta
    return d.toISOString().slice(0, 10);
  }
  function sekarang() {
    var d = new Date(Date.now() + 7 * 3600000);
    return d.toISOString().slice(0, 19).replace('T', ' ');
  }
  function err(pesan, kode) { var e = new Error(pesan); e.kode = kode || 'VALIDASI'; return e; }
  function acak(n) {
    var s = '', h = 'abcdefghijklmnopqrstuvwxyz0123456789';
    for (var i = 0; i < n; i++) s += h[Math.floor(Math.random() * h.length)];
    return s;
  }
  function salin(o) { return JSON.parse(JSON.stringify(o)); }

  // ---------- data awal ----------
  function dataAwal() {
    var t = hariIni();
    var tahun = t.slice(0, 4);
    var ym = t.slice(0, 4) + t.slice(5, 7);
    // cari Senin berikutnya supaya contoh tanggal masuk akal
    var senin = t; while (L.keTanggal(senin).getUTCDay() !== 1) senin = L.tambahHari(senin, 1);
    var k = function (nik, nama, dept, jabatan, peran, atasan, pola, masuk) {
      return { nik: nik, nama: nama, dept: dept, jabatan: jabatan, email: nama.split(' ')[0].toLowerCase() + '@contoh.co.id',
        peran: ['karyawan'].concat(peran), nikAtasan: atasan, pola: pola, tglMasuk: masuk, aktif: true };
    };
    var karyawan = [
      k('90001', 'Andi Pratama', 'Manajemen', 'General Manager', ['gm'], '', 'kantor', '2015-02-01'),
      k('90010', 'Sinta Wulandari', 'HR & GA', 'HR Manager', ['hr', 'head', 'atasan'], '90001', 'kantor', '2017-06-12'),
      k('90011', 'Rina Kartika', 'HR & GA', 'HR Officer', ['hr'], '90010', 'kantor', '2020-01-06'),
      k('90020', 'Hendra Saputra', 'Produksi', 'Head Produksi', ['head', 'atasan'], '90001', 'lapangan', '2016-09-01'),
      k('90021', 'Yusuf Mahendra', 'Produksi', 'Supervisor Tambang', ['atasan'], '90020', 'lapangan', '2018-04-16'),
      k('90022', 'Budi Santoso', 'Produksi', 'Operator Dump Truck', [], '90021', 'lapangan', '2021-03-15'),
      k('90023', 'Agus Salim', 'Produksi', 'Operator Excavator', [], '90021', 'lapangan', '2022-07-04'),
      k('90030', 'Dewi Lestari', 'Plant/Maintenance', 'Head Plant', ['head', 'atasan'], '90001', 'kantor', '2016-11-21'),
      k('90031', 'Rahmat Hidayat', 'Plant/Maintenance', 'Foreman Mekanik', ['atasan'], '90030', 'lapangan', '2019-02-11'),
      k('90032', 'Joko Susilo', 'Plant/Maintenance', 'Mekanik Alat Berat', [], '90031', 'lapangan', '2021-10-01'),
      k('90033', 'Maya Sari', 'Plant/Maintenance', 'Admin Plant', ['admin'], '90031', 'kantor', '2023-01-09')
    ];
    var akun = {};
    karyawan.forEach(function (x) { akun[x.nik] = { pin: PIN_DEMO, wajibGanti: false, gagal: 0, kunciSampai: 0 }; });

    var mutasi = [], idm = 0;
    var m = function (nik, jenis, jumlah, tipe, alasan, refNo, tgl) {
      mutasi.push({ id: 'M' + (++idm), nik: nik, jenis: jenis, tanggal: tgl || (tahun + '-01-01'), jumlah: jumlah, tipe: tipe,
        refNo: refNo || '', alasan: alasan, oleh: '90010', dibuat: (tgl || tahun + '-01-01') + ' 08:00:00' });
    };
    karyawan.forEach(function (x, i) {
      m(x.nik, 'TAHUNAN', 12, 'HAK', 'Hak cuti tahunan ' + tahun);
      m(x.nik, 'OUTSTANDING', [3, 2, 4, 1, 5, 3, 2, 0, 4, 2, 1][i], 'SESUAI', 'Saldo awal per ' + tahun + '-01-01 (sisa ' + (tahun - 1) + ')');
      if (x.pola === 'lapangan') m(x.nik, 'LAPANGAN', 14, 'HAK', 'Hak cuti lapangan siklus ' + tahun + '-IV');
    });

    var pengajuan = [], log = [], no = 0;
    var p = function (nik, jenis, mulai, selesai, alasan, status, tahap, jejak) {
      var nomor = 'CUTI-' + ym + '-' + ('000' + (++no)).slice(-3);
      var j = L.hitungHari(jenis, mulai, selesai, libur).jumlahHari;
      var dibuat = L.tambahHari(t, -3) + ' 07:1' + no + ':00';
      pengajuan.push({ no: nomor, nik: nik, jenis: jenis, mulai: mulai, selesai: selesai, jumlahHari: j, alasan: alasan,
        status: status, tahap: tahap, diinputOleh: nik, dibuat: dibuat, diperbarui: dibuat });
      log.push({ waktu: dibuat, nik: nik, aksi: 'AJUKAN', no: nomor, tahap: 1, catatan: '' });
      (jejak || []).forEach(function (x, i) {
        log.push({ waktu: L.tambahHari(t, -2 + i) + ' 09:0' + i + ':00', nik: x[0], aksi: x[1], no: nomor, tahap: x[2], catatan: x[3] || '' });
      });
      if (status === 'DISETUJUI') m(nik, jenis, -j, 'PAKAI', 'Cuti disetujui', nomor, L.tambahHari(t, -1));
      return nomor;
    };
    var libur = [
      { tanggal: tahun + '-12-24', keterangan: 'Cuti bersama Natal' },
      { tanggal: tahun + '-12-25', keterangan: 'Hari Raya Natal' },
      { tanggal: (Number(tahun) + 1) + '-01-01', keterangan: 'Tahun Baru Masehi' },
      { tanggal: (Number(tahun) + 1) + '-02-06', keterangan: 'Tahun Baru Imlek' }
    ];
    var s2 = L.tambahHari(senin, 7), s3 = L.tambahHari(senin, 14);
    p('90023', 'LAPANGAN', L.tambahHari(s2, 5), L.tambahHari(s2, 18), 'Pulang kampung ke Gorontalo, jadwal off roster', 'MENUNGGU', 1);
    p('90032', 'TAHUNAN', s2, L.tambahHari(s2, 2), 'Acara pernikahan adik', 'MENUNGGU', 2, [['90031', 'SETUJU', 1]]);
    p('90033', 'TAHUNAN', L.tambahHari(s3, 3), L.tambahHari(s3, 4), 'Urusan keluarga', 'MENUNGGU', 3,
      [['90031', 'SETUJU', 1], ['90030', 'SETUJU', 2]]);
    p('90031', 'TAHUNAN', L.tambahHari(senin, 4), L.tambahHari(senin, 4), 'Mengurus perpanjangan SIM', 'MENUNGGU', 4,
      [['90030', 'SETUJU', 1], ['90030', 'LEWATI', 2, 'Approver sama dengan tahap sebelumnya'], ['90011', 'SETUJU', 3]]);
    p('90022', 'TAHUNAN', L.tambahHari(s3, 0), L.tambahHari(s3, 1), 'Kontrol kesehatan di Manado', 'DISETUJUI', 4,
      [['90021', 'SETUJU', 1], ['90020', 'SETUJU', 2], ['90011', 'SETUJU', 3], ['90001', 'SETUJU', 4]]);
    p('90022', 'LAPANGAN', L.tambahHari(senin, 1), L.tambahHari(senin, 10), 'Off roster lebih awal', 'DITOLAK', 2,
      [['90021', 'SETUJU', 1], ['90020', 'TOLAK', 2, 'Bentrok jadwal overhaul unit DT-07. Ajukan setelah tanggal ' + L.tambahHari(senin, 12) + '.']]);

    return { versi: 1, karyawan: karyawan, akun: akun, sesi: {}, pengajuan: pengajuan, mutasi: mutasi, log: log, libur: libur, email: [], idm: idm };
  }

  // ---------- storage ----------
  function muat() {
    if (memori) return memori;
    try {
      var s = root.localStorage && root.localStorage.getItem(KUNCI);
      if (s) { memori = JSON.parse(s); return memori; }
    } catch (e) { /* storage diblokir, pakai memori */ }
    memori = dataAwal();
    simpan();
    return memori;
  }
  function simpan() { try { root.localStorage && root.localStorage.setItem(KUNCI, JSON.stringify(memori)); } catch (e) { } }

  // ---------- bantu domain ----------
  function karyawanNik(db, nik) { return db.karyawan.filter(function (k) { return k.nik === String(nik); })[0]; }
  function punya(u, peran) { return u.peran.indexOf(peran) >= 0; }
  function adaPeran(u, daftar) { return daftar.some(function (r) { return punya(u, r); }); }
  function wajibPeran(u, daftar) { if (!adaPeran(u, daftar)) throw err('Anda tidak punya akses untuk aksi ini', 'DITOLAK'); }
  function infoUser(u) { return { nik: u.nik, nama: u.nama, dept: u.dept, jabatan: u.jabatan, peran: u.peran, pola: u.pola }; }
  function jenisBerhak(u) { return u.pola === 'lapangan' ? ['LAPANGAN', 'TAHUNAN', 'OUTSTANDING'] : ['TAHUNAN', 'OUTSTANDING']; }

  function approverTahap(db, p, t) {
    var peng = karyawanNik(db, p.nik);
    var hasil = db.karyawan.filter(function (k) {
      if (!k.aktif || k.nik === p.nik) return false;
      if (t === 1) return k.nik === peng.nikAtasan;
      if (t === 2) return punya(k, 'head') && k.dept === peng.dept;
      if (t === 3) return punya(k, 'hr');
      return punya(k, 'gm');
    });
    return hasil.map(function (k) { return k.nik; });
  }
  function bisaPutuskan(db, u, p) { return p.status === 'MENUNGGU' && approverTahap(db, p, p.tahap).indexOf(u.nik) >= 0; }

  function saldoNik(db, nik) {
    var u = karyawanNik(db, nik);
    var mut = db.mutasi.filter(function (m) { return m.nik === nik; });
    var pg = db.pengajuan.filter(function (p) { return p.nik === nik; });
    return jenisBerhak(u).map(function (j) { return L.saldoDari(mut, pg, j); });
  }
  function jadiPengajuan(db, p) {
    var u = karyawanNik(db, p.nik);
    var o = salin(p); o.nama = u.nama; o.dept = u.dept; o.labelStatus = L.labelStatus(p);
    return o;
  }
  function catatLog(db, nik, aksi, no, tahap, catatan) {
    db.log.push({ waktu: sekarang(), nik: nik, aksi: aksi, no: no, tahap: tahap, catatan: catatan || '' });
  }
  function kirimEmail(db, nikTujuan, subjek, isi) {
    var u = karyawanNik(db, nikTujuan);
    db.email.unshift({ waktu: sekarang(), ke: u.email, nama: u.nama, subjek: subjek, isi: isi });
    if (db.email.length > 60) db.email.length = 60;
  }
  function emailKeApprover(db, p) {
    var peng = karyawanNik(db, p.nik);
    approverTahap(db, p, p.tahap).forEach(function (nik) {
      kirimEmail(db, nik, 'Menunggu persetujuan Anda: ' + p.no,
        peng.nama + ' (' + peng.dept + ') mengajukan ' + L.JENIS[p.jenis].label.toLowerCase() + ' ' + p.mulai + ' s/d ' + p.selesai +
        ' (' + p.jumlahHari + ' ' + L.JENIS[p.jenis].satuan + '). Tahap Anda: ' + L.TAHAP[p.tahap] + '. Buka aplikasi Cuti Online untuk memproses.');
    });
  }
  // majukan ke tahap berikut mulai `dari`; kembalikan true kalau final
  function majukan(db, p, dari, nikTerakhir) {
    var r = L.tahapBerikut(dari, function (t) { return approverTahap(db, p, t); }, nikTerakhir);
    r.dilewati.forEach(function (x) { catatLog(db, nikTerakhir || p.nik, 'LEWATI', p.no, x.tahap, x.alasan); });
    p.diperbarui = sekarang();
    if (r.tahap === null) {
      p.status = 'DISETUJUI'; p.tahap = 4;
      db.mutasi.push({ id: 'M' + (++db.idm), nik: p.nik, jenis: p.jenis, tanggal: hariIni(), jumlah: -p.jumlahHari, tipe: 'PAKAI',
        refNo: p.no, alasan: 'Cuti disetujui', oleh: nikTerakhir || p.nik, dibuat: sekarang() });
      kirimEmail(db, p.nik, 'Cuti disetujui: ' + p.no, 'Pengajuan ' + L.JENIS[p.jenis].label.toLowerCase() + ' Anda ' + p.mulai + ' s/d ' +
        p.selesai + ' (' + p.jumlahHari + ' hari) sudah disetujui final. Saldo sudah dipotong.');
      return true;
    }
    p.tahap = r.tahap;
    emailKeApprover(db, p);
    return false;
  }

  function cekPengajuanBaru(db, u, d) {
    if (jenisBerhak(u).indexOf(d.jenis) < 0) throw err(L.JENIS[d.jenis] ? L.JENIS[d.jenis].label + ' hanya untuk karyawan pola lapangan' : 'Pilih jenis cuti');
    var h;
    try { h = L.hitungHari(d.jenis, d.mulai, d.selesai, db.libur); } catch (e) { throw err(e.message); }
    var saldo = saldoNik(db, u.nik).filter(function (s) { return s.jenis === d.jenis; })[0];
    var pesan = '';
    if (d.mulai < hariIni()) pesan = 'Tanggal mulai tidak boleh sebelum hari ini';
    else if (h.jumlahHari === 0) pesan = 'Rentang ini tidak berisi hari kerja (akhir pekan / libur semua)';
    else {
      var milik = db.pengajuan.filter(function (p) { return p.nik === u.nik; });
      var b = L.cekBentrok(milik, d.mulai, d.selesai);
      if (b) pesan = 'Tanggal bentrok dengan pengajuan ' + b.no + ' (' + b.mulai + ' s/d ' + b.selesai + ', ' + L.labelStatus(b).toLowerCase() + ')';
      else if (h.jumlahHari > saldo.tersedia) pesan = 'Saldo ' + saldo.label.toLowerCase() + ' tidak cukup: butuh ' + h.jumlahHari + ' hari, tersedia ' + saldo.tersedia + ' hari';
    }
    return { jumlahHari: h.jumlahHari, satuan: h.satuan, liburDilewati: h.liburDilewati, saldo: saldo,
      sisaSesudah: saldo.tersedia - h.jumlahHari, boleh: !pesan, pesan: pesan };
  }

  function halaman(arr, d) {
    var limit = Math.min(Math.max(Number(d.limit) || 20, 1), 100), offset = Math.max(Number(d.offset) || 0, 0);
    return { items: arr.slice(offset, offset + limit), total: arr.length };
  }
  function lawanCari(q, teks) { return !q || teks.toLowerCase().indexOf(String(q).toLowerCase().trim()) >= 0; }

  // ---------- aksi ----------
  var AKSI = {};

  AKSI.login = { publik: true, fn: function (db, d) {
    var nik = String(d.nik || '').trim(), pin = String(d.pin || '');
    if (!nik || !pin) throw err('NIK dan PIN wajib diisi');
    var u = karyawanNik(db, nik), a = db.akun[nik];
    if (!u || !a) throw err('NIK atau PIN salah');
    if (!u.aktif) throw err('NIK tidak aktif. Hubungi HR.');
    if (a.kunciSampai > Date.now()) {
      var j = new Date(a.kunciSampai + 7 * 3600000).toISOString().slice(11, 16);
      throw err('Akun terkunci karena PIN salah 5 kali. Coba lagi pukul ' + j + ' atau minta reset PIN ke HR / admin dept.', 'TERKUNCI');
    }
    if (a.pin !== pin) {
      a.gagal++;
      if (a.gagal >= 5) { a.kunciSampai = Date.now() + 15 * 60000; a.gagal = 0; catatLog(db, nik, 'KUNCI', '', '', 'PIN salah 5x');
        throw err('PIN salah 5 kali. Akun terkunci 15 menit.', 'TERKUNCI'); }
      throw err('NIK atau PIN salah (sisa ' + (5 - a.gagal) + ' percobaan)');
    }
    a.gagal = 0;
    var token = acak(32), umur = d.ingat ? 30 * 86400000 : 12 * 3600000;
    db.sesi[token] = { nik: nik, kedaluwarsa: Date.now() + umur, dicabut: false };
    catatLog(db, nik, 'LOGIN', '', '', d.ingat ? 'ingat 30 hari' : '');
    return { token: token, kedaluwarsa: Date.now() + umur, user: infoUser(u), wajibGantiPin: a.wajibGanti };
  } };

  AKSI.logout = { fn: function (db, d, u, token) { delete db.sesi[token]; return {}; } };

  AKSI.gantiPin = { bolehWajibGanti: true, fn: function (db, d, u) {
    var a = db.akun[u.nik];
    if (String(d.pinLama) !== a.pin) throw err('PIN lama salah');
    var lemah = L.pinLemah(String(d.pinBaru || ''), u.nik);
    if (lemah) throw err(lemah);
    if (d.pinBaru === a.pin) throw err('PIN baru harus beda dengan PIN lama');
    a.pin = String(d.pinBaru); a.wajibGanti = false;
    catatLog(db, u.nik, 'GANTI_PIN', '', '', '');
    return {};
  } };

  AKSI.beranda = { fn: function (db, d, u) {
    var milik = db.pengajuan.filter(function (p) { return p.nik === u.nik; }).sort(function (a, b) { return b.dibuat < a.dibuat ? -1 : 1; });
    var antrian = db.pengajuan.filter(function (p) { return bisaPutuskan(db, u, p); }).length;
    return { user: infoUser(u), saldo: saldoNik(db, u.nik), terakhir: milik.slice(0, 3).map(function (p) { return jadiPengajuan(db, p); }),
      antrianSaya: antrian, hariIni: hariIni() };
  } };

  AKSI.hitung = { fn: function (db, d, u) { return cekPengajuanBaru(db, u, d); } };

  AKSI.ajukan = { fn: function (db, d, u) {
    var alasan = String(d.alasan || '').trim();
    var c = cekPengajuanBaru(db, u, d);
    if (!c.boleh) throw err(c.pesan);
    if (!alasan) throw err('Alasan wajib diisi');
    if (alasan.length > 300) throw err('Alasan maksimal 300 karakter');
    var awal = 'CUTI-' + hariIni().slice(0, 4) + hariIni().slice(5, 7) + '-', maks = 0;
    db.pengajuan.forEach(function (p) { if (p.no.indexOf(awal) === 0) maks = Math.max(maks, parseInt(p.no.slice(awal.length), 10) || 0); });
    var p = { no: awal + ('000' + (maks + 1)).slice(-3), nik: u.nik, jenis: d.jenis, mulai: d.mulai, selesai: d.selesai,
      jumlahHari: c.jumlahHari, alasan: alasan, status: 'MENUNGGU', tahap: 1, diinputOleh: u.nik, dibuat: sekarang(), diperbarui: sekarang() };
    db.pengajuan.push(p);
    catatLog(db, u.nik, 'AJUKAN', p.no, 1, '');
    majukan(db, p, 1, null);
    return { no: p.no, status: p.status, tahap: p.tahap, labelStatus: L.labelStatus(p) };
  } };

  AKSI.riwayat = { fn: function (db, d, u) {
    var arr = db.pengajuan.filter(function (p) { return p.nik === u.nik && (!d.status || p.status === d.status); })
      .sort(function (a, b) { return b.dibuat < a.dibuat ? -1 : 1; }).map(function (p) { return jadiPengajuan(db, p); });
    return halaman(arr, d);
  } };

  function cariNo(db, no) {
    var p = db.pengajuan.filter(function (x) { return x.no === no; })[0];
    if (!p) throw err('Pengajuan tidak ditemukan');
    return p;
  }

  AKSI.detail = { fn: function (db, d, u) {
    var p = cariNo(db, d.no);
    var pernah = db.log.some(function (l) { return l.no === p.no && l.nik === u.nik; });
    var boleh = p.nik === u.nik || adaPeran(u, ['hr', 'gm']) || pernah || bisaPutuskan(db, u, p) ||
      (punya(u, 'admin') && karyawanNik(db, p.nik).dept === u.dept);
    if (!boleh) throw err('Anda tidak punya akses ke pengajuan ini', 'DITOLAK');
    var log = db.log.filter(function (l) { return l.no === p.no; });
    var jejak = log.map(function (l) { var k = karyawanNik(db, l.nik); return { waktu: l.waktu, nik: l.nik, nama: k ? k.nama : l.nik, aksi: l.aksi, tahap: l.tahap, catatan: l.catatan }; });
    var tahapan = [1, 2, 3, 4].map(function (t) {
      var x = jejak.filter(function (j) { return j.tahap === t && j.aksi !== 'AJUKAN'; }).pop();
      var st = 'menunggu';
      if (x) st = x.aksi === 'SETUJU' ? 'selesai' : x.aksi === 'TOLAK' ? 'tolak' : x.aksi === 'LEWATI' ? 'lewat' : 'menunggu';
      if (!x && p.status === 'MENUNGGU' && p.tahap === t) st = 'aktif';
      if (!x && p.status !== 'MENUNGGU') st = 'kosong';
      var calon = st === 'aktif' ? approverTahap(db, p, t).map(function (n) { return karyawanNik(db, n).nama; }) : [];
      return { tahap: t, label: L.TAHAP[t], status: st, oleh: x ? x.nama : '', waktu: x ? x.waktu : '', catatan: x ? x.catatan : '', calon: calon };
    });
    var hasil = { pengajuan: jadiPengajuan(db, p), jejak: jejak, tahapan: tahapan,
      bisaBatal: p.nik === u.nik && p.status === 'MENUNGGU',
      bisaBatalHr: punya(u, 'hr') && p.status === 'DISETUJUI',
      bisaPutuskan: bisaPutuskan(db, u, p) };
    if (hasil.bisaPutuskan || punya(u, 'hr')) {
      hasil.saldoPengaju = saldoNik(db, p.nik).filter(function (s) { return s.jenis === p.jenis; })[0];
      var peng = karyawanNik(db, p.nik);
      hasil.bersamaan = db.pengajuan.filter(function (x) {
        return x.no !== p.no && (x.status === 'MENUNGGU' || x.status === 'DISETUJUI') && karyawanNik(db, x.nik).dept === peng.dept &&
          x.mulai <= p.selesai && p.mulai <= x.selesai;
      }).map(function (x) { return jadiPengajuan(db, x); });
    }
    return hasil;
  } };

  AKSI.batal = { fn: function (db, d, u) {
    var p = cariNo(db, d.no), alasan = String(d.alasan || '').trim();
    if (p.nik === u.nik && p.status === 'MENUNGGU') {
      p.status = 'DIBATALKAN'; p.diperbarui = sekarang();
      catatLog(db, u.nik, 'BATAL', p.no, p.tahap, alasan || 'Dibatalkan pengaju');
      return { status: p.status };
    }
    if (punya(u, 'hr') && p.status === 'DISETUJUI') {
      if (!alasan) throw err('Alasan pembatalan wajib diisi');
      p.status = 'DIBATALKAN'; p.diperbarui = sekarang();
      db.mutasi.push({ id: 'M' + (++db.idm), nik: p.nik, jenis: p.jenis, tanggal: hariIni(), jumlah: p.jumlahHari, tipe: 'BATAL',
        refNo: p.no, alasan: alasan, oleh: u.nik, dibuat: sekarang() });
      catatLog(db, u.nik, 'BATAL', p.no, 4, alasan);
      kirimEmail(db, p.nik, 'Cuti dibatalkan HR: ' + p.no, 'Cuti ' + p.mulai + ' s/d ' + p.selesai + ' dibatalkan oleh HR. Alasan: ' + alasan + '. Saldo dikembalikan ' + p.jumlahHari + ' hari.');
      return { status: p.status };
    }
    if (p.status !== 'MENUNGGU' && p.status !== 'DISETUJUI') throw err('Pengajuan ini sudah ' + L.labelStatus(p).toLowerCase(), 'SUDAH_DIPROSES');
    throw err('Anda tidak bisa membatalkan pengajuan ini', 'DITOLAK');
  } };

  AKSI.antrian = { peran: ['atasan', 'head', 'hr', 'gm'], fn: function (db, d, u) {
    var semua = db.pengajuan.filter(function (p) { return bisaPutuskan(db, u, p); });
    var depts = []; semua.forEach(function (p) { var dp = karyawanNik(db, p.nik).dept; if (depts.indexOf(dp) < 0) depts.push(dp); });
    var arr = semua.map(function (p) { var o = jadiPengajuan(db, p); o.lamaMenungguHari = Math.max(0, L.selisihHari(p.diperbarui.slice(0, 10), hariIni())); return o; })
      .filter(function (p) { return (!d.dept || p.dept === d.dept) && lawanCari(d.cari, p.nama + ' ' + p.nik + ' ' + p.no); })
      .sort(function (a, b) { return a.diperbarui < b.diperbarui ? -1 : 1; });
    var h = halaman(arr, d); h.dept = depts.sort(); return h;
  } };

  AKSI.putuskan = { peran: ['atasan', 'head', 'hr', 'gm'], fn: function (db, d, u) {
    var p = cariNo(db, d.no), catatan = String(d.catatan || '').trim();
    if (p.status !== 'MENUNGGU' || (d.tahap && Number(d.tahap) !== p.tahap)) throw err('Pengajuan ini sudah diproses (' + L.labelStatus(p).toLowerCase() + ')', 'SUDAH_DIPROSES');
    if (!bisaPutuskan(db, u, p)) throw err('Anda bukan approver tahap ' + L.TAHAP[p.tahap] + ' untuk pengajuan ini', 'DITOLAK');
    if (d.keputusan === 'tolak') {
      if (!catatan) throw err('Catatan wajib diisi saat menolak');
      p.status = 'DITOLAK'; p.diperbarui = sekarang();
      catatLog(db, u.nik, 'TOLAK', p.no, p.tahap, catatan);
      kirimEmail(db, p.nik, 'Cuti ditolak: ' + p.no, 'Pengajuan cuti ' + p.mulai + ' s/d ' + p.selesai + ' ditolak oleh ' + u.nama + ' (' + L.TAHAP[p.tahap] + '). Alasan: ' + catatan);
    } else if (d.keputusan === 'setujui') {
      catatLog(db, u.nik, 'SETUJU', p.no, p.tahap, catatan);
      majukan(db, p, p.tahap + 1, u.nik);
    } else throw err('Keputusan tidak dikenal');
    return { status: p.status, tahap: p.tahap, labelStatus: L.labelStatus(p) };
  } };

  AKSI.mutasi = { fn: function (db, d, u) {
    var nik = d.nik ? String(d.nik) : u.nik;
    if (nik !== u.nik && !punya(u, 'hr')) {
      var t = karyawanNik(db, nik);
      if (!(punya(u, 'admin') && t && t.dept === u.dept)) throw err('Anda tidak punya akses ke mutasi karyawan lain', 'DITOLAK');
    }
    var k = karyawanNik(db, nik); if (!k) throw err('Karyawan tidak ditemukan');
    var berjalan = {};
    var items = db.mutasi.filter(function (m) { return m.nik === nik && (!d.jenis || m.jenis === d.jenis); })
      .sort(function (a, b) { return a.dibuat < b.dibuat ? -1 : 1; })
      .map(function (m) {
        berjalan[m.jenis] = (berjalan[m.jenis] || 0) + m.jumlah;
        var o = salin(m); o.saldoBerjalan = berjalan[m.jenis]; var ol = karyawanNik(db, m.oleh); o.olehNama = ol ? ol.nama : m.oleh; return o;
      }).reverse();
    return { nik: nik, nama: k.nama, dept: k.dept, items: items, saldo: saldoNik(db, nik) };
  } };

  AKSI.saldoKaryawan = { peran: ['hr', 'admin'], fn: function (db, d, u) {
    var arr = db.karyawan.filter(function (k) { return k.aktif && (punya(u, 'hr') || k.dept === u.dept); });
    var depts = []; arr.forEach(function (k) { if (depts.indexOf(k.dept) < 0) depts.push(k.dept); });
    arr = arr.filter(function (k) { return (!d.dept || k.dept === d.dept) && lawanCari(d.cari, k.nama + ' ' + k.nik); })
      .map(function (k) { return { nik: k.nik, nama: k.nama, dept: k.dept, jabatan: k.jabatan, pola: k.pola, saldo: saldoNik(db, k.nik) }; });
    var h = halaman(arr, d); h.dept = depts.sort(); return h;
  } };

  AKSI.penyesuaian = { peran: ['hr'], fn: function (db, d, u) {
    var k = karyawanNik(db, d.nik); if (!k) throw err('Karyawan tidak ditemukan');
    if (jenisBerhak(k).indexOf(d.jenis) < 0) throw err('Jenis cuti ini tidak berlaku untuk karyawan tersebut');
    var j = Number(d.jumlah), alasan = String(d.alasan || '').trim();
    if (!Number.isInteger(j) || j === 0) throw err('Jumlah harus bilangan bulat dan tidak boleh 0');
    if (!alasan) throw err('Alasan penyesuaian wajib diisi');
    var s = saldoNik(db, k.nik).filter(function (x) { return x.jenis === d.jenis; })[0];
    if (s.saldo + j < 0) throw err('Saldo tidak boleh minus (saldo sekarang ' + s.saldo + ')');
    var m = { id: 'M' + (++db.idm), nik: k.nik, jenis: d.jenis, tanggal: hariIni(), jumlah: j, tipe: 'SESUAI', refNo: '', alasan: alasan, oleh: u.nik, dibuat: sekarang() };
    db.mutasi.push(m);
    catatLog(db, u.nik, 'SESUAI', '', '', k.nik + ' ' + d.jenis + ' ' + (j > 0 ? '+' : '') + j + ': ' + alasan);
    return { id: m.id, saldo: saldoNik(db, k.nik).filter(function (x) { return x.jenis === d.jenis; })[0] };
  } };

  AKSI.resetPin = { peran: ['hr', 'admin'], fn: function (db, d, u) {
    var k = karyawanNik(db, d.nik); if (!k) throw err('Karyawan tidak ditemukan');
    if (!punya(u, 'hr') && k.dept !== u.dept) throw err('Admin dept hanya bisa reset PIN karyawan dept sendiri', 'DITOLAK');
    var pin; do { pin = String(Math.floor(100000 + Math.random() * 900000)); } while (L.pinLemah(pin, k.nik));
    var a = db.akun[k.nik]; a.pin = pin; a.wajibGanti = true; a.gagal = 0; a.kunciSampai = 0;
    Object.keys(db.sesi).forEach(function (t) { if (db.sesi[t].nik === k.nik) delete db.sesi[t]; });
    catatLog(db, u.nik, 'RESET_PIN', '', '', k.nik);
    return { nik: k.nik, nama: k.nama, pinSementara: pin };
  } };

  AKSI.rekap = { peran: ['hr', 'gm'], fn: function (db, d) {
    var tahun = String(d.tahun || hariIni().slice(0, 4)), bulan = d.bulan ? ('0' + d.bulan).slice(-2) : '';
    var awal = tahun + '-' + (bulan || '01') + '-01', akhir = bulan ? tahun + '-' + bulan + '-31' : tahun + '-12-31';
    var per = {};
    db.karyawan.forEach(function (k) { if (!k.aktif) return; per[k.dept] = per[k.dept] || { dept: k.dept, karyawan: 0, menunggu: 0, disetujui: 0, ditolak: 0, hariDisetujui: 0 }; per[k.dept].karyawan++; });
    db.pengajuan.forEach(function (p) {
      if (p.mulai > akhir || p.selesai < awal) return;
      var r = per[karyawanNik(db, p.nik).dept];
      if (p.status === 'MENUNGGU') r.menunggu++;
      else if (p.status === 'DISETUJUI') { r.disetujui++; r.hariDisetujui += p.jumlahHari; }
      else if (p.status === 'DITOLAK') r.ditolak++;
    });
    var baris = Object.keys(per).sort().map(function (k) { return per[k]; });
    var total = baris.reduce(function (t, r) { ['karyawan', 'menunggu', 'disetujui', 'ditolak', 'hariDisetujui'].forEach(function (f) { t[f] += r[f]; }); return t; },
      { dept: 'Total', karyawan: 0, menunggu: 0, disetujui: 0, ditolak: 0, hariDisetujui: 0 });
    return { periode: bulan ? tahun + '-' + bulan : tahun, baris: baris, total: total };
  } };

  // ---- khusus demo ----
  AKSI.demoAkun = { publik: true, fn: function (db) {
    var urut = [['90022', 'Karyawan (operator, pola lapangan)'], ['90021', 'Atasan (supervisor)'], ['90020', 'Head Dept Produksi'],
      ['90011', 'HR'], ['90001', 'GM'], ['90033', 'Admin Dept Plant'], ['90023', 'Karyawan (operator)'], ['90031', 'Atasan Plant'], ['90030', 'Head Dept Plant'], ['90010', 'HR Manager']];
    return urut.map(function (x) { var k = karyawanNik(db, x[0]); return { nik: k.nik, nama: k.nama, keterangan: x[1], dept: k.dept }; });
  } };
  AKSI.demoEmail = { publik: true, fn: function (db) { return { items: db.email }; } };
  AKSI.demoReset = { publik: true, fn: function () { memori = dataAwal(); return {}; } };

  // ---------- pintu masuk (sama bentuknya dengan doPost) ----------
  function proses(teks) {
    var hasil;
    try {
      var req = JSON.parse(teks);
      var def = AKSI[req.aksi];
      if (!def) throw err('Aksi tidak dikenal');
      var db = muat(), u = null;
      if (!def.publik) {
        var s = req.token && db.sesi[req.token];
        if (!s || s.dicabut || s.kedaluwarsa < Date.now()) { if (s) delete db.sesi[req.token]; simpan(); throw err('Sesi habis, silakan masuk lagi', 'BELUM_LOGIN'); }
        u = karyawanNik(db, s.nik);
        if (!u || !u.aktif) throw err('Akun tidak aktif', 'BELUM_LOGIN');
        if (db.akun[u.nik].wajibGanti && !def.bolehWajibGanti && req.aksi !== 'logout') throw err('Ganti PIN dulu sebelum lanjut', 'DITOLAK');
        if (def.peran) wajibPeran(u, def.peran);
      }
      var data = def.fn(db, req.data || {}, u, req.token);
      simpan();
      hasil = { ok: true, data: data };
    } catch (e) {
      hasil = { ok: false, kode: e.kode || 'ERROR', error: e.kode ? e.message : 'Ada kesalahan di server, coba lagi' };
      if (!e.kode && root.console) console.error(e);
      try { simpan(); } catch (x) { }
    }
    return JSON.stringify(hasil);
  }

  var M = { proses: proses, _reset: function () { memori = dataAwal(); simpan(); }, _db: function () { return muat(); } };
  if (typeof module !== 'undefined' && module.exports) module.exports = M; else root.CutiMock = M;
})(this);
