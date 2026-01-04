/**
 * Address Manager
 * WhatsApp interface handler for address management commands
 */

const AddressService = require('../storage/AddressService');
const AddressStatusManager = require('../storage/AddressStatusManager');
const AddressHistoryLogger = require('../storage/AddressHistoryLogger');
const AddressMessageQueue = require('./addressMessageQueue');
const { 
    COMMANDS, 
    MENU_OPTIONS, 
    EDIT_OPTIONS, 
    EMOJIS, 
    ERROR_MESSAGES,
    SUCCESS_MESSAGES,
    PAGINATION 
} = require('../storage/AddressConstants');
const { 
    formatAddressForDisplay, 
    createNumberedList, 
    formatPaginationDisplay,
    truncateText 
} = require('../storage/AddressUtils');

class AddressManager {
    constructor() {
        this.addressService = new AddressService();
        this.statusManager = new AddressStatusManager(this.addressService.repository);
        this.historyLogger = new AddressHistoryLogger(this.addressService.repository);
        this.messageQueue = new AddressMessageQueue();
        this.userSessions = new Map(); // Store user interaction sessions
        
        // Set message queue for status manager
        this.statusManager.setMessageQueue(this.messageQueue);
    }

    /**
     * Main command handler for address management
     */
    async handleAddressCommand(m, sock, command, args) {
        try {
            const userId = m.sender;
            const chatId = m.chat;

            // Initialize user session if not exists
            if (!this.userSessions.has(userId)) {
                this.userSessions.set(userId, {
                    currentFlow: null,
                    flowData: {},
                    lastActivity: Date.now()
                });
            }

            const session = this.userSessions.get(userId);
            session.lastActivity = Date.now();

            // Handle different commands
            switch (command) {
                case 'alamat':
                    return await this.showAddressMenu(chatId, sock);
                
                case 'cari':
                    return await this.handleSearchCommand(chatId, sock, args.join(' '), userId);
                
                case 'tambah':
                    return await this.startAddAddressFlow(chatId, sock, userId);
                
                case 'edit':
                    return await this.handleEditCommand(chatId, sock, args[0], userId);
                
                case 'batal':
                    return await this.cancelCurrentFlow(chatId, sock, userId);
                
                default:
                    // Check if user is in a flow
                    if (session.currentFlow) {
                        return await this.handleFlowInput(m, sock, userId);
                    }
                    
                    // Check if it's a menu selection
                    if (args.length === 1 && /^\d+$/.test(args[0])) {
                        return await this.handleMenuSelection(chatId, sock, args[0], userId);
                    }
                    
                    return await this.showAddressMenu(chatId, sock);
            }

        } catch (error) {
            console.error('Error in address command handler:', error);
            await this.sendMessage(m.chat, sock, `${EMOJIS.ERROR} Terjadi kesalahan: ${error.message}`);
        }
    }

