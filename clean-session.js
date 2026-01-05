#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

console.log(chalk.hex('#82AAFF')('🧹 Session Cleaner Utility'));
console.log(chalk.hex('#C792EA')('================================\n'));

const sessionPath = path.join(__dirname, 'Session');

if (!fs.existsSync(sessionPath)) {
    console.log(chalk.yellow('⚠️ No Session folder found. Nothing to clean.'));
    process.exit(0);
}

try {
    const sessionFiles = fs.readdirSync(sessionPath);
    console.log(chalk.cyan(`📁 Found ${sessionFiles.length} session files:`));
    
    sessionFiles.forEach(file => {
        console.log(chalk.gray(`   - ${file}`));
    });
    
    console.log(chalk.red('\n🗑️ Removing all session files...'));
    fs.rmSync(sessionPath, { recursive: true, force: true });
    
    console.log(chalk.green('✅ Session files cleaned successfully!'));
    console.log(chalk.yellow('💡 You can now restart the bot to create a new session.'));
    
} catch (error) {
    console.error(chalk.red('❌ Error cleaning session:'), error.message);
    process.exit(1);
}