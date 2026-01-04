/**
 * Address Repository
 * Data access layer for address management with JSON file-based persistence
 */

const fs = require('fs');
const path = require('path');
const Database = require('./Database');
const { AddressModel, AddressHistoryModel } = require('./AddressModels');
const { DB_COLLECTIONS, ERROR_CODES } = require('./AddressConstants');
const { generateId, parseSearchQuery, sortAddressesByRelevance } = require('./AddressUtils');

class AddressRepository {
    constructor() {
        this.db = new Database();
        this.addressFile = path.join('storage', 'addresses.json');
        this.historyFile = path.join('storage', 'address_history.json');
        this.initialized = false;
    }

    /**
     * Initialize repository and ensure data structure exists
     */
    async initialize() {
        if (this.initialized) return;

        try {
            // Ensure address data structure exists
            await this.ensureDataStructure();
            this.initialized = true;
        } catch (error) {
            console.error('Failed to initialize AddressRepository:', error);
            throw new Error('Repository initialization failed');
        }
    }

    /**
     * Ensure data structure exists in database
     */
    async ensureDataStructure() {
        try {
            const data = await this.db.read();
            
            // Initialize addresses collection if not exists
            if (!data.addresses) {
                data.addresses = {};
            }
            
            // Initialize address history if not exists
            if (!data.address_history) {
                data.address_history = {};
            }
            
            await this.db.write(data);
        } catch (error) {
            console.error('Error ensuring data structure:', error);
            throw error;
        }
    }

    /**
     * Save address to database
     */
    async save(addressData) {
        await this.initialize();
        
        try {
            const data = await this.db.read();
            
            // Create new address model
            const address = new AddressModel(addressData);
            
            // Save to addresses collection
            data.addresses[address.id] = address.toJSON();
            
            await this.db.write(data);
            
            // Also save to CRM if this is a WhatsApp customer
            const customerId = addressData.customerId;
            if (customerId && customerId.includes('@s.whatsapp.net')) {
                await this.updateCRMCustomer(customerId, addressData);
            }
            
            // Log creation in history
            await this.logHistory(address.id, 'created', null, address.createdBy, 'Address created');
            
            return address.toJSON();
        } catch (error) {
            console.error('Error saving address:', error);
            throw new Error(`Failed to save address: ${error.message}`);
        }
    }

    /**
     * Find address by ID
     */
    async findById(id) {
        await this.initialize();
        
        try {
            const data = await this.db.read();
            
            if (!data.addresses || !data.addresses[id]) {
                return null;
            }
            
            return data.addresses[id];
        } catch (error) {
            console.error('Error finding address by ID:', error);
            throw new Error(`Failed to find address: ${error.message}`);
        }
    }

    /**
     * Find addresses by customer ID or phone
     */
    async findByCustomer(customerId) {
        await this.initialize();
        
        try {
            const data = await this.db.read();
            
            let addresses = [];
            
            // Search in address collection
            if (data.addresses) {
                const addressMatches = Object.values(data.addresses).filter(address => {
                    return address.customerId === customerId || 
                           address.customerPhone === customerId ||
                           address.customerPhone === customerId.replace('@s.whatsapp.net', '') ||
                           address.customerId === customerId + '@s.whatsapp.net';
                });
                addresses = addresses.concat(addressMatches);
            }
            
            // Search in CRM data
            const crmAddresses = await this.getCRMAddresses();
            const crmMatches = crmAddresses.filter(address => {
                return address.customerId === customerId || 
                       address.customerPhone === customerId ||
                       address.customerPhone === customerId.replace('@s.whatsapp.net', '') ||
                       address.customerId === customerId + '@s.whatsapp.net';
            });
            addresses = addresses.concat(crmMatches);
            
            return sortAddressesByRelevance(addresses);
        } catch (error) {
            console.error('Error finding addresses by customer:', error);
            throw new Error(`Failed to find customer addresses: ${error.message}`);
        }
    }

