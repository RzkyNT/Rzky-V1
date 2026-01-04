/**
 * Address Status Manager
 * Advanced status management and verification workflows for addresses
 */

const { ADDRESS_STATUS, HISTORY_ACTIONS, ERROR_CODES } = require('./AddressConstants');
const { formatDate } = require('./AddressUtils');

class AddressStatusManager {
    constructor(repository) {
        this.repository = repository;
        this.messageQueue = null; // Will be set by AddressManager
    }

    setMessageQueue(messageQueue) {
        this.messageQueue = messageQueue;
    }

    /**
     * Comprehensive address verification workflow
     */
    async verifyAddressWorkflow(addressId, verificationData, verifiedBy) {
        try {
            const address = await this.repository.findById(addressId);
            if (!address) {
                throw new Error('Address not found');
            }

            // Prepare verification updates
            const updates = {
                status: ADDRESS_STATUS.VERIFIED,
                verifiedBy: verifiedBy,
                verifiedAt: new Date().toISOString(),
                updatedBy: verifiedBy,
                updatedAt: new Date().toISOString()
            };

            // Add verification notes if provided
            if (verificationData.notes) {
                updates.notes = address.notes ? 
                    `${address.notes}\n\n[Verifikasi ${formatDate(new Date())}]: ${verificationData.notes}` :
                    `[Verifikasi ${formatDate(new Date())}]: ${verificationData.notes}`;
            }

            // Update coordinates if provided during verification
            if (verificationData.coordinates) {
                updates.coordinates = verificationData.coordinates;
            }

            // Update address components if corrected during verification
            if (verificationData.addressCorrections) {
                updates.address = { ...address.address, ...verificationData.addressCorrections };
            }

            // Clear problematic status if address was problematic
            if (address.isProblematic) {
                updates.isProblematic = false;
                updates.problematicReason = null;
            }

            // Update address
            const updatedAddress = await this.repository.update(addressId, updates);

            // Log verification in history
            await this.repository.logHistory(
                addressId,
                HISTORY_ACTIONS.VERIFIED,
                this.calculateVerificationChanges(address, updates),
                verifiedBy,
                `Alamat diverifikasi: ${verificationData.reason || 'Verifikasi standar'}`
            );

            // Queue verification notification if message queue is available
            if (this.messageQueue && global.sock) {
                this.messageQueue.queueAddressVerificationNotification(
                    global.sock, 
                    updatedAddress, 
                    verifiedBy
                );
            }

            return {
                success: true,
                message: 'Alamat berhasil diverifikasi',
                data: updatedAddress,
                verificationDetails: {
                    verifiedBy: verifiedBy,
                    verifiedAt: updates.verifiedAt,
                    corrections: verificationData.addressCorrections || null,
                    notes: verificationData.notes || null
                }
            };

        } catch (error) {
            console.error('Error in verification workflow:', error);
            throw error;
        }
    }

    /**
     * Batch verification for multiple addresses
     */
    async batchVerifyAddresses(addressIds, verifiedBy, batchNotes = '') {
        const results = [];
        const errors = [];

        for (const addressId of addressIds) {
            try {
                const result = await this.verifyAddressWorkflow(
                    addressId,
                    { notes: batchNotes, reason: 'Verifikasi batch' },
                    verifiedBy
                );
                results.push({ addressId, ...result });
            } catch (error) {
                errors.push({ addressId, error: error.message });
            }
        }

        return {
            success: errors.length === 0,
            results: results,
            errors: errors,
            summary: {
                total: addressIds.length,
                verified: results.length,
                failed: errors.length
            }
        };
    }

