/**
 * Address Management Data Models
 * Defines the structure and validation for address-related data
 */

// Address Status Constants
const ADDRESS_STATUS = {
    VERIFIED: 'verified',
    UNVERIFIED: 'unverified', 
    PROBLEMATIC: 'problematic'
};

// Address History Action Types
const HISTORY_ACTIONS = {
    CREATED: 'created',
    UPDATED: 'updated',
    USED: 'used',
    MARKED_PROBLEMATIC: 'marked_problematic',
    VERIFIED: 'verified'
};

/**
 * Address Model Structure
 * Represents a customer address with all necessary metadata
 */
class AddressModel {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.customerId = data.customerId || null;
        this.customerName = data.customerName || '';
        this.customerPhone = data.customerPhone || '';
        this.address = {
            street: data.address?.street || '',
            district: data.address?.district || '',
            city: data.address?.city || '',
            postalCode: data.address?.postalCode || '',
            landmark: data.address?.landmark || ''
        };
        this.coordinates = {
            latitude: data.coordinates?.latitude || null,
            longitude: data.coordinates?.longitude || null
        };
        this.status = data.status || ADDRESS_STATUS.UNVERIFIED;
        this.verifiedBy = data.verifiedBy || null;
        this.verifiedAt = data.verifiedAt || null;
        this.notes = data.notes || '';
        this.createdBy = data.createdBy || null;
        this.createdAt = data.createdAt || new Date().toISOString();
        this.lastUsed = data.lastUsed || null;
        this.usageCount = data.usageCount || 0;
        this.isProblematic = data.isProblematic || false;
        this.problematicReason = data.problematicReason || null;
        this.tags = data.tags || [];
    }

    generateId() {
        return 'addr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    toJSON() {
        return {
            id: this.id,
            customerId: this.customerId,
            customerName: this.customerName,
            customerPhone: this.customerPhone,
            address: this.address,
            coordinates: this.coordinates,
            status: this.status,
            verifiedBy: this.verifiedBy,
            verifiedAt: this.verifiedAt,
            notes: this.notes,
            createdBy: this.createdBy,
            createdAt: this.createdAt,
            lastUsed: this.lastUsed,
            usageCount: this.usageCount,
            isProblematic: this.isProblematic,
            problematicReason: this.problematicReason,
            tags: this.tags
        };
    }
}

/**
 * Address History Model Structure
 * Tracks all changes and actions performed on addresses
 */
class AddressHistoryModel {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.addressId = data.addressId || '';
        this.action = data.action || '';
        this.changes = data.changes || null;
        this.performedBy = data.performedBy || null;
        this.timestamp = data.timestamp || new Date().toISOString();
        this.reason = data.reason || '';
    }

    generateId() {
        return 'hist_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    toJSON() {
        return {
            id: this.id,
            addressId: this.addressId,
            action: this.action,
            changes: this.changes,
            performedBy: this.performedBy,
            timestamp: this.timestamp,
            reason: this.reason
        };
    }
}

module.exports = {
    AddressModel,
    AddressHistoryModel,
    ADDRESS_STATUS,
    HISTORY_ACTIONS
};