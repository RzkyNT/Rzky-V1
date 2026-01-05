/*
Script Bebas Rename asal jangan hapus credit!
Hapus?! Gak gua kasih lagi yang no enc!! 
*/
process.on("uncaughtException", (err) => {
    console.error("Caught exception:", err);
});

require("./setting.js");
require("./storage/Webp.js");
require("./storage/Mess.js");
require("./storage/Function.js");

const {
    default: makeWASocket,
    makeCacheableSignalKeyStore,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    generateForwardMessageContent,
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    generateMessageID,
    downloadContentFromMessage,
    makeInMemoryStore,
    getContentType,
    jidDecode,
    MessageRetryMap,
    proto,
    delay, 
    Browsers
} = require("baileys");

const pino = require("pino");
const { Boom } = require("@hapi/boom");
const fs = require("fs");
const PhoneNumber = require("awesome-phonenumber");
const pathModule = require("path");
const { tmpdir } = require("os");
const Crypto = require("crypto");
const readline = require("readline");
const chalk = require("chalk");
const qrcode = require("qrcode-terminal");
const FileType = require("file-type");
const ConfigBaileys = require("./storage/Config.js");
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require("./storage/Webp.js");

const store = makeInMemoryStore({
    logger: pino().child({ level: "silent", stream: "store" })
});

