/**
 * Address Validation Functions
 * Provides comprehensive validation for address data integrity
 */

const { ADDRESS_STATUS, HISTORY_ACTIONS } = require('./AddressModels');

/**
 * Validation error class for structured error handling
 */
class ValidationError extends Error {
    constructor(message, field = null, code = 'VALIDATION_ERROR') {
        super(message);
        this.name = 'ValidationError';
        this.field = field;
        this.code = code;
    }
}

/**
 * Phone number validation for Indonesian format
 * Supports formats: 08xxx, +62xxx, 62xxx
 */
function validatePhoneNumber(phone) {
    if (!phone || typeof phone !== 'string') {
        throw new ValidationError('Nomor telepon harus diisi', 'customerPhone');
    }

    // Remove all non-digit characters except +
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    
    // Check Indonesian phone number patterns
    const patterns = [
        /^(\+62|62)[8-9]\d{8,11}$/, // +62 or 62 format
        /^08[1-9]\d{7,10}$/         // 08 format
    ];

    const isValid = patterns.some(pattern => pattern.test(cleanPhone));
    
    if (!isValid) {
        throw new ValidationError(
            'Format nomor telepon tidak valid. Gunakan format: 08xxx, +62xxx, atau 62xxx',
            'customerPhone'
        );
    }

    return cleanPhone;
}

/**
 * Normalize phone number to consistent format (62xxx)
 */
function normalizePhoneNumber(phone) {
    const cleanPhone = validatePhoneNumber(phone);
    
    if (cleanPhone.startsWith('+62')) {
        return cleanPhone.substring(1);
    } else if (cleanPhone.startsWith('08')) {
        return '62' + cleanPhone.substring(1);
    }
    
    return cleanPhone;
}

/**
 * Validate customer name
 */
function validateCustomerName(name) {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        throw new ValidationError('Nama pelanggan harus diisi', 'customerName');
    }

    if (name.trim().length < 2) {
        throw new ValidationError('Nama pelanggan minimal 2 karakter', 'customerName');
    }

    if (name.length > 100) {
        throw new ValidationError('Nama pelanggan maksimal 100 karakter', 'customerName');
    }

    return name.trim();
}

/**
 * Validate address components
 */
function validateAddress(address) {
    if (!address || typeof address !== 'object') {
        throw new ValidationError('Data alamat harus diisi', 'address');
    }

    const errors = [];

    // Street address is required
    if (!address.street || address.street.trim().length === 0) {
        errors.push('Alamat jalan harus diisi');
    } else if (address.street.length > 200) {
        errors.push('Alamat jalan maksimal 200 karakter');
    }

    // City is required
    if (!address.city || address.city.trim().length === 0) {
        errors.push('Kota harus diisi');
    } else if (address.city.length > 50) {
        errors.push('Nama kota maksimal 50 karakter');
    }

    // Optional fields validation
    if (address.district && address.district.length > 50) {
        errors.push('Nama kecamatan maksimal 50 karakter');
    }

    if (address.postalCode && !/^\d{5}$/.test(address.postalCode)) {
        errors.push('Kode pos harus 5 digit angka');
    }

    if (address.landmark && address.landmark.length > 100) {
        errors.push('Patokan maksimal 100 karakter');
    }

    if (errors.length > 0) {
        throw new ValidationError(errors.join(', '), 'address');
    }

    return {
        street: address.street.trim(),
        district: address.district ? address.district.trim() : '',
        city: address.city.trim(),
        postalCode: address.postalCode ? address.postalCode.trim() : '',
        landmark: address.landmark ? address.landmark.trim() : ''
    };
}

/**
 * Validate coordinates if provided
 */
function validateCoordinates(coordinates) {
    if (!coordinates) return null;

    if (typeof coordinates !== 'object') {
        throw new ValidationError('Koordinat harus berupa object', 'coordinates');
    }

    const { latitude, longitude } = coordinates;

    if (latitude !== null && latitude !== undefined) {
        if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
            throw new ValidationError('Latitude harus antara -90 dan 90', 'coordinates.latitude');
        }
    }

    if (longitude !== null && longitude !== undefined) {
        if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
            throw new ValidationError('Longitude harus antara -180 dan 180', 'coordinates.longitude');
        }
    }

    return {
        latitude: latitude || null,
        longitude: longitude || null
    };
}

