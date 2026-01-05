# 🔧 Troubleshooting Stream Errors & Connection Issues

## ⚠️ **PENTING: Kapan Perlu Pairing Ulang**

### Kondisi yang MEMERLUKAN Pairing Ulang:

| Kondisi | Auto Clean? | Perlu Pairing? | Alasan |
|---------|-------------|----------------|---------|
| **Bad Session** | ✅ Ya* | ✅ Ya | Session rusak total |
| **Corrupted creds.json** | ✅ Ya* | ✅ Ya | File credentials rusak |
| **Connection Lost** | ❌ Tidak | ❌ Tidak | Hanya reconnect |
| **Connection Closed** | ❌ Tidak | ❌ Tidak | Hanya reconnect |
| **Timeout** | ❌ Tidak | ❌ Tidak | Hanya reconnect |

*Auto clean bisa di-disable dengan setting `AUTO_CLEANUP_SESSION=false`

### Cara Menghindari Pairing Ulang:
1. **Backup Session Berkala**: `cp -r Session/ Session_backup/`
2. **Disable Auto Cleanup**: Set `AUTO_CLEANUP_SESSION=false` di file `.env`
3. **Monitor Log**: Perhatikan warning sebelum cleanup

## 🚨 Common Error: "Stream Errored (ack)"

### Penyebab Utama:
1. **Session File Corrupted** - File session rusak atau tidak valid
2. **WebSocket Connection Issues** - Koneksi internet tidak stabil
3. **WhatsApp Server Issues** - Server WhatsApp memutus koneksi
4. **Rate Limiting** - Terlalu banyak request dalam waktu singkat
5. **Baileys Version Compatibility** - Versi Baileys tidak kompatibel

## 🛠️ Solusi yang Telah Diterapkan:

### 1. **Auto Session Cleanup**
```javascript
// Otomatis membersihkan session yang rusak
case DisconnectReason.badSession:
    console.log("Bad Session File, Please Delete Session and Scan Again");
    // Auto cleanup session files
    try {
        const sessionPath = path.join(__dirname, 'Session');
        if (fs.existsSync(sessionPath)) {
            console.log("🔄 Auto-cleaning corrupted session files...");
            fs.rmSync(sessionPath, { recursive: true, force: true });
            console.log("✅ Session files cleaned. Restarting...");
        }
    } catch (err) {
        console.error("❌ Failed to clean session:", err.message);
    }
    setTimeout(() => startBot(), 3000);
    break;
```

### 2. **Enhanced Error Handling**
```javascript
// Handle WebSocket errors
process.on('uncaughtException', (error) => {
    if (error.message && (
        error.message.includes('Stream Errored') ||
        error.message.includes('WebSocket') ||
        error.message.includes('Bad Session')
    )) {
        console.error('🔴 Uncaught Exception (WebSocket/Stream):', error.message);
        console.log('🔄 Attempting to restart bot...');
        setTimeout(() => startBot(), 3000);
    }
});
```

### 3. **Connection Health Monitoring**
```javascript
// Connection health monitoring
let connectionHealthCheck = setInterval(() => {
    if (sock.ws && sock.ws.readyState !== 1) {
        console.log('⚠️ WebSocket connection unhealthy, attempting reconnection...');
        clearInterval(connectionHealthCheck);
        setTimeout(() => startBot(), 2000);
    }
}, 30000); // Check every 30 seconds
```

### 4. **Session Validation**
```javascript
// Session health check
const sessionPath = path.join(__dirname, 'Session');
if (fs.existsSync(sessionPath)) {
    try {
        const credsPath = path.join(sessionPath, 'creds.json');
        if (fs.existsSync(credsPath)) {
            const credsData = fs.readFileSync(credsPath, 'utf8');
            JSON.parse(credsData); // Test if valid JSON
            console.log('✅ Session credentials valid');
        }
    } catch (error) {
        console.log('⚠️ Session credentials corrupted, cleaning...');
        fs.rmSync(sessionPath, { recursive: true, force: true });
    }
}
```

## 🔧 Manual Solutions:

### 1. **Disable Auto Cleanup (Opsional)**
```bash
# Buat file .env
cp .env.example .env

# Edit .env dan set:
AUTO_CLEANUP_SESSION=false
```

Dengan setting ini, bot akan **TIDAK** otomatis menghapus session. Anda harus manual delete folder `Session/` jika terjadi bad session.

### 2. **Clean Session Manually**
```bash
# Jalankan script pembersih session
node clean-session.js
```

### 2. **Restart Bot dengan Delay**
```bash
# Tunggu beberapa detik sebelum restart
# Biarkan koneksi sepenuhnya tertutup
```

### 3. **Check Internet Connection**
```bash
# Pastikan koneksi internet stabil
ping google.com
```

### 4. **Update Baileys (jika perlu)**
```bash
npm update baileys
```

## 📊 Error Codes & Solutions:

| Error Code | Penyebab | Solusi Otomatis |
|------------|----------|-----------------|
| `badSession` | Session rusak | Auto cleanup + restart |
| `connectionClosed` | Koneksi tertutup | Reconnect dengan delay 2s |
| `connectionLost` | Koneksi hilang | Reconnect dengan delay 3s |
| `timedOut` | Timeout | Reconnect dengan delay 5s |
| `restartRequired` | Perlu restart | Auto restart dengan delay 2s |

## 🚀 Best Practices:

### 1. **Monitoring**
- ✅ Auto health check setiap 30 detik
- ✅ Error logging yang detail
- ✅ Auto cleanup session rusak

### 2. **Reconnection Strategy**
- ✅ Graduated delays (2s, 3s, 5s)
- ✅ Cleanup resources sebelum reconnect
- ✅ Validation session sebelum connect

### 3. **Error Prevention**
- ✅ Session validation saat startup
- ✅ WebSocket health monitoring
- ✅ Graceful error handling

## 🔍 Debug Commands:

```bash
# Check session files
ls -la Session/

# Check if session is valid JSON
node -e "console.log(JSON.parse(require('fs').readFileSync('Session/creds.json', 'utf8')))"

# Clean session manually
rm -rf Session/

# Check network connectivity
curl -I https://web.whatsapp.com
```

## 📝 Log Analysis:

### Normal Connection:
```
📁 Session files found: 15
✅ Session credentials valid
Bot Berhasil Tersambung ✓
```

### Stream Error:
```
🔴 Connection Error: Stream Errored (ack)
🔄 Stream error detected, attempting reconnection...
```

### Bad Session:
```
Bad Session File, Please Delete Session and Scan Again
🔄 Auto-cleaning corrupted session files...
✅ Session files cleaned. Restarting...
```

## 🎯 Expected Results:

Dengan implementasi ini, bot akan:
1. **Auto-recover** dari stream errors
2. **Auto-cleanup** session yang rusak
3. **Monitor** kesehatan koneksi
4. **Reconnect** dengan strategi yang smart
5. **Log** semua error untuk debugging

Bot seharusnya jauh lebih stabil dan jarang mengalami crash karena stream errors.