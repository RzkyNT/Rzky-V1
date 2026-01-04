/**
 * Address Workflows
 * Step-by-step workflows for address creation and editing
 */

const { 
    EMOJIS, 
    EDIT_OPTIONS,
    SUCCESS_MESSAGES,
    ERROR_MESSAGES 
} = require('../storage/AddressConstants');
const { 
    formatAddressForDisplay, 
    truncateText,
    sanitizeInput 
} = require('../storage/AddressUtils');
const { validateAddressData, ValidationError } = require('../storage/AddressValidation');

class AddressWorkflows {
    constructor(addressService) {
        this.addressService = addressService;
        this.workflowSessions = new Map(); // Store workflow sessions
    }

    /**
     * Start address creation workflow
     */
    async startCreateAddressWorkflow(chatId, sock, userId, initialData = {}) {
        const session = {
            type: 'create',
            step: 'name',
            data: { ...initialData },
            startTime: Date.now(),
            lastActivity: Date.now()
        };

        this.workflowSessions.set(userId, session);

        const welcomeText = `${EMOJIS.ADD} *TAMBAH ALAMAT BARU*

Saya akan memandu Anda menambahkan alamat baru langkah demi langkah.

${EMOJIS.PERSON} **Langkah 1/6: Nama Pelanggan**

Masukkan nama lengkap pelanggan:

💡 *Tips:* Gunakan nama lengkap untuk memudahkan pencarian`;

        return await this.sendMessage(chatId, sock, welcomeText);
    }

    /**
     * Start address editing workflow
     */
    async startEditAddressWorkflow(chatId, sock, addressId, userId) {
        try {
            const addressResult = await this.addressService.getAddress(addressId);
            
            if (!addressResult.success) {
                return await this.sendMessage(chatId, sock, `${EMOJIS.ERROR} ${addressResult.error.message}`);
            }

            const address = addressResult.data.address;
            
            const session = {
                type: 'edit',
                step: 'select_field',
                data: { address },
                addressId: addressId,
                startTime: Date.now(),
                lastActivity: Date.now()
            };

            this.workflowSessions.set(userId, session);

            return await this.showEditMenu(chatId, sock, address);

        } catch (error) {
            console.error('Error starting edit workflow:', error);
            return await this.sendMessage(chatId, sock, `${EMOJIS.ERROR} Gagal memulai edit alamat: ${error.message}`);
        }
    }

    /**
     * Handle workflow input
     */
    async handleWorkflowInput(m, sock, userId) {
        const session = this.workflowSessions.get(userId);
        if (!session) {
            return await this.sendMessage(m.chat, sock, `${EMOJIS.ERROR} Sesi tidak ditemukan. Ketik /tambah untuk memulai lagi.`);
        }

        session.lastActivity = Date.now();
        const input = m.body.trim();

        // Handle cancel command
        if (input.toLowerCase() === '/batal' || input.toLowerCase() === 'batal') {
            return await this.cancelWorkflow(m.chat, sock, userId);
        }

        try {
            if (session.type === 'create') {
                return await this.handleCreateWorkflowStep(m, sock, userId, session, input);
            } else if (session.type === 'edit') {
                return await this.handleEditWorkflowStep(m, sock, userId, session, input);
            }
        } catch (error) {
            console.error('Error handling workflow input:', error);
            return await this.sendMessage(m.chat, sock, `${EMOJIS.ERROR} Terjadi kesalahan: ${error.message}`);
        }
    }

    /**
     * Handle create workflow steps
     */
    async handleCreateWorkflowStep(m, sock, userId, session, input) {
        const { step, data } = session;

        switch (step) {
            case 'name':
                return await this.handleNameInput(m, sock, userId, session, input);
            
            case 'phone':
                return await this.handlePhoneInput(m, sock, userId, session, input);
            
            case 'street':
                return await this.handleStreetInput(m, sock, userId, session, input);
            
            case 'city':
                return await this.handleCityInput(m, sock, userId, session, input);
            
            case 'district':
                return await this.handleDistrictInput(m, sock, userId, session, input);
            
            case 'notes':
                return await this.handleNotesInput(m, sock, userId, session, input);
            
            case 'confirm':
                return await this.handleCreateConfirmation(m, sock, userId, session, input);
            
            default:
                return await this.cancelWorkflow(m.chat, sock, userId);
        }
    }

