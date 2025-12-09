/*
Script Bebas Rename asal jangan hapus credit!
Hapus?! Gak gua kasih lagi yang no enc!! 
*/
const chalk = require("chalk");
const fs = require("fs");

global.owner = "62895602416781"
global.wame = "wa.me/62895602416781"
global.version = "4.0.0"
global.dev = "IG: Rzky.NT"
global.namaOwner = "RzkyNT"
global.mode_public = true

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

global.egg = "15" // Isi id egg
global.nestid = "5" // Isi id nest
global.loc = "1" // Isi id location
global.domain = 'https://neonprivateamane.kantinvps.my.id'
global.apikey = 'ptla_nfxGfDEtqPKTvtEmiybbvHqfMnaTqhUCVLbMsEeAVoj' // Isi api ptla
global.capikey = 'ptlc_OFai7puWJNdI9yJDKovikt3fo5sD9bCOnu5cOCIK4jV' // Isi api ptlc
global.Dev = "IG: Rzky.NT"

// Gemini API Keys (Reshuffle System)
global.geminiKeys = [
  "AIzaSyBkC5_KaurUfy2Kykt55G-fpsNM-sUuPj8",
  "AIzaSyDU--l_sSD67KedbEhLU1-Nq64hXd9Lcf0",
  "AIzaSyA04FMmQZxqtU98wk4bzl76o7po4egKTxs",
  "AIzaSyD91AbdKvtKf2wLcecQyjdopzEvroQ_HQ4",
  "AIzaSyDa33G3VqMxazDIrLw8aigfkWt2g2GWNAY",
  "AIzaSyBX9d1CL73Vvrwemfy9N_BFwNrGxntsnIw",
  "AIzaSyCITwoJ8mYfoInINvO3kD6c3nLhgOghge0",
  "AIzaSyCWc7vDZaH9vb9YPiuwRFufq9AoAYzTMMs",
  "AIzaSyCflyRXMm_2bTtxxgKW4OyECVYM3GhNfmQ",
  "AIzaSyCgGeDr0iL-s65bzrtRX5pPOTvCANTlb7I",
  "AIzaSyBUecUJAgWVV9RmIbzEm6I8beGbeuklN60",
  "AIzaSyBFPAY2wm1AJr67z86bcqUSAqPlkRDGhEM"
];


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


let file = require.resolve(__filename) 
fs.watchFile(file, () => {
fs.unwatchFile(file)
console.log(chalk.blue(">> Update File :"), chalk.black.bgWhite(`${__filename}`))
delete require.cache[file]
require(file)
})