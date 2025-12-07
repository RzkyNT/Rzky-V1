const axios = require('axios');
const chalk = require('chalk');

let currentKeyIndex = 0;

function getNextKey() {
    // Force reload setting.js if keys are missing or contain placeholders (Fix for hot reload fail)
    if (!global.geminiKeys || global.geminiKeys.length === 0 || global.geminiKeys[0].startsWith("ISI_API_KEY")) {
        try {
            const settingPath = require.resolve("../setting.js");
            if (require.cache[settingPath]) delete require.cache[settingPath];
            require("../setting.js");
            console.log("Re-loaded setting.js for Gemini Keys");
        } catch (e) {
            console.error("Failed to reload setting.js", e);
        }
    }

    if (!global.geminiKeys || global.geminiKeys.length === 0) return null;
    const key = global.geminiKeys[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % global.geminiKeys.length;
    return key;
}

async function geminiChat(text) {
    const key = getNextKey();
    if (!key || key.startsWith("ISI_API_KEY")) return "API Key Gemini belum dikonfigurasi. Silakan isi di setting.js";

    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
            {
                contents: [{
                    parts: [{ text: text }]
                }]
            },
            {
                headers: { 'Content-Type': 'application/json' }
            }
        );

        if (response.data && response.data.candidates && response.data.candidates.length > 0) {
            return response.data.candidates[0].content.parts[0].text;
        } else {
            return "Maaf, saya tidak mengerti.";
        }
    } catch (error) {
        console.error(chalk.red("Gemini API Error:"), error.message);
        // Retry with next key if error (optional logic, but keep simple for now)
        return "Sedang ada gangguan pada AI. Coba lagi nanti.";
    }
}

module.exports = geminiChat;
