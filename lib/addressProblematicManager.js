/**
 * Address Problematic Manager
 * Interface for managing problematic addresses and issue resolution
 */

const { 
    EMOJIS, 
    SUCCESS_MESSAGES,
    ERROR_MESSAGES,
    PAGINATION 
} = require('../storage/AddressConstants');
const { 
    formatAddressForDisplay, 
    truncateText,
    formatDate 
} = require('../storage/AddressUtils');

class AddressProblematicManager {
    constructor(addressService, statusManager) {
        this.addressService = addressService;
        this.statusManager = statusManager;
        this.problematicSessions = new Map(); // Store problematic management sessions
    }

    /**
     * Show problematic addresses dashboard
     */
    async showProblematicDashboard(chatId, sock, userId) {
        try {
            const result = await this.addressService.getProblematicAddresses();
            
            if (!result.success) {
                return await this.sendMessage(chatId, sock, `${EMOJIS.ERROR} ${result.error.message}`);
            }

            const addresses = result.data;

            if (addresses.length === 0) {
                const noProblemText = `${EMOJIS.SUCCESS} **TIDAK ADA ALAMAT BERMASALAH**

Semua alamat dalam kondisi baik!

${EMOJIS.STATISTICS} Untuk melihat statistik alamat, ketik /alamat > 4`;

                return await this.sendMessage(chatId, sock, noProblemText);
            }

            return await this.displayProblematicAddresses(chatId, sock, addresses, userId);

        } catch (error) {
            console.error('Error showing problematic dashboard:', error);
            return await this.sendMessage(chatId, sock, `${EMOJIS.ERROR} Gagal menampilkan alamat bermasalah`);
        }
    }

    /**
     * Display problematic addresses with management options
     */
    async displayProblematicAddresses(chatId, sock, addresses, userId) {
        let dashboardText = `${EMOJIS.PROBLEMATIC} **ALAMAT BERMASALAH** (${addresses.length})\n\n`;

        // Group by problem severity/type
        const criticalProblems = addresses.filter(addr => 
            addr.problematicReason && addr.problematicReason.includes('ESKALASI')
        );
        const regularProblems = addresses.filter(addr => 
            !addr.problematicReason || !addr.problematicReason.includes('ESKALASI')
        );

        if (criticalProblems.length > 0) {
            dashboardText += `🚨 **MASALAH KRITIS** (${criticalProblems.length})\n`;
            criticalProblems.slice(0, 3).forEach((address, index) => {
                dashboardText += this.formatProblematicAddressPreview(address, index + 1, true);
            });
            dashboardText += '\n';
        }

        if (regularProblems.length > 0) {
            dashboardText += `${EMOJIS.WARNING} **MASALAH REGULER** (${regularProblems.length})\n`;
            regularProblems.slice(0, 5).forEach((address, index) => {
                const number = criticalProblems.length + index + 1;
                dashboardText += this.formatProblematicAddressPreview(address, number, false);
            });
        }

        if (addresses.length > 8) {
            dashboardText += `\n... dan ${addresses.length - 8} alamat lainnya\n`;
        }

        dashboardText += `\n**Pilihan Aksi:**\n`;
        dashboardText += `• Ketik nomor (1-${Math.min(addresses.length, 8)}) untuk detail\n`;
        dashboardText += `• Ketik "semua" untuk melihat semua alamat\n`;
        dashboardText += `• Ketik "filter" untuk filter berdasarkan jenis masalah\n`;
        dashboardText += `• Ketik "statistik" untuk ringkasan masalah`;

        // Store addresses in session
        this.problematicSessions.set(userId, {
            addresses: addresses,
            currentView: 'dashboard',
            lastActivity: Date.now()
        });

        return await this.sendMessage(chatId, sock, dashboardText);
    }