    /**
     * Handle name input
     */
    async handleNameInput(m, sock, userId, session, input) {
        const sanitizedName = sanitizeInput(input);
        
        if (sanitizedName.length < 2) {
            return await this.sendMessage(m.chat, sock, `${EMOJIS.ERROR} Nama terlalu pendek. Masukkan nama lengkap pelanggan:`);
        }

        session.data.customerName = sanitizedName;
        session.step = 'phone';

        const phoneText = `${EMOJIS.SUCCESS} Nama: ${sanitizedName}

${EMOJIS.PHONE} **Langkah 2/6: Nomor Telepon**

Masukkan nomor telepon pelanggan:

💡 *Format yang diterima:*
• 08xxxxxxxxx
• +62xxxxxxxxx
• 62xxxxxxxxx

Contoh: 081234567890`;

        return await this.sendMessage(m.chat, sock, phoneText);
    }

    /**
     * Handle phone input
     */
    async handlePhoneInput(m, sock, userId, session, input) {
        try {
            // Validate phone number
            const { validatePhoneNumber, normalizePhoneNumber } = require('../storage/AddressValidation');
            const normalizedPhone = normalizePhoneNumber(input);
            
            session.data.customerPhone = normalizedPhone;
            session.step = 'street';

            const streetText = `${EMOJIS.SUCCESS} Telepon: ${this.formatPhoneDisplay(normalizedPhone)}

${EMOJIS.LOCATION} **Langkah 3/6: Alamat Jalan**

Masukkan alamat lengkap (jalan, nomor rumah, RT/RW):

💡 *Contoh:*
Jl. Sudirman No. 123, RT 01/RW 05
Komplek Griya Asri Blok A No. 15`;

            return await this.sendMessage(m.chat, sock, streetText);

        } catch (error) {
            if (error instanceof ValidationError) {
                return await this.sendMessage(m.chat, sock, `${EMOJIS.ERROR} ${error.message}\n\nMasukkan nomor telepon yang valid:`);
            }
            throw error;
        }
    }

    /**
     * Handle street input
     */
    async handleStreetInput(m, sock, userId, session, input) {
        const sanitizedStreet = sanitizeInput(input);
        
        if (sanitizedStreet.length < 5) {
            return await this.sendMessage(m.chat, sock, `${EMOJIS.ERROR} Alamat terlalu pendek. Masukkan alamat lengkap:`);
        }

        if (!session.data.address) session.data.address = {};
        session.data.address.street = sanitizedStreet;
        session.step = 'city';

        const cityText = `${EMOJIS.SUCCESS} Alamat: ${truncateText(sanitizedStreet, 50)}

${EMOJIS.LOCATION} **Langkah 4/6: Kota/Kabupaten**

Masukkan nama kota atau kabupaten:

💡 *Contoh:*
Jakarta Selatan, Bandung, Surabaya`;

        return await this.sendMessage(m.chat, sock, cityText);
    }

    /**
     * Handle city input
     */
    async handleCityInput(m, sock, userId, session, input) {
        const sanitizedCity = sanitizeInput(input);
        
        if (sanitizedCity.length < 2) {
            return await this.sendMessage(m.chat, sock, `${EMOJIS.ERROR} Nama kota terlalu pendek. Masukkan nama kota:`);
        }

        session.data.address.city = sanitizedCity;
        session.step = 'district';

        const districtText = `${EMOJIS.SUCCESS} Kota: ${sanitizedCity}

${EMOJIS.LOCATION} **Langkah 5/6: Kecamatan (Opsional)**

Masukkan nama kecamatan atau ketik "skip" untuk melewati:

💡 *Contoh:*
Kebayoran Baru, Cicendo, Gubeng`;

        return await this.sendMessage(m.chat, sock, districtText);
    }

    /**
     * Handle district input
     */
    async handleDistrictInput(m, sock, userId, session, input) {
        if (input.toLowerCase() !== 'skip') {
            const sanitizedDistrict = sanitizeInput(input);
            session.data.address.district = sanitizedDistrict;
        }

        session.step = 'notes';

        const notesText = `${EMOJIS.SUCCESS} ${session.data.address.district ? `Kecamatan: ${session.data.address.district}` : 'Kecamatan dilewati'}

${EMOJIS.NOTES} **Langkah 6/6: Catatan Tambahan (Opsional)**

Masukkan catatan untuk memudahkan pengiriman atau ketik "skip":

💡 *Contoh catatan:*
• Rumah cat hijau, pagar putih
• Dekat masjid Al-Ikhlas
• Komplek belakang Indomaret
• Lantai 2, apartemen Tower A`;

        return await this.sendMessage(m.chat, sock, notesText);
    }

