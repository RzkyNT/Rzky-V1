const fs = require('fs');
const path = require('path');

class MessageQueue {
    constructor() {
        this.queue = [];
        this.processing = false;
        this.retryAttempts = 3;
        this.delayBetweenMessages = 1000; // 1 second delay
        this.logFile = path.join(__dirname, '../data/message_log.json');
        this.loadLog();
    }

    loadLog() {
        try {
            if (fs.existsSync(this.logFile)) {
                const data = fs.readFileSync(this.logFile, 'utf8');
                this.log = JSON.parse(data);
            } else {
                this.log = { sent: [], failed: [] };
            }
        } catch (e) {
            this.log = { sent: [], failed: [] };
        }
    }

    saveLog() {
        try {
            fs.writeFileSync(this.logFile, JSON.stringify(this.log, null, 2));
        } catch (e) {
            console.error('Failed to save message log:', e);
        }
    }

    /**
     * Add message to queue
     * @param {Object} sock - WhatsApp socket
     * @param {String} jid - Recipient JID
     * @param {Object} content - Message content
     * @param {Object} options - Additional options
     * @param {String} type - Message type (notification, order, etc)
     * @param {String} orderId - Related order ID (optional)
     */
    add(sock, jid, content, options = {}, type = 'general', orderId = null) {
        const messageId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        this.queue.push({
            id: messageId,
            sock,
            jid,
            content,
            options,
            type,
            orderId,
            attempts: 0,
            timestamp: new Date().toISOString()
        });

        console.log(`[Queue] Added message ${messageId} to ${jid} (Type: ${type})`);
        
        if (!this.processing) {
            this.process();
        }

        return messageId;
    }

    async process() {
        if (this.processing || this.queue.length === 0) return;
        
        this.processing = true;
        console.log(`[Queue] Processing ${this.queue.length} messages...`);

        while (this.queue.length > 0) {
            const message = this.queue[0];
            
            try {
                console.log(`[Queue] Sending message ${message.id} to ${message.jid} (Attempt ${message.attempts + 1}/${this.retryAttempts})`);
                
                await message.sock.sendMessage(message.jid, message.content, message.options);
                
                // Log successful send
                this.log.sent.push({
                    id: message.id,
                    jid: message.jid,
                    type: message.type,
                    orderId: message.orderId,
                    timestamp: new Date().toISOString(),
                    attempts: message.attempts + 1
                });
                
                console.log(`[Queue] ✅ Message ${message.id} sent successfully`);
                
                // Remove from queue
                this.queue.shift();
                
                // Delay before next message
                if (this.queue.length > 0) {
                    await this.delay(this.delayBetweenMessages);
                }
                
            } catch (error) {
                message.attempts++;
                console.error(`[Queue] ❌ Failed to send message ${message.id}:`, error.message);
                
                if (message.attempts >= this.retryAttempts) {
                    // Max retries reached, log as failed
                    this.log.failed.push({
                        id: message.id,
                        jid: message.jid,
                        type: message.type,
                        orderId: message.orderId,
                        error: error.message,
                        timestamp: new Date().toISOString(),
                        attempts: message.attempts
                    });
                    
                    console.log(`[Queue] ⚠️ Message ${message.id} failed after ${message.attempts} attempts`);
                    
                    // Remove from queue
                    this.queue.shift();
                } else {
                    // Move to end of queue for retry
                    this.queue.push(this.queue.shift());
                    
                    // Wait longer before retry
                    await this.delay(this.delayBetweenMessages * 2);
                }
            }
        }

        this.saveLog();
        this.processing = false;
        console.log('[Queue] Processing complete');
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get failed messages for a specific order
     */
    getFailedByOrder(orderId) {
        return this.log.failed.filter(m => m.orderId === orderId);
    }

    /**
     * Retry failed messages for a specific order
     */
    retryFailedOrder(orderId, sock) {
        const failed = this.getFailedByOrder(orderId);
        console.log(`[Queue] Retrying ${failed.length} failed messages for order ${orderId}`);
        
        // Note: This would require storing original content, which we should add
        // For now, just log the attempt
        return failed;
    }

    /**
     * Get queue status
     */
    getStatus() {
        return {
            queueLength: this.queue.length,
            processing: this.processing,
            totalSent: this.log.sent.length,
            totalFailed: this.log.failed.length
        };
    }
}

module.exports = new MessageQueue();
