/**
 * Address Search Interface
 * Advanced search interface with WhatsApp-friendly interactions
 */

const { 
    EMOJIS, 
    PAGINATION, 
    SEARCH_TYPES,
    ERROR_MESSAGES 
} = require('../storage/AddressConstants');
const { 
    formatAddressForDisplay, 
    createNumberedList, 
    formatPaginationDisplay,
    truncateText,
    parseSearchQuery 
} = require('../storage/AddressUtils');

class AddressSearchInterface {
    constructor(addressService) {
        this.addressService = addressService;
        this.searchSessions = new Map(); // Store search sessions
    }

    /**
     * Handle interactive search with suggestions and filters
     */
    async handleInteractiveSearch(chatId, sock, query, userId, options = {}) {
        try {
            // Parse search query to understand intent
            const queryInfo = parseSearchQuery(query);
            
            // Get search suggestions if query is short
            if (query.length < 3) {
                return await this.showSearchSuggestions(chatId, sock, query, userId);
            }

            // Perform search
            const searchResult = await this.addressService.searchAddresses(query, {
                limit: options.limit || PAGINATION.DEFAULT_PAGE_SIZE,
                offset: options.offset || 0,
                includeProblematic: options.includeProblematic || false
            });

            if (!searchResult.success) {
                return await this.sendMessage(chatId, sock, `${EMOJIS.ERROR} ${searchResult.error.message}`);
            }

            const { results, total, pagination } = searchResult.data;

            // Store search session
            this.searchSessions.set(userId, {
                query: query,
                results: results,
                total: total,
                currentPage: Math.floor(pagination.offset / pagination.limit) + 1,
                totalPages: Math.ceil(total / pagination.limit),
                lastActivity: Date.now()
            });

            if (results.length === 0) {
                return await this.showNoResultsInterface(chatId, sock, query, queryInfo, userId);
            }

            return await this.displaySearchResults(chatId, sock, results, query, pagination, userId);

        } catch (error) {
            console.error('Error in interactive search:', error);
            return await this.sendMessage(chatId, sock, `${EMOJIS.ERROR} Gagal melakukan pencarian: ${error.message}`);
        }
    }

    /**
     * Display search results with interactive options
     */
    async displaySearchResults(chatId, sock, results, query, pagination, userId) {
        let resultText = `${EMOJIS.SEARCH} *Hasil pencarian "${query}"*\n`;
        resultText += `Ditemukan ${pagination.total || results.length} alamat\n\n`;

        // Display results with numbers
        results.forEach((address, index) => {
            const number = (pagination.offset || 0) + index + 1;
            const statusEmoji = this.getStatusEmoji(address);
            
            resultText += `${number}. ${statusEmoji} *${address.customerName}*\n`;
            resultText += `   ${EMOJIS.PHONE} ${this.formatPhoneDisplay(address.customerPhone)}\n`;
            resultText += `   ${EMOJIS.LOCATION} ${this.formatAddressPreview(address.address)}\n`;
            
            if (address.notes) {
                resultText += `   ${EMOJIS.NOTES} ${truncateText(address.notes, 40)}\n`;
            }
            
            if (address.isProblematic) {
                resultText += `   ${EMOJIS.WARNING} ${truncateText(address.problematicReason, 30)}\n`;
            }
            
            resultText += '\n';
        });

        // Add pagination info
        if (pagination.total > pagination.limit) {
            resultText += formatPaginationDisplay({
                currentPage: Math.floor(pagination.offset / pagination.limit) + 1,
                totalPages: Math.ceil(pagination.total / pagination.limit),
                startIndex: pagination.offset,
                endIndex: pagination.offset + results.length,
                totalItems: pagination.total
            });
            resultText += '\n\n';
        }

        // Add interaction options
        resultText += `*Pilihan:*\n`;
        resultText += `• Ketik nomor (${(pagination.offset || 0) + 1}-${(pagination.offset || 0) + results.length}) untuk detail\n`;
        
        if (pagination.hasMore) {
            resultText += `• Ketik "lanjut" untuk halaman berikutnya\n`;
        }
        
        resultText += `• Ketik "filter" untuk opsi filter\n`;
        resultText += `• Ketik "/cari [kata baru]" untuk pencarian baru`;

        return await this.sendMessage(chatId, sock, resultText);
    }