    /**
     * Handle notes input
     */
    async handleNotesInput(m, sock, userId, session, input) {
        if (input.toLowerCase() !== 'skip') {
            const sanitizedNotes = sanitizeInput(input);
            session.data.notes = sanitizedNotes;
        }

        session.step = 'confirm';

        return await this.showCreateConfirmation(m.chat, sock, userId, session);
    }

    /**
     * Show create confirmation
     */
    async showCreateConfirmation(chatId, sock, userId, session) {
        const { data } = session;
        
        let confirmText = `${EMOJIS.SUCCESS} **KONFIRMASI ALAMAT BARU**\n\n`;
        confirmText += `${EMOJIS.PERSON} **Nama:** ${data.customerName}\n`;
        confirmText += `${EMOJIS.PHONE} **Telepon:** ${this.formatPhoneDisplay(data.customerPhone)}\n`;
        confirmText += `${EMOJIS.LOCATION} **Alamat:** ${data.address.street}\n`;
        
        if (data.address.district) {
            confirmText += `${EMOJIS.LOCATION} **Kecamatan:** ${data.address.district}\n`;
        }
        
        confirmText += `${EMOJIS.LOCATION} **Kota:** ${data.address.city}\n`;
        
        if (data.notes) {
            confirmText += `${EMOJIS.NOTES} **Catatan:** ${data.notes}\n`;
        }

        confirmText += `\n**Apakah data sudah benar?**\n`;
        confirmText += `• Ketik "ya" atau "simpan" untuk menyimpan\n`;
        confirmText += `• Ketik "edit [field]" untuk mengedit (contoh: "edit nama")\n`;
        confirmText += `• Ketik "batal" untuk membatalkan`;

        return await this.sendMessage(chatId, sock, confirmText);
    }

    /**
     * Handle create confirmation
     */
    async handleCreateConfirmation(m, sock, userId, session, input) {
        const inputLower = input.toLowerCase();

        if (inputLower === 'ya' || inputLower === 'simpan' || inputLower === 'ok') {
            return await this.saveNewAddress(m.chat, sock, userId, session);
        }

        if (inputLower.startsWith('edit ')) {
            const field = inputLower.substring(5).trim();
            return await this.handleEditField(m.chat, sock, userId, session, field);
        }

        if (inputLower === 'batal') {
            return await this.cancelWorkflow(m.chat, sock, userId);
        }

        return await this.sendMessage(m.chat, sock, `${EMOJIS.ERROR} Pilihan tidak valid. Ketik "ya", "edit [field]", atau "batal"`);
    }

    /**
     * Save new address
     */
    async saveNewAddress(chatId, sock, userId, session) {
        try {
            const result = await this.addressService.createAddress(session.data, userId);

            // Clear session
            this.workflowSessions.delete(userId);

            if (!result.success) {
                let errorText = `${EMOJIS.ERROR} Gagal menyimpan alamat:\n${result.error.message}`;
                
                if (result.error.code === 'DUPLICATE_ADDRESS' && result.error.existingAddress) {
                    errorText += `\n\n${EMOJIS.WARNING} **Alamat serupa sudah ada:**\n`;
                    errorText += formatAddressForDisplay(result.error.existingAddress, false);
                    errorText += `\n\nIngin tetap menyimpan? Ketik /tambah untuk mencoba lagi.`;
                }
                
                return await this.sendMessage(chatId, sock, errorText);
            }

            let successText = `${EMOJIS.SUCCESS} **ALAMAT BERHASIL DISIMPAN!**\n\n`;
            successText += formatAddressForDisplay(result.data, true);
            
            if (result.duplicateWarning) {
                successText += `\n\n${EMOJIS.WARNING} **Peringatan:** Ada alamat serupa yang sudah ada. Pastikan ini bukan duplikat.`;
            }

            successText += `\n\n**ID Alamat:** \`${result.data.id}\``;
            successText += `\n\n*Alamat siap digunakan untuk pengiriman!*`;

            return await this.sendMessage(chatId, sock, successText);

        } catch (error) {
            console.error('Error saving address:', error);
            this.workflowSessions.delete(userId);
            return await this.sendMessage(chatId, sock, `${EMOJIS.ERROR} Gagal menyimpan alamat: ${error.message}`);
        }
    }

