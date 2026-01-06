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
        // Gunakan model yang benar: gemini-1.5-flash atau gemini-pro
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
            {
                contents: [{
                    parts: [{ text: text }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                }
            },
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 30000
            }
        );

        if (response.data && response.data.candidates && response.data.candidates.length > 0) {
            const candidate = response.data.candidates[0];
            if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
                return candidate.content.parts[0].text;
            }
        }
        
        return "Maaf, saya tidak mengerti.";
    } catch (error) {
        console.error(chalk.red("Gemini API Error:"), error.response?.status, error.response?.data || error.message);
        
        // Jika error 403, coba key berikutnya
        if (error.response?.status === 403) {
            console.log(chalk.yellow("Trying next API key..."));
            const nextKey = getNextKey();
            if (nextKey && nextKey !== key) {
                try {
                    const retryResponse = await axios.post(
                        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${nextKey}`,
                        {
                            contents: [{
                                parts: [{ text: text }]
                            }],
                            generationConfig: {
                                temperature: 0.7,
                                topK: 40,
                                topP: 0.95,
                                maxOutputTokens: 1024,
                            }
                        },
                        {
                            headers: { 'Content-Type': 'application/json' },
                            timeout: 30000
                        }
                    );

                    if (retryResponse.data && retryResponse.data.candidates && retryResponse.data.candidates.length > 0) {
                        const candidate = retryResponse.data.candidates[0];
                        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
                            return candidate.content.parts[0].text;
                        }
                    }
                } catch (retryError) {
                    console.error(chalk.red("Retry also failed:"), retryError.message);
                }
            }
        }
        
        return "Sedang ada gangguan pada AI. Coba lagi nanti.";
    }
}

module.exports = geminiChat;
