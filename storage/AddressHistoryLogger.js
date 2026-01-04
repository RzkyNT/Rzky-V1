/**
 * Address History Logger
 * Comprehensive audit trail and history logging for address operations
 */

const { AddressHistoryModel } = require('./AddressModels');
const { HISTORY_ACTIONS, ERROR_CODES } = require('./AddressConstants');
const { formatDate, generateId } = require('./AddressUtils');

class AddressHistoryLogger {
    constructor(repository) {
        this.repository = repository;
    }

    /**
     * Log address creation with detailed information
     */
    async logAddressCreation(address, createdBy, additionalInfo = {}) {
        try {
            const historyEntry = {
                addressId: address.id,
                action: HISTORY_ACTIONS.CREATED,
                changes: null, // No changes for creation
                performedBy: createdBy,
                reason: additionalInfo.reason || 'Alamat baru dibuat',
                metadata: {
                    creationMethod: additionalInfo.method || 'manual', // manual, import, api
                    sourceData: additionalInfo.sourceData || null,
                    validationResults: additionalInfo.validationResults || null
                }
            };

            return await this.repository.logHistory(
                address.id,
                historyEntry.action,
                historyEntry.changes,
                historyEntry.performedBy,
                historyEntry.reason
            );

        } catch (error) {
            console.error('Error logging address creation:', error);
            throw error;
        }
    }

    /**
     * Log address updates with detailed change tracking
     */
    async logAddressUpdate(addressId, oldData, newData, updatedBy, reason = '') {
        try {
            const changes = this.calculateDetailedChanges(oldData, newData);
            
            if (changes.length === 0) {
                return null; // No changes to log
            }

            const historyEntry = {
                addressId: addressId,
                action: HISTORY_ACTIONS.UPDATED,
                changes: changes,
                performedBy: updatedBy,
                reason: reason || 'Alamat diperbarui',
                metadata: {
                    updateType: this.categorizeUpdate(changes),
                    fieldsChanged: changes.map(c => c.field),
                    changeCount: changes.length
                }
            };

            return await this.repository.logHistory(
                addressId,
                historyEntry.action,
                historyEntry.changes,
                historyEntry.performedBy,
                historyEntry.reason
            );

        } catch (error) {
            console.error('Error logging address update:', error);
            throw error;
        }
    }

    /**
     * Log address usage with delivery context
     */
    async logAddressUsage(addressId, usageData, usedBy) {
        try {
            const historyEntry = {
                addressId: addressId,
                action: HISTORY_ACTIONS.USED,
                changes: null,
                performedBy: usedBy,
                reason: this.formatUsageReason(usageData),
                metadata: {
                    deliverySuccess: usageData.deliverySuccess,
                    deliveryTime: usageData.deliveryTime,
                    deliveryNotes: usageData.notes,
                    orderId: usageData.orderId,
                    customerFeedback: usageData.customerFeedback
                }
            };

            return await this.repository.logHistory(
                addressId,
                historyEntry.action,
                historyEntry.changes,
                historyEntry.performedBy,
                historyEntry.reason
            );

        } catch (error) {
            console.error('Error logging address usage:', error);
            throw error;
        }
    }

    /**
     * Log status changes with context
     */
    async logStatusChange(addressId, oldStatus, newStatus, changedBy, context = {}) {
        try {
            const changes = [{
                field: 'status',
                oldValue: oldStatus,
                newValue: newStatus
            }];

            const historyEntry = {
                addressId: addressId,
                action: this.getStatusChangeAction(newStatus),
                changes: changes,
                performedBy: changedBy,
                reason: context.reason || `Status diubah dari ${oldStatus} ke ${newStatus}`,
                metadata: {
                    statusChangeType: this.categorizeStatusChange(oldStatus, newStatus),
                    automatic: context.automatic || false,
                    verificationData: context.verificationData || null,
                    problematicReason: context.problematicReason || null
                }
            };

            return await this.repository.logHistory(
                addressId,
                historyEntry.action,
                historyEntry.changes,
                historyEntry.performedBy,
                historyEntry.reason
            );

        } catch (error) {
            console.error('Error logging status change:', error);
            throw error;
        }
    }