    /**
     * Show edit menu
     */
    async showEditMenu(chatId, sock, address) {
        let editText = `${EMOJIS.EDIT} **EDIT ALAMAT**\n\n`;
        editText += formatAddressForDisplay(address, true);
        
        editText += `\n\n**Pilih field yang ingin diedit:**\n`;
        editText += `1️⃣ Nama pelanggan\n`;
        editText += `2️⃣ Nomor telepon\n`;
        editText += `3️⃣ Alamat jalan\n`;
        editText += `4️⃣ Kota/Kabupaten\n`;
        editText += `5️⃣ Kecamatan\n`;
        editText += `6️⃣ Catatan\n`;
        editText += `7️⃣ ${address.isProblematic ? 'Hapus tanda bermasalah' : 'Tandai bermasalah'}\n`;
        editText += `8️⃣ ${address.status === 'verified' ? 'Batalkan verifikasi' : 'Verifikasi alamat'}\n\n`;
        editText += `Ketik nomor pilihan atau "batal" untuk keluar`;

        return await this.sendMessage(chatId, sock, editText);
    }

    /**
     * Handle edit workflow steps
     */
    async handleEditWorkflowStep(m, sock, userId, session, input) {
        const { step } = session;

        if (step === 'select_field') {
            return await this.handleEditFieldSelection(m, sock, userId, session, input);
        } else if (step.startsWith('edit_')) {
            return await this.handleEditFieldInput(m, sock, userId, session, input);
        } else if (step === 'confirm_edit') {
            return await this.handleEditConfirmation(m, sock, userId, session, input);
        }

        return await this.cancelWorkflow(m.chat, sock, userId);
    }

    /**
     * Handle edit field selection
     */
    async handleEditFieldSelection(m, sock, userId, session, input) {
        const selection = input.trim();
        const address = session.data.address;

        switch (selection) {
            case '1':
                return await this.startFieldEdit(m, sock, userId, session, 'name', 'Masukkan nama baru:', address.customerName);
            
            case '2':
                return await this.startFieldEdit(m, sock, userId, session, 'phone', 'Masukkan nomor telepon baru:', this.formatPhoneDisplay(address.customerPhone));
            
            case '3':
                return await this.startFieldEdit(m, sock, userId, session, 'street', 'Masukkan alamat jalan baru:', address.address.street);
            
            case '4':
                return await this.startFieldEdit(m, sock, userId, session, 'city', 'Masukkan kota baru:', address.address.city);
            
            case '5':
                return await this.startFieldEdit(m, sock, userId, session, 'district', 'Masukkan kecamatan baru:', address.address.district || '(kosong)');
            
            case '6':
                return await this.startFieldEdit(m, sock, userId, session, 'notes', 'Masukkan catatan baru:', address.notes || '(kosong)');
            
            case '7':
                return await this.handleProblematicToggle(m, sock, userId, session);
            
            case '8':
                return await this.handleVerificationToggle(m, sock, userId, session);
            
            default:
                return await this.sendMessage(m.chat, sock, `${EMOJIS.ERROR} Pilihan tidak valid. Ketik nomor 1-8 atau "batal"`);
        }
    }

    /**
     * Start field edit
     */
    async startFieldEdit(m, sock, userId, session, fieldType, prompt, currentValue) {
        session.step = `edit_${fieldType}`;
        session.editField = fieldType;

        const editText = `${EMOJIS.EDIT} **EDIT ${fieldType.toUpperCase()}**\n\n`;
        const displayText = editText + `**Nilai saat ini:** ${currentValue}\n\n${prompt}`;

        return await this.sendMessage(m.chat, sock, displayText);
    }

    /**
     * Handle edit field input
     */
    async handleEditFieldInput(m, sock, userId, session, input) {
        const fieldType = session.editField;
        const sanitizedInput = sanitizeInput(input);

        try {
            // Validate input based on field type
            switch (fieldType) {
                case 'name':
                    if (sanitizedInput.length < 2) {
                        return await this.sendMessage(m.chat, sock, `${EMOJIS.ERROR} Nama terlalu pendek. Masukkan nama yang valid:`);
                    }
                    session.editValue = sanitizedInput;
                    break;

                case 'phone':
                    const { normalizePhoneNumber } = require('../storage/AddressValidation');
                    session.editValue = normalizePhoneNumber(input);
                    break;

                case 'street':
                    if (sanitizedInput.length < 5) {
                        return await this.sendMessage(m.chat, sock, `${EMOJIS.ERROR} Alamat terlalu pendek. Masukkan alamat yang valid:`);
                    }
                    session.editValue = sanitizedInput;
                    break;

                case 'city':
                    if (sanitizedInput.length < 2) {
                        return await this.sendMessage(m.chat, sock, `${EMOJIS.ERROR} Nama kota terlalu pendek. Masukkan nama kota yang valid:`);
                    }
                    session.editValue = sanitizedInput;
                    break;

                case 'district':
                case 'notes':
                    session.editValue = sanitizedInput;
                    break;

                default:
                    return await this.cancelWorkflow(m.chat, sock, userId);
            }

            session.step = 'confirm_edit';
            return await this.showEditConfirmation(m, sock, userId, session);

        } catch (error) {
            if (error instanceof ValidationError) {
                return await this.sendMessage(m.chat, sock, `${EMOJIS.ERROR} ${error.message}\n\nMasukkan nilai yang valid:`);
            }
            throw error;
        }
    }

