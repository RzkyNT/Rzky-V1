const util = require("util");
const chalk = require("chalk");
const fs = require("fs");
const axios = require("axios");
const fetch = require("node-fetch");
const ssh2 = require("ssh2");
const path = require("path");
const Yts = require("yt-search");
const tiktok = require("./storage/tiktok.js");
const remini = require("./storage/remini.js");
const youtube = require("./storage/youtube.js");
const aiChat = require("./storage/openai.js");
const geminiChat = require("./storage/gemini.js");
const messageQueue = require("./lib/messageQueue.js");
const orderReminder = require("./lib/orderReminder.js");

const { exec, spawn, execSync } = require('child_process');
const { prepareWAMessageMedia, generateWAMessageFromContent } = require("@whiskeysockets/baileys");
const LoadDataBase = require("./storage/LoadDatabase.js");

module.exports = async (m, sock) => {
try {
await LoadDataBase(sock, m)
const isCmd = m?.body?.startsWith(m.prefix)
const quoted = m.quoted ? m.quoted : m
const mime = quoted?.msg?.mimetype || quoted?.mimetype || null
const args = m.body.trim().split(/ +/).slice(1)
const qmsg = (m.quoted || m)
const text = q = args.join(" ")
const command = m.body ? (m.body.startsWith(m.prefix) ? m.body.slice(m.prefix.length).trim().split(' ').shift().toLowerCase() : m.body.trim().split(' ').shift().toLowerCase()) : ''
const cmd = isCmd ? m.prefix + command : command
const botNumber = await sock.user.id.split(":")[0]+"@s.whatsapp.net"
const isOwner = global.owner+"@s.whatsapp.net" == m.sender || m.sender == botNumber || db.settings.developer.includes(m.sender)
const isReseller = db.settings.reseller.includes(m.sender)
  m.isGroup = m.chat.endsWith('g.us');
  m.metadata = {};
  m.isAdmin = false;
  m.isBotAdmin = false;
  if (m.isGroup) {
    let meta = await global.groupMetadataCache.get(m.chat)
    if (!meta) meta = await sock.groupMetadata(m.chat).catch(_ => {})
    m.metadata = meta;
    const p = meta?.participants || [];
    m.isAdmin = p?.some(i => (i.id === m.sender || i.jid === m.sender) && i.admin !== null);
    m.isBotAdmin = p?.some(i => (i.id === botNumber || i.jid == botNumber) && i.admin !== null);
  } 

if (isCmd) {
console.log(chalk.red("☎ Pengirim ⪼"), chalk.green(m.chat) + "\n" + chalk.red("💌 Pesan ⪼"), chalk.green(cmd) + "\n")
}

// Initialize Order Reminder System (only once)
if (!global.reminderSystemStarted) {
    orderReminder.start(sock, loadCrmData, generateWAMessageFromContent);
    global.reminderSystemStarted = true;
    console.log(chalk.green("✅ Order Reminder System initialized"));
}


//=============================================//

const FakeChannel = {
  key: {
    remoteJid: 'status@broadcast',
    fromMe: false,
    participant: '0@s.whatsapp.net'
  },
  message: {
    newsletterAdminInviteMessage: {
      newsletterJid: '120363400297473298@newsletter',
      caption: `Powered By ${global.namaOwner}.`,
      inviteExpiration: 0
    }
  }
}

async function updateApiKeys(updates) {
  const settingsPath = './setting.js';
  try {
    let fileContent = fs.readFileSync(settingsPath, 'utf8');
    updates.forEach(update => {
      const regex = new RegExp(`(global\\.${update.key}\\s*=\\s*)['"].*?['"]`);
      if (regex.test(fileContent)) {
        fileContent = fileContent.replace(regex, `$1'${update.value}'`);
      }
    });
    fs.writeFileSync(settingsPath, fileContent, 'utf8');
    return true;
  } catch (error) {
    console.error(chalk.red('❌ Gagal menyimpan API Key ke settings.js:', error));
    return false;
  }
}
    
const FakeLocation = {
  key: {
    participant: '0@s.whatsapp.net',
    ...(m.chat ? { remoteJid: 'status@broadcast' } : {})
  },
  message: {
    locationMessage: {
      name: `Powered By ${global.namaOwner}.`,
      jpegThumbnail: ''
    }
  }
}

const FakeSticker = {
        key: {
            fromMe: false,
            participant: "0@s.whatsapp.net",
            remoteJid: "status@broadcast"
        },
        message: {
            stickerPackMessage: {
                stickerPackId: "\x00",
                name: `Powered By ${global.namaOwner}.`,
                publisher: "kkkk"
            }
        }
    }


//=============================================//
const autojpmFile = "./data/autojpm.json";
global.sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
function saveAutoJpm(data) {
    try {
        fs.writeFileSync(autojpmFile, JSON.stringify(data, null, 2), "utf-8");
    } catch (err) {
        console.error("[AUTOJPM] Gagal menyimpan data:", err);
    }
}

function loadAutoJpm() {
    try {
        if (fs.existsSync(autojpmFile)) {
            const rawData = fs.readFileSync(autojpmFile, "utf-8");
            return JSON.parse(rawData);
        }
        return null;
    } catch (err) {
        console.error("[AUTOJPM] Gagal membaca data:", err);
        return null;
    }
}
//=== AUTO JPM CHANNEL ===//
const autojpmChFile = "./data/autojpmch.json";

function saveAutoJpmCh(data) {
    try {
        fs.writeFileSync(autojpmChFile, JSON.stringify(data, null, 2), "utf-8");
    } catch (err) {
        console.error("[AUTOJPM-CH] Gagal menyimpan data:", err);
    }
}

function loadAutoJpmCh() {
    try {
        if (fs.existsSync(autojpmChFile)) {
            const rawData = fs.readFileSync(autojpmChFile, "utf-8");
            return JSON.parse(rawData);
        }
        return null;
    } catch (err) {
        console.error("[AUTOJPM-CH] Gagal membaca data:", err);
        return null;
    }
}


function parseInterval(str) {
    const match = str.match(/(\d+)([a-zA-Z]+)/);
    if (!match) return -1;
    const val = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    const map = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    const full = { detik: 's', second: 's', menit: 'm', minute: 'm', jam: 'h', hour: 'h', hari: 'd', day: 'd' };
    return val * (map[full[unit] || unit] || 0);
}
//=============================================//
// CRM AIR ISI ULANG HELPERS
const crmFile = "./data/crm_data.json";

function loadCrmData() {
    try {
        if (!fs.existsSync(crmFile)) {
             const initData = { customers: {}, orders: [], products: [{ name: "Galon Isi Ulang", price: 5000 }, { name: "Galon Baru + Isi", price: 35000 }], couriers: [] };
             fs.writeFileSync(crmFile, JSON.stringify(initData, null, 2));
             return initData;
        }
        return JSON.parse(fs.readFileSync(crmFile));
    } catch (err) {
        return { customers: {}, orders: [], products: [], couriers: [] };
    }
}

function saveCrmData(data) {
    fs.writeFileSync(crmFile, JSON.stringify(data, null, 2));
}

function generateOrderId() {
    return 'ORD-' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 100);
}
//=============================================//
if (global.db.groups[m.chat]?.antilink === true) {
    const textMessage = m.text || ""
    const groupInviteLinkRegex = /(https?:\/\/)?(www\.)?chat\.whatsapp\.com\/[A-Za-z0-9]+(\?[^\s]*)?/gi
    const links = textMessage.match(groupInviteLinkRegex)
    if (links && !isOwner && !m.isAdmin && m.isBotAdmin) {
        const senderJid = m.sender
        const messageId = m.key.id
        const participantToDelete = m.key.participant || m.sender
        await sock.sendMessage(m.chat, {
            delete: {
                remoteJid: m.chat,
                fromMe: false,
                id: messageId,
                participant: participantToDelete
            }
        })
        await sleep(800)
        await sock.groupParticipantsUpdate(m.chat, [senderJid], "remove")
    }
}

if (global.db.groups[m.chat]?.antilink2 === true) {
    const textMessage = m.text || ""
    const groupInviteLinkRegex = /(https?:\/\/)?(www\.)?chat\.whatsapp\.com\/[A-Za-z0-9]+(\?[^\s]*)?/gi
    const links = textMessage.match(groupInviteLinkRegex)
    if (links && !isOwner && !m.isAdmin && m.isBotAdmin) {
        const messageId = m.key.id
        const participantToDelete = m.key.participant || m.sender
        await sock.sendMessage(m.chat, {
            delete: {
                remoteJid: m.chat,
                fromMe: false,
                id: messageId,
                participant: participantToDelete
            }
        })
    }
}

try {
    const filePath = "./data/autojoingrup.json"

    // Buat file JSON otomatis jika belum ada
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify({ status: false }, null, 2))
    }

    // Baca status dari file
    const { status } = JSON.parse(fs.readFileSync(filePath, "utf8"))

    // Kalau fitur aktif, cek link grup
    if (status) {
        const textMsg = m.text || m.body || ""
        const regex = /(https?:\/\/)?(www\.)?chat\.whatsapp\.com\/[A-Za-z0-9]+/gi
        const links = textMsg.match(regex)

        if (links && links.length > 0) {
            for (const link of links) {
                const inviteCode = link.split("https://chat.whatsapp.com/")[1]
                if (!inviteCode) continue

                try {
                    const res = await sock.groupAcceptInvite(inviteCode.trim())
                    console.log(`✅ [AUTOJOIN] Berhasil join ke grup: ${res}`)
                } catch (err) {
                    console.error(`❌ [AUTOJOIN] Gagal join ke ${link} | ${err.message}`)
                }

                // Delay kecil antar join biar aman
                await new Promise(resolve => setTimeout(resolve, 5000))
            }
        }
    }
} catch (err) {
    console.error("AutoJoin Error:", err)
}
// ====== SISTEM GRUP RESELLER PANEL ======
const grupResellerFile = './grupreseller.json';
let grupReseller = [];

if (fs.existsSync(grupResellerFile)) {
    grupReseller = JSON.parse(fs.readFileSync(grupResellerFile));
} else {
    fs.writeFileSync(grupResellerFile, JSON.stringify([]));
}

// Simpan data ke file
function saveGrupReseller() {
    fs.writeFileSync(grupResellerFile, JSON.stringify(grupReseller, null, 2));
}

switch (command) {
// === CRM CUSTOMER SECTION ===
case "daftar": {
    const crm = loadCrmData();
    if (crm.customers[m.sender]) return m.reply(`Anda sudah terdaftar sebagai: ${crm.customers[m.sender].name}`);
    
    // Start Registration Session
    if (!global.registrationSession) global.registrationSession = {};
    global.registrationSession[m.sender] = { step: "WAITING_NAME" };
    
    m.reply("👤 Silakan reply pesan ini dengan *Nama Lengkap* Anda untuk mendaftar.");
}
break;

case "order":
case "pesan": {
    const crm = loadCrmData();
    // Allow unregistered execution
    // if (!crm.customers[m.sender]) return m.reply(`Anda belum terdaftar...`);

    if (!text) {
        // Interactive Product List using Native Flow
        const products = crm.products.map((p, i) => ({
             header: p.name,
             title: `Rp${p.price.toLocaleString()}`,
             description: "Klik untuk memilih produk ini",
             id: `.orderquantity ${i}` 
        }));

        let msg = generateWAMessageFromContent(m.chat, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: {
                        deviceListMetadata: {},
                        deviceListMetadataVersion: 2
                    },
                    interactiveMessage: {
                        body: { text: "Silahkan pilih produk yang ingin dipesan:" },
                        footer: { text: "Depot Minhaqua" },
                        header: { title: "🛒 LIST PRODUK", subtitle: "", hasMediaAttachment: false },
                        nativeFlowMessage: {
                            buttons: [
                                {
                                    name: "single_select",
                                    buttonParamsJson: JSON.stringify({
                                        title: "Pilih Produk Disini",
                                        sections: [{
                                            title: "Produk Air",
                                            rows: products
                                        }]
                                    })
                                }
                            ]
                        }
                    }
                }
            }
        }, { userJid: m.sender, quoted: m });
        return sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
    }
    
    // Fallback Manual Logic (if user types manually)
    let amount = parseInt(text.split(" ")[0]);
    if (isNaN(amount) || amount < 1) return m.reply("Jumlah pesanan tidak valid.");
    
    let prodName = text.substring(text.indexOf(" ") + 1).trim();
    let product = crm.products.find(p => p.name.toLowerCase().includes(prodName.toLowerCase()));
    
    // Support order by index (e.g. order 2 1)
    if (!product && !isNaN(parseInt(prodName))) {
        let idx = parseInt(prodName) - 1;
        if (crm.products[idx]) product = crm.products[idx];
    }
    
    if (!product) return m.reply("Produk tidak ditemukan. Cek daftar produk dengan kirim .order tanpa argumen.");
    
    const total = amount * product.price;
    const orderId = generateOrderId();
    
    const newOrder = {
        id: orderId,
        customerId: m.sender,
        customerName: crm.customers[m.sender].name,
        address: crm.customers[m.sender].address,
        item: product.name,
        amount: amount,
        total: total,
        status: "Menunggu",
        date: new Date().toISOString()
    };
    
    crm.orders.push(newOrder);
    crm.customers[m.sender].orders_count += 1;
    saveCrmData(crm);
    
    m.reply(`✅ Pesanan Diterima!\nID: ${orderId}\nItem: ${amount}x ${product.name}\nTotal: Rp${total.toLocaleString()}\nAlamat: ${crm.customers[m.sender].address}\n\nMohon tunggu kurir kami akan segera mengirim pesanan Anda.`);
    
    // Notify Owner
    const ownerJid = global.owner + "@s.whatsapp.net";
    sock.sendMessage(ownerJid, { text: `🔔 *PESANAN BARU*\n\nDari: ${newOrder.customerName}\nItem: ${amount}x ${product.name}\nTotal: Rp${total.toLocaleString()}\nAlamat: ${newOrder.address}\nID: ${orderId}` });
    }
    break;

case "orderquantity": {
    const crm = loadCrmData();
    const idx = parseInt(text);
    if (!crm.products[idx]) return m.reply("Produk tidak valid.");
    const product = crm.products[idx];

    let buttons = [];
    // Simplified quantity options: 1, 2, 3, 5 (most common)
    const quantities = [1, 2, 3, 5];
    for (let qty of quantities) {
         buttons.push({
             name: "quick_reply",
             buttonParamsJson: JSON.stringify({
                 display_text: `${qty} ${product.name}`,
                 id: `.addtocart ${idx} ${qty}`
             })
         });
    }
    
    // Add Cancel Button
    buttons.push({
        name: "quick_reply",
        buttonParamsJson: JSON.stringify({
            display_text: "❌ Batalkan",
            id: ".batalorder_flow" 
        })
    });

    let msg = generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
            message: {
                messageContextInfo: {
                    deviceListMetadata: {},
                    deviceListMetadataVersion: 2
                },
                interactiveMessage: {
                    body: { text: `Anda memilih: *${product.name}*\nHarga: Rp${product.price.toLocaleString()}\n\nSilakan pilih jumlah pesanan:` },
                    footer: { text: "Depot Minhaqua" },
                    nativeFlowMessage: {
                        buttons: buttons,
                         messageParamsJson: JSON.stringify({
                             from_flow: true 
                         }) 
                    }
                }
            }
        }
    }, { userJid: m.sender, quoted: m });
    
    return sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
}
break;

case "addtocart": {
    const [idxStr, qtyStr] = text.split(" ");
    const idx = parseInt(idxStr);
    const qty = parseInt(qtyStr);
    const crm = loadCrmData();
    const product = crm.products[idx];
    
    if (!product) return m.reply("Produk tidak valid.");

    // Init Global Cart
    if (!global.cart) global.cart = {};
    if (!global.cart[m.sender]) global.cart[m.sender] = [];
    
    const cart = global.cart[m.sender];
    
    // Check if product already in cart, update qty if yes
    const existingItem = cart.find(item => item.idx === idx);
    if (existingItem) {
        existingItem.qty += qty;
    } else {
        cart.push({ idx: idx, name: product.name, price: product.price, qty: qty });
    }
    
    let buttons = [
        {
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({
                display_text: "✅ Checkout Selesai",
                id: `.orderconfirm COD`
            })
        },
        {
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({
                display_text: "➕ Tambah Produk Lain",
                id: `.order`
            })
        }
    ];

    let msg = generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
            message: {
                messageContextInfo: {
                    deviceListMetadata: {},
                    deviceListMetadataVersion: 2
                },
                interactiveMessage: {
                    body: { text: `✅ Berhasil ditambahkan ke Keranjang!\n\nItem: ${product.name}\nJumlah: ${qty}\n\nApa yang ingin Anda lakukan selanjutnya?` },
                    footer: { text: "Depot Minhaqua" },
                    nativeFlowMessage: {
                        buttons: buttons,
                         messageParamsJson: JSON.stringify({
                             from_flow: true 
                         }) 
                    }
                }
            }
        }
    }, { userJid: m.sender, quoted: m });
    
    return sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
}
break;

case "cart": {
    if (!global.cart || !global.cart[m.sender] || global.cart[m.sender].length === 0) {
        return m.reply("🛒 Keranjang belanja Anda kosong. Silakan pesan dulu dengan ketik .order");
    }
    
    const cart = global.cart[m.sender];
    let cartList = "🛒 *KERANJANG BELANJA*\n\n";
    let total = 0;
    
    cart.forEach((item, i) => {
        cartList += `${i+1}. ${item.name} (${item.qty}x) - Rp${(item.price * item.qty).toLocaleString()}\n`;
        total += item.price * item.qty;
    });
    
    cartList += `\n*Total Bayar: Rp${total.toLocaleString()}*`;
    
    let buttons = [
        {
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({
                display_text: "✅ Checkout Selesai",
                id: `.orderconfirm COD`
            })
        },
        {
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({
                display_text: "❌ Kosongkan Keranjang",
                id: `.emptycart`
            })
        },
         {
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({
                display_text: "➕ Tambah Lagi",
                id: `.order`
            })
        }
    ];

    let msg = generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
            message: {
                messageContextInfo: {
                    deviceListMetadata: {},
                    deviceListMetadataVersion: 2
                },
                interactiveMessage: {
                    body: { text: cartList },
                    footer: { text: "Depot Minhaqua" },
                    nativeFlowMessage: {
                        buttons: buttons,
                         messageParamsJson: JSON.stringify({
                             from_flow: true 
                         }) 
                    }
                }
            }
        }
    }, { userJid: m.sender, quoted: m });
    
    return sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
}
break;

case "emptycart": {
    if (global.cart && global.cart[m.sender]) {
        delete global.cart[m.sender];
        m.reply("✅ Keranjang berhasil dikosongkan.");
    } else {
        m.reply("Keranjang sudah kosong.");
    }
}
break;

case "selectpayment": {
    if (!global.cart || !global.cart[m.sender] || global.cart[m.sender].length === 0) return m.reply("Keranjang kosong. Ketik .order dulu.");
    
    // Bypass selection, go straight to COD confirm
    // We manually trigger the next step logic or just ask them to click confirm if we want a 2-step verify.
    // But user wants to remove choice.
    
    // Let's just return the same as triggering orderconfirm
    // Since we can't easily jump to another case without function extraction, we'll instruct them or redirect.
    // Actually, we can just output a button to confirm just to be safe, but only ONE button.
    
    const cart = global.cart[m.sender];
    const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    
    let buttons = [
        {
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({
                display_text: "✅ Konfirmasi Pesanan (COD)",
                id: `.orderconfirm COD`
            })
        }
    ];

     let msg = generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
            message: {
                messageContextInfo: {
                    deviceListMetadata: {},
                    deviceListMetadataVersion: 2
                },
                interactiveMessage: {
                    body: { text: `Total Bayar: Rp${total.toLocaleString()}\nMetode Pembayaran: COD (Bayar di Tempat)\n\nSilakan konfirmasi pesanan Anda.` },
                    footer: { text: "Depot Minhaqua" },
                    nativeFlowMessage: {
                        buttons: buttons,
                         messageParamsJson: JSON.stringify({
                             from_flow: true 
                         }) 
                    }
                }
            }
        }
    }, { userJid: m.sender, quoted: m });
    
    return sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
}
break;

case "orderconfirm": {
    const paymentMethod = text || "COD";
    
    if (!global.cart || !global.cart[m.sender]) return m.reply("Keranjang kosong/kadaluarsa. Silakan pesan ulang.");
    const cart = global.cart[m.sender];
    const crm = loadCrmData();
    
    const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    
    // Construct Item Details String
    let itemDetails = cart.map(i => `${i.qty}x ${i.name}`).join(", ");
    let fullOrderSummary = cart.map(i => `- ${i.qty}x ${i.name} (@Rp${i.price})`).join("\n");

    const orderId = generateOrderId();
    
    // GUEST CHECK: If not registered, redirect to Guest Location Input
    if (!crm.customers[m.sender]) {
         if (!global.registrationSession) global.registrationSession = {};
         global.registrationSession[m.sender] = { 
             step: "WAITING_LOCATION_GUEST",
             pendingOrder: {
                 cart: cart,
                 total: total,
                 paymentMethod: paymentMethod
             }
         };
         
         return m.reply("📍 Karena Anda belum terdaftar, mohon kirimkan *Share Location* (Lokasi Peta) Anda untuk keperluan pengantaran.\n\nKlik tombol Attachment (Klip Kertas) -> Lokasi -> Kirim Lokasi Anda Saat Ini.");
    }

    const newOrder = {
        id: orderId,
        customerId: m.sender,
        customerName: crm.customers[m.sender].name,
        address: crm.customers[m.sender] ? crm.customers[m.sender].address : "-",
        latitude: crm.customers[m.sender] ? crm.customers[m.sender].latitude : null, 
        longitude: crm.customers[m.sender] ? crm.customers[m.sender].longitude : null,
        item: itemDetails, 
        items: cart, 
        amount: cart.reduce((acc, i) => acc + i.qty, 0), 
        total: total,
        paymentMethod: paymentMethod,
        status: "Menunggu",
        date: new Date().toISOString()
    };
    
    crm.orders.push(newOrder);
    crm.customers[m.sender].orders_count += 1;
    saveCrmData(crm);
    
    // Clear Cart
    delete global.cart[m.sender];
    
    let paymentInstructions = "";
    if (paymentMethod.includes("Transfer")) {
        paymentInstructions = `\n\n💳 *Info Transfer Bank:*\nBCA: ${global.rekBca}\nBRI: ${global.rekBri}\n\n*Mohon kirim bukti transfer ke nomor ini.*`;
    } else if (paymentMethod.includes("E-Wallet")) {
         paymentInstructions = `\n\n💸 *Info E-Wallet:*\nDANA: ${global.dana}\nOVO: ${global.ovo}\nGopay: ${global.gopay}\n\n*Mohon kirim bukti transfer ke nomor ini.*`;
    } else {
        paymentInstructions = `\n\n💵 *Info Pembayaran:*\nSilakan siapkan uang pas sebesar Rp${total.toLocaleString()} saat kurir datang.`;
    }

    m.reply(`✅ Pesanan Diterima!\nID: ${orderId}\n\n*Detail Pesanan:*\n${fullOrderSummary}\n\nTotal: Rp${total.toLocaleString()}\nPembayaran: ${paymentMethod}\nAlamat: ${crm.customers[m.sender].address}${paymentInstructions}\n\nMohon tunggu kurir kami akan segera mengirim pesanan Anda.`);
    
    // Notify Owner
    const ownerJid = global.owner + "@s.whatsapp.net";
    sock.sendMessage(ownerJid, { text: `🔔 *PESANAN BARU (MULTI-ITEM)*\n\nDari: ${newOrder.customerName}\n${fullOrderSummary}\n\nTotal: Rp${total.toLocaleString()}\nPembayaran: ${paymentMethod}\nAlamat: ${newOrder.address}\nID: ${orderId}` });
    
    // Notify Couriers
    if (crm.couriers && crm.couriers.length > 0) {
        crm.couriers.forEach(async (courierNum) => {
            const courierJid = courierNum + "@s.whatsapp.net";
            let btnMsg = generateWAMessageFromContent(courierJid, {
                viewOnceMessage: {
                    message: {
                        messageContextInfo: {
                            deviceListMetadata: {},
                            deviceListMetadataVersion: 2
                        },
                        interactiveMessage: {
                            body: { text: `🔔 *ORDER BARU MASUK*\n\nArea: ${newOrder.address}\nItem: ${itemDetails}\nTotal: Rp${newOrder.total.toLocaleString()}\nPembayaran: ${paymentMethod}\n\nSegera ambil antrian!` },
                            footer: { text: "Panel Depot Minhaqua" },
                            nativeFlowMessage: {
                                buttons: [
                                    {
                                        name: "quick_reply",
                                        buttonParamsJson: JSON.stringify({
                                            display_text: "📦 Ambil Antrian",
                                            id: `.ambilantrian ${orderId}`
                                        })
                                    }
                                ]
                            }
                        }
                    }
                }
            }, { userJid: courierJid });
            
            await sock.relayMessage(courierJid, btnMsg.message, { messageId: btnMsg.key.id });
        });
    }

}
break;

case "batalorder_flow": {
    m.reply("❌ Pesanan dibatalkan.");
}
break;

case "addproduk": {
    if (!isOwner) return m.reply(mess.owner);
    if (!text) return m.reply(`Format: ${cmd} Nama Produk | Harga\nContoh: ${cmd} Galon Cuci | 3000`);
    
    const [name, price] = text.split("|").map(x => x.trim());
    if (!name || isNaN(parseInt(price))) return m.reply("Format salah. Harga harus angka.");
    
    const crm = loadCrmData();
    crm.products.push({ name, price: parseInt(price) });
    saveCrmData(crm);
    m.reply(`✅ Produk berhasil ditambahkan: ${name} - Rp${parseInt(price).toLocaleString()}`);
    }
    break;

case "delproduk": {
    if (!isOwner) return m.reply(mess.owner);
    if (!text) return m.reply(`Masukkan nama produk yang ingin dihapus. Cek nama di .listproduk`);
    
    const crm = loadCrmData();
    const idx = crm.products.findIndex(p => p.name.toLowerCase() === text.trim().toLowerCase());
    
    if (idx === -1) return m.reply("❌ Produk tidak ditemukan.");
    
    const deleted = crm.products.splice(idx, 1);
    saveCrmData(crm);
    m.reply(`✅ Produk berhasil dihapus: ${deleted[0].name}`);
    }
    break;

// === COURIER MANAGEMENT ===
case "addkurir": {
    if (!isOwner) return m.reply(mess.owner);
    if (!text) return m.reply(`Format: ${cmd} 628xxx (Nomor WA)`);
    
    let number = text.replace(/[^0-9]/g, "");
    if (!number.startsWith("62")) number = "62" + number.replace(/^0+/, "");
    
    const crm = loadCrmData();
    if (!crm.couriers) crm.couriers = [];
    
    if (crm.couriers.includes(number)) return m.reply("Nomor sudah menjadi kurir.");
    
    crm.couriers.push(number);
    saveCrmData(crm);
    m.reply(`✅ Kurir berhasil ditambahkan: ${number}`);
}
break;

case "delkurir": {
    if (!isOwner) return m.reply(mess.owner);
    if (!text) return m.reply(`Format: ${cmd} 628xxx`);
    
    let number = text.replace(/[^0-9]/g, "");
    if (!number.startsWith("62")) number = "62" + number.replace(/^0+/, "");
    
    const crm = loadCrmData();
    if (!crm.couriers) crm.couriers = [];
    
    const idx = crm.couriers.indexOf(number);
    if (idx === -1) return m.reply("Nomor tidak ditemukan di daftar kurir.");
    
    crm.couriers.splice(idx, 1);
    saveCrmData(crm);
    m.reply(`✅ Kurir berhasil dihapus: ${number}`);
}
break;

case "listkurir": {
    if (!isOwner) return m.reply(mess.owner);
    const crm = loadCrmData();
    if (!crm.couriers || crm.couriers.length === 0) return m.reply("Belum ada kurir terdaftar.");
    
    let list = `🚚 *DAFTAR KURIR*\n`;
    crm.couriers.forEach((c, i) => {
        list += `${i+1}. wa.me/${c}\n`;
    });
    m.reply(list);
}
break;

// === CUSTOMER PROFILE MANAGEMENT ===
case "profile":
case "profil":
case "me": {
    const crm = loadCrmData();
    const cust = crm.customers[m.sender];
    
    if (!cust) return m.reply("Anda belum terdaftar. Ketik .daftar");
    
    let btnMsg = generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
            message: {
                messageContextInfo: {
                    deviceListMetadata: {},
                    deviceListMetadataVersion: 2
                },
                interactiveMessage: {
                    body: { text: `👤 *PROFIL PELANGGAN*\n\nNama: ${cust.name}\nAlamat: ${cust.address}\nTotal Order: ${cust.orders_count}\nBergabung: ${cust.joined.split('T')[0]}` },
                    footer: { text: "Depot Minhaqua" },
                    nativeFlowMessage: {
                        buttons: [
                            {
                                name: "quick_reply",
                                buttonParamsJson: JSON.stringify({
                                    display_text: "✏️ Ubah Nama",
                                    id: ".editname"
                                })
                            },
                             {
                                name: "quick_reply",
                                buttonParamsJson: JSON.stringify({
                                    display_text: "✏️ Ubah Alamat/Lokasi",
                                    id: ".editaddress"
                                })
                            },
                            {
                                name: "quick_reply",
                                buttonParamsJson: JSON.stringify({
                                    display_text: "🔄 Pesan Lagi (Terakhir)",
                                    id: ".repeatorder"
                                })
                            }
                        ]
                    }
                }
            }
        }
    }, { userJid: m.sender, quoted: m });
    
    return sock.relayMessage(m.chat, btnMsg.message, { messageId: btnMsg.key.id });
}
break;