    /**
     * Show search suggestions for short queries
     */
    async showSearchSuggestions(chatId, sock, partialQuery, userId) {
        try {
            const suggestions = await this.addressService.search.getSuggestions(partialQuery, 5);
            
            if (suggestions.length === 0) {
                const suggestionText = `${EMOJIS.SEARCH} Ketik minimal 3 karakter untuk pencarian

*Contoh pencarian:*
• \`.cari John\` - Cari berdasarkan nama
• \`.cari 081234\` - Cari berdasarkan nomor HP
• \`.cari Sudirman\` - Cari berdasarkan alamat
• \`.cari Jakarta\` - Cari berdasarkan kota`;

                return await this.sendMessage(chatId, sock, suggestionText);
            }

            let suggestionText = `${EMOJIS.SEARCH} *Saran pencarian untuk "${partialQuery}":*\n\n`;
            
            suggestions.forEach((suggestion, index) => {
                suggestionText += `${index + 1}. ${suggestion}\n`;
            });

            suggestionText += `\nKetik nomor untuk memilih atau lanjutkan mengetik`;

            return await this.sendMessage(chatId, sock, suggestionText);

        } catch (error) {
            console.error('Error showing suggestions:', error);
            return await this.sendMessage(chatId, sock, `${EMOJIS.ERROR} Gagal menampilkan saran`);
        }
    }

    /**
     * Show no results interface with helpful options
     */
    async showNoResultsInterface(chatId, sock, query, queryInfo, userId) {
        let noResultText = `${EMOJIS.SEARCH} Tidak ada alamat ditemukan untuk "${query}"\n\n`;

        // Provide helpful suggestions based on query type
        if (queryInfo.type === 'phone') {
            noResultText += `${EMOJIS.INFO} Tips pencarian nomor HP:\n`;
            noResultText += `• Coba format berbeda: 08xxx atau +62xxx\n`;
            noResultText += `• Pastikan nomor lengkap dan benar\n\n`;
        } else {
            noResultText += `${EMOJIS.INFO} Tips pencarian:\n`;
            noResultText += `• Coba kata kunci yang lebih pendek\n`;
            noResultText += `• Periksa ejaan nama atau alamat\n`;
            noResultText += `• Coba cari berdasarkan kota saja\n\n`;
        }

        // Show recent addresses as alternatives
        try {
            const recentResult = await this.addressService.getRecentAddresses(userId, 3);
            if (recentResult.success && recentResult.data.length > 0) {
                noResultText += `${EMOJIS.LOCATION} *Alamat terbaru Anda:*\n`;
                recentResult.data.forEach((address, index) => {
                    noResultText += `${index + 1}. ${address.customerName} - ${address.address.city}\n`;
                });
                noResultText += '\n';
            }
        } catch (error) {
            // Ignore error for recent addresses
        }

        noResultText += `*Pilihan:*\n`;
        noResultText += `• ${EMOJIS.ADD} Ketik "/tambah" untuk menambah alamat baru\n`;
        noResultText += `• ${EMOJIS.SEARCH} Ketik "/cari" untuk pencarian baru\n`;
        noResultText += `• Ketik "semua" untuk melihat semua alamat`;

        return await this.sendMessage(chatId, sock, noResultText);
    }