    /**
     * Show edit confirmation
     */
    async showEditConfirmation(m, sock, userId, session) {
        const fieldType = session.editField;
        const currentValue = this.getCurrentFieldValue(session.data.address, fieldType);
        const newValue = session.editValue;

        const confirmText = `${EMOJIS.SUCCESS} **KONFIRMASI PERUBAHAN**\n\n` +
                           `**Field:** ${fieldType}\n` +
                           `**Nilai lama:** ${currentValue}\n` +
                           `**Nilai baru:** ${newValue}\n\n` +
                           `Simpan perubahan?\n` +
                           `• Ketik "ya" untuk menyimpan\n` +
                           `• Ketik "tidak" untuk membatalkan`;

        return await this.sendMessage(m.chat, sock, confirmText);
    }

    /**
     * Handle edit confirmation
     */
    async handleEditConfirmation(m, sock, userId, session, input) {
        const inputLower = input.toLowerCase();

        if (inputLower === 'ya' || inputLower === 'simpan') {
            return await this.saveFieldEdit(m, sock, userId, session);
        }

        if (inputLower === 'tidak' || inputLower === 'batal') {
            return await this.showEditMenu(m.chat, sock, session.data.address);
        }

        return await this.sendMessage(m.chat, sock, `${EMOJIS.ERROR} Ketik "ya" atau "tidak"`);
    }

    /**
     * Save field edit
     */
    async saveFieldEdit(m, sock, userId, session) {
        try {
            const updates = this.buildUpdateObject(session.editField, session.editValue);
            
            const result = await this.addressService.updateAddress(
                session.addressId, 
                updates, 
                userId
            );

            if (!result.success) {
                return await this.sendMessage(m.chat, sock, `${EMOJIS.ERROR} Gagal menyimpan perubahan: ${result.error.message}`);
            }

            // Update session data
            session.data.address = result.data;
            session.step = 'select_field';

            const successText = `${EMOJIS.SUCCESS} Perubahan berhasil disimpan!\n\n` +
                               formatAddressForDisplay(result.data, true) +
                               `\n\nIngin mengedit field lain? Pilih nomor atau ketik "selesai"`;

            return await this.sendMessage(m.chat, sock, successText);

        } catch (error) {
            console.error('Error saving field edit:', error);
            return await this.sendMessage(m.chat, sock, `${EMOJIS.ERROR} Gagal menyimpan perubahan: ${error.message}`);
        }
    }

    /**
     * Helper methods
     */
    getCurrentFieldValue(address, fieldType) {
        switch (fieldType) {
            case 'name': return address.customerName;
            case 'phone': return this.formatPhoneDisplay(address.customerPhone);
            case 'street': return address.address.street;
            case 'city': return address.address.city;
            case 'district': return address.address.district || '(kosong)';
            case 'notes': return address.notes || '(kosong)';
            default: return 'Unknown';
        }
    }

    buildUpdateObject(fieldType, value) {
        const updates = {};
        
        switch (fieldType) {
            case 'name':
                updates.customerName = value;
                break;
            case 'phone':
                updates.customerPhone = value;
                break;
            case 'street':
                updates.address = { street: value };
                break;
            case 'city':
                updates.address = { city: value };
                break;
            case 'district':
                updates.address = { district: value };
                break;
            case 'notes':
                updates.notes = value;
                break;
        }
        
        return updates;
    }

    formatPhoneDisplay(phone) {
        if (!phone) return 'Tidak tersedia';
        if (phone.startsWith('62')) {
            return '0' + phone.substring(2);
        }
        return phone;
    }

    /**
     * Cancel workflow
     */
    async cancelWorkflow(chatId, sock, userId) {
        this.workflowSessions.delete(userId);
        return await this.sendMessage(chatId, sock, `${EMOJIS.SUCCESS} Operasi dibatalkan. Ketik /alamat untuk menu utama.`);
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
     * Clean up inactive workflow sessions
     */
    cleanupWorkflowSessions() {
        const now = Date.now();
        const timeout = 20 * 60 * 1000; // 20 minutes

        for (const [userId, session] of this.workflowSessions.entries()) {
            if (now - session.lastActivity > timeout) {
                this.workflowSessions.delete(userId);
            }
        }
    }
}

module.exports = AddressWorkflows;