    /**
     * Handle problematic address selection
     */
    async handleProblematicSelection(chatId, sock, selection, userId) {
        const session = this.problematicSessions.get(userId);
        if (!session) {
            return await this.sendMessage(chatId, sock, `${EMOJIS.ERROR} Sesi tidak ditemukan. Ketik /alamat > 3 untuk melihat alamat bermasalah.`);
        }

        session.lastActivity = Date.now();

        // Handle special commands
        if (selection.toLowerCase() === 'semua') {
            return await this.showAllProblematicAddresses(chatId, sock, userId);
        }

        if (selection.toLowerCase() === 'filter') {
            return await this.showProblemFilters(chatId, sock, userId);
        }

        if (selection.toLowerCase() === 'statistik') {
            return await this.showProblematicStatistics(chatId, sock, userId);
        }

        // Handle numeric selection
        const selectionNum = parseInt(selection);
        if (isNaN(selectionNum) || selectionNum < 1 || selectionNum > session.addresses.length) {
            return await this.sendMessage(chatId, sock, `${EMOJIS.ERROR} Pilihan tidak valid. Ketik nomor 1-${session.addresses.length}`);
        }

        const selectedAddress = session.addresses[selectionNum - 1];
        return await this.showProblematicAddressDetails(chatId, sock, selectedAddress, userId);
    }

    /**
     * Show detailed problematic address with resolution options
     */
    async showProblematicAddressDetails(chatId, sock, address, userId) {
        let detailText = `${EMOJIS.PROBLEMATIC} **ALAMAT BERMASALAH - DETAIL**\n\n`;
        detailText += formatAddressForDisplay(address, true);

        // Show problem details
        detailText += `\n🚨 **DETAIL MASALAH:**\n`;
        detailText += `**Alasan:** ${address.problematicReason}\n`;
        
        if (address.tags && address.tags.includes('escalated_problem')) {
            detailText += `**Status:** DIESKALASI 🚨\n`;
        }

        // Show problem history if available
        try {
            const historyResult = await this.addressService.getAddressHistory(address.id);
            if (historyResult.success) {
                const problemHistory = historyResult.data.history.filter(h => 
                    h.action === 'marked_problematic' || h.action === 'escalated'
                );
                
                if (problemHistory.length > 0) {
                    detailText += `**Riwayat Masalah:**\n`;
                    problemHistory.slice(0, 3).forEach(entry => {
                        detailText += `• ${formatDate(entry.timestamp)}: ${entry.reason}\n`;
                    });
                }
            }
        } catch (error) {
            // Ignore history error
        }

        // Show resolution options
        detailText += `\n**OPSI PENYELESAIAN:**\n`;
        detailText += `1️⃣ ${EMOJIS.SUCCESS} Tandai sebagai diselesaikan\n`;
        detailText += `2️⃣ ${EMOJIS.EDIT} Edit alamat untuk perbaikan\n`;
        detailText += `3️⃣ 🚨 Eskalasi masalah\n`;
        detailText += `4️⃣ 📋 Tambah catatan masalah\n`;
        detailText += `5️⃣ 📞 Hubungi pelanggan\n`;
        detailText += `6️⃣ 📊 Lihat riwayat lengkap\n`;
        detailText += `7️⃣ 🔙 Kembali ke daftar\n\n`;
        detailText += `Ketik nomor pilihan:`;

        // Store current address in session
        const session = this.problematicSessions.get(userId);
        session.currentAddress = address;
        session.currentView = 'details';

        return await this.sendMessage(chatId, sock, detailText);
    }

    /**
     * Handle problematic address action
     */
    async handleProblematicAction(chatId, sock, action, userId) {
        const session = this.problematicSessions.get(userId);
        if (!session || !session.currentAddress) {
            return await this.sendMessage(chatId, sock, `${EMOJIS.ERROR} Alamat tidak ditemukan.`);
        }

        const address = session.currentAddress;
        session.lastActivity = Date.now();

        switch (action) {
            case '1':
                return await this.startResolutionWorkflow(chatId, sock, address, userId);
            
            case '2':
                return await this.startAddressCorrection(chatId, sock, address, userId);
            
            case '3':
                return await this.startEscalationWorkflow(chatId, sock, address, userId);
            
            case '4':
                return await this.startAddNoteWorkflow(chatId, sock, address, userId);
            
            case '5':
                return await this.showCustomerContactInfo(chatId, sock, address, userId);
            
            case '6':
                return await this.showFullHistory(chatId, sock, address, userId);
            
            case '7':
                return await this.showProblematicDashboard(chatId, sock, userId);
            
            default:
                return await this.sendMessage(chatId, sock, `${EMOJIS.ERROR} Pilihan tidak valid. Ketik nomor 1-7`);
        }
    }

