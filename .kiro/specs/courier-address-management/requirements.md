# Requirements Document

## Introduction

Fitur manajemen alamat kurir memungkinkan kurir untuk mengelola alamat pelanggan secara efektif. Fitur ini mencakup kemampuan untuk mengoreksi alamat yang tidak akurat, menyimpan alamat baru untuk pesanan langsung, dan mengelola database alamat pelanggan untuk meningkatkan efisiensi pengiriman.

## Requirements

### Requirement 1

**User Story:** Sebagai kurir, saya ingin dapat mengoreksi alamat pelanggan yang tidak akurat, sehingga saya dapat melakukan pengiriman dengan tepat dan menghindari kesalahan alamat di masa depan.

#### Acceptance Criteria

1. WHEN kurir melihat alamat pesanan THEN sistem SHALL menampilkan opsi untuk mengedit alamat
2. WHEN kurir mengklik opsi edit alamat THEN sistem SHALL membuka form edit alamat dengan data alamat saat ini
3. WHEN kurir menyimpan perubahan alamat THEN sistem SHALL memperbarui alamat di database dan menandai alamat sebagai "diverifikasi kurir"
4. WHEN alamat berhasil diperbarui THEN sistem SHALL menampilkan konfirmasi perubahan kepada kurir

### Requirement 2

**User Story:** Sebagai kurir, saya ingin dapat menyimpan alamat baru untuk pelanggan yang memesan secara langsung, sehingga alamat tersebut tersedia untuk pesanan selanjutnya.

#### Acceptance Criteria

1. WHEN kurir menerima pesanan langsung THEN sistem SHALL menyediakan opsi untuk menambah alamat baru
2. WHEN kurir mengisi form alamat baru THEN sistem SHALL memvalidasi kelengkapan data alamat (nama, nomor telepon, alamat lengkap)
3. WHEN data alamat valid THEN sistem SHALL menyimpan alamat ke database dengan status "alamat kurir"
4. WHEN alamat berhasil disimpan THEN sistem SHALL memberikan konfirmasi dan ID alamat kepada kurir

### Requirement 3

**User Story:** Sebagai kurir, saya ingin dapat mencari dan memilih alamat yang sudah tersimpan, sehingga saya tidak perlu mengetik ulang alamat untuk pelanggan yang sudah pernah diantar.

#### Acceptance Criteria

1. WHEN kurir membuat pesanan baru THEN sistem SHALL menyediakan fitur pencarian alamat
2. WHEN kurir mengetik nama atau nomor telepon THEN sistem SHALL menampilkan daftar alamat yang cocok
3. WHEN kurir memilih alamat dari daftar THEN sistem SHALL mengisi otomatis data alamat pada pesanan
4. IF alamat tidak ditemukan THEN sistem SHALL memberikan opsi untuk menambah alamat baru

### Requirement 4

**User Story:** Sebagai kurir, saya ingin dapat melihat riwayat alamat pelanggan, sehingga saya dapat memilih alamat yang paling akurat atau terbaru.

#### Acceptance Criteria

1. WHEN kurir mencari alamat pelanggan THEN sistem SHALL menampilkan semua alamat yang terkait dengan pelanggan tersebut
2. WHEN sistem menampilkan daftar alamat THEN sistem SHALL menunjukkan tanggal terakhir digunakan dan status verifikasi
3. WHEN kurir memilih alamat THEN sistem SHALL menandai alamat sebagai "terakhir digunakan"
4. WHEN ada multiple alamat untuk satu pelanggan THEN sistem SHALL mengurutkan berdasarkan tanggal penggunaan terakhir

### Requirement 5

**User Story:** Sebagai kurir, saya ingin dapat menandai alamat sebagai tidak valid atau bermasalah, sehingga kurir lain dapat mengetahui status alamat tersebut.

#### Acceptance Criteria

1. WHEN kurir mengalami masalah dengan alamat THEN sistem SHALL menyediakan opsi untuk menandai alamat bermasalah
2. WHEN kurir menandai alamat bermasalah THEN sistem SHALL meminta keterangan masalah dari kurir
3. WHEN alamat ditandai bermasalah THEN sistem SHALL menampilkan peringatan saat alamat tersebut akan digunakan
4. WHEN alamat bermasalah diperbaiki THEN sistem SHALL memungkinkan kurir untuk menghapus tanda bermasalah

### Requirement 6

**User Story:** Sebagai kurir, saya ingin sistem dapat menyimpan catatan tambahan untuk setiap alamat, sehingga saya dapat memberikan informasi berguna untuk pengiriman selanjutnya.

#### Acceptance Criteria

1. WHEN kurir menyimpan atau mengedit alamat THEN sistem SHALL menyediakan field untuk catatan tambahan
2. WHEN kurir mengisi catatan THEN sistem SHALL menyimpan catatan bersama dengan data alamat
3. WHEN alamat ditampilkan THEN sistem SHALL menunjukkan catatan jika tersedia
4. WHEN kurir menggunakan alamat dengan catatan THEN sistem SHALL menampilkan catatan secara prominent