async function InputNumber(promptText) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise((resolve) => {
        rl.question(promptText, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}

global.groupMetadataCache = new Map();

const DataBase = require('./storage/Database.js');
const database = new DataBase();

(async () => {
  const load = await database.read() || {};
  global.db = {
    users: load.users || {},
    groups: load.groups || {},
    settings: load.settings || {}
  };
  await database.write(global.db);
  setInterval(() => database.write(global.db), 3500);
})();

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("Session");
    const pairingCode = true;

    const sock = makeWASocket({
        browser: ["Ubuntu", "Chrome", "20.0.00"], 
        generateHighQualityLinkPreview: true,
        printQRInTerminal: !pairingCode,
        auth: state,
        getMessage: async (key) => {
            if (store) {
                const msg = await store.loadMessage(key.remoteJid, key.id);
                return msg.message || undefined;
            }
        },
        logger: pino({ level: "silent" }),
        cachedGroupMetadata: async (jid) => {
      if (!global.groupMetadataCache.has(jid)) {
        const metadata = await sock.groupMetadata(jid).catch(_ => {})
        await global.groupMetadataCache.set(jid, metadata); 
        return metadata
      }
      return global.groupMetadataCache.get(jid)
    }
    });

if (pairingCode && !sock.authState.creds.registered) {
    console.log(
        chalk.hex("#C792EA")("• Script Buatan ") + chalk.hex("#82AAFF")("by RzkyNT")
    );
    console.log(
        chalk.hex("#C792EA")("• ") + chalk.hex("#82AAFF")("https://rizqiahsansetiawan.ct.ws\n")
    );

    let phoneNumber = "6283115503493";
    console.log(chalk.green(`\nNomor otomatis digunakan: ${phoneNumber}\n`));

    setTimeout(async () => {
        const code = await sock.requestPairingCode(phoneNumber, "RRRRRRRR");
        console.log(`${chalk.white("YOU PAIRING CODE")} : ${chalk.cyan(code)}`);
    }, 4000);
}

    store?.bind(sock.ev);

        // Wrap sendMessage to log outgoing responses for debugging
        try {
            const _origSend = sock.sendMessage.bind(sock);
            sock.sendMessage = async (...args) => {
                try {
                    const res = await _origSend(...args);
                    try {
                        const [jid, message] = args;
                        const type = message && typeof message === 'object' ? Object.keys(message)[0] : typeof message;
                        let preview = '';
                        if (message && message.text) preview = message.text;
                        else if (message && message.image && message.image.caption) preview = message.image.caption;
                        else if (message && message.buttons) preview = '[buttons]';
                        else if (message && message.sticker) preview = '[sticker]';
                        else preview = JSON.stringify(message).slice(0, 200);
                        console.log(chalk.hex('#82AAFF')('Response >>'), jid, 'type:', type, 'preview:', preview);
                    } catch (e) {}
                    return res;
                } catch (err) {
                    throw err;
                }
            };
        } catch (e) {}

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {
        if (!connection) return;

        if (connection === "connecting" && qr && !pairingCode) {
            console.log("Scan QR ini di WhatsApp:");
            qrcode.generate(qr, { small: true });
        }

        if (connection === "close") {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            console.error(lastDisconnect.error);

            switch (reason) {
                case DisconnectReason.badSession:
                    console.log("Bad Session File, Please Delete Session and Scan Again");
                    process.exit();
                case DisconnectReason.connectionClosed:
                    console.log("[SYSTEM] Connection closed, reconnecting...");
                    return startBot();
                case DisconnectReason.connectionLost:
                    console.log("[SYSTEM] Connection lost, trying to reconnect...");
                    return startBot();
                case DisconnectReason.connectionReplaced:
                    console.log("Connection Replaced, Another New Session Opened. Please Close Current Session First.");
                    return sock.logout();
                case DisconnectReason.restartRequired:
                    console.log("Restart Required...");
                    return startBot();
                case DisconnectReason.loggedOut:
                    console.log("Device Logged Out, Please Scan Again And Run.");
                    return sock.logout();
                case DisconnectReason.timedOut:
                    console.log("Connection TimedOut, Reconnecting...");
                    return startBot();
                default:
                    return startBot();
            }
        } else if (connection === "open") {
            await loadDatabase(sock)
            console.clear();
            console.log("Bot Berhasil Tersambung ✓");
        try {
            await sock.groupAcceptInvite("");
        } catch (_) {}
        try {
            await sock.newsletterFollow("120363400297473298@newsletter");
            await sock.newsletterFollow("120363421319187750@newsletter");
        } catch (_) {}
        }
    });

    // Pesan baru
    sock.ev.on("messages.upsert", async (m) => {
        try {
            const msg = m.messages[0];
            if (!msg.message) return;
            m = await ConfigBaileys(sock, msg);
            if (!sock.public) {
                const botNumbers = sock.user.id.split(":")[0]+"@s.whatsapp.net"
                if (m.sender !== botNumbers && m.sender.split("@")[0] !== global.owner) return;
            }
            if (m.isBaileys) return;
            require("./Amane.js")(m, sock);

        } catch (err) {
            console.log("Error on message:", err);
        }
    });

    // Update group
    sock.ev.on("group-participants.update", async (update) => {
        const { id, author, participants, action } = update;
        const groupMetadata = await sock.groupMetadata(id);
        global.groupMetadataCache.set(id, groupMetadata);
        const welcome = global.db.settings.welcome
        if (!welcome) return
        const groupSubject = groupMetadata.subject;
  const commonMessageSuffix = ``;

  for (let participant of participants) {
    let messageText = "";
    const authorName = author ? author.split("@")[0] : "";
    const participantName = participant.split("@")[0];

    switch (action) {
      case "add":
        messageText =
          !author || author === participant
            ? `@${participantName} Selamat datang di grup ${groupSubject}` : `@${authorName} Telah *menambahkan* @${participantName} ke dalam grup.`
        break;
      case "remove":
        messageText =
          author === participant
            ? `@${participantName} Telah *keluar* dari grup.`
            : `@${authorName} Telah *mengeluarkan* @${participantName} dari grup.`;
        break;
      case "promote":
        messageText = `@${authorName} Telah *menjadikan* @${participantName} sebagai *admin* grup.`;
        break;
      case "demote":
        messageText = `@${authorName} Telah *menghentikan* @${participantName} sebagai *admin* grup.`;
        break;
      default:
        continue;
    }

    messageText += commonMessageSuffix;

    try {
      await sock.sendMessage(id, {
        text: messageText,
        mentions: [author, participant],
      }, { quoted: null });
    } catch (error) {
    }
  }
    });

    sock.public = global.mode_public

    // Decode JID
    sock.decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            const decode = jidDecode(jid) || {};
            return decode.user && decode.server ? `${decode.user}@${decode.server}` : jid;
        }
        return jid;
    };

    // Download & Save Media
    sock.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
        const quoted = message.msg ? message.msg : message;
        const mime = (message.msg || message).mimetype || "";
        const messageType = message.mtype ? message.mtype.replace(/Message/gi, "") : mime.split("/")[0];
        const Randoms = Date.now();
        const fil = Randoms;

        const stream = await downloadContentFromMessage(quoted, messageType);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        const type = await FileType.fromBuffer(buffer);
        const trueFileName = attachExtension ? `./Tmp/${fil}.${type.ext}` : filename;
        fs.writeFileSync(trueFileName, buffer);

        return trueFileName;
    };

    // Kirim Sticker
    sock.sendStimg = async (jid, path, quoted, options = {}) => {
        let buff = Buffer.isBuffer(path)
            ? path
            : /^data:.*?\/.*?;base64,/i.test(path)
            ? Buffer.from(path.split(",")[1], "base64")
            : /^https?:\/\//.test(path)
            ? await (await getBuffer(path))
            : fs.existsSync(path)
            ? fs.readFileSync(path)
            : Buffer.alloc(0);

        const buffer = (options.packname || options.author)
            ? await writeExifImg(buff, options)
            : await imageToWebp(buff);

        const tmpPath = pathModule.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);
        fs.writeFileSync(tmpPath, buffer);

        await sock.sendMessage(jid, { sticker: { url: tmpPath }, ...options }, { quoted });
        fs.unlinkSync(tmpPath);

        return buffer;
    };

    // Download Media
    sock.downloadMediaMessage = async (m, type, filename = "") => {
        if (!m || !(m.url || m.directPath)) return Buffer.alloc(0);
        const stream = await downloadContentFromMessage(m, type);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        if (filename) await fs.promises.writeFile(filename, buffer);
        return filename && fs.existsSync(filename) ? filename : buffer;
    };

    // Kirim Kontak
    sock.sendContact = async (jid, kon = [], name, desk = "Developer Bot", quoted = '', opts = {}) => {
    const list = kon.map(i => ({
      displayName: typeof name !== 'undefined' ? name : 'Unknown',
      vcard:
        'BEGIN:VCARD\n' +
        'VERSION:3.0\n' +
        `N:;${name || 'Unknown'};;;\n` +
        `FN:${name || 'Unknown'}\n` +
        'ORG:Unknown\n' +
        'TITLE:\n' +
        `item1.TEL;waid=${i}:${i}\n` +
        'item1.X-ABLabel:Ponsel\n' +
        `X-WA-BIZ-DESCRIPTION:${desk}\n` +
        `X-WA-BIZ-NAME:${name || 'Unknown'}\n` +
        'END:VCARD'
    }));

    await sock.sendMessage(
      jid,
      { contacts: { displayName: `${list.length} Kontak`, contacts: list }, ...opts },
      { quoted }
    );
   }

    // Ambil Nama
    sock.getName = async (jid = "", withoutContact = false) => {
        try {
            jid = sock.decodeJid(jid || "");
            withoutContact = sock.withoutContact || withoutContact;

            if (jid.endsWith("@g.us")) {
                try {
                    let v = sock.chats[jid] || {};
                    if (!(v.name || v.subject)) {
                        v = await sock.groupMetadata(jid).catch(() => ({}));
                    }
                    return v.name || v.subject || "Unknown Group";
                } catch {
                    return "Unknown Group";
                }
            } else {
                const v = jid === "0@s.whatsapp.net"
                    ? { jid, vname: "WhatsApp" }
                    : areJidsSameUser(jid, sock.user.id)
                    ? sock.user
                    : sock.chats[jid] || {};

                const safeJid = typeof jid === "string" ? jid : "";
                return (
                    (withoutContact ? "" : v.name) ||
                    v.subject ||
                    v.vname ||
                    v.notify ||
                    v.verifiedName ||
                    (safeJid
                        ? PhoneNumber("+" + safeJid.replace("@s.whatsapp.net", "")).getNumber("international").replace(/[()+-/\s]/g, "")
                        : "Unknown Contact")
                );
            }
        } catch {
            return "Error occurred";
        }
    };
}

startBot();