    /**
     * Start resolution workflow
     */
    async startResolutionWorkflow(chatId, sock, address, userId) {
        const session = this.problematicSessions.get(userId);
        session.currentFlow = 'resolution';
        session.flowStep = 'confirm';

        const confirmText = `${EMOJIS.SUCCESS} **KONFIRMASI PENYELESAIAN MASALAH**

Alamat: ${address.customerName}
Masalah: ${address.problematicReason}

Apakah masalah sudah benar-benar diselesaikan?

• Ketik "ya" untuk menandai sebagai diselesaikan
• Ketik "catatan" untuk menambah catatan penyelesaian
• Ketik "batal" untuk membatalkan`;

        return await this.sendMessage(chatId, sock, confirmText);
    }

    /**
     * Handle resolution workflow input
     */
    async handleResolutionInput(chatId, sock, input, userId) {
        const session = this.problematicSessions.get(userId);
        const address = session.currentAddress;

        if (input.toLowerCase() === 'ya') {
            return await this.resolveProblematicAddress(chatId, sock, address, userId, 'Masalah diselesaikan');
        }

        if (input.toLowerCase() === 'catatan') {
            session.flowStep = 'add_note';
            return await this.sendMessage(chatId, sock, `${EMOJIS.NOTES} Masukkan catatan penyelesaian:`);
        }

        if (input.toLowerCase() === 'batal') {
            session.currentFlow = null;
            return await this.showProblematicAddressDetails(chatId, sock, address, userId);
        }

        if (session.flowStep === 'add_note') {
            return await this.resolveProblematicAddress(chatId, sock, address, userId, input);
        }

        return await this.sendMessage(chatId, sock, `${EMOJIS.ERROR} Ketik "ya", "catatan", atau "batal"`);
    }

    /**
     * Resolve problematic address
     */
    async resolveProblematicAddress(chatId, sock, address, userId, resolutionNotes) {
        try {
            const result = await this.statusManager.manageProblematicAddress(
                address.id,
                'resolve_problem',
                { resolutionNotes },
                userId
            );

            if (!result.success) {
                return await this.sendMessage(chatId, sock, `${EMOJIS.ERROR} Gagal menyelesaikan masalah: ${result.error.message}`);
            }

            // Clear session flow
            const session = this.problematicSessions.get(userId);
            session.currentFlow = null;
            session.flowStep = null;

            const successText = `${EMOJIS.SUCCESS} **MASALAH BERHASIL DISELESAIKAN!**

Alamat: ${address.customerName}
Status: Terverifikasi ✅
Catatan: ${resolutionNotes}

Alamat sekarang dapat digunakan kembali untuk pengiriman.`;

            return await this.sendMessage(chatId, sock, successText);

        } catch (error) {
            console.error('Error resolving problematic address:', error);
            return await this.sendMessage(chatId, sock, `${EMOJIS.ERROR} Gagal menyelesaikan masalah: ${error.message}`);
        }
    }

    /**
     * Start escalation workflow
     */
    async startEscalationWorkflow(chatId, sock, address, userId) {
        const session = this.problematicSessions.get(userId);
        session.currentFlow = 'escalation';
        session.flowStep = 'reason';

        const escalationText = `🚨 **ESKALASI MASALAH**

Alamat: ${address.customerName}
Masalah saat ini: ${address.problematicReason}

Masukkan alasan eskalasi dan detail tambahan:

💡 *Contoh:*
• Pelanggan tidak dapat dihubungi berkali-kali
• Alamat tidak ditemukan setelah beberapa kali percobaan
• Masalah keamanan di lokasi`;

        return await this.sendMessage(chatId, sock, escalationText);
    }

    /**
     * Handle escalation input
     */
    async handleEscalationInput(chatId, sock, input, userId) {
        const session = this.problematicSessions.get(userId);
        const address = session.currentAddress;

        try {
            const result = await this.statusManager.manageProblematicAddress(
                address.id,
                'escalate_problem',
                { escalationNotes: input },
                userId
            );

            if (!result.success) {
                return await this.sendMessage(chatId, sock, `${EMOJIS.ERROR} Gagal mengeskalasi masalah: ${result.error.message}`);
            }

            // Clear session flow
            session.currentFlow = null;
            session.flowStep = null;

            const successText = `🚨 **MASALAH BERHASIL DIESKALASI**

Alamat: ${address.customerName}
Catatan eskalasi: ${input}

Masalah telah diteruskan ke supervisor untuk penanganan lebih lanjut.`;

            return await this.sendMessage(chatId, sock, successText);

        } catch (error) {
            console.error('Error escalating problem:', error);
            return await this.sendMessage(chatId, sock, `${EMOJIS.ERROR} Gagal mengeskalasi masalah: ${error.message}`);
        }
    }