case "repeatorder": {
    const crm = loadCrmData();
    if (!crm.customers[m.sender]) return m.reply("⚠️ Anda belum terdaftar.");
    
    // Find last completed order
    const lastOrder = crm.orders
        .filter(o => o.customerId === m.sender && o.status === "Selesai")
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    
    if (!lastOrder) return m.reply("💭 Anda belum pernah melakukan pesanan sebelumnya.");
    
    // Recreate cart from last order
    if (!global.cart) global.cart = {};
    global.cart[m.sender] = lastOrder.items || [];
    
    const total = global.cart[m.sender].reduce((acc, item) => acc + (item.price * item.qty), 0);
    let itemSummary = global.cart[m.sender].map(i => `${i.qty}x ${i.name}`).join(", ");
    
    let buttons = [
        {
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({
                display_text: "✅ Ya, Pesan Lagi",
                id: `.orderconfirm COD`
            })
        },
        {
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({
                display_text: "❌ Batalkan",
                id: `.emptycart`
            })
        }
    ];

    let msg = generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
            message: {
                messageContextInfo: {
                    deviceListMetadata: {},
                    deviceListMetadataVersion: 2
                },
                interactiveMessage: {
                    body: { text: `🔄 *ULANGI PESANAN TERAKHIR*\n\nPesanan: ${itemSummary}\nTotal: Rp${total.toLocaleString()}\n\nPesan lagi dengan pesanan yang sama?` },
                    footer: { text: "Depot Minhaqua" },
                    nativeFlowMessage: {
                        buttons: buttons,
                        messageParamsJson: JSON.stringify({
                            from_flow: true 
                        })
                    }
                }
            }
        }
    }, { userJid: m.sender, quoted: m });
    
    return sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
}

case "editname": {
    if (!global.registrationSession) global.registrationSession = {};
    global.registrationSession[m.sender] = { step: "EDIT_NAME" };
    m.reply("👤 Silakan kirim *Nama Baru* Anda:");
}
break;

case "editaddress": {
    if (!global.registrationSession) global.registrationSession = {};
    global.registrationSession[m.sender] = { step: "EDIT_LOCATION" }; // Reuse logic similar to registration
    m.reply("📍 Silakan kirim *Share Location* (Lokasi Maps) baru Anda.\n\nAtau balas '.' jika ingin melewati (tetap pakai lokasi lama) dan hanya ubah detail alamat.");
}
break;

case "listproduk":
case "produk": 
case "harga": {
    const crm = loadCrmData();
    let list = `💧 *DAFTAR HARGA AIR ISI ULANG*\n\n`;
    crm.products.forEach((p, i) => {
        list += `${i+1}. ${p.name} : Rp${p.price.toLocaleString()}\n`;
    });
    list += `\nGunakan command .order untuk memesan.`;
    m.reply(list);
    }
    break;

case "cekorder":
case "statusorder": {
    const crm = loadCrmData();
    const myOrders = crm.orders.filter(o => o.customerId === m.sender && (o.status === "Menunggu" || o.status === "Diantar"));
    
    if (myOrders.length === 0) return m.reply("Anda tidak memiliki pesanan aktif saat ini.");
    
    // Interactive List for Customer to View/Cancel Orders
    const orderRows = myOrders.map(o => ({
         header: `ID: ${o.id}`,
         title: `${o.item}`,
         description: `Status: ${o.status} | Rp${o.total.toLocaleString()}`,
         id: `.statusdetail ${o.id}` 
    }));

    let msg = generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
            message: {
                messageContextInfo: {
                    deviceListMetadata: {},
                    deviceListMetadataVersion: 2
                },
                interactiveMessage: {
                    body: { text: "Berikut adalah pesanan aktif Anda. Klik untuk melihat detail atau membatalkan." },
                    footer: { text: "Depot Minhaqua" },
                    header: { title: "🔍 STATUS PESANAN", subtitle: "", hasMediaAttachment: false },
                    nativeFlowMessage: {
                        buttons: [
                            {
                                name: "single_select",
                                buttonParamsJson: JSON.stringify({
                                    title: "Pilih Pesanan",
                                    sections: [{
                                        title: "Pesanan Saya",
                                        rows: orderRows
                                    }]
                                })
                            }
                        ]
                    }
                }
            }
        }
    }, { userJid: m.sender, quoted: m });
    return sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
}
break;

case "statusdetail": {
    const orderId = text.trim();
    const crm = loadCrmData();
    const order = crm.orders.find(o => o.id === orderId && o.customerId === m.sender);

    if (!order) return m.reply("Pesanan tidak ditemukan.");

    let buttons = [];
    if (order.status === "Menunggu") {
         buttons.push({
             name: "quick_reply",
             buttonParamsJson: JSON.stringify({
                 display_text: "❌ Batalkan Pesanan",
                 id: `.batalorder ${orderId}`
             })
         });
         buttons.push({
             name: "quick_reply",
             buttonParamsJson: JSON.stringify({
                 display_text: "🔔 Reminder Kurir",
                 id: `.remindkurir ${orderId}`
             })
         });
    } else {
         buttons.push({
             name: "cta_url", // Just visual, cannot cancel
             buttonParamsJson: JSON.stringify({
                 display_text: "Hubungi Admin",
                 url: `https://wa.me/${courierId}`
             })
         });
    }

    let msg = generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
            message: {
                messageContextInfo: {
                    deviceListMetadata: {},
                    deviceListMetadataVersion: 2
                },
                interactiveMessage: {
                    body: { text: `📋 *DETAIL PESANAN*\n\n🆔 ID: ${order.id}\n📦 Item: ${order.item}\n💰 Total: Rp${order.total.toLocaleString()}\n🚚 Status: *${order.status}*\n📅 Tanggal: ${order.date.split('T')[0]}\n📍 Alamat: ${order.address}` },
                    footer: { text: "Depot Minhaqua" },
                    nativeFlowMessage: {
                         buttons: buttons,
                         messageParamsJson: JSON.stringify({
                             from_flow: true 
                         })
                    }
                }
            }
        }
    }, { userJid: m.sender, quoted: m });
    
    return sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
}
break;

case "batalorder": {
    const orderId = text.trim();
    if (!orderId) return m.reply(`Masukkan ID Order.`);
    
    const crm = loadCrmData();
    const orderIdx = crm.orders.findIndex(o => o.id === orderId && o.customerId === m.sender);
    
    if (orderIdx === -1) return m.reply("Pesanan tidak ditemukan.");
    if (crm.orders[orderIdx].status !== "Menunggu") return m.reply("Pesanan tidak dapat dibatalkan karena sudah diproses/selesai.");
    
    crm.orders[orderIdx].status = "Dibatalkan";
    saveCrmData(crm);
    m.reply(`✅ Pesanan ${orderId} berhasil dibatalkan.`);
    }
    break;

case "remindkurir": {
    const orderId = text.trim();
    if (!orderId) return m.reply(`Masukkan ID Order.`);
    
    const crm = loadCrmData();
    const order = crm.orders.find(o => o.id === orderId && o.customerId === m.sender);
    
    if (!order) return m.reply("Pesanan tidak ditemukan.");
    if (order.status !== "Menunggu") return m.reply("Pesanan sudah diproses oleh kurir.");
    
    // Send manual reminder to all couriers
    if (!crm.couriers || crm.couriers.length === 0) {
        return m.reply("Maaf, saat ini tidak ada kurir yang tersedia. Kami akan segera menindaklanjuti pesanan Anda.");
    }
    
    let remindersSent = 0;
    for (const courierNum of crm.couriers) {
        const courierJid = courierNum + "@s.whatsapp.net";
        
        let msg = generateWAMessageFromContent(courierJid, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: {
                        deviceListMetadata: {},
                        deviceListMetadataVersion: 2
                    },
                    interactiveMessage: {
                        body: { 
                            text: `🔔 *REMINDER DARI CUSTOMER*\n\n` +
                                  `Customer menunggu pesanan ini:\n\n` +
                                  `ID: ${order.id}\n` +
                                  `Area: ${order.address}\n` +
                                  `Item: ${order.item}\n` +
                                  `Total: Rp${order.total.toLocaleString()}\n\n` +
                                  `⚠️ Mohon segera diambil!`
                        },
                        footer: { text: "Depot Minhaqua" },
                        nativeFlowMessage: {
                            buttons: [
                                {
                                    name: "quick_reply",
                                    buttonParamsJson: JSON.stringify({
                                        display_text: "📦 Ambil Antrian",
                                        id: `.ambilantrian ${order.id}`
                                    })
                                }
                            ]
                        }
                    }
                }
            }
        }, { userJid: courierJid });
        
        // For interactive messages, use relayMessage directly with delay
        try {
            await sock.relayMessage(courierJid, msg.message, { messageId: msg.key.id });
            remindersSent++;
            // Delay to avoid rate limit
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            console.error(`[RemindKurir] Failed to send to ${courierNum}:`, error.message);
        }
    }
    
    m.reply(`✅ Reminder telah dikirim ke ${remindersSent} kurir. Mohon tunggu sebentar, kurir kami akan segera mengambil pesanan Anda.`);
    
    // Notify owner about manual reminder using messageQueue
    const ownerJid = global.owner + "@s.whatsapp.net";
    messageQueue.add(
        sock,
        ownerJid,
        { text: `ℹ️ Customer ${order.customerName} mengirim reminder manual untuk order ${order.id}` },
        {},
        'owner_notification',
        order.id
    );
}
break;


// === ADMIN & COURIER CRM COMMANDS ===
case "listorder": {
    const crm = loadCrmData();
    const isCourier = crm.couriers && crm.couriers.includes(m.sender.split('@')[0]);
    if (!isOwner && !isReseller && !isCourier) return m.reply(mess.owner); // Reseller dianggap staff/admin

    const activeOrders = crm.orders.filter(o => o.status === "Menunggu" || o.status === "Diantar");
    
    if (activeOrders.length === 0) return m.reply("Tidak ada pesanan aktif.");

    // Interactive List for Admin/Courier
    const orderRows = activeOrders.map(o => ({
         header: `ID: ${o.id}`,
         title: `${o.customerName} (${o.item})`,
         description: `Status: ${o.status} | Rp${o.total.toLocaleString()} | ${o.address}`,
         id: `.manageorder ${o.id}` 
    }));

    let msg = generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
            message: {
                messageContextInfo: {
                    deviceListMetadata: {},
                    deviceListMetadataVersion: 2
                },
                interactiveMessage: {
                    body: { text: "Berikut daftar pesanan aktif yang perlu diproses:" },
                    footer: { text: "Admin/Kurir Panel Depot Minhaqua" },
                    header: { title: "📋 KELOLA PESANAN", subtitle: "", hasMediaAttachment: false },
                    nativeFlowMessage: {
                        buttons: [
                            {
                                name: "single_select",
                                buttonParamsJson: JSON.stringify({
                                    title: "Pilih Pesanan",
                                    sections: [{
                                        title: "Pesanan Aktif",
                                        rows: orderRows
                                    }]
                                })
                            }
                        ]
                    }
                }
            }
        }
    }, { userJid: m.sender, quoted: m });
    return sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
}
break;

case "manageorder": {
    const crm = loadCrmData();
    const isCourier = crm.couriers && crm.couriers.includes(m.sender.split('@')[0]);
    if (!isOwner && !isReseller && !isCourier) return m.reply(mess.owner);

    if (!text) return m.reply("ID Order missing.");
    
    const orderId = text.trim();
    const order = crm.orders.find(o => o.id === orderId);

    if (!order) return m.reply("Order tidak ditemukan.");

    let buttons = [];
    
    // Logic: If Menunggu, courier can "Take Job" (Ambil Antrian).
    // If already "Diantar" by THIS courier, show "Selesai".
    // If "Diantar" by someone else, show info.
    
    if (order.status === "Menunggu") {
         buttons.push({
             name: "quick_reply",
             buttonParamsJson: JSON.stringify({
                 display_text: "📦 Ambil Antrian",
                 id: `.ambilantrian ${orderId}`
             })
         });
    } else if (order.status === "Diantar") {
        if (order.courierId === m.sender.split('@')[0] || isOwner) {
             buttons.push({
                 name: "quick_reply",
                 buttonParamsJson: JSON.stringify({
                     display_text: "✅ Selesai (Sudah Sampai)",
                     id: `.selesai ${orderId}`
                 })
             });
        } 
    }

    let msg = generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
            message: {
                messageContextInfo: {
                    deviceListMetadata: {},
                    deviceListMetadataVersion: 2
                },
                interactiveMessage: {
                    body: { text: `Detail Pesanan\n\nID: ${order.id}\nNama: ${order.customerName}\nAlamat: ${order.address}\nItem: ${order.item}\nTotal: Rp${order.total.toLocaleString()}\nPembayaran: ${order.paymentMethod || "-"}\nStatus: *${order.status}*\nKurir: ${order.courierId || "-"}` },
                    footer: { text: "Panel Depot Minhaqua" },
                    nativeFlowMessage: {
                         buttons: buttons,
                         messageParamsJson: JSON.stringify({
                             from_flow: true 
                         })
                    }
                }
            }
        }
    }, { userJid: m.sender, quoted: m });
    
    return sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
}
break;

case "ambilantrian":
case "antar": { // Renamed concept but keeping legacy alias for now or redirecting
    const crm = loadCrmData();
    const isCourier = crm.couriers && crm.couriers.includes(m.sender.split('@')[0]);
    if (!isOwner && !isReseller && !isCourier) return m.reply(mess.owner);

    if (!text) return m.reply(`Masukkan ID Order.`);
    const order = crm.orders.find(o => o.id === text.trim());
    
    if (!order) return m.reply("Order tidak ditemukan.");
    if (order.status !== "Menunggu") return m.reply(`Order sudah diproses dengan status: ${order.status}`);
    
    order.status = "Diantar";
    order.courierId = m.sender.split('@')[0]; // Assign courier
    saveCrmData(crm);
    
    // Generate Maps URL
    let mapsUrl = "";
    if (order.latitude && order.longitude) {
         mapsUrl = `https://www.google.com/maps/search/?api=1&query=${order.latitude},${order.longitude}`;
    } else {
         mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address)}`;
    }

    // Replace simple reply with button
    let btnMsg = generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
            message: {
                messageContextInfo: {
                    deviceListMetadata: {},
                    deviceListMetadataVersion: 2
                },
                interactiveMessage: {
                    body: { text: `✅ Berhasil mengambil antrian pengantaran untuk Order ${order.id}.\n\n${order.item} \n\nSegera antar ke: ${order.address}` },
                    footer: { text: "Panel Kurir" },
                    nativeFlowMessage: {
                        buttons: [
                            {
                                name: "cta_url",
                                buttonParamsJson: JSON.stringify({
                                    display_text: "📍 Buka Google Maps",
                                    url: mapsUrl,
                                    merchant_url: mapsUrl
                                })
                            },
                            {
                                name: "quick_reply",
                                buttonParamsJson: JSON.stringify({
                                    display_text: "✅ Selesai (Sudah Sampai)",
                                    id: `.selesai ${order.id}`
                                })
                            }
                        ]
                    }
                }
            }
        }
    }, { userJid: m.sender, quoted: m });
    
    sock.relayMessage(m.chat, btnMsg.message, { messageId: btnMsg.key.id });
    sock.sendMessage(order.customerId, { text: `🚚 Pesanan Anda ${order.item} sedang diantar oleh kurir ${m.pushName || "kami"} wa.me/${order.courierId}!` });
    
    if (isCourier) {
        sock.sendMessage(global.owner + "@s.whatsapp.net", { text: `ℹ️ Info: Kurir ${m.pushName || m.sender.split('@')[0]} mengambil antrian pesanan ${order.id} untuk ${order.customerName} dengan pemesanan ${order.item}.` });
    }
}
break;

case "myantrian": {
    const crm = loadCrmData();
    const courierId = m.sender.split('@')[0];
    const isCourier = crm.couriers && crm.couriers.includes(courierId);
    if (!isOwner && !isCourier) return m.reply(mess.owner);
    
    const myQueue = crm.orders.filter(o => o.status === "Diantar" && o.courierId === courierId);
    
    if (myQueue.length === 0) return m.reply("Anda tidak memiliki antrian pengantaran aktif.");
    
    let list = `🚚 *ANTRIAN PENGANTARAN SAYA*\n`;
    const orderRows = myQueue.map(o => ({
         header: `ID: ${o.id}`,
         title: `${o.customerName} - ${o.address}`,
         description: `Item: ${o.amount}x ${o.item} | Tagihan: Rp${o.total.toLocaleString()}`,
         id: `.manageorder ${o.id}` 
    }));

    let msg = generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
            message: {
                messageContextInfo: {
                    deviceListMetadata: {},
                    deviceListMetadataVersion: 2
                },
                interactiveMessage: {
                    body: { text: "Berikut daftar barang yang harus Anda antar sekarang:" },
                    footer: { text: "Panel Kurir" },
                    header: { title: "🚚 TUGAS PENGANTARAN", subtitle: "", hasMediaAttachment: false },
                    nativeFlowMessage: {
                        buttons: [
                            {
                                name: "single_select",
                                buttonParamsJson: JSON.stringify({
                                    title: "Pilih Tugas",
                                    sections: [{
                                        title: "Antrian Aktif",
                                        rows: orderRows
                                    }]
                                })
                            }
                        ]
                    }
                }
            }
        }
    }, { userJid: m.sender, quoted: m });
    return sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });

}
break;

case "selesai": {
    const crm = loadCrmData();
    const isCourier = crm.couriers && crm.couriers.includes(m.sender.split('@')[0]);
    if (!isOwner && !isReseller && !isCourier) return m.reply(mess.owner);

    if (!text) return m.reply(`Masukkan ID Order. Contoh: ${cmd} ORD-123456`);
    const order = crm.orders.find(o => o.id === text.trim());
    
    if (!order) return m.reply("Order tidak ditemukan.");
    
    order.status = "Selesai";
    saveCrmData(crm);
    m.reply(`✅ Order ${order.customerName} dengan ID ${order.id} status diubah menjadi *Selesai*.`);
    
    // Ask for Rating from Customer
    let rateMsg = generateWAMessageFromContent(order.customerId, {
        viewOnceMessage: {
            message: {
                messageContextInfo: {
                    deviceListMetadata: {},
                    deviceListMetadataVersion: 2
                },
                interactiveMessage: {
                    body: { text: `✅ Pesanan Anda telah selesai diantar.\n\nBagaimana pelayanan kami? Mohon berikan penilaian:` },
                    footer: { text: "Depot Minhaqua" },
                    nativeFlowMessage: {
                        buttons: [
                            {
                                name: "quick_reply",
                                buttonParamsJson: JSON.stringify({
                                    display_text: "⭐⭐⭐⭐⭐",
                                    id: `.rateorder ${order.id} 5`
                                })
                            },
                            {
                                name: "quick_reply",
                                buttonParamsJson: JSON.stringify({
                                    display_text: "⭐⭐⭐⭐",
                                    id: `.rateorder ${order.id} 4`
                                })
                            },
                             {
                                name: "quick_reply",
                                buttonParamsJson: JSON.stringify({
                                    display_text: "⭐⭐⭐",
                                    id: `.rateorder ${order.id} 3`
                                })
                            },
                             {
                                name: "quick_reply",
                                buttonParamsJson: JSON.stringify({
                                    display_text: "⭐⭐",
                                    id: `.rateorder ${order.id} 2`
                                })
                            },
                             {
                                name: "quick_reply",
                                buttonParamsJson: JSON.stringify({
                                    display_text: "⭐",
                                    id: `.rateorder ${order.id} 1`
                                })
                            }
                        ]
                    }
                }
            }
        }
    }, { userJid: order.customerId });

    sock.relayMessage(order.customerId, rateMsg.message, { messageId: rateMsg.key.id });
    
    // Notify Owner if Courier Updated
    if (isCourier) {
        sock.sendMessage(global.owner + "@s.whatsapp.net", { text: `ℹ️ Info: Kurir ${m.pushName || m.sender.split('@')[0]} menyelesaikan pesanan ${order.id}.` });
    }
}
break;

case "rateorder": {
    const [orderId, scoreStr] = text.split(" ");
    const score = parseInt(scoreStr);
    const crm = loadCrmData();
    const order = crm.orders.find(o => o.id === orderId);

    if (!order) return m.reply("Order tidak ditemukan.");
    if (order.rating) return m.reply("Anda sudah memberikan penilaian untuk pesanan ini.");
    
    order.rating = score;
    saveCrmData(crm);
    
    // Notify Owner
    sock.sendMessage(global.owner + "@s.whatsapp.net", { text: `⭐ *RATING DITERIMA*\n\nOrder: ${orderId}\nPelanggan: ${order.customerName}\nNilai: ${score}/5` });

    let buttons = [
        {
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({
                display_text: "🛒 Order Lagi",
                id: ".order"
            })
        }
    ];

    let msg = generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
            message: {
                messageContextInfo: {
                    deviceListMetadata: {},
                    deviceListMetadataVersion: 2
                },
                interactiveMessage: {
                    body: { text: `Terima kasih atas penilaian ${score} bintangnya! ⭐\nKami akan terus meningkatkan pelayanan kami.` },
                    footer: { text: "Depot Minhaqua" },
                    nativeFlowMessage: {
                        buttons: buttons,
                        messageParamsJson: JSON.stringify({
                             from_flow: true 
                        })
                    }
                }
            }
        }
    }, { userJid: m.sender, quoted: m });
    
    return sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
}
break;

case "listcust": {
    if (!isOwner) return m.reply(mess.owner);
    const crm = loadCrmData();
    const custs = Object.values(crm.customers);
    
    if (custs.length === 0) return m.reply("Belum ada pelanggan terdaftar.");
    
    let txt = `👥 *DATA PELANGGAN*\n`;
    custs.forEach((c, i) => {
        txt += `${i+1}. ${c.name} (${c.orders_count} orders)\n   Alamat: ${c.address}\n`;
    });
    m.reply(txt);
    }
    break;

// === POS SYSTEM (OWNER) ===
// === ENHANCED POS SYSTEM ===
case "pos": {
    if (!isOwner) return m.reply(mess.owner);
    const crm = loadCrmData();
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = crm.orders.filter(o => o.date.startsWith(today) && o.status === 'Selesai');
    const totalRevenue = todayOrders.reduce((acc, curr) => acc + curr.total, 0);
    
    // Calculate additional stats
    const thisMonth = new Date().toISOString().slice(0, 7);
    const monthOrders = crm.orders.filter(o => o.date.startsWith(thisMonth) && o.status === 'Selesai');
    const monthRevenue = monthOrders.reduce((acc, curr) => acc + curr.total, 0);
    const pendingOrders = crm.orders.filter(o => o.status === 'Menunggu').length;
    
    // Top product today
    const productCount = {};
    todayOrders.forEach(o => {
        if (o.items) {
            o.items.forEach(item => {
                productCount[item.name] = (productCount[item.name] || 0) + item.qty;
            });
        } else if (o.item) {
            productCount[o.item] = (productCount[o.item] || 0) + o.amount;
        }
    });
    const topProduct = Object.entries(productCount).sort((a, b) => b[1] - a[1])[0];
    const topProductText = topProduct ? `${topProduct[0]} (${topProduct[1]}x)` : "-";

    let btnMsg = generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
            message: {
                messageContextInfo: {
                    deviceListMetadata: {},
                    deviceListMetadataVersion: 2
                },
                interactiveMessage: {
                    body: { 
                        text: `🏪 *POINT OF SALE - DEPOT MINHAQUA*\n\n` +
                              `📅 *HARI INI (${today})*\n` +
                              `💰 Omset: Rp${totalRevenue.toLocaleString()}\n` +
                              `📝 Transaksi: ${todayOrders.length}\n` +
                              `🔥 Terlaris: ${topProductText}\n\n` +
                              `📊 *BULAN INI*\n` +
                              `💵 Total: Rp${monthRevenue.toLocaleString()}\n` +
                              `📦 Transaksi: ${monthOrders.length}\n\n` +
                              `⏳ *PENDING*\n` +
                              `🚚 Order Menunggu: ${pendingOrders}`
                    },
                    footer: { text: "POS System v2.0" },
                    nativeFlowMessage: {
                        buttons: [
                            {
                                name: "quick_reply",
                                buttonParamsJson: JSON.stringify({
                                    display_text: "🛒 Transaksi Baru",
                                    id: ".posinput"
                                })
                            },
                            {
                                name: "quick_reply",
                                buttonParamsJson: JSON.stringify({
                                    display_text: "📊 Laporan Lengkap",
                                    id: ".posreport"
                                })
                            },
                            {
                                name: "quick_reply",
                                buttonParamsJson: JSON.stringify({
                                    display_text: "👥 Data Pelanggan",
                                    id: ".listcust"
                                })
                            }
                        ]
                    }
                }
            }
        }
    }, { userJid: m.sender, quoted: m });
    
    return sock.relayMessage(m.chat, btnMsg.message, { messageId: btnMsg.key.id });
}
break;

case "posreport": {
    if (!isOwner) return m.reply(mess.owner);
    const crm = loadCrmData();
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const thisMonth = new Date().toISOString().slice(0, 7);
    
    const todayOrders = crm.orders.filter(o => o.date.startsWith(today) && o.status === 'Selesai');
    const yesterdayOrders = crm.orders.filter(o => o.date.startsWith(yesterday) && o.status === 'Selesai');
    const monthOrders = crm.orders.filter(o => o.date.startsWith(thisMonth) && o.status === 'Selesai');
    
    const todayRev = todayOrders.reduce((acc, o) => acc + o.total, 0);
    const yesterdayRev = yesterdayOrders.reduce((acc, o) => acc + o.total, 0);
    const monthRev = monthOrders.reduce((acc, o) => acc + o.total, 0);
    
    const growth = yesterdayRev > 0 ? (((todayRev - yesterdayRev) / yesterdayRev) * 100).toFixed(1) : 0;
    const growthIcon = growth >= 0 ? "📈" : "📉";
    
    // Average order value
    const avgOrder = todayOrders.length > 0 ? (todayRev / todayOrders.length).toFixed(0) : 0;
    
    // Product breakdown
    const productSales = {};
    monthOrders.forEach(o => {
        if (o.items) {
            o.items.forEach(item => {
                if (!productSales[item.name]) {
                    productSales[item.name] = { qty: 0, revenue: 0 };
                }
                productSales[item.name].qty += item.qty;
                productSales[item.name].revenue += item.price * item.qty;
            });
        } else if (o.item) {
            if (!productSales[o.item]) {
                productSales[o.item] = { qty: 0, revenue: 0 };
            }
            productSales[o.item].qty += o.amount;
            productSales[o.item].revenue += o.total;
        }
    });
    
    let productBreakdown = "";
    Object.entries(productSales)
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .slice(0, 5)
        .forEach(([name, data], i) => {
            productBreakdown += `${i+1}. ${name}\n   ${data.qty}x | Rp${data.revenue.toLocaleString()}\n`;
        });
    
    const report = `📊 *LAPORAN PENJUALAN LENGKAP*\n\n` +
                   `📅 *HARI INI (${today})*\n` +
                   `💰 Revenue: Rp${todayRev.toLocaleString()}\n` +
                   `📝 Transaksi: ${todayOrders.length}\n` +
                   `💵 Rata-rata: Rp${avgOrder}\n` +
                   `${growthIcon} Growth: ${growth}%\n\n` +
                   `📅 *KEMARIN*\n` +
                   `💰 Revenue: Rp${yesterdayRev.toLocaleString()}\n` +
                   `📝 Transaksi: ${yesterdayOrders.length}\n\n` +
                   `📅 *BULAN INI*\n` +
                   `💰 Revenue: Rp${monthRev.toLocaleString()}\n` +
                   `📝 Transaksi: ${monthOrders.length}\n\n` +
                   `🔥 *TOP 5 PRODUK BULAN INI*\n${productBreakdown || "-"}\n` +
                   `📍 Total Customer: ${Object.keys(crm.customers).length}`;
    
    m.reply(report);
}
break;

case "posinput": {
    if (!isOwner) return m.reply(mess.owner);
    const crm = loadCrmData();
    const products = crm.products.map((p, i) => ({
         header: p.name,
         title: `Rp${p.price.toLocaleString()}`,
         description: "Tap untuk pilih",
         id: `.posadditem ${i}` 
    }));

    let msg = generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
            message: {
                messageContextInfo: {
                    deviceListMetadata: {},
                    deviceListMetadataVersion: 2
                },
                interactiveMessage: {
                    body: { text: "🛒 *TRANSAKSI BARU*\n\nPilih produk untuk ditambahkan ke keranjang POS:" },
                    footer: { text: "POS System - Depot Minhaqua" },
                    header: { title: "💳 KASIR", subtitle: "", hasMediaAttachment: false },
                    nativeFlowMessage: {
                        buttons: [
                            {
                                name: "single_select",
                                buttonParamsJson: JSON.stringify({
                                    title: "Pilih Produk",
                                    sections: [{
                                        title: "Daftar Produk",
                                        rows: products
                                    }]
                                })
                            }
                        ]
                    }
                }
            }
        }
    }, { userJid: m.sender, quoted: m });
    return sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
}
break;

case "posadditem": {
    if (!isOwner) return m.reply(mess.owner);
    const idx = parseInt(text);
    const crm = loadCrmData();
    if (!crm.products[idx]) return m.reply("Produk invalid");
    const product = crm.products[idx];

    let buttons = [
        { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "1", id: `.posqty ${idx} 1` }) },
        { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "2", id: `.posqty ${idx} 2` }) },
        { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "3", id: `.posqty ${idx} 3` }) },
        { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "5", id: `.posqty ${idx} 5` }) },
        { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "10", id: `.posqty ${idx} 10` }) }
    ];

    let msg = generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
            message: {
                messageContextInfo: {
                    deviceListMetadata: {},
                    deviceListMetadataVersion: 2
                },
                interactiveMessage: {
                    body: { text: `📦 *${product.name}*\n💰 Harga: Rp${product.price.toLocaleString()}\n\nPilih jumlah:` },
                    footer: { text: "POS System" },
                    nativeFlowMessage: {
                        buttons: buttons,
                        messageParamsJson: JSON.stringify({ from_flow: true })
                    }
                }
            }
        }
    }, { userJid: m.sender, quoted: m });
    return sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
}
break;

case "posqty": {
    if (!isOwner) return m.reply(mess.owner);
    const [idxStr, qtyStr] = text.split(" ");
    const idx = parseInt(idxStr);
    const qty = parseInt(qtyStr);
    const crm = loadCrmData();
    const product = crm.products[idx];
    
    if (!product) return m.reply("Produk tidak ditemukan");
    
    // Initialize POS cart
    if (!global.posCart) global.posCart = {};
    if (!global.posCart[m.sender]) global.posCart[m.sender] = [];
    
    // Add to cart
    const existingItem = global.posCart[m.sender].find(item => item.idx === idx);
    if (existingItem) {
        existingItem.qty += qty;
    } else {
        global.posCart[m.sender].push({ idx, name: product.name, price: product.price, qty });
    }
    
    // Calculate cart total
    const cartTotal = global.posCart[m.sender].reduce((acc, item) => acc + (item.price * item.qty), 0);
    const cartItems = global.posCart[m.sender].map(item => `${item.qty}x ${item.name}`).join(", ");
    
    let buttons = [
        {
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({
                display_text: "➕ Tambah Produk Lain",
                id: ".posinput"
            })
        },
        {
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({
                display_text: "💳 Checkout",
                id: ".poscheckout"
            })
        },
        {
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({
                display_text: "🗑️ Batal",
                id: ".posclear"
            })
        }
    ];

    let msg = generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
            message: {
                messageContextInfo: {
                    deviceListMetadata: {},
                    deviceListMetadataVersion: 2
                },
                interactiveMessage: {
                    body: { 
                        text: `✅ *DITAMBAHKAN KE KERANJANG*\n\n` +
                              `${qty}x ${product.name}\n\n` +
                              `🛒 *KERANJANG SAAT INI:*\n${cartItems}\n\n` +
                              `💰 *TOTAL: Rp${cartTotal.toLocaleString()}*`
                    },
                    footer: { text: "POS System" },
                    nativeFlowMessage: {
                        buttons: buttons,
                        messageParamsJson: JSON.stringify({ from_flow: true })
                    }
                }
            }
        }
    }, { userJid: m.sender, quoted: m });
    return sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
}
break;

case "posclear": {
    if (!isOwner) return m.reply(mess.owner);
    if (global.posCart && global.posCart[m.sender]) {
        delete global.posCart[m.sender];
        m.reply("🗑️ Keranjang POS berhasil dikosongkan.");
    } else {
        m.reply("Keranjang sudah kosong.");
    }
}
break;

case "poscheckout": {
    if (!isOwner) return m.reply(mess.owner);
    if (!global.posCart || !global.posCart[m.sender] || global.posCart[m.sender].length === 0) {
        return m.reply("Keranjang kosong. Gunakan .posinput untuk memulai transaksi.");
    }
    
    const cart = global.posCart[m.sender];
    const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const itemList = cart.map(item => `${item.qty}x ${item.name}`).join(", ");
    
    let buttons = [
        {
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({
                display_text: "💵 Tunai",
                id: ".posconfirm COD"
            })
        },
        {
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({
                display_text: "💳 Transfer",
                id: ".posconfirm Transfer"
            })
        },
        {
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({
                display_text: "📱 E-Wallet",
                id: ".posconfirm E-Wallet"
            })
        }
    ];

    let msg = generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
            message: {
                messageContextInfo: {
                    deviceListMetadata: {},
                    deviceListMetadataVersion: 2
                },
                interactiveMessage: {
                    body: { 
                        text: `💳 *CHECKOUT*\n\n` +
                              `🛒 Item: ${itemList}\n` +
                              `💰 Total: Rp${total.toLocaleString()}\n\n` +
                              `Pilih metode pembayaran:`
                    },
                    footer: { text: "POS System" },
                    nativeFlowMessage: {
                        buttons: buttons,
                        messageParamsJson: JSON.stringify({ from_flow: true })
                    }
                }
            }
        }
    }, { userJid: m.sender, quoted: m });
    return sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
}
break;

case "posconfirm": {
    if (!isOwner) return m.reply(mess.owner);
    const paymentMethod = text || "COD";
    
    if (!global.posCart || !global.posCart[m.sender] || global.posCart[m.sender].length === 0) {
        return m.reply("Keranjang kosong/kadaluarsa. Silakan mulai transaksi baru.");
    }
    
    const cart = global.posCart[m.sender];
    const crm = loadCrmData();
    const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const itemDetails = cart.map(i => `${i.qty}x ${i.name}`).join(", ");
    const orderId = generateOrderId();
    
    // Create order
    const newOrder = {
        id: orderId,
        customerId: "OFFLINE",
        customerName: "Walk-in Customer",
        address: "Toko",
        item: itemDetails,
        items: cart,
        amount: cart.reduce((acc, i) => acc + i.qty, 0),
        total: total,
        paymentMethod: paymentMethod,
        status: "Selesai",
        date: new Date().toISOString()
    };
    
    crm.orders.push(newOrder);
    saveCrmData(crm);
    
    // Clear cart
    delete global.posCart[m.sender];
    
    // Generate receipt
    const now = new Date();
    const receiptTime = now.toLocaleTimeString('id-ID');
    const receiptDate = now.toLocaleDateString('id-ID');
    
    let receipt = `╔═══════════════════════╗\n`;
    receipt += `║   DEPOT MINHAQUA      ║\n`;
    receipt += `║   STRUK PEMBAYARAN    ║\n`;
    receipt += `╚═══════════════════════╝\n\n`;
    receipt += `📅 ${receiptDate} ${receiptTime}\n`;
    receipt += `🆔 ${orderId}\n`;
    receipt += `━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.qty;
        receipt += `${item.name}\n`;
        receipt += `  ${item.qty} x Rp${item.price.toLocaleString()}\n`;
        receipt += `  = Rp${itemTotal.toLocaleString()}\n\n`;
    });
    
    receipt += `━━━━━━━━━━━━━━━━━━━━━━━\n`;
    receipt += `TOTAL: Rp${total.toLocaleString()}\n`;
    receipt += `Pembayaran: ${paymentMethod}\n`;
    receipt += `━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    receipt += `Terima kasih atas kunjungan Anda!\n`;
    receipt += `Semoga puas dengan pelayanan kami 🙏`;
    
    m.reply(receipt);
}
break;

case "mane":
case "menu":{
let menu = `
${global.ucapan()}
Halo @${m.sender.split("@")[0]}, Saya adalah asissten whatsapp Bot buatan RzkyNT, Senang bisa membantu kamu. 
Silahkan pilih menu dibawah ini
▢ Botname : Rzky Store 
▢ Version : 1.0.0
▢ Mode : ${sock.public ? "Public" : "Self"}
▢ Creator : RzkyNT
▢ Website : ${global.linkWebsite}
▢ Runtime : ${runtime(process.uptime())}  
  
  *Command*