    /**
     * Handle search result selection
     */
    async handleSearchSelection(chatId, sock, selection, userId) {
        const session = this.searchSessions.get(userId);
        if (!session) {
            return await this.sendMessage(chatId, sock, `${EMOJIS.ERROR} Sesi pencarian tidak ditemukan. Ketik /cari untuk pencarian baru.`);
        }

        const selectionNum = parseInt(selection);
        if (isNaN(selectionNum) || selectionNum < 1 || selectionNum > session.results.length) {
            return await this.sendMessage(chatId, sock, `${EMOJIS.ERROR} Pilihan tidak valid. Ketik nomor 1-${session.results.length}`);
        }

        const selectedAddress = session.results[selectionNum - 1];
        
        // Update session activity
        session.lastActivity = Date.now();

        return await this.showAddressDetails(chatId, sock, selectedAddress, userId);
    }

    /**
     * Show detailed address with action options
     */
    async showAddressDetails(chatId, sock, address, userId) {
        let detailText = `${EMOJIS.LOCATION} *DETAIL ALAMAT*\n\n`;
        detailText += formatAddressForDisplay(address, true);

        // Add usage statistics if available
        if (address.usageCount > 0) {
            detailText += `\n📊 *Statistik:*\n`;
            detailText += `• Digunakan: ${address.usageCount} kali\n`;
            
            if (address.lastUsed) {
                detailText += `• Terakhir digunakan: ${this.formatRelativeDate(address.lastUsed)}\n`;
            }
            
            if (address.successfulDeliveries !== undefined) {
                const successRate = address.usageCount > 0 ? 
                    ((address.successfulDeliveries / address.usageCount) * 100).toFixed(1) : 0;
                detailText += `• Tingkat keberhasilan: ${successRate}%\n`;
            }
        }

        // Add action buttons
        detailText += `\n*Aksi yang tersedia:*\n`;
        detailText += `1️⃣ ${EMOJIS.EDIT} Edit alamat\n`;
        detailText += `2️⃣ 📦 Gunakan untuk pengiriman\n`;
        
        if (address.status !== 'verified') {
            detailText += `3️⃣ ${EMOJIS.VERIFIED} Verifikasi alamat\n`;
        }
        
        if (!address.isProblematic) {
            detailText += `4️⃣ ${EMOJIS.PROBLEMATIC} Tandai bermasalah\n`;
        } else {
            detailText += `4️⃣ ${EMOJIS.SUCCESS} Hapus tanda bermasalah\n`;
        }
        
        detailText += `5️⃣ 📋 Lihat riwayat\n`;
        detailText += `6️⃣ 🔙 Kembali ke hasil pencarian`;

        return await this.sendMessage(chatId, sock, detailText);
    }

    /**
     * Handle pagination commands
     */
    async handlePagination(chatId, sock, command, userId) {
        const session = this.searchSessions.get(userId);
        if (!session) {
            return await this.sendMessage(chatId, sock, `${EMOJIS.ERROR} Sesi pencarian tidak ditemukan.`);
        }

        let newOffset = 0;
        const limit = PAGINATION.DEFAULT_PAGE_SIZE;

        switch (command.toLowerCase()) {
            case 'lanjut':
            case 'next':
                newOffset = (session.currentPage) * limit;
                break;
                
            case 'sebelum':
            case 'prev':
                newOffset = Math.max(0, (session.currentPage - 2) * limit);
                break;
                
            default:
                return await this.sendMessage(chatId, sock, `${EMOJIS.ERROR} Perintah tidak dikenal.`);
        }

        // Perform new search with pagination
        return await this.handleInteractiveSearch(chatId, sock, session.query, userId, {
            offset: newOffset,
            limit: limit
        });
    }

    /**
     * Show search filters interface
     */
    async showSearchFilters(chatId, sock, userId) {
        const filterText = `${EMOJIS.SEARCH} *FILTER PENCARIAN*

Pilih filter yang ingin diterapkan:

1️⃣ ${EMOJIS.VERIFIED} Hanya alamat terverifikasi
2️⃣ ${EMOJIS.UNVERIFIED} Hanya alamat belum verifikasi
3️⃣ ${EMOJIS.PROBLEMATIC} Hanya alamat bermasalah
4️⃣ 📅 Berdasarkan tanggal dibuat
5️⃣ 📊 Berdasarkan frekuensi penggunaan
6️⃣ 🏙️ Berdasarkan kota
7️⃣ 🔄 Reset semua filter

Ketik nomor pilihan atau "batal" untuk kembali`;

        return await this.sendMessage(chatId, sock, filterText);
    }