    /**
     * Show main address management menu
     */
    async showAddressMenu(chatId, sock) {
        const menuText = `${EMOJIS.LOCATION} *MANAJEMEN ALAMAT KURIR*

Pilih menu yang diinginkan:`;

        const menuButtons = [
            {
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                    display_text: `${EMOJIS.SEARCH} Cari Alamat`,
                    id: `menu_search`
                })
            },
            {
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                    display_text: `${EMOJIS.ADD} Tambah Alamat Baru`,
                    id: `menu_add`
                })
            },
            {
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                    display_text: `${EMOJIS.PROBLEMATIC} Alamat Bermasalah`,
                    id: `menu_problematic`
                })
            },
            {
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                    display_text: `${EMOJIS.STATISTICS} Statistik Alamat`,
                    id: `menu_statistics`
                })
            },
            {
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                    display_text: `${EMOJIS.HELP} Bantuan`,
                    id: `menu_help`
                })
            }
        ];

        const interactiveMessage = {
            body: { text: menuText },
            footer: { text: "Depot Minhaqua - Manajemen Alamat" },
            nativeFlowMessage: {
                buttons: menuButtons,
                messageParamsJson: JSON.stringify({
                    from_address_menu: true
                })
            }
        };

        return await this.sendInteractiveMessage(chatId, sock, interactiveMessage);
    }

    /**
     * Handle menu selection
     */
    async handleMenuSelection(chatId, sock, selection, userId) {
        switch (selection) {
            case MENU_OPTIONS.SEARCH:
                return await this.showSearchInterface(chatId, sock, userId);
            
            case MENU_OPTIONS.ADD_NEW:
                return await this.startAddAddressFlow(chatId, sock, userId);
            
            case MENU_OPTIONS.PROBLEMATIC:
                return await this.showProblematicAddresses(chatId, sock, userId);
            
            case MENU_OPTIONS.STATISTICS:
                return await this.showAddressStatistics(chatId, sock, userId);
            
            case MENU_OPTIONS.HELP:
                return await this.showHelpMenu(chatId, sock);
            
            default:
                return await this.sendMessage(chatId, sock, `${EMOJIS.ERROR} Pilihan tidak valid. Ketik /alamat untuk melihat menu.`);
        }
    }

    /**
     * Handle search command
     */
    async handleSearchCommand(chatId, sock, query, userId) {
        if (!query || query.trim().length === 0) {
            return await this.showSearchInterface(chatId, sock, userId);
        }

        try {
            const searchResult = await this.addressService.searchAddresses(query, {
                limit: PAGINATION.DEFAULT_PAGE_SIZE
            });

            if (!searchResult.success) {
                return await this.sendMessage(chatId, sock, `${EMOJIS.ERROR} ${searchResult.error.message}`);
            }

            const addresses = searchResult.data.results;

            if (addresses.length === 0) {
                const noResultText = `${EMOJIS.SEARCH} Tidak ada alamat yang ditemukan untuk "${query}"

${EMOJIS.ADD} Ingin menambah alamat baru? Ketik /tambah`;
                
                return await this.sendMessage(chatId, sock, noResultText);
            }

            return await this.displaySearchResults(chatId, sock, addresses, query, userId);

        } catch (error) {
            console.error('Error in search command:', error);
            return await this.sendMessage(chatId, sock, `${EMOJIS.ERROR} Gagal mencari alamat: ${error.message}`);
        }
    }

    /**
     * Display search results
     */
    async displaySearchResults(chatId, sock, addresses, query, userId) {
        let resultText = `${EMOJIS.SEARCH} *Hasil pencarian "${query}":*\n\n`;

        addresses.forEach((address, index) => {
            const statusEmoji = address.status === 'verified' ? EMOJIS.VERIFIED : 
                               address.isProblematic ? EMOJIS.PROBLEMATIC : EMOJIS.UNVERIFIED;
            
            resultText += `${index + 1}. ${statusEmoji} *${address.customerName}*\n`;
            resultText += `   ${EMOJIS.PHONE} ${address.customerPhone}\n`;
            const addressText = address.address.street || address.address || 'Alamat tidak lengkap';
            const cityText = address.address.city || '';
            resultText += `   ${EMOJIS.LOCATION} ${addressText}${cityText ? ', ' + cityText : ''}\n`;
            
            if (address.notes) {
                resultText += `   ${EMOJIS.NOTES} ${truncateText(address.notes, 50)}\n`;
            }
            
            resultText += '\n';
        });

        // Store search results in session
        const session = this.userSessions.get(userId);
        session.currentFlow = 'search_results';
        session.flowData = { addresses, query };

        // Create buttons for each result (max 6 buttons)
        let buttons = [];
        const maxButtons = Math.min(addresses.length, 5); // Leave space for "Cari Lagi" button
        
        for (let i = 0; i < maxButtons; i++) {
            const address = addresses[i];
            const statusEmoji = address.status === 'verified' ? EMOJIS.VERIFIED : 
                               address.isProblematic ? EMOJIS.PROBLEMATIC : EMOJIS.UNVERIFIED;
            
            buttons.push({
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                    display_text: `${i + 1}. ${statusEmoji} ${truncateText(address.customerName, 20)}`,
                    id: `search_select_${i}`
                })
            });
        }

        // Add "Dapatkan Lokasi" button if address has coordinates
        const hasCoordinates = addresses.some(addr => 
            addr.coordinates && addr.coordinates.latitude && addr.coordinates.longitude
        );
        
        if (hasCoordinates) {
            buttons.push({
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                    display_text: `📍 Dapatkan Lokasi`,
                    id: `search_get_location`
                })
            });
        }

        // Add "Cari Lagi" button
        buttons.push({
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({
                display_text: `🔍 Cari Lagi`,
                id: `search_new_query`
            })
        });

        // If there are more than 5 results, show text fallback
        if (addresses.length > 5) {
            resultText += `\n⚠️ Menampilkan 5 dari ${addresses.length} hasil. Gunakan pencarian lebih spesifik untuk hasil yang lebih akurat.`;
        }

        const interactiveMessage = {
            body: { text: resultText },
            footer: { text: "Pilih alamat untuk melihat detail" },
            nativeFlowMessage: {
                buttons: buttons,
                messageParamsJson: JSON.stringify({
                    from_search_results: true
                })
            }
        };

        return await this.sendInteractiveMessage(chatId, sock, interactiveMessage);
    }

    /**
     * Start add address flow
     */
    async startAddAddressFlow(chatId, sock, userId) {
        const session = this.userSessions.get(userId);
        session.currentFlow = 'add_address';
        session.flowData = {
            step: 'name',
            addressData: {}
        };

        const instructionText = `${EMOJIS.ADD} *TAMBAH ALAMAT BARU*

Langkah 1/6: Masukkan nama pelanggan

${EMOJIS.PERSON} Ketik nama lengkap pelanggan:`;

        return await this.sendMessage(chatId, sock, instructionText);
    }

    /**
     * Handle flow input from user
     */
    async handleFlowInput(m, sock, userId) {
        const session = this.userSessions.get(userId);
        const { currentFlow, flowData } = session;

        // Handle location messages for address flows
        if ((m.type === 'locationMessage' || (m.msg && m.msg.degreesLatitude)) && 
            (currentFlow === 'add_address' || currentFlow === 'edit_address')) {
            return await this.handleLocationInput(m, sock, userId, flowData);
        }

        switch (currentFlow) {
            case 'add_address':
                return await this.handleAddAddressFlow(m, sock, userId, flowData);
            
            case 'edit_address':
                return await this.handleEditAddressFlow(m, sock, userId, flowData);
            
            case 'search_results':
                return await this.handleSearchResultSelection(m, sock, userId, flowData);
            
            case 'report_problem':
                return await this.handleReportProblemFlow(m, sock, userId, flowData);
            
            default:
                return await this.cancelCurrentFlow(m.chat, sock, userId);
        }
    }

    /**
     * Handle add address flow steps
     */
    async handleAddAddressFlow(m, sock, userId, flowData) {
        const input = m.body.trim();
        const { step, addressData } = flowData;

        try {
            switch (step) {
                case 'name':
                    addressData.customerName = input;
                    flowData.step = 'phone';
                    
                    const phoneText = `${EMOJIS.PHONE} Langkah 2/5: Masukkan nomor telepon

Ketik nomor telepon pelanggan (format: 08xxx atau +62xxx):`;
                    
                    return await this.sendMessage(m.chat, sock, phoneText);

                case 'phone':
                    addressData.customerPhone = input;
                    flowData.step = 'location';
                    
                    const locationText = `${EMOJIS.LOCATION} Langkah 3/6: Share lokasi

📍 Silakan share lokasi pelanggan untuk akurasi yang lebih baik.

Ketik "skip" jika tidak bisa share lokasi.`;
                    
                    return await this.sendMessage(m.chat, sock, locationText);

                case 'location':
                    // Location will be handled separately in handleFlowInput
                    // This case handles text input when location is skipped
                    if (input.toLowerCase() === 'skip') {
                        addressData.coordinates = { latitude: null, longitude: null };
                    }
                    flowData.step = 'street';
                    
                    const streetText = `${EMOJIS.LOCATION} Langkah 4/6: Masukkan alamat lengkap

Ketik alamat lengkap (jalan, nomor rumah, RT/RW, patokan):`;
                    
                    return await this.sendMessage(m.chat, sock, streetText);

                case 'street':
                    if (!addressData.address) addressData.address = {};
                    addressData.address.street = input;
                    flowData.step = 'city';
                    
                    const cityText = `${EMOJIS.LOCATION} Langkah 5/6: Masukkan kota/kabupaten

Ketik nama kota atau kabupaten:`;
                    
                    return await this.sendMessage(m.chat, sock, cityText);

                case 'city':
                    addressData.address.city = input;
                    flowData.step = 'notes';
                    
                    const notesText = `${EMOJIS.NOTES} Langkah 6/6: Catatan tambahan (opsional)

Ketik catatan untuk alamat ini (patokan, warna rumah, dll) atau ketik "skip" untuk melewati:`;
                    
                    return await this.sendMessage(m.chat, sock, notesText);

                case 'notes':
                    if (input.toLowerCase() !== 'skip') {
                        addressData.notes = input;
                    }
                    
                    return await this.confirmAndSaveAddress(m.chat, sock, userId, addressData);

                default:
                    return await this.cancelCurrentFlow(m.chat, sock, userId);
            }

        } catch (error) {
            console.error('Error in add address flow:', error);
            return await this.sendMessage(m.chat, sock, `${EMOJIS.ERROR} Terjadi kesalahan: ${error.message}`);
        }
    }

    /**
     * Confirm and save new address
     */
    async confirmAndSaveAddress(chatId, sock, userId, addressData) {
        try {
            // Create address
            const result = await this.addressService.createAddress(addressData, userId);

            if (!result.success) {
                let errorText = `${EMOJIS.ERROR} Gagal menyimpan alamat:\n${result.error.message}`;
                
                if (result.error.code === 'DUPLICATE_ADDRESS' && result.error.existingAddress) {
                    errorText += `\n\nAlamat serupa sudah ada:\n${formatAddressForDisplay(result.error.existingAddress, false)}`;
                }
                
                return await this.sendMessage(chatId, sock, errorText);
            }

            // Clear session
            this.userSessions.get(userId).currentFlow = null;
            this.userSessions.get(userId).flowData = {};

            // Queue notifications
            this.messageQueue.queueAddressCreationNotification(sock, result.data, userId);
            
            if (result.duplicateWarning) {
                this.messageQueue.queueDuplicateAddressWarning(
                    sock, 
                    result.data, 
                    result.duplicateWarning.existingAddress, 
                    userId
                );
            }

            let successText = `${EMOJIS.SUCCESS} ${result.message}\n\n`;
            successText += formatAddressForDisplay(result.data, true);
            
            if (result.duplicateWarning) {
                successText += `\n\n${EMOJIS.WARNING} Peringatan: Ada alamat serupa yang sudah ada`;
            }

            return await this.sendMessage(chatId, sock, successText);

        } catch (error) {
            console.error('Error saving address:', error);
            return await this.sendMessage(chatId, sock, `${EMOJIS.ERROR} Gagal menyimpan alamat: ${error.message}`);
        }
    }

    /**
     * Handle search result selection
     */
    async handleSearchResultSelection(m, sock, userId, flowData) {
        const input = m.body.trim();
        const selection = parseInt(input);

        if (isNaN(selection) || selection < 1 || selection > flowData.addresses.length) {
            return await this.sendMessage(m.chat, sock, `${EMOJIS.ERROR} Pilihan tidak valid. Ketik nomor 1-${flowData.addresses.length}`);
        }

        const selectedAddress = flowData.addresses[selection - 1];
        
        // Clear search session
        this.userSessions.get(userId).currentFlow = null;
        this.userSessions.get(userId).flowData = {};

        return await this.showAddressDetails(m.chat, sock, selectedAddress, userId);
    }

    /**
     * Show detailed address information with action options
     */
    async showAddressDetails(chatId, sock, address, userId) {
        let detailText = `${EMOJIS.LOCATION} *DETAIL ALAMAT*\n\n`;
        detailText += formatAddressForDisplay(address, true);

        // Store address in session for actions
        const session = this.userSessions.get(userId);
        session.currentFlow = 'address_actions';
        session.flowData = { address };

        // Create interactive buttons
        let buttons = [
            {
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                    display_text: `${EMOJIS.EDIT} Edit Alamat`,
                    id: `addr_edit_${address.id}`
                })
            },
            {
                name: "quick_reply", 
                buttonParamsJson: JSON.stringify({
                    display_text: `${EMOJIS.VERIFIED} Verifikasi Alamat`,
                    id: `addr_verify_${address.id}`
                })
            },
            {
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                    display_text: `${EMOJIS.PROBLEMATIC} Tandai Bermasalah`,
                    id: `addr_problem_${address.id}`
                })
            }
        ];

        // Add more buttons in second row
        let moreButtons = [
            {
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                    display_text: `📋 Lihat Riwayat`,
                    id: `addr_history_${address.id}`
                })
            },
            {
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                    display_text: `📦 Gunakan Alamat`,
                    id: `addr_use_${address.id}`
                })
            },
            {
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                    display_text: `🔍 Cari Lagi`,
                    id: `addr_search_new`
                })
            }
        ];

        // Combine all buttons
        buttons = buttons.concat(moreButtons);

        const interactiveMessage = {
            body: { text: detailText },
            footer: { text: "Pilih aksi yang ingin dilakukan" },
            nativeFlowMessage: {
                buttons: buttons,
                messageParamsJson: JSON.stringify({
                    from_address_management: true
                })
            }
        };

        return await this.sendInteractiveMessage(chatId, sock, interactiveMessage);
    }

    /**
     * Show search interface
     */
    async showSearchInterface(chatId, sock, userId) {
        const searchText = `${EMOJIS.SEARCH} *PENCARIAN ALAMAT*

Ketik kata kunci untuk mencari alamat:
• Nama pelanggan
• Nomor telepon
• Alamat atau nama jalan
• Nama kota

Contoh: \`.cari John\` atau \`.cari 081234567890\``;

        return await this.sendMessage(chatId, sock, searchText);
    }

    /**
     * Show problematic addresses
     */
    async showProblematicAddresses(chatId, sock, userId) {
        try {
            const result = await this.addressService.getProblematicAddresses();
            
            if (!result.success) {
                return await this.sendMessage(chatId, sock, `${EMOJIS.ERROR} ${result.error.message}`);
            }

            const addresses = result.data;

            if (addresses.length === 0) {
                return await this.sendMessage(chatId, sock, `${EMOJIS.SUCCESS} Tidak ada alamat bermasalah saat ini.`);
            }

            let problematicText = `${EMOJIS.PROBLEMATIC} *ALAMAT BERMASALAH* (${addresses.length})\n\n`;

            addresses.slice(0, 5).forEach((address, index) => {
                problematicText += `${index + 1}. *${address.customerName}*\n`;
                problematicText += `   ${EMOJIS.PHONE} ${address.customerPhone}\n`;
                problematicText += `   ${EMOJIS.LOCATION} ${address.address.street}, ${address.address.city}\n`;
                problematicText += `   ${EMOJIS.WARNING} ${address.problematicReason}\n\n`;
            });

            if (addresses.length > 5) {
                problematicText += `... dan ${addresses.length - 5} alamat lainnya`;
            }

            return await this.sendMessage(chatId, sock, problematicText);

        } catch (error) {
            console.error('Error showing problematic addresses:', error);
            return await this.sendMessage(chatId, sock, `${EMOJIS.ERROR} Gagal mengambil alamat bermasalah`);
        }
    }

    /**
     * Show address statistics
     */
    async showAddressStatistics(chatId, sock, userId) {
        try {
            const result = await this.addressService.getStatistics();
            
            if (!result.success) {
                return await this.sendMessage(chatId, sock, `${EMOJIS.ERROR} ${result.error.message}`);
            }

            const stats = result.data;

            const statsText = `${EMOJIS.STATISTICS} *STATISTIK ALAMAT*

📊 Total Alamat: ${stats.total}
${EMOJIS.VERIFIED} Terverifikasi: ${stats.verified}
${EMOJIS.UNVERIFIED} Belum Verifikasi: ${stats.unverified}
${EMOJIS.PROBLEMATIC} Bermasalah: ${stats.problematic}

📈 Tingkat Verifikasi: ${stats.total > 0 ? ((stats.verified / stats.total) * 100).toFixed(1) : 0}%`;

            return await this.sendMessage(chatId, sock, statsText);

        } catch (error) {
            console.error('Error showing statistics:', error);
            return await this.sendMessage(chatId, sock, `${EMOJIS.ERROR} Gagal mengambil statistik`);
        }
    }

    /**
     * Show help menu
     */
    async showHelpMenu(chatId, sock) {
        const helpText = `${EMOJIS.HELP} *BANTUAN MANAJEMEN ALAMAT*

*Perintah Utama:*
• \`.alamat\` - Menu utama
• \`.cari [kata kunci]\` - Cari alamat
• \`.tambah\` - Tambah alamat baru
• \`.edit [id]\` - Edit alamat
• \`.batal\` - Batalkan operasi

*Tips Pencarian:*
• Gunakan nama lengkap atau sebagian
• Nomor telepon bisa 08xxx atau +62xxx
• Cari berdasarkan nama jalan atau kota
• Hasil diurutkan berdasarkan relevansi

*Status Alamat:*
${EMOJIS.VERIFIED} Terverifikasi - Alamat sudah dikonfirmasi
${EMOJIS.UNVERIFIED} Belum Verifikasi - Alamat baru
${EMOJIS.PROBLEMATIC} Bermasalah - Ada masalah dengan alamat

Butuh bantuan lebih lanjut? Hubungi admin.`;

        return await this.sendMessage(chatId, sock, helpText);
    }

    /**
     * Cancel current flow
     */
    async cancelCurrentFlow(chatId, sock, userId) {
        const session = this.userSessions.get(userId);
        session.currentFlow = null;
        session.flowData = {};

        return await this.sendMessage(chatId, sock, `${EMOJIS.SUCCESS} Operasi dibatalkan. Ketik /alamat untuk menu utama.`);
    }

    /**
     * Send message helper
     */
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
     * Send interactive message with buttons
     */
    async sendInteractiveMessage(chatId, sock, interactiveMessage) {
        try {
            await sock.sendMessage(chatId, {
                viewOnceMessage: {
                    message: {
                        messageContextInfo: {
                            deviceListMetadata: {},
                            deviceListMetadataVersion: 2
                        },
                        interactiveMessage: interactiveMessage
                    }
                }
            });
            return true;
        } catch (error) {
            console.error('Error sending interactive message:', error);
            // Fallback to text message
            return await this.sendMessage(chatId, sock, interactiveMessage.body.text);
        }
    }

    /**
     * Handle button responses
     */
    async handleButtonResponse(m, sock, buttonId) {
        try {
            const userId = m.sender;
            const chatId = m.chat;

            // Parse button ID
            const parts = buttonId.split('_');
            const action = parts[0];
            const subAction = parts[1];
            const param = parts[2];

            // Handle menu buttons
            if (action === 'menu') {
                switch (subAction) {
                    case 'search':
                        return await this.showSearchInterface(chatId, sock, userId);
                    case 'add':
                        return await this.startAddAddressFlow(chatId, sock, userId);
                    case 'problematic':
                        return await this.showProblematicAddresses(chatId, sock, userId);
                    case 'statistics':
                        return await this.showAddressStatistics(chatId, sock, userId);
                    case 'help':
                        return await this.showHelpMenu(chatId, sock);
                    default:
                        return false;
                }
            }

            // Handle search result selection
            if (action === 'search') {
                if (subAction === 'select') {
                    const session = this.userSessions.get(userId);
                    if (session && session.flowData && session.flowData.addresses) {
                        const index = parseInt(param);
                        const selectedAddress = session.flowData.addresses[index];
                        
                        // Clear search session
                        session.currentFlow = null;
                        session.flowData = {};
                        
                        return await this.showAddressDetails(chatId, sock, selectedAddress, userId);
                    }
                }
                if (subAction === 'new') {
                    return await this.showSearchInterface(chatId, sock, userId);
                }
                if (subAction === 'get' && param === 'location') {
                    return await this.handleGetLocationFromSearch(chatId, sock, userId);
                }
                if (subAction === 'back' && param === 'results') {
                    return await this.handleBackToSearchResults(chatId, sock, userId);
                }
                return false;
            }

            // Handle edit field selection
            if (action === 'edit') {
                if (subAction === 'field') {
                    return await this.handleEditFieldSelection(chatId, sock, param, userId);
                }
                if (subAction === 'cancel') {
                    return await this.cancelCurrentFlow(chatId, sock, userId);
                }
                return false;
            }

            // Handle location buttons
            if (action === 'location') {
                if (subAction === 'send') {
                    return await this.handleSendLocationButton(chatId, sock, param, userId);
                }
                return false;
            }

            // Handle address action buttons
            if (action === 'addr') {
                switch (subAction) {
                    case 'edit':
                        return await this.handleEditAddressButton(chatId, sock, param, userId);
                    
                    case 'verify':
                        return await this.handleVerifyAddressButton(chatId, sock, param, userId);
                    
                    case 'problem':
                        return await this.handleProblemAddressButton(chatId, sock, param, userId);
                    
                    case 'history':
                        return await this.handleHistoryAddressButton(chatId, sock, param, userId);
                    
                    case 'use':
                        return await this.handleUseAddressButton(chatId, sock, param, userId);
                    
                    case 'search':
                        if (param === 'new') {
                            return await this.showSearchInterface(chatId, sock, userId);
                        }
                        break;
                    
                    default:
                        return false;
                }
            }

            return false;
        } catch (error) {
            console.error('Error handling button response:', error);
            await this.sendMessage(m.chat, sock, `${EMOJIS.ERROR} Terjadi kesalahan: ${error.message}`);
            return false;
        }
    }

    /**
     * Handle edit field selection
     */
    async handleEditFieldSelection(chatId, sock, field, userId) {
        const session = this.userSessions.get(userId);
        if (!session || !session.flowData || !session.flowData.address) {
            return await this.sendMessage(chatId, sock, `${EMOJIS.ERROR} Sesi edit tidak ditemukan`);
        }

        session.flowData.editField = field;
        session.flowData.step = 'input_value';

        let promptText = '';
        switch (field) {
            case 'name':
                promptText = `${EMOJIS.PERSON} Masukkan nama baru:\n\nNama saat ini: ${session.flowData.address.customerName}`;
                break;
            case 'phone':
                promptText = `${EMOJIS.PHONE} Masukkan nomor telepon baru:\n\nNomor saat ini: ${session.flowData.address.customerPhone}`;
                break;
            case 'address':
                session.flowData.step = 'edit_location';
                promptText = `${EMOJIS.LOCATION} Update alamat dan lokasi

📍 Silakan share lokasi baru terlebih dahulu untuk akurasi yang lebih baik.

Ketik "skip" jika tidak ingin mengubah lokasi.`;
                break;
            case 'notes':
                promptText = `${EMOJIS.NOTES} Masukkan catatan baru:\n\nCatatan saat ini: ${session.flowData.address.notes || 'Tidak ada'}`;
                break;
            default:
                return await this.sendMessage(chatId, sock, `${EMOJIS.ERROR} Field tidak valid`);
        }

        return await this.sendMessage(chatId, sock, promptText);
    }

    /**
     * Handle edit address button
     */
    async handleEditAddressButton(chatId, sock, addressId, userId) {
        try {
            const address = await this.addressService.getAddress(addressId);
            
            if (!address.success) {
                return await this.sendMessage(chatId, sock, `${EMOJIS.ERROR} Alamat tidak ditemukan`);
            }

            // Start edit flow
            const session = this.userSessions.get(userId);
            session.currentFlow = 'edit_address';
            session.flowData = {
                address: address.data.address,
                step: 'select_field'
            };

            let editText = `${EMOJIS.EDIT} *EDIT ALAMAT*\n\n`;
            editText += `Alamat saat ini:\n${formatAddressForDisplay(address.data.address, false)}\n\n`;

            const editButtons = [
                {
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({
                        display_text: `${EMOJIS.PERSON} Edit Nama`,
                        id: `edit_field_name`
                    })
                },
                {
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({
                        display_text: `${EMOJIS.PHONE} Edit Telepon`,
                        id: `edit_field_phone`
                    })
                },
                {
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({
                        display_text: `${EMOJIS.LOCATION} Edit Alamat & Lokasi`,
                        id: `edit_field_address`
                    })
                },
                {
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({
                        display_text: `${EMOJIS.NOTES} Edit Catatan`,
                        id: `edit_field_notes`
                    })
                },
                {
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({
                        display_text: `❌ Batal`,
                        id: `edit_cancel`
                    })
                }
            ];

            const interactiveMessage = {
                body: { text: editText },
                footer: { text: "Pilih field yang ingin diedit" },
                nativeFlowMessage: {
                    buttons: editButtons,
                    messageParamsJson: JSON.stringify({
                        from_address_edit: true
                    })
                }
            };

            return await this.sendInteractiveMessage(chatId, sock, interactiveMessage);

        } catch (error) {
            console.error('Error in edit address button:', error);
            return await this.sendMessage(chatId, sock, `${EMOJIS.ERROR} Gagal memulai edit alamat`);
        }
    }

    /**
     * Handle verify address button
     */
    async handleVerifyAddressButton(chatId, sock, addressId, userId) {
        try {
            const result = await this.addressService.verifyAddress(addressId, userId);
            
            if (!result.success) {
                return await this.sendMessage(chatId, sock, `${EMOJIS.ERROR} ${result.error.message}`);
            }

            let successText = `${EMOJIS.SUCCESS} ${result.message}\n\n`;
            successText += formatAddressForDisplay(result.data, false);

            return await this.sendMessage(chatId, sock, successText);

        } catch (error) {
            console.error('Error verifying address:', error);
            return await this.sendMessage(chatId, sock, `${EMOJIS.ERROR} Gagal memverifikasi alamat`);
        }
    }

    /**
     * Handle problem address button
     */
    async handleProblemAddressButton(chatId, sock, addressId, userId) {
        try {
            // Start problem reporting flow
            const session = this.userSessions.get(userId);
            session.currentFlow = 'report_problem';
            session.flowData = { addressId };

            const problemText = `${EMOJIS.PROBLEMATIC} *LAPORKAN MASALAH ALAMAT*\n\nKetik alasan mengapa alamat ini bermasalah:\n\nContoh:\n• Alamat tidak lengkap\n• Nomor rumah salah\n• Tidak ada yang mengenal\n• Alamat sudah pindah`;

            return await this.sendMessage(chatId, sock, problemText);

        } catch (error) {
            console.error('Error in problem address button:', error);
            return await this.sendMessage(chatId, sock, `${EMOJIS.ERROR} Gagal memulai laporan masalah`);
        }
    }

    /**
     * Handle history address button
     */
    async handleHistoryAddressButton(chatId, sock, addressId, userId) {
        try {
            const result = await this.addressService.getAddressHistory(addressId);
            
            if (!result.success) {
                return await this.sendMessage(chatId, sock, `${EMOJIS.ERROR} ${result.error.message}`);
            }

            const { address, history } = result.data;
            
            let historyText = `📋 *RIWAYAT ALAMAT*\n\n`;
            historyText += `${formatAddressForDisplay(address, false)}\n\n`;
            
            if (history.length === 0) {
                historyText += `${EMOJIS.INFO} Belum ada riwayat untuk alamat ini.`;
            } else {
                historyText += `*Riwayat Aktivitas:*\n`;
                history.slice(0, 5).forEach((entry, index) => {
                    const date = new Date(entry.timestamp).toLocaleDateString('id-ID');
                    historyText += `${index + 1}. ${entry.action} - ${date}\n`;
                    if (entry.reason) {
                        historyText += `   Alasan: ${entry.reason}\n`;
                    }
                });
                
                if (history.length > 5) {
                    historyText += `\n... dan ${history.length - 5} aktivitas lainnya`;
                }
            }

            return await this.sendMessage(chatId, sock, historyText);

        } catch (error) {
            console.error('Error showing address history:', error);
            return await this.sendMessage(chatId, sock, `${EMOJIS.ERROR} Gagal mengambil riwayat alamat`);
        }
    }

    /**
     * Handle use address button
     */
    async handleUseAddressButton(chatId, sock, addressId, userId) {
        try {
            const result = await this.addressService.useAddress(addressId, userId);
            
            if (!result.success) {
                return await this.sendMessage(chatId, sock, `${EMOJIS.ERROR} ${result.error.message}`);
            }

            let useText = `${EMOJIS.SUCCESS} Alamat berhasil digunakan!\n\n`;
            useText += formatAddressForDisplay(result.data, false);
            useText += `\n\n📊 Total penggunaan: ${result.data.usageCount} kali`;

            return await this.sendMessage(chatId, sock, useText);

        } catch (error) {
            console.error('Error using address:', error);
            return await this.sendMessage(chatId, sock, `${EMOJIS.ERROR} Gagal menggunakan alamat`);
        }
    }

    /**
     * Handle edit address flow
     */
    async handleEditAddressFlow(m, sock, userId, flowData) {
        const input = m.body.trim();
        const { address, editField, step } = flowData;

        if (step === 'input_value') {
            try {
                let updates = {};
                
                switch (editField) {
                    case 'name':
                        updates.customerName = input;
                        break;
                    case 'phone':
                        updates.customerPhone = input;
                        break;
                    case 'notes':
                        updates.notes = input;
                        break;
                    default:
                        return await this.sendMessage(m.chat, sock, `${EMOJIS.ERROR} Field tidak valid`);
                }

                const result = await this.addressService.updateAddress(address.id, updates, userId);
                
                // Clear session
                this.userSessions.get(userId).currentFlow = null;
                this.userSessions.get(userId).flowData = {};

                if (!result.success) {
                    return await this.sendMessage(m.chat, sock, `${EMOJIS.ERROR} ${result.error.message}`);
                }

                let successText = `${EMOJIS.SUCCESS} ${result.message}\n\n`;
                successText += formatAddressForDisplay(result.data, false);

                return await this.sendMessage(m.chat, sock, successText);

            } catch (error) {
                console.error('Error in edit address flow:', error);
                return await this.sendMessage(m.chat, sock, `${EMOJIS.ERROR} Gagal mengupdate alamat: ${error.message}`);
            }
        } else if (step === 'edit_location') {
            // Handle location skip
            if (input.toLowerCase() === 'skip') {
                flowData.step = 'edit_street';
                
                const editStreetText = `${EMOJIS.LOCATION} Masukkan alamat lengkap baru:

Alamat saat ini: ${address.address.street || address.address}

Ketik alamat lengkap baru:`;
                
                return await this.sendMessage(m.chat, sock, editStreetText);
            }
        } else if (step === 'edit_street') {
            try {
                let updates = {
                    address: { ...address.address, street: input }
                };

                // Add coordinates if provided
                if (flowData.newCoordinates) {
                    updates.coordinates = flowData.newCoordinates;
                }

                const result = await this.addressService.updateAddress(address.id, updates, userId);
                
                // Clear session
                this.userSessions.get(userId).currentFlow = null;
                this.userSessions.get(userId).flowData = {};

                if (!result.success) {
                    return await this.sendMessage(m.chat, sock, `${EMOJIS.ERROR} ${result.error.message}`);
                }

                let successText = `${EMOJIS.SUCCESS} Alamat berhasil diupdate!\n\n`;
                successText += formatAddressForDisplay(result.data, false);

                if (flowData.newCoordinates) {
                    successText += `\n\n📍 Koordinat: ${flowData.newCoordinates.latitude.toFixed(6)}, ${flowData.newCoordinates.longitude.toFixed(6)}`;
                }

                return await this.sendMessage(m.chat, sock, successText);

            } catch (error) {
                console.error('Error updating address:', error);
                return await this.sendMessage(m.chat, sock, `${EMOJIS.ERROR} Gagal mengupdate alamat: ${error.message}`);
            }
        }

        return await this.cancelCurrentFlow(m.chat, sock, userId);
    }

    /**
     * Handle report problem flow
     */
    async handleReportProblemFlow(m, sock, userId, flowData) {
        const input = m.body.trim();
        const { addressId } = flowData;

        try {
            const result = await this.addressService.markAddressAsProblematic(addressId, input, userId);
            
            // Clear session
            this.userSessions.get(userId).currentFlow = null;
            this.userSessions.get(userId).flowData = {};

            if (!result.success) {
                return await this.sendMessage(m.chat, sock, `${EMOJIS.ERROR} ${result.error.message}`);
            }

            let successText = `${EMOJIS.SUCCESS} ${result.message}\n\n`;
            successText += `Alasan: ${input}`;

            return await this.sendMessage(m.chat, sock, successText);

        } catch (error) {
            console.error('Error in report problem flow:', error);
            return await this.sendMessage(m.chat, sock, `${EMOJIS.ERROR} Gagal melaporkan masalah: ${error.message}`);
        }
    }

    /**
     * Handle location input for address flows
     */
    async handleLocationInput(m, sock, userId, flowData) {
        try {
            const latitude = m.msg.degreesLatitude;
            const longitude = m.msg.degreesLongitude;

            if (flowData.step === 'location') {
                // Add address flow
                flowData.addressData.coordinates = { latitude, longitude };
                flowData.step = 'street';
                
                const streetText = `${EMOJIS.SUCCESS} Lokasi berhasil diterima!
📍 Lat: ${latitude.toFixed(6)}, Long: ${longitude.toFixed(6)}

${EMOJIS.LOCATION} Langkah 4/6: Masukkan alamat lengkap

Ketik alamat lengkap (jalan, nomor rumah, RT/RW, patokan):`;
                
                return await this.sendMessage(m.chat, sock, streetText);
                
            } else if (flowData.step === 'edit_location') {
                // Edit address flow
                flowData.newCoordinates = { latitude, longitude };
                flowData.step = 'edit_street';
                
                const editStreetText = `${EMOJIS.SUCCESS} Lokasi baru berhasil diterima!
📍 Lat: ${latitude.toFixed(6)}, Long: ${longitude.toFixed(6)}

${EMOJIS.LOCATION} Masukkan alamat lengkap baru:

Ketik alamat lengkap (jalan, nomor rumah, RT/RW, patokan):`;
                
                return await this.sendMessage(m.chat, sock, editStreetText);
            }

            return await this.sendMessage(m.chat, sock, `${EMOJIS.ERROR} Lokasi tidak dapat diproses pada tahap ini`);

        } catch (error) {
            console.error('Error handling location input:', error);
            return await this.sendMessage(m.chat, sock, `${EMOJIS.ERROR} Gagal memproses lokasi: ${error.message}`);
        }
    }

    /**
     * Handle get location from search results
     */
    async handleGetLocationFromSearch(chatId, sock, userId) {
        try {
            const session = this.userSessions.get(userId);
            if (!session || !session.flowData || !session.flowData.addresses) {
                return await this.sendMessage(chatId, sock, `${EMOJIS.ERROR} Sesi pencarian tidak ditemukan`);
            }

            const addresses = session.flowData.addresses;
            const addressesWithLocation = addresses.filter(addr => 
                addr.coordinates && addr.coordinates.latitude && addr.coordinates.longitude
            );

            if (addressesWithLocation.length === 0) {
                return await this.sendMessage(chatId, sock, `${EMOJIS.ERROR} Tidak ada alamat dengan koordinat GPS`);
            }

            let locationText = `📍 *LOKASI ALAMAT DITEMUKAN*\n\n`;

            addressesWithLocation.forEach((address, index) => {
                const lat = address.coordinates.latitude;
                const lng = address.coordinates.longitude;
                const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
                
                locationText += `${index + 1}. *${address.customerName}*\n`;
                locationText += `📞 ${address.customerPhone}\n`;
                locationText += `📍 ${address.address.street || address.address}\n`;
                locationText += `🗺️ Koordinat: ${lat.toFixed(6)}, ${lng.toFixed(6)}\n`;
                locationText += `🔗 Maps: ${mapsUrl}\n\n`;
            });

            // Create buttons for each location
            let locationButtons = [];
            
            addressesWithLocation.slice(0, 5).forEach((address, index) => {
                const lat = address.coordinates.latitude;
                const lng = address.coordinates.longitude;
                
                locationButtons.push({
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({
                        display_text: `📍 ${index + 1}. ${truncateText(address.customerName, 15)}`,
                        id: `location_send_${index}`
                    })
                });
            });

            // Add back button
            locationButtons.push({
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                    display_text: `🔙 Kembali`,
                    id: `search_back_results`
                })
            });

            // Store location data in session
            session.flowData.locationsData = addressesWithLocation;

            const interactiveMessage = {
                body: { text: locationText },
                footer: { text: "Pilih lokasi untuk dikirim sebagai location message" },
                nativeFlowMessage: {
                    buttons: locationButtons,
                    messageParamsJson: JSON.stringify({
                        from_location_list: true
                    })
                }
            };

            return await this.sendInteractiveMessage(chatId, sock, interactiveMessage);

        } catch (error) {
            console.error('Error getting location from search:', error);
            return await this.sendMessage(chatId, sock, `${EMOJIS.ERROR} Gagal mengambil lokasi: ${error.message}`);
        }
    }

    /**
     * Handle send location button
     */
    async handleSendLocationButton(chatId, sock, locationIndex, userId) {
        try {
            const session = this.userSessions.get(userId);
            if (!session || !session.flowData || !session.flowData.locationsData) {
                return await this.sendMessage(chatId, sock, `${EMOJIS.ERROR} Data lokasi tidak ditemukan`);
            }

            const index = parseInt(locationIndex);
            const locationsData = session.flowData.locationsData;
            
            if (isNaN(index) || index < 0 || index >= locationsData.length) {
                return await this.sendMessage(chatId, sock, `${EMOJIS.ERROR} Index lokasi tidak valid`);
            }

            const selectedAddress = locationsData[index];
            const lat = selectedAddress.coordinates.latitude;
            const lng = selectedAddress.coordinates.longitude;

            // Send location message
            await sock.sendMessage(chatId, {
                location: {
                    degreesLatitude: lat,
                    degreesLongitude: lng
                }
            });

            // Send follow-up message with address details
            let followUpText = `📍 *LOKASI DIKIRIM*\n\n`;
            followUpText += `👤 ${selectedAddress.customerName}\n`;
            followUpText += `📞 ${selectedAddress.customerPhone}\n`;
            followUpText += `📍 ${selectedAddress.address.street || selectedAddress.address}\n`;
            followUpText += `🗺️ Koordinat: ${lat.toFixed(6)}, ${lng.toFixed(6)}\n`;
            followUpText += `\n✅ Lokasi berhasil dikirim sebagai location message!`;

            return await this.sendMessage(chatId, sock, followUpText);

        } catch (error) {
            console.error('Error sending location:', error);
            return await this.sendMessage(chatId, sock, `${EMOJIS.ERROR} Gagal mengirim lokasi: ${error.message}`);
        }
    }

    /**
     * Handle back to search results
     */
    async handleBackToSearchResults(chatId, sock, userId) {
        try {
            const session = this.userSessions.get(userId);
            if (!session || !session.flowData || !session.flowData.addresses || !session.flowData.query) {
                return await this.sendMessage(chatId, sock, `${EMOJIS.ERROR} Sesi pencarian tidak ditemukan`);
            }

            // Redisplay search results
            return await this.displaySearchResults(
                chatId, 
                sock, 
                session.flowData.addresses, 
                session.flowData.query, 
                userId
            );

        } catch (error) {
            console.error('Error going back to search results:', error);
            return await this.sendMessage(chatId, sock, `${EMOJIS.ERROR} Gagal kembali ke hasil pencarian`);
        }
    }

    /**
     * Clean up inactive sessions
     */
    cleanupSessions() {
        const now = Date.now();
        const timeout = 30 * 60 * 1000; // 30 minutes

        for (const [userId, session] of this.userSessions.entries()) {
            if (now - session.lastActivity > timeout) {
                this.userSessions.delete(userId);
            }
        }
    }
}

module.exports = AddressManager;