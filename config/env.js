// Load environment variables
require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = [
    'BOT_OWNER',
    'BOT_NAME',
    'SANKA_API_KEY',
    'FERDEV_API_KEY'
];

// Check if all required env vars are present
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`❌ Missing required environment variable: ${envVar}`);
        console.error('Please check your .env file');
        process.exit(1);
    }
}

// Export environment variables with fallbacks
module.exports = {
    // Bot Configuration
    BOT_OWNER: process.env.BOT_OWNER,
    BOT_NAME: process.env.BOT_NAME || 'RzkyNT Bot',
    BOT_VERSION: process.env.BOT_VERSION || '4.0.0',
    BOT_MODE: process.env.BOT_MODE === 'public',

    // AI API Keys
    SANKA_API_KEY: process.env.SANKA_API_KEY,
    DAVID_CYRIL_API_KEY: process.env.DAVID_CYRIL_API_KEY || '',
    FERDEV_API_KEY: process.env.FERDEV_API_KEY,

    // Gemini API Keys (array for rotation)
    GEMINI_KEYS: [
        process.env.GEMINI_KEY_1,
        process.env.GEMINI_KEY_2,
        process.env.GEMINI_KEY_3,
        process.env.GEMINI_KEY_4,
        process.env.GEMINI_KEY_5,
        process.env.GEMINI_KEY_6,
        process.env.GEMINI_KEY_7,
        process.env.GEMINI_KEY_8,
        process.env.GEMINI_KEY_9,
        process.env.GEMINI_KEY_10,
        process.env.GEMINI_KEY_11,
        process.env.GEMINI_KEY_12
    ].filter(key => key && key.length > 0), // Remove empty keys

    // Panel Configuration
    PTERODACTYL_API_KEY: process.env.PTERODACTYL_API_KEY,
    PTERODACTYL_CLIENT_KEY: process.env.PTERODACTYL_CLIENT_KEY,
    PANEL_DOMAIN: process.env.PANEL_DOMAIN,
    EGG_ID: process.env.EGG_ID || '15',
    NEST_ID: process.env.NEST_ID || '5',
    LOCATION_ID: process.env.LOCATION_ID || '1',

    // Helper function to get random Gemini key
    getRandomGeminiKey() {
        if (this.GEMINI_KEYS.length === 0) return null;
        return this.GEMINI_KEYS[Math.floor(Math.random() * this.GEMINI_KEYS.length)];
    },

    // Helper function to validate API keys
    validateApiKeys() {
        const issues = [];
        
        if (!this.SANKA_API_KEY) issues.push('SANKA_API_KEY is missing');
        if (!this.FERDEV_API_KEY) issues.push('FERDEV_API_KEY is missing');
        if (this.GEMINI_KEYS.length === 0) issues.push('No valid GEMINI_KEYS found');
        
        if (issues.length > 0) {
            console.warn('⚠️ API Key Issues:');
            issues.forEach(issue => console.warn(`  - ${issue}`));
        }
        
        return issues.length === 0;
    }
};