    /**
     * Advanced problematic address management
     */
    async manageProblematicAddress(addressId, action, actionData, performedBy) {
        try {
            const address = await this.repository.findById(addressId);
            if (!address) {
                throw new Error('Address not found');
            }

            let updates = {
                updatedBy: performedBy,
                updatedAt: new Date().toISOString()
            };

            let historyAction;
            let historyReason;

            switch (action) {
                case 'mark_problematic':
                    updates.isProblematic = true;
                    updates.problematicReason = actionData.reason;
                    updates.status = ADDRESS_STATUS.PROBLEMATIC;
                    historyAction = HISTORY_ACTIONS.MARKED_PROBLEMATIC;
                    historyReason = actionData.reason;
                    break;

                case 'unmark_problematic':
                    updates.isProblematic = false;
                    updates.problematicReason = null;
                    updates.status = ADDRESS_STATUS.UNVERIFIED;
                    historyAction = HISTORY_ACTIONS.UNMARKED_PROBLEMATIC;
                    historyReason = actionData.reason || 'Masalah telah diperbaiki';
                    break;

                case 'escalate_problem':
                    updates.problematicReason = `[ESKALASI] ${address.problematicReason || ''}\n${actionData.escalationNotes}`;
                    updates.tags = [...(address.tags || []), 'escalated_problem'];
                    historyAction = 'escalated';
                    historyReason = actionData.escalationNotes;
                    break;

                case 'resolve_problem':
                    updates.isProblematic = false;
                    updates.problematicReason = null;
                    updates.status = ADDRESS_STATUS.VERIFIED;
                    updates.verifiedBy = performedBy;
                    updates.verifiedAt = new Date().toISOString();
                    
                    // Add resolution notes
                    if (actionData.resolutionNotes) {
                        updates.notes = address.notes ? 
                            `${address.notes}\n\n[Resolusi ${formatDate(new Date())}]: ${actionData.resolutionNotes}` :
                            `[Resolusi ${formatDate(new Date())}]: ${actionData.resolutionNotes}`;
                    }
                    
                    historyAction = 'resolved';
                    historyReason = actionData.resolutionNotes || 'Masalah diselesaikan';
                    break;

                default:
                    throw new Error(`Unknown action: ${action}`);
            }

            // Update address
            const updatedAddress = await this.repository.update(addressId, updates);

            // Log in history
            await this.repository.logHistory(
                addressId,
                historyAction,
                this.calculateStatusChanges(address, updates),
                performedBy,
                historyReason
            );

            // Queue appropriate notifications
            if (this.messageQueue && global.sock) {
                switch (action) {
                    case 'mark_problematic':
                        this.messageQueue.queueProblematicAddressAlert(
                            global.sock, 
                            updatedAddress, 
                            actionData.reason, 
                            performedBy
                        );
                        break;
                    case 'escalate_problem':
                        this.messageQueue.queueAddressEscalationAlert(
                            global.sock, 
                            updatedAddress, 
                            actionData.escalationNotes, 
                            performedBy
                        );
                        break;
                    case 'resolve_problem':
                        this.messageQueue.queueAddressResolutionNotification(
                            global.sock, 
                            updatedAddress, 
                            actionData.resolutionNotes || 'Masalah diselesaikan', 
                            performedBy
                        );
                        break;
                }
            }

            return {
                success: true,
                message: this.getActionSuccessMessage(action),
                data: updatedAddress
            };

        } catch (error) {
            console.error('Error managing problematic address:', error);
            throw error;
        }
    }

    /**
     * Usage tracking and statistics update
     */
    async trackAddressUsage(addressId, usageData, usedBy) {
        try {
            const address = await this.repository.findById(addressId);
            if (!address) {
                throw new Error('Address not found');
            }

            // Update usage statistics
            const updates = {
                lastUsed: new Date().toISOString(),
                usageCount: (address.usageCount || 0) + 1,
                updatedAt: new Date().toISOString()
            };

            // Add usage context if provided
            if (usageData.deliverySuccess !== undefined) {
                updates.successfulDeliveries = (address.successfulDeliveries || 0) + 
                    (usageData.deliverySuccess ? 1 : 0);
                updates.failedDeliveries = (address.failedDeliveries || 0) + 
                    (usageData.deliverySuccess ? 0 : 1);
            }

            // Update delivery time statistics
            if (usageData.deliveryTime) {
                const currentAvg = address.averageDeliveryTime || 0;
                const currentCount = address.usageCount || 0;
                updates.averageDeliveryTime = currentCount === 0 ? 
                    usageData.deliveryTime :
                    ((currentAvg * currentCount) + usageData.deliveryTime) / (currentCount + 1);
            }

            // Add usage tags based on patterns
            const newTags = this.generateUsageTags(address, usageData);
            if (newTags.length > 0) {
                updates.tags = [...new Set([...(address.tags || []), ...newTags])];
            }

            // Update address
            const updatedAddress = await this.repository.update(addressId, updates);

            // Log usage in history
            await this.repository.logHistory(
                addressId,
                HISTORY_ACTIONS.USED,
                null,
                usedBy,
                this.formatUsageReason(usageData)
            );

            return {
                success: true,
                data: updatedAddress,
                usageStats: {
                    totalUsage: updates.usageCount,
                    successRate: updates.successfulDeliveries ? 
                        (updates.successfulDeliveries / updates.usageCount * 100).toFixed(1) + '%' : 
                        'N/A',
                    averageDeliveryTime: updates.averageDeliveryTime || null
                }
            };

        } catch (error) {
            console.error('Error tracking address usage:', error);
            throw error;
        }
    }

