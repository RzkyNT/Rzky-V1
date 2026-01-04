/**
 * Address Service
 * Business logic layer for address management operations
 */

const AddressRepository = require('./AddressRepository');
const AddressSearch = require('./AddressSearch');
const { validateAddressData, checkAddressSimilarity, ValidationError } = require('./AddressValidation');
const { ADDRESS_STATUS, HISTORY_ACTIONS, ERROR_CODES, SUCCESS_MESSAGES, ERROR_MESSAGES } = require('./AddressConstants');
const { generateCustomerId, formatAddressForDisplay } = require('./AddressUtils');

class AddressService {
    constructor() {
        this.repository = new AddressRepository();
        this.search = new AddressSearch(this.repository);
    }

    /**
     * Create new address with validation and duplicate checking
     */
    async createAddress(addressData, createdBy = null) {
        try {
            // Validate address data
            const validatedData = validateAddressData(addressData);
            
            // Generate customer ID if not provided
            if (!validatedData.customerId) {
                validatedData.customerId = generateCustomerId(validatedData.customerPhone);
            }
            
            // Check for duplicate addresses
            const existingAddresses = await this.repository.findByCustomer(validatedData.customerPhone);
            const duplicateCheck = checkAddressSimilarity(validatedData, existingAddresses);
            
            if (duplicateCheck && duplicateCheck.type === 'duplicate') {
                return {
                    success: false,
                    error: {
                        code: ERROR_CODES.DUPLICATE_ADDRESS,
                        message: ERROR_MESSAGES.DUPLICATE_ADDRESS,
                        existingAddress: duplicateCheck.existingAddress,
                        similarity: duplicateCheck.similarity
                    }
                };
            }
            
            // Set creation metadata
            validatedData.createdBy = createdBy;
            validatedData.createdAt = new Date().toISOString();
            validatedData.status = validatedData.status || ADDRESS_STATUS.UNVERIFIED;
            
            // Save address
            const savedAddress = await this.repository.save(validatedData);
            
            return {
                success: true,
                message: SUCCESS_MESSAGES.ADDRESS_CREATED,
                data: savedAddress,
                duplicateWarning: duplicateCheck && duplicateCheck.type === 'similar_address' ? duplicateCheck : null
            };
            
        } catch (error) {
            console.error('Error creating address:', error);
            
            if (error instanceof ValidationError) {
                return {
                    success: false,
                    error: {
                        code: error.code,
                        message: error.message,
                        field: error.field
                    }
                };
            }
            
            return {
                success: false,
                error: {
                    code: ERROR_CODES.DATABASE_ERROR,
                    message: ERROR_MESSAGES.DATABASE_ERROR
                }
            };
        }
    }

    /**
     * Update existing address
     */
    async updateAddress(addressId, updates, updatedBy = null) {
        try {
            // Check if address exists
            const existingAddress = await this.repository.findById(addressId);
            if (!existingAddress) {
                return {
                    success: false,
                    error: {
                        code: ERROR_CODES.NOT_FOUND,
                        message: ERROR_MESSAGES.ADDRESS_NOT_FOUND
                    }
                };
            }
            
            // Validate updates
            const validatedUpdates = validateAddressData({ ...existingAddress, ...updates });
            
            // Check for duplicates if key fields are being updated
            const keyFieldsChanged = updates.customerPhone || updates.customerName || updates.address;
            if (keyFieldsChanged) {
                const existingAddresses = await this.repository.findByCustomer(
                    validatedUpdates.customerPhone
                );
                
                // Filter out current address from duplicate check
                const otherAddresses = existingAddresses.filter(addr => addr.id !== addressId);
                const duplicateCheck = checkAddressSimilarity(validatedUpdates, otherAddresses);
                
                if (duplicateCheck && duplicateCheck.type === 'duplicate') {
                    return {
                        success: false,
                        error: {
                            code: ERROR_CODES.DUPLICATE_ADDRESS,
                            message: ERROR_MESSAGES.DUPLICATE_ADDRESS,
                            existingAddress: duplicateCheck.existingAddress
                        }
                    };
                }
            }
            
            // Add update metadata
            validatedUpdates.updatedBy = updatedBy;
            validatedUpdates.updatedAt = new Date().toISOString();
            
            // Update address
            const updatedAddress = await this.repository.update(addressId, validatedUpdates);
            
            return {
                success: true,
                message: SUCCESS_MESSAGES.ADDRESS_UPDATED,
                data: updatedAddress
            };
            
        } catch (error) {
            console.error('Error updating address:', error);
            
            if (error instanceof ValidationError) {
                return {
                    success: false,
                    error: {
                        code: error.code,
                        message: error.message,
                        field: error.field
                    }
                };
            }
            
            return {
                success: false,
                error: {
                    code: ERROR_CODES.DATABASE_ERROR,
                    message: ERROR_MESSAGES.DATABASE_ERROR
                }
            };
        }
    }

