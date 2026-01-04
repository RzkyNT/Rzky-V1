/**
 * Address Message Queue Integration
 * Handles async messaging for address management operations
 */

const messageQueue = require('./messageQueue');
const { EMOJIS } = require('../storage/AddressConstants');

class AddressMessageQueue {
    constructor() {
        this.messageQueue = messageQueue;
    }

    /**
     * Queue address verification notification
     */
    queueAddressVerificationNotification(sock, addressData, verifiedBy, targetJid = null) {
        const content = {
            text: `${EMOJIS.VERIFIED} *ALAMAT DIVERIFIKASI*\n\n` +
                  `📍 **${addressData.customerName}**\n` +
                  `📞 ${this.formatPhone(addressData.customerPhone)}\n` +
                  `🏠 ${addressData.address.street}, ${addressData.address.city}\n\n` +
                  `✅ Diverifikasi oleh: ${verifiedBy}\n` +
                  `⏰ ${new Date().toLocaleString('id-ID')}`
        };

        // Send to owner/admin
        const ownerJid = global.owner + "@s.whatsapp.net";
        return this.messageQueue.add(
            sock, 
            targetJid || ownerJid, 
            content, 
            {}, 
            'address_verification', 
            addressData.id
        );
    }

    /**
     * Queue problematic address alert
     */
    queueProblematicAddressAlert(sock, addressData, reason, reportedBy, targetJid = null) {
        const content = {
            text: `${EMOJIS.PROBLEMATIC} *ALAMAT BERMASALAH*\n\n` +
                  `📍 **${addressData.customerName}**\n` +
                  `📞 ${this.formatPhone(addressData.customerPhone)}\n` +
                  `🏠 ${addressData.address.street}, ${addressData.address.city}\n\n` +
                  `⚠️ **Masalah:** ${reason}\n` +
                  `👤 Dilaporkan oleh: ${reportedBy}\n` +
                  `⏰ ${new Date().toLocaleString('id-ID')}\n\n` +
                  `Segera tindak lanjuti masalah ini.`
        };

        // Send to owner/admin and supervisors
        const ownerJid = global.owner + "@s.whatsapp.net";
        const messageId = this.messageQueue.add(
            sock, 
            targetJid || ownerJid, 
            content, 
            {}, 
            'address_problematic', 
            addressData.id
        );

        // Also send to supervisors if configured
        if (global.supervisor && global.supervisor.length > 0) {
            global.supervisor.forEach(supervisor => {
                const supervisorJid = supervisor.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
                this.messageQueue.add(
                    sock, 
                    supervisorJid, 
                    content, 
                    {}, 
                    'address_problematic_supervisor', 
                    addressData.id
                );
            });
        }

        return messageId;
    }

    /**
     * Queue address creation notification
     */
    queueAddressCreationNotification(sock, addressData, createdBy, targetJid = null) {
        const content = {
            text: `${EMOJIS.ADD} *ALAMAT BARU DITAMBAHKAN*\n\n` +
                  `📍 **${addressData.customerName}**\n` +
                  `📞 ${this.formatPhone(addressData.customerPhone)}\n` +
                  `🏠 ${addressData.address.street}, ${addressData.address.city}\n\n` +
                  `👤 Ditambahkan oleh: ${createdBy}\n` +
                  `⏰ ${new Date().toLocaleString('id-ID')}\n\n` +
                  `ID Alamat: \`${addressData.id}\``
        };

        const ownerJid = global.owner + "@s.whatsapp.net";
        return this.messageQueue.add(
            sock, 
            targetJid || ownerJid, 
            content, 
            {}, 
            'address_creation', 
            addressData.id
        );
    }

    /**
     * Queue address usage notification for delivery
     */
    queueAddressUsageNotification(sock, addressData, usageData, usedBy, targetJid = null) {
        const content = {
            text: `${EMOJIS.LOCATION} *ALAMAT DIGUNAKAN UNTUK PENGIRIMAN*\n\n` +
                  `📍 **${addressData.customerName}**\n` +
                  `📞 ${this.formatPhone(addressData.customerPhone)}\n` +
                  `🏠 ${addressData.address.street}, ${addressData.address.city}\n\n` +
                  `📦 Order ID: ${usageData.orderId || 'N/A'}\n` +
                  `👤 Kurir: ${usedBy}\n` +
                  `⏰ ${new Date().toLocaleString('id-ID')}\n\n` +
                  `Status: ${usageData.deliverySuccess ? '✅ Berhasil' : '❌ Gagal'}`
        };

        const ownerJid = global.owner + "@s.whatsapp.net";
        return this.messageQueue.add(
            sock, 
            targetJid || ownerJid, 
            content, 
            {}, 
            'address_usage', 
            usageData.orderId || addressData.id
        );
    }

