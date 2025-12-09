const fs = require('fs');
const path = require('path');

class OrderReminderSystem {
    constructor() {
        this.reminderInterval = 5 * 60 * 1000; // 5 menit
        this.maxReminders = 3; // Maksimal 3x reminder
        this.reminderLog = path.join(__dirname, '../data/reminder_log.json');
        this.loadLog();
        this.intervalId = null;
    }

    loadLog() {
        try {
            if (fs.existsSync(this.reminderLog)) {
                const data = fs.readFileSync(this.reminderLog, 'utf8');
                this.log = JSON.parse(data);
            } else {
                this.log = {};
            }
        } catch (e) {
            this.log = {};
        }
    }

    saveLog() {
        try {
            fs.writeFileSync(this.reminderLog, JSON.stringify(this.log, null, 2));
        } catch (e) {
            console.error('Failed to save reminder log:', e);
        }
    }

    /**
     * Start reminder system
     * @param {Object} sock - WhatsApp socket
     * @param {Function} loadCrmData - Function to load CRM data
     * @param {Function} generateWAMessageFromContent - Function to generate WA message
     */
    start(sock, loadCrmData, generateWAMessageFromContent) {
        if (this.intervalId) {
            console.log('[Reminder] System already running');
            return;
        }

        console.log('[Reminder] Starting order reminder system...');
        
        // Check immediately on start
        this.checkPendingOrders(sock, loadCrmData, generateWAMessageFromContent);
        
        // Then check every interval
        this.intervalId = setInterval(() => {
            this.checkPendingOrders(sock, loadCrmData, generateWAMessageFromContent);
        }, this.reminderInterval);

        console.log(`[Reminder] System started. Checking every ${this.reminderInterval / 60000} minutes`);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log('[Reminder] System stopped');
        }
    }

    async checkPendingOrders(sock, loadCrmData, generateWAMessageFromContent) {
        try {
            const crm = loadCrmData();
            const now = new Date();
            
            // Filter orders yang masih "Menunggu" dan belum diambil kurir
            const pendingOrders = crm.orders.filter(o => 
                o.status === "Menunggu" && 
                !o.courierId // Belum ada kurir yang ambil
            );

            console.log(`[Reminder] Checking ${pendingOrders.length} pending orders...`);

            for (const order of pendingOrders) {
                const orderTime = new Date(order.date);
                const minutesSinceOrder = (now - orderTime) / 60000;

                // Initialize log for this order if not exists
                if (!this.log[order.id]) {
                    this.log[order.id] = {
                        orderId: order.id,
                        createdAt: order.date,
                        remindersSent: 0,
                        lastReminderAt: null
                    };
                }

                const orderLog = this.log[order.id];

                // Cek apakah sudah waktunya kirim reminder
                const shouldSendReminder = this.shouldSendReminder(orderLog, minutesSinceOrder);

                if (shouldSendReminder && orderLog.remindersSent < this.maxReminders) {
                    await this.sendReminder(sock, crm, order, orderLog, generateWAMessageFromContent);
                    orderLog.remindersSent++;
                    orderLog.lastReminderAt = now.toISOString();
                    this.saveLog();
                }

                // Jika sudah max reminders, escalate ke owner
                if (orderLog.remindersSent >= this.maxReminders && !orderLog.escalated) {
                    await this.escalateToOwner(sock, order);
                    orderLog.escalated = true;
                    orderLog.escalatedAt = now.toISOString();
                    this.saveLog();
                }
            }
        } catch (error) {
            console.error('[Reminder] Error checking pending orders:', error);
        }
    }

    shouldSendReminder(orderLog, minutesSinceOrder) {
        // Reminder pertama: 5 menit setelah order
        if (orderLog.remindersSent === 0 && minutesSinceOrder >= 5) {
            return true;
        }

        // Reminder berikutnya: setiap 5 menit
        if (orderLog.lastReminderAt) {
            const lastReminder = new Date(orderLog.lastReminderAt);
            const minutesSinceLastReminder = (new Date() - lastReminder) / 60000;
            return minutesSinceLastReminder >= 5;
        }

        return false;
    }

    async sendReminder(sock, crm, order, orderLog, generateWAMessageFromContent) {
        if (!crm.couriers || crm.couriers.length === 0) {
            console.log(`[Reminder] No couriers available for order ${order.id}`);
            return;
        }

        const reminderCount = orderLog.remindersSent + 1;
        const urgencyEmoji = reminderCount === 1 ? '⏰' : reminderCount === 2 ? '⚠️' : '🚨';
        
        console.log(`[Reminder] Sending reminder #${reminderCount} for order ${order.id}`);

        for (const courierNum of crm.couriers) {
            try {
                const courierJid = courierNum + "@s.whatsapp.net";
                
                let msg = generateWAMessageFromContent(courierJid, {
                    viewOnceMessage: {
                        message: {
                            messageContextInfo: {
                                deviceListMetadata: {},
                                deviceListMetadataVersion: 2
                            },
                            interactiveMessage: {
                                body: { 
                                    text: `${urgencyEmoji} *REMINDER PESANAN #${reminderCount}*\n\n` +
                                          `ID: ${order.id}\n` +
                                          `Area: ${order.address}\n` +
                                          `Item: ${order.item}\n` +
                                          `Total: Rp${order.total.toLocaleString()}\n` +
                                          `Waktu Order: ${new Date(order.date).toLocaleTimeString('id-ID')}\n\n` +
                                          `⚠️ Pesanan ini belum diambil!\n` +
                                          `Silakan ambil antrian sekarang.`
                                },
                                footer: { text: `Reminder ${reminderCount}/${this.maxReminders} • Depot Minhaqua` },
                                nativeFlowMessage: {
                                    buttons: [
                                        {
                                            name: "quick_reply",
                                            buttonParamsJson: JSON.stringify({
                                                display_text: "📦 Ambil Antrian Sekarang",
                                                id: `.ambilantrian ${order.id}`
                                            })
                                        }
                                    ]
                                }
                            }
                        }
                    }
                }, { userJid: courierJid });

                await sock.relayMessage(courierJid, msg.message, { messageId: msg.key.id });
                
                // Delay between couriers
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                console.error(`[Reminder] Failed to send to courier ${courierNum}:`, error.message);
            }
        }
    }

    async escalateToOwner(sock, order) {
        try {
            const ownerJid = global.owner + "@s.whatsapp.net";
            
            const escalationMessage = {
                text: `🚨 *ESKALASI PESANAN*\n\n` +
                      `Pesanan berikut belum diambil kurir setelah ${this.maxReminders} reminder:\n\n` +
                      `ID: ${order.id}\n` +
                      `Customer: ${order.customerName}\n` +
                      `Item: ${order.item}\n` +
                      `Total: Rp${order.total.toLocaleString()}\n` +
                      `Alamat: ${order.address}\n` +
                      `Waktu Order: ${new Date(order.date).toLocaleString('id-ID')}\n\n` +
                      `⚠️ Mohon segera ditindaklanjuti!`
            };

            await sock.sendMessage(ownerJid, escalationMessage);
            console.log(`[Reminder] Escalated order ${order.id} to owner`);
            
        } catch (error) {
            console.error(`[Reminder] Failed to escalate order ${order.id}:`, error.message);
        }
    }

    /**
     * Mark order as taken (stop reminders)
     */
    markOrderTaken(orderId) {
        if (this.log[orderId]) {
            this.log[orderId].takenAt = new Date().toISOString();
            this.log[orderId].status = 'taken';
            this.saveLog();
            console.log(`[Reminder] Order ${orderId} marked as taken`);
        }
    }

    /**
     * Get reminder statistics
     */
    getStats() {
        const orders = Object.values(this.log);
        return {
            totalOrders: orders.length,
            activeReminders: orders.filter(o => !o.takenAt && !o.escalated).length,
            escalated: orders.filter(o => o.escalated).length,
            taken: orders.filter(o => o.takenAt).length,
            avgRemindersPerOrder: orders.length > 0 
                ? (orders.reduce((sum, o) => sum + o.remindersSent, 0) / orders.length).toFixed(2)
                : 0
        };
    }
}

module.exports = new OrderReminderSystem();