    /**
     * Search addresses with various criteria
     */
    async search(criteria) {
        await this.initialize();
        
        try {
            const data = await this.db.read();
            
            // Get addresses from both address collection and CRM data
            let addresses = [];
            
            // Get addresses from address collection
            if (data.addresses) {
                addresses = Object.values(data.addresses);
            }
            
            // Get addresses from CRM data and convert to address format
            const crmAddresses = await this.getCRMAddresses();
            addresses = addresses.concat(crmAddresses);
            
            // Apply search filters
            if (criteria.query) {
                addresses = this.filterByQuery(addresses, criteria.query);
            }
            
            if (criteria.status) {
                addresses = addresses.filter(addr => addr.status === criteria.status);
            }
            
            if (criteria.isProblematic !== undefined) {
                addresses = addresses.filter(addr => addr.isProblematic === criteria.isProblematic);
            }
            
            if (criteria.createdBy) {
                addresses = addresses.filter(addr => addr.createdBy === criteria.createdBy);
            }
            
            // Sort results
            addresses = sortAddressesByRelevance(addresses);
            
            // Apply pagination if specified
            if (criteria.limit) {
                const offset = criteria.offset || 0;
                addresses = addresses.slice(offset, offset + criteria.limit);
            }
            
            return addresses;
        } catch (error) {
            console.error('Error searching addresses:', error);
            throw new Error(`Failed to search addresses: ${error.message}`);
        }
    }

    /**
     * Filter addresses by search query
     */
    filterByQuery(addresses, query) {
        const { terms, type } = parseSearchQuery(query);
        
        if (terms.length === 0) {
            return addresses;
        }
        
        return addresses.filter(address => {
            const searchText = this.buildSearchText(address).toLowerCase();
            
            if (type === 'phone') {
                // Phone number search
                const normalizedPhone = (address.customerPhone || '').replace(/[^\d]/g, '');
                return terms.some(term => {
                    const normalizedTerm = term.replace(/[^\d]/g, '');
                    return normalizedPhone.includes(normalizedTerm);
                });
            } else {
                // Text search - check if any term matches
                return terms.some(term => {
                    const termLower = term.toLowerCase();
                    
                    // Check customer name (partial match)
                    if (address.customerName && address.customerName.toLowerCase().includes(termLower)) {
                        return true;
                    }
                    
                    // Check phone number
                    if (address.customerPhone && address.customerPhone.includes(term)) {
                        return true;
                    }
                    
                    // Check full search text
                    return searchText.includes(termLower);
                });
            }
        });
    }

    /**
     * Build searchable text from address data
     */
    buildSearchText(address) {
        const addressParts = [];
        
        // Add customer info
        if (address.customerName) addressParts.push(address.customerName);
        if (address.customerPhone) addressParts.push(address.customerPhone);
        
        // Add address components
        if (address.address) {
            if (address.address.street) addressParts.push(address.address.street);
            if (address.address.district) addressParts.push(address.address.district);
            if (address.address.city) addressParts.push(address.address.city);
            if (address.address.landmark) addressParts.push(address.address.landmark);
        }
        
        // Add notes
        if (address.notes) addressParts.push(address.notes);
        
        return addressParts.filter(Boolean).join(' ');
    }

    /**
     * Update address
     */
    async update(id, updates) {
        await this.initialize();
        
        try {
            const data = await this.db.read();
            
            if (!data.addresses || !data.addresses[id]) {
                throw new Error('Address not found');
            }
            
            const currentAddress = data.addresses[id];
            const changes = this.calculateChanges(currentAddress, updates);
            
            // Apply updates
            Object.assign(data.addresses[id], updates);
            data.addresses[id].updatedAt = new Date().toISOString();
            
            await this.db.write(data);
            
            // Update CRM data if this is a CRM customer
            if (currentAddress.source === 'crm' || id.startsWith('crm_')) {
                const customerId = currentAddress.customerId;
                await this.updateCRMCustomer(customerId, updates);
            }
            
            // Log changes in history
            if (changes.length > 0) {
                await this.logHistory(id, 'updated', changes, updates.updatedBy, updates.updateReason);
            }
            
            return data.addresses[id];
        } catch (error) {
            console.error('Error updating address:', error);
            throw new Error(`Failed to update address: ${error.message}`);
        }
    }