/**
 * Validate address status
 */
function validateAddressStatus(status) {
    if (!status) return ADDRESS_STATUS.UNVERIFIED;

    const validStatuses = Object.values(ADDRESS_STATUS);
    if (!validStatuses.includes(status)) {
        throw new ValidationError(
            `Status alamat tidak valid. Gunakan: ${validStatuses.join(', ')}`,
            'status'
        );
    }

    return status;
}

/**
 * Validate notes field
 */
function validateNotes(notes) {
    if (!notes) return '';

    if (typeof notes !== 'string') {
        throw new ValidationError('Catatan harus berupa text', 'notes');
    }

    if (notes.length > 500) {
        throw new ValidationError('Catatan maksimal 500 karakter', 'notes');
    }

    return notes.trim();
}

/**
 * Comprehensive address data validation
 */
function validateAddressData(data) {
    const errors = [];
    const validatedData = {};

    try {
        validatedData.customerName = validateCustomerName(data.customerName);
    } catch (error) {
        errors.push(error.message);
    }

    try {
        validatedData.customerPhone = normalizePhoneNumber(data.customerPhone);
    } catch (error) {
        errors.push(error.message);
    }

    try {
        validatedData.address = validateAddress(data.address);
    } catch (error) {
        errors.push(error.message);
    }

    try {
        validatedData.coordinates = validateCoordinates(data.coordinates);
    } catch (error) {
        errors.push(error.message);
    }

    try {
        validatedData.status = validateAddressStatus(data.status);
    } catch (error) {
        errors.push(error.message);
    }

    try {
        validatedData.notes = validateNotes(data.notes);
    } catch (error) {
        errors.push(error.message);
    }

    if (errors.length > 0) {
        throw new ValidationError(errors.join('; '), null, 'MULTIPLE_VALIDATION_ERRORS');
    }

    return validatedData;
}

/**
 * Validate history action
 */
function validateHistoryAction(action) {
    const validActions = Object.values(HISTORY_ACTIONS);
    if (!validActions.includes(action)) {
        throw new ValidationError(
            `Action tidak valid. Gunakan: ${validActions.join(', ')}`,
            'action'
        );
    }
    return action;
}

/**
 * Check for duplicate addresses based on similarity
 */
function checkAddressSimilarity(newAddress, existingAddresses) {
    if (!existingAddresses || existingAddresses.length === 0) {
        return null;
    }

    const normalizeText = (text) => {
        return text.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    };

    const newAddressText = normalizeText(
        `${newAddress.customerName} ${newAddress.customerPhone} ${newAddress.address.street} ${newAddress.address.city}`
    );

    for (const existing of existingAddresses) {
        const existingText = normalizeText(
            `${existing.customerName} ${existing.customerPhone} ${existing.address.street} ${existing.address.city}`
        );

        // Check exact phone match with different address
        if (existing.customerPhone === newAddress.customerPhone) {
            const addressSimilarity = calculateStringSimilarity(
                normalizeText(`${newAddress.address.street} ${newAddress.address.city}`),
                normalizeText(`${existing.address.street} ${existing.address.city}`)
            );

            if (addressSimilarity > 0.8) {
                return {
                    type: 'similar_address',
                    existingAddress: existing,
                    similarity: addressSimilarity
                };
            }
        }

        // Check overall similarity
        const overallSimilarity = calculateStringSimilarity(newAddressText, existingText);
        if (overallSimilarity > 0.9) {
            return {
                type: 'duplicate',
                existingAddress: existing,
                similarity: overallSimilarity
            };
        }
    }

    return null;
}

/**
 * Calculate string similarity using Levenshtein distance
 */
function calculateStringSimilarity(str1, str2) {
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;

    for (let i = 0; i <= len2; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= len1; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= len2; i++) {
        for (let j = 1; j <= len1; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    const maxLen = Math.max(len1, len2);
    return maxLen === 0 ? 1 : (maxLen - matrix[len2][len1]) / maxLen;
}

module.exports = {
    ValidationError,
    validatePhoneNumber,
    normalizePhoneNumber,
    validateCustomerName,
    validateAddress,
    validateCoordinates,
    validateAddressStatus,
    validateNotes,
    validateAddressData,
    validateHistoryAction,
    checkAddressSimilarity,
    calculateStringSimilarity
};