➤ .menuios (command Ios) 
➤ .allmenu (button) 
➤ .allmenuv2 (no button) 
`
        await sock.sendMessage(m.chat, {
        interactiveMessage: {
            title: menu, 
            footer: global.Dev, 
            thumbnail: global.thumbnail2,
            nativeFlowMessage: {
                messageParamsJson: JSON.stringify({
                    limited_time_offer: {
                        text: "RzkyNT Store V1.0.0",
                        url: "https://rizqiahsansetiawan.ct.ws",
                        copy_code: "Expired 30/12/2025",
                        expiration_time: Date.now() * 999
                    },
                    bottom_sheet: {
                        in_thread_buttons_limit: 2,
                        divider_indices: [1, 2, 3, 4, 5, 999],
                        list_title: "RzkyNT",
                        button_title: "Select Menu"
                    },
                    tap_target_configuration: {
                        title: "RzkyNT",
                        description: "bomboclard",
                        canonical_url: "https://t.me/maneeofficiall",
                        domain: "shop.example.com",
                        button_index: 0
                    }
                }),
                buttons: [
                    {
                        name: "single_select",
                        buttonParamsJson: JSON.stringify({ has_multiple_buttons: true })
                    },
                    {
                        name: "call_permission_request",
                        buttonParamsJson: JSON.stringify({ has_multiple_buttons: true })
                    },
                    {
                        name: "single_select",
                        buttonParamsJson: JSON.stringify({
                            title: "Developer",
                            sections: [
                                {
                                    title: "RzkyNT ♻️",
                                    highlight_label: "label",
                                    rows: [
                                        {
                                            title: `@Saluran WhatsApp ${global.namaOwner} 👇🏻`, 
                                            description: `${global.linkSaluran}\n\nJangan Lupa Follow Agar Tidak Ketinggalan Tentang Update Aplikasi Terbaru.`,
                                            id: "row_1"
                                        },
                                        { 
                                            title: `@Whatsapp Developer ${global.namaOwner}`,
                                            description: `${global.wa.me}`,
                                            id: "row_2"
                                        }
                                    ]
                                }
                            ],
                            has_multiple_buttons: true
                        })
                    },
                    {
                        name: "cta_copy",
                        buttonParamsJson: JSON.stringify({
                            display_text: "Expired 30/12/2025",
                            id: "123456789",
                            copy_code: "wa.me/6289529161314"
                        })
                    },
                    {
                        name: "quick_reply",
                        buttonParamsJson: JSON.stringify({
                            display_text: "All Menu🕊",
                            id: `.allmenu`
                        })
                    },
                    {
                        name: "quick_reply",
                        buttonParamsJson: JSON.stringify({
                            display_text: "All Menu V2⛅",
                            id: `.allmenuv2`
                        })
                    },
                    {
                        name: "quick_reply",
                        buttonParamsJson: JSON.stringify({
                            display_text: "All Menu Video🎬",
                            id: `.allmenuvid`
                        })
                    },
                    {
                        name: "quick_reply",
                        buttonParamsJson: JSON.stringify({
                            display_text: "Owner 👑",
                            id: `.owner`
                        })
                    },
                    {
                        name: "quick_reply",
                        buttonParamsJson: JSON.stringify({
                            display_text: "Ping 🚀",
                            id: `.ping`
                        })
                    },
                    {
                        name: "quick_reply",
                        buttonParamsJson: JSON.stringify({
                            display_text: "Back To Menu↩️",
                            id: `.menu`
                        })
                    }
                ]
            }
        }
    }, { quoted: quoted.packSticker });
    await sleep(1000)
    sock.sendMessage(m.chat, {
        audio: fs.readFileSync('./amaneofc/mane.mp3'),
        mimetype: 'audio/mp4',
        ptt: true
    }, { quoted: m })
}
break
case 'allmenuvid': {
    await sock.sendMessage(m.chat, { react: { text: "⏱️", key: m.key }});
    const fs = require('fs');
    const jimp = require('jimp');

    const videoPath = './amaneofc/neon.mp4';
    const thumbnailPath = './amaneofc/neon.jpg';

    if (!fs.existsSync(videoPath)) {
        return m.reply("Gagal menampilkan menu: File video './amaneofc/neon.mp4' tidak dapat ditemukan di server.");
    }
    if (!fs.existsSync(thumbnailPath)) {
        return m.reply("Gagal menampilkan menu: File thumbnail './amaneofc/neon.jpg' tidak dapat ditemukan di server.");
    }

    try {
        const videoBuffer = fs.readFileSync(videoPath);
        
        const image = await jimp.read(thumbnailPath);
        if (image.bitmap.width > image.bitmap.height) {
            image.resize(300, jimp.AUTO);
        } else {
            image.resize(jimp.AUTO, 300);
        }
        image.quality(90);
        const thumbnailBuffer = await image.getBufferAsync(jimp.MIME_JPEG);
        const menuCaption = `*RzkyNT Store 🛍*

Halo👋🏻 @${m.sender.split("@")[0]} saya siap membantu.
Berikut beberapa kemampuan saya :

╭───☢︎ *Informasi Bot*
│ ◈ Nama-Bot : RzkyNT
│ ◈ Devoloper : ${global.Dev}
│ ◈ Mode : ${sock.public ? '🌐 Public' : '🔒 Self'}
│ ◈ Version : 1.0.0
│ ◈ Runtime : ${runtime(process.uptime())}
│ ◈ Instagram : Rzky.NT
╰──────────────────⪨

 ➢ 𝗧𝗢𝗣 𝗚𝗔𝗡𝗜𝗘𝗥 𝗠𝗘𝗡𝗨
- .listresponse
- .delresponse
- .addresponseW
- .done
- .proses
- .installpanel
- .pushkontak2

➢ 𝗢𝗧𝗢𝗠𝗔𝗧𝗜𝗦 𝗠𝗘𝗡𝗨
- .autojpmch on/off
- .setjpmch
- .delsetjpmch
- .autojpm on/off
- .setjpm
- .delsetjpm
- .autojoingrup on/off

➢ 𝗠𝗔𝗜𝗡 𝗠𝗘𝗡𝗨
- .ai
- .pinterest
- .listidgrup
- .ssweb
- .emojimix
- .swtaggc
- .brat
- .bratvid (No support Emoji)
- .tourl
- .tourl2
- .sticker
- .cekidch
- .paustad
- .iqc
- .hd
- .hdvid

➢ 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗 𝗠𝗘𝗡𝗨 
- .alldown (Semua media) 
- .mediafire
- .tiktok
- .tiktok2
- .play
- .ytmp3
- .ytmp4

➢ 𝗚𝗥𝗨𝗣 𝗠𝗘𝗡𝗨
- .antilink
- .antilink2
- .welcome
- .statusgrup
- .hidetag
- .kick
- .open
- .close

➢ 𝗦𝗧𝗢𝗥𝗘 𝗠𝗘𝗡𝗨
- .pushkontak
- .pushkontak2
- .savekontak
- .stoppush
- .setjeda
- .savenomor
- .jpm
- .jpmht
- .jpmch
- .stopjpm
- .payment
- .proses
- .done

➢ 𝗣𝗔𝗡𝗘𝗟 𝗠𝗘𝗡𝗨
- .addgrupreseller
- .delgrupreseller
- .listgrupreseller
- .addseller
- .delseller
- .listseller
- .1gb-unlimited
- .delpanel
- .listpanel
- .cadmin
- .deladmin
- .listadmin
- .subdomain
- .installpanel
- .startwings
- .setptla
- .setptlc
- .setdomain
- .upapikey

➢ 𝗢𝗪𝗡𝗘𝗥 𝗠𝗘𝗡𝗨
- .delrespon
- .addrespon
- .bljpm
- .delbljpm
- .addowner
- .listowner
- .delowner
- .resetdb
- .upswgc
`;

        await sock.sendMessage(m.chat, {
            video: videoBuffer, 
            gifPlayback: true,
            caption: menuCaption,
            contextInfo: {
                forwardingScore: 1,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterName: `${global.namaOwner}`,
                    newsletterJid: `120363400297473298@newsletter`,
                },
                externalAdReply: {
                    title: global.Dev,
                    body: global.namaOwner,
                    thumbnail: thumbnailBuffer,
                    sourceUrl: ``,
                    mediaType: 1,
                    renderLargerThumbnail: true,
                    mentionedJid: [m.sender]
                }
            }
        }, { quoted: quoted.packSticker });

        const audioMessage = {
            audio: fs.readFileSync('./amaneofc/mane.mp3'),
            mimetype: 'audio/mp4',
            ptt: true,
        };
        await sock.sendMessage(m.chat, audioMessage, { quoted: m });

    } catch (error) {
        console.error("Error saat mengirim menu 'allmenumane':", error);
        await m.reply(`Terjadi kesalahan teknis saat menampilkan menu. Silakan cek log/konsol untuk detail error: ${error.message}`);
    }
}
break;
case "menuios": {
const teks = `
𝗛𝗔𝗟𝗢 @${m.sender.split("@")[0]}
${global.ucapan()}

𝗕𝗢𝗧 - 𝗜𝗡𝗙𝗢𝗥𝗠𝗔𝗧𝗜𝗢𝗡
 ▢ 𝗕𝗢𝗧𝗡𝗔𝗠𝗘: RzkyNT
 ▢ 𝗩𝗘𝗥𝗦𝗜𝗢𝗡: 𝟰.𝟬.𝟬
 ▢ 𝗕𝗢𝗧𝗠𝗢𝗗𝗘: ${sock.public ? "Public" : "Self"}
 ▢ 𝗗𝗘𝗩𝗘𝗟𝗢𝗣𝗘𝗥: RzkyNT

 ➢ 𝗧𝗢𝗣 𝗚𝗔𝗡𝗜𝗘𝗥 𝗠𝗘𝗡𝗨
- .done
- .proses
- .installpanel
- .pushkontak2

➢ 𝗢𝗧𝗢𝗠𝗔𝗧𝗜𝗦 𝗠𝗘𝗡𝗨
- .autojpmch on/off
- .setjpmch
- .delsetjpmch
- .autojpm on/off
- .setjpm
- .delsetjpm
- .autojoingrup on/off

➢ 𝗠𝗔𝗜𝗡 𝗠𝗘𝗡𝗨
- .ai
- .pinterest
- .listidgrup
- .ssweb
- .emojimix
- .swtaggc
- .brat
- .bratvid (No support Emoji)
- .tourl
- .tourl2
- .sticker
- .cekidch
- .paustad
- .iqc
- .hd
- .hdvid

➢ 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗 𝗠𝗘𝗡𝗨 
- .alldown (Semua media) 
- .mediafire
- .tiktok
- .tiktok2
- .play
- .ytmp3
- .ytmp4

➢ 𝗚𝗥𝗨𝗣 𝗠𝗘𝗡𝗨
- .antilink
- .antilink2
- .welcome
- .statusgrup
- .hidetag
- .kick
- .open
- .close

➢ 𝗦𝗧𝗢𝗥𝗘 𝗠𝗘𝗡𝗨
- .pushkontak
- .pushkontak2
- .savekontak
- .stoppush
- .setjeda
- .savenomor
- .jpm
- .jpmht
- .jpmch
- .stopjpm
- .payment
- .proses
- .done

➢ 𝗣𝗔𝗡𝗘𝗟 𝗠𝗘𝗡𝗨
- .addgrupreseller
- .delgrupreseller
- .listgrupreseller
- .addseller
- .delseller
- .listseller
- .1gb-unlimited
- .delpanel
- .listpanel
- .cadmin
- .deladmin
- .listadmin
- .subdomain
- .installpanel
- .startwings
- .setptla
- .setptlc
- .setdomain
- .upapikey

➢ 𝗢𝗪𝗡𝗘𝗥 𝗠𝗘𝗡𝗨
- .delrespon
- .addrespon
- .bljpm
- .delbljpm
- .addowner
- .listowner
- .delowner
- .resetdb
- .upswgc
`;
let msg = await generateWAMessageFromContent(m.chat, {
 viewOnceMessageV2: {
 message: {
 interactiveMessage: {
 header: {
 ...(await prepareWAMessageMedia({ image: { url: global.thumbnail }}, { upload: sock.waUploadToServer })),
hasMediaAttachment: true
 }, 
 body: { text: teks },
 nativeFlowMessage: {
 buttons: [
 {
 name: "cta_url",
 buttonParamsJson: `{"display_text":"Channel WhatsApp","url":"${global.linkChannel}","merchant_url":"${global.linkChannel}"}`
 }
 ], 
 messageParamsJson: `{\"limited_time_offer\":{\"text\":\"${global.namaOwner} - Version 3.0.0\",\"url\":\"${global.linkChannel}\",\"copy_code\":\"1\",\"expiration_time\":0},\"bottom_sheet\":{\"in_thread_buttons_limit\":2,\"divider_indices\":[1,2,3,4,5, 999],\"list_title\":\"1",\"button_title\":\"1\"},\"tap_target_configuration\":{\"title\":\"1\",\"description\":\"${global.namaOwner}\",\"canonical_url\":\"https://shop.example.com/angebot\",\"domain\":\"shop.example.com\",\"button_index\":0}}`
 },
 contextInfo: {
 mentionedJid: [m.sender, global.owner + "@s.whatsapp.net"],
 isForwarded: true, 
businessMessageForwardInfo: { businessOwnerJid: global.owner+"@s.whatsapp.net" }, forwardedNewsletterMessageInfo: { newsletterName: `${global.Dev}`, newsletterJid: global.idChannel }, 
 externalAdReply: {
 sourceUrl: global.linkChannel
 }
 }
 }
 }
 }
}, { userJid: m.sender, quoted: null });
return sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
}
break
case "rzky":
case "allmenu":{
let menu = `
${global.ucapan()}
Halo @${m.sender.split("@")[0]},
▢ Botname : ${global.namaOwner} 
▢ Version : ${global.version}
▢ Mode : ${sock.public ? "Public" : "Self"}
▢ Creator : ${global.Dev}
▢ Website : ${global.linkWebsite}
▢ Runtime : ${runtime(process.uptime())}  
 
➢ 𝗗𝗘𝗣𝗢𝗧 𝗔𝗜𝗥 𝗠𝗘𝗡𝗨 (CRM)
- .daftar (Daftar Pelanggan)
- .order (Pesan Galon)
- .produk (List Harga)
- .statusorder (Cek Status)
- .batalorder (Batalkan)
- .listorder (Admin)
- .antar (Admin)
- .selesai (Admin)
- .listcust (Admin)

➢ 𝗧𝗢𝗣 𝗚𝗔𝗡𝗜𝗘𝗥 𝗠𝗘𝗡𝗨
- .listproduk
- .done
- .proses
- .installpanel
- .pushkontak2

➢ 𝗢𝗧𝗢𝗠𝗔𝗧𝗜𝗦 𝗠𝗘𝗡𝗨
- .autojpmch on/off
- .setjpmch
- .delsetjpmch
- .autojpm on/off
- .setjpm
- .delsetjpm
- .autojoingrup on/off

➢ 𝗠𝗔𝗜𝗡 𝗠𝗘𝗡𝗨
- .ai
- .pinterest
- .listidgrup
- .ssweb
- .emojimix
- .swtaggc
- .brat
- .bratvid (No Support Emoji) 
- .tourl
- .tourl2
- .sticker
- .cekidch
- .paustad
- .iqc
- .hd
- .hdvid

➢ 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗 𝗠𝗘𝗡𝗨 
- .alldown (Semua media) 
- .mediafire
- .tiktok
- .tiktok2
- .play
- .ytmp3
- .ytmp4

➢ 𝗚𝗥𝗨𝗣 𝗠𝗘𝗡𝗨
- .antilink
- .antilink2
- .welcome
- .statusgrup
- .hidetag
- .kick
- .open
- .close

➢ 𝗦𝗧𝗢𝗥𝗘 𝗠𝗘𝗡𝗨
- .pushkontak
- .pushkontak2
- .savekontak
- .stoppush
- .setjeda
- .savenomor
- .jpm
- .jpmht
- .jpmch
- .stopjpm
- .payment
- .proses
- .done

➢ 𝗣𝗔𝗡𝗘𝗟 𝗠𝗘𝗡𝗨
- .addgrupreseller
- .delgrupreseller
- .listgrupreseller
- .addseller
- .delseller
- .listseller
- .1gb-unlimited
- .delpanel
- .listpanel
- .cadmin
- .deladmin
- .listadmin
- .subdomain
- .installpanel
- .startwings
- .setptla
- .setptlc
- .setdomain
- .upapikey

➢ 𝗢𝗪𝗡𝗘𝗥 𝗠𝗘𝗡𝗨
- .delrespon
- .addrespon
- .bljpm
- .delbljpm
- .addowner
- .listowner
- .delowner
- .resetdb
- .upswgc`
// ➤  ｢ *INFORMASI UPDATE APK* ｣ 
// ${global.linkChannel}`
        await sock.sendMessage(m.chat, {
        interactiveMessage: {
            title: menu, 
            footer: global.Dev, 
            thumbnail: global.thumbnail2,
            nativeFlowMessage: {
                messageParamsJson: JSON.stringify({
                    limited_time_offer: {
                        text: "RzkyNT Store V1.0.0",
                        url: global.linkChannel,
                        copy_code: "Expired 3/11/2026",
                        expiration_time: Date.now() * 999
                    },
                    bottom_sheet: {
                        in_thread_buttons_limit: 2,
                        divider_indices: [1, 2, 3, 4, 5, 999],
                        list_title: "RzkyNT",
                        button_title: "Select Menu♻️"
                    },
                    tap_target_configuration: {
                        title: "RzkyNT",
                        description: "bomboclard",
                        canonical_url: global.linkChannel,
                        domain: "shop.example.com",
                        button_index: 0
                    }
                }),
                buttons: [
                    {
                        name: "single_select",
                        buttonParamsJson: JSON.stringify({ has_multiple_buttons: true })
                    },
                    {
                        name: "call_permission_request",
                        buttonParamsJson: JSON.stringify({ has_multiple_buttons: true })
                    },
                    {
                        name: "single_select",
                        buttonParamsJson: JSON.stringify({
                            title: "Menu⤵️",
                            sections: [
                                {
                                    title: "RzkyNT",
                                    highlight_label: "label",
                                    rows: [
                                        {
                                            title: "@Saluran WhatsApp", 
                                            description: global.linkSaluran,
                                            id: "row_1"
                                        },
                                        { 
                                            title: "@Whatsapp Developer",
                                            description: global.owner,
                                            id: "row_2"
                                        }
                                    ]
                                }
                            ],
                            has_multiple_buttons: true
                        })
                    },
                    {
                        name: "cta_copy",
                        buttonParamsJson: JSON.stringify({
                            display_text: "Expired 3/11/2025",
                            id: "123456789",
                            copy_code: global.linkChannel
                        })
                    },
                    {
                        name: "quick_reply",
                        buttonParamsJson: JSON.stringify({
                            display_text: "All Menu🔥",
                            id: `.allmenu`
                        })
                    },
                    {
                        name: "quick_reply",
                        buttonParamsJson: JSON.stringify({
                            display_text: "All Menu V2♻️",
                            id: `.allmenuv2`
                        })
                    },
                    {
                        name: "quick_reply",
                        buttonParamsJson: JSON.stringify({
                            display_text: "All Menu Video🎬",
                            id: `.allmenuvid`
                        })
                    },
                    {
                        name: "quick_reply",
                        buttonParamsJson: JSON.stringify({
                            display_text: "Owner 👑",
                            id: `.owner`
                        })
                    },
                    {
                        name: "quick_reply",
                        buttonParamsJson: JSON.stringify({
                            display_text: "Ping 🚀",
                            id: `.ping`
                        })
                    },
                    {
                        name: "quick_reply",
                        buttonParamsJson: JSON.stringify({
                            display_text: "Back To Menu↩️",
                            id: `.menu`
                        })
                    }
                ]
            }
        }
    }, { quoted: quoted.packSticker });
    await sleep(1000)
    sock.sendMessage(m.chat, {
        audio: fs.readFileSync('./amaneofc/amane.mp3'),
        mimetype: 'audio/mp4',
        ptt: true
    }, { quoted: m })
}
break
case "allmenuv2": {
const teks = `
Halo @${m.sender.split("@")[0]}
${global.ucapan()}

╔═══[ 𝐈𝐍𝐅𝐎𝐑𝐌𝐀𝐒𝐈 𝐁𝐎𝐓 ]═══╗
║ 𝐌𝐎𝐃𝐄    : ${sock.public ? " Public" : " Self"}
║ 𝐑𝐔𝐍𝐓𝐈𝐌𝐄 : ${runtime(process.uptime())}
║ 𝐎𝐖𝐍𝐄𝐑   : @${global.owner}
╚══════════════════════╝

➢ 𝗗𝗘𝗣𝗢𝗧 𝗔𝗜𝗥 𝗠𝗘𝗡𝗨 (CRM)
- .daftar (Daftar Pelanggan)
- .order (Pesan Galon)
- .produk (List Harga)
- .statusorder (Cek Status)
- .batalorder (Batalkan)
- .listorder (Admin)
- .antar (Admin)
- .selesai (Admin)
- .listcust (Admin)

➢ 𝗧𝗢𝗣 𝗚𝗔𝗡𝗜𝗘𝗥 𝗠𝗘𝗡𝗨
- .listproduk
- .done
- .proses
- .installpanel
- .pushkontak2

➢ 𝗢𝗧𝗢𝗠𝗔𝗧𝗜𝗦 𝗠𝗘𝗡𝗨
- .autojpmch on/off
- .setjpmch
- .delsetjpmch
- .autojpm on/off
- .setjpm
- .delsetjpm
- .autojoingrup on/off

➢ 𝗠𝗔𝗜𝗡 𝗠𝗘𝗡𝗨
- .ai
- .pinterest
- .listidgrup
- .ssweb
- .emojimix
- .swtaggc
- .brat
- .bratvid (No Support Emoji) 
- .tourl
- .tourl2
- .sticker
- .cekidch
- .paustad
- .iqc
- .hd
- .hdvid

➢ 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗 𝗠𝗘𝗡𝗨 
- .alldown (Semua media) 
- .mediafire
- .tiktok
- .tiktok2
- .play
- .ytmp3
- .ytmp4

➢ 𝗚𝗥𝗨𝗣 𝗠𝗘𝗡𝗨
- .antilink
- .antilink2
- .welcome
- .statusgrup
- .hidetag
- .kick
- .open
- .close

➢ 𝗦𝗧𝗢𝗥𝗘 𝗠𝗘𝗡𝗨
- .pushkontak
- .pushkontak2
- .savekontak
- .stoppush
- .setjeda
- .savenomor
- .jpm
- .jpmht
- .jpmch
- .stopjpm
- .payment
- .proses
- .done

➢ 𝗣𝗔𝗡𝗘𝗟 𝗠𝗘𝗡𝗨
- .addgrupreseller
- .delgrupreseller
- .listgrupreseller
- .addseller
- .delseller
- .listseller
- .1gb-unlimited
- .delpanel
- .listpanel
- .cadmin
- .deladmin
- .listadmin
- .subdomain
- .installpanel
- .startwings
- .setptla
- .setptlc
- .setdomain
- .upapikey

➢ 𝗢𝗪𝗡𝗘𝗥 𝗠𝗘𝗡𝗨
- .delproduk
- .addproduk
- .delrespon
- .addrespon
- .bljpm
- .delbljpm
- .addowner
- .listowner
- .delowner
- .resetdb
- .upswgc
`
await sock.sendMessage(m.chat, {
    text: teks,
    contextInfo: {
        mentionedJid: [m.sender, global.owner + "@s.whatsapp.net"],     
        isForwarded: true,    
        forwardedNewsletterMessageInfo: {
      newsletterJid: global.idChannel,
      newsletterName: `Powered by ${global.namaOwner}`,
      serverId: 200
    },
        externalAdReply: {
        thumbnailUrl: global.thumbnail, 
        title: "Mane Store 4.0.0", 
        renderLargerThumbnail: true, 
        mediaType: 1
        }
    }
}, { quoted: null });
}
break;
case "ping": {
const os = require('os');
  const nou = require('node-os-utils');
  const speed = require('performance-now');

  async function getServerInfo(m) {
    const timestamp = speed();
    const tio = await nou.os.oos();
        let tot;
        try {
            tot = await nou.drive.info();
        } catch (err) {
            // node-os-utils drive.info() uses Unix `df` and fails on Windows.
            // Fallback to N/A to avoid throwing and crashing the bot on Windows.
            tot = { usedGb: 'N/A', totalGb: 'N/A', freeGb: 'N/A' };
        }
    const memInfo = await nou.mem.info();
    const totalGB = (memInfo.totalMemMb / 1024).toFixed(2);
    const usedGB = (memInfo.usedMemMb / 1024).toFixed(2);
    const freeGB = (memInfo.freeMemMb / 1024).toFixed(2);
    const cpuCores = os.cpus().length;
    const vpsUptime = runtime(os.uptime());
    const botUptime = runtime(process.uptime());
    const latency = (speed() - timestamp).toFixed(4);
    const respon = `
*-- Server Information*
 • OS Platform: ${nou.os.type()}
 • RAM: ${usedGB}/${totalGB} GB used (${freeGB} GB free)
 • Disk Space: ${tot.usedGb}/${tot.totalGb} GB used
 • CPU Cores: ${cpuCores} Core(s)
 • VPS Uptime: ${vpsUptime}

*-- Bot Information*
 • Response Time: ${latency} sec
 • Bot Uptime: ${botUptime}
 • CPU: ${os.cpus()[0].model}
 • Architecture: ${os.arch()}
 • Hostname: ${os.hostname()}
`;
    return m.reply(respon);
  }

  return getServerInfo(m);
}
break
case "bratvid":
case "neon": {
if (!text) return m.reply(`*Contoh:* ${cmd} hallo aku ${global.namaOwner}!`)
var media = await getBuffer(`https://api.siputzx.my.id/api/m/brat?text=${text}&isAnimated=true&delay=500`)
await sock.sendStimg(m.chat, media, m, {packname: "RzkyNT"})
}
break
case "openai": case "ai": {
    if (args[0] === 'on') {
        if (!isOwner) return m.reply(mess.owner);
        global.db.settings.ai_chat = true;
        return m.reply("✅ Fitur AI Chatbot telah diaktifkan.");
    }
    if (args[0] === 'off') {
        if (!isOwner) return m.reply(mess.owner);
        global.db.settings.ai_chat = false;
        return m.reply("🔴 Fitur AI Chatbot telah dinonaktifkan.");
    }
    if (!text) return m.reply(`*Contoh :* ${cmd} info pesanan saya`);
    
    const systemPrompt = "Anda adalah asisten AI untuk Depot Minhaqua. \n" +
        "Jika user bertanya soal status pesanan atau cek order, tambahkan teks '[BUTTON:CEK_ORDER]' di akhir respon Anda.\n" +
        "Jika user ingin membeli/memesan galon/air, tetapi tanpa menyebutkan spesifik angka tambahkan '[BUTTON:ORDER]' di akhir respon.\n" +
        "Jika user minta daftar harga/produk, tambahkan '[BUTTON:LIST_PRODUK]' di akhir respon.\n" +
        "Jawablah dengan sopan dan singkat.";

    const result = await aiChat(systemPrompt, text, "llama3-8b-8192"); // Menggunakan model yang lebih cepat/stabil di Groq jika perlu, atau tetap gpt-oss-120b jika valid
    
    // Parse response for buttons
    let finalBody = result;
    let buttons = [];

    if (result.includes("[BUTTON:CEK_ORDER]")) {
        finalBody = finalBody.replace("[BUTTON:CEK_ORDER]", "").trim();
        buttons.push({
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({
                display_text: "🔍 Cek Pesanan",
                id: ".cekorder"
            })
        });
    }
    
    if (result.includes("[BUTTON:ORDER]")) {
        finalBody = finalBody.replace("[BUTTON:ORDER]", "").trim();
        buttons.push({
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({
                display_text: "🛒 Pesan Sekarang",
                id: ".order"
            })
        });
    }

    if (result.includes("[BUTTON:LIST_PRODUK]")) {
        finalBody = finalBody.replace("[BUTTON:LIST_PRODUK]", "").trim();
        buttons.push({
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({
                display_text: "📋 Daftar Produk",
                id: ".listproduk"
            })
        });
    }

    if (buttons.length > 0) {
        let msg = generateWAMessageFromContent(m.chat, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: {
                        deviceListMetadata: {},
                        deviceListMetadataVersion: 2
                    },
                    interactiveMessage: {
                        body: { text: finalBody },
                        footer: { text: "Depot Minhaqua AI" },
                        nativeFlowMessage: {
                            buttons: buttons,
                            messageParamsJson: JSON.stringify({
                                from_flow: true 
                            })
                        }
                    }
                }
            }
        }, { userJid: m.sender, quoted: m });
        return sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
    }

    return m.reply(finalBody);
}
break
case "play": case "playyt": case "ytplay": {
if (!text) return m.reply(`*Contoh :* ${cmd} lagu sad 30detik`)
const ress = await Yts(text)
if (ress.all.length < 1) return reply("Audio/vidio tidak ditemukan")
await m.reply("Memproses pencarian audio 🔍")
const { title, url, thumbnail, timestamp, author } = ress.all[0]
const result = await youtube.download(url.trim(), 'mp3')
return sock.sendMessage(m.chat, {audio: {url: result.downloadURL}, mimetype: "audio/mpeg", ptt: false, contextInfo: {
externalAdReply: {
title: title, 
body: `Duration: ${timestamp} || Creator: ${author.name}`, 
thumbnailUrl: thumbnail,
renderLargerThumbnail: true, 
mediaType: 1, 
sourceUrl: url
}
}}, { quoted: m })
}
break
case "ytdl": case "ytmp3": {
if (!text) return m.reply(`*Contoh :* ${cmd} link`)
if (!/youtu|https/.test(text)) return m.reply(`Link Tautan Tidak Valid.`)
const result = await youtube.download(text.trim(), 'mp3')
await sock.sendMessage(m.chat, { audio: { url: result.downloadURL }, mimetype: "audio/mpeg", ptt: false }, { quoted: m })
}
break
case "ytmp4": {
if (!text) return m.reply(`*Contoh :* ${cmd} link`)
if (!/youtu|https/.test(text)) return m.reply(`Link Tautan Tidak Valid.`)
const result = await youtube.download(text.trim(), 'mp4')
await sock.sendMessage(m.chat, { video: { url: result.downloadURL }, caption: "YouTube MP4 Downloader ✅" }, { quoted: m })
}
break
case "hdvid":
case "tohdvid":
case "hdvidio":
case "hdvideo": {
  if (!/video/.test(mime)) 
        return m.reply(`Vidio tidak ditemukan!\nKetik *${cmd}* dengan reply/kirim Vidio`)
  await m.reply(`Memproses Peningkatan Kualitas Vidio ⏳`)
  let media = await m.quoted ? await m.quoted.download() : await m.download()
let video = Math.floor(Math.random() * 100) + 1;
  const inputFilePath = `./input${video}.mp4`;
  fs.writeFileSync(inputFilePath, media)
  const outputFilePath = `./output${video}.mp4`;
  const dir = './';
  if (!fs.existsSync(dir)){
      fs.mkdirSync(dir)
  }

  const ffmpegCommand = `ffmpeg -i ${inputFilePath} -vf "hqdn3d=1.5:1.5:6:6,unsharp=3:3:0.6,eq=brightness=0.05:contrast=1.1:saturation=1.06" -vcodec libx264 -preset slower -crf 22 -acodec copy -movflags +faststart ${outputFilePath}`;

  exec(ffmpegCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`)
      return
    }
    console.log(`stdout: ${stdout}`)
    console.error(`stderr: ${stderr}`)
    sock.sendMessage(m.chat, { caption: `Berhasil HD Vidio ✅`, video: { url: outputFilePath } }, { quoted: m })
    fs.unlinkSync(inputFilePath)
  })
}
break
case "tohd": case "hd": case "remini": {
    if (!/image/.test(mime)) 
        return m.reply(`Foto tidak ditemukan!\nKetik *${cmd}* dengan reply/kirim foto`)
    try {
       const image = m.quoted ? await m.quoted.download() : await m.download()
       const ImageUrl = await remini(image, "upscale")
       await sock.sendMessage(m.chat, { image: { url: ImageUrl }, caption: "Berhasil HD Foto ✅" }, { quoted: m })
    } catch (err) {
        console.error("Remini Error:", err);
        m.reply("Terjadi kesalahan saat remini Foto.");
    }
}
break;
case "pinterest":
case "pin": {
    if (!text) return m.reply(`*Contoh penggunaan:*\n${cmd} gojo\n\nCari gambar dari Pinterest menggunakan APIKEY.`)

    try {
        const query = text.trim()
        await m.reply(`🔍 Mencari gambar *${query}* di Pinterest...`)

        const apiUrl = `https://sitesfyxzpedia-api.vercel.app/search/pinterest?apikey=Fyxz&q=${encodeURIComponent(query)}`
        const res = await axios.get(apiUrl)
        const data = res.data

        if (!data.result || data.result.length === 0) {
            return m.reply(`❌ Tidak ditemukan gambar untuk kata kunci *${query}*.`)
        }

        // Ambil gambar random dari hasil API
        const randomImg = data.result[Math.floor(Math.random() * data.result.length)]

        await sock.sendMessage(m.chat, {
            image: { url: randomImg },
            caption: `✨ *Hasil Pencarian Pinterest*\n\n🔎 Kata Kunci: *${query}*\n📸 Sumber: Pinterest`
        }, { quoted: m })

    } catch (err) {
        console.error("Pinterest Error:", err)
        m.reply("❌ Gagal mencari gambar di Pinterest.\nCoba lagi nanti atau periksa API.")
    }
}
break;
case "tt": case "tiktok": case "ttdl": {
if (!text) return m.reply(`*Contoh :* ${cmd} link`)
if (!text.startsWith("https://")) return m.reply(`*Contoh :* ${cmd} link`)
const res = await tiktok(`${text}`)
if (!res.data) return m.reply("Error! result tidak ditemukan")
if (res.data.images && res.data.images.length !== 0) {
let album = []
for (let i of res.data.images) {
album.push({ image: { url: i }, caption: "Tiktok Slide Downloader ✅" })
}
await sock.sendMessage(m.chat, {album: album}, {quoted: m})
} else {
await sock.sendMessage(m.chat, {video: {url: res.data.hdplay || res.result.data.play}, caption: "Tiktok Downloader ✅"}, { quoted: m})
}
if (res.data.music) {
await sock.sendMessage(m.chat, {audio: {url: res.data.music}, mimetype: "audio/mpeg", ptt: false}, {quoted: m})
}
}
break
case 'addcase': {
          if (!isOwner) return m.reply(mess.owner);
          if (!text) return m.reply(`Contoh: ${cmd}case`);
          const namaFile = path.join(__dirname, 'Amane.js');
          const caseBaru = `${text}\n\n`;
          const tambahCase = (data, caseBaru) => {
            const posisiDefault = data.lastIndexOf("default:");
            if (posisiDefault !== -1) {
              const kodeBaruLengkap = data.slice(0, posisiDefault) + caseBaru + data.slice(posisiDefault);
              return {
                success: true,
                kodeBaruLengkap
              };
            } else {
              return {
                success: false,
                message: "Tidak dapat menemukan case default di dalam file!"
              };
            }
          };
          fs.readFile(namaFile, 'utf8', (err, data) => {
            if (err) {
              console.error('Terjadi kesalahan saat membaca file:', err);
              return m.reply(`Terjadi kesalahan saat membaca file: ${err.message}`);
            }
            const result = tambahCase(data, caseBaru);
            if (result.success) {
              fs.writeFile(namaFile, result.kodeBaruLengkap, 'utf8', (err) => {
                if (err) {
                  console.error('Terjadi kesalahan saat menulis file:', err);
                  return m.reply(`Terjadi kesalahan saat menulis file: ${err.message}`);
                } else {
                  console.log('Sukses menambahkan case baru:');
                  console.log(caseBaru);
                  return m.reply('Sukses menambahkan case!');
                }
              });
            } else {
              console.error(result.message);
              return m.reply(result.message);
            }
          });
        }
        break