    /**
     * Get comprehensive history for an address
     */
    async getAddressHistory(addressId, options = {}) {
        try {
            const history = await this.repository.getHistory(addressId);
            
            // Apply filters if specified
            let filteredHistory = history;
            
            if (options.actionType) {
                filteredHistory = filteredHistory.filter(entry => 
                    entry.action === options.actionType
                );
            }

            if (options.performedBy) {
                filteredHistory = filteredHistory.filter(entry => 
                    entry.performedBy === options.performedBy
                );
            }

            if (options.dateRange) {
                const { start, end } = options.dateRange;
                filteredHistory = filteredHistory.filter(entry => {
                    const entryDate = new Date(entry.timestamp);
                    return entryDate >= new Date(start) && entryDate <= new Date(end);
                });
            }

            // Enhance history entries with formatted information
            const enhancedHistory = filteredHistory.map(entry => ({
                ...entry,
                formattedTimestamp: formatDate(entry.timestamp),
                changesSummary: this.summarizeChanges(entry.changes),
                actionDescription: this.getActionDescription(entry.action, entry.changes)
            }));

            // Apply pagination if specified
            if (options.limit) {
                const offset = options.offset || 0;
                return enhancedHistory.slice(offset, offset + options.limit);
            }

            return enhancedHistory;

        } catch (error) {
            console.error('Error getting address history:', error);
            throw error;
        }
    }

    /**
     * Get history summary for reporting
     */
    async getHistorySummary(addressId) {
        try {
            const history = await this.repository.getHistory(addressId);
            
            const summary = {
                totalEntries: history.length,
                createdAt: history.find(h => h.action === HISTORY_ACTIONS.CREATED)?.timestamp,
                lastUpdated: history.find(h => h.action === HISTORY_ACTIONS.UPDATED)?.timestamp,
                lastUsed: history.find(h => h.action === HISTORY_ACTIONS.USED)?.timestamp,
                usageCount: history.filter(h => h.action === HISTORY_ACTIONS.USED).length,
                updateCount: history.filter(h => h.action === HISTORY_ACTIONS.UPDATED).length,
                statusChanges: history.filter(h => 
                    [HISTORY_ACTIONS.VERIFIED, HISTORY_ACTIONS.MARKED_PROBLEMATIC].includes(h.action)
                ).length,
                contributors: [...new Set(history.map(h => h.performedBy).filter(Boolean))],
                recentActivity: history.slice(0, 5).map(entry => ({
                    action: entry.action,
                    timestamp: entry.timestamp,
                    performedBy: entry.performedBy
                }))
            };

            return summary;

        } catch (error) {
            console.error('Error getting history summary:', error);
            throw error;
        }
    }

