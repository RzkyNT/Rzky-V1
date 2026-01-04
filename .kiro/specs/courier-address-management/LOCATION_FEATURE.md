# Fitur Share Location - Manajemen Alamat

## Overview
Sistem manajemen alamat sekarang mendukung share location untuk akurasi koordinat GPS yang lebih baik.

## Fitur Location yang Ditambahkan

### 1. Tambah Alamat dengan Location
Flow tambah alamat sekarang mencakup:
1. Nama pelanggan
2. Nomor telepon
3. **📍 Share Location** (baru!)
4. Alamat lengkap (text)
5. Kota/kabupaten
6. Catatan tambahan

### 2. Edit Alamat dengan Location
Saat mengedit alamat, user dapat:
- Update lokasi GPS dengan share location baru
- Update alamat text
- Skip location update jika hanya ingin mengubah text

### 3. Display Koordinat
Detail alamat sekarang menampilkan:
- Koordinat GPS (latitude, longitude)
- Link Google Maps untuk navigasi langsung

## Implementasi Teknis

### Location Message Handling
```javascript
// Deteksi location message
if (m.type === 'locationMessage' || (m.msg && m.msg.degreesLatitude)) {
    const latitude = m.msg.degreesLatitude;
    const longitude = m.msg.degreesLongitude;
    // Process location...
}
```

### Data Structure
```javascript
{
    coordinates: {
        latitude: -6.1990759,
        longitude: 107.0098526
    }
}
```

### CRM Integration
- Location data disimpan di `data/crm_data.json`
- Sinkronisasi otomatis antara address database dan CRM
- Update location di address management akan update CRM data

## User Flow

### Tambah Alamat Baru
1. User: `/tambah`
2. Bot: "Masukkan nama pelanggan"
3. User: "John Doe"
4. Bot: "Masukkan nomor telepon"
5. User: "081234567890"
6. Bot: "📍 Share lokasi pelanggan" 
7. User: **[Share Location]** atau ketik "skip"
8. Bot: "✅ Lokasi diterima! Masukkan alamat lengkap"
9. User: "Jl. Merdeka No. 123"
10. Bot: "Masukkan kota"
11. User: "Jakarta"
12. Bot: "Catatan tambahan?"
13. User: "Rumah cat hijau" atau "skip"
14. Bot: "✅ Alamat berhasil disimpan!"

### Edit Alamat & Lokasi
1. User: Pilih alamat → Klik "📝 Edit Alamat"
2. Bot: Tampilkan pilihan field
3. User: Klik "📍 Edit Alamat & Lokasi"
4. Bot: "📍 Share lokasi baru"
5. User: **[Share Location]** atau ketik "skip"
6. Bot: "Masukkan alamat lengkap baru"
7. User: "Jl. Sudirman No. 456"
8. Bot: "✅ Alamat berhasil diupdate!"

## Keuntungan

### Untuk Kurir
- ✅ Navigasi GPS yang akurat
- ✅ Tidak perlu mencari alamat manual
- ✅ Hemat waktu pengiriman
- ✅ Mengurangi kesalahan lokasi

### Untuk Sistem
- ✅ Data koordinat tersimpan permanen
- ✅ Integrasi dengan Google Maps
- ✅ Sinkronisasi dengan CRM data
- ✅ History tracking lokasi

### Untuk Customer
- ✅ Pengiriman lebih cepat
- ✅ Kurir tidak tersesat
- ✅ Akurasi lokasi terjamin

## Optional Location
Location bersifat **optional** - user dapat:
- Skip location saat tambah alamat
- Skip location saat edit alamat
- Tetap menggunakan alamat text saja

Sistem tetap berfungsi normal tanpa koordinat GPS, namun dengan koordinat akan lebih akurat.

## Google Maps Integration
Setiap alamat dengan koordinat akan menampilkan:
```
🗺️ Maps: https://www.google.com/maps/search/?api=1&query=-6.1990759,107.0098526
```

Link ini dapat diklik langsung untuk membuka Google Maps dengan lokasi yang tepat.

## Testing
Fitur location telah ditest dengan:
- ✅ Add address dengan location
- ✅ Add address tanpa location (skip)
- ✅ Edit address dengan location baru
- ✅ Edit address tanpa update location
- ✅ Display koordinat di detail alamat
- ✅ CRM data synchronization
- ✅ Google Maps link generation
