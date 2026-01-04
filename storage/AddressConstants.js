/**
 * Address Management Constants
 * Centralized constants for the address management system
 */

// Address Status Types
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
    VERIFIED: 'verified',
    UNMARKED_PROBLEMATIC: 'unmarked_problematic'
};

// WhatsApp Command Constants
const COMMANDS = {
    ALAMAT: '/alamat',
    CARI: '/cari',
    TAMBAH: '/tambah',
    EDIT: '/edit',
    BATAL: '/batal'
};

// Menu Options
const MENU_OPTIONS = {
    SEARCH: '1',
    ADD_NEW: '2',
    PROBLEMATIC: '3',
    STATISTICS: '4',
    HELP: '5'
};

// Edit Options
const EDIT_OPTIONS = {
    NAME: '1',
    PHONE: '2',
    ADDRESS: '3',
    NOTES: '4',
    MARK_PROBLEMATIC: '5',
    VERIFY: '6'
};

// Search Types
const SEARCH_TYPES = {
    NAME: 'name',
    PHONE: 'phone',
    ADDRESS: 'address',
    ALL: 'all'
};

// Error Codes
const ERROR_CODES = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    DUPLICATE_ADDRESS: 'DUPLICATE_ADDRESS',
    DATABASE_ERROR: 'DATABASE_ERROR',
    PERMISSION_DENIED: 'PERMISSION_DENIED',
    INVALID_COMMAND: 'INVALID_COMMAND'
};

// Success Messages
const SUCCESS_MESSAGES = {
    ADDRESS_CREATED: '✅ Alamat berhasil disimpan!',
    ADDRESS_UPDATED: '✅ Alamat berhasil diperbarui!',
    ADDRESS_VERIFIED: '✅ Alamat berhasil diverifikasi!',
    ADDRESS_MARKED_PROBLEMATIC: '⚠️ Alamat berhasil ditandai bermasalah!',
    ADDRESS_UNMARKED_PROBLEMATIC: '✅ Tanda bermasalah berhasil dihapus!'
};

// Error Messages
const ERROR_MESSAGES = {
    ADDRESS_NOT_FOUND: '❌ Alamat tidak ditemukan',
    INVALID_PHONE: '❌ Format nomor telepon tidak valid',
    REQUIRED_FIELD_MISSING: '❌ Field wajib tidak boleh kosong',
    DUPLICATE_ADDRESS: '⚠️ Alamat serupa sudah ada',
    DATABASE_ERROR: '❌ Terjadi kesalahan database',
    PERMISSION_DENIED: '❌ Anda tidak memiliki izin untuk aksi ini',
    INVALID_COMMAND: '❌ Perintah tidak valid'
};

// WhatsApp Emojis for UI
const EMOJIS = {
    SEARCH: '🔍',
    ADD: '➕',
    EDIT: '📝',
    DELETE: '🗑️',
    VERIFIED: '✅',
    UNVERIFIED: '⏳',
    PROBLEMATIC: '⚠️',
    LOCATION: '📍',
    PHONE: '📞',
    PERSON: '👤',
    NOTES: '📋',
    STATISTICS: '📊',
    HELP: '❓',
    SUCCESS: '✅',
    ERROR: '❌',
    WARNING: '⚠️',
    INFO: 'ℹ️'
};

// Pagination Settings
const PAGINATION = {
    DEFAULT_PAGE_SIZE: 5,
    MAX_PAGE_SIZE: 10,
    SEARCH_RESULT_LIMIT: 20
};

// Validation Limits
const VALIDATION_LIMITS = {
    CUSTOMER_NAME_MIN: 2,
    CUSTOMER_NAME_MAX: 100,
    STREET_ADDRESS_MAX: 200,
    CITY_NAME_MAX: 50,
    DISTRICT_NAME_MAX: 50,
    LANDMARK_MAX: 100,
    NOTES_MAX: 500,
    PROBLEMATIC_REASON_MAX: 200
};

// Database Collections/Tables
const DB_COLLECTIONS = {
    ADDRESSES: 'addresses',
    ADDRESS_HISTORY: 'address_history'
};

// Cache Settings
const CACHE_SETTINGS = {
    ADDRESS_CACHE_TTL: 300000, // 5 minutes in milliseconds
    SEARCH_CACHE_TTL: 60000,   // 1 minute in milliseconds
    MAX_CACHE_SIZE: 100
};

// Phone Number Patterns
const PHONE_PATTERNS = {
    INDONESIA_FORMATS: [
        /^(\+62|62)[8-9]\d{8,11}$/,  // +62 or 62 format
        /^08[1-9]\d{7,10}$/          // 08 format
    ]
};

// Address Tags
const ADDRESS_TAGS = {
    REGULAR_CUSTOMER: 'regular_customer',
    EASY_ACCESS: 'easy_access',
    DIFFICULT_ACCESS: 'difficult_access',
    APARTMENT: 'apartment',
    OFFICE: 'office',
    HOUSE: 'house',
    FREQUENT_ORDERS: 'frequent_orders'
};

// Sort Options
const SORT_OPTIONS = {
    LAST_USED: 'lastUsed',
    USAGE_COUNT: 'usageCount',
    CREATED_DATE: 'createdAt',
    CUSTOMER_NAME: 'customerName',
    VERIFICATION_STATUS: 'status'
};

// Sort Directions
const SORT_DIRECTIONS = {
    ASC: 'asc',
    DESC: 'desc'
};

// WhatsApp Message Limits
const MESSAGE_LIMITS = {
    MAX_MESSAGE_LENGTH: 4096,
    MAX_BUTTONS: 3,
    MAX_LIST_ITEMS: 10
};

module.exports = {
    ADDRESS_STATUS,
    HISTORY_ACTIONS,
    COMMANDS,
    MENU_OPTIONS,
    EDIT_OPTIONS,
    SEARCH_TYPES,
    ERROR_CODES,
    SUCCESS_MESSAGES,
    ERROR_MESSAGES,
    EMOJIS,
    PAGINATION,
    VALIDATION_LIMITS,
    DB_COLLECTIONS,
    CACHE_SETTINGS,
    PHONE_PATTERNS,
    ADDRESS_TAGS,
    SORT_OPTIONS,
    SORT_DIRECTIONS,
    MESSAGE_LIMITS
};