    /**
     * Calculate changes between current and updated data
     */
    calculateChanges(current, updates) {
        const changes = [];
        
        for (const [key, newValue] of Object.entries(updates)) {
            if (key === 'updatedBy' || key === 'updateReason') continue;
            
            const currentValue = current[key];
            
            if (JSON.stringify(currentValue) !== JSON.stringify(newValue)) {
                changes.push({
                    field: key,
                    oldValue: currentValue,
                    newValue: newValue
                });
            }
        }
        
        return changes;
    }

    /**
     * Delete address (soft delete by marking as deleted)
     */
    async delete(id) {
        await this.initialize();
        
        try {
            const data = await this.db.read();
            
            if (!data.addresses || !data.addresses[id]) {
                throw new Error('Address not found');
            }
            
            // Soft delete by marking as deleted
            data.addresses[id].isDeleted = true;
            data.addresses[id].deletedAt = new Date().toISOString();
            
            await this.db.write(data);
            
            // Log deletion in history
            await this.logHistory(id, 'deleted', null, null, 'Address deleted');
            
            return true;
        } catch (error) {
            console.error('Error deleting address:', error);
            throw new Error(`Failed to delete address: ${error.message}`);
        }
    }

    /**
     * Get all addresses (excluding deleted)
     */
    async findAll(includeDeleted = false) {
        await this.initialize();
        
        try {
            const data = await this.db.read();
            
            let addresses = [];
            
            // Get addresses from address collection
            if (data.addresses) {
                addresses = Object.values(data.addresses);
            }
            
            // Get addresses from CRM data
            const crmAddresses = await this.getCRMAddresses();
            addresses = addresses.concat(crmAddresses);
            
            if (!includeDeleted) {
                addresses = addresses.filter(addr => !addr.isDeleted);
            }
            
            return sortAddressesByRelevance(addresses);
        } catch (error) {
            console.error('Error finding all addresses:', error);
            throw new Error(`Failed to retrieve addresses: ${error.message}`);
        }
    }

    /**
     * Mark address as used (update usage statistics)
     */
    async markAsUsed(id, usedBy = null) {
        await this.initialize();
        
        try {
            const data = await this.db.read();
            
            if (!data.addresses || !data.addresses[id]) {
                throw new Error('Address not found');
            }
            
            // Update usage statistics
            data.addresses[id].lastUsed = new Date().toISOString();
            data.addresses[id].usageCount = (data.addresses[id].usageCount || 0) + 1;
            
            await this.db.write(data);
            
            // Log usage in history
            await this.logHistory(id, 'used', null, usedBy, 'Address used for delivery');
            
            return data.addresses[id];
        } catch (error) {
            console.error('Error marking address as used:', error);
            throw new Error(`Failed to mark address as used: ${error.message}`);
        }
    }

    /**
     * Get addresses by status
     */
    async findByStatus(status) {
        await this.initialize();
        
        try {
            const data = await this.db.read();
            
            if (!data.addresses) {
                return [];
            }
            
            const addresses = Object.values(data.addresses).filter(address => {
                return address.status === status && !address.isDeleted;
            });
            
            return sortAddressesByRelevance(addresses);
        } catch (error) {
            console.error('Error finding addresses by status:', error);
            throw new Error(`Failed to find addresses by status: ${error.message}`);
        }
    }

    /**
     * Get problematic addresses
     */
    async findProblematic() {
        return await this.search({ isProblematic: true });
    }

    /**
     * Log action in address history
     */
    async logHistory(addressId, action, changes = null, performedBy = null, reason = '') {
        try {
            const data = await this.db.read();
            
            if (!data.address_history) {
                data.address_history = {};
            }
            
            const historyEntry = new AddressHistoryModel({
                addressId,
                action,
                changes,
                performedBy,
                reason
            });
            
            data.address_history[historyEntry.id] = historyEntry.toJSON();
            
            await this.db.write(data);
            
            return historyEntry.toJSON();
        } catch (error) {
            console.error('Error logging address history:', error);
            // Don't throw error for history logging failures
        }
    }