case "listidgrup": {
    if (!isOwner) return m.reply(mess.owner);

    try {
        const allGroups = await sock.groupFetchAllParticipating();
        const groupIds = Object.keys(allGroups);

        if (groupIds.length < 1) return m.reply("❌ Bot tidak sedang bergabung di grup manapun.");

        let teks = "📋 *Daftar ID Grup yang Bot Ikuti:*\n\n";
        let no = 1;

        for (const id of groupIds) {
            const name = allGroups[id]?.subject || "Tidak diketahui";
            teks += `${no++}. ${name}\n🆔 ${id}\n\n`;
        }

        await m.reply(teks.trim());
    } catch (err) {
        console.error("ListIDGrup Error:", err);
        m.reply("❌ Terjadi kesalahan saat mengambil daftar grup.");
    }
}
break;
case "ssweb": {
    if (!text) return m.reply(`*Contoh penggunaan:*\n${cmd} https://google.com`)
    
    try {
        const targetUrl = text.trim()
        if (!targetUrl.startsWith("http")) return m.reply("❌ URL tidak valid! Harus diawali dengan http:// atau https://")

        await m.reply("⏳ Sedang mengambil screenshot website...")

        const apiUrl = `https://sitesfyxzpedia-api.vercel.app/tools/ssweb?apikey=Fyxz&url=${encodeURIComponent(targetUrl)}`
        const res = await axios.get(apiUrl, { responseType: "arraybuffer" })
        const buffer = Buffer.from(res.data)

        await sock.sendMessage(m.chat, {
            image: buffer,
            caption: `✅ Screenshot berhasil diambil!\n\n🌐 URL: ${targetUrl}\n📸 Powered by ${global.namaOwner} API`
        }, { quoted: m })

    } catch (err) {
        console.error("SSWeb Error:", err)
        m.reply("❌ Gagal mengambil screenshot website.\nPeriksa URL atau coba lagi nanti.")
    }
}
break;
 case "swtaggc": {
    if (!isOwner) return m.reply(mess.owner)
    if (!text) return m.reply(`*Contoh :* ${cmd} 1203630xxxxx@g.us\n\nBisa dengan caption & reply media juga`)

    const groupId = text.trim()
    try {
        const meta = await sock.groupMetadata(groupId)
        const participants = meta.participants.map(p => p.id)
        const caption = `📢 *Status Mention Grup*\n\n👥 Grup: ${meta.subject}\n🆔 ${groupId}\n\n${m.text || ""}`

        let content

        if (/image|video/.test(mime)) {
            const mediaPath = await sock.downloadAndSaveMediaMessage(qmsg)
            const buffer = fs.readFileSync(mediaPath)
            const isVideo = /video/.test(mime)

            content = isVideo
                ? { video: buffer, caption, mentions: participants }
                : { image: buffer, caption, mentions: participants }

            await sock.sendMessage("status@broadcast", content)
            fs.unlinkSync(mediaPath)
        } else {
            content = { text: caption, mentions: participants }
            await sock.sendMessage("status@broadcast", content)
        }

        await m.reply(`✅ Berhasil upload status dengan tag semua member dari grup *${meta.subject}*`)
    } catch (err) {
        console.error("SWTagGC Error:", err)
        m.reply(`❌ Gagal upload status.\nCek kembali ID grup atau coba lagi.\n\nError: ${err.message}`)
    }
}
break;

case 'upstatuswa':
        case 'upstatusgc':
        case 'gcsw':
        case 'upsw':
        case 'upswgc': {
          if (!m.isGroup) return m.reply('⚠️ Command ini hanya bisa digunakan di dalam grup!');
          if (!isOwner) return m.reply(mess.owner);

          try {
            const quotedMsg = m.quoted ? m.quoted : m
            const caption = text || quotedMsg.text || ''
            let payload

            if (/image/.test(mime)) {
              const buffer = await quotedMsg.download()
              payload = {
                groupStatusMessage: {
                  image: buffer,
                  caption: caption || ''
                }
              }
            } else if (/video/.test(mime)) {
              const buffer = await quotedMsg.download()
              payload = {
                groupStatusMessage: {
                  video: buffer,
                  caption: caption || ''
                }
              }
            } else if (/audio/.test(mime)) {
              const buffer = await quotedMsg.download()
              payload = {
                groupStatusMessage: {
                  audio: buffer,
                  mimetype: 'audio/mp4'
                }
              }
            } else if (caption) {
              payload = {
                groupStatusMessage: {
                  text: caption
                }
              }
            } else {
              return await m.reply(
                `Balas media atau tambahkan teks.\n\nContoh:\n${prefix + command} (reply image/video/audio) Halo semuanya!`
              )
            }

            await sock.sendMessage(m.chat, payload, {
              quoted: m
            })
            await m.reply('✅ Status grup berhasil dikirim.')
          } catch (err) {
            console.error('Error saat kirim status grup:', err)
            await m.reply('❌ Terjadi kesalahan saat mengirim status grup.')
          }
        }
        break
        

// 🟣 Tambah Grup Reseller
case 'addgrupreseller': {
    if (!isOwner) return m.reply('❌ Hanya owner yang bisa menambahkan grup reseller!');
    if (!m.isGroup) return m.reply('⚠️ Command ini hanya bisa digunakan di dalam grup!');

    if (grupReseller.includes(m.chat)) return m.reply('✅ Grup ini sudah terdaftar sebagai *Grup Reseller Panel*!');

    grupReseller.push(m.chat);
    saveGrupReseller();

    m.reply('✅ Grup ini berhasil ditambahkan sebagai *Grup Reseller Panel*!');
}
break;

// 🔴 Hapus Grup Reseller
case 'delgrupreseller': {
    if (!isOwner) return m.reply('❌ Hanya owner yang bisa menghapus grup reseller!');
    if (!m.isGroup) return m.reply('⚠️ Command ini hanya bisa digunakan di dalam grup!');

    if (!grupReseller.includes(m.chat)) return m.reply('❌ Grup ini belum terdaftar sebagai grup reseller.');

    grupReseller = grupReseller.filter(g => g !== m.chat);
    saveGrupReseller();

    m.reply('🗑️ Grup ini berhasil dihapus dari daftar *Grup Reseller Panel*.');
}
break;

// 📋 Daftar Grup Reseller
case 'listgrupreseller': {
    if (!isOwner) return m.reply('❌ Hanya owner yang bisa melihat daftar grup reseller!');
    if (grupReseller.length === 0) return m.reply('📭 Belum ada grup reseller yang terdaftar.');

    let teks = '📋 *Daftar Grup Reseller Panel:*\n\n';
    let no = 1;
    for (let id of grupReseller) {
        const name = await sock.groupMetadata(id).then(v => v.subject).catch(() => 'Grup tidak ditemukan');
        teks += `${no++}. ${name}\n🆔 ${id}\n\n`;
    }
    m.reply(teks.trim());
}
break;
//======================//
// CASE SETJPMCH
case "setjpmch": {
    if (!isOwner) return m.reply(mess.owner);
    if (!text.includes("|")) 
        return m.reply(`*Contoh :*\n${cmd} pesan|1jam bisa dengan foto juga\n\nFormat waktu:\n- jam\n- menit`);

    const [messageText, timeText] = text.split("|").map(x => x.trim());
    const intervalMs = parseInterval(timeText);
    if (!messageText || !intervalMs) return m.reply("Format salah atau waktu tidak valid!");

    let isImage = false;
    let imageBase64 = "";

    if (/image/.test(mime)) {
        isImage = true;
        const filePath = await sock.download(qmsg);
        const imgBuffer = fs.readFileSync(filePath);
        imageBase64 = imgBuffer.toString("base64");
        fs.unlinkSync(filePath);
    }

    saveAutoJpmCh({
        active: false,
        intervalMs,
        message: messageText,
        isImage,
        imageBase64
    });

    m.reply(`✅ AutoJPM Channel berhasil disetting\n\nPesan: ${messageText}\nInterval: ${timeText}\n\nGunakan *.autojpmch on* untuk mengaktifkan.`);
    break;
}

// CASE DELSETJPMCH
case "delsetjpmch": {
    if (!isOwner) return m.reply(mess.owner);

    if (fs.existsSync(autojpmChFile)) {
        fs.unlinkSync(autojpmChFile);
        if (global.autoJpmChInterval) {
            clearInterval(global.autoJpmChInterval);
            global.autoJpmChInterval = null;
        }
        m.reply("✅ Setingan AutoJPM Channel berhasil dihapus.");
    } else {
        m.reply("❌ Tidak ada setingan AutoJPM Channel yang tersimpan.");
    }
    break;
}

// CASE AUTOJPMCH
case "autojpmch": {
    if (!isOwner) return m.reply(mess.owner);
    if (!args[0]) return m.reply(`*Contoh :*\n${cmd} on/off`);

    const data = loadAutoJpmCh();
    if (!data || !data.message) return m.reply("❌ Belum ada setingan AutoJPM Channel.\nGunakan *.setjpmch* terlebih dahulu");

    const allChannels = await sock.newsletterFetchAllParticipating();
    const channelIds = Object.keys(allChannels);
    if (channelIds.length < 1) return m.reply("Tidak ada channel yang terhubung.");

    if (args[0].toLowerCase() === "on") {
        if (global.autoJpmChInterval) return m.reply("✅ AutoJPM Channel sudah aktif.");

        const messageContent = data.isImage
            ? { image: Buffer.from(data.imageBase64, "base64"), caption: data.message }
            : { text: data.message };

        global.autoJpmChInterval = setInterval(async () => {
            await sock.sendMessage(global.owner + "@s.whatsapp.net", {
                text: `*[ Notifikasi System ]*\nAutoJPM Channel Sedang Berjalan ⏳\nTotal Channel: ${channelIds.length}`
            });

            let successCount = 0;
            for (const chId of channelIds) {
                try {
                    await sock.sendMessage(chId, messageContent);
                    successCount++;
                } catch (err) {
                    console.error(`Gagal kirim ke channel ${chId}:`, err);
                }
                await sleep(3500);
            }

            await sock.sendMessage(global.owner + "@s.whatsapp.net", {
                text: `*[ Notifikasi System ]*\nAutoJPM Channel Selesai ✅\n${successCount} Channel Berhasil Dikirim Pesan`
            });
        }, data.intervalMs);

        data.active = true;
        saveAutoJpmCh(data);
        m.reply(`✅ AutoJPM Channel diaktifkan. Pesan dikirim setiap ${(data.intervalMs / 1000 / 60)} menit.`);
    } else if (args[0].toLowerCase() === "off") {
        if (global.autoJpmChInterval) {
            clearInterval(global.autoJpmChInterval);
            global.autoJpmChInterval = null;
        }
        data.active = false;
        saveAutoJpmCh(data);
        m.reply("✅ AutoJPM Channel berhasil dimatikan.");
    } else {
        m.reply(`*Contoh :*\n${cmd} on/off`);
    }
    break;
}
case "delsampahbot": {
    if (!isOwner) return m.reply(mess.owner);

    const dir = "./Amane";
    const keepFiles = ["creds.json", "app-state.json", "session.data.json"]; // file penting jangan dihapus

    if (!fs.existsSync(dir)) return m.reply("⚠️ Folder session tidak ditemukan.");

    let deleted = 0;
    let failed = 0;

    function deleteFolderRecursive(path) {
        if (fs.existsSync(path)) {
            fs.readdirSync(path).forEach((file) => {
                const curPath = path + "/" + file;
                try {
                    if (fs.lstatSync(curPath).isDirectory()) {
                        deleteFolderRecursive(curPath);
                        if (!keepFiles.includes(file)) {
                            fs.rmdirSync(curPath, { recursive: true });
                        }
                    } else if (!keepFiles.includes(file)) {
                        fs.unlinkSync(curPath);
                        deleted++;
                    }
                } catch (err) {
                    console.error("❌ Error hapus:", err);
                    failed++;
                }
            });
        }
    }

    deleteFolderRecursive(dir);

    m.reply(`🧹 *Pembersihan Selesai!*\n\n✅ File terhapus: ${deleted}\n⚠️ Gagal hapus: ${failed}\n\nKoneksi bot tetap aman ✨`);
}
break;
 
case "autojoingrup": {
    if (!isOwner) return m.reply(mess.owner)
    if (!text) return m.reply(`*Contoh :* ${cmd} on/off`)

    const filePath = "./data/autojoingrup.json"

    // Buat file otomatis kalau belum ada
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify({ status: false }, null, 2))
    }

    let data = JSON.parse(fs.readFileSync(filePath, "utf8"))

    if (/on/i.test(text)) {
        if (data.status) return m.reply("⚠️ Auto Join Grup sudah aktif.")
        data.status = true
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
        return m.reply("✅ Auto Join Grup berhasil diaktifkan (mode diam).")
    }

    if (/off/i.test(text)) {
        if (!data.status) return m.reply("⚠️ Auto Join Grup sudah nonaktif.")
        data.status = false
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
        return m.reply("✅ Auto Join Grup berhasil dimatikan.")
    }

    return m.reply(`Gunakan format:\n• ${cmd} on\n• ${cmd} off`)
}
break;

case "setjpm": {
    if (!isOwner) return m.reply(mess.owner);
    if (!text.includes("|")) return m.reply(`*Contoh penggunaan :*\nketik ${cmd} pesan|1jam bisa dengan foto juga\n\nFormat waktu yang tersedia:\n- jam\n- menit`);

    const allGroups = await sock.groupFetchAllParticipating();
    const groupIds = Object.keys(allGroups);
    if (groupIds.length < 1) return m.reply("Tidak ada grup WhatsApp yang tersedia.");

    const [messageText, timeText] = text.split("|").map(x => x.trim());
    const intervalMs = parseInterval(timeText);
    if (!messageText || !intervalMs) return m.reply("Format salah atau waktu tidak valid!");

    let isImage = false;
    let imageBase64 = "";

    if (/image/.test(mime)) {
        isImage = true;
        const filePath = await sock.download(qmsg);
        const imgBuffer = fs.readFileSync(filePath);
        imageBase64 = imgBuffer.toString("base64");
        fs.unlinkSync(filePath);
    }

    saveAutoJpm({
        active: false, // belum aktif langsung
        intervalMs,
        message: messageText,
        isImage,
        imageBase64
    });

    m.reply(`✅ AutoJPM Grup berhasil disetting\n\nPesan: ${messageText}\nInterval: ${timeText}\n\nGunakan *.autojpm on* untuk mengaktifkan.`);
    break;
}

case "delsetjpm": {
    if (!isOwner) return m.reply(mess.owner);

    if (fs.existsSync(autojpmFile)) {
        fs.unlinkSync(autojpmFile);
        if (global.autoJpmInterval) {
            clearInterval(global.autoJpmInterval);
            global.autoJpmInterval = null;
        }
        m.reply("✅ Setingan AutoJPM Grup berhasil dihapus.");
    } else {
        m.reply("❌ Tidak ada setingan AutoJPM Grup yang tersimpan.");
    }
    break;
}

case "autojpm": {
    if (!isOwner) return m.reply(mess.owner);
    if (!args[0]) return m.reply(`*Contoh penggunaan :*\nketik ${cmd} on/off`);

    const data = loadAutoJpm();
    if (!data || !data.message) return m.reply("❌ Belum ada setingan AutoJPM Grup.\nGunakan *.setjpm*");

    const allGroups = await sock.groupFetchAllParticipating();
    const groupIds = Object.keys(allGroups);

    if (args[0].toLowerCase() === "on") {
        if (global.autoJpmInterval) return m.reply("✅ AutoJPM Grup sudah aktif.");

        const messageContent = data.isImage
            ? { image: Buffer.from(data.imageBase64, "base64"), caption: data.message }
            : { text: data.message };

        global.autoJpmInterval = setInterval(async () => {
            await sock.sendMessage(global.owner + "@s.whatsapp.net", { text: `*[ Notifikasi System ]*\nAutojpm Grup Sedang Berjalan ⏳\n\nTotal Grup : ${groupIds.length}` });

            let successCount = 0;
            for (const groupId of groupIds) {
                if (global.BlJpm?.includes(groupId)) continue; // blacklist jika ada
                try {
                    await sock.sendMessage(groupId, messageContent, { quoted: FakeChannel });
                    successCount++;
                } catch (err) {
                    console.error(`Gagal kirim ke grup ${groupId}:`, err);
                }
                await sleep(3500);
            }

            await sock.sendMessage(global.owner + "@s.whatsapp.net", { text: `*[ Notifikasi System ]*\nAutojpm Grup Telah Selesai ✅\n\n${successCount} Grup Berhasil Dikirim Pesan` });
        }, data.intervalMs);

        data.active = true;
        saveAutoJpm(data);

        m.reply(`✅ AutoJPM Grup diaktifkan. Pesan dikirim setiap ${(data.intervalMs / 1000 / 60)} menit.`);
    } else if (args[0].toLowerCase() === "off") {
        if (global.autoJpmInterval) {
            clearInterval(global.autoJpmInterval);
            global.autoJpmInterval = null;
        }
        data.active = false;
        saveAutoJpm(data);
        m.reply("✅ AutoJPM Grup berhasil dimatikan.");
    } else {
        m.reply(`*Contoh penggunaan :*\nketik ${cmd} on/off`);
    }
    break;
}

case "addrespon": {
if (!isOwner) return m.reply(mess.owner)
if (!text || !text.includes("|")) return m.reply(`*Contoh :* ${cmd} trigger|response`)
let [ id, response ] = text.split("|")
id = id.toLowerCase()
const res = db.settings.respon
if (res.find(v => v.id.toLowerCase() == id)) return m.reply(`Cmd ${id} sudah terdaftar dalam listrespon\nGunakan Cmd lain!`)
db.settings.respon.push({
id, 
response
})
return m.reply(`*Sukses Menambah Listrespon ✅*

- Trigger: ${id}
- Response: ${response}
`)
}
break

case "listrespon": {
if (db.settings.respon.length < 1) return m.reply("Tidak ada listrespon.")
let teks = ""
for (let i of db.settings.respon) {
teks += `\n- *Trigger:* ${i.id}
- *Response:* ${i.response}\n`
}
return m.reply(teks)
}
break

case "delrespon": {
if (!isOwner) return m.reply(mess.owner)
if (!text) return m.reply(`*Contoh :* ${cmd} triggernya`)
if (text.toLowerCase() == "all") {
db.settings.respon = []
return m.reply(`Berhasil menghapus semua Cmd ListRespon ✅`)
}
let res = db.settings.respon.find(v => v.id == text.toLowerCase())
if (!res) return m.reply(`Cmd Respon Tidak Ditemukan!\nKetik *.listrespon* Untuk Melihat Semua Cmd ListRespon`)
const posi = db.settings.respon.indexOf(res)
db.settings.respon.splice(posi, 1)
return m.reply(`Berhasil menghapus Cmd List Respon *${text}* ✅`)
}
break

