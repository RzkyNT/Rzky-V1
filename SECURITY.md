# 🔐 Security Guidelines

## API Key Management

### ✅ YANG BENAR (AMAN)
```javascript
// Gunakan environment variables
const API_KEY = process.env.SANKA_API_KEY;
```

### ❌ YANG SALAH (BERBAHAYA)
```javascript
// JANGAN hardcode API key di file!
const API_KEY = "planaai"; // ❌ BAHAYA!
```

## Setup Environment Variables

### 1. Copy template
```bash
cp .env.example .env
```

### 2. Edit .env file
```bash
# Isi dengan API key yang valid
SANKA_API_KEY=your_actual_api_key
FERDEV_API_KEY=your_actual_api_key
# dst...
```

### 3. Pastikan .env di .gitignore
```gitignore
# Environment variables - JANGAN COMMIT!
.env
.env.local
.env.production
```

## Validasi API Keys

Bot akan otomatis memvalidasi API keys saat startup:

```
🔐 Validating API Keys...
✅ All API keys validated successfully
```

Jika ada yang missing:
```
⚠️ API Key Issues:
  - SANKA_API_KEY is missing
  - FERDEV_API_KEY is missing
```

## Best Practices

1. **JANGAN** commit file .env ke Git
2. **SELALU** gunakan .env.example sebagai template
3. **ROTASI** API keys secara berkala
4. **MONITOR** penggunaan API keys
5. **BACKUP** .env file di tempat aman

## File Structure

```
├── .env                 # ❌ JANGAN COMMIT
├── .env.example         # ✅ Template untuk developer
├── config/
│   └── env.js          # ✅ Environment loader
├── storage/
│   ├── openai.js       # ✅ Menggunakan ENV variables
│   └── gemini.js       # ✅ Menggunakan ENV variables
└── setting.js          # ✅ Menggunakan ENV variables
```

## Emergency Response

Jika API key bocor:
1. **SEGERA** ganti API key di provider
2. **UPDATE** .env file dengan key baru
3. **RESTART** bot
4. **REVOKE** key lama jika memungkinkan

## Contact

Jika ada pertanyaan keamanan, hubungi developer.