    /**
     * Get address history
     */
    async getHistory(addressId) {
        await this.initialize();
        
        try {
            const data = await this.db.read();
            
            if (!data.address_history) {
                return [];
            }
            
            const history = Object.values(data.address_history)
                .filter(entry => entry.addressId === addressId)
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            return history;
        } catch (error) {
            console.error('Error getting address history:', error);
            throw new Error(`Failed to get address history: ${error.message}`);
        }
    }

    /**
     * Get CRM addresses and convert to address format
     */
    async getCRMAddresses() {
        try {
            const crmPath = path.join('data', 'crm_data.json');
            
            if (!fs.existsSync(crmPath)) {
                return [];
            }
            
            const crmData = JSON.parse(fs.readFileSync(crmPath, 'utf8'));
            
            if (!crmData.customers) {
                return [];
            }
            
            const crmAddresses = [];
            
            for (const [customerId, customer] of Object.entries(crmData.customers)) {
                // Convert CRM customer to address format
                const address = {
                    id: `crm_${customerId}`,
                    customerId: customerId,
                    customerName: customer.name || 'Tidak diketahui',
                    customerPhone: customer.phone || customerId.replace('@s.whatsapp.net', ''),
                    address: {
                        street: customer.address || '',
                        district: '',
                        city: '',
                        postalCode: '',
                        landmark: ''
                    },
                    coordinates: {
                        latitude: customer.latitude || null,
                        longitude: customer.longitude || null
                    },
                    status: 'unverified',
                    verifiedBy: null,
                    verifiedAt: null,
                    notes: '',
                    createdBy: 'system',
                    createdAt: customer.joined || new Date().toISOString(),
                    lastUsed: null,
                    usageCount: customer.orders_count || 0,
                    isProblematic: false,
                    problematicReason: null,
                    tags: ['crm_customer'],
                    source: 'crm'
                };
                
                crmAddresses.push(address);
            }
            
            return crmAddresses;
        } catch (error) {
            console.error('Error getting CRM addresses:', error);
            return [];
        }
    }

    /**
     * Update CRM customer data with new address and coordinates
     */
    async updateCRMCustomer(customerId, addressData) {
        try {
            const crmPath = path.join('data', 'crm_data.json');
            
            if (!fs.existsSync(crmPath)) {
                return false;
            }
            
            const crmData = JSON.parse(fs.readFileSync(crmPath, 'utf8'));
            
            if (!crmData.customers || !crmData.customers[customerId]) {
                return false;
            }
            
            // Update CRM customer data
            if (addressData.customerName) {
                crmData.customers[customerId].name = addressData.customerName;
            }
            
            if (addressData.address && addressData.address.street) {
                crmData.customers[customerId].address = addressData.address.street;
            }
            
            if (addressData.coordinates) {
                if (addressData.coordinates.latitude) {
                    crmData.customers[customerId].latitude = addressData.coordinates.latitude;
                }
                if (addressData.coordinates.longitude) {
                    crmData.customers[customerId].longitude = addressData.coordinates.longitude;
                }
            }
            
            // Write back to file
            fs.writeFileSync(crmPath, JSON.stringify(crmData, null, 2));
            
            return true;
        } catch (error) {
            console.error('Error updating CRM customer:', error);
            return false;
        }
    }

    /**
     * Get statistics
     */
    async getStatistics() {
        await this.initialize();
        
        try {
            const data = await this.db.read();
            
            let addresses = [];
            
            // Get addresses from address collection
            if (data.addresses) {
                addresses = Object.values(data.addresses).filter(addr => !addr.isDeleted);
            }
            
            // Get addresses from CRM data
            const crmAddresses = await this.getCRMAddresses();
            addresses = addresses.concat(crmAddresses);
            
            return {
                total: addresses.length,
                verified: addresses.filter(addr => addr.status === 'verified').length,
                unverified: addresses.filter(addr => addr.status === 'unverified').length,
                problematic: addresses.filter(addr => addr.isProblematic).length,
                crmCustomers: crmAddresses.length
            };
        } catch (error) {
            console.error('Error getting statistics:', error);
            throw new Error(`Failed to get statistics: ${error.message}`);
        }
    }
}

module.exports = AddressRepository;