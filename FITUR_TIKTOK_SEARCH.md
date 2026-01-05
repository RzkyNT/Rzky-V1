# 📱 Fitur TikTok Video Search & Download

## Deskripsi
Fitur baru untuk mencari dan mendownload video TikTok menggunakan API Gimita dengan pola yang sama seperti YouTube, Spotify, dan XNXX.

## Command yang Ditambahkan

### 1. TikTok Video Search
- **Command:** `.tiktokvideosearch`, `.ttvideosearch`, `.ttsearch`
- **Contoh:** `.ttsearch hijab`
- **Fungsi:** Mencari video TikTok berdasarkan query dan menampilkan hasil dalam bentuk interactive list

### 2. TikTok Video Download
- **Command:** `.tiktokvideodownload`
- **Fungsi:** Mendownload video TikTok yang dipilih dari hasil pencarian
- **Otomatis:** Command ini dipanggil otomatis ketika user memilih video dari hasil search

## API yang Digunakan
- **Search API:** `https://api.gimita.id/api/search/tiktokvideo?count=30&query={query}`
- **Proxy API:** `https://api.gimita.id/api/tools/proxy?url={video_url}` (sebagai fallback)

## Fitur Utama

### 1. Interactive Search Results
- Menampilkan hingga 10 video hasil pencarian
- Informasi yang ditampilkan:
  - Judul video
  - Nama author
  - Jumlah views (play_count)
  - Durasi video
  - Jumlah likes (digg_count)

### 2. Download dengan Fallback
- **Primary:** Download langsung dari URL video
- **Fallback:** Menggunakan proxy API jika download langsung gagal
- **Error Handling:** Pesan error yang informatif jika kedua metode gagal

### 3. User Experience
- Loading indicator dengan emoji reaction
- Success indicator setelah download selesai
- Caption yang informatif pada video yang dikirim

## Integrasi dengan Sistem yang Ada

### 1. Pola yang Konsisten
Mengikuti pola yang sama dengan fitur YouTube, Spotify, dan XNXX:
- Search command → Interactive list → Download command
- Menggunakan `generateWAMessageFromContent` untuk interactive buttons
- Error handling dan logging yang konsisten

### 2. Help Command
Fitur telah ditambahkan ke dalam daftar help command:
- `tiktokvideosearch` - Mencari dan download video TikTok
- `tiktokvideodownload` - Download otomatis video TikTok

## Cara Penggunaan

1. **Mencari Video:**
   ```
   .ttsearch hijab
   ```

2. **Memilih Video:**
   - Bot akan menampilkan interactive list
   - User memilih video yang diinginkan
   - Bot otomatis mendownload video tersebut

3. **Hasil:**
   - Video TikTok dikirim ke chat
   - Caption berisi informasi download

## Error Handling
- Validasi input query
- Penanganan API response yang kosong
- Fallback download method
- Pesan error yang user-friendly

## Keamanan
- URL encoding/decoding yang proper
- Validasi response dari API
- Error logging untuk debugging

## Kompatibilitas
- Menggunakan struktur data yang fleksibel
- Mendukung berbagai format response dari API TikTok
- Fallback method untuk memastikan download berhasil