case "bljpm": case "bl": {
if (!isOwner) return m.reply(mess.owner);
let rows = []
const a = await sock.groupFetchAllParticipating()
if (a.length < 1) return m.reply("Tidak ada grup chat.")
const Data = Object.values(a)
let number = 0
for (let u of Data) {
const name = u.subject || "Unknown"
rows.push({
title: name,
description: `ID - ${u.id}`, 
id: `.bljpm-response ${u.id}|${name}`
})
}
await sock.sendMessage(m.chat, {
  buttons: [
    {
    buttonId: 'action',
    buttonText: { displayText: 'ini pesan interactiveMeta' },
    type: 4,
    nativeFlowInfo: {
        name: 'single_select',
        paramsJson: JSON.stringify({
          title: 'Pilih Grup',
          sections: [
            {
              title: `© Powered By ${namaOwner}`,
              rows: rows
            }
          ]
        })
      }
      }
  ],
  headerType: 1,
  viewOnce: true,
  text: `\nPilih Salah Grup Chat\n`
}, { quoted: m })
}
break

case "bljpm-response": {
if (!isOwner) return m.reply(mess.owner)
if (!text || !text.includes("|")) return
const [ id, grupName ] = text.split("|")
if (db.settings.bljpm.includes(id)) return m.reply(`Grup ${grupName} sudah terdaftar dalam Blacklist Jpm`)
db.settings.bljpm.push(id)
return m.reply(`Berhasil Blacklist Grup ${grupName} Dari Jpm`)
}
break


case "delbl":
case "delbljpm": {
    if (!isOwner) return m.reply(mess.owner);

    if (db.settings.bljpm.length < 1) 
        return m.reply("Tidak ada data blacklist grup.");

    const groups = await sock.groupFetchAllParticipating();
    const Data = Object.values(groups);

    let rows = [];
    // opsi hapus semua
    rows.push({
        title: "🗑️ Hapus Semua",
        description: "Hapus semua grup dari blacklist",
        id: `.delbl-response all`
    });

    for (let id of db.settings.bljpm) {
        let name = "Unknown";
        // cari nama grup dari daftar grup aktif
        let grup = Data.find(g => g.id === id);
        if (grup) name = grup.subject || "Unknown";

        rows.push({
            title: name,
            description: `ID Grup - ${id}`,
            id: `.delbl-response ${id}|${name}`
        });
    }

    let msg = generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
            message: {
                interactiveMessage: {
                    body: { 
                        text: `Pilih Grup Untuk Dihapus Dari Blacklist\n\nTotal Blacklist: ${db.settings.bljpm.length}` 
                    },
                    nativeFlowMessage: {
                        buttons: [
                            {
                                name: "single_select",
                                buttonParamsJson: JSON.stringify({
                                    title: "Daftar Blacklist Grup",
                                    sections: [
                                        {
                                            title: "Blacklist Terdaftar",
                                            rows: rows
                                        }
                                    ]
                                })
                            }
                        ]
                    }
                }
            }
        }
    }, { userJid: m.sender, quoted: m });

    await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
}
break;

case "delbl-response": {
    if (!isOwner) return m.reply(mess.owner);
    if (!text) return;

    if (text === "all") {
        db.settings.bljpm = [];
        return m.reply("✅ Semua data blacklist grup berhasil dihapus.");
    }

    if (text.includes("|")) {
        const [id, grupName] = text.split("|");
        if (!db.settings.bljpm.includes(id)) 
            return m.reply(`❌ Grup *${grupName}* tidak ada dalam blacklist.`);

        db.settings.bljpm = db.settings.bljpm.filter(g => g !== id);
        return m.reply(`✅ Grup *${grupName}* berhasil dihapus dari blacklist.`);
    }
}
break;

case "payment":
case "pay": {
    let msg = generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
            message: {
                interactiveMessage: {
                    header: {
                    hasMediaAttachment: true, 
                    ...(await prepareWAMessageMedia({ image: { url: global.qris } }, { upload: sock.waUploadToServer })),
                    }, 
                    body: { 
                        text: `*Daftar Payment ${namaOwner} 🔖*`
                    },
                    footer: { 
                        text: "Klik tombol di bawah untuk menyalin nomor e-wallet" 
                    },
                    nativeFlowMessage: {
                        buttons: [
                            { 
                                name: "cta_copy",
                                buttonParamsJson: `{"display_text":"Copy Dana","copy_code":"${global.dana}"}`
                            },
                            { 
                                name: "cta_copy",
                                buttonParamsJson: `{"display_text":"Copy OVO","copy_code":"${global.ovo}"}`
                            },
                            { 
                                name: "cta_copy",
                                buttonParamsJson: `{"display_text":"Copy Gopay","copy_code":"${global.gopay}"}`
                            }
                        ]
                    }
                }
            }
        }
    }, { userJid: m.sender, quoted: m });

    await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
}
break;

case "cekidch":
case "idch": {
    if (!text) return m.reply(`*Contoh :* ${cmd} link channel`); 
    if (!text.includes("https://whatsapp.com/channel/")) {
        return m.reply("Link channel tidak valid");
    }

    let result = text.split("https://whatsapp.com/channel/")[1];
    let res = await sock.newsletterMetadata("invite", result);
    let teks = `*Channel ID Ditemukan ✅*\n\n- ${res.id}`;

    let msg = generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
            message: {
                interactiveMessage: {
                    body: { text: teks },
                    nativeFlowMessage: {
                        buttons: [
                            { 
                                name: "cta_copy",
                                buttonParamsJson: `{"display_text":"Copy Channel ID","copy_code":"${res.id}"}`
                            }
                        ]
                    }
                }
            }
        }
    }, { userJid: m.sender, quoted: m });

    await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
}
break;

case "status":
case "statusgrup": {
    if (!isOwner) return m.reply(mess.owner);
    if (!m.isGroup) return m.reply(mess.group);
    const group = global.db.groups[m.chat] || {};
    const teks = `
- Antilink  : ${group.antilink ? "✅" : "❌"}
- Antilink2 : ${group.antilink2 ? "✅" : "❌"}
- Welcome   : ${global.db.settings.welcome ? "✅" : "❌"}

_✅ = Aktif_
_❌ = Tidak Aktif_
`;
    return m.reply(teks);
}
break;

case "done":
case "don":
case "proses":
case "ps": {
    if (!isOwner) return m.reply(mess.owner);
    if (!text) return m.reply(`📦 *Contoh:* ${cmd} Panel 2GB`);

    // Pilih teks status otomatis
    const status = /done|don/.test(command)
        ? "✅ *Pesanan Selesai!*"
        : "💰 *Pembayaran Diterima!*";

    // Teks struk rapi
    const teks = `
${status}

🛍️ *Produk:* ${text}
📅 *Tanggal:* ${global.tanggal(Date.now())}

📦 *Terima kasih sudah bertransaksi di Fyxz Store!*
Semoga puas dengan layanan kami 🙏

📢 *Cek testimoni & info terbaru:*
${global.linkChannel || "-"}

👥 *Gabung komunitas reseller:*
https://chat.whatsapp.com/J2Bau7vaI6t7l24t8gN2zr?mode=ems_copy_t
`.trim();

    // Kirim format tombol interaktif modern
    const msg = generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
            message: {
                interactiveMessage: {
                    body: { text: teks },
                    nativeFlowMessage: {
                        buttons: [
                            {
                                name: "cta_url",
                                buttonParamsJson: `{"display_text":"📺 Channel Testimoni","url":"${global.linkChannel}"}`
                            },
                            {
                                name: "cta_url",
                                buttonParamsJson: `{"display_text":"💬 Grup Reseller","url":"${global.linkGrup}"}`
                            }
                        ]
                    },
                    contextInfo: {
                        isForwarded: true
                    }
                }
            }
        }
    }, {});

    await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
}
break;

case "tourl": {
    if (!/image|video|audio|application/.test(mime)) 
        return m.reply(`Media tidak ditemukan!\nKetik *${cmd}* dengan reply/kirim media`)

    const FormData = require('form-data');
    const { fromBuffer } = require('file-type');    

    async function dt(buffer) {
        const fetchModule = await import('node-fetch');
        const fetch = fetchModule.default;
        let { ext } = await fromBuffer(buffer);
        let bodyForm = new FormData();
        bodyForm.append("fileToUpload", buffer, "file." + ext);
        bodyForm.append("reqtype", "fileupload");
        let res = await fetch("https://catbox.moe/user/api.php", {
            method: "POST",
            body: bodyForm,
        });
        let data = await res.text();
        return data;
    }

    let aa = m.quoted ? await m.quoted.download() : await m.download();
    let dd = await dt(aa);

    // bikin button copy url
    let msg = generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
            message: {
                interactiveMessage: {
                    body: { text: `✅ Media berhasil diupload!\n\nURL: ${dd}` },
                    nativeFlowMessage: {
                        buttons: [
                            { 
                                name: "cta_copy", 
                                buttonParamsJson: `{"display_text":"Copy URL","copy_code":"${dd}"}`
                            }
                        ]
                    }
                }
            }
        }
    }, { userJid: m.sender, quoted: m });

    await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
}
break;

case "tourl2": {
    if (!/image/.test(mime)) 
        return m.reply(`Media tidak ditemukan!\nKetik *${cmd}* dengan reply/kirim foto`)
    try {
        const { ImageUploadService } = require('node-upload-images');
        let mediaPath = await sock.downloadAndSaveMediaMessage(qmsg);
        const service = new ImageUploadService('pixhost.to');
        let buffer = fs.readFileSync(mediaPath);
        let { directLink } = await service.uploadFromBinary(buffer, 'skyzo.png');
        await fs.unlinkSync(mediaPath);

        // button copy url
        let msg = generateWAMessageFromContent(m.chat, {
            viewOnceMessage: {
                message: {
                    interactiveMessage: {
                        body: { text: `✅ Foto berhasil diupload!\n\nURL: ${directLink}` },
                        nativeFlowMessage: {
                            buttons: [
                                { 
                                    name: "cta_copy", 
                                    buttonParamsJson: `{"display_text":"Copy URL","copy_code":"${directLink}"}`
                                }
                            ]
                        }
                    }
                }
            }
        }, { userJid: m.sender, quoted: m });

        await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });

    } catch (err) {
        console.error("Tourl Error:", err);
        m.reply("Terjadi kesalahan saat mengubah media menjadi URL.");
    }
}
break;

case "backupsc":
case "bck":
case "backup": {
    if (m.sender.split("@")[0] !== global.owner)
        return m.reply(mess.owner);
    try {        
        const tmpDir = "./Tmp";
        if (fs.existsSync(tmpDir)) {
            const files = fs.readdirSync(tmpDir).filter(f => !f.endsWith(".js"));
            for (let file of files) {
                fs.unlinkSync(`${tmpDir}/${file}`);
            }
        }
        await m.reply("Processing Backup Script . .");        
        const name = `backup-manestore`; 
        const exclude = ["node_modules", "Amane", "ConnectSession", "session", "package-lock.json", "yarn.lock", ".npm", ".cache"];
        const filesToZip = fs.readdirSync(".").filter(f => !exclude.includes(f) && f !== "");

        if (!filesToZip.length) return m.reply("Tidak ada file yang dapat di-backup.");

        execSync(`zip -r ${name}.zip ${filesToZip.join(" ")}`);

        await sock.sendMessage(m.sender, {
            document: fs.readFileSync(`./${name}.zip`),
            fileName: `${name}.zip`,
            mimetype: "application/zip"
        }, { quoted: m });

        fs.unlinkSync(`./${name}.zip`);

        if (m.chat !== m.sender) m.reply("Script bot berhasil dikirim ke private chat.");
    } catch (err) {
        console.error("Backup Error:", err);
        m.reply("Terjadi kesalahan saat melakukan backup.");
    }
}
break;

case "kick":
case "kik": {
    if (!m.isGroup) return m.reply(mess.group);
    if (!isOwner && !m.isAdmin) return m.reply(mess.admin);
    if (!m.isBotAdmin) return m.reply(mess.botadmin);

    let target;

    if (m.mentionedJid?.[0]) {
        target = m.mentionedJid[0];
    } else if (m.quoted?.sender) {
        target = m.quoted.sender;
    } else if (text) {
        const cleaned = text.replace(/[^0-9]/g, "");
        if (cleaned) target = cleaned + "@s.whatsapp.net";
    }

    if (!target) return m.reply(`*Contoh :* .kick @tag/6283XXX`);

    try {
        await sock.groupParticipantsUpdate(m.chat, [target], "remove");
        return sock.sendMessage(m.chat, {
            text: `✅ Berhasil mengeluarkan @${target.split("@")[0]}`,
            mentions: [target]
        }, { quoted: m });
    } catch (err) {
        console.error("Kick error:", err);
        return m.reply("Gagal mengeluarkan anggota. Coba lagi atau cek hak akses bot.");
    }
}
break;

case "closegc":
case "close":
case "opengc":
case "open": {
    if (!m.isGroup) return m.reply(mess.group);
    if (!isOwner && !m.isAdmin) return m.reply(mess.admin);
    if (!m.isBotAdmin) return m.reply(mess.botadmin);

    try {
        const cmd = command.toLowerCase();

        if (cmd === "open" || cmd === "opengc") {
            await sock.groupSettingUpdate(m.chat, 'not_announcement');
            return m.reply("Grup berhasil dibuka! Sekarang semua anggota dapat mengirim pesan.");
        }

        if (cmd === "close" || cmd === "closegc") {
            await sock.groupSettingUpdate(m.chat, 'announcement');
            return m.reply("Grup berhasil ditutup! Sekarang hanya admin yang dapat mengirim pesan.");
        }

    } catch (error) {
        console.error("Error updating group settings:", error);
        return m.reply("Terjadi kesalahan saat mencoba mengubah pengaturan grup.");
    }
}
break;

case "ht":
case "hidetag": {
    if (!m.isGroup) return m.reply(mess.group);
    if (!isOwner && !m.isAdmin) return m.reply(mess.admin);
    if (!text) return m.reply(`*Contoh :* ${cmd} pesannya`);
    try {
        if (!m.metadata || !m.metadata.participants) return m.reply("Gagal mendapatkan daftar anggota grup. Coba lagi.");
        const members = m.metadata.participants.map(v => v.id.includes("@s.whatsapp.net") ? v.id : v.jid);
        await sock.sendMessage(m.chat, {
            text: text,
            mentions: members
        }, {
            quoted: null
        });
    } catch (error) {
        console.error("Error sending hidetag message:", error);
        return m.reply("Terjadi kesalahan saat mencoba mengirim pesan hidetag.");
    }
}
break;

case "welcome": {
    if (!isOwner && !m.isAdmin) return m.reply(mess.admin);
    if (!text) return m.reply(`*Contoh :* ${cmd} on/off`);
    if (!/on|off/.test(text)) return m.reply(`*Contoh :* ${cmd} on/off`);

    if (text === "on") {
        if (global.db.settings.welcome) 
            return m.reply("Welcome sudah aktif ✅");
        global.db.settings.welcome = true;
        return m.reply("Berhasil menyalakan welcome ✅");
    }

    if (text === "off") {
        if (!global.db.settings.welcome) 
            return m.reply("Welcome sudah tidak aktif ✅");
        global.db.settings.welcome = false;
        return m.reply("Berhasil mematikan welcome ✅");
    }
}
break;

case "antilink": {
    if (!isOwner && !m.isAdmin) return m.reply(mess.admin);
    if (!m.isGroup) return m.reply(mess.group);
    if (!text) return m.reply(`*Contoh :* ${cmd} on/off`);

    let group = global.db.groups[m.chat];
    if (text === "on") {
        if (group.antilink) return m.reply(`Antilink di grup ini sudah aktif!`);
        group.antilink = true;
        group.antilink2 = false;
        return m.reply(`Berhasil menyalakan antilink di grup ini ✅`);
    }

    if (text === "off") {
        if (!group.antilink) return m.reply(`Antilink di grup ini sudah tidak aktif!`);
        group.antilink = false;
        return m.reply(`Berhasil mematikan antilink di grup ini ✅`);
    }
}
break;

case "antilink2": {
    if (!isOwner && !m.isAdmin) return m.reply(mess.admin);
    if (!m.isGroup) return m.reply(mess.group);
    if (!text) return m.reply(`*Contoh :* ${cmd} on/off`);

    let group = global.db.groups[m.chat];
    if (text === "on") {
        if (group.antilink2) return m.reply(`Antilink2 di grup ini sudah aktif!`);
        group.antilink2 = true;
        group.antilink = false;
        return m.reply(`Berhasil menyalakan antilink2 di grup ini ✅`);
    }

    if (text === "off") {
        if (!group.antilink2) return m.reply(`Antilink2 di grup ini sudah tidak aktif!`);
        group.antilink2 = false;
        return m.reply(`Berhasil mematikan antilink2 di grup ini ✅`);
    }
}
break;

case "jpmch": {
    if (!isOwner) return m.reply(mess.owner)
    if (!text) return m.reply(`*Contoh :* ${cmd} pesannya & bisa dengan foto juga`)

    let mediaPath
    const mimeType = mime
    if (/image/.test(mimeType)) {
        mediaPath = await sock.downloadAndSaveMediaMessage(qmsg)
    }
    
    const Channel = await sock.newsletterFetchAllParticipating()
    const channelList = Object.keys(Channel)
    if (!channelList || channelList.length < 1) return m.reply("Channel tidak ditemukan")
    let successCount = 0
    const messageType = mediaPath ? "teks & foto" : "teks"
    const senderChat = m.chat

    const messageContent = mediaPath
        ? { image: await fs.readFileSync(mediaPath), caption: text }
        : { text }
    global.messageJpm = messageContent

    await m.reply(`Memproses JPM ${messageType} ke ${channelList.length} Channel WhatsApp.`)
    global.statusjpm = true

    for (const chId of channelList) {
    if (global.stopjpm) {
        delete global.stopjpm
        delete global.statusjpm
        break
        }
        try {
            await sock.sendMessage(chId, global.messageJpm)
            successCount++
        } catch (err) {
            console.error(`Gagal kirim ke channel ${chId}:`, err)
        }
        await sleep(global.JedaJpm)
    }

    if (mediaPath) await fs.unlinkSync(mediaPath)    
    delete global.statusjpm
    await m.reply(`JPM Channel Telah Selsai ✅\nBerhasil dikirim ke ${successCount} Channel WhatsApp.`)
}
break

case "jasher": case "jpm": case "jaser": {
if (!isOwner) return m.reply(mess.owner)
if (!text) return m.reply(`*Contoh :* ${cmd} pesannya & bisa dengan foto juga`)
    let mediaPath
    const mimeType = mime
    if (/image/.test(mimeType)) {
        mediaPath = await sock.downloadAndSaveMediaMessage(qmsg)
    }
    const allGroups = await sock.groupFetchAllParticipating()
    const groupIds = Object.keys(allGroups)
    let successCount = 0
    const messageContent = mediaPath
        ? { image: await fs.readFileSync(mediaPath), caption: text }
        : { text }
    global.messageJpm = messageContent
    const senderChat = m.chat
    await m.reply(`Memproses ${mediaPath ? "JPM teks & foto" : "JPM teks"} ke ${groupIds.length} grup chat`)
    global.statusjpm = true
    
    for (const groupId of groupIds) {
        if (db.settings.bljpm.includes(groupId)) continue
        if (global.stopjpm) {
        delete global.stopjpm
        delete global.statusjpm
        break
        }
        try {
            await sock.sendMessage(groupId, global.messageJpm, { quoted: FakeChannel })
            successCount++
        } catch (err) {
            console.error(`Gagal kirim ke grup ${groupId}:`, err)
        }
        await sleep(global.JedaJpm)
    }

    if (mediaPath) await fs.unlinkSync(mediaPath)
    delete global.statusjpm
    await sock.sendMessage(senderChat, {
        text: `JPM ${mediaPath ? "teks & foto" : "teks"} berhasil dikirim ke ${successCount} grup.`,
    }, { quoted: m })
}
break

case "jpmht": {
if (!isOwner) return m.reply(mess.owner)
if (!text) return m.reply(`*Contoh :* ${cmd} pesannya & bisa dengan foto juga`)
    let mediaPath
    const mimeType = mime
    if (/image/.test(mimeType)) {
        mediaPath = await sock.downloadAndSaveMediaMessage(qmsg)
    }
    const allGroups = await sock.groupFetchAllParticipating()
    const groupIds = Object.keys(allGroups)
    let successCount = 0
    const messageContent = mediaPath
        ? { image: await fs.readFileSync(mediaPath), caption: text }
        : { text }
    global.messageJpm = messageContent
    const senderChat = m.chat
    await m.reply(`Memproses ${mediaPath ? "JPM teks & foto" : "JPM teks"} hidetag ke ${groupIds.length} grup chat`)
    global.statusjpm = true
    
    for (const groupId of groupIds) {
        if (db.settings.bljpm.includes(groupId)) continue
        if (global.stopjpm) {
        delete global.stopjpm
        delete global.statusjpm
        break
        }
        messageContent.mentions = allGroups[groupId].participants.map(e => e.id)
        try {
            await sock.sendMessage(groupId, global.messageJpm, { quoted: FakeChannel })
            successCount++
        } catch (err) {
            console.error(`Gagal kirim ke grup ${groupId}:`, err)
        }
        await sleep(global.JedaJpm)
    }

    if (mediaPath) await fs.unlinkSync(mediaPath)
    delete global.statusjpm
    await sock.sendMessage(senderChat, {
        text: `JPM ${mediaPath ? "teks & foto" : "teks"} hidetag berhasil dikirim ke ${successCount} grup.`,
    }, { quoted: m })
}
break

case "sticker": case "stiker": case "sgif": case "s": {
if (!/image|video/.test(mime)) return m.reply("Kirim foto dengan caption .sticker")
if (/video/.test(mime)) {
if ((qmsg).seconds > 15) return m.reply("Durasi vidio maksimal 15 detik!")
}
var media = await sock.downloadAndSaveMediaMessage(qmsg)
await sock.sendStimg(m.chat, media, m, {packname: "Amane."})
}
break

case "emojimix": {
    if (!text || !text.includes("+")) {
        return m.reply(`*Contoh penggunaan:*\n${cmd} 😁+😘`)
    }

    try {
        const [emoji1, emoji2] = text.split("+").map(e => e.trim())
        if (!emoji1 || !emoji2) return m.reply("Format salah! Gunakan dua emoji, contoh: 😎+😆")

        await m.reply("⏳ Sedang membuat kombinasi emoji...")

        const apiUrl = `https://sitesfyxzpedia-api.vercel.app/tools/emojimix?apikey=Fyxz&emoji1=${encodeURIComponent(emoji1)}&emoji2=${encodeURIComponent(emoji2)}`
        const response = await axios.get(apiUrl, { responseType: "arraybuffer" })

        const buffer = Buffer.from(response.data)
        await sock.sendStimg(m.chat, buffer, m, {
            packname: "RzkyNT",
            author: "RzkyNT Bot"
        })
    } catch (err) {
        console.error("EmojiMix Error:", err)
        return m.reply("❌ Gagal membuat kombinasi emoji.\nPastikan kamu menggunakan dua emoji valid.")
    }
}
break;
case "brat": {
    if (!text) return m.reply(`📜 *Contoh:* ${cmd} Hallo Aku ${global.namaOwner}!`);

    try {
        const apiUrl = `https://sitesfyxzpedia-api.vercel.app/imagecreator/bratv?apikey=Fyxz&text=${encodeURIComponent(text)}`;
        const media = await getBuffer(apiUrl);

        await sock.sendStimg(m.chat, media, m, {
            packname: "bot.",
            author: "Mane Store V3.0.0"
        });
    } catch (err) {
        console.log("❌ Error di case brat:", err);
        m.reply("⚠️ Gagal membuat sticker, coba lagi nanti ya!");
    }
}
break;

case "public":
case "self": {
    if (!isOwner) return m.reply(mess.owner);
    let path = require.resolve("./setting.js");
    let data = fs.readFileSync(path, "utf-8");

    if (command === "public") {
        global.mode_public = true;
        sock.public = global.mode_public
        let newData = data.replace(/global\.mode_public\s*=\s*(true|false)/, "global.mode_public = true");
        fs.writeFileSync(path, newData, "utf-8");
        return m.reply("✅ Mode berhasil diubah menjadi *Public*");
    }

    if (command === "self") {
        global.mode_public = false;
        sock.public = global.mode_public
        let newData = data.replace(/global\.mode_public\s*=\s*(true|false)/, "global.mode_public = false");
        fs.writeFileSync(path, newData, "utf-8");
        return m.reply("✅ Mode berhasil diubah menjadi *Self*");
    }
}
break;

case "setjeda": {
    if (!isOwner) return m.reply(mess.owner);
    if (!text) return m.reply(`*Contoh :*\n${cmd} push 5000\n${cmd} jpm 6000\n\nKeterangan format waktu:\n1 detik = 1000\n\nJeda waktu saat ini:\nJeda Pushkontak > ${global.JedaPushkontak}\nJeda JPM > ${global.JedaJpm}`);

    let args = text.split(" ");
    if (args.length < 2) return m.reply(`*Contoh :*\n${cmd} push 5000\n${cmd} jpm 6000\n\nKeterangan format waktu:\n1 detik = 1000\n\nJeda waktu saat ini:\nJeda Pushkontak > ${global.JedaPushkontak}\nJeda JPM > ${global.JedaJpm}`);

    let target = args[0].toLowerCase(); // push / jpm
    let value = args[1];

    if (isNaN(value)) return m.reply("Harus berupa angka!");
    let jeda = parseInt(value);

    let fs = require("fs");
    let path = require.resolve("./setting.js");
    let data = fs.readFileSync(path, "utf-8");

    if (target === "push") {
        let newData = data.replace(/global\.JedaPushkontak\s*=\s*\d+/, `global.JedaPushkontak = ${jeda}`);
        fs.writeFileSync(path, newData, "utf-8");
        global.JedaPushkontak = jeda;
        return m.reply(`✅ Berhasil mengubah *Jeda Push Kontak* menjadi *${jeda}* ms`);
    } 
    
    if (target === "jpm") {
        let newData = data.replace(/global\.JedaJpm\s*=\s*\d+/, `global.JedaJpm = ${jeda}`);
        fs.writeFileSync(path, newData, "utf-8");
        global.JedaJpm = jeda;
        return m.reply(`✅ Berhasil mengubah *Jeda JPM* menjadi *${jeda}* ms`);
    }

    return m.reply(`Pilihan tidak valid!\nGunakan: *push* atau *jpm*`);
}
break;

case "pushkontak": case "puskontak": {
if (!isOwner) return m.reply(mess.owner)
if (!text) return m.reply(`*Contoh :* ${cmd} pesannya`)
global.textpushkontak = text
let rows = []
const a = await sock.groupFetchAllParticipating()
if (a.length < 1) return m.reply("Tidak ada grup chat.")
const Data = Object.values(a)
let number = 0
for (let u of Data) {
const name = u.subject || "Unknown"
rows.push({
title: name,
description: `Total Member: ${u.participants.length}`, 
id: `.pushkontak-response ${u.id}`
})
}
await sock.sendMessage(m.chat, {
  buttons: [
    {
    buttonId: 'action',
    buttonText: { displayText: 'ini pesan interactiveMeta' },
    type: 4,
    nativeFlowInfo: {
        name: 'single_select',
        paramsJson: JSON.stringify({
          title: 'Pilih Grup',
          sections: [
            {
              title: `© Powered By ${namaOwner}`,
              rows: rows
            }
          ]
        })
      }
      }
  ],
  headerType: 1,
  viewOnce: true,
  text: `\nPilih Target Grup Pushkontak\n`
}, { quoted: m })
}
break

case "pushkontak-response": {
  if (!isOwner) return m.reply(mess.owner)
  if (!global.textpushkontak) return m.reply(`Data teks pushkontak tidak ditemukan!\nSilahkan ketik *.pushkontak* pesannya`);
  const teks = global.textpushkontak
  const jidawal = m.chat
  const data = await sock.groupMetadata(text)
  const halls = data.participants
    .filter(v => v.id.includes("@s.whatsapp.net") ? v.id : v.jid)
    .map(v => v.id.includes("@s.whatsapp.net") ? v.id : v.jid)
    .filter(id => id !== botNumber && id.split("@")[0] !== global.owner); 

  await m.reply(`🚀 Memulai pushkontak ke dalam grup ${data.subject} dengan total member ${halls.length}`);
  
  global.statuspush = true
  
 delete global.textpushkontak
 let count = 0
 
  for (const mem of halls) {
    if (global.stoppush) {
    delete global.stoppush
    delete global.statuspush
    break
    }
    await sock.sendMessage(mem, { text: teks }, { quoted: FakeChannel });
    await global.sleep(global.JedaPushkontak);
    count += 1
  }
  
  delete global.statuspush
  await m.reply(`✅ Sukses pushkontak!\nPesan berhasil dikirim ke *${count}* member.`, jidawal)
}
break

case "pushkontak2": case "puskontak2": {
if (!isOwner) return m.reply(mess.owner)
if (!text || !text.includes("|")) return m.reply(`Masukan pesan & nama kontak\n*Contoh :* ${cmd} pesan|namakontak`)
global.textpushkontak = text.split("|")[0]
let rows = []
const a = await sock.groupFetchAllParticipating()
if (a.length < 1) return m.reply("Tidak ada grup chat.")
const Data = Object.values(a)
let number = 0
for (let u of Data) {
const name = u.subject || "Unknown"
rows.push({
title: name,
description: `Total Member: ${u.participants.length}`, 
id: `.pushkontak-response2 ${u.id}|${text.split("|")[1]}`
})
}
await sock.sendMessage(m.chat, {
  buttons: [
    {
    buttonId: 'action',
    buttonText: { displayText: 'ini pesan interactiveMeta' },
    type: 4,
    nativeFlowInfo: {
        name: 'single_select',
        paramsJson: JSON.stringify({
          title: 'Pilih Grup',
          sections: [
            {
              title: `© Powered By ${namaOwner}`,
              rows: rows
            }
          ]
        })
      }
      }
  ],
  headerType: 1,
  viewOnce: true,
  text: `\nPilih Target Grup PushkontakV2\n`
}, { quoted: m })
}
break

