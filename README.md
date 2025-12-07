# Amane WhatsApp Bot (Mane Store V4)

Petunjuk singkat menjalankan bot WhatsApp berbasis Baileys.

**Lokasi proyek:** `c:\laragon\www\Script\Mane Store V4`

## Prasyarat
- Node.js (LTS direkomendasikan: v16 / v18 / v20)
- npm (disertakan bersama Node.js)
- Koneksi internet aktif (untuk menghubungkan ke WhatsApp)

Jika ingin menjalankan di background/distribusi: `pm2` atau service manager lain direkomendasikan.

## Instalasi
1. Buka PowerShell lalu masuk ke folder proyek:

```powershell
cd 'c:\laragon\www\Script\Mane Store V4'
```

2. Install dependency:

```powershell
npm install
```

## Menjalankan bot
- Jalankan menggunakan script `start` di `package.json`:

```powershell
npm start
```

atau langsung dengan Node:

```powershell
node index.js
```

Saat pertama kali dijalankan bot dapat meminta pairing/QR atau meminta nomor telepon tergantung konfigurasi di `index.js`.

### Alur otentikasi
- File sesi disimpan di folder `Session` (dibuat otomatis oleh Baileys).
- Jika `pairingCode` diset `true` (seperti pada `index.js`), bot akan menanyakan nomor (format: `628xxxx` tanpa `+`) dan menampilkan pairing code.
- Jika `pairingCode` diset `false`, biasanya akan menampilkan QR di terminal untuk discanning oleh WhatsApp.

Jika terjadi error terkait session (mis. `Bad Session`), hapus folder `Session` lalu jalankan ulang untuk melakukan pairing/scan QR dari awal.

## Konfigurasi penting
- `setting.js`
  - `global.owner` — ganti nomor owner jika perlu.
  - `global.mode_public` — atur mode public/private.
  - `global.domain`, `global.apikey`, dan pengaturan lain yang mungkin diperlukan oleh fitur-fitur bot.
- `storage/Database.js`
  - Secara default proyek menggunakan file JSON `storage/database.json` (tidak perlu MongoDB).
  - Jika Anda mengubah `global.tempatDB` ke nama yang mengandung `mongo`, maka bot akan mencoba menggunakan MongoDB.

## Folder penting
- `Session/` — kredensial otentikasi Baileys.
- `storage/` — konfigurasi, database (JSON), helper, dan modul WebP.
- `Tmp/` — file sementara (media hasil download/konversi).

## Troubleshooting umum
- Module not found: jalankan `npm install` dan periksa error selama instalasi.
- Versi Node incompatible: gunakan Node LTS (disarankan v18 atau v20). Gunakan `nvm-windows` jika perlu mengganti versi Node.
- Bad Session / logged out: hapus folder `Session` lalu jalankan ulang untuk scan QR atau pairing ulang.
- Error terkait Baileys / WhatsApp API: perhatikan pesan di konsol; beberapa error mengharuskan menunggu (rate-limit) atau update dependensi.

## Menjalankan di background (opsional)
Install `pm2` lalu jalankan:

```powershell
npm install -g pm2
pm2 start index.js --name AmaneBot
pm2 logs AmaneBot
```

## Catatan keamanan & privasi
- Simpan folder `Session` aman — berisi kredensial yang memungkinkan akses akun WhatsApp.
- Jangan membagikan `Session` atau file konfigurasi yang berisi kunci API publik/privat.

## Credits
- Script asli dibuat oleh `AmaneOfc`. Jangan menghapus credit dari skrip sesuai instruksi di file sumber.

---

Jika Anda mau, saya bisa:
- bantu jalankan `npm install` di workspace sekarang dan melaporkan error, atau
- jalankan `npm start` dan bantu baca output/QR/pairing.

Beritahu saya langkah mana yang mau Anda lanjutkan.
