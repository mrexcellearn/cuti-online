# Kontrak API Cuti Online

Versi 1 (2026-11-11). Dipakai `web/mock.js` (demo) dan nanti `gas/Router.gs` (fase 6). Kalau ada aksi/field baru, tulis di sini dulu.

## Aturan umum

- `POST` ke URL Web App, `Content-Type: text/plain;charset=utf-8`, body JSON string `{ "aksi": "...", "token": "...", "data": { ... } }`. Tanpa header custom.
- Balasan selalu HTTP 200: `{ "ok": true, "data": ... }` atau `{ "ok": false, "kode": "...", "error": "pesan untuk user" }`.
- Kode error:

| Kode | Arti | Frontend |
|---|---|---|
| `VALIDASI` | Input salah / aturan bisnis dilanggar (saldo kurang, bentrok, alasan kosong) | Tampilkan `error` di form |
| `BELUM_LOGIN` | Token kosong, salah, kedaluwarsa, atau dicabut | Hapus token, ke `#/masuk` |
| `DITOLAK` | Peran tidak berhak / bukan datanya | Toast `error` |
| `SUDAH_DIPROSES` | Pengajuan sudah diputuskan/dibatalkan orang lain | Toast, muat ulang daftar |
| `TERKUNCI` | Akun terkunci karena PIN salah 5x | Tampilkan jam buka |
| `ERROR` | Error server tak terduga | "Ada kesalahan di server, coba lagi" |

- Tanggal `yyyy-MM-dd`, waktu `yyyy-MM-dd HH:mm:ss` (Asia/Jakarta).
- Jenis cuti: `TAHUNAN` (hari kerja), `LAPANGAN` (hari kalender, hanya pola lapangan), `OUTSTANDING` (hari kerja).
- Status: `MENUNGGU` (+ `tahap` 1-4), `DISETUJUI`, `DITOLAK`, `DIBATALKAN`. Tahap: 1 Atasan, 2 Head Dept, 3 HR, 4 GM.
- Peran: `karyawan`, `atasan`, `head`, `hr`, `gm`, `admin` (admin dept), `sistem`.
- Semua daftar pakai `limit` (default 20, maks 100) + `offset`, balasan `{ items, total }`.

## Objek

```
User      { nik, nama, dept, jabatan, peran: [..], pola: "lapangan"|"kantor" }
Saldo     { jenis, label, saldo, menunggu, tersedia }
Pengajuan { no, nik, nama, dept, jenis, mulai, selesai, jumlahHari, alasan, status, tahap, labelStatus, diinputOleh, dibuat, diperbarui }
Jejak     { waktu, nik, nama, aksi: "AJUKAN"|"SETUJU"|"TOLAK"|"LEWATI"|"BATAL", tahap, catatan }
Mutasi    { id, tanggal, jenis, tipe: "HAK"|"PAKAI"|"BATAL"|"SESUAI"|"HANGUS", jumlah, refNo, alasan, oleh, saldoBerjalan }
```

## Aksi