case "pushkontak-response2": {
  if (!isOwner) return m.reply(mess.owner)
  if (!global.textpushkontak) return m.reply(`Data teks pushkontak tidak ditemukan!\nSilahkan ketik *.pushkontak2* pesannya|namakontak`);
  const teks = global.textpushkontak
  const jidawal = m.chat
  const data = await sock.groupMetadata(text.split("|")[0])
  const halls = data.participants
    .filter(v => v.id.includes("@s.whatsapp.net") ? v.id : v.jid)
    .map(v => v.id.includes("@s.whatsapp.net") ? v.id : v.jid)
    .filter(id => id !== botNumber && id.split("@")[0] !== global.owner); 

  await m.reply(`🚀 Memulai pushkontak autosave kontak ke dalam grup ${data.subject} dengan total member ${halls.length}`);
  
  global.statuspush = true
  
 delete global.textpushkontak
 let count = 0
 
  for (const mem of halls) {
    if (global.stoppush) {
    delete global.stoppush
    delete global.statuspush
    break
    }    
    const contactAction = {
        "fullName": `${text.split("|")[1]} #${mem.split("@")[0]}`,
        "lidJid": mem, 
        "saveOnPrimaryAddressbook": true
    };
    await sock.sendMessage(mem, { text: teks }, { quoted: FakeChannel });
    await sock.addOrEditContact(mem, contactAction);
    await global.sleep(global.JedaPushkontak);
    count += 1
  }
  
  delete global.statuspush
  await m.reply(`✅ Sukses pushkontak!\nTotal kontak berhasil disimpan *${count}*`, jidawal)
}
break

case "savenomor":
case "sv":
case "save": {
    if (!isOwner) return m.reply(mess.owner)

    let nomor, nama

    if (m.isGroup) {
        if (!text) return m.reply(`*Contoh penggunaan di grup:*\n${cmd} @tag|nama\natau reply target dengan:\n${cmd} nama`)

        // Jika ada tag
        if (m.mentionedJid[0]) {
            nomor = m.mentionedJid[0]
            nama = text.split("|")[1]?.trim()
            if (!nama) return m.reply(`Harap tulis nama setelah "|"\n*Contoh:* ${cmd} @tag|nama`)
        } 
        // Jika reply
        else if (m.quoted) {
            nomor = m.quoted.sender
            nama = text.trim()
        } 
        // Jika input manual nomor
        else if (/^\d+$/.test(text.split("|")[0])) {
            nomor = text.split("|")[0].replace(/[^0-9]/g, "") + "@s.whatsapp.net"
            nama = text.split("|")[1]?.trim()
            if (!nama) return m.reply(`Harap tulis nama setelah "|"\n*Contoh:* ${cmd} 628xxxx|nama`)
        } 
        else {
            return m.reply(`*Contoh penggunaan di grup:*\n${cmd} @tag|nama\natau reply target dengan:\n${cmd} nama`)
        }
    } else {
        // Private chat hanya nama
        if (!text) return m.reply(`*Contoh penggunaan di private:*\n${cmd} nama`)
        nomor = m.chat
        nama = text.trim()
    }

    const contactAction = {
        "fullName": nama,
        "lidJid": nomor,
        "saveOnPrimaryAddressbook": true
    };

    await sock.addOrEditContact(nomor, contactAction);

    return m.reply(`✅ Berhasil menyimpan kontak

- Nomor: ${nomor.split("@")[0]}
- Nama: ${nama}`)
}
break

case "savekontak": case "svkontak": {
if (!isOwner) return m.reply(mess.owner)
if (!text) return m.reply(`Masukan namakontak\n*Contoh :* ${cmd} ${global.namaOwner}`)
global.namakontak = text
let rows = []
const a = await sock.groupFetchAllParticipating()
if (a.length < 1) return m.reply("Tidak ada grup chat.")
const Data = Object.values(a)
let number = 0 
for (let u of Data) {
const name = u.subject || "Unknown"
rows.push({
title: name,
description: `Total Member: ${u.participants.length}`, 
id: `.savekontak-response ${u.id}`
})
}
await sock.sendMessage(m.chat, {
  buttons: [
    {
    buttonId: 'action',
    buttonText: { displayText: 'ini pesan interactiveMeta' },
    type: 4,
    nativeFlowInfo: {
        name: 'single_select',
        paramsJson: JSON.stringify({
          title: 'Pilih Grup',
          sections: [
            {
              title: `© Powered By ${namaOwner}`,
              rows: rows
            }
          ]
        })
      }
      }
  ],
  headerType: 1,
  viewOnce: true,
  text: `\nPilih Target Grup Savekontak\n`
}, { quoted: m })
}
break

case "savekontak-response": {
  if (!isOwner) return m.reply(mess.owner)
  if (!global.namakontak) return m.reply(`Data nama savekontak tidak ditemukan!\nSilahkan ketik *.savekontak* namakontak`);
  try {
    const res = await sock.groupMetadata(text)
    const halls = res.participants
      .filter(v => v.id.includes("@s.whatsapp.net") ? v.id : v.jid)
      .map(v => v.id.includes("@s.whatsapp.net") ? v.id : v.jid)
      .filter(id => id !== botNumber && id.split("@")[0] !== global.owner)

    if (!halls.length) return m.reply("Tidak ada kontak yang bisa disimpan.")
    let names = text
    const existingContacts = JSON.parse(fs.readFileSync('./data/contacts.json', 'utf8') || '[]')
    const newContacts = [...new Set([...existingContacts, ...halls])]

    fs.writeFileSync('./data/contacts.json', JSON.stringify(newContacts, null, 2))

    // Buat file .vcf
    const vcardContent = newContacts.map(contact => {
      const phone = contact.split("@")[0]
      return [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `FN:${global.namakontak} - ${phone}`,
        `TEL;type=CELL;type=VOICE;waid=${phone}:+${phone}`,
        "END:VCARD",
        ""
      ].join("\n")
    }).join("")

    fs.writeFileSync("./data/contacts.vcf", vcardContent, "utf8")

    // Kirim ke private chat
    if (m.chat !== m.sender) {
      await m.reply(`Berhasil membuat file kontak dari grup ${res.subject}\n\nFile kontak telah dikirim ke private chat\nTotal ${halls.length} kontak`)
    }

    await sock.sendMessage(
      m.sender,
      {
        document: fs.readFileSync("./data/contacts.vcf"),
        fileName: "contacts.vcf",
        caption: `File kontak berhasil dibuat ✅\nTotal ${halls.length} kontak`,
        mimetype: "text/vcard",
      },
      { quoted: m }
    )
    
    delete global.namakontak

    fs.writeFileSync("./data/contacts.json", "[]")
    fs.writeFileSync("./data/contacts.vcf", "")

  } catch (err) {
    m.reply("Terjadi kesalahan saat menyimpan kontak:\n" + err.toString())
  }
}
break

case "stopjpm": {
if (!isOwner) return m.reply(mess.owner)
if (!global.statusjpm) return m.reply("Jpm sedang tidak berjalan!")
global.stopjpm = true
return m.reply("Berhasil menghentikan jpm ✅")
}
break

case "stoppushkontak": case "stoppush": case "stoppus": {
if (!isOwner) return m.reply(mess.owner)
if (!global.statuspush) return m.reply("Pushkontak sedang tidak berjalan!")
global.stoppush = true
return m.reply("Berhasil menghentikan pushkontak ✅")
}
break

case "subdo":
case "subdomain": {
    if (!isOwner) return m.reply(mess.owner);
    if (!text.includes("|")) return m.reply(`*Contoh penggunaan :*
ketik ${cmd} hostname|ipvps`);

    const obj = Object.keys(subdomain);
    if (obj.length < 1) return m.reply("Tidak ada domain yang tersedia.");

    const hostname = text.split("|")[0].toLowerCase();
    const ip = text.split("|")[1];
    const rows = obj.map((domain, index) => ({
        title: `🌐 ${domain}`,
        description: `Result: https://${hostname}.${domain}`,
        id: `.subdomain-response ${index + 1} ${hostname.trim()}|${ip}`
    }));

    await sock.sendMessage(m.chat, {
        buttons: [
            {
                buttonId: 'action',
                buttonText: { displayText: 'ini pesan interactiveMeta' },
                type: 4,
                nativeFlowInfo: {
                    name: 'single_select',
                    paramsJson: JSON.stringify({
                        title: 'Pilih Domain',
                        sections: [
                            {
                                title: `© Powered By ${namaOwner}`,
                                rows: rows
                            }
                        ]
                    })
                }
            }
        ],
        headerType: 1,
        viewOnce: true,
        text: `\nPilih Domain Server Yang Tersedia\nTotal Domain: ${obj.length}\n`
    }, { quoted: m });
}
break;

case "subdomain-response": { 
    if (!isOwner) return m.reply(mess.owner);
    if (!text) return;

    if (!args[0] || isNaN(args[0])) return m.reply("Domain tidak ditemukan!");
    const dom = Object.keys(subdomain);
    const domainIndex = Number(args[0]) - 1;
    if (domainIndex >= dom.length || domainIndex < 0) return m.reply("Domain tidak ditemukan!");

    if (!args[1] || !args[1].includes("|")) return m.reply("Hostname/IP Tidak ditemukan!");

    let tldnya = dom[domainIndex];
    const [host, ip] = args[1].split("|").map(str => str.trim());

    async function subDomain1(host, ip) {
        return new Promise((resolve) => {
            axios.post(
                `https://api.cloudflare.com/client/v4/zones/${subdomain[tldnya].zone}/dns_records`,
                {
                    type: "A",
                    name: `${host.replace(/[^a-z0-9.-]/gi, "")}.${tldnya}`,
                    content: ip.replace(/[^0-9.]/gi, ""),
                    ttl: 3600,
                    priority: 10,
                    proxied: false,
                },
                {
                    headers: {
                        Authorization: `Bearer ${subdomain[tldnya].apitoken}`,
                        "Content-Type": "application/json",
                    },
                }
            ).then(response => {
                let res = response.data;
                if (res.success) {
                    resolve({ success: true, name: res.result?.name, ip: res.result?.content });
                } else {
                    resolve({ success: false, error: "Gagal membuat subdomain." });
                }
            }).catch(error => {
                let errorMsg = error.response?.data?.errors?.[0]?.message || error.message || "Terjadi kesalahan!";
                resolve({ success: false, error: errorMsg });
            });
        });
    }

    const domnode = `node${getRandom("")}.${host}`;
    let panelDomain = "";
    let nodeDomain = "";

    for (let i = 0; i < 2; i++) {
        let subHost = i === 0 ? host.toLowerCase() : domnode;
        try {
            let result = await subDomain1(subHost, ip);
            if (result.success) {
                if (i === 0) panelDomain = result.name;
                else nodeDomain = result.name;
            } else {
                return m.reply(result.error);
            }
        } catch (err) {
            return m.reply("Error: " + err.message);
        }
    }

    let teks = `
*✅ Subdomain Berhasil Dibuat*

- IP: ${ip}
- Panel: ${panelDomain}
- Node: ${nodeDomain}
`;

    let msg = await generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
            message: {
                interactiveMessage: {
                    body: { text: teks },
                    nativeFlowMessage: {
                        buttons: [
                            { 
                                name: "cta_copy",
                                buttonParamsJson: `{"display_text":"Copy Subdomain Panel","copy_code":"${panelDomain}"}`
                            },
                            { 
                                name: "cta_copy",
                                buttonParamsJson: `{"display_text":"Copy Subdomain Node","copy_code":"${nodeDomain}"}`
                            }
                        ]
                    }
                }
            }
        }
    }, { userJid: m.sender, quoted: m });

    await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
}
break;

case "installpanel": {
    if (!isOwner) return m.reply(mess.owner)
    if (!text) return m.reply("\nFormat salah!\n\n*Contoh penggunaan :*\nketik .installpanel ipvps|pwvps|panel.com|node.com|ramserver *(contoh 100000)*");
    
    let vii = text.split("|");
    if (vii.length < 5) return m.reply("\nFormat salah!\n\n*Contoh penggunaan :*\nketik .installpanel ipvps|pwvps|panel.com|node.com|ramserver *(contoh 100000)*");
    
    const ssh2 = require("ssh2");
    const ress = new ssh2.Client();
    const connSettings = {
        host: vii[0],
        port: '22',
        username: 'root',
        password: vii[1]
    };
    
    const jids = m.chat
    const usn = "admin"; 
    const pass = "admin001";
    let usernamePanel = usn;
    let passwordPanel = pass;
    const domainpanel = vii[2];
    const domainnode = vii[3];
    const ramserver = vii[4];
    const deletemysql = `\n`;
    const commandPanel = `bash <(curl -s https://pterodactyl-installer.se)`;
    
    async function instalWings() {
    ress.exec(commandPanel, async (err, stream) => {
        if (err) {
            console.error('Wings installation error:', err);
            m.reply(`Gagal memulai instalasi Wings: ${err.message}`);
            return ress.end();
        }
        
        stream.on('close', async (code, signal) => {
            await InstallNodes()            
        }).on('data', async (data) => {
            const dataStr = data.toString();
            console.log('Wings Install: ' + dataStr);
            
            if (dataStr.includes('Input 0-6')) {
                stream.write('1\n');
            }
            else if (dataStr.includes('(y/N)')) {
                stream.write('y\n');
            }
            else if (dataStr.includes('Enter the panel address (blank for any address)')) {
                stream.write(`${domainpanel}\n`);
            }
            else if (dataStr.includes('Database host username (pterodactyluser)')) {
                stream.write('admin\n');
            }
            else if (dataStr.includes('Database host password')) {
                stream.write('admin\n');
            }
            else if (dataStr.includes('Set the FQDN to use for Let\'s Encrypt (node.example.com)')) {
                stream.write(`${domainnode}\n`);
            }
            else if (dataStr.includes('Enter email address for Let\'s Encrypt')) {
                stream.write('admin@gmail.com\n');
            }
        }).stderr.on('data', async (data) => {
            console.error('Wings Install Error: ' + data);
            m.reply(`Error pada instalasi Wings:\n${data}`);
        });
    });
}

    async function InstallNodes() {
        ress.exec('bash <(curl -s https://raw.githubusercontent.com/SkyzoOffc/Pterodactyl-Theme-Autoinstaller/main/createnode.sh)', async (err, stream) => {
            if (err) throw err;
            
            stream.on('close', async (code, signal) => {
                
    let teks = `
*Install Panel Telah Berhasil ✅*

*Berikut Detail Akun Panel Kamu 📦*

👤 Username : \`${usernamePanel}\`
🔐 Password : \`${passwordPanel}\`
🌐 ${domainpanel}

Silahkan setting allocation & ambil token node di node yang sudah dibuat oleh bot.

*Cara menjalankan wings :*
\`.startwings ipvps|pwvps|tokennode\`
    `;

    let msg = await generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
            message: {
                interactiveMessage: {
                    body: { text: teks },
                    nativeFlowMessage: {
                        buttons: [
                            { 
                                name: "cta_copy",
                                buttonParamsJson: `{"display_text":"Copy Username","copy_code":"${usernamePanel}"}`
                            },
                            { 
                                name: "cta_copy",
                                buttonParamsJson: `{"display_text":"Copy Password","copy_code":"${passwordPanel}"}`
                            },
                            { 
                                name: "cta_url",
                                buttonParamsJson: `{"display_text":"Login Panel","url":"${domainpanel}"}`
                            }
                        ]
                    }, 
                    contextInfo: {
                    isForwarded: true
                    }
                }
            }
        }
    }, {});

    await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
                
                ress.end();
            }).on('data', async (data) => {
                await console.log(data.toString());
                if (data.toString().includes("Masukkan nama lokasi: ")) {
                    stream.write('Singapore\n');
                }
                if (data.toString().includes("Masukkan deskripsi lokasi: ")) {
                    stream.write('Node By Skyzo\n');
                }
                if (data.toString().includes("Masukkan domain: ")) {
                    stream.write(`${domainnode}\n`);
                }
                if (data.toString().includes("Masukkan nama node: ")) {
                    stream.write('Amane\n');
                }
                if (data.toString().includes("Masukkan RAM (dalam MB): ")) {
                    stream.write(`${ramserver}\n`);
                }
                if (data.toString().includes("Masukkan jumlah maksimum disk space (dalam MB): ")) {
                    stream.write(`${ramserver}\n`);
                }
                if (data.toString().includes("Masukkan Locid: ")) {
                    stream.write('1\n');
                }
            }).stderr.on('data', async (data) => {
                console.log('Stderr : ' + data);
                m.reply(`Error pada instalasi Wings: ${data}`);
            });
        });
    }

    async function instalPanel() {
        ress.exec(commandPanel, (err, stream) => {
            if (err) throw err;
            
            stream.on('close', async (code, signal) => {
                await instalWings();
            }).on('data', async (data) => {
                if (data.toString().includes('Input 0-6')) {
                    stream.write('0\n');
                } 
                if (data.toString().includes('(y/N)')) {
                    stream.write('y\n');
                } 
                if (data.toString().includes('Database name (panel)')) {
                    stream.write('\n');
                }
                if (data.toString().includes('Database username (pterodactyl)')) {
                    stream.write('admin\n');
                }
                if (data.toString().includes('Password (press enter to use randomly generated password)')) {
                    stream.write('admin\n');
                } 
                if (data.toString().includes('Select timezone [Europe/Stockholm]')) {
                    stream.write('Asia/Jakarta\n');
                } 
                if (data.toString().includes('Provide the email address that will be used to configure Let\'s Encrypt and Pterodactyl')) {
                    stream.write('admin@gmail.com\n');
                } 
                if (data.toString().includes('Email address for the initial admin account')) {
                    stream.write('admin@gmail.com\n');
                } 
                if (data.toString().includes('Username for the initial admin account')) {
                    stream.write('admin\n');
                } 
                if (data.toString().includes('First name for the initial admin account')) {
                    stream.write('admin\n');
                } 
                if (data.toString().includes('Last name for the initial admin account')) {
                    stream.write('admin\n');
                } 
                if (data.toString().includes('Password for the initial admin account')) {
                    stream.write(`${passwordPanel}\n`);
                } 
                if (data.toString().includes('Set the FQDN of this panel (panel.example.com)')) {
                    stream.write(`${domainpanel}\n`);
                } 
                if (data.toString().includes('Do you want to automatically configure UFW (firewall)')) {
                    stream.write('y\n')
                } 
                if (data.toString().includes('Do you want to automatically configure HTTPS using Let\'s Encrypt? (y/N)')) {
                    stream.write('y\n');
                } 
                if (data.toString().includes('Select the appropriate number [1-2] then [enter] (press \'c\' to cancel)')) {
                    stream.write('1\n');
                } 
                if (data.toString().includes('I agree that this HTTPS request is performed (y/N)')) {
                    stream.write('y\n');
                }
                if (data.toString().includes('Proceed anyways (your install will be broken if you do not know what you are doing)? (y/N)')) {
                    stream.write('y\n');
                } 
                if (data.toString().includes('(yes/no)')) {
                    stream.write('y\n');
                } 
                if (data.toString().includes('Initial configuration completed. Continue with installation? (y/N)')) {
                    stream.write('y\n');
                } 
                if (data.toString().includes('Still assume SSL? (y/N)')) {
                    stream.write('y\n');
                } 
                if (data.toString().includes('Please read the Terms of Service')) {
                    stream.write('y\n');
                }
                if (data.toString().includes('(A)gree/(C)ancel:')) {
                    stream.write('A\n');
                } 
                console.log('Logger: ' + data.toString());
            }).stderr.on('data', (data) => {
                m.reply(`Error Terjadi kesalahan :\n${data}`);
                console.log('STDERR: ' + data);
            });
        });
    }

    ress.on('ready', async () => {
        await m.reply(`*Memproses install server panel 🚀*\n\n` +
                     `*IP Address:* ${vii[0]}\n` +
                     `*Domain Panel:* ${domainpanel}\n\n` +
                     `Mohon tunggu 10-20 menit hingga proses install selesai`);
        
        ress.exec(deletemysql, async (err, stream) => {
            if (err) throw err;
            
            stream.on('close', async (code, signal) => {
                await instalPanel();
            }).on('data', async (data) => {
                await stream.write('\t');
                await stream.write('\n');
                await console.log(data.toString());
            }).stderr.on('data', async (data) => {
                m.reply(`Error Terjadi kesalahan :\n${data}`);
                console.log('Stderr : ' + data);
            });
        });
    });

    ress.on('error', (err) => {
        console.error('SSH Connection Error:', err);
        m.reply(`Gagal terhubung ke server: ${err.message}`);
    });

    ress.connect(connSettings);
}
break

case "startwings":
case "configurewings": {
    if (!isOwner) return m.reply(mess.owner)
    let t = text.split('|');
    if (t.length < 3) return m.reply("\nFormat salah!\n\n*Contoh penggunaan :*\nketik .startwings ipvps|pwvps|token_wings");

    let ipvps = t[0].trim();
    let passwd = t[1].trim();
    let token = t[2].trim();

    const connSettings = {
        host: ipvps,
        port: 22,
        username: 'root',
        password: passwd
    };

    const command = `${token} && systemctl start wings`;

    const ress = new ssh2.Client();

    ress.on('ready', () => {
        ress.exec(command, (err, stream) => {
            if (err) {
                m.reply('Gagal menjalankan perintah di VPS');
                ress.end();
                return;
            }

            stream.on('close', async (code, signal) => {
                await m.reply("Berhasil menjalankan wings node panel pterodactyl ✅");
                ress.end();
            }).on('data', (data) => {
                console.log("STDOUT:", data.toString());
            }).stderr.on('data', (data) => {
                console.log("STDERR:", data.toString());
                // Opsi jika perlu input interaktif
                stream.write("y\n");
                stream.write("systemctl start wings\n");
                m.reply('Terjadi error saat eksekusi:\n' + data.toString());
            });
        });
    }).on('error', (err) => {
        console.log('Connection Error:', err.message);
        m.reply('Gagal terhubung ke VPS: IP atau password salah.');
    }).connect(connSettings);
}
break;


case "1gb": case "2gb": case "3gb": case "4gb": case "5gb": 
case "6gb": case "7gb": case "8gb": case "9gb": case "10gb": 
case "unlimited": case "unli": {
if (!isOwner && !isReseller) {
    if (!m.isGroup || !grupReseller.includes(m.chat)) {
        return m.reply(`⚠️ Fitur ini hanya untuk *grup reseller panel*.\n\n` +
                       `👉 Jika kamu admin grup, minta owner untuk ketik *.addgrupreseller* di grup ini.`);
    }
}
    if (!text) return m.reply(`*Contoh :* ${cmd} username,6283XXX`)

    let nomor, usernem;
    let tek = text.split(",");
    if (tek.length > 1) {
        let [users, nom] = tek.map(t => t.trim());
        if (!users || !nom) return m.reply(`*Contoh :* ${cmd} username,6283XXX`)
        nomor = nom.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
        usernem = users.toLowerCase();
    } else {
        usernem = text.toLowerCase();
        nomor = m.isGroup ? m.sender : m.chat
    }

    try {
        var onWa = await sock.onWhatsApp(nomor.split("@")[0]);
        if (onWa.length < 1) return m.reply("Nomor target tidak terdaftar di WhatsApp!");
    } catch (err) {
        return m.reply("Terjadi kesalahan saat mengecek nomor WhatsApp: " + err.message);
    }

    // Mapping RAM, Disk, dan CPU
    const resourceMap = {
        "1gb": { ram: "1000", disk: "1000", cpu: "40" },
        "2gb": { ram: "2000", disk: "1000", cpu: "60" },
        "3gb": { ram: "3000", disk: "2000", cpu: "80" },
        "4gb": { ram: "4000", disk: "4000", cpu: "200" },
        "5gb": { ram: "5000", disk: "5000", cpu: "210" },
        "6gb": { ram: "6000", disk: "6000", cpu: "220" },
        "7gb": { ram: "7000", disk: "7000", cpu: "230" },
        "8gb": { ram: "8000", disk: "8000", cpu: "240" },
        "9gb": { ram: "9000", disk: "5000", cpu: "270" },
        "10gb": { ram: "10000", disk: "5000", cpu: "300" },
        "unlimited": { ram: "0", disk: "0", cpu: "0" }
    };
    
    let { ram, disk, cpu } = resourceMap[command] || { ram: "0", disk: "0", cpu: "0" };

    let username = usernem.toLowerCase();
    let email = username + "@gmail.com";
    let name = global.capital(username) + " Server";
    let password = username + "001";

    try {
        let f = await fetch(domain + "/api/application/users", {
            method: "POST",
            headers: { "Accept": "application/json", "Content-Type": "application/json", "Authorization": "Bearer " + apikey },
            body: JSON.stringify({ email, username, first_name: name, last_name: "Server", language: "en", password })
        });
        let data = await f.json();
        if (data.errors) return m.reply("Error: " + JSON.stringify(data.errors[0], null, 2));
        let user = data.attributes;

        let f1 = await fetch(domain + `/api/application/nests/${nestid}/eggs/` + egg, {
            method: "GET",
            headers: { "Accept": "application/json", "Content-Type": "application/json", "Authorization": "Bearer " + apikey }
        });
        let data2 = await f1.json();
        let startup_cmd = data2.attributes.startup;

        let f2 = await fetch(domain + "/api/application/servers", {
            method: "POST",
            headers: { "Accept": "application/json", "Content-Type": "application/json", "Authorization": "Bearer " + apikey },
            body: JSON.stringify({
                name,
                description: global.tanggal(Date.now()),
                user: user.id,
                egg: parseInt(egg),
                docker_image: "ghcr.io/parkervcp/yolks:nodejs_20",
                startup: startup_cmd,
                environment: { INST: "npm", USER_UPLOAD: "0", AUTO_UPDATE: "0", CMD_RUN: "npm start" },
                limits: { memory: ram, swap: 0, disk, io: 500, cpu },
                feature_limits: { databases: 5, backups: 5, allocations: 5 },
                deploy: { locations: [parseInt(loc)], dedicated_ip: false, port_range: [] },
            })
        });
        let result = await f2.json();
        if (result.errors) return m.reply("Error: " + JSON.stringify(result.errors[0], null, 2));
        
        let server = result.attributes;
        var orang = nomor
        if (orang !== m.chat) {
        await m.reply(`Berhasil membuat akun panel ✅\ndata akun terkirim ke nomor ${nomor.split("@")[0]}`)
        }

let teks = `
*Behasil membuat panel ✅*

📡 Server ID: ${server.id}
👤 Username: \`${user.username}\`
🔐 Password: \`${password}\`
🗓️ Tanggal Aktivasi: ${global.tanggal(Date.now())}

*Spesifikasi server panel*
- RAM: ${ram == "0" ? "Unlimited" : ram / 1000 + "GB"}
- Disk: ${disk == "0" ? "Unlimited" : disk / 1000 + "GB"}
- CPU: ${cpu == "0" ? "Unlimited" : cpu + "%"}
- Panel: ${global.domain}

*Rules pembelian panel*  
- Masa aktif 30 hari  
- Data bersifat pribadi, mohon disimpan dengan aman  
- Garansi berlaku 15 hari (unli replace)  
- Klaim garansi wajib menyertakan *bukti chat pembelian*
`

let msg = await generateWAMessageFromContent(orang, {
    viewOnceMessage: {
        message: {
            interactiveMessage: {
                body: { text: teks },
                nativeFlowMessage: {
                    buttons: [
                        { 
                            name: "cta_copy",
                            buttonParamsJson: `{"display_text":"Copy Username","copy_code":"${user.username}"}`
                        },
                        { 
                            name: "cta_copy",
                            buttonParamsJson: `{"display_text":"Copy Password","copy_code":"${password}"}`
                        },
                        { 
                            name: "cta_url",
                            buttonParamsJson: `{"display_text":"Open Panel","url":"${global.domain}"}`
                        }
                    ]
                }
            }
        }
    }
}, {});

await sock.relayMessage(orang, msg.message, { messageId: msg.key.id });
    } catch (err) {
        return m.reply("Terjadi kesalahan: " + err.message);
    }
}
break

case "delpanel": {
    if (!isOwner && !isReseller) {
        return m.reply(mess.owner);
    }
    const rows = []
    rows.push({
title: `Hapus Semua`,
description: `Hapus semua server panel`, 
id: `.delpanel-all`
})            
    try {
        const response = await fetch(`${domain}/api/application/servers`, {
            method: "GET",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${apikey}`,
            },
        });

        const result = await response.json();
        const servers = result.data;

        if (!servers || servers.length === 0) {
            return m.reply("Tidak ada server panel!");
        }

        let messageText = `\n*Total server panel :* ${servers.length}\n`

        for (const server of servers) {
            const s = server.attributes;

            const resStatus = await fetch(`${domain}/api/client/servers/${s.uuid.split("-")[0]}/resources`, {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${capikey}`,
                },
            });

            const statusData = await resStatus.json();

            const ram = s.limits.memory === 0
                ? "Unlimited"
                : s.limits.memory >= 1024
                ? `${Math.floor(s.limits.memory / 1024)} GB`
                : `${s.limits.memory} MB`;

            const disk = s.limits.disk === 0
                ? "Unlimited"
                : s.limits.disk >= 1024
                ? `${Math.floor(s.limits.disk / 1024)} GB`
                : `${s.limits.disk} MB`;

            const cpu = s.limits.cpu === 0
                ? "Unlimited"
                : `${s.limits.cpu}%`;
            rows.push({
title: `${s.name} || ID:${s.id}`,
description: `Ram ${ram} || Disk ${disk} || CPU ${cpu}`, 
id: `.delpanel-response ${s.id}`
})            
        }                  
        await sock.sendMessage(m.chat, {
  buttons: [
    {
    buttonId: 'action',
    buttonText: { displayText: 'ini pesan interactiveMeta' },
    type: 4,
    nativeFlowInfo: {
        name: 'single_select',
        paramsJson: JSON.stringify({
          title: 'Pilih Server Panel',
          sections: [
            {
              title: `© Powered By ${namaOwner}`,
              rows: rows
            }
          ]
        })
      }
      }
  ],
  headerType: 1,
  viewOnce: true,
  text: `\nPilih Server Panel Yang Ingin Dihapus\n`
}, { quoted: m })

    } catch (err) {
        console.error("Error listing panel servers:", err);
        m.reply("Terjadi kesalahan saat mengambil data server.");
    }
}
break;

