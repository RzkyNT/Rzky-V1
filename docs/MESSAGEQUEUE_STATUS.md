# Message Queue Implementation Status

## ✅ Sudah Diimplementasikan

### 1. **Manual Reminder dari Customer** (`case "remindkurir"`)
```javascript
// Kirim ke kurir menggunakan sock.relayMessage dengan delay
await sock.relayMessage(courierJid, msg.message, { messageId: msg.key.id });
await new Promise(resolve => setTimeout(resolve, 1000));

// Notifikasi ke owner menggunakan messageQueue
messageQueue.add(
    sock,
    ownerJid,
    { text: `ℹ️ Customer ${order.customerName} mengirim reminder manual...` },
    {},
    'owner_notification',
    order.id
);
```

### 2. **Auto-Checkout Natural Language** (AI Gemini)
```javascript
// Notifikasi owner menggunakan messageQueue
messageQueue.add(
    sock,
    ownerJid,
    { text: `🔔 *PESANAN BARU (AUTO)*...` },
    {},
    'auto_order_notification',
    orderId
);

// Notifikasi kurir dengan error handling + delay
for (const courierNum of crm.couriers) {
    try {
        await sock.relayMessage(courierJid, btnMsg.message, { messageId: btnMsg.key.id });
        await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
        console.error(`[AutoOrder] Failed:`, error.message);
    }
}
```

## ⚠️ Belum Diimplementasikan (Perlu Ditambahkan)

### Bagian Kritis yang Harus Menggunakan messageQueue:

1. **Notifikasi Order Baru ke Owner** (Normal Checkout)
   - Lokasi: `case "orderconfirm"`
   - Priority: HIGH
   - Alasan: Owner harus tahu ada order baru

2. **Notifikasi Order Baru ke Kurir** (Normal Checkout)
   - Lokasi: `case "orderconfirm"`
   - Priority: CRITICAL
   - Alasan: Kurir harus segera tahu ada order

3. **Notifikasi Status Update ke Customer**
   - Lokasi: Saat kurir ambil antrian, selesai delivery
   - Priority: HIGH
   - Alasan: Customer harus tahu progress pesanan

4. **Notifikasi Pembatalan ke Owner**
   - Lokasi: Saat customer batalkan order
   - Priority: MEDIUM
   - Alasan: Owner perlu tracking

5. **Notifikasi Rating ke Owner**
   - Lokasi: Saat customer beri rating
   - Priority: LOW
   - Alasan: Feedback untuk improvement

6. **Guest Order Completion**
   - Lokasi: Setelah guest input lokasi
   - Priority: CRITICAL
   - Alasan: Order dari guest harus ternotifikasi

## 📝 Rekomendasi Implementasi

### Template Standar:
```javascript
// Untuk pesan kritis (order notifications)
messageQueue.add(
    sock,
    recipientJid,
    messageContent,
    options,
    'order_notification',  // type
    orderId                // untuk tracking
);

// Untuk pesan biasa (info/update)
messageQueue.add(
    sock,
    recipientJid,
    messageContent,
    {},
    'general'
);
```

### Kapan TIDAK Perlu messageQueue:
- Reply langsung ke user (m.reply) ✅
- Pesan error/validasi ✅
- Menu/help commands ✅
- Pesan yang tidak kritis ✅

### Kapan WAJIB Pakai messageQueue:
- Notifikasi order baru ❗
- Update status pesanan ❗
- Reminder ke kurir ❗
- Eskalasi ke owner ❗
- Konfirmasi pembayaran ❗

## 🎯 Action Items

1. [x] Implementasi di manual reminder
2. [x] Implementasi di auto-checkout (natural language)
3. [ ] Implementasi di order creation (normal checkout)
4. [ ] Implementasi di guest order completion
5. [ ] Implementasi di status updates
6. [ ] Implementasi di rating notifications

## 📊 Current Status

- **Implemented**: 2 locations (manual reminder + auto-checkout)
- **Pending**: ~4-5 critical locations
- **Coverage**: ~30%

**Target**: 100% coverage untuk semua pesan kritis.