    /**
     * Search addresses with various criteria
     */
    async searchAddresses(searchTerm, options = {}) {
        try {
            const searchResults = await this.search.search(searchTerm, options);
            
            return {
                success: true,
                data: searchResults
            };
            
        } catch (error) {
            console.error('Error searching addresses:', error);
            
            return {
                success: false,
                error: {
                    code: ERROR_CODES.DATABASE_ERROR,
                    message: 'Gagal mencari alamat'
                }
            };
        }
    }

    /**
     * Get address history for audit trail
     */
    async getAddressHistory(addressId) {
        try {
            const address = await this.repository.findById(addressId);
            if (!address) {
                return {
                    success: false,
                    error: {
                        code: ERROR_CODES.NOT_FOUND,
                        message: ERROR_MESSAGES.ADDRESS_NOT_FOUND
                    }
                };
            }
            
            const history = await this.repository.getHistory(addressId);
            
            return {
                success: true,
                data: {
                    address: address,
                    history: history
                }
            };
            
        } catch (error) {
            console.error('Error getting address history:', error);
            
            return {
                success: false,
                error: {
                    code: ERROR_CODES.DATABASE_ERROR,
                    message: 'Gagal mengambil riwayat alamat'
                }
            };
        }
    }

    /**
     * Mark address as problematic
     */
    async markAddressAsProblematic(addressId, reason, markedBy = null) {
        try {
            const address = await this.repository.findById(addressId);
            if (!address) {
                return {
                    success: false,
                    error: {
                        code: ERROR_CODES.NOT_FOUND,
                        message: ERROR_MESSAGES.ADDRESS_NOT_FOUND
                    }
                };
            }
            
            const updates = {
                isProblematic: true,
                problematicReason: reason,
                status: ADDRESS_STATUS.PROBLEMATIC,
                updatedBy: markedBy,
                updatedAt: new Date().toISOString()
            };
            
            const updatedAddress = await this.repository.update(addressId, updates);
            
            // Log in history
            await this.repository.logHistory(
                addressId,
                HISTORY_ACTIONS.MARKED_PROBLEMATIC,
                [{ field: 'isProblematic', oldValue: false, newValue: true }],
                markedBy,
                reason
            );
            
            return {
                success: true,
                message: SUCCESS_MESSAGES.ADDRESS_MARKED_PROBLEMATIC,
                data: updatedAddress
            };
            
        } catch (error) {
            console.error('Error marking address as problematic:', error);
            
            return {
                success: false,
                error: {
                    code: ERROR_CODES.DATABASE_ERROR,
                    message: 'Gagal menandai alamat bermasalah'
                }
            };
        }
    }