case "delpanel-response": {
    if (!isOwner) return m.reply(mess.owner);
    if (!text) return 
    
    try {
        const serverResponse = await fetch(domain + "/api/application/servers", {
            method: "GET",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": "Bearer " + apikey
            }
        });
        const serverData = await serverResponse.json();
        const servers = serverData.data;
        
        let serverName;
        let serverSection;
        let serverFound = false;
        
        for (const server of servers) {
            const serverAttr = server.attributes;
            
            if (Number(text) === serverAttr.id) {
                serverSection = serverAttr.name.toLowerCase();
                serverName = serverAttr.name;
                serverFound = true;
                
                const deleteServerResponse = await fetch(domain + `/api/application/servers/${serverAttr.id}`, {
                    method: "DELETE",
                    headers: {
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + apikey
                    }
                });
                
                if (!deleteServerResponse.ok) {
                    const errorData = await deleteServerResponse.json();
                    console.error("Gagal menghapus server:", errorData);
                }
                
                break;
            }
        }
        
        if (!serverFound) {
            return m.reply("Gagal menghapus server!\nID server tidak ditemukan");
        }
        
        const userResponse = await fetch(domain + "/api/application/users", {
            method: "GET",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": "Bearer " + apikey
            }
        });
        const userData = await userResponse.json();
        const users = userData.data;
        
        for (const user of users) {
            const userAttr = user.attributes;
            
            if (userAttr.first_name.toLowerCase() === serverSection) {
                const deleteUserResponse = await fetch(domain + `/api/application/users/${userAttr.id}`, {
                    method: "DELETE",
                    headers: {
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + apikey
                    }
                });
                
                if (!deleteUserResponse.ok) {
                    const errorData = await deleteUserResponse.json();
                    console.error("Gagal menghapus user:", errorData);
                }
                
                break;
            }
        }
        
        await m.reply(`*Barhasil Menghapus Sever Panel ✅*\n- ID: ${text}\n- Nama Server: ${capital(serverName)}`);
        
    } catch (error) {
        console.error("Error dalam proses delpanel:", error);
        await m.reply("Terjadi kesalahan saat memproses permintaan");
    }
}
break;

case "delpanel-all": {
if (!isOwner) return m.reply(mess.owner)
await m.reply(`Memproses penghapusan semua user & server panel yang bukan admin`)
try {
const PTERO_URL = global.domain
// Ganti dengan URL panel Pterodactyl
const API_KEY = global.apikey// API Key dengan akses admin

// Konfigurasi headers
const headers = {
  "Authorization": "Bearer " + API_KEY,
  "Content-Type": "application/json",
  "Accept": "application/json",
};

// Fungsi untuk mendapatkan semua user
async function getUsers() {
  try {
    const res = await axios.get(`${PTERO_URL}/api/application/users`, { headers });
    return res.data.data;
  } catch (error) {
    m.reply(JSON.stringify(error.response?.data || error.message, null, 2))
    
    return [];
  }
}

// Fungsi untuk mendapatkan semua server
async function getServers() {
  try {
    const res = await axios.get(`${PTERO_URL}/api/application/servers`, { headers });
    return res.data.data;
  } catch (error) {
    m.reply(JSON.stringify(error.response?.data || error.message, null, 2))
    return [];
  }
}

// Fungsi untuk menghapus server berdasarkan UUID
async function deleteServer(serverUUID) {
  try {
    await axios.delete(`${PTERO_URL}/api/application/servers/${serverUUID}`, { headers });
    console.log(`Server ${serverUUID} berhasil dihapus.`);
  } catch (error) {
    console.error(`Gagal menghapus server ${serverUUID}:`, error.response?.data || error.message);
  }
}

// Fungsi untuk menghapus user berdasarkan ID
async function deleteUser(userID) {
  try {
    await axios.delete(`${PTERO_URL}/api/application/users/${userID}`, { headers });
    console.log(`User ${userID} berhasil dihapus.`);
  } catch (error) {
    console.error(`Gagal menghapus user ${userID}:`, error.response?.data || error.message);
  }
}

// Fungsi utama untuk menghapus semua user & server yang bukan admin
async function deleteNonAdminUsersAndServers() {
  const users = await getUsers();
  const servers = await getServers();
  let totalSrv = 0

  for (const user of users) {
    if (user.attributes.root_admin) {
      console.log(`Lewati admin: ${user.attributes.username}`);
      continue; // Lewati admin
    }

    const userID = user.attributes.id;
    const userEmail = user.attributes.email;

    console.log(`Menghapus user: ${user.attributes.username} (${userEmail})`);

    // Cari server yang dimiliki user ini
    const userServers = servers.filter(srv => srv.attributes.user === userID);

    // Hapus semua server user ini
    for (const server of userServers) {
      await deleteServer(server.attributes.id);
      totalSrv += 1
    }

    // Hapus user setelah semua servernya terhapus
    await deleteUser(userID);
  }
await m.reply(`Berhasil menghapus *${totalSrv} user & server* panel yang bukan admin ✅`)
}

// Jalankan fungsi
return deleteNonAdminUsersAndServers();
} catch (err) {
return m.reply(`${JSON.stringify(err, null, 2)}`)
}
}
break

case "listpanel":
case "listserver": {
    if (!isOwner && !isReseller) {
        return m.reply(`Fitur ini hanya untuk di dalam grup reseller panel`);
    }

    try {
        const response = await fetch(`${domain}/api/application/servers`, {
            method: "GET",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${apikey}`,
            },
        });

        const result = await response.json();
        const servers = result.data;

        if (!servers || servers.length === 0) {
            return m.reply("Tidak ada server panel!");
        }

        let messageText = `\n*Total server panel :* ${servers.length}\n`

        for (const server of servers) {
            const s = server.attributes;

            const resStatus = await fetch(`${domain}/api/client/servers/${s.uuid.split("-")[0]}/resources`, {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${capikey}`,
                },
            });

            const statusData = await resStatus.json();

            const ram = s.limits.memory === 0
                ? "Unlimited"
                : s.limits.memory >= 1024
                ? `${Math.floor(s.limits.memory / 1024)} GB`
                : `${s.limits.memory} MB`;

            const disk = s.limits.disk === 0
                ? "Unlimited"
                : s.limits.disk >= 1024
                ? `${Math.floor(s.limits.disk / 1024)} GB`
                : `${s.limits.disk} MB`;

            const cpu = s.limits.cpu === 0
                ? "Unlimited"
                : `${s.limits.cpu}%`;

            messageText += `
- ID : *${s.id}*
- Nama Server : *${s.name}*
- Ram : *${ram}*
- Disk : *${disk}*
- CPU : *${cpu}*
- Created : *${s.created_at.split("T")[0]}*\n`;
        }                  
        await m.reply(messageText)

    } catch (err) {
        console.error("Error listing panel servers:", err);
        m.reply("Terjadi kesalahan saat mengambil data server.");
    }
}
break;

case "cadmin": {
    if (!isOwner) return m.reply(mess.owner);
    if (!text) return m.reply(`Masukan username & nomor (opsional)\n*contoh:* ${cmd} ${global.namaOwner},628XXX`)
    let nomor, usernem;
    const tek = text.split(",");
    if (tek.length > 1) {
        let [users, nom] = tek;
        if (!users || !nom) return m.reply(`Masukan username & nomor (opsional)\n*contoh:* ${cmd} ${global.namaOwner},628XXX`)

        nomor = nom.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
        usernem = users.toLowerCase();
    } else {
        usernem = text.toLowerCase();
        nomor = m.isGroup ? m.sender : m.chat;
    }

    const onWa = await sock.onWhatsApp(nomor.split("@")[0]);
    if (onWa.length < 1) return m.reply("Nomor target tidak terdaftar di WhatsApp!");

    const username = usernem.toLowerCase();
    const email = `${username}@gmail.com`;
    const name = global.capital(args[0]);
    const password = `${username}001`;

    try {
        const res = await fetch(`${domain}/api/application/users`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${apikey}`
            },
            body: JSON.stringify({
                email,
                username,
                first_name: name,
                last_name: "Admin",
                root_admin: true,
                language: "en",
                password
            })
        });

        const data = await res.json();
        if (data.errors) return m.reply(JSON.stringify(data.errors[0], null, 2));

        const user = data.attributes;
        const orang = nomor;

        if (nomor !== m.chat) {
            await m.reply(`Berhasil membuat akun admin panel ✅\nData akun terkirim ke nomor ${nomor.split("@")[0]}`);
        }

const teks = `
*Berikut membuat admin panel ✅*

📡 Server ID: ${user.id}
👤 Username: \`${user.username}\`
🔐 Password: \`${password}\`
🗓️ Tanggal Aktivasi: ${global.tanggal(Date.now())}
*🌐* ${global.domain}

*Rules pembelian admin panel*  
- Masa aktif 30 hari  
- Data bersifat pribadi, mohon disimpan dengan aman  
- Garansi berlaku 15 hari (1x replace)  
- Klaim garansi wajib menyertakan *bukti chat pembelian*
`;

let msg = generateWAMessageFromContent(orang, {
    viewOnceMessage: {
        message: {
            interactiveMessage: {
                body: { text: teks },
                nativeFlowMessage: {
                    buttons: [
                        { 
                            name: "cta_copy",
                            buttonParamsJson: `{"display_text":"Copy Username","copy_code":"${user.username}"}`
                        },
                        { 
                            name: "cta_copy",
                            buttonParamsJson: `{"display_text":"Copy Password","copy_code":"${password}"}`
                        },
                        { 
                            name: "cta_url",
                            buttonParamsJson: `{"display_text":"Open Panel","url":"${global.domain}"}`
                        }
                    ]
                }
            }
        }
    }
}, {});

await sock.relayMessage(orang, msg.message, { messageId: msg.key.id });
    } catch (err) {
        console.error(err);
        m.reply("Terjadi kesalahan saat membuat akun admin panel.");
    }
}
break;

case "deladmin": {
    if (!isOwner) return m.reply(mess.owner);
    try {
        const res = await fetch(`${domain}/api/application/users`, {
            method: "GET",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${apikey}`
            }
        });
        const rows = []
        const data = await res.json();
        const users = data.data;

        const adminUsers = users.filter(u => u.attributes.root_admin === true);
        if (adminUsers.length < 1) return m.reply("Tidak ada admin panel.");

        let teks = `\n*Total admin panel :* ${adminUsers.length}\n`
        adminUsers.forEach((admin, idx) => {
            teks += `
- ID : *${admin.attributes.id}*
- Nama : *${admin.attributes.first_name}*
- Created : ${admin.attributes.created_at.split("T")[0]}
`;
rows.push({
title: `${admin.attributes.first_name} || ID:${admin.attributes.id}`,
description: `Created At: ${admin.attributes.created_at.split("T")[0]}`, 
id: `.deladmin-response ${admin.attributes.id}`
})            
        });

        await sock.sendMessage(m.chat, {
  buttons: [
    {
    buttonId: 'action',
    buttonText: { displayText: 'ini pesan interactiveMeta' },
    type: 4,
    nativeFlowInfo: {
        name: 'single_select',
        paramsJson: JSON.stringify({
          title: 'Pilih Admin Panel',
          sections: [
            {
              title: `© Powered By ${namaOwner}`,
              rows: rows
            }
          ]
        })
      }
      }
  ],
  headerType: 1,
  viewOnce: true,
  text: `\nPilih Admin Panel Yang Ingin Dihapus\n`
}, { quoted: m })

    } catch (err) {
        console.error(err);
        m.reply("Terjadi kesalahan saat mengambil data admin.");
    }
}
break;

case "deladmin-response": {
    if (!isOwner) return m.reply(mess.owner);
    if (!text) return 
    try {
        const res = await fetch(`${domain}/api/application/users`, {
            method: "GET",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${apikey}`
            }
        });

        const data = await res.json();
        const users = data.data;

        let targetAdmin = users.find(
            (e) => e.attributes.id == args[0] && e.attributes.root_admin === true
        );

        if (!targetAdmin) {
            return m.reply("Gagal menghapus akun!\nID user tidak ditemukan");
        }

        const idadmin = targetAdmin.attributes.id;
        const username = targetAdmin.attributes.username;

        const delRes = await fetch(`${domain}/api/application/users/${idadmin}`, {
            method: "DELETE",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${apikey}`
            }
        });

        if (!delRes.ok) {
            const errData = await delRes.json();
            return m.reply(`Gagal menghapus akun admin!\n${JSON.stringify(errData.errors[0], null, 2)}`);
        }

        await m.reply(`*Berhasil Menghapus Admin Panel ✅*\n- ID: ${text}\n- Nama User: ${global.capital(username)}`);

    } catch (err) {
        console.error(err);
        m.reply("Terjadi kesalahan saat menghapus akun admin.");
    }
}
break;

case "listadmin": {
    if (!isOwner) return m.reply(mess.owner);

    try {
        const res = await fetch(`${domain}/api/application/users`, {
            method: "GET",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${apikey}`
            }
        });

        const data = await res.json();
        const users = data.data;

        const adminUsers = users.filter(u => u.attributes.root_admin === true);
        if (adminUsers.length < 1) return m.reply("Tidak ada admin panel.");

        let teks = `\n*Total admin panel :* ${adminUsers.length}\n`
        adminUsers.forEach((admin, idx) => {
            teks += `
- ID : *${admin.attributes.id}*
- Nama : *${admin.attributes.first_name}*
- Created : ${admin.attributes.created_at.split("T")[0]}
`;
        });

        await m.reply(teks)

    } catch (err) {
        console.error(err);
        m.reply("Terjadi kesalahan saat mengambil data admin.");
    }
}
break;

case "addseller": {
    if (!isOwner) return m.reply(mess.owner);
    if (!text && !m.quoted) return m.reply(`*contoh:* ${cmd} 6283XXX`);

    const input = m.mentionedJid[0] 
        ? m.mentionedJid[0] 
        : m.quoted 
            ? m.quoted.sender 
            : text.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

    const input2 = input.split("@")[0];

    if (input2 === global.owner || global.db.settings.reseller.includes(input) || input === botNumber)
        return m.reply(`Nomor ${input2} sudah menjadi reseller!`);

    global.db.settings.reseller.push(input);
    m.reply(`Berhasil menambah reseller ✅`);
}
break;

case "listseller": {
    const list = global.db.settings.reseller;
    if (!list || list.length < 1) return m.reply("Tidak ada user reseller");

    let teks = `Daftar reseller:\n`;
    for (let i of list) {
        const num = i.split("@")[0];
        teks += `\n• ${num}\n  Tag: @${num}\n`;
    }

    sock.sendMessage(m.chat, { text: teks, mentions: list }, { quoted: m });
}
break;

case "delseller": {
    if (!isOwner) return m.reply(mess.owner);
    if (!m.quoted && !text) return m.reply(`*Contoh :* ${cmd} 6283XXX`);

    const input = m.mentionedJid[0] 
        ? m.mentionedJid[0] 
        : m.quoted 
            ? m.quoted.sender 
            : text.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

    const input2 = input.split("@")[0];

    if (input2 === global.owner || input === botNumber)
        return m.reply(`Tidak bisa menghapus owner!`);

    const list = global.db.settings.reseller;
    if (!list.includes(input))
        return m.reply(`Nomor ${input2} bukan reseller!`);

    list.splice(list.indexOf(input), 1);
    m.reply(`Berhasil menghapus reseller ✅`);
}
break;

case "own": case "owner": {
await sock.sendContact(m.chat, [global.owner], global.namaOwner, "Developer Bot", m)
}
break

case "addowner": case "addown": {
    if (!isOwner) return m.reply(mess.owner);

    const input = m.quoted 
        ? m.quoted.sender 
        : m.mentionedJid[0] 
            ? m.mentionedJid[0] 
            : text 
                ? text.replace(/[^0-9]/g, "") + "@s.whatsapp.net" 
                : null;

    if (!input) return m.reply(`*Contoh penggunaan :*\n${cmd} 6285XXX`);

    const jid = input.split("@")[0];
    const botNumber = sock.user.id.split(":")[0] + "@s.whatsapp.net";

    if (jid == global.owner || input == botNumber) 
        return m.reply(`Nomor ${jid} sudah menjadi ownerbot.`);

    if (global.db.settings.developer.includes(input)) 
        return m.reply(`Nomor ${jid} sudah menjadi ownerbot.`);

    global.db.settings.developer.push(input);
    return m.reply(`Berhasil menambah owner ✅\n- ${jid}`);
}
break;

case "delowner": case "delown": {
    if (!isOwner) return m.reply(mess.owner);

    const input = m.quoted 
        ? m.quoted.sender 
        : m.mentionedJid[0] 
            ? m.mentionedJid[0] 
            : text 
                ? text.replace(/[^0-9]/g, "") + "@s.whatsapp.net" 
                : null;

    if (!input) return m.reply(`*Contoh penggunaan :*\n${cmd} 6285XXX`);

    if (input.toLowerCase() === "all") {
        global.db.settings.developer = [];
        return m.reply("Berhasil menghapus semua owner ✅");
    }

    if (!global.db.settings.developer.includes(input)) 
        return m.reply("Nomor tidak ditemukan!");

    global.db.settings.developer = global.db.settings.developer.filter(i => i !== input);
    return m.reply(`Berhasil menghapus owner ✅\n- ${input.split("@")[0]}`);
}
break;

case "listowner": case "listown": {
    const Own = global.db.settings.developer;
    if (!Own || Own.length < 1) return m.reply("Tidak ada owner tambahan.");

    let teks = "Daftar owner tambahan:\n";
    for (let i of Own) {
        const num = i.split("@")[0];
        teks += `\n- Number: ${num}\n- Tag: @${num}\n`;
    }
    return sock.sendMessage(m.chat, { text: teks, mentions: Own }, { quoted: m });
}
break;
case 'delcase': {

 if (!isOwner) return m.reply(mess.owner);

 if (!text) return m.reply(`Contoh: ${cmd} nama case`);

 const fs = require('fs').promises;

 async function dellCase(filePath, caseNameToRemove) {

 try {

 let data = await fs.readFile(filePath, 'utf8');

 const regex = new RegExp(`case\\s+'${caseNameToRemove}':[\\s\\S]*?break`, 'g');

 const modifiedData = data.replace(regex, '');

 if (data === modifiedData) {

 m.reply('Case tidak ditemukan atau sudah dihapus.');

 return;

 }

 await fs.writeFile(filePath, modifiedData, 'utf8');

 m.reply('Sukses menghapus case!');

 } catch (err) {

 m.reply(`Terjadi kesalahan: ${err.message}`);

 }

 }

 dellCase('./Amane.js', q);

 }

 break
case "resetdb": case "rstdb": {
if (!isOwner) return m.reply(mess.owner)
global.db = {}
return m.reply("Berhasil mereset database ✅")
}
break
// ✨ AUTO RESPON UNTUK LIST PRODUK
if (!body.startsWith(prefix)) {
    const lower = body.toLowerCase().trim();

    // Cek jika user kirim nomor (misal "1" untuk pilih list ke-1)
    if (!isNaN(lower)) {
        const idx = parseInt(lower) - 1;
        if (idx >= 0 && idx < listProduk.length) {
            const found = listProduk[idx];
            try {
                await sock.sendMessage(m.chat, {
                    image: { url: found.url },
                    caption: found.isi
                }, { quoted: m });
            } catch (err) {
                console.error("❌ Error kirim list:", err);
                m.reply("⚠️ Gagal menampilkan list, periksa link gambar!");
            }
        }
        return;
    }

    // Cek jika user ketik nama list langsung
    const found = listProduk.find(v => v.judul.toLowerCase() === lower);
    if (found) {
        try {
            await sock.sendMessage(m.chat, {
                image: { url: found.url },
                caption: found.isi
            }, { quoted: m });
        } catch (err) {
            console.error("❌ Error kirim list:", err);
            m.reply("⚠️ Gagal menampilkan list, periksa link gambar!");
        }
    }
}
case "alldown":
case "downr": {
 if (!text) return m.reply(`Link nya mana?!\nContoh: *${cmd} https://vt.tiktok.com/ZSygRMVNM/*`)

 await m.reply('Waitt! Loading download all download!')

 try {
 const { data } = await axios.post(
 'https://downr.org/.netlify/functions/download',
 { url: text },
 {
 headers: {
 'content-type': 'application/json',
 origin: 'https://downr.org',
 referer: 'https://downr.org/',
 'user-agent': 
 'Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36',
 }
 }
 );

 if (!data || !data.medias || !data.medias.length)
 return m.reply('E-eh? Aku gak nemu medianya nih... apa linknya salah?')

 const video = data.medias.find(v => v.quality === 'hd_no_watermark') || data.medias[0]
 const videoUrl = video.url

 await sock.sendMessage(
 m.chat,
 {
 video: { url: videoUrl },
 caption: `🎬 *${data.title || 'Berhasil kok!'}*\n👤 ${data.author || '-'}\n\nStatus Done✅`,
 mimetype: 'video/mp4',
 jpegThumbnail: data.thumbnail ? await getBuffer(data.thumbnail) : null
 },
 { quoted: m }
 );

 } catch (e) {
 console.error('Error downloader:', e)
 await m.reply(`A-apa?! Ada error nih...\n${e.message || e}`)
 }
}
break

case "paustart2":
case "paustad":
case "pak-ustad2": {
 if (!text) return m.reply(`Contoh: ${cmd} Makan sambil kayang bisa gak pak ustad`)

 try {
 const url = `https://api.taka.my.id/pak-ustadv2?text=${encodeURIComponent(text)}`
 const img = await getBuffer(url)

 await sock.sendMessage(
 m.chat,
 {
 image: img,
 caption: `📿 *Pak Ustad Menjawab*\n\n${text}`
 },
 { quoted: m }
 )

 } catch (err) {
 console.error(err)
 m.reply("❌ Terjadi kesalahan saat membuat gambar pak ustad.")
 }
}
break
case 'mf':
case 'mediafire':
case 'mfdl': {
 try {
 if (!text) return m.reply(`Ugh... Kamu ini nggak bisa baca ya?! >///<\n💢 Contohnya gini:\n${cmd} https://www.mediafire.com/file/...`);
 if (!/mediafire\.com/.test(text)) return m.reply('Hmph~ Itu bukan link MediaFire yang benar, bodoh! 💢');

 // FIX: xreact dihapus agar tidak error
 await sock.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

 await m.reply('Y-ya udah, hmph~ tunggu sebentar ya... Aku *lagi kerja keras* buat ngambil datanya 😳');

 const axios = require('axios');
 const cheerio = await import('cheerio').then(m => m.default || m);

 const res = await axios.get(text, {
 headers: {
 "User-Agent": "Mozilla/5.0",
 "Accept": "text/html,application/xhtml+xml"
 },
 timeout: 30000
 });

 const $ = cheerio.load(res.data);

 let fileName =
 $('.filename').first().text().trim() ||
 $('h1.filename').first().text().trim() ||
 $('title').text().trim() ||
 'file.unknown';

 fileName = decodeURIComponent(fileName).replace(/\s+/g, ' ').trim();

 let fileSize =
 $('.details li span').first().text().trim() ||
 $('li:contains("Size")').text().replace(/Size/i, '').trim() ||
 'Tidak diketahui';

 let downloadLink = $('#downloadButton').attr('href');

 if (!downloadLink) {
 const scrambled = $('#downloadButton').attr('data-scrambled-url');
 if (scrambled) downloadLink = Buffer.from(scrambled, 'base64').toString('ascii');
 }

 if (!downloadLink) {
 return m.reply('A-aku nggak nemu link download-nya! Mungkin... kamu kasih link salah ya, baka! 💢');
 }

 await sock.sendMessage(
 m.chat,
 {
 document: { url: downloadLink },
 mimetype: 'application/octet-stream',
 fileName: fileName,
 caption:
`Ehh?! Nih... aku udah berhasil dapetin file-nya 😳

📦 *MediaFire Downloader*
-------------------------
📄 Nama : ${fileName}
💾 Ukuran : ${fileSize}
🔗 Link : ${text}

Jangan bilang makasih berlebihan ya!! Bukan karena aku perhatian kok!! >///<`
 },
 { quoted: m }
 );

 await sock.sendMessage(m.chat, { react: { text: '💢', key: m.key } });

 } catch (err) {
 console.error(err);

 if (String(err).includes('413')) {
 return m.reply(`Ugh... file-nya kegedean (>300MB) 😣 aku nggak bisa kirim yang segede itu!\n\nIni link aslinya aja deh:\n${text}`);
 }

 m.reply(`A-ada kesalahan... 😖\n${err.message}`);
 }
}
break
case 'reactch':
case 'rch': {
 if (!isOwner) return m.reply(mess.owner);
 if (!text) return m.reply(`Contoh: ${cmd}reactch https://whatsapp.com/channel/xxxx 😂,😮,👍`)


 let [link, emoji] = text.includes('|') ? text.split('|') : text.split(' ')

 if (!link || !emoji) return m.reply(`Format salah!\nContoh:\n${cmd}reactch https://whatsapp.com/channel/xxxx 😂,😮,👍`)

 try {
 const res = await fetch(
 `https://react.whyux-xec.my.id/api/rch?link=${encodeURIComponent(link)}&emoji=${encodeURIComponent(emoji)}`,
 {
 method: "GET",
 headers: {
 "x-api-key": "211b9a4e520a973ba2e18d16d8e4e1ea021f822dd0e3322b46e9dcf72cd8ccb1"
 }
 }
 )

 // ambil mentah
 const raw = await res.text()

 // tampilkan raw di console (supaya tahu hasil asli API)
 console.log("RAW RESP:", raw)

 // coba parse json
 let json
 try {
 json = JSON.parse(raw)
 } catch {
 // API tidak kirim JSON tapi react tetap jalan
 return m.reply(`✅ *React Channel Berhasil!*\n(Non JSON response API)`)
 }

 // API tidak kirim status → kita langsung anggap success
 m.reply(`✅ *React Channel Berhasil!*\n• Link: ${link}\n• Emoji: ${emoji}`)
 
 } catch (e) {
 m.reply(`❌ Error: ${e}`)
 }
}
break

