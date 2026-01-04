/**
 * Address Management Utility Functions
 * Helper functions for address management operations
 */

const { EMOJIS, ADDRESS_STATUS, VALIDATION_LIMITS } = require('./AddressConstants');

/**
 * Generate unique ID for addresses and history records
 */
function generateId(prefix = 'addr') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${prefix}_${timestamp}_${random}`;
}

/**
 * Format address for display in WhatsApp messages
 */
function formatAddressForDisplay(address, includeNotes = true) {
    if (!address) return 'Alamat tidak tersedia';

    const statusEmoji = getStatusEmoji(address.status);
    const addressText = formatAddressText(address.address);
    
    let display = `${statusEmoji} *${address.customerName}*\n`;
    display += `${EMOJIS.PHONE} ${formatPhoneForDisplay(address.customerPhone)}\n`;
    display += `${EMOJIS.LOCATION} ${addressText}`;
    
    if (includeNotes && address.notes) {
        display += `\n${EMOJIS.NOTES} ${address.notes}`;
    }
    
    if (address.isProblematic) {
        display += `\n${EMOJIS.WARNING} *BERMASALAH*`;
        if (address.problematicReason) {
            display += `: ${address.problematicReason}`;
        }
    }
    
    if (address.lastUsed) {
        display += `\n⏰ Terakhir digunakan: ${formatDate(address.lastUsed)}`;
    }
    
    // Add coordinates if available
    if (address.coordinates && address.coordinates.latitude && address.coordinates.longitude) {
        display += `\n📍 Koordinat: ${address.coordinates.latitude.toFixed(6)}, ${address.coordinates.longitude.toFixed(6)}`;
        display += `\n🗺️ Maps: https://www.google.com/maps/search/?api=1&query=${address.coordinates.latitude},${address.coordinates.longitude}`;
    }
    
    return display;
}

/**
 * Format address text components
 */
function formatAddressText(address) {
    if (!address) return 'Alamat tidak lengkap';
    
    let text = address.street;
    
    if (address.district) {
        text += `, ${address.district}`;
    }
    
    text += `, ${address.city}`;
    
    if (address.postalCode) {
        text += ` ${address.postalCode}`;
    }
    
    if (address.landmark) {
        text += `\n📍 Patokan: ${address.landmark}`;
    }
    
    return text;
}

/**
 * Get emoji for address status
 */
function getStatusEmoji(status) {
    switch (status) {
        case ADDRESS_STATUS.VERIFIED:
            return EMOJIS.VERIFIED;
        case ADDRESS_STATUS.PROBLEMATIC:
            return EMOJIS.PROBLEMATIC;
        case ADDRESS_STATUS.UNVERIFIED:
        default:
            return EMOJIS.UNVERIFIED;
    }
}

/**
 * Format phone number for display
 */
function formatPhoneForDisplay(phone) {
    if (!phone) return 'Nomor tidak tersedia';
    
    // Convert to display format (08xxx)
    if (phone.startsWith('62')) {
        return '0' + phone.substring(2);
    }
    
    return phone;
}

/**
 * Format date for display
 */
function formatDate(dateString) {
    if (!dateString) return 'Tidak tersedia';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return 'Hari ini';
    } else if (diffDays === 1) {
        return 'Kemarin';
    } else if (diffDays < 7) {
        return `${diffDays} hari lalu`;
    } else {
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }
}

/**
 * Truncate text to fit WhatsApp message limits
 */
function truncateText(text, maxLength = VALIDATION_LIMITS.NOTES_MAX) {
    if (!text || text.length <= maxLength) return text;
    
    return text.substring(0, maxLength - 3) + '...';
}

/**
 * Create numbered list for WhatsApp display
 */
function createNumberedList(items, startIndex = 1) {
    return items.map((item, index) => {
        const number = startIndex + index;
        return `${number}. ${item}`;
    }).join('\n');
}

/**
 * Parse search query to extract search terms
 */
function parseSearchQuery(query) {
    if (!query || typeof query !== 'string') {
        return { terms: [], type: 'all' };
    }
    
    const cleanQuery = query.trim().toLowerCase();
    const terms = cleanQuery.split(/\s+/).filter(term => term.length > 0);
    
    // Detect if it's a phone number
    const phonePattern = /^[\d+\-\s()]+$/;
    if (phonePattern.test(cleanQuery)) {
        return { terms: [cleanQuery.replace(/[^\d+]/g, '')], type: 'phone' };
    }
    
    return { terms, type: 'text' };
}