    /**
     * Remove problematic status from address
     */
    async unmarkAddressAsProblematic(addressId, unmarkedBy = null) {
        try {
            const address = await this.repository.findById(addressId);
            if (!address) {
                return {
                    success: false,
                    error: {
                        code: ERROR_CODES.NOT_FOUND,
                        message: ERROR_MESSAGES.ADDRESS_NOT_FOUND
                    }
                };
            }
            
            const updates = {
                isProblematic: false,
                problematicReason: null,
                status: ADDRESS_STATUS.UNVERIFIED,
                updatedBy: unmarkedBy,
                updatedAt: new Date().toISOString()
            };
            
            const updatedAddress = await this.repository.update(addressId, updates);
            
            // Log in history
            await this.repository.logHistory(
                addressId,
                HISTORY_ACTIONS.UNMARKED_PROBLEMATIC,
                [{ field: 'isProblematic', oldValue: true, newValue: false }],
                unmarkedBy,
                'Tanda bermasalah dihapus'
            );
            
            return {
                success: true,
                message: SUCCESS_MESSAGES.ADDRESS_UNMARKED_PROBLEMATIC,
                data: updatedAddress
            };
            
        } catch (error) {
            console.error('Error unmarking address as problematic:', error);
            
            return {
                success: false,
                error: {
                    code: ERROR_CODES.DATABASE_ERROR,
                    message: 'Gagal menghapus tanda bermasalah'
                }
            };
        }
    }

    /**
     * Verify address (mark as verified by courier)
     */
    async verifyAddress(addressId, verifiedBy = null) {
        try {
            const address = await this.repository.findById(addressId);
            if (!address) {
                return {
                    success: false,
                    error: {
                        code: ERROR_CODES.NOT_FOUND,
                        message: ERROR_MESSAGES.ADDRESS_NOT_FOUND
                    }
                };
            }
            
            const updates = {
                status: ADDRESS_STATUS.VERIFIED,
                verifiedBy: verifiedBy,
                verifiedAt: new Date().toISOString(),
                updatedBy: verifiedBy,
                updatedAt: new Date().toISOString()
            };
            
            const updatedAddress = await this.repository.update(addressId, updates);
            
            // Log in history
            await this.repository.logHistory(
                addressId,
                HISTORY_ACTIONS.VERIFIED,
                [{ field: 'status', oldValue: address.status, newValue: ADDRESS_STATUS.VERIFIED }],
                verifiedBy,
                'Alamat diverifikasi oleh kurir'
            );
            
            return {
                success: true,
                message: SUCCESS_MESSAGES.ADDRESS_VERIFIED,
                data: updatedAddress
            };
            
        } catch (error) {
            console.error('Error verifying address:', error);
            
            return {
                success: false,
                error: {
                    code: ERROR_CODES.DATABASE_ERROR,
                    message: 'Gagal memverifikasi alamat'
                }
            };
        }
    }

    /**
     * Use address (mark as used and update statistics)
     */
    async useAddress(addressId, usedBy = null) {
        try {
            const address = await this.repository.findById(addressId);
            if (!address) {
                return {
                    success: false,
                    error: {
                        code: ERROR_CODES.NOT_FOUND,
                        message: ERROR_MESSAGES.ADDRESS_NOT_FOUND
                    }
                };
            }
            
            const updatedAddress = await this.repository.markAsUsed(addressId, usedBy);
            
            return {
                success: true,
                message: 'Alamat berhasil digunakan',
                data: updatedAddress
            };
            
        } catch (error) {
            console.error('Error using address:', error);
            
            return {
                success: false,
                error: {
                    code: ERROR_CODES.DATABASE_ERROR,
                    message: 'Gagal menggunakan alamat'
                }
            };
        }
    }

    /**
     * Get address by ID with formatted display
     */
    async getAddress(addressId, includeHistory = false) {
        try {
            const address = await this.repository.findById(addressId);
            if (!address) {
                return {
                    success: false,
                    error: {
                        code: ERROR_CODES.NOT_FOUND,
                        message: ERROR_MESSAGES.ADDRESS_NOT_FOUND
                    }
                };
            }
            
            const result = {
                address: address,
                formatted: formatAddressForDisplay(address)
            };
            
            if (includeHistory) {
                result.history = await this.repository.getHistory(addressId);
            }
            
            return {
                success: true,
                data: result
            };
            
        } catch (error) {
            console.error('Error getting address:', error);
            
            return {
                success: false,
                error: {
                    code: ERROR_CODES.DATABASE_ERROR,
                    message: 'Gagal mengambil data alamat'
                }
            };
        }
    }