    /**
     * Get quick access addresses (frequent and recent)
     */
    async showQuickAccess(chatId, sock, userId) {
        try {
            const [frequentResult, recentResult] = await Promise.all([
                this.addressService.getFrequentAddresses(userId, 3),
                this.addressService.getRecentAddresses(userId, 3)
            ]);

            let quickAccessText = `${EMOJIS.SEARCH} *AKSES CEPAT ALAMAT*\n\n`;

            // Show frequent addresses
            if (frequentResult.success && frequentResult.data.length > 0) {
                quickAccessText += `📊 *Sering Digunakan:*\n`;
                frequentResult.data.forEach((address, index) => {
                    quickAccessText += `F${index + 1}. ${address.customerName} (${address.usageCount}x)\n`;
                    quickAccessText += `     ${this.formatAddressPreview(address.address)}\n`;
                });
                quickAccessText += '\n';
            }

            // Show recent addresses
            if (recentResult.success && recentResult.data.length > 0) {
                quickAccessText += `⏰ *Terbaru Digunakan:*\n`;
                recentResult.data.forEach((address, index) => {
                    quickAccessText += `R${index + 1}. ${address.customerName}\n`;
                    quickAccessText += `     ${this.formatAddressPreview(address.address)}\n`;
                    quickAccessText += `     ${this.formatRelativeDate(address.lastUsed)}\n`;
                });
                quickAccessText += '\n';
            }

            if ((!frequentResult.success || frequentResult.data.length === 0) && 
                (!recentResult.success || recentResult.data.length === 0)) {
                quickAccessText += `${EMOJIS.INFO} Belum ada alamat yang sering digunakan.\n`;
                quickAccessText += `Mulai gunakan alamat untuk melihat akses cepat.\n\n`;
            }

            quickAccessText += `*Cara menggunakan:*\n`;
            quickAccessText += `• Ketik F1, F2, F3 untuk alamat sering digunakan\n`;
            quickAccessText += `• Ketik R1, R2, R3 untuk alamat terbaru\n`;
            quickAccessText += `• Ketik "/cari" untuk pencarian manual`;

            return await this.sendMessage(chatId, sock, quickAccessText);

        } catch (error) {
            console.error('Error showing quick access:', error);
            return await this.sendMessage(chatId, sock, `${EMOJIS.ERROR} Gagal menampilkan akses cepat`);
        }
    }

    /**
     * Helper methods
     */
    getStatusEmoji(address) {
        if (address.isProblematic) return EMOJIS.PROBLEMATIC;
        if (address.status === 'verified') return EMOJIS.VERIFIED;
        return EMOJIS.UNVERIFIED;
    }

    formatPhoneDisplay(phone) {
        if (!phone) return 'Tidak tersedia';
        if (phone.startsWith('62')) {
            return '0' + phone.substring(2);
        }
        return phone;
    }

    formatAddressPreview(address) {
        if (!address) return 'Alamat tidak lengkap';
        
        let preview = address.street;
        if (address.city) {
            preview += `, ${address.city}`;
        }
        
        return truncateText(preview, 50);
    }

    formatRelativeDate(dateString) {
        if (!dateString) return 'Tidak diketahui';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Hari ini';
        if (diffDays === 1) return 'Kemarin';
        if (diffDays < 7) return `${diffDays} hari lalu`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu lalu`;
        
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short'
        });
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
     * Clean up inactive search sessions
     */
    cleanupSearchSessions() {
        const now = Date.now();
        const timeout = 15 * 60 * 1000; // 15 minutes

        for (const [userId, session] of this.searchSessions.entries()) {
            if (now - session.lastActivity > timeout) {
                this.searchSessions.delete(userId);
            }
        }
    }
}

module.exports = AddressSearchInterface;