    /**
     * Automatic status updates based on usage patterns
     */
    async autoUpdateStatusBasedOnUsage(addressId) {
        try {
            const address = await this.repository.findById(addressId);
            if (!address) {
                return { success: false, message: 'Address not found' };
            }

            let shouldUpdate = false;
            const updates = {
                updatedAt: new Date().toISOString(),
                updatedBy: 'system'
            };

            // Auto-verify addresses with high success rate
            if (address.status === ADDRESS_STATUS.UNVERIFIED && 
                address.usageCount >= 3 && 
                address.successfulDeliveries >= 2 &&
                (address.successfulDeliveries / address.usageCount) >= 0.8) {
                
                updates.status = ADDRESS_STATUS.VERIFIED;
                updates.verifiedBy = 'system';
                updates.verifiedAt = new Date().toISOString();
                shouldUpdate = true;
            }

            // Auto-mark as problematic if high failure rate
            if (!address.isProblematic && 
                address.usageCount >= 3 && 
                address.failedDeliveries >= 2 &&
                (address.failedDeliveries / address.usageCount) >= 0.6) {
                
                updates.isProblematic = true;
                updates.problematicReason = 'Tingkat kegagalan pengiriman tinggi (otomatis)';
                updates.status = ADDRESS_STATUS.PROBLEMATIC;
                shouldUpdate = true;
            }

            if (shouldUpdate) {
                const updatedAddress = await this.repository.update(addressId, updates);
                
                await this.repository.logHistory(
                    addressId,
                    'auto_status_update',
                    this.calculateStatusChanges(address, updates),
                    'system',
                    'Status diperbarui otomatis berdasarkan pola penggunaan'
                );

                return {
                    success: true,
                    updated: true,
                    data: updatedAddress,
                    reason: 'Status diperbarui berdasarkan pola penggunaan'
                };
            }

            return {
                success: true,
                updated: false,
                message: 'Tidak ada pembaruan status yang diperlukan'
            };

        } catch (error) {
            console.error('Error in auto status update:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get status transition history for an address
     */
    async getStatusTransitionHistory(addressId) {
        try {
            const history = await this.repository.getHistory(addressId);
            
            const statusTransitions = history.filter(entry => 
                ['created', 'updated', 'verified', 'marked_problematic', 'unmarked_problematic'].includes(entry.action)
            ).map(entry => ({
                timestamp: entry.timestamp,
                action: entry.action,
                fromStatus: entry.changes?.find(c => c.field === 'status')?.oldValue,
                toStatus: entry.changes?.find(c => c.field === 'status')?.newValue,
                performedBy: entry.performedBy,
                reason: entry.reason
            }));

            return {
                success: true,
                data: statusTransitions
            };

        } catch (error) {
            console.error('Error getting status transition history:', error);
            throw error;
        }
    }

    /**
     * Helper methods
     */
    calculateVerificationChanges(oldAddress, updates) {
        const changes = [];
        
        if (oldAddress.status !== updates.status) {
            changes.push({
                field: 'status',
                oldValue: oldAddress.status,
                newValue: updates.status
            });
        }

        if (updates.coordinates && JSON.stringify(oldAddress.coordinates) !== JSON.stringify(updates.coordinates)) {
            changes.push({
                field: 'coordinates',
                oldValue: oldAddress.coordinates,
                newValue: updates.coordinates
            });
        }

        return changes;
    }

    calculateStatusChanges(oldAddress, updates) {
        const changes = [];
        
        Object.keys(updates).forEach(key => {
            if (['updatedBy', 'updatedAt'].includes(key)) return;
            
            if (JSON.stringify(oldAddress[key]) !== JSON.stringify(updates[key])) {
                changes.push({
                    field: key,
                    oldValue: oldAddress[key],
                    newValue: updates[key]
                });
            }
        });

        return changes;
    }

    generateUsageTags(address, usageData) {
        const tags = [];
        
        if (usageData.deliverySuccess) {
            if ((address.usageCount || 0) >= 5) {
                tags.push('frequent_delivery');
            }
        }

        if (usageData.deliveryTime && usageData.deliveryTime < 30) {
            tags.push('quick_delivery');
        }

        return tags;
    }

    formatUsageReason(usageData) {
        let reason = 'Alamat digunakan untuk pengiriman';
        
        if (usageData.deliverySuccess !== undefined) {
            reason += usageData.deliverySuccess ? ' (berhasil)' : ' (gagal)';
        }

        if (usageData.deliveryTime) {
            reason += ` - Waktu: ${usageData.deliveryTime} menit`;
        }

        return reason;
    }

    getActionSuccessMessage(action) {
        const messages = {
            'mark_problematic': 'Alamat berhasil ditandai bermasalah',
            'unmark_problematic': 'Tanda bermasalah berhasil dihapus',
            'escalate_problem': 'Masalah berhasil dieskalasi',
            'resolve_problem': 'Masalah berhasil diselesaikan'
        };

        return messages[action] || 'Aksi berhasil dilakukan';
    }
}

module.exports = AddressStatusManager;