    /**
     * Get addresses by customer (phone or customer ID)
     */
    async getCustomerAddresses(customerId, options = {}) {
        try {
            const addresses = await this.repository.findByCustomer(customerId);
            
            // Apply filters
            let filteredAddresses = addresses;
            
            if (options.excludeProblematic) {
                filteredAddresses = filteredAddresses.filter(addr => !addr.isProblematic);
            }
            
            if (options.status) {
                filteredAddresses = filteredAddresses.filter(addr => addr.status === options.status);
            }
            
            return {
                success: true,
                data: filteredAddresses
            };
            
        } catch (error) {
            console.error('Error getting customer addresses:', error);
            
            return {
                success: false,
                error: {
                    code: ERROR_CODES.DATABASE_ERROR,
                    message: 'Gagal mengambil alamat pelanggan'
                }
            };
        }
    }

    /**
     * Get frequently used addresses for quick access
     */
    async getFrequentAddresses(courierId, limit = 10) {
        try {
            const addresses = await this.search.getFrequentAddresses(courierId, limit);
            
            return {
                success: true,
                data: addresses
            };
            
        } catch (error) {
            console.error('Error getting frequent addresses:', error);
            
            return {
                success: false,
                error: {
                    code: ERROR_CODES.DATABASE_ERROR,
                    message: 'Gagal mengambil alamat sering digunakan'
                }
            };
        }
    }

    /**
     * Get recent addresses for quick access
     */
    async getRecentAddresses(courierId, limit = 5) {
        try {
            const addresses = await this.search.getRecentAddresses(courierId, limit);
            
            return {
                success: true,
                data: addresses
            };
            
        } catch (error) {
            console.error('Error getting recent addresses:', error);
            
            return {
                success: false,
                error: {
                    code: ERROR_CODES.DATABASE_ERROR,
                    message: 'Gagal mengambil alamat terbaru'
                }
            };
        }
    }

    /**
     * Get problematic addresses for review
     */
    async getProblematicAddresses(options = {}) {
        try {
            const addresses = await this.repository.findProblematic();
            
            return {
                success: true,
                data: addresses
            };
            
        } catch (error) {
            console.error('Error getting problematic addresses:', error);
            
            return {
                success: false,
                error: {
                    code: ERROR_CODES.DATABASE_ERROR,
                    message: 'Gagal mengambil alamat bermasalah'
                }
            };
        }
    }

    /**
     * Get address statistics
     */
    async getStatistics() {
        try {
            const stats = await this.repository.getStatistics();
            
            return {
                success: true,
                data: stats
            };
            
        } catch (error) {
            console.error('Error getting statistics:', error);
            
            return {
                success: false,
                error: {
                    code: ERROR_CODES.DATABASE_ERROR,
                    message: 'Gagal mengambil statistik'
                }
            };
        }
    }

    /**
     * Delete address (soft delete)
     */
    async deleteAddress(addressId, deletedBy = null) {
        try {
            const address = await this.repository.findById(addressId);
            if (!address) {
                return {
                    success: false,
                    error: {
                        code: ERROR_CODES.NOT_FOUND,
                        message: ERROR_MESSAGES.ADDRESS_NOT_FOUND
                    }
                };
            }
            
            await this.repository.delete(addressId);
            
            return {
                success: true,
                message: 'Alamat berhasil dihapus'
            };
            
        } catch (error) {
            console.error('Error deleting address:', error);
            
            return {
                success: false,
                error: {
                    code: ERROR_CODES.DATABASE_ERROR,
                    message: 'Gagal menghapus alamat'
                }
            };
        }
    }

    /**
     * Validate address data without saving
     */
    async validateAddress(addressData) {
        try {
            const validatedData = validateAddressData(addressData);
            
            return {
                success: true,
                data: validatedData,
                message: 'Data alamat valid'
            };
            
        } catch (error) {
            if (error instanceof ValidationError) {
                return {
                    success: false,
                    error: {
                        code: error.code,
                        message: error.message,
                        field: error.field
                    }
                };
            }
            
            return {
                success: false,
                error: {
                    code: ERROR_CODES.VALIDATION_ERROR,
                    message: 'Gagal memvalidasi data alamat'
                }
            };
        }
    }
}

module.exports = AddressService;