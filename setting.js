/*
Script Bebas Rename asal jangan hapus credit!
Hapus?! Gak gua kasih lagi yang no enc!! 
*/
const chalk = require("chalk");
const fs = require("fs");

global.owner = "62895602416781"
global.namaOwner = "RzkyNT"
global.mode_public = true

global.linkSaluran = "https://whatsapp.com/channel/0029VbB7WPzAYlUQFsoSwS0d"
global.linkChannel = "https://whatsapp.com/channel/0029VbAu2g6ATRSpePrpSp3L"
global.linkWebsite = "https://rizqiahsansetiawan.ct.ws"
global.idChannel = "120363400297473298@newsletter"
global.linkGrup = "https://chat.whatsapp.com/HqEsfykjNCRA7GecpenP9V"
global.thumbnail = "https://media.licdn.com/dms/image/v2/D5616AQFKZCq6Dlq7QA/profile-displaybackgroundimage-shrink_350_1400/B56ZmoIJ75I4AY-/0/1759462335419?e=1766620800&v=beta&t=QXzM0qaccjSX3A1bRkdeamDQ2koGVawGiWwQecuYv34"
global.thumbnail2 = "https://media.licdn.com/dms/image/v2/D5616AQFKZCq6Dlq7QA/profile-displaybackgroundimage-shrink_350_1400/B56ZmoIJ75I4AY-/0/1759462335419?e=1766620800&v=beta&t=QXzM0qaccjSX3A1bRkdeamDQ2koGVawGiWwQecuYv34"

global.dana = "0895602416781"
global.ovo = "Tidak tersedia"
global.gopay = "Tidak tersedia"
global.qris = "Tidak Tersedia"

global.JedaPushkontak = 8000
global.JedaJpm = 7000

global.egg = "15" // Isi id egg
global.nestid = "5" // Isi id nest
global.loc = "1" // Isi id location
global.domain = 'https://neonprivateamane.kantinvps.my.id'
global.apikey = 'ptla_nfxGfDEtqPKTvtEmiybbvHqfMnaTqhUCVLbMsEeAVoj' // Isi api ptla
global.capikey = 'ptlc_OFai7puWJNdI9yJDKovikt3fo5sD9bCOnu5cOCIK4jV' // Isi api ptlc
global.Dev = "IG: Rzky.NT"


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