| Aksi | Peran | data | Balasan `data` | Error khusus |
|---|---|---|---|---|
| `login` | publik | `{ nik, pin, ingat }` | `{ token, kedaluwarsa, user, wajibGantiPin }` | `VALIDASI` "NIK atau PIN salah (sisa N percobaan)", "NIK tidak aktif"; `TERKUNCI` "Akun terkunci sampai HH:mm" |
| `logout` | semua | `{}` | `{}` | |
| `gantiPin` | semua (juga saat wajibGantiPin) | `{ pinLama, pinBaru }` | `{}` | `VALIDASI` PIN lama salah, PIN baru bukan 6 angka, PIN lemah (`123456`, `000000`, angka sama semua, sama dengan PIN lama) |
| `beranda` | semua | `{}` | `{ user, saldo: [Saldo], terakhir: [Pengajuan x3], antrianSaya }` | |
| `hitung` | semua | `{ jenis, mulai, selesai }` | `{ jumlahHari, satuan: "hari kerja"|"hari kalender", liburDilewati: [{tanggal, keterangan}], saldo: Saldo, sisaSesudah, boleh, pesan }` | `boleh:false` + `pesan` untuk saldo kurang / bentrok / tanggal lewat (bukan error, supaya form bisa tampilkan) |
| `ajukan` | semua | `{ jenis, mulai, selesai, alasan }` | `{ no, status, tahap, labelStatus }` | `VALIDASI` sama seperti `hitung` + alasan kosong / > 300 karakter |
| `riwayat` | semua | `{ status?, limit, offset }` | `{ items: [Pengajuan], total }` | |
| `detail` | pemilik, approver tahap yang sedang/sudah lewat, hr, gm | `{ no }` | `{ pengajuan, jejak: [Jejak], tahapan: [{tahap, label, status: "selesai"|"aktif"|"lewat"|"menunggu"|"tolak", oleh, waktu}], bisaBatal, bisaBatalHr, bisaPutuskan, saldoPengaju? }` | `DITOLAK` bukan haknya |
| `batal` | pemilik (MENUNGGU), hr (DISETUJUI, alasan wajib) | `{ no, alasan }` | `{ status }` | `SUDAH_DIPROSES`; `VALIDASI` alasan kosong (HR) |
| `antrian` | atasan, head, hr, gm | `{ cari?, dept?, limit, offset }` | `{ items: [Pengajuan + lamaMenungguHari], total, dept: [..] }` | `DITOLAK` bukan approver |
| `putuskan` | approver tahap itu | `{ no, keputusan: "setujui"|"tolak", catatan }` | `{ status, tahap, labelStatus }` | `SUDAH_DIPROSES`; `VALIDASI` catatan wajib saat tolak; `DITOLAK` bukan approver tahap ini |
| `mutasi` | semua; hr untuk nik lain | `{ nik?, jenis? }` | `{ nik, nama, items: [Mutasi], saldo: [Saldo] }` | `DITOLAK` nik lain tanpa peran hr |
| `saldoKaryawan` | hr (semua), admin (dept sendiri) | `{ cari?, dept?, limit, offset }` | `{ items: [{ nik, nama, dept, jabatan, pola, saldo: [Saldo] }], total, dept: [..] }` | |
| `penyesuaian` | hr | `{ nik, jenis, jumlah, alasan }` | `{ id, saldo: Saldo }` | `VALIDASI` jumlah bukan bilangan bulat / 0, alasan kosong, saldo jadi minus |
| `resetPin` | hr, admin (dept sendiri) | `{ nik }` | `{ nik, nama, pinSementara }` | `DITOLAK` beda dept (admin) |
| `rekap` | hr, gm | `{ tahun, bulan? }` | `{ periode, baris: [{ dept, karyawan, menunggu, disetujui, ditolak, hariDisetujui }], total }` | |

## Aturan server (wajib di mock dan di GAS)

- Cek peran untuk tiap aksi dari data karyawan di server, bukan dari frontend.
- `hitung` dan `ajukan` pakai fungsi yang sama: hari kerja Senin-Jumat dikurangi tanggal di `Libur` (TAHUNAN/OUTSTANDING), hari kalender (LAPANGAN). Hasil 0 hari ditolak. Rentang maks 60 hari kalender.
- Tersedia = jumlah mutasi - jumlah hari pengajuan `MENUNGGU`.
- Bentrok = rentang tumpang tindih dengan pengajuan milik NIK sama yang `MENUNGGU`/`DISETUJUI`.
- Tanggal mulai tidak boleh sebelum hari ini.
- Nomor `CUTI-YYYYMM-XXX` dibuat server saat `ajukan` (dalam lock di GAS).
- Approver tahap: 1 = `nik atasan` pengaju; 2 = peran `head` di dept pengaju; 3 = peran `hr`; 4 = peran `gm`. Pengaju sendiri tidak pernah jadi approver. Tahap yang approvernya kosong, atau satu-satunya approvernya sama dengan yang menyetujui tahap sebelumnya, dilewati otomatis dan dicatat `LEWATI`.
- `putuskan` cek ulang status + tahap sebelum menulis (`SUDAH_DIPROSES`).
- Setuju di tahap terakhir -> `DISETUJUI` + mutasi `PAKAI` (negatif). HR batal yang disetujui -> mutasi `BATAL` (positif).
- Notifikasi: pengajuan masuk tahap baru -> email ke approver tahap itu; `DISETUJUI`/`DITOLAK` -> email ke pengaju. (Produksi: mode ringkasan harian untuk approver kalau kuota Gmail, lihat PRD 5.4.)

## Khusus mock (tidak ada di GAS)

| Aksi | Isi |
|---|---|
| `demoAkun` | daftar akun demo per peran untuk panel demo |
| `demoEmail` | `{ items: [{ waktu, ke, nama, subjek, isi }] }` email yang disimulasikan |
| `demoReset` | kembalikan data awal |

## Peta layar -> aksi (PRD bagian 8)

L1 login · L2 gantiPin · L3 beranda · L4 hitung, ajukan · L5 riwayat · L6 detail, batal · L7 antrian · L8 detail, putuskan · L9 logout · L10 mutasi · L11 saldoKaryawan · L12 saldoKaryawan, mutasi · L13 penyesuaian · L14 saldoKaryawan, resetPin · L15 rekap · L16 (fase 6) · D1 demoAkun, demoEmail, demoReset