    /**
     * Queue address escalation alert
     */
    queueAddressEscalationAlert(sock, addressData, escalationNotes, escalatedBy, targetJid = null) {
        const content = {
            text: `🚨 *MASALAH ALAMAT DIESKALASI*\n\n` +
                  `📍 **${addressData.customerName}**\n` +
                  `📞 ${this.formatPhone(addressData.customerPhone)}\n` +
                  `🏠 ${addressData.address.street}, ${addressData.address.city}\n\n` +
                  `🚨 **Catatan Eskalasi:**\n${escalationNotes}\n\n` +
                  `👤 Dieskalasi oleh: ${escalatedBy}\n` +
                  `⏰ ${new Date().toLocaleString('id-ID')}\n\n` +
                  `⚠️ PERLU TINDAKAN SEGERA!`
        };

        const ownerJid = global.owner + "@s.whatsapp.net";
        const messageId = this.messageQueue.add(
            sock, 
            targetJid || ownerJid, 
            content, 
            {}, 
            'address_escalation', 
            addressData.id
        );

        // Send to all supervisors for escalated issues
        if (global.supervisor && global.supervisor.length > 0) {
            global.supervisor.forEach(supervisor => {
                const supervisorJid = supervisor.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
                this.messageQueue.add(
                    sock, 
                    supervisorJid, 
                    content, 
                    {}, 
                    'address_escalation_supervisor', 
                    addressData.id
                );
            });
        }

        return messageId;
    }

    /**
     * Queue daily address statistics report
     */
    queueDailyAddressReport(sock, statistics, targetJid = null) {
        const content = {
            text: `📊 *LAPORAN HARIAN ALAMAT*\n\n` +
                  `📅 ${new Date().toLocaleDateString('id-ID')}\n\n` +
                  `📍 Total Alamat: ${statistics.total}\n` +
                  `✅ Terverifikasi: ${statistics.verified}\n` +
                  `⏳ Belum Verifikasi: ${statistics.unverified}\n` +
                  `⚠️ Bermasalah: ${statistics.problematic}\n\n` +
                  `📈 Tingkat Verifikasi: ${statistics.total > 0 ? ((statistics.verified / statistics.total) * 100).toFixed(1) : 0}%\n\n` +
                  `Laporan otomatis sistem manajemen alamat.`
        };

        const ownerJid = global.owner + "@s.whatsapp.net";
        return this.messageQueue.add(
            sock, 
            targetJid || ownerJid, 
            content, 
            {}, 
            'address_daily_report', 
            null
        );
    }

    /**
     * Queue batch operation notification
     */
    queueBatchOperationNotification(sock, operation, results, performedBy, targetJid = null) {
        const content = {
            text: `🔄 *OPERASI BATCH ALAMAT*\n\n` +
                  `📋 **Operasi:** ${operation}\n` +
                  `👤 Dilakukan oleh: ${performedBy}\n` +
                  `⏰ ${new Date().toLocaleString('id-ID')}\n\n` +
                  `📊 **Hasil:**\n` +
                  `✅ Berhasil: ${results.success || 0}\n` +
                  `❌ Gagal: ${results.failed || 0}\n` +
                  `📝 Total: ${results.total || 0}\n\n` +
                  `${results.errors && results.errors.length > 0 ? 
                    `⚠️ **Error:**\n${results.errors.slice(0, 3).join('\n')}` : 
                    '✅ Semua operasi berhasil'}`
        };

        const ownerJid = global.owner + "@s.whatsapp.net";
        return this.messageQueue.add(
            sock, 
            targetJid || ownerJid, 
            content, 
            {}, 
            'address_batch_operation', 
            null
        );
    }

