/*
Script Bebas Rename asal jangan hapus credit!
Hapus?! Gak gua kasih lagi yang no enc!! 
*/
const chalk = require("chalk");
const fs = require("fs");

// Load environment variables
const ENV = require("./config/env.js");

// Bot Configuration dari environment variables
global.owner = ENV.BOT_OWNER
global.wame = `wa.me/${ENV.BOT_OWNER}`
global.version = ENV.BOT_VERSION
global.dev = "IG: Rzky.NT"
global.namaOwner = ENV.BOT_NAME
global.supervisor = ["62895602416782"] // ganti dengan nomor supervisor
global.mode_public = ENV.BOT_MODE

global.linkSaluran = "https://whatsapp.com/channel/0029Vb5RfCe7z4knVfZ6Ku2v"
global.linkChannel = "https://whatsapp.com/channel/0029Vb5RfCe7z4knVfZ6Ku2v"
global.linkWebsite = "https://rizqiahsansetiawan.ct.ws"
global.idChannel = "120363419275638698@newsletter"
global.linkGrup = "https://chat.whatsapp.com/HqEsfykjNCRA7GecpenP9V"
global.thumbnail = "https://rizqiahsansetiawan.ct.ws/assets/img/about.jpg"
global.thumbnail2 = "https://rizqiahsansetiawan.ct.ws/assets/img/about.jpg"

global.dana = "0895602416781"
global.qris = "Tidak Tersedia"
global.rekBca = "Tidak Tersedia"
global.rekBri = "Tidak Tersedia"

global.JedaPushkontak = 8000
global.JedaJpm = 7000

// Panel Configuration dari environment variables
global.egg = ENV.EGG_ID
global.nestid = ENV.NEST_ID
global.loc = ENV.LOCATION_ID
global.domain = ENV.PANEL_DOMAIN
global.apikey = ENV.PTERODACTYL_API_KEY
global.capikey = ENV.PTERODACTYL_CLIENT_KEY
global.Dev = "IG: Rzky.NT"

// Gemini API Keys dari environment variables (untuk backward compatibility)
global.geminiKeys = ENV.GEMINI_KEYS

global.subdomain = {
  "skypedia.qzz.io": {
    "zone": "59c189ec8c067f57269c8e057f832c74",
    "apitoken": "mZd-PC7t7PmAgjJQfFvukRStcoWDqjDvvLHAJzHF"
  }, 
  "pteroweb.my.id": {
    "zone": "714e0f2e54a90875426f8a6819f782d0",
    "apitoken": "vOn3NN5HJPut8laSwCjzY-gBO0cxeEdgSLH9WBEH"
  },
  "panelwebsite.biz.id": {
    "zone": "2d6aab40136299392d66eed44a7b1122",
    "apitoken": "CcavVSmQ6ZcGSrTnOos-oXnawq4yf86TUhmQW29S"
  },
  "privatserver.my.id": {
    "zone": "699bb9eb65046a886399c91daacb1968",
    "apitoken": "CcavVSmQ6ZcGSrTnOos-oXnawq4yf86TUhmQW29S"
  },
  "serverku.biz.id": {
    "zone": "4e4feaba70b41ed78295d2dcc090dd3a",
    "apitoken": "CcavVSmQ6ZcGSrTnOos-oXnawq4yf86TUhmQW29S"
  },
  "vipserver.web.id": {
    "zone": "e305b750127749c9b80f41a9cf4a3a53",
    "apitoken": "cpny6vwi620Tfq4vTF4KGjeJIXdUCax3dZArCqnT"
  }, 
  "mypanelstore.web.id": {
    "zone": "c61c442d70392500611499c5af816532",
    "apitoken": "uaw-48Yb5tPqhh5HdhNQSJ6dPA3cauPL_qKkC-Oa"
  }
}

// Validate API keys on startup
console.log(chalk.blue("🔐 Validating API Keys..."));
if (ENV.validateApiKeys()) {
    console.log(chalk.green("✅ All API keys validated successfully"));
} else {
    console.log(chalk.yellow("⚠️ Some API keys are missing - check console warnings above"));
}

let file = require.resolve(__filename) 
fs.watchFile(file, () => {
fs.unwatchFile(file)
console.log(chalk.blue(">> Update File :"), chalk.black.bgWhite(`${__filename}`))
delete require.cache[file]
require(file)
})