/**
 * Calculate address usage score for ranking
 */
function calculateAddressScore(address) {
    let score = 0;
    
    // Base score from usage count
    score += address.usageCount * 10;
    
    // Bonus for verified addresses
    if (address.status === ADDRESS_STATUS.VERIFIED) {
        score += 50;
    }
    
    // Penalty for problematic addresses
    if (address.isProblematic) {
        score -= 100;
    }
    
    // Bonus for recent usage
    if (address.lastUsed) {
        const daysSinceUsed = (Date.now() - new Date(address.lastUsed)) / (1000 * 60 * 60 * 24);
        if (daysSinceUsed < 7) {
            score += 20;
        } else if (daysSinceUsed < 30) {
            score += 10;
        }
    }
    
    return Math.max(0, score);
}

/**
 * Sort addresses by relevance and usage
 */
function sortAddressesByRelevance(addresses) {
    return addresses.sort((a, b) => {
        const scoreA = calculateAddressScore(a);
        const scoreB = calculateAddressScore(b);
        
        if (scoreA !== scoreB) {
            return scoreB - scoreA; // Higher score first
        }
        
        // If scores are equal, sort by last used date
        const dateA = new Date(a.lastUsed || a.createdAt);
        const dateB = new Date(b.lastUsed || b.createdAt);
        
        return dateB - dateA; // More recent first
    });
}

/**
 * Create pagination info for large result sets
 */
function createPaginationInfo(totalItems, currentPage, pageSize) {
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);
    
    return {
        totalItems,
        totalPages,
        currentPage,
        pageSize,
        startIndex,
        endIndex,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1
    };
}

/**
 * Format pagination display for WhatsApp
 */
function formatPaginationDisplay(paginationInfo) {
    const { currentPage, totalPages, startIndex, endIndex, totalItems } = paginationInfo;
    
    if (totalPages <= 1) return '';
    
    return `\n📄 Halaman ${currentPage}/${totalPages} (${startIndex + 1}-${endIndex} dari ${totalItems})`;
}

/**
 * Sanitize input text to prevent injection
 */
function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    
    return input
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .replace(/[{}]/g, '') // Remove potential template literals
        .trim();
}

/**
 * Check if user has permission for action
 */
function checkPermission(userId, action, addressData = null) {
    // Basic permission check - can be extended based on requirements
    if (!userId) return false;
    
    // For now, all authenticated users can perform all actions
    // This can be extended to include role-based permissions
    return true;
}

/**
 * Generate customer ID from phone number
 */
function generateCustomerId(phone) {
    if (!phone) return null;
    
    // Use normalized phone as customer ID base
    const normalized = phone.replace(/[^\d]/g, '');
    return `cust_${normalized}`;
}

/**
 * Extract coordinates from location message
 */
function extractCoordinatesFromMessage(message) {
    // This would be implemented based on WhatsApp location message format
    // For now, return null as placeholder
    return null;
}

/**
 * Validate and clean address input
 */
function cleanAddressInput(input) {
    if (!input || typeof input !== 'object') return null;
    
    const cleaned = {};
    
    if (input.street) cleaned.street = sanitizeInput(input.street);
    if (input.district) cleaned.district = sanitizeInput(input.district);
    if (input.city) cleaned.city = sanitizeInput(input.city);
    if (input.postalCode) cleaned.postalCode = sanitizeInput(input.postalCode);
    if (input.landmark) cleaned.landmark = sanitizeInput(input.landmark);
    
    return cleaned;
}

module.exports = {
    generateId,
    formatAddressForDisplay,
    formatAddressText,
    getStatusEmoji,
    formatPhoneForDisplay,
    formatDate,
    truncateText,
    createNumberedList,
    parseSearchQuery,
    calculateAddressScore,
    sortAddressesByRelevance,
    createPaginationInfo,
    formatPaginationDisplay,
    sanitizeInput,
    checkPermission,
    generateCustomerId,
    extractCoordinatesFromMessage,
    cleanAddressInput
};