    /**
     * Generate activity timeline for display
     */
    async generateActivityTimeline(addressId, limit = 10) {
        try {
            const history = await this.getAddressHistory(addressId, { limit });
            
            const timeline = history.map(entry => ({
                id: entry.id,
                timestamp: entry.timestamp,
                formattedTime: formatDate(entry.timestamp),
                icon: this.getActionIcon(entry.action),
                title: this.getActionTitle(entry.action),
                description: entry.reason,
                performer: entry.performedBy,
                changes: entry.changesSummary,
                metadata: entry.metadata
            }));

            return {
                success: true,
                data: timeline
            };

        } catch (error) {
            console.error('Error generating activity timeline:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Export history data for reporting
     */
    async exportHistoryData(addressId, format = 'json') {
        try {
            const address = await this.repository.findById(addressId);
            const history = await this.getAddressHistory(addressId);
            const summary = await this.getHistorySummary(addressId);

            const exportData = {
                address: address,
                summary: summary,
                history: history,
                exportedAt: new Date().toISOString(),
                exportedBy: 'system'
            };

            if (format === 'csv') {
                return this.convertToCSV(exportData);
            }

            return {
                success: true,
                data: exportData,
                format: format
            };

        } catch (error) {
            console.error('Error exporting history data:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Helper methods
     */
    calculateDetailedChanges(oldData, newData) {
        const changes = [];
        
        // Compare all fields
        const allFields = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
        
        for (const field of allFields) {
            if (['updatedAt', 'updatedBy'].includes(field)) continue;
            
            const oldValue = oldData[field];
            const newValue = newData[field];
            
            if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
                changes.push({
                    field: field,
                    oldValue: oldValue,
                    newValue: newValue,
                    changeType: this.getChangeType(oldValue, newValue)
                });
            }
        }
        
        return changes;
    }

    categorizeUpdate(changes) {
        const fieldTypes = {
            contact: ['customerName', 'customerPhone'],
            address: ['address'],
            status: ['status', 'isProblematic', 'verifiedBy'],
            metadata: ['notes', 'tags', 'coordinates']
        };

        const changedFields = changes.map(c => c.field);
        
        for (const [category, fields] of Object.entries(fieldTypes)) {
            if (fields.some(field => changedFields.includes(field))) {
                return category;
            }
        }
        
        return 'other';
    }

    getStatusChangeAction(newStatus) {
        const statusActions = {
            'verified': HISTORY_ACTIONS.VERIFIED,
            'problematic': HISTORY_ACTIONS.MARKED_PROBLEMATIC,
            'unverified': HISTORY_ACTIONS.UPDATED
        };
        
        return statusActions[newStatus] || HISTORY_ACTIONS.UPDATED;
    }

    categorizeStatusChange(oldStatus, newStatus) {
        if (oldStatus === 'unverified' && newStatus === 'verified') {
            return 'verification';
        } else if (newStatus === 'problematic') {
            return 'mark_problematic';
        } else if (oldStatus === 'problematic' && newStatus !== 'problematic') {
            return 'resolve_problematic';
        }
        
        return 'status_update';
    }

    formatUsageReason(usageData) {
        let reason = 'Alamat digunakan untuk pengiriman';
        
        if (usageData.orderId) {
            reason += ` (Order: ${usageData.orderId})`;
        }
        
        if (usageData.deliverySuccess !== undefined) {
            reason += usageData.deliverySuccess ? ' - Berhasil' : ' - Gagal';
        }
        
        if (usageData.deliveryTime) {
            reason += ` - Waktu: ${usageData.deliveryTime} menit`;
        }
        
        return reason;
    }

    summarizeChanges(changes) {
        if (!changes || changes.length === 0) {
            return null;
        }
        
        return changes.map(change => {
            const fieldName = this.getFieldDisplayName(change.field);
            return `${fieldName}: ${this.formatChangeValue(change.oldValue)} → ${this.formatChangeValue(change.newValue)}`;
        }).join(', ');
    }

    getActionDescription(action, changes) {
        const descriptions = {
            [HISTORY_ACTIONS.CREATED]: 'Alamat dibuat',
            [HISTORY_ACTIONS.UPDATED]: 'Alamat diperbarui',
            [HISTORY_ACTIONS.USED]: 'Alamat digunakan',
            [HISTORY_ACTIONS.VERIFIED]: 'Alamat diverifikasi',
            [HISTORY_ACTIONS.MARKED_PROBLEMATIC]: 'Alamat ditandai bermasalah'
        };
        
        return descriptions[action] || 'Aksi tidak dikenal';
    }

    getActionIcon(action) {
        const icons = {
            [HISTORY_ACTIONS.CREATED]: '➕',
            [HISTORY_ACTIONS.UPDATED]: '📝',
            [HISTORY_ACTIONS.USED]: '📦',
            [HISTORY_ACTIONS.VERIFIED]: '✅',
            [HISTORY_ACTIONS.MARKED_PROBLEMATIC]: '⚠️'
        };
        
        return icons[action] || '📋';
    }

    getActionTitle(action) {
        const titles = {
            [HISTORY_ACTIONS.CREATED]: 'Alamat Dibuat',
            [HISTORY_ACTIONS.UPDATED]: 'Alamat Diperbarui',
            [HISTORY_ACTIONS.USED]: 'Alamat Digunakan',
            [HISTORY_ACTIONS.VERIFIED]: 'Alamat Diverifikasi',
            [HISTORY_ACTIONS.MARKED_PROBLEMATIC]: 'Ditandai Bermasalah'
        };
        
        return titles[action] || 'Aktivitas';
    }

    getChangeType(oldValue, newValue) {
        if (oldValue === null || oldValue === undefined) {
            return 'added';
        } else if (newValue === null || newValue === undefined) {
            return 'removed';
        } else {
            return 'modified';
        }
    }

    getFieldDisplayName(field) {
        const displayNames = {
            customerName: 'Nama',
            customerPhone: 'Telepon',
            address: 'Alamat',
            status: 'Status',
            notes: 'Catatan',
            isProblematic: 'Status Bermasalah',
            verifiedBy: 'Diverifikasi Oleh'
        };
        
        return displayNames[field] || field;
    }

    formatChangeValue(value) {
        if (value === null || value === undefined) {
            return '(kosong)';
        } else if (typeof value === 'object') {
            return JSON.stringify(value);
        } else if (typeof value === 'boolean') {
            return value ? 'Ya' : 'Tidak';
        }
        
        return String(value);
    }

    convertToCSV(exportData) {
        // Simple CSV conversion for history data
        const headers = ['Timestamp', 'Action', 'Performed By', 'Reason', 'Changes'];
        const rows = exportData.history.map(entry => [
            entry.timestamp,
            entry.action,
            entry.performedBy || '',
            entry.reason || '',
            entry.changesSummary || ''
        ]);
        
        const csvContent = [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');
        
        return {
            success: true,
            data: csvContent,
            format: 'csv'
        };
    }
}

module.exports = AddressHistoryLogger;