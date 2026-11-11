/* Layar Cuti Online. Semua data lewat CutiApi.panggil (api.js). */
(function () {
  'use strict';
  var api = window.CutiApi;
  var S = { user: null, wajibGanti: false, antrian: 0, jenisBerhak: [] };
  var NAMA_PERAN = { karyawan: 'Karyawan', atasan: 'Atasan', head: 'Head Dept', hr: 'HR', gm: 'GM', admin: 'Admin Dept', sistem: 'Admin Sistem' };
  var LABEL_JENIS = { TAHUNAN: 'Cuti tahunan', LAPANGAN: 'Cuti lapangan', OUTSTANDING: 'Cuti outstanding' };
  var BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  var BULAN_PANJANG = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  var HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  // ---------- ikon (SVG statis) ----------
  var IKON = {
    rumah: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
    tambah: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8M8 12h8"/>',
    jam: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    centang: '<path d="M20 6 9 17l-5-5"/>',
    kotakCentang: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="m8 12 3 3 5-6"/>',
    titik3: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
    silang: '<path d="M18 6 6 18M6 6l12 12"/>',
    kanan: '<path d="m9 6 6 6-6 6"/>',
    kiri: '<path d="m15 6-6 6 6 6"/>',
    mata: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    kunci: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    keluar: '<path d="M15 4h4v16h-4"/><path d="M10 8l-4 4 4 4M6 12h11"/>',
    buku: '<path d="M4 4h11a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3V4Z"/><path d="M4 17a3 3 0 0 1 3-3h11"/>',
    orang: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6"/>',
    timbang: '<path d="M12 3v18M5 7h14"/><path d="m5 7-3 7a3 3 0 0 0 6 0L5 7ZM19 7l-3 7a3 3 0 0 0 6 0l-3-7Z"/>',
    grafik: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    surat: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    ulang: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 5v6h-6"/>',
    unduh: '<path d="M12 4v11M7 10l5 5 5-5"/><path d="M4 20h16"/>',
    cari: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    peringatan: '<path d="M12 3 2 20h20L12 3Z"/><path d="M12 10v4M12 17h.01"/>',
    lompat: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    kalender: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    perisai: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z"/>'
  };
  function ikon(n) {
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('class', 'svg'); s.setAttribute('aria-hidden', 'true');
    s.innerHTML = IKON[n] || '';
    return s;
  }

  // ---------- pembuat elemen (pakai textContent, aman dari data user) ----------
  function h(tag, p) {
    var e = document.createElement(tag);
    p = p || {};
    Object.keys(p).forEach(function (k) {
      var v = p[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') e.className = v;
      else if (k === 'text') e.textContent = v;
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? '' : v);
    });
    for (var i = 2; i < arguments.length; i++) tempel(e, arguments[i]);
    return e;
  }
  function tempel(e, c) {
    if (c === null || c === undefined || c === false) return;
    if (Array.isArray(c)) { c.forEach(function (x) { tempel(e, x); }); return; }
    e.appendChild(typeof c === 'object' ? c : document.createTextNode(String(c)));
  }
  function kosongkan(e) { while (e.firstChild) e.removeChild(e.firstChild); return e; }

  // ---------- format ----------
  function tgl(iso, panjang) {
    if (!iso) return '-';
    var p = iso.slice(0, 10).split('-').map(Number), d = new Date(Date.UTC(p[0], p[1] - 1, p[2]));
    return (panjang ? HARI[d.getUTCDay()] + ', ' : '') + p[2] + ' ' + BULAN[p[1] - 1] + ' ' + p[0];
  }
  function rentang(a, b) { return a === b ? tgl(a, true) : tgl(a, true) + ' s/d ' + tgl(b, true); }
  function waktu(s) { return s ? tgl(s.slice(0, 10)) + ', ' + s.slice(11, 16) : '-'; }
  function satuan(j) { return j === 'LAPANGAN' ? 'hari kalender' : 'hari kerja'; }
  function status(p) { return h('span', { class: 'status s-' + p.status, text: p.labelStatus }); }
  function punya(r) { return S.user && S.user.peran.indexOf(r) >= 0; }
  function approver() { return ['atasan', 'head', 'hr', 'gm'].some(punya); }

  // ---------- toast, modal ----------
  function toast(pesan, jenis) {
    var t = h('div', { class: 'toast ' + (jenis || ''), role: 'status' }, ikon(jenis === 'gagal' ? 'peringatan' : jenis === 'sukses' ? 'centang' : 'info'), h('span', { text: pesan }));
    document.getElementById('toast').appendChild(t);
    setTimeout(function () { t.remove(); }, jenis === 'gagal' ? 5000 : 3200);
  }
  // modal({judul, isi, tombol:[{teks, kelas, nilai, aksi}]}) -> Promise(nilai)
  function modal(o) {
    return new Promise(function (selesai) {
      var lapis;
      function tutup(v) { lapis.remove(); document.removeEventListener('keydown', esc); selesai(v); }
      function esc(e) { if (e.key === 'Escape') tutup(null); }
      var tombol = (o.tombol || [{ teks: 'Tutup', nilai: null }]).map(function (b) {
        return h('button', { class: 'tombol ' + (b.kelas || ''), type: 'button', onclick: function (ev) {
          if (!b.aksi) return tutup(b.nilai);
          prosesTombol(ev.currentTarget, function () { return b.aksi().then(function (v) { if (v !== false) tutup(v === undefined ? b.nilai : v); }); });
        } }, b.teks);
      });
      lapis = h('div', { class: 'layar', onclick: function (e) { if (e.target === lapis && !o.wajib) tutup(null); } },
        h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true' }, h('h3', { text: o.judul }), o.isi, h('div', { class: 'baris-tombol' }, tombol)));
      document.body.appendChild(lapis);
      document.addEventListener('keydown', esc);
      var f = lapis.querySelector('input, textarea, select') || lapis.querySelector('.tombol.utama, .tombol.gelap, .tombol.bahaya');
      if (f) f.focus();
    });
  }
  // tombol disabled + spinner selama proses; selalu aktif lagi
  function prosesTombol(btn, fn) {
    if (btn.disabled) return;
    var isi = Array.prototype.slice.call(btn.childNodes);
    btn.disabled = true; kosongkan(btn); btn.appendChild(h('span', { class: 'putar' })); btn.appendChild(document.createTextNode('Memproses...'));
    return Promise.resolve().then(fn).catch(function (e) { console.error(e); toast('Ada kesalahan, coba lagi', 'gagal'); })
      .then(function () { if (!btn.isConnected) return; btn.disabled = false; kosongkan(btn); isi.forEach(function (n) { btn.appendChild(n); }); });
  }
  function muat() { return h('div', { class: 'muat' }, h('span', { class: 'putar' }), 'Memuat...'); }
  function gagal(el, hasil, ulang) {
    kosongkan(el).appendChild(h('div', { class: 'kartu' }, h('div', { class: 'pesan-salah' }, ikon('peringatan'), h('span', { text: hasil.error })),
      ulang ? h('button', { class: 'tombol', onclick: ulang }, ikon('ulang'), 'Coba lagi') : null));
  }

  // ---------- kerangka ----------
  var app = document.getElementById('app');
  // Nav bawah selalu 5 item supaya tombol Ajukan pas di tengah.
  // Karyawan: Beranda, Riwayat, +, Mutasi, Profil. Approver: Beranda, Approval, +, Riwayat, Profil (Mutasi di Profil + Beranda).
  function menu() {
    var M = { beranda: { r: 'beranda', t: 'Beranda', i: 'rumah' }, riwayat: { r: 'riwayat', t: 'Riwayat', i: 'jam' },
      ajukan: { r: 'ajukan', t: 'Ajukan cuti', i: 'tambah', tengah: true }, approval: { r: 'approval', t: 'Approval', i: 'kotakCentang' },
      mutasi: { r: 'mutasi', t: 'Mutasi', i: 'buku' }, lainnya: { r: 'lainnya', t: 'Profil', i: 'orang' } };
    return approver() ? [M.beranda, M.approval, M.ajukan, M.riwayat, M.lainnya] : [M.beranda, M.riwayat, M.ajukan, M.mutasi, M.lainnya];
  }
  function menuSamping() {
    var r = [{ r: 'ajukan', t: 'Ajukan cuti', i: 'tambah', tengah: true }, { r: 'beranda', t: 'Beranda', i: 'rumah' }];
    if (approver()) r.push({ r: 'approval', t: 'Approval', i: 'kotakCentang' });
    return r.concat([{ r: 'riwayat', t: 'Riwayat', i: 'jam' }, { r: 'mutasi', t: 'Mutasi saldo', i: 'buku' }, { r: 'lainnya', t: 'Profil', i: 'orang' }]);
  }
  var WARNA_AV = ['#1e4fb8', '#0f766e', '#9a3412', '#475569', '#a16207', '#be123c', '#4d7c0f'];
  function inisial(nama) { return String(nama || '?').split(' ').filter(Boolean).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase(); }
  function avatar(nama, nik, ukuran) {
    var n = 0; String(nik || nama).split('').forEach(function (c) { n += c.charCodeAt(0); });
    return h('span', { class: 'avatar' + (ukuran ? ' ' + ukuran : ''), style: '--av:' + WARNA_AV[n % WARNA_AV.length], 'aria-hidden': 'true', text: inisial(nama) });
  }
  function labelPeran(peran) {
    return peran.filter(function (r) { return r !== 'karyawan'; }).map(function (r) { return NAMA_PERAN[r]; }).join(', ') || 'Karyawan';
  }
  function tanda(kelas) { return h('span', { class: 'tanda ' + (kelas || '') }, h('b', { text: 'GMA' })); }
  function kerangka(rute) {
    var akar = rute.split('/')[0];
    var aktif = rute.indexOf('dari=approval') >= 0 ? 'approval' : ({ pengajuan: 'riwayat', hr: 'lainnya', rekap: 'lainnya', 'ganti-pin': 'lainnya' }[akar] || akar);
    if (akar === 'mutasi' && rute.split('/')[1]) aktif = 'lainnya';
    function navLinks(daftar) {
      return daftar.map(function (m) {
        return h('a', { href: '#/' + m.r, class: (m.tengah ? 'tengah ' : '') + (m.r === aktif ? 'aktif' : ''), 'aria-current': m.r === aktif ? 'page' : null, 'aria-label': m.t },
          ikon(m.i), h('span', { text: m.t }),
          m.r === 'approval' && S.antrian ? h('span', { class: 'badge', text: S.antrian > 99 ? '99+' : S.antrian }) : null);
      });
    }
    var main = h('main', { id: 'isi' });
    kosongkan(app);
    if (api.MODE === 'demo') app.appendChild(bannerDemo());
    var sisi = h('aside', { class: 'samping' },
      h('div', { class: 'merek' }, tanda('terang besar'), h('div', {}, h('b', { text: 'Cuti Online' }), h('small', { text: 'PT Geopersada Mulia Abadi' }))),
      h('nav', { 'aria-label': 'Menu utama' }, navLinks(menuSamping())),
      h('div', { class: 'bawah-sisi' },
        api.MODE === 'demo' ? h('button', { class: 'tombol-demo fab-demo', type: 'button', onclick: laciDemo }, ikon('orang'), 'Panel demo') : null,
        h('div', { class: 'kartu-user' }, avatar(S.user.nama, S.user.nik), h('div', {}, h('b', { text: S.user.nama }), h('small', { text: labelPeran(S.user.peran) })),
          h('button', { type: 'button', title: 'Keluar', 'aria-label': 'Keluar', onclick: keluar }, ikon('keluar')))));
    var atas = h('header', { class: 'atas' },
      h('a', { class: 'merek-kecil', href: '#/beranda' }, tanda(), 'Cuti Online'),
      h('a', { class: 'ke-profil', href: '#/lainnya', 'aria-label': 'Profil dan menu lain' }, avatar(S.user.nama, S.user.nik)));
    app.appendChild(h('div', { class: 'shell' }, sisi, h('div', { class: 'konten' }, atas, main)));
    app.appendChild(h('nav', { class: 'bawah', 'aria-label': 'Menu utama' }, navLinks(menu())));
    return main;
  }
  function bannerDemo() {
    return h('div', { class: 'banner-demo' }, 'Data fiktif, email tidak dikirim. ', h('button', { type: 'button', onclick: laciDemo, text: 'Panel demo' }));
  }
  function judul(teks, kanan) { return h('h1', { class: 'hal' }, h('span', { text: teks }), kanan ? h('span', { class: 'kanan' }, kanan) : null); }
  function tombolMuatUlang(fn) { return h('button', { class: 'tombol kecil', type: 'button', onclick: fn, title: 'Muat ulang' }, ikon('ulang'), h('span', { text: 'Muat ulang' })); }
  function kembali(href, teks) { return h('a', { class: 'kembali', href: href }, ikon('kiri'), teks); }

  // Garis kontur (peta topografi tambang) sebagai latar panel gelap
  function kontur(kanvas, opsi) {
    opsi = opsi || {};
    function gambar() {
      var r = kanvas.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
      if (!r.width) return;
      kanvas.width = r.width * dpr; kanvas.height = r.height * dpr;
      var c = kanvas.getContext('2d'); c.scale(dpr, dpr); c.clearRect(0, 0, r.width, r.height);
      var cx = r.width * (opsi.x || 0.78), cy = r.height * (opsi.y || 0.35), maks = Math.max(r.width, r.height) * 1.1;
      for (var i = 1; i < 26; i++) {
        var rad = i * maks / 26;
        c.beginPath();
        for (var a = 0; a <= Math.PI * 2 + 0.01; a += 0.05) {
          var d = rad * (1 + 0.16 * Math.sin(a * 3 + i * 0.35) + 0.08 * Math.sin(a * 5 - i * 0.6) + 0.05 * Math.cos(a * 2 + i));
          var x = cx + Math.cos(a) * d * 1.25, y = cy + Math.sin(a) * d * 0.8;
          if (a === 0) c.moveTo(x, y); else c.lineTo(x, y);
        }
        c.strokeStyle = i === 7 ? 'rgba(245,165,36,.45)' : 'rgba(255,255,255,' + (i % 5 === 0 ? 0.11 : 0.05) + ')';
        c.lineWidth = i % 5 === 0 || i === 7 ? 1.4 : 1;
        c.stroke();
      }
    }
    requestAnimationFrame(gambar);
  }

  // ---------- router ----------
  var RUTE = {
    masuk: layarMasuk, 'ganti-pin': layarGantiPin, beranda: layarBeranda, ajukan: layarAjukan, riwayat: layarRiwayat,
    pengajuan: layarDetail, approval: layarApproval, lainnya: layarLainnya, mutasi: layarMutasi, rekap: layarRekap,
    'hr/saldo': layarSaldoKaryawan, 'hr/karyawan': layarProfil, 'hr/penyesuaian': layarPenyesuaian, 'hr/reset-pin': layarResetPin
  };
  function rute() {
    var r = hashSekarang();
    var bag = r.split('/').map(decodeURIComponent);
    var kunci = RUTE[bag[0] + '/' + bag[1]] ? bag[0] + '/' + bag[1] : bag[0];
    var arg = bag.slice(kunci.split('/').length);
    if (!api.ambilToken() || !S.user) { if (kunci !== 'masuk') return pindah('masuk'); return layarMasuk(); }
    if (S.wajibGanti && kunci !== 'ganti-pin') return pindah('ganti-pin');
    if (kunci === 'masuk') return pindah('beranda');
    var fn = RUTE[kunci] || layarBeranda;
    window.scrollTo(0, 0);
    fn(kunci === 'ganti-pin' ? null : kerangka(r), arg);
  }
  // Di dalam iframe (artifact) rute disimpan di memori, karena hash #/path tidak boleh dipakai di sana.
  var RUTE_MEMORI = window.top !== window.self, posisi = '';
  function hashSekarang() { return RUTE_MEMORI ? posisi : (location.hash || '').replace(/^#\/?/, ''); }
  function pindah(r) {
    r = String(r).replace(/^#?\/?/, '');
    if (RUTE_MEMORI) { posisi = r; rute(); return; }
    if (location.hash === '#/' + r) rute(); else location.hash = '#/' + r;
  }
  window.addEventListener('hashchange', function () { if (!RUTE_MEMORI) rute(); });
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#/"]');
    if (!a || !RUTE_MEMORI || e.defaultPrevented) return;
    e.preventDefault(); pindah(a.getAttribute('href'));
  });

  function perbaruiBadge() {
    if (!approver()) return Promise.resolve();
    return api.panggil('antrian', { limit: 1 }).then(function (r) {
      if (!r.ok) return;
      S.antrian = r.data.total;
      document.querySelectorAll('nav a[href="#/approval"]').forEach(function (a) {
        var b = a.querySelector('.badge');
        if (!S.antrian) { if (b) b.remove(); return; }
        if (!b) { b = h('span', { class: 'badge' }); a.appendChild(b); }
        b.textContent = S.antrian > 99 ? '99+' : S.antrian;
      });
    });
  }

  // ---------- L1 Masuk ----------
  function layarMasuk() {
    kosongkan(app);
    if (api.MODE === 'demo') app.appendChild(bannerDemo());
    var salah = h('div');
    var nik = h('input', { type: 'text', id: 'nik', inputmode: 'numeric', autocomplete: 'username', required: true, maxlength: 12, placeholder: 'Nomor induk karyawan' });
    var pin = h('input', { type: 'password', id: 'pin', inputmode: 'numeric', autocomplete: 'current-password', required: true, maxlength: 6, placeholder: '6 angka' });
    var ingat = h('input', { type: 'checkbox', id: 'ingat' });
    var btn = h('button', { class: 'tombol utama penuh', type: 'submit' }, 'Masuk', ikon('kanan'));
    var form = h('form', { onsubmit: function (e) {
      e.preventDefault();
      kosongkan(salah);
      prosesTombol(btn, function () { return masuk(nik.value.trim(), pin.value, ingat.checked, salah); });
    } },
      h('div', { class: 'isian' }, h('label', { class: 'lbl', for: 'nik', text: 'NIK' }), nik),
      h('div', { class: 'isian' }, h('label', { class: 'lbl', for: 'pin', text: 'PIN' }),
        h('div', { class: 'pin-bungkus' }, pin, h('button', { type: 'button', 'aria-label': 'Lihat PIN', onclick: function () { pin.type = pin.type === 'password' ? 'text' : 'password'; } }, ikon('mata')))),
      h('label', { class: 'cek isian', for: 'ingat' }, ingat, 'Ingat perangkat ini 30 hari'),
      salah, btn,
      h('p', { class: 'muted', style: 'margin:12px 0 0;text-align:center', text: 'Lupa PIN? Minta reset ke admin dept atau HR.' }));
    var demo = h('div');
    var kanvas = h('canvas', { 'aria-hidden': 'true' });
    app.appendChild(h('div', { class: 'masuk' },
      h('section', { class: 'masuk-sisi' }, kanvas, tanda('terang besar'),
        h('h1', { text: 'Cuti Online' }),
        h('p', { text: 'Ajukan cuti, pantau persetujuan Atasan sampai GM, dan cek sisa saldo dari HP.' }),
        h('div', { class: 'lokasi' },
          h('div', {}, h('b', { text: 'PT Geopersada Mulia Abadi' }), 'Kontraktor tambang & alat berat'),
          h('div', {}, h('b', { text: '4 tahap' }), 'Atasan, Head Dept, HR, GM'))),
      h('section', { class: 'masuk-form' }, h('div', { class: 'masuk-kartu' },
        h('h2', { text: 'Masuk' }), h('p', { class: 'sub', text: 'Pakai NIK dan PIN dari admin dept atau HR.' }), form, demo))));
    kontur(kanvas);
    if (api.MODE === 'demo') {
      api.panggil('demoAkun').then(function (r) {
        if (!r.ok) return;
        demo.className = 'akun-demo';
        demo.appendChild(h('div', { class: 'judul', text: 'Pilih profil demo' }));
        var grid = h('div', { class: 'grid-akun' }, r.data.map(function (a) {
          return h('button', { type: 'button', 'data-nik': a.nik, onclick: function (e) { pilihProfil(e.currentTarget, a); } },
            avatar(a.nama, a.nik), h('span', { class: 'nm' }, h('b', { text: a.nama }), h('small', { text: a.keterangan })));
        }));
        demo.appendChild(grid);
        // Klik profil: NIK dan PIN terisi otomatis, lalu langsung masuk
        function pilihProfil(tombol, a) {
          if (grid.getAttribute('aria-busy') === 'true') return;
          grid.setAttribute('aria-busy', 'true'); tombol.classList.add('dipilih');
          kosongkan(salah); nik.value = ''; pin.value = ''; pin.type = 'password';
          var isi = function (input, teks, jeda) {
            return new Promise(function (selesai) {
              var i = 0; (function langkah() { if (i >= teks.length) return selesai(); input.value += teks[i++]; setTimeout(langkah, jeda); })();
            });
          };
          isi(nik, a.nik, 45).then(function () { return isi(pin, '123456', 35); }).then(function () {
            setTimeout(function () {
              prosesTombol(btn, function () { return masuk(a.nik, '123456', ingat.checked, salah); }).then(function () {
                if (grid.isConnected) { grid.removeAttribute('aria-busy'); tombol.classList.remove('dipilih'); }
              });
            }, 120);
          });
        }
      });
    }
    nik.focus();
  }

  function masuk(nik, pin, ingat, wadahSalah) {
    return api.panggil('login', { nik: nik, pin: pin, ingat: ingat }).then(function (r) {
      if (!r.ok) {
        if (wadahSalah) kosongkan(wadahSalah).appendChild(h('div', { class: 'pesan-salah', role: 'alert' }, ikon('peringatan'), h('span', { text: r.error })));
        else toast(r.error, 'gagal');
        return false;
      }
      api.simpanToken(r.data.token);
      S.user = r.data.user; S.wajibGanti = r.data.wajibGantiPin; S.antrian = 0;
      return perbaruiBadge().then(function () { pindah(S.wajibGanti ? 'ganti-pin' : 'beranda'); return true; });
    });
  }
  function keluar() {
    api.panggil('logout').then(function () { api.simpanToken(null); S.user = null; pindah('masuk'); });
  }

  // ---------- L2 Ganti PIN ----------
  function layarGantiPin() {
    var wajib = S.wajibGanti;
    var el = wajib ? (kosongkan(app), app) : kerangka('ganti-pin');
    if (wajib && api.MODE === 'demo') app.appendChild(bannerDemo());
    var salah = h('div');
    var f = function (id, lbl) { return h('div', { class: 'isian' }, h('label', { class: 'lbl', for: id, text: lbl }), h('input', { type: 'password', id: id, inputmode: 'numeric', maxlength: 6, required: true, autocomplete: id === 'pinLama' ? 'current-password' : 'new-password' })); };
    var btn = h('button', { class: 'tombol utama penuh', type: 'submit' }, 'Simpan PIN baru');
    var form = h('form', { onsubmit: function (e) {
      e.preventDefault(); kosongkan(salah);
      var lama = form.querySelector('#pinLama').value, baru = form.querySelector('#pinBaru').value, ulang = form.querySelector('#pinUlang').value;
      if (baru !== ulang) { salah.appendChild(h('div', { class: 'pesan-salah' }, ikon('peringatan'), 'PIN baru dan ulangi PIN tidak sama')); return; }
      prosesTombol(btn, function () {
        return api.panggil('gantiPin', { pinLama: lama, pinBaru: baru }).then(function (r) {
          if (!r.ok) { salah.appendChild(h('div', { class: 'pesan-salah', role: 'alert' }, ikon('peringatan'), h('span', { text: r.error }))); return; }
          S.wajibGanti = false; toast('PIN berhasil diganti', 'sukses');
          return api.panggil('beranda').then(function (b) { if (b.ok) S.user = b.data.user; pindah('beranda'); });
        });
      });
    } }, f('pinLama', wajib ? 'PIN sementara (dari admin/HR)' : 'PIN lama'), f('pinBaru', 'PIN baru (6 angka)'), f('pinUlang', 'Ulangi PIN baru'),
      h('p', { class: 'muted', text: 'Jangan pakai angka sama semua, berurutan (123456), atau bagian dari NIK.' }), salah, btn);
    var kartu = h('div', { class: 'masuk-kartu' }, h('div', { class: 'logo', text: 'GMA' }), h('h1', { text: 'Ganti PIN' }),
      h('p', { class: 'sub', text: wajib ? 'Login pertama atau setelah reset: buat PIN baru dulu sebelum lanjut.' : S.user.nama + ' · ' + S.user.nik }), form,
      wajib ? h('button', { class: 'tombol penuh', type: 'button', style: 'margin-top:10px', onclick: keluar }, ikon('keluar'), 'Keluar') : null);
    if (wajib) el.appendChild(h('div', { class: 'masuk-bungkus' }, kartu));
    else { el.appendChild(kembali('#/lainnya', 'Profil')); kartu.style.boxShadow = 'none'; kartu.style.border = '1px solid var(--garis)'; el.appendChild(kartu); }
  }

  // ---------- L3 Beranda ----------
  function kartuSaldo(s, terang) {
    var basis = Math.max(s.saldo, 1), t = Math.max(0, s.tersedia), m = Math.max(0, Math.min(s.menunggu, s.saldo));
    return h('div', { class: 'saldo' + (terang ? ' terang' : '') + (s.jenis === 'LAPANGAN' ? ' lapangan' : '') },
      h('div', { class: 'label' }, h('span', { text: s.label.replace('Cuti ', '') }), h('em', { text: satuan(s.jenis) })),
      h('div', { class: 'angka' }, String(s.tersedia), h('small', { text: 'hari tersedia' })),
      h('div', { class: 'batang', role: 'img', 'aria-label': t + ' tersedia, ' + m + ' menunggu, dari saldo ' + s.saldo },
        h('i', { class: 'isi-t', style: 'width:' + (t / basis * 100) + '%' }), h('i', { class: 'isi-m', style: 'width:' + (m / basis * 100) + '%' })),
      h('div', { class: 'rinci', text: 'Saldo ' + s.saldo + ' hari' + (s.menunggu ? ' · ' + s.menunggu + ' sedang diajukan' : '') }));
  }
  function tglBlok(iso) {
    var p = iso.split('-').map(Number);
    return h('div', { class: 'tgl-blok', 'aria-hidden': 'true' }, h('b', { text: p[2] }), h('small', { text: BULAN[p[1] - 1] }));
  }
  function itemPengajuan(p, href, ekstra) {
    var orang = ekstra && ekstra.nama;
    return h('a', { class: 'item', href: href || '#/pengajuan/' + encodeURIComponent(p.no) },
      orang ? avatar(p.nama, p.nik, 'besar') : tglBlok(p.mulai),
      h('div', { class: 'isi' }, h('div', { class: 't1', text: orang ? p.nama : LABEL_JENIS[p.jenis] }),
        h('div', { class: 't2', text: (orang ? LABEL_JENIS[p.jenis] + ' · ' + p.dept + ' · ' : '') + rentang(p.mulai, p.selesai) }),
        h('div', { class: 'no', text: p.no + (ekstra && ekstra.lama !== undefined ? ' · menunggu ' + (ekstra.lama ? ekstra.lama + ' hari' : 'sejak hari ini') : '') }),
        h('span', { class: 't-status' }, status(p))),
      h('div', { class: 'kanan' }, h('span', { class: 'hari' }, String(p.jumlahHari), h('small', { text: ' hari' })), status(p)));
  }
  function sapaan() {
    var j = new Date(Date.now() + 7 * 3600000).getUTCHours();
    return j < 11 ? 'Selamat pagi' : j < 15 ? 'Selamat siang' : j < 18 ? 'Selamat sore' : 'Selamat malam';
  }
  function layarBeranda(el) {
    el.appendChild(muat());
    api.panggil('beranda').then(function (r) {
      if (!r.ok) return gagal(el, r, function () { pindah('beranda'); });
      var d = r.data; S.user = d.user; S.antrian = d.antrianSaya; S.jenisBerhak = d.saldo.map(function (s) { return s.jenis; });
      kosongkan(el);
      var kanvas = h('canvas', { 'aria-hidden': 'true' });
      el.appendChild(h('section', { class: 'hero' }, kanvas,
        h('div', { class: 'sapa' }, h('div', {}, h('h1', { text: sapaan() + ', ' + d.user.nama.split(' ')[0] }),
          h('div', { class: 'sub', text: d.user.jabatan + ' · ' + d.user.dept + ' · NIK ' + d.user.nik })),
          h('button', { class: 'muat-ulang', type: 'button', title: 'Muat ulang', 'aria-label': 'Muat ulang', onclick: function () { pindah('beranda'); } }, ikon('ulang'))),
        h('div', { class: 'saldo-deret' }, d.saldo.map(function (s) { return kartuSaldo(s); }))));
      kontur(kanvas, { x: 0.9, y: 0.1 });

      var kiri = h('div'), kanan = h('div');
      el.appendChild(h('div', { class: 'beranda-grid' }, kiri, kanan));
      kiri.appendChild(h('div', { class: 'aksi-cepat' },
        h('a', { class: 'utama', href: '#/ajukan' }, h('span', { class: 'ik' }, ikon('tambah')), 'Ajukan cuti', h('small', { text: 'Hitung hari otomatis' })),
        h('a', { href: '#/riwayat' }, h('span', { class: 'ik' }, ikon('jam')), 'Riwayat', h('small', { text: 'Status pengajuan' })),
        h('a', { href: '#/mutasi' }, h('span', { class: 'ik' }, ikon('buku')), 'Mutasi saldo', h('small', { text: 'Asal angka saldo' }))));
      kiri.appendChild(h('h2', {}, 'Pengajuan terakhir', d.terakhir.length ? h('a', { class: 'lihat', href: '#/riwayat', text: 'Lihat semua' }) : null));
      kiri.appendChild(h('div', { class: 'daftar' }, d.terakhir.length ? d.terakhir.map(function (p) { return itemPengajuan(p); })
        : h('div', { class: 'kosong', text: 'Belum ada pengajuan. Tekan Ajukan cuti untuk mulai.' })));

      if (approver()) {
        kanan.appendChild(h('h2', { text: 'Perlu tindakan' }));
        kanan.appendChild(h('a', { class: 'perhatian' + (d.antrianSaya ? '' : ' nol'), href: '#/approval' },
          h('span', { class: 'jml', text: String(d.antrianSaya) }),
          h('span', {}, h('b', { text: d.antrianSaya ? 'Menunggu persetujuan Anda' : 'Tidak ada antrian' }), h('small', { text: 'Tahap ' + labelPeran(d.user.peran) })), ikon('kanan')));
      }
      kanan.appendChild(h('h2', { text: 'Alur persetujuan' }));
      kanan.appendChild(h('div', { class: 'kartu' }, h('ol', { class: 'alur' },
        h('li', {}, 'Anda ajukan', h('small', { text: 'nomor otomatis' })),
        h('li', {}, 'Atasan langsung'), h('li', {}, 'Head Dept'), h('li', {}, 'HR'), h('li', {}, 'GM', h('small', { text: 'saldo dipotong' }))),
        h('p', { class: 'muted', style: 'margin:10px 0 0', text: 'Email dikirim ke approver di tiap tahap, dan ke Anda saat disetujui atau ditolak.' })));
      perbaruiBadge();
    });
  }

  // ---------- L4 Ajukan ----------
  function layarAjukan(el) {
    el.appendChild(judul('Ajukan cuti'));
    var wadah = h('div'); el.appendChild(wadah); wadah.appendChild(muat());
    api.panggil('beranda').then(function (r) {
      if (!r.ok) return gagal(wadah, r);
      kosongkan(wadah);
      var besok = r.data.hariIni;
      var jenis = h('select', { id: 'jenis', required: true }, r.data.saldo.map(function (s) { return h('option', { value: s.jenis, text: s.label + ' (tersedia ' + s.tersedia + ' hari)' }); }));
      var mulai = h('input', { type: 'date', id: 'mulai', required: true, min: besok });
      var selesai = h('input', { type: 'date', id: 'selesai', required: true, min: besok });
      var alasan = h('textarea', { id: 'alasan', maxlength: 300, required: true, placeholder: 'Contoh: pulang kampung, acara keluarga' });
      var hitungan = h('small', { text: '0/300' });
      var panel = h('div', { class: 'perkiraan kosong-p', id: 'perkiraan' }, h('div', { text: 'Pilih tanggal mulai dan selesai. Jumlah hari dan sisa saldo langsung dihitung di sini.' }));
      var salah = h('div');
      var btn = h('button', { class: 'tombol utama penuh', type: 'submit', disabled: true }, ikon('surat'), 'Kirim pengajuan');
      var urut = 0, hasilTerakhir = null;
      function hitung() {
        hasilTerakhir = null; btn.disabled = true;
        if (selesai.value && mulai.value && selesai.value < mulai.value) selesai.value = mulai.value;
        if (mulai.value && !selesai.value) selesai.value = mulai.value;
        selesai.min = mulai.value || besok;
        if (!mulai.value || !selesai.value) return;
        var ke = ++urut;
        kosongkan(panel).appendChild(h('div', { class: 'muat', style: 'padding:6px;color:inherit' }, h('span', { class: 'putar' }), 'Menghitung...'));
        panel.className = 'perkiraan kosong-p';
        api.panggil('hitung', { jenis: jenis.value, mulai: mulai.value, selesai: selesai.value }).then(function (h2) {
          if (ke !== urut) return;
          kosongkan(panel);
          if (!h2.ok) { panel.className = 'perkiraan gagal'; panel.appendChild(h('div', { class: 'pesan-salah', style: 'margin:0' }, ikon('peringatan'), h('span', { text: h2.error }))); return; }
          var d = h2.data;
          panel.className = 'perkiraan' + (d.boleh ? '' : ' gagal');
          panel.appendChild(h('div', { class: 'judul-p', text: 'Perkiraan · ' + LABEL_JENIS[jenis.value] }));
          panel.appendChild(h('div', { class: 'besar' }, String(d.jumlahHari), h('small', { text: d.satuan })));
          panel.appendChild(h('div', { class: 'baris' }, h('span', { text: 'Saldo tersedia sekarang' }), h('b', { text: d.saldo.tersedia + ' hari' })));
          panel.appendChild(h('div', { class: 'baris' }, h('span', { text: 'Sisa setelah cuti ini' }), h('b', { text: d.sisaSesudah + ' hari', class: d.sisaSesudah < 0 ? 'minus' : '' })));
          if (d.liburDilewati.length) panel.appendChild(h('div', { class: 'baris' }, h('span', { text: 'Libur tidak dihitung' }),
            h('b', { style: 'white-space:normal;text-align:right', text: d.liburDilewati.map(function (l) { return tgl(l.tanggal) + ' ' + l.keterangan; }).join(', ') })));
          if (d.jenis === 'LAPANGAN' || jenis.value === 'LAPANGAN') panel.appendChild(h('div', { class: 'muted', text: 'Cuti lapangan dihitung hari kalender (termasuk Sabtu, Minggu, libur).' }));
          if (!d.boleh) panel.appendChild(h('div', { class: 'pesan-salah', role: 'alert' }, ikon('peringatan'), h('span', { text: d.pesan })));
          hasilTerakhir = d; btn.disabled = !d.boleh;
        });
      }
      [jenis, mulai, selesai].forEach(function (x) { x.addEventListener('change', hitung); });
      alasan.addEventListener('input', function () { hitungan.textContent = alasan.value.length + '/300'; });
      var form = h('form', { class: 'form-grid', onsubmit: function (e) {
        e.preventDefault(); kosongkan(salah);
        if (!hasilTerakhir || !hasilTerakhir.boleh) return;
        var data = { jenis: String(jenis.value), mulai: String(mulai.value), selesai: String(selesai.value), alasan: String(alasan.value).trim() };
        if (!data.alasan) { salah.appendChild(h('div', { class: 'pesan-salah' }, ikon('peringatan'), 'Alasan wajib diisi')); alasan.focus(); return; }
        prosesTombol(btn, function () {
          return api.panggil('ajukan', data).then(function (r2) {
            if (!r2.ok) { salah.appendChild(h('div', { class: 'pesan-salah', role: 'alert' }, ikon('peringatan'), h('span', { text: r2.error }))); return; }
            return modal({ judul: 'Pengajuan terkirim', isi: h('div', {}, h('p', { text: 'Nomor pengajuan:' }), h('div', { class: 'pin-besar', style: 'font-size:20px;letter-spacing:1px', text: r2.data.no }),
              h('p', { text: 'Status: ' + r2.data.labelStatus + '. Approver sudah diberi tahu lewat email.' })),
              tombol: [{ teks: 'Ke beranda', nilai: 'beranda' }, { teks: 'Lihat detail', kelas: 'utama', nilai: 'detail' }], wajib: true })
              .then(function (v) { pindah(v === 'detail' ? 'pengajuan/' + encodeURIComponent(r2.data.no) : 'beranda'); });
          });
        });
      } },
        h('div', { class: 'kartu' },
          h('div', { class: 'isian' }, h('label', { class: 'lbl', for: 'jenis', text: 'Jenis cuti' }), jenis),
          h('div', { class: 'dua isian' }, h('div', {}, h('label', { class: 'lbl', for: 'mulai', text: 'Mulai' }), mulai), h('div', {}, h('label', { class: 'lbl', for: 'selesai', text: 'Selesai' }), selesai)),
          h('div', { class: 'isian' }, h('label', { class: 'lbl', for: 'alasan', text: 'Alasan' }), alasan, hitungan),
          h('p', { class: 'muted', style: 'margin:0', text: 'Nomor pengajuan dibuat otomatis setelah dikirim. Alur: Atasan, Head Dept, HR, GM.' })),
        h('div', { class: 'tempel' }, panel, salah, btn));
      wadah.appendChild(form);
    });
  }

  // ---------- L5 Riwayat ----------
  function layarRiwayat(el) {
    var filter = '', offset = 0;
    el.appendChild(judul('Riwayat pengajuan', tombolMuatUlang(function () { offset = 0; muatData(); })));
    var chip = h('div', { class: 'chip-baris', role: 'tablist' });
    [['', 'Semua'], ['MENUNGGU', 'Menunggu'], ['DISETUJUI', 'Disetujui'], ['DITOLAK', 'Ditolak'], ['DIBATALKAN', 'Dibatalkan']].forEach(function (c) {
      chip.appendChild(h('button', { class: 'chip' + (c[0] === filter ? ' aktif' : ''), type: 'button', 'data-s': c[0], onclick: function (e) {
        filter = c[0]; offset = 0; chip.querySelectorAll('.chip').forEach(function (x) { x.classList.toggle('aktif', x === e.currentTarget); }); muatData();
      } }, c[1]));
    });
    var daftar = h('div'); var lagi = h('div');
    el.appendChild(chip); el.appendChild(daftar); el.appendChild(lagi);
    function muatData(tambah) {
      if (!tambah) kosongkan(daftar).appendChild(muat());
      return api.panggil('riwayat', { status: filter, limit: 10, offset: offset }).then(function (r) {
        if (!r.ok) return gagal(daftar, r, function () { muatData(); });
        if (!tambah) kosongkan(daftar);
        var box = daftar.querySelector('.daftar') || daftar.appendChild(h('div', { class: 'daftar' }));
        if (!r.data.total) box.appendChild(h('div', { class: 'kosong', text: 'Tidak ada pengajuan.' }));
        r.data.items.forEach(function (p) { box.appendChild(itemPengajuan(p)); });
        offset += r.data.items.length;
        kosongkan(lagi);
        if (offset < r.data.total) lagi.appendChild(h('div', { class: 'baris-tombol' }, h('button', { class: 'tombol', type: 'button', onclick: function (e) { prosesTombol(e.currentTarget, function () { return muatData(true); }); } }, 'Muat lagi (' + (r.data.total - offset) + ')')));
      });
    }
    muatData();
  }

  // ---------- L6 / L8 Detail + keputusan ----------
  function layarDetail(el, arg) {
    var no = arg[0], dariApproval = hashSekarang().indexOf('dari=approval') >= 0;
    no = no && no.split('?')[0];
    el.appendChild(kembali(dariApproval ? '#/approval' : '#/riwayat', dariApproval ? 'Approval' : 'Riwayat'));
    var wadah = h('div'); el.appendChild(wadah); wadah.appendChild(muat());
    api.panggil('detail', { no: no }).then(function (r) {
      if (!r.ok) return gagal(wadah, r);
      var d = r.data, p = d.pengajuan;
      kosongkan(wadah);
      wadah.appendChild(judul(LABEL_JENIS[p.jenis], status(p)));
      var kiri = h('div', { class: 'kol' }), kanan = h('div', { class: 'kol' });
      wadah.appendChild(h('div', { class: 'detail-grid' }, kiri, kanan));
      kiri.appendChild(h('div', { class: 'kartu' },
        h('div', { class: 'kepala-detail' }, avatar(p.nama, p.nik, 'besar'), h('div', {}, h('b', { text: p.nama }), h('div', { class: 'muted', text: p.dept + ' · NIK ' + p.nik })),
          h('div', { class: 'besar-hari' }, String(p.jumlahHari), h('small', { text: satuan(p.jenis) }))),
        h('dl', { class: 'rinci' },
        h('dt', { text: 'Nomor' }), h('dd', { class: 'no', style: 'font-size:14px;color:var(--teks)', text: p.no }),
        h('dt', { text: 'Tanggal' }), h('dd', { text: rentang(p.mulai, p.selesai) }),
        h('dt', { text: 'Alasan' }), h('dd', { style: 'font-weight:500', text: p.alasan }),
        h('dt', { text: 'Diajukan' }), h('dd', { style: 'font-weight:500', text: waktu(p.dibuat) }))));

      // keputusan approver (L8)
      if (d.bisaPutuskan) {
        var info = h('div', { class: 'kartu keputusan' },
          h('b', { text: 'Keputusan Anda (tahap ' + ['', 'Atasan', 'Head Dept', 'HR', 'GM'][p.tahap] + ')' }),
          d.saldoPengaju ? h('p', { class: 'muted', style: 'margin:6px 0', text: 'Saldo ' + d.saldoPengaju.label.toLowerCase() + ' karyawan: ' + d.saldoPengaju.saldo + ' hari (' + d.saldoPengaju.menunggu + ' hari sedang diajukan, termasuk ini).' }) : null,
          d.bersamaan && d.bersamaan.length ? h('div', { class: 'pesan-info' }, ikon('info'), h('span', { text: 'Di dept yang sama, ' + d.bersamaan.length + ' orang juga cuti di tanggal yang tumpang tindih: ' + d.bersamaan.map(function (x) { return x.nama + ' (' + x.labelStatus.toLowerCase() + ')'; }).join(', ') + '.' })) : null,
          h('div', { class: 'baris-tombol' },
            h('button', { class: 'tombol garis-bahaya', type: 'button', onclick: function () { putuskan(p, 'tolak'); } }, ikon('silang'), 'Tolak'),
            h('button', { class: 'tombol gelap', type: 'button', onclick: function () { putuskan(p, 'setujui'); } }, ikon('centang'), 'Setujui')));
        kiri.appendChild(info);
      }

      // jejak approval
      var ikonStatus = { selesai: 'centang', tolak: 'silang', lewat: 'lompat', aktif: 'jam', menunggu: 'jam', kosong: 'jam' };
      var ket = { selesai: 'Disetujui', tolak: 'Ditolak', lewat: 'Dilewati otomatis', aktif: 'Sedang menunggu', menunggu: 'Belum', kosong: '-' };
      kanan.appendChild(h('h2', { text: 'Jejak persetujuan' }));
      var garis = h('ol', { class: 'waktu-garis' });
      garis.appendChild(h('li', {}, h('span', { class: 'titik selesai' }, ikon('surat')), h('div', {}, h('b', { text: 'Diajukan' }), h('div', { class: 'ket', text: p.nama + ' · ' + waktu(p.dibuat) }))));
      d.tahapan.forEach(function (t) {
        if (t.status === 'kosong') return;
        var isi = h('div', {}, h('b', { text: t.label + ': ' + ket[t.status] }),
          h('div', { class: 'ket', text: t.oleh ? t.oleh + ' · ' + waktu(t.waktu) : t.calon.length ? 'Approver: ' + t.calon.join(', ') : '' }),
          t.catatan ? h('div', { class: 'catatan', text: (t.status === 'lewat' ? '' : 'Catatan: ') + t.catatan }) : null);
        garis.appendChild(h('li', {}, h('span', { class: 'titik ' + t.status }, ikon(ikonStatus[t.status])), isi));
      });
      var batalLog = d.jejak.filter(function (j) { return j.aksi === 'BATAL'; }).pop();
      if (batalLog) garis.appendChild(h('li', {}, h('span', { class: 'titik' }, ikon('silang')), h('div', {}, h('b', { text: 'Dibatalkan' }),
        h('div', { class: 'ket', text: batalLog.nama + ' · ' + waktu(batalLog.waktu) }), batalLog.catatan ? h('div', { class: 'catatan', text: batalLog.catatan }) : null)));
      if (p.status === 'DISETUJUI') garis.appendChild(h('li', {}, h('span', { class: 'titik selesai' }, ikon('perisai')), h('div', {}, h('b', { text: 'Disetujui final' }), h('div', { class: 'ket', text: 'Saldo dipotong ' + p.jumlahHari + ' hari' }))));
      kanan.appendChild(h('div', { class: 'kartu' }, garis));

      if (d.bisaBatal || d.bisaBatalHr) {
        kiri.appendChild(h('div', { class: 'baris-tombol' }, h('button', { class: 'tombol garis-bahaya', type: 'button', onclick: function () { batalkan(p, d.bisaBatalHr && !d.bisaBatal); } }, ikon('silang'),
          d.bisaBatal ? 'Batalkan pengajuan' : 'Batalkan cuti (HR, saldo dikembalikan)')));
      }
    });
  }
  function putuskan(p, keputusan) {
    var catatan = h('textarea', { id: 'catatan', maxlength: 300, placeholder: keputusan === 'tolak' ? 'Wajib: alasan penolakan' : 'Opsional' });
    var salah = h('div');
    modal({
      judul: keputusan === 'tolak' ? 'Tolak pengajuan ' + p.no + '?' : 'Setujui pengajuan ' + p.no + '?',
      isi: h('div', {}, h('p', { text: p.nama + ' · ' + LABEL_JENIS[p.jenis] + ' · ' + rentang(p.mulai, p.selesai) + ' (' + p.jumlahHari + ' hari)' }),
        h('label', { class: 'lbl', for: 'catatan', text: keputusan === 'tolak' ? 'Alasan penolakan' : 'Catatan' }), catatan, salah),
      tombol: [{ teks: 'Batal', nilai: null }, { teks: keputusan === 'tolak' ? 'Tolak' : 'Setujui', kelas: keputusan === 'tolak' ? 'bahaya' : 'gelap', aksi: function () {
        kosongkan(salah);
        if (keputusan === 'tolak' && !catatan.value.trim()) { salah.appendChild(h('div', { class: 'pesan-salah' }, ikon('peringatan'), 'Alasan penolakan wajib diisi')); catatan.focus(); return Promise.resolve(false); }
        return api.panggil('putuskan', { no: p.no, tahap: p.tahap, keputusan: keputusan, catatan: catatan.value.trim() }).then(function (r) {
          if (!r.ok) {
            if (r.kode === 'SUDAH_DIPROSES' || r.kode === 'DITOLAK') { toast(r.error, 'gagal'); pindah('approval'); return true; }
            salah.appendChild(h('div', { class: 'pesan-salah' }, ikon('peringatan'), h('span', { text: r.error }))); return false;
          }
          toast(keputusan === 'tolak' ? 'Pengajuan ditolak. Karyawan diberi tahu lewat email.' : r.data.status === 'DISETUJUI' ? 'Disetujui final. Saldo karyawan sudah dipotong.' : 'Disetujui, lanjut ke ' + r.data.labelStatus.replace('Menunggu ', ''), 'sukses');
          perbaruiBadge(); pindah('approval'); return true;
        });
      } }]
    });
  }
  function batalkan(p, olehHr) {
    var alasan = h('textarea', { id: 'alasanBatal', maxlength: 300, placeholder: olehHr ? 'Wajib: alasan pembatalan' : 'Opsional' });
    var salah = h('div');
    modal({ judul: 'Batalkan ' + p.no + '?', isi: h('div', {}, h('p', { text: olehHr ? 'Cuti sudah disetujui. Kalau dibatalkan, saldo dikembalikan ' + p.jumlahHari + ' hari dan karyawan diberi tahu.' : 'Pengajuan dihentikan dan tidak bisa dilanjutkan lagi.' }),
      h('label', { class: 'lbl', for: 'alasanBatal', text: 'Alasan' }), alasan, salah),
      tombol: [{ teks: 'Tidak', nilai: null }, { teks: 'Ya, batalkan', kelas: 'bahaya', aksi: function () {
        kosongkan(salah);
        return api.panggil('batal', { no: p.no, alasan: alasan.value.trim() }).then(function (r) {
          if (!r.ok) { salah.appendChild(h('div', { class: 'pesan-salah' }, ikon('peringatan'), h('span', { text: r.error }))); return false; }
          toast('Pengajuan dibatalkan', 'sukses'); rute(); return true;
        });
      } }]
    });
  }

  // ---------- L7 Approval ----------
  function layarApproval(el) {
    if (!approver()) { el.appendChild(h('div', { class: 'kartu kosong', text: 'Menu ini hanya untuk approver.' })); return; }
    var q = { cari: '', dept: '', offset: 0 };
    el.appendChild(judul('Menunggu persetujuan', tombolMuatUlang(function () { q.offset = 0; muatData(); })));
    var peranSaya = S.user.peran.filter(function (r) { return ['atasan', 'head', 'hr', 'gm'].indexOf(r) >= 0; }).map(function (r) { return NAMA_PERAN[r]; });
    el.appendChild(h('p', { class: 'muted', style: 'margin:-8px 0 12px', text: 'Hanya pengajuan yang sedang di tahap Anda (' + peranSaya.join(', ') + '). Paling lama menunggu di atas.' }));
    var cari = h('input', { type: 'search', placeholder: 'Cari nama, NIK, atau nomor', 'aria-label': 'Cari' });
    var dept = h('select', { 'aria-label': 'Filter dept' }, h('option', { value: '', text: 'Semua dept' }));
    var t; cari.addEventListener('input', function () { clearTimeout(t); t = setTimeout(function () { q.cari = cari.value; q.offset = 0; muatData(); }, 300); });
    dept.addEventListener('change', function () { q.dept = dept.value; q.offset = 0; muatData(); });
    el.appendChild(h('div', { class: 'alat' }, cari, dept));
    var daftar = h('div'); el.appendChild(daftar);
    function muatData() {
      kosongkan(daftar).appendChild(muat());
      api.panggil('antrian', { cari: q.cari, dept: q.dept, limit: 50, offset: 0 }).then(function (r) {
        if (!r.ok) return gagal(daftar, r, muatData);
        if (dept.options.length === 1) r.data.dept.forEach(function (x) { dept.appendChild(h('option', { value: x, text: x })); });
        if (!q.cari && !q.dept) { S.antrian = r.data.total; perbaruiBadge(); }
        kosongkan(daftar);
        daftar.appendChild(h('div', { class: 'daftar' }, r.data.items.length ? r.data.items.map(function (p) {
          return itemPengajuan(p, '#/pengajuan/' + encodeURIComponent(p.no) + '?dari=approval', { nama: true, lama: p.lamaMenungguHari });
        }) : h('div', { class: 'kosong', text: q.cari || q.dept ? 'Tidak ada yang cocok.' : 'Tidak ada pengajuan yang menunggu Anda.' })));
      });
    }
    muatData();
  }

  // ---------- L9 Lainnya ----------
  function layarLainnya(el) {
    el.appendChild(judul('Profil'));
    var m = function (href, i, t, s, fn) { return h(fn ? 'button' : 'a', fn ? { type: 'button', onclick: fn } : { href: href }, h('span', { class: 'ik' }, ikon(i)), h('b', { text: t }), h('small', { text: s })); };
    el.appendChild(h('div', { class: 'kartu profil-kartu', style: 'margin-bottom:14px' }, avatar(S.user.nama, S.user.nik, 'besar'), h('div', {}, h('b', { text: S.user.nama }), h('span', { class: 'muted', text: S.user.jabatan + ' · ' + S.user.dept + ' · NIK ' + S.user.nik }))));
    el.appendChild(h('div', { class: 'menu-lain' },
      m('#/mutasi', 'buku', 'Mutasi saldo saya', 'Riwayat hak, pemakaian, koreksi'),
      m('#/riwayat', 'jam', 'Riwayat pengajuan', 'Status semua pengajuan'),
      m('#/ganti-pin', 'kunci', 'Ganti PIN', 'PIN 6 angka untuk masuk'),
      m(null, 'keluar', 'Keluar', S.user.nama, function () { keluar(); })));
    var admin = [];
    if (punya('hr') || punya('admin')) admin.push(m('#/hr/saldo', 'orang', 'Saldo karyawan', punya('hr') ? 'Semua dept' : 'Dept ' + S.user.dept));
    if (punya('hr')) admin.push(m('#/hr/penyesuaian', 'timbang', 'Penyesuaian saldo', 'Koreksi saldo, wajib alasan'));
    if (punya('hr') || punya('admin')) admin.push(m('#/hr/reset-pin', 'kunci', 'Reset PIN', 'Buat PIN sementara'));
    if (punya('hr') || punya('gm')) admin.push(m('#/rekap', 'grafik', 'Rekap cuti', 'Per dept, ekspor CSV'));
    if (admin.length) { el.appendChild(h('h2', { text: 'Menu ' + S.user.peran.filter(function (r) { return ['hr', 'gm', 'admin'].indexOf(r) >= 0; }).map(function (r) { return NAMA_PERAN[r]; }).join(' / ') })); el.appendChild(h('div', { class: 'menu-lain' }, admin)); }
  }

  // ---------- L10 Mutasi ----------
  function tabelMutasi(items) {
    if (!items.length) return h('div', { class: 'daftar' }, h('div', { class: 'kosong', text: 'Belum ada mutasi.' }));
    return h('div', { class: 'tabel-bungkus' }, h('table', { class: 'tabel' },
      h('thead', {}, h('tr', {}, ['Tanggal', 'Jenis', 'Tipe', 'Jumlah', 'Saldo', 'Ref / alasan', 'Oleh'].map(function (x, i) { return h('th', { class: i === 3 || i === 4 ? 'angka' : '', text: x }); }))),
      h('tbody', {}, items.map(function (m) {
        return h('tr', {}, h('td', { text: tgl(m.tanggal) }), h('td', { text: LABEL_JENIS[m.jenis].replace('Cuti ', '') }), h('td', {}, h('span', { class: 'tipe', text: m.tipe })),
          h('td', { class: 'angka ' + (m.jumlah > 0 ? 'plus' : 'minus'), text: (m.jumlah > 0 ? '+' : '') + m.jumlah }), h('td', { class: 'angka', text: m.saldoBerjalan }),
          h('td', { style: 'white-space:normal;min-width:220px' }, m.refNo ? h('a', { class: 'no', href: '#/pengajuan/' + encodeURIComponent(m.refNo), text: m.refNo }) : null, m.refNo ? h('br') : null, m.alasan),
          h('td', { text: m.olehNama }));
      }))));
  }
  function layarMutasi(el, arg) {
    var nik = arg[0];
    el.appendChild(kembali(nik ? '#/hr/karyawan/' + nik : '#/lainnya', nik ? 'Profil karyawan' : 'Profil'));
    var wadah = h('div'); el.appendChild(wadah); wadah.appendChild(muat());
    api.panggil('mutasi', nik ? { nik: nik } : {}).then(function (r) {
      if (!r.ok) return gagal(wadah, r);
      kosongkan(wadah);
      wadah.appendChild(judul('Mutasi saldo' + (nik ? ': ' + r.data.nama : '')));
      wadah.appendChild(h('p', { class: 'muted', style: 'margin:-8px 0 12px', text: 'Saldo = jumlah semua baris di bawah. Tidak ada angka yang diedit tangan; koreksi HR muncul sebagai SESUAI dengan alasan.' }));
      wadah.appendChild(h('div', { class: 'saldo-terang-deret' }, r.data.saldo.map(function (s) { return kartuSaldo(s, true); })));
      wadah.appendChild(tabelMutasi(r.data.items));
    });
  }

  // ---------- L11 Saldo karyawan ----------
  function layarSaldoKaryawan(el) {
    if (!punya('hr') && !punya('admin')) { el.appendChild(h('div', { class: 'kartu kosong', text: 'Menu ini untuk HR dan admin dept.' })); return; }
    var q = { cari: '', dept: '' };
    el.appendChild(kembali('#/lainnya', 'Profil'));
    el.appendChild(judul('Saldo karyawan', tombolMuatUlang(function () { muatData(); })));
    var cari = h('input', { type: 'search', placeholder: 'Cari nama atau NIK', 'aria-label': 'Cari' });
    var dept = h('select', { 'aria-label': 'Filter dept' }, h('option', { value: '', text: 'Semua dept' }));
    var t; cari.addEventListener('input', function () { clearTimeout(t); t = setTimeout(function () { q.cari = cari.value; muatData(); }, 300); });
    dept.addEventListener('change', function () { q.dept = dept.value; muatData(); });
    el.appendChild(h('div', { class: 'alat' }, cari, punya('hr') ? dept : null));
    var wadah = h('div'); el.appendChild(wadah);
    function muatData() {
      kosongkan(wadah).appendChild(muat());
      api.panggil('saldoKaryawan', { cari: q.cari, dept: q.dept, limit: 100 }).then(function (r) {
        if (!r.ok) return gagal(wadah, r, muatData);
        if (dept.options.length === 1) r.data.dept.forEach(function (x) { dept.appendChild(h('option', { value: x, text: x })); });
        kosongkan(wadah);
        var ambil = function (k, j) { var s = k.saldo.filter(function (x) { return x.jenis === j; })[0]; return s ? String(s.tersedia) : '-'; };
        wadah.appendChild(h('div', { class: 'tabel-bungkus' }, h('table', { class: 'tabel' },
          h('thead', {}, h('tr', {}, h('th', { text: 'Karyawan' }), h('th', { text: 'Dept' }), h('th', { class: 'angka', text: 'Tahunan' }), h('th', { class: 'angka', text: 'Lapangan' }), h('th', { class: 'angka', text: 'Outstanding' }))),
          h('tbody', {}, r.data.items.length ? r.data.items.map(function (k) {
            return h('tr', { class: punya('hr') ? 'klik' : '', tabindex: punya('hr') ? '0' : null, 'data-nik': k.nik },
              h('td', {}, h('b', { text: k.nama }), h('div', { class: 'muted', text: k.nik + ' · ' + k.jabatan })), h('td', { text: k.dept }),
              h('td', { class: 'angka', text: ambil(k, 'TAHUNAN') }), h('td', { class: 'angka', text: ambil(k, 'LAPANGAN') }), h('td', { class: 'angka', text: ambil(k, 'OUTSTANDING') }));
          }) : h('tr', {}, h('td', { colspan: 5, class: 'kosong', text: 'Tidak ada yang cocok.' }))))));
        wadah.appendChild(h('p', { class: 'muted', text: 'Angka = saldo tersedia (sudah dikurangi pengajuan yang menunggu). ' + (punya('hr') ? 'Klik baris untuk profil, penyesuaian, reset PIN.' : '') }));
      });
    }
    wadah.addEventListener('click', function (e) { var tr = e.target.closest('tr[data-nik]'); if (tr && punya('hr')) pindah('hr/karyawan/' + tr.getAttribute('data-nik')); });
    wadah.addEventListener('keydown', function (e) { var tr = e.target.closest('tr[data-nik]'); if (tr && e.key === 'Enter' && punya('hr')) pindah('hr/karyawan/' + tr.getAttribute('data-nik')); });
    muatData();
  }

  // ---------- L12 Profil karyawan ----------
  function layarProfil(el, arg) {
    var nik = arg[0];
    el.appendChild(kembali('#/hr/saldo', 'Saldo karyawan'));
    var wadah = h('div'); el.appendChild(wadah); wadah.appendChild(muat());
    Promise.all([api.panggil('saldoKaryawan', { cari: nik, limit: 5 }), api.panggil('mutasi', { nik: nik })]).then(function (rr) {
      if (!rr[0].ok) return gagal(wadah, rr[0]);
      if (!rr[1].ok) return gagal(wadah, rr[1]);
      var k = rr[0].data.items.filter(function (x) { return x.nik === nik; })[0];
      if (!k) return gagal(wadah, { error: 'Karyawan tidak ditemukan' });
      kosongkan(wadah);
      wadah.appendChild(judul(k.nama));
      wadah.appendChild(h('div', { class: 'kartu' }, h('dl', { class: 'rinci' }, h('dt', { text: 'NIK' }), h('dd', { text: k.nik }), h('dt', { text: 'Dept' }), h('dd', { text: k.dept }),
        h('dt', { text: 'Jabatan' }), h('dd', { text: k.jabatan }), h('dt', { text: 'Pola kerja' }), h('dd', { text: k.pola })),
        h('p', { class: 'muted', style: 'margin:10px 0 0', text: 'Data karyawan diubah langsung di sheet Karyawan oleh HR (paket awal).' })));
      wadah.appendChild(h('div', { class: 'saldo-terang-deret', style: 'margin-top:12px' }, k.saldo.map(function (s) { return kartuSaldo(s, true); })));
      wadah.appendChild(h('div', { class: 'baris-tombol' },
        h('a', { class: 'tombol gelap', href: '#/hr/penyesuaian/' + k.nik }, ikon('timbang'), 'Penyesuaian saldo'),
        h('button', { class: 'tombol', type: 'button', onclick: function () { resetPin(k); } }, ikon('kunci'), 'Reset PIN')));
      wadah.appendChild(h('h2', { text: 'Mutasi saldo' }));
      wadah.appendChild(tabelMutasi(rr[1].data.items));
    });
  }

  // ---------- L13 Penyesuaian ----------
  function layarPenyesuaian(el, arg) {
    if (!punya('hr')) { el.appendChild(h('div', { class: 'kartu kosong', text: 'Menu ini untuk HR.' })); return; }
    var nikAwal = arg[0] || '';
    el.appendChild(kembali(nikAwal ? '#/hr/karyawan/' + nikAwal : '#/lainnya', nikAwal ? 'Profil karyawan' : 'Profil'));
    el.appendChild(judul('Penyesuaian saldo'));
    var wadah = h('div'); el.appendChild(wadah); wadah.appendChild(muat());
    api.panggil('saldoKaryawan', { limit: 100 }).then(function (r) {
      if (!r.ok) return gagal(wadah, r);
      kosongkan(wadah);
      var data = r.data.items;
      var orang = h('select', { id: 'orang', required: true }, h('option', { value: '', text: 'Pilih karyawan' }),
        data.map(function (k) { return h('option', { value: k.nik, text: k.nama + ' · ' + k.nik + ' · ' + k.dept, selected: k.nik === nikAwal }); }));
      var jenis = h('select', { id: 'jenisSesuai', required: true });
      var jumlah = h('input', { type: 'number', id: 'jumlah', step: '1', required: true, placeholder: 'Contoh: 2 atau -1' });
      var alasan = h('textarea', { id: 'alasanSesuai', required: true, maxlength: 300, placeholder: 'Wajib. Contoh: koreksi salah hitung Oktober, memo HR no. 12' });
      var pratinjau = h('div', { class: 'perkiraan' }, h('span', { class: 'muted', text: 'Pilih karyawan, jenis, dan jumlah.' }));
      var salah = h('div');
      var btn = h('button', { class: 'tombol utama penuh', type: 'submit' }, ikon('timbang'), 'Simpan penyesuaian');
      function isiJenis() {
        var k = data.filter(function (x) { return x.nik === orang.value; })[0];
        kosongkan(jenis);
        (k ? k.saldo : []).forEach(function (s) { jenis.appendChild(h('option', { value: s.jenis, text: s.label + ' (saldo ' + s.saldo + ')' })); });
        hitungPratinjau();
      }
      function hitungPratinjau() {
        var k = data.filter(function (x) { return x.nik === orang.value; })[0];
        var s = k && k.saldo.filter(function (x) { return x.jenis === jenis.value; })[0];
        kosongkan(pratinjau);
        if (!s) { pratinjau.appendChild(h('span', { class: 'muted', text: 'Pilih karyawan, jenis, dan jumlah.' })); return; }
        var j = Number(jumlah.value) || 0;
        pratinjau.appendChild(h('div', { class: 'baris' }, h('span', { text: 'Saldo sekarang' }), h('b', { text: s.saldo + ' hari' })));
        pratinjau.appendChild(h('div', { class: 'baris' }, h('span', { text: 'Penyesuaian' }), h('b', { class: j > 0 ? 'plus' : j < 0 ? 'minus' : '', text: (j > 0 ? '+' : '') + j + ' hari' })));
        pratinjau.appendChild(h('div', { class: 'baris' }, h('span', { text: 'Saldo sesudah' }), h('b', { text: (s.saldo + j) + ' hari' })));
      }
      orang.addEventListener('change', isiJenis); jenis.addEventListener('change', hitungPratinjau); jumlah.addEventListener('input', hitungPratinjau);
      var form = h('form', { class: 'kartu', onsubmit: function (e) {
        e.preventDefault(); kosongkan(salah);
        var d = { nik: String(orang.value), jenis: String(jenis.value), jumlah: Number(jumlah.value), alasan: String(alasan.value).trim() };
        var k = data.filter(function (x) { return x.nik === d.nik; })[0];
        modal({ judul: 'Simpan penyesuaian?', isi: h('p', { text: (k ? k.nama : d.nik) + ': ' + LABEL_JENIS[d.jenis] + ' ' + (d.jumlah > 0 ? '+' : '') + d.jumlah + ' hari. Alasan: ' + d.alasan }),
          tombol: [{ teks: 'Batal', nilai: false }, { teks: 'Simpan', kelas: 'utama', nilai: true }] }).then(function (ok) {
          if (!ok) return;
          prosesTombol(btn, function () {
            return api.panggil('penyesuaian', d).then(function (r2) {
              if (!r2.ok) { salah.appendChild(h('div', { class: 'pesan-salah', role: 'alert' }, ikon('peringatan'), h('span', { text: r2.error }))); return; }
              toast('Tersimpan. Saldo ' + r2.data.saldo.label.toLowerCase() + ' sekarang ' + r2.data.saldo.saldo + ' hari.', 'sukses');
              pindah('hr/karyawan/' + d.nik);
            });
          });
        });
      } },
        h('div', { class: 'isian' }, h('label', { class: 'lbl', for: 'orang', text: 'Karyawan' }), orang),
        h('div', { class: 'dua isian' }, h('div', {}, h('label', { class: 'lbl', for: 'jenisSesuai', text: 'Jenis cuti' }), jenis), h('div', {}, h('label', { class: 'lbl', for: 'jumlah', text: 'Jumlah hari (+/-)' }), jumlah)),
        pratinjau,
        h('div', { class: 'isian' }, h('label', { class: 'lbl', for: 'alasanSesuai', text: 'Alasan' }), alasan),
        h('p', { class: 'muted', text: 'Tercatat sebagai mutasi SESUAI dengan nama Anda, terlihat di riwayat mutasi karyawan.' }), salah, btn);
      wadah.appendChild(form);
      if (nikAwal) isiJenis();
    });
  }

  // ---------- L14 Reset PIN ----------
  function resetPin(k) {
    modal({ judul: 'Reset PIN ' + k.nama + '?', isi: h('p', { text: 'PIN lama tidak berlaku, semua sesi login orang ini dicabut. PIN sementara tampil sekali, berikan langsung ke karyawan.' }),
      tombol: [{ teks: 'Batal', nilai: null }, { teks: 'Reset PIN', kelas: 'gelap', aksi: function () {
        return api.panggil('resetPin', { nik: k.nik }).then(function (r) {
          if (!r.ok) { toast(r.error, 'gagal'); return true; }
          setTimeout(function () {
            modal({ judul: 'PIN sementara', wajib: true, isi: h('div', {}, h('p', { text: r.data.nama + ' · NIK ' + r.data.nik }), h('div', { class: 'pin-besar', id: 'pinSementara', text: r.data.pinSementara }),
              h('p', { text: 'Catat sekarang. PIN ini tidak bisa dilihat lagi. Karyawan wajib ganti PIN saat masuk.' })),
              tombol: [{ teks: 'Sudah dicatat', kelas: 'utama', nilai: true }] });
          }, 50);
          return true;
        });
      } }] });
  }
  function layarResetPin(el) {
    if (!punya('hr') && !punya('admin')) { el.appendChild(h('div', { class: 'kartu kosong', text: 'Menu ini untuk HR dan admin dept.' })); return; }
    el.appendChild(kembali('#/lainnya', 'Profil'));
    el.appendChild(judul('Reset PIN'));
    el.appendChild(h('p', { class: 'muted', style: 'margin:-8px 0 12px', text: punya('hr') ? 'Semua karyawan.' : 'Karyawan dept ' + S.user.dept + '.' }));
    var cari = h('input', { type: 'search', placeholder: 'Cari nama atau NIK', 'aria-label': 'Cari' });
    el.appendChild(h('div', { class: 'alat' }, cari));
    var wadah = h('div'); el.appendChild(wadah);
    var data = [];
    function gambar() {
      var q = cari.value.toLowerCase().trim();
      kosongkan(wadah).appendChild(h('div', { class: 'daftar' }, data.filter(function (k) { return !q || (k.nama + ' ' + k.nik).toLowerCase().indexOf(q) >= 0; }).map(function (k) {
        return h('div', { class: 'item', style: 'cursor:default' }, h('div', { class: 'isi' }, h('div', { class: 't1', text: k.nama }), h('div', { class: 't2', text: k.nik + ' · ' + k.dept + ' · ' + k.jabatan })),
          h('button', { class: 'tombol kecil', type: 'button', 'data-nik': k.nik, onclick: function () { resetPin(k); } }, ikon('kunci'), 'Reset'));
      })));
    }
    cari.addEventListener('input', gambar);
    wadah.appendChild(muat());
    api.panggil('saldoKaryawan', { limit: 100 }).then(function (r) { if (!r.ok) return gagal(wadah, r); data = r.data.items; gambar(); });
  }

  // ---------- L15 Rekap ----------
  function layarRekap(el) {
    if (!punya('hr') && !punya('gm')) { el.appendChild(h('div', { class: 'kartu kosong', text: 'Menu ini untuk HR dan GM.' })); return; }
    el.appendChild(kembali('#/lainnya', 'Profil'));
    var th = new Date().getFullYear();
    var tahun = h('select', { 'aria-label': 'Tahun' }, [th + 1, th, th - 1].map(function (y) { return h('option', { value: y, text: y, selected: y === th }); }));
    var bulan = h('select', { 'aria-label': 'Bulan' }, h('option', { value: '', text: 'Setahun penuh' }), BULAN_PANJANG.map(function (b, i) { return h('option', { value: i + 1, text: b }); }));
    var hasil = null;
    var btnCsv = h('button', { class: 'tombol kecil', type: 'button', onclick: unduh }, ikon('unduh'), 'Ekspor CSV');
    el.appendChild(judul('Rekap cuti per dept', btnCsv));
    el.appendChild(h('div', { class: 'alat' }, tahun, bulan));
    var wadah = h('div'); el.appendChild(wadah);
    tahun.addEventListener('change', muatData); bulan.addEventListener('change', muatData);
    var KOL = [['dept', 'Dept'], ['karyawan', 'Karyawan'], ['menunggu', 'Menunggu'], ['disetujui', 'Disetujui'], ['ditolak', 'Ditolak'], ['hariDisetujui', 'Hari disetujui']];
    function muatData() {
      kosongkan(wadah).appendChild(muat());
      api.panggil('rekap', { tahun: Number(tahun.value), bulan: bulan.value ? Number(bulan.value) : null }).then(function (r) {
        if (!r.ok) return gagal(wadah, r, muatData);
        hasil = r.data; kosongkan(wadah);
        var t = r.data.total;
        wadah.appendChild(h('div', { class: 'saldo-terang-deret' },
          h('div', { class: 'saldo terang' }, h('div', { class: 'label', text: 'Menunggu' }), h('div', { class: 'angka', text: t.menunggu })),
          h('div', { class: 'saldo terang' }, h('div', { class: 'label', text: 'Disetujui' }), h('div', { class: 'angka', text: t.disetujui })),
          h('div', { class: 'saldo terang' }, h('div', { class: 'label', text: 'Hari disetujui' }), h('div', { class: 'angka', text: t.hariDisetujui }))));
        wadah.appendChild(h('div', { class: 'tabel-bungkus' }, h('table', { class: 'tabel' },
          h('thead', {}, h('tr', {}, KOL.map(function (k, i) { return h('th', { class: i ? 'angka' : '', text: k[1] }); }))),
          h('tbody', {}, r.data.baris.concat([t]).map(function (b) { return h('tr', { class: b === t ? 'total' : '' }, KOL.map(function (k, i) { return h('td', { class: i ? 'angka' : '', text: b[k[0]] }); })); })))));
        wadah.appendChild(h('p', { class: 'muted', text: 'Periode ' + r.data.periode + '. Pengajuan dihitung kalau tanggal cutinya masuk periode ini.' }));
      });
    }
    function unduh() {
      if (!hasil) return;
      var baris = [KOL.map(function (k) { return k[1]; })].concat(hasil.baris.concat([hasil.total]).map(function (b) { return KOL.map(function (k) { return b[k[0]]; }); }));
      var csv = baris.map(function (r) { return r.map(function (v) { v = String(v); return /[",;\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(','); }).join('\n');
      if (RUTE_MEMORI) {
        if (!navigator.clipboard) return toast('Unduhan tidak tersedia di pratinjau ini', 'gagal');
        return navigator.clipboard.writeText(csv).then(function () { toast('CSV disalin. Paste ke Excel/Sheets. (Di aplikasi asli berupa unduhan file.)', 'sukses'); },
          function () { toast('Tidak bisa menyalin di pratinjau ini', 'gagal'); });
      }
      try {
        var a = h('a', { href: URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' })), download: 'rekap-cuti-' + hasil.periode + '.csv' });
        document.body.appendChild(a); a.click(); a.remove();
        toast('File CSV diunduh', 'sukses');
      } catch (e) { toast('Browser ini memblokir unduhan', 'gagal'); }
    }
    muatData();
  }

  // ---------- D1 Panel demo ----------
  function laciDemo() {
    var lama = document.querySelector('.laci'); if (lama) { lama.remove(); return; }
    var badan = h('div', { class: 'badan' });
    var laci = h('aside', { class: 'laci', 'aria-label': 'Panel demo' }, h('div', { class: 'kepala' }, h('b', { text: 'Panel demo' }),
      h('button', { class: 'tombol kecil', type: 'button', 'aria-label': 'Tutup', onclick: function () { laci.remove(); } }, ikon('silang'))), badan);
    document.body.appendChild(laci);
    badan.appendChild(h('p', { class: 'muted', style: 'margin-top:0', text: 'Semua data fiktif dan tersimpan di browser ini saja. Email tidak benar-benar dikirim.' }));
    badan.appendChild(h('h2', { style: 'margin-top:0', text: 'Ganti akun' }));
    var akun = h('div', { class: 'akun-demo', style: 'border:0;padding:0;margin:0' }); badan.appendChild(akun);
    badan.appendChild(h('h2', { text: 'Email terkirim (simulasi)' }));
    var email = h('div'); badan.appendChild(email);
    badan.appendChild(h('h2', { text: 'Data' }));
    badan.appendChild(h('button', { class: 'tombol garis-bahaya penuh', type: 'button', onclick: function () {
      modal({ judul: 'Reset data demo?', isi: h('p', { text: 'Semua pengajuan, saldo, dan PIN kembali ke kondisi awal.' }),
        tombol: [{ teks: 'Batal', nilai: false }, { teks: 'Reset', kelas: 'bahaya', aksi: function () {
          return api.panggil('demoReset').then(function () { api.simpanToken(null); S.user = null; laci.remove(); toast('Data demo direset', 'sukses'); pindah('masuk'); return true; });
        } }] });
    } }, ikon('ulang'), 'Reset data demo'));
    api.panggil('demoAkun').then(function (r) {
      if (!r.ok) return;
      akun.appendChild(h('div', { class: 'grid-akun' }, r.data.map(function (a) {
        return h('button', { type: 'button', 'data-nik': a.nik, style: S.user && S.user.nik === a.nik ? 'border-color:var(--aksen);background:#fffbeb' : '', onclick: function (e) {
          prosesTombol(e.currentTarget, function () {
            var lanjut = S.user ? api.panggil('logout') : Promise.resolve();
            return lanjut.then(function () { api.simpanToken(null); S.user = null; return masuk(a.nik, '123456', false, null); })
              .then(function (ok) { if (ok) { laci.remove(); toast('Masuk sebagai ' + a.nama + ' (' + a.keterangan + ')'); } else pindah('masuk'); });
          });
        } }, h('b', { text: a.keterangan }), a.nama);
      })));
    });
    api.panggil('demoEmail').then(function (r) {
      if (!r.ok) return;
      if (!r.data.items.length) email.appendChild(h('div', { class: 'muted', text: 'Belum ada email. Coba ajukan atau setujui cuti.' }));
      r.data.items.slice(0, 20).forEach(function (m) {
        email.appendChild(h('div', { class: 'email' }, h('div', { class: 'ke', text: waktu(m.waktu) + ' · ke ' + m.nama + ' <' + m.ke + '>' }), h('b', { text: m.subjek }), h('div', { text: m.isi })));
      });
    });
  }

  // ---------- mulai ----------
  window.CutiApp = {
    sesiHabis: function (pesan) {
      if (!S.user) return;
      S.user = null; toast(pesan || 'Sesi habis, silakan masuk lagi', 'gagal'); pindah('masuk');
    }
  };
  function mulai() {
    if (!api.ambilToken()) return rute();
    kosongkan(app).appendChild(muat());
    api.panggil('beranda').then(function (r) {
      if (r.ok) { S.user = r.data.user; S.antrian = r.data.antrianSaya; return rute(); }
      if (r.kode === 'DITOLAK' && /Ganti PIN/.test(r.error)) {
        // perlu ganti PIN: ambil identitas minimal dari token lewat aksi yang boleh (gantiPin gagal tetap kasih tahu)
        S.user = { nik: '', nama: '', peran: ['karyawan'] }; S.wajibGanti = true; return rute();
      }
      api.simpanToken(null); rute();
    });
  }
  if ('serviceWorker' in navigator && location.protocol === 'https:' && window.top === window.self) {
    navigator.serviceWorker.register('sw.js').catch(function () { });
  }
  mulai();
})();
