/* Satu-satunya pintu ke server. Layar tidak pernah fetch langsung.
   MODE 'demo' -> web/mock.js di browser. MODE 'asli' -> GAS Web App (fase 7). */
(function (root) {
  'use strict';
  var MODE = 'demo';
  var API_URL = 'https://script.google.com/macros/s/GANTI_DEPLOYMENT_ID/exec';
  var tokenMemori = null;

  function ambilToken() { try { return root.localStorage.getItem('cuti-token') || tokenMemori; } catch (e) { return tokenMemori; } }
  function simpanToken(t) {
    tokenMemori = t;
    try { if (t) root.localStorage.setItem('cuti-token', t); else root.localStorage.removeItem('cuti-token'); } catch (e) { }
  }
  function jeda() { return new Promise(function (r) { setTimeout(r, 300 + Math.random() * 300); }); }

  function panggil(aksi, data) {
    var body = JSON.stringify({ aksi: aksi, token: ambilToken(), data: data || {} });
    var janji;
    if (MODE === 'demo') {
      janji = jeda().then(function () { return JSON.parse(root.CutiMock.proses(body)); });
    } else {
      janji = fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: body })
        .then(function (r) { return r.json(); });
    }
    return janji.catch(function () {
      return { ok: false, kode: 'JARINGAN', error: 'Tidak bisa menghubungi server. Cek koneksi lalu coba lagi.' };
    }).then(function (hasil) {
      if (!hasil.ok && hasil.kode === 'BELUM_LOGIN') { simpanToken(null); if (root.CutiApp) root.CutiApp.sesiHabis(hasil.error); }
      return hasil;
    });
  }

  root.CutiApi = { MODE: MODE, panggil: panggil, simpanToken: simpanToken, ambilToken: ambilToken };
})(this);