    /**
     * Show customer contact information
     */
    async showCustomerContactInfo(chatId, sock, address, userId) {
        const contactText = `${EMOJIS.PHONE} **INFORMASI KONTAK PELANGGAN**

**Nama:** ${address.customerName}
**Telepon:** ${this.formatPhoneDisplay(address.customerPhone)}
**Alamat:** ${address.address.street}, ${address.address.city}

**Template Pesan:**
"Halo ${address.customerName}, kami dari kurir pengiriman. Ada kendala dengan alamat pengiriman Anda di ${address.address.street}. Mohon konfirmasi alamat yang benar. Terima kasih."

**Opsi Kontak:**
1️⃣ Salin nomor telepon
2️⃣ Salin template pesan
3️⃣ Tandai sudah dihubungi
4️⃣ Kembali

Ketik nomor pilihan:`;

        return await this.sendMessage(chatId, sock, contactText);
    }

    /**
     * Show problematic statistics
     */
    async showProblematicStatistics(chatId, sock, userId) {
        try {
            const result = await this.addressService.getProblematicAddresses();
            
            if (!result.success) {
                return await this.sendMessage(chatId, sock, `${EMOJIS.ERROR} ${result.error.message}`);
            }

            const addresses = result.data;
            
            // Analyze problems
            const problemTypes = {};
            const escalatedCount = addresses.filter(addr => 
                addr.tags && addr.tags.includes('escalated_problem')
            ).length;

            addresses.forEach(addr => {
                const reason = addr.problematicReason || 'Tidak diketahui';
                const key = reason.substring(0, 30); // Group similar reasons
                problemTypes[key] = (problemTypes[key] || 0) + 1;
            });

            let statsText = `${EMOJIS.STATISTICS} **STATISTIK ALAMAT BERMASALAH**\n\n`;
            statsText += `📊 **Ringkasan:**\n`;
            statsText += `• Total alamat bermasalah: ${addresses.length}\n`;
            statsText += `• Masalah dieskalasi: ${escalatedCount}\n`;
            statsText += `• Masalah reguler: ${addresses.length - escalatedCount}\n\n`;

            if (Object.keys(problemTypes).length > 0) {
                statsText += `🔍 **Jenis Masalah Teratas:**\n`;
                const sortedProblems = Object.entries(problemTypes)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5);

                sortedProblems.forEach(([problem, count]) => {
                    statsText += `• ${problem}... (${count})\n`;
                });
            }

            return await this.sendMessage(chatId, sock, statsText);

        } catch (error) {
            console.error('Error showing problematic statistics:', error);
            return await this.sendMessage(chatId, sock, `${EMOJIS.ERROR} Gagal menampilkan statistik`);
        }
    }

    /**
     * Format problematic address preview
     */
    formatProblematicAddressPreview(address, number, isCritical) {
        const urgencyEmoji = isCritical ? '🚨' : EMOJIS.WARNING;
        let preview = `${number}. ${urgencyEmoji} **${address.customerName}**\n`;
        preview += `   ${EMOJIS.PHONE} ${this.formatPhoneDisplay(address.customerPhone)}\n`;
        preview += `   ${EMOJIS.LOCATION} ${address.address.city}\n`;
        preview += `   💬 ${truncateText(address.problematicReason, 40)}\n\n`;
        
        return preview;
    }

    formatPhoneDisplay(phone) {
        if (!phone) return 'Tidak tersedia';
        if (phone.startsWith('62')) {
            return '0' + phone.substring(2);
        }
        return phone;
    }

    async sendMessage(chatId, sock, text) {
        try {
            await sock.sendMessage(chatId, { text });
            return true;
        } catch (error) {
            console.error('Error sending message:', error);
            return false;
        }
    }

    /**
     * Clean up inactive sessions
     */
    cleanupProblematicSessions() {
        const now = Date.now();
        const timeout = 15 * 60 * 1000; // 15 minutes

        for (const [userId, session] of this.problematicSessions.entries()) {
            if (now - session.lastActivity > timeout) {
                this.problematicSessions.delete(userId);
            }
        }
    }
}

module.exports = AddressProblematicManager;