    /**
     * Queue address duplicate warning
     */
    queueDuplicateAddressWarning(sock, newAddress, existingAddress, createdBy, targetJid = null) {
        const content = {
            text: `⚠️ *PERINGATAN ALAMAT DUPLIKAT*\n\n` +
                  `📍 **Alamat Baru:**\n` +
                  `${newAddress.customerName} - ${newAddress.customerPhone}\n` +
                  `${newAddress.address.street}, ${newAddress.address.city}\n\n` +
                  `📍 **Alamat Serupa yang Ada:**\n` +
                  `${existingAddress.customerName} - ${existingAddress.customerPhone}\n` +
                  `${existingAddress.address.street}, ${existingAddress.address.city}\n\n` +
                  `👤 Ditambahkan oleh: ${createdBy}\n` +
                  `⏰ ${new Date().toLocaleString('id-ID')}\n\n` +
                  `🔍 Periksa apakah ini alamat duplikat.`
        };

        const ownerJid = global.owner + "@s.whatsapp.net";
        return this.messageQueue.add(
            sock, 
            targetJid || ownerJid, 
            content, 
            {}, 
            'address_duplicate_warning', 
            newAddress.id
        );
    }

    /**
     * Queue address resolution notification
     */
    queueAddressResolutionNotification(sock, addressData, resolutionNotes, resolvedBy, targetJid = null) {
        const content = {
            text: `✅ *MASALAH ALAMAT DISELESAIKAN*\n\n` +
                  `📍 **${addressData.customerName}**\n` +
                  `📞 ${this.formatPhone(addressData.customerPhone)}\n` +
                  `🏠 ${addressData.address.street}, ${addressData.address.city}\n\n` +
                  `📝 **Catatan Penyelesaian:**\n${resolutionNotes}\n\n` +
                  `👤 Diselesaikan oleh: ${resolvedBy}\n` +
                  `⏰ ${new Date().toLocaleString('id-ID')}\n\n` +
                  `✅ Alamat kembali dapat digunakan.`
        };

        const ownerJid = global.owner + "@s.whatsapp.net";
        return this.messageQueue.add(
            sock, 
            targetJid || ownerJid, 
            content, 
            {}, 
            'address_resolution', 
            addressData.id
        );
    }

    /**
     * Helper method to format phone numbers
     */
    formatPhone(phone) {
        if (!phone) return 'Tidak tersedia';
        if (phone.startsWith('62')) {
            return '0' + phone.substring(2);
        }
        return phone;
    }

    /**
     * Get address-related message statistics
     */
    getAddressMessageStats() {
        const status = this.messageQueue.getStatus();
        
        // Filter address-related messages
        const addressSent = this.messageQueue.log.sent.filter(m => 
            m.type && m.type.startsWith('address_')
        );
        
        const addressFailed = this.messageQueue.log.failed.filter(m => 
            m.type && m.type.startsWith('address_')
        );

        return {
            total: status,
            addressMessages: {
                sent: addressSent.length,
                failed: addressFailed.length,
                byType: this.groupMessagesByType(addressSent)
            }
        };
    }

    /**
     * Group messages by type for statistics
     */
    groupMessagesByType(messages) {
        const grouped = {};
        messages.forEach(msg => {
            const type = msg.type || 'unknown';
            grouped[type] = (grouped[type] || 0) + 1;
        });
        return grouped;
    }

    /**
     * Retry failed address messages
     */
    retryFailedAddressMessages(sock, addressId) {
        const failed = this.messageQueue.log.failed.filter(m => 
            m.orderId === addressId || (m.type && m.type.startsWith('address_'))
        );
        
        console.log(`[AddressQueue] Found ${failed.length} failed messages for address ${addressId}`);
        return failed;
    }

    /**
     * Schedule periodic address reports
     */
    scheduleDailyReport(sock, addressService) {
        // Schedule daily report at 8 AM
        const scheduleTime = new Date();
        scheduleTime.setHours(8, 0, 0, 0);
        
        // If it's past 8 AM today, schedule for tomorrow
        if (scheduleTime <= new Date()) {
            scheduleTime.setDate(scheduleTime.getDate() + 1);
        }

        const timeUntilReport = scheduleTime.getTime() - Date.now();
        
        setTimeout(async () => {
            try {
                const statsResult = await addressService.getStatistics();
                if (statsResult.success) {
                    this.queueDailyAddressReport(sock, statsResult.data);
                }
                
                // Schedule next day's report
                this.scheduleDailyReport(sock, addressService);
            } catch (error) {
                console.error('Error sending daily address report:', error);
            }
        }, timeUntilReport);

        console.log(`[AddressQueue] Daily report scheduled for ${scheduleTime.toLocaleString('id-ID')}`);
    }
}

module.exports = AddressMessageQueue;