case "setptla": {
 if (!isOwner) return m.reply(mess.owner);
 if (!text) return m.reply(`*Contoh :* ${cmd} apikey_ptla`);
 try {
 global.apikey = text.trim();
 let f = "./setting.js";
 let c = fs.readFileSync(f, "utf8");
 let u = c.replace(/global\.apikey\s*=\s*["'].*?["']/, `global.apikey = "${global.apikey}"`);
 fs.writeFileSync(f, u, "utf8");
 await m.reply(`✅ Apikey panel berhasil diganti!\n${global.apikey}`);
 } catch (err) {
 console.error("Set API Key Error:", err);
 m.reply("Terjadi kesalahan saat mengganti API Key.");
 }
}
break;

case "setptlc": {
 if (!isOwner) return m.reply(mess.owner);
 if (!text) return m.reply(`*Contoh :* ${cmd} apikey_ptlc`);
 try {
 global.capikey = text.trim();
 let f = "./setting.js";
 let c = fs.readFileSync(f, "utf8");
 let u = c.replace(/global\.capikey\s*=\s*["'].*?["']/, `global.capikey = "${global.capikey}"`);
 fs.writeFileSync(f, u, "utf8");
 await m.reply(`✅ Capikey panel berhasil diganti!\n${global.capikey}`);
 } catch (err) {
 console.error("Set CAPiKey Error:", err);
 m.reply("Terjadi kesalahan saat mengganti CAPiKey.");
 }
}
break;

case "setdomain": {
 if (!isOwner) return m.reply(mess.owner);
 if (!text) return m.reply(`*Contoh :* ${cmd} link_panel`);
 try {
 // Hanya ambil domain utama, buang path tambahan
 let input = text.trim();
 let url;
 try {
 url = new URL(input);
 } catch {
 return m.reply("Link domain tidak valid! Pastikan formatnya: https://namadomain.com");
 }
 global.domain = `${url.protocol}//${url.hostname}`;
 
 let f = "./setting.js";
 let c = fs.readFileSync(f, "utf8");
 let u = c.replace(/global\.domain\s*=\s*["'].*?["']/, `global.domain = "${global.domain}"`);
 fs.writeFileSync(f, u, "utf8");
 
 await m.reply(`✅ Domain panel berhasil diganti!\n${global.domain}`);
 } catch (err) {
 console.error("Set Domain Error:", err);
 m.reply("Terjadi kesalahan saat mengganti domain.");
 }
}
break;

case "setthumbnail": case "setthumb": {
 if (!isOwner) return reply(mess.owner)
 if (!/image/.test(mime)) return m.reply(`Kirim gambar dengan caption *${cmd}* untuk mengganti thumbnail menu`);
 const { ImageUploadService } = require('node-upload-images');
 try {
 let mediaPath = m.quoted ? await m.quoted.download() : await m.download()
 const service = new ImageUploadService('pixhost.to');
 let buffer = mediaPath
 let { directLink } = await service.uploadFromBinary(buffer, 'thumbnail.png');
 
 global.thumbnail = directLink;
 let f = "./setting.js";
 let c = fs.readFileSync(f, "utf8");
 let u = c.replace(/global\.thumbnail\s*=\s*["'].*?["']/, `global.thumbnail = "${directLink}"`);
 fs.writeFileSync(f, u, "utf8");
 
 await m.reply(`Thumbnail menu berhasil diganti ✅\nURL: ${directLink}`);
 } catch (err) {
 console.error("Ganti Thumbnail Error:", err);
 m.reply("Terjadi kesalahan saat mengganti thumbnail.");
 }
}
break;

case "listch": case "listchannel": {
if (!isOwner) return m.reply(mess.owner)
let teks = ``
let a = await sock.newsletterFetchAllParticipating()
let gc = Object.values(a)
teks += `\n* *Total channel :* ${gc.length}\n`
for (const u of gc) {
teks += `\n* *ID :* ${u.id}
* *Nama :* ${u.name}
* *Total Pengikut :* ${toRupiah(u.subscribers)}
* *Url :* whatsapp.com/channel/${u.invite}\n`
}
return m.reply(teks)
}
break

case 'upapikey': {
 if (!isOwner) return m.reply("Perintah ini hanya untuk Creator Bot.");
 const text = args.join(" ");
 const parts = text.split(',');
 if (parts.length !== 3) {
 return m.reply("Format salah.\nGunakan: .upapikey domain,ptla,ptlc\n\nContoh:\n.upapikey https://panel.domain.com,ptla_xxx,ptlc_xxx");
 }
 const [newDomain, newPtla, newPtlc] = parts.map(p => p.trim());
 if (!newDomain.startsWith('http')) {
 return m.reply("Peringatan: Format domain tidak valid. Harap gunakan 'http://' atau 'https://'.");
 }
 if (!newPtla.startsWith('ptla_')) {
 return m.reply("Peringatan: API Key (PTLA) tidak valid. Kunci harus diawali dengan 'ptla_'.");
 }
 if (!newPtlc.startsWith('ptlc_')) {
 return m.reply("Peringatan: Client Key (PTLC) tidak valid. Kunci harus diawali dengan 'ptlc_'.");
 }
 global.domain = newDomain;
 global.apikey = newPtla;
 global.capikey = newPtlc;
 const updates = [
 { key: 'domain', value: newDomain },
 { key: 'apikey', value: newPtla },
 { key: 'capikey', value: newPtlc }
 ];
 const success = await updateApiKeys(updates);
 if (success) {
 m.reply("✅ Berhasil memperbarui API Key Server Panel");
 } else {
 m.reply("❌ Gagal memperbarui API Key. Silakan cek konsol untuk error.");
 }
 }
 break;
case 'tiktok2':
case 'tt2':
case 'ttdl2': {
 const axios = require('axios');
 const cheerio = require('cheerio');
 const FormData = require('form-data');
 const moment = require('moment-timezone');
 const { exec } = require('child_process');
 const fs = require('fs');
 const path = require('path');

 async function tiktokV1(query) {
 const encodedParams = new URLSearchParams();
 encodedParams.set('url', query);
 encodedParams.set('hd', '1');

 const { data } = await axios.post('https://tikwm.com/api/', encodedParams, {
 headers: {
 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
 'Cookie': 'current_language=en',
 'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36'
 }
 });
 return data;
 }

 async function tiktokV2(query) {
 const form = new FormData();
 form.append('q', query);

 const { data } = await axios.post('https://savetik.co/api/ajaxSearch', form, {
 headers: {
 ...form.getHeaders(),
 'Accept': '*/*',
 'Origin': 'https://savetik.co',
 'Referer': 'https://savetik.co/en2',
 'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
 'X-Requested-With': 'XMLHttpRequest'
 }
 });

 const rawHtml = data.data;
 const $ = cheerio.load(rawHtml);
 const title = $('.thumbnail .content h3').text().trim();
 const thumbnail = $('.thumbnail .image-tik img').attr('src');
 const video_url = $('video#vid').attr('data-src');

 const slide_images = [];
 $('.photo-list .download-box li').each((_, el) => {
 const imgSrc = $(el).find('.download-items__thumb img').attr('src');
 if (imgSrc) slide_images.push(imgSrc);
 });

 return { title, thumbnail, video_url, slide_images };
 }

 if (!text) return m.reply('Masukkan URL TikTok yang valid.\nContoh: .tiktok https://vt.tiktok.com/xxxxxx');

 await m.reply('Mohon tunggu, sedang memproses dan mengkonversi video...');

 try {
 let res;
 let images = [];

 const dataV1 = await tiktokV1(text);
 if (dataV1?.data) {
 const d = dataV1.data;
 if (Array.isArray(d.images) && d.images.length > 0) {
 images = d.images;
 } else if (Array.isArray(d.image_post) && d.image_post.length > 0) {
 images = d.image_post;
 }
 res = {
 title: d.title,
 region: d.region,
 duration: d.duration,
 create_time: d.create_time,
 play_count: d.play_count,
 digg_count: d.digg_count,
 comment_count: d.comment_count,
 share_count: d.share_count,
 download_count: d.download_count,
 author: {
 unique_id: d.author?.unique_id,
 nickname: d.author?.nickname
 },
 music_info: {
 title: d.music_info?.title,
 author: d.music_info?.author
 },
 cover: d.cover,
 play: d.play,
 hdplay: d.hdplay,
 wmplay: d.wmplay
 };
 }

 const dataV2 = await tiktokV2(text);
 if ((!res?.play && images.length === 0) && dataV2.video_url) {
 res = res || { play: dataV2.video_url, title: dataV2.title };
 }
 if (images.length === 0 && Array.isArray(dataV2.slide_images) && dataV2.slide_images.length > 0) {
 images = dataV2.slide_images;
 }

 if (images.length > 0) {
 await m.reply(`Terdeteksi ${images.length} gambar, sedang mengirim...`);
 for (const img of images) {
 await sock.sendMessage(m.chat, {
 image: { url: img },
 caption: res.title || ''
 }, { quoted: m });
 }
 return;
 }

 const time = res.create_time ?
 moment.unix(res.create_time).tz('Asia/Jakarta').format('dddd, D MMMM YYYY [pukul] HH:mm:ss') :
 '-';

 const caption = `*Video TikTok Info*
*Judul:* ${res.title || '-'}
*Region:* ${res.region || 'N/A'}
*Durasi:* ${res.duration || '-'} detik
*Waktu Upload:* ${time}
*Author:* ${res.author?.nickname || '-'}`;

 const videoUrl = res.hdplay || res.play || res.wmplay;
 if (videoUrl) {
 const tempDir = './tmp';
 if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
 const inputPath = path.join(tempDir, `tiktok_in_${Date.now()}.mp4`);
 const outputPath = path.join(tempDir, `tiktok_out_${Date.now()}.mp4`);

 try {
 const response = await axios({
 url: videoUrl,
 method: 'GET',
 responseType: 'stream'
 });
 const writer = fs.createWriteStream(inputPath);
 response.data.pipe(writer);
 await new Promise((resolve, reject) => {
 writer.on('finish', resolve);
 writer.on('error', reject);
 });

 await new Promise((resolve, reject) => {
 exec(`ffmpeg -i ${inputPath} -c:v libx264 -c:a aac -pix_fmt yuv420p -movflags +faststart ${outputPath}`, (error, stdout, stderr) => {
 if (error) {
 console.error('FFmpeg Error:', stderr);
 return reject(new Error('Gagal mengkonversi video. Pastikan FFmpeg terpasang.'));
 }
 resolve(true);
 });
 });

 const videoBuffer = fs.readFileSync(outputPath);
 await sock.sendMessage(m.chat, { 
 video: videoBuffer, 
 caption: caption, 
 mimetype: 'video/mp4' 
 }, { quoted: m });

 } finally {
 if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
 if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
 }
 } else {
 m.reply("Maaf, gagal menemukan link video yang valid dari URL tersebut.");
 }
 } catch (e) {
 console.error(e);
 m.reply(`Terjadi kesalahan saat memproses permintaan: ${e.message}`);
 }
}
break;

case 'iqc': {
 try {
 if (!text) {
 m.reply('Format salah! Gunakan: .iqc jam|batre|pesan\nContoh: .iqc 18:00|40|hai hai');
 break;
 }
 const parts = text.split('|');
 if (parts.length < 3) {
 m.reply('Format salah! Gunakan:\n.iqc jam|batre|pesan\nContoh:\n.iqc 18:00|40|hai hai');
 break;
 }
 const [time, battery, ...messageParts] = parts;
 const message = messageParts.join('|').trim();
 if (!time || !battery || !message) {
 m.reply('Format tidak lengkap! Pastikan mengisi jam, batre, dan pesan');
 break;
 }
 const encodedTime = encodeURIComponent(time);
 const encodedMessage = encodeURIComponent(message);
 const url = `https://brat.siputzx.my.id/iphone-quoted?time=${encodedTime}&batteryPercentage=${battery}&carrierName=INDOSAT&messageText=${encodedMessage}&emojiStyle=apple`;
 const axios = require('axios');
 const response = await axios.get(url, { responseType: 'arraybuffer' });
 if (!response.data) throw new Error('Gagal mendapatkan gambar dari server');
 await sock.sendMessage(m.chat, { image: Buffer.from(response.data), caption: 'Pesan iPhone quote berhasil dibuat' }, { quoted: m });
 } catch (error) {
 console.error('Error di iqc:', error);
 m.reply(`Error: ${error.message || 'Terjadi kesalahan saat memproses'}`);
 }
}
break;

default:
if (m.text.toLowerCase().startsWith("xx")) {
    if (m.sender.split("@")[0] !== global.owner) return 

    try {
        const result = await eval(`(async () => { ${text} })()`);
        const output = typeof result !== "string" ? util.inspect(result) : result;
        return sock.sendMessage(m.chat, { text: util.format(output) }, { quoted: m });
    } catch (err) {
        return sock.sendMessage(m.chat, { text: util.format(err) }, { quoted: m });
    }
}

if (m.text.toLowerCase().startsWith("x")) {
    if (m.sender.split("@")[0] !== global.owner) return 

    try {
        let result = await eval(text);
        if (typeof result !== "string") result = util.inspect(result);
        return sock.sendMessage(m.chat, { text: util.format(result) }, { quoted: m });
    } catch (err) {
        return sock.sendMessage(m.chat, { text: util.format(err) }, { quoted: m });
    }
}

if (m.text.startsWith('$')) {
    if (!isOwner) return;
    
    exec(m.text.slice(2), (err, stdout) => {
        if (err) {
            return sock.sendMessage(m.chat, { text: err.toString() }, { quoted: m });
        }
        if (stdout) {
            return sock.sendMessage(m.chat, { text: util.format(stdout) }, { quoted: m });
        }
    });
}

// Registration Session Handler
if (global.registrationSession && global.registrationSession[m.sender]) {
    const session = global.registrationSession[m.sender];
    if (session.step === "WAITING_NAME") {
        if (!m.body) return m.reply("Mohon kirim nama Anda (teks).");
        session.name = m.body;
        session.step = "WAITING_LOCATION";
        return m.reply(`Halo ${session.name}, untuk memudahkan pengantaran, mohon kirimkan *Share Location* (Lokasi Terkini) Anda.`);
        
    } else if (session.step === "WAITING_LOCATION") {
        if (m.type === 'locationMessage' || (m.msg && m.msg.degreesLatitude)) {
            session.latitude = m.msg.degreesLatitude;
            session.longitude = m.msg.degreesLongitude;
            session.step = "WAITING_ADDRESS_DETAIL";
            return m.reply(`✅ Lokasi diterima.\n\nSekarang mohon ketik *Alamat Lengkap* (Nama Jalan, Blok, Nomor Rumah, Patokan) untuk detail pengantaran.`);
        } else {
             // Allow skipping location if they really can't share it, or force them. 
             // Let's assume we allow text fallback if they reply with text "skip" or just type address directly if they cant share loc.
             // But user requested: "minta alamat juga... jadi jika kurir sudah sampai lokasi tinggal cari alamatnya".
             // So better to force location first OR if they type coordinates manually? No, keep it simple.
             // If they type text, assume they can't share location and proceed to address detail, but warn them.
             
             if (m.body) {
                 if (m.body.toLowerCase() === 'lanjut' || m.body === '.') {
                      session.latitude = null;
                      session.longitude = null;
                      session.step = "WAITING_ADDRESS_DETAIL";
                      return m.reply("⚠️ Lokasi dilewati.\n\nSekarang mohon ketik *Alamat Lengkap* (Nama Jalan, Blok, Nomor Rumah, Patokan) untuk detail pengantaran.");
                 }
                 return m.reply("Mohon kirim *Share Location* (Peta) terlebih dahulu. \n\nJika tidak bisa, balas dengan titik (.) atau 'Lanjut' untuk input alamat manual saja.");
             }
        }
    } else if (session.step === "EDIT_NAME") {
        if (!m.body) return m.reply("Mohon kirim nama baru Anda.");
        const crm = loadCrmData();
        if (crm.customers[m.sender]) {
            crm.customers[m.sender].name = m.body;
            saveCrmData(crm);
            delete global.registrationSession[m.sender];
            m.reply(`✅ Nama berhasil diubah menjadi: ${m.body}`);
        } else {
             delete global.registrationSession[m.sender];
             m.reply("⚠️ Data pelanggan tidak ditemukan.");
        }
        
    } else if (session.step === "EDIT_LOCATION") {
         if (m.type === 'locationMessage' || (m.msg && m.msg.degreesLatitude)) {
            session.latitude = m.msg.degreesLatitude;
            session.longitude = m.msg.degreesLongitude;
            session.step = "EDIT_ADDRESS_DETAIL"; // New sub-step
            return m.reply(`✅ Lokasi Baru diterima.\n\nSekarang mohon ketik *Alamat Lengkap* baru Anda.`);
        } else if (m.body === '.') {
             session.latitude = null; // Should we keep old loc? No, logic says skipping means no map data or maybe user just wants to edit address text.
             // Actually user might want to keep old Coords but change text only.
             // Let's assume '.' means "Skip map update, go to address update".
             // We need to fetch old data if we want to keep it, but here we are in session.
             // Let's just move to address detail.
             session.step = "EDIT_ADDRESS_DETAIL";
             return m.reply("⚠️ Lokasi dilewati. Silakan masukkan alamat lengkap baru.");
        } else {
            return m.reply("Mohon kirim *Share Location* baru, atau balas '.' untuk lanjut ubah alamat teks saja.");
        }
        
    } else if (session.step === "EDIT_ADDRESS_DETAIL") {
        if (!m.body) return m.reply("Mohon kirim detail alamat baru Anda.");
        const crm = loadCrmData();
        if (crm.customers[m.sender]) {
            crm.customers[m.sender].address = m.body;
            
            // Update coords only if new ones provided in session, otherwise keep old? 
            // If session.latitude is set, update it. If null (skipped), maybe keep old? 
            // Logic above: null was set if skipped. If we want to keep old, we should have loaded it.
            // But usually "Edit Profile" implies overwriting. If I say "skip location" in edit, maybe I only moved to next door with same text? 
            // Simpler: Update if provided.
            if (session.latitude && session.longitude) {
                crm.customers[m.sender].latitude = session.latitude;
                crm.customers[m.sender].longitude = session.longitude;
            }
            
            saveCrmData(crm);
            delete global.registrationSession[m.sender];
            m.reply(`✅ Alamat & Lokasi berhasil diperbarui!`);
        } else {
             delete global.registrationSession[m.sender];
             m.reply("⚠️ Data pelanggan tidak ditemukan.");
        }
    } else if (session.step === "WAITING_ADDRESS_DETAIL") {
        if (!m.body) return m.reply("Mohon kirim detail alamat Anda (teks).");
        const address = m.body;
        const name = session.name;
        
        // Save to CRM
        const crm = loadCrmData();
        crm.customers[m.sender] = {
            id: m.sender,
            name: name,
            address: address, // Real text address
            latitude: session.latitude,
            longitude: session.longitude,
            phone: m.sender.split("@")[0],
            joined: new Date().toISOString(),
            orders_count: 0
        };
        saveCrmData(crm);
        
        delete global.registrationSession[m.sender];
            return m.reply(`✅ Pendaftaran Berhasil!\nNama: ${name}\nAlamat: ${address}\n\nSilakan ketik order untuk melanjutkan pemesanan.`);
    } else if (session.step === "WAITING_LOCATION_GUEST") {
         if (m.type === 'locationMessage' || (m.msg && m.msg.degreesLatitude)) {
            session.latitude = m.msg.degreesLatitude;
            session.longitude = m.msg.degreesLongitude;
            session.step = "WAITING_ADDRESS_GUEST";
            return m.reply(`✅ Lokasi diterima.\n\nSekarang mohon ketik *Alamat Lengkap* (Nama Jalan, Blok, Nomor Rumah) untuk pengantaran pesanan.`);
        } else {
             if (m.body) {
                 if (m.body.toLowerCase() === 'lanjut' || m.body === '.') {
                      session.latitude = null;
                      session.longitude = null;
                      session.step = "WAITING_ADDRESS_GUEST";
                      return m.reply("⚠️ Lokasi dilewati.\n\nSekarang mohon ketik *Alamat Lengkap* (Nama Jalan, Blok, Nomor Rumah) untuk pengantaran pesanan.");
                 }
                 return m.reply("Mohon kirim *Share Location* (Peta) agar kurir kami mudah menemukan lokasi Anda.\n\nBalas '.' jika terpaksa tidak bisa kirim lokasi.");
             }
        }
    } else if (session.step === "WAITING_ADDRESS_GUEST") {
         if (!m.body) return m.reply("Mohon kirim detail alamat blok/rumah Anda.");
         const address = m.body;
         const crm = loadCrmData();
         
         // Auto-Register Guest
         if (!crm.customers[m.sender]) {
             crm.customers[m.sender] = {
                id: m.sender,
                name: m.pushName || "Guest User",
                address: address,
                latitude: session.latitude,
                longitude: session.longitude,
                phone: m.sender.split("@")[0],
                joined: new Date().toISOString(),
                orders_count: 0
             };
             saveCrmData(crm);
         } else {
             // Update if exists (rare case here)
             crm.customers[m.sender].address = address;
             if (session.latitude) {
                 crm.customers[m.sender].latitude = session.latitude;
                 crm.customers[m.sender].longitude = session.longitude;
             }
             saveCrmData(crm);
         }
         
         // Restore Pending Order
         if (session.pendingOrder) {
             const { cart, total, paymentMethod } = session.pendingOrder;
             const orderId = generateOrderId();
             
             // Item Details
             let itemDetails = cart.map(i => `${i.qty}x ${i.name}`).join(", ");
             let fullOrderSummary = cart.map(i => `- ${i.qty}x ${i.name} (@Rp${i.price})`).join("\n");
             
             const newOrder = {
                id: orderId,
                customerId: m.sender,
                customerName: crm.customers[m.sender].name,
                address: crm.customers[m.sender].address,
                latitude: crm.customers[m.sender].latitude,
                longitude: crm.customers[m.sender].longitude,
                item: itemDetails,
                items: cart,
                amount: cart.reduce((acc, i) => acc + i.qty, 0),
                total: total,
                paymentMethod: paymentMethod,
                status: "Menunggu",
                date: new Date().toISOString()
            };
            
            crm.orders.push(newOrder);
            crm.customers[m.sender].orders_count += 1;
            saveCrmData(crm);
            
            // Clear Sessions
            delete global.cart[m.sender];
            delete global.registrationSession[m.sender];
            
            let paymentMsg = "💵 Siapkan uang pas saat kurir datang (COD).";
            
            m.reply(`✅ Pesanan Berhasil Dibuat!\nID: ${orderId}\n\n*Detail:*\n${fullOrderSummary}\n\nTotal: Rp${total.toLocaleString()}\nAlamat: ${address}\n${paymentMsg}\n\nMohon tunggu kurir kami.`);
            
             // Notify Owner
            const ownerJid = global.owner + "@s.whatsapp.net";
            sock.sendMessage(ownerJid, { text: `🔔 *PESANAN BARU (GUEST)*\n\nDari: ${newOrder.customerName}\n${fullOrderSummary}\n\nTotal: Rp${total.toLocaleString()}\nMetode: ${paymentMethod}\nAlamat: ${newOrder.address}\nID: ${orderId}` });
            
            // Notify Couriers
            if (crm.couriers && crm.couriers.length > 0) {
                crm.couriers.forEach(async (courierNum) => {
                    const courierJid = courierNum + "@s.whatsapp.net";
                    let btnMsg = generateWAMessageFromContent(courierJid, {
                        viewOnceMessage: {
                            message: {
                                messageContextInfo: {
                                    deviceListMetadata: {},
                                    deviceListMetadataVersion: 2
                                },
                                interactiveMessage: {
                                    body: { text: `🔔 *ORDER BARU MASUK*\n\nArea: ${newOrder.address}\nItem: ${itemDetails}\nTotal: Rp${newOrder.total.toLocaleString()}\nPembayaran: ${paymentMethod}\n\nSegera ambil antrian!` },
                                    footer: { text: "Panel Depot Minhaqua" },
                                    nativeFlowMessage: {
                                        buttons: [
                                            {
                                                name: "quick_reply",
                                                buttonParamsJson: JSON.stringify({
                                                    display_text: "📦 Ambil Antrian",
                                                    id: `.ambilantrian ${orderId}`
                                                })
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    }, { userJid: courierJid });
                    
                    await sock.relayMessage(courierJid, btnMsg.message, { messageId: btnMsg.key.id });
                });
            }
         } else {
             m.reply("Data tersimpan, tapi data pesanan hilang. Silakan order ulang.");
             delete global.registrationSession[m.sender];
         }
    }
}

// AI & Responder ( Moved from top to prevent double response )
if (m.body) {
    // Skip AI if user is in registration session
    if (global.registrationSession && global.registrationSession[m.sender]) {
        // Do nothing, let registration handler process it
    } else {
        const responder = db.settings.respon.find(v => v.id.toLowerCase() == m.body.toLowerCase())
        if (responder && responder.response) {
            await m.reply(responder.response)
        } else if (!m.isGroup && global.db.settings.ai_chat) {
        try {
            const lowerText = m.body.toLowerCase();
            const crm = loadCrmData();
            
            // Build Context Data
            let priceList = crm.products.map(p => `- ${p.name}: Rp${p.price.toLocaleString()}`).join("\n");
            let crmContext = `
FITUR DAN PANDUAN:
1. **Info & Bantuan**:
   - Jam Buka: 06:00 - 20:00 WIB.
   - Admin/Owner: ${global.owner}
   - Stok selalu ready untuk galon isi ulang dan galon baru.

DAFTAR HARGA:
${priceList}
`;

            const prompt = `Kamu adalah "MinBot", asisten AI cerdas untuk Depot Air Minum "Depot Minhaqua".
Tugasmu adalah membantu pelanggan dengan ramah, santai, dan sangat informatif menggunakan Bahasa Indonesia yang natural.

KONTEKS SISTEM:
${crmContext}

INSTRUKSI KHUSUS:
- Jika user tanya harga, jawab sesuai data di atas.
- Selalu gunakan format teks WhatsApp (seperti *tebal*, _miring_) untuk menekankan kata penting.
- Jangan berhalusinasi fitur yang tidak ada (hanya fitur di atas yang tersedia).
- Jika ada keluhan teknis berat, arahkan hubungi Owner.

DETEKSI NATURAL LANGUAGE ORDER:
- Jika user mengatakan "pesan air", "mau beli galon", "order air", "pesen 3 galon", dll, berarti mereka ingin ORDER.
- Default produk adalah "Galon Isi Ulang" jika tidak disebutkan spesifik.
- Jika ada angka (contoh: "pesen 3", "beli 2 galon"), itu adalah jumlah pesanan.
- Jika terdeteksi intent ORDER, jelaskan singkat bahwa pesanan akan diproses dan tambahkan '[ORDER_DETECTED:productIndex:quantity]' di akhir.
  Format: [ORDER_DETECTED:0:3] artinya produk index 0 (Galon Isi Ulang) sebanyak 3.
  Jika tidak ada angka, default quantity = 1.

BUTTON TRIGGERS (tambahkan di akhir respon):
- Jika user bertanya soal status pesanan/cek pesanana atau cek order, tambahkan '[BUTTON:CEK_ORDER]'.
- Jika user ingin membeli/memesan galon/air (tapi tidak spesifik angka), tambahkan '[BUTTON:ORDER]'.
- Jika user minta daftar harga/produk, tambahkan '[BUTTON:LIST_PRODUK]'.
- Jika user tanya profil/data diri, tambahkan '[BUTTON:PROFILE]'.

Pertanyaan User: "${m.body}"
Jawablah sebagai MinBot:`;

            const result = await geminiChat(prompt);
            
            // Parse response for natural language orders
            let finalBody = result;
            let buttons = [];
            
            // Check for ORDER_DETECTED pattern
            const orderMatch = result.match(/\[ORDER_DETECTED:(\d+):(\d+)\]/);
            if (orderMatch) {
                const productIdx = parseInt(orderMatch[1]);
                const quantity = parseInt(orderMatch[2]);
                finalBody = finalBody.replace(/\[ORDER_DETECTED:\d+:\d+\]/, "").trim();
                
                // Auto-add to cart
                const product = crm.products[productIdx];
                if (product) {
                    if (!global.cart) global.cart = {};
                    if (!global.cart[m.sender]) global.cart[m.sender] = [];
                    
                    const existingItem = global.cart[m.sender].find(item => item.idx === productIdx);
                    if (existingItem) {
                        existingItem.qty += quantity;
                    } else {
                        global.cart[m.sender].push({ idx: productIdx, name: product.name, price: product.price, qty: quantity });
                    }
                    
                    // AUTO-CHECKOUT for single item orders (simplification #1)
                    if (global.cart[m.sender].length === 1 && global.cart[m.sender][0].qty <= 3) {
                        // Directly trigger orderconfirm
                        const cart = global.cart[m.sender];
                        const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
                        const paymentMethod = "COD";
                        
                        // Check if registered
                        if (!crm.customers[m.sender]) {
                            // Guest flow - ask for location
                            if (!global.registrationSession) global.registrationSession = {};
                            global.registrationSession[m.sender] = { 
                                step: "WAITING_LOCATION_GUEST",
                                pendingOrder: {
                                    cart: cart,
                                    total: total,
                                    paymentMethod: paymentMethod
                                }
                            };
                            
                            finalBody += "\n\n📍 Mohon kirimkan *Share Location* (Lokasi Peta) Anda untuk pengantaran.";
                        } else {
                            // Registered user - process immediately
                            const orderId = generateOrderId();
                            let itemDetails = cart.map(i => `${i.qty}x ${i.name}`).join(", ");
                            let fullOrderSummary = cart.map(i => `- ${i.qty}x ${i.name} (@Rp${i.price})`).join("\n");
                            
                            const newOrder = {
                                id: orderId,
                                customerId: m.sender,
                                customerName: crm.customers[m.sender].name,
                                address: crm.customers[m.sender].address,
                                latitude: crm.customers[m.sender].latitude,
                                longitude: crm.customers[m.sender].longitude,
                                item: itemDetails,
                                items: cart,
                                amount: cart.reduce((acc, i) => acc + i.qty, 0),
                                total: total,
                                paymentMethod: paymentMethod,
                                status: "Menunggu",
                                date: new Date().toISOString()
                            };
                            
                            crm.orders.push(newOrder);
                            crm.customers[m.sender].orders_count += 1;
                            saveCrmData(crm);
                            delete global.cart[m.sender];
                            
                            finalBody += `\n\n✅ *Pesanan Otomatis Diproses!*\nID: ${orderId}\n${fullOrderSummary}\nTotal: Rp${total.toLocaleString()}\n\n💵 Bayar saat kurir datang (COD).`;
                            
                            // Notify owner using messageQueue for reliability
                            const ownerJid = global.owner + "@s.whatsapp.net";
                            messageQueue.add(
                                sock,
                                ownerJid,
                                { text: `🔔 *PESANAN BARU (AUTO)*\n\nDari: ${newOrder.customerName}\n${fullOrderSummary}\nTotal: Rp${total.toLocaleString()}\nID: ${orderId}` },
                                {},
                                'auto_order_notification',
                                orderId
                            );
                            
                            // Notify couriers with delay to avoid rate limit
                            if (crm.couriers && crm.couriers.length > 0) {
                                (async () => {
                                    for (const courierNum of crm.couriers) {
                                        const courierJid = courierNum + "@s.whatsapp.net";
                                        let btnMsg = generateWAMessageFromContent(courierJid, {
                                            viewOnceMessage: {
                                                message: {
                                                    messageContextInfo: {
                                                        deviceListMetadata: {},
                                                        deviceListMetadataVersion: 2
                                                    },
                                                    interactiveMessage: {
                                                        body: { text: `🔔 *ORDER BARU (AUTO)*\n\nArea: ${newOrder.address}\nItem: ${itemDetails}\nTotal: Rp${newOrder.total.toLocaleString()}` },
                                                        footer: { text: "Panel Depot Minhaqua" },
                                                        nativeFlowMessage: {
                                                            buttons: [
                                                                {
                                                                    name: "quick_reply",
                                                                    buttonParamsJson: JSON.stringify({
                                                                        display_text: "📦 Ambil Antrian",
                                                                        id: `.ambilantrian ${orderId}`
                                                                    })
                                                                }
                                                            ]
                                                        }
                                                    }
                                                }
                                            }
                                        }, { userJid: courierJid });
                                        
                                        try {
                                            await sock.relayMessage(courierJid, btnMsg.message, { messageId: btnMsg.key.id });
                                            await new Promise(resolve => setTimeout(resolve, 1000));
                                        } catch (error) {
                                            console.error(`[AutoOrder] Failed to notify courier ${courierNum}:`, error.message);
                                        }
                                    }
                                })();
                            }
                        }
                    } else {
                        // Multiple items or large quantity - show checkout button
                        buttons.push({
                            name: "quick_reply",
                            buttonParamsJson: JSON.stringify({
                                display_text: "✅ Checkout Selesai",
                                id: `.orderconfirm COD`
                            })
                        });
                        
                        buttons.push({
                            name: "quick_reply",
                            buttonParamsJson: JSON.stringify({
                                display_text: "➕ Tambah Lagi",
                                id: `.order`
                            })
                        });
                    }
                }
            }

            if (result.includes("[BUTTON:CEK_ORDER]")) {
                finalBody = finalBody.replace("[BUTTON:CEK_ORDER]", "").trim();
                buttons.push({
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({
                        display_text: "🔍 Cek Pesanan",
                        id: ".cekorder"
                    })
                });
            }
            
            if (result.includes("[BUTTON:ORDER]")) {
                finalBody = finalBody.replace("[BUTTON:ORDER]", "").trim();
                buttons.push({
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({
                        display_text: "🛒 Pesan Sekarang",
                        id: ".order"
                    })
                });
            }

            if (result.includes("[BUTTON:LIST_PRODUK]")) {
                finalBody = finalBody.replace("[BUTTON:LIST_PRODUK]", "").trim();
                buttons.push({
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({
                        display_text: "📋 Daftar Produk",
                        id: ".listproduk"
                    })
                });
            }
            
            if (result.includes("[BUTTON:DAFTAR]")) {
                finalBody = finalBody.replace("[BUTTON:DAFTAR]", "").trim();
                buttons.push({
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({
                        display_text: "📝 Daftar Sekarang",
                        id: ".daftar"
                    })
                });
            }
            
            if (result.includes("[BUTTON:PROFILE]")) {
                finalBody = finalBody.replace("[BUTTON:PROFILE]", "").trim();
                buttons.push({
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({
                        display_text: "👤 Lihat Profil",
                        id: ".profile"
                    })
                });
            }

            if (buttons.length > 0) {
                let msg = generateWAMessageFromContent(m.chat, {
                    viewOnceMessage: {
                        message: {
                            messageContextInfo: {
                                deviceListMetadata: {},
                                deviceListMetadataVersion: 2
                            },
                            interactiveMessage: {
                                body: { text: finalBody },
                                footer: { text: "Depot Minhaqua AI" },
                                nativeFlowMessage: {
                                    buttons: buttons,
                                    messageParamsJson: JSON.stringify({
                                        from_flow: true 
                                    })
                                }
                            }
                        }
                    }
                }, { userJid: m.sender, quoted: m });
                await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
            } else {
                await m.reply(finalBody);
            }

        } catch (e) {
            console.log("Gemini Chat Error: " + e);
        }
        }
    }
}

}

} catch (err) {
console.log(err)
await sock.sendMessage(global.owner+"@s.whatsapp.net", {text: err.toString()}, {quoted: m ? m : null })
}}

//=============================================//

process.on("uncaughtException", (err) => {
console.error("Caught exception:", err);
});


let file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log(chalk.blue(">> Update File:"), chalk.black.bgWhite(__filename));
    delete require.cache[file];
    require(file);
});