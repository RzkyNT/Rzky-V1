/**
 * Address Migration Utility
 * Migrates existing customer data to address management system
 */

const AddressService = require('./AddressService');
const { generateCustomerId } = require('./AddressUtils');
const { validateAddressData, ValidationError } = require('./AddressValidation');

class AddressMigration {
    constructor() {
        this.addressService = new AddressService();
    }

    /**
     * Migrate CRM customer data to address system
     */
    async migrateCrmCustomers(crmData) {
        const results = {
            total: 0,
            migrated: 0,
            skipped: 0,
            errors: []
        };

        if (!crmData || !crmData.customers) {
            return {
                success: false,
                error: 'No CRM customer data found',
                results
            };
        }

        console.log('Starting CRM customer migration...');

        for (const [customerId, customer] of Object.entries(crmData.customers)) {
            results.total++;

            try {
                // Skip if customer data is incomplete
                if (!customer.name || !customer.address) {
                    results.skipped++;
                    console.log(`Skipping customer ${customerId}: incomplete data`);
                    continue;
                }

                // Check if address already exists
                const existingAddresses = await this.addressService.getCustomerAddresses(customerId);
                if (existingAddresses.success && existingAddresses.data.length > 0) {
                    results.skipped++;
                    console.log(`Skipping customer ${customerId}: address already exists`);
                    continue;
                }

                // Parse address from CRM format
                const addressData = this.parseCrmAddress(customer, customerId);
                
                // Create address in new system
                const createResult = await this.addressService.createAddress(addressData, 'migration');
                
                if (createResult.success) {
                    results.migrated++;
                    console.log(`Migrated customer ${customerId}: ${customer.name}`);
                } else {
                    results.errors.push(`${customerId}: ${createResult.error.message}`);
                    console.error(`Failed to migrate customer ${customerId}:`, createResult.error.message);
                }

            } catch (error) {
                results.errors.push(`${customerId}: ${error.message}`);
                console.error(`Error migrating customer ${customerId}:`, error);
            }
        }

        console.log(`Migration completed: ${results.migrated}/${results.total} customers migrated`);

        return {
            success: true,
            results
        };
    }

    /**
     * Parse CRM customer data to address format
     */
    parseCrmAddress(customer, customerId) {
        // Extract phone number from customer ID or use provided phone
        let customerPhone = customer.phone || customerId.replace('@s.whatsapp.net', '');
        
        // Normalize phone number
        if (customerPhone.startsWith('0')) {
            customerPhone = '62' + customerPhone.substring(1);
        } else if (!customerPhone.startsWith('62')) {
            customerPhone = '62' + customerPhone;
        }

        // Parse address string into components
        const addressComponents = this.parseAddressString(customer.address);

        return {
            customerId: generateCustomerId(customerPhone),
            customerName: customer.name,
            customerPhone: customerPhone,
            address: addressComponents,
            notes: customer.notes || `Migrasi dari CRM - Orders: ${customer.orders_count || 0}`,
            status: 'unverified', // All migrated addresses start as unverified
            tags: ['migrated_from_crm']
        };
    }

    /**
     * Parse address string into structured components
     */
    parseAddressString(addressString) {
        if (!addressString || typeof addressString !== 'string') {
            return {
                street: 'Alamat tidak lengkap',
                district: '',
                city: 'Tidak diketahui',
                postalCode: '',
                landmark: ''
            };
        }

        // Common patterns in Indonesian addresses
        const addressParts = addressString.split(',').map(part => part.trim());
        
        let street = '';
        let district = '';
        let city = '';
        let postalCode = '';
        let landmark = '';

        // Try to identify components
        for (let i = 0; i < addressParts.length; i++) {
            const part = addressParts[i];
            
            // Check for postal code (5 digits)
            if (/^\d{5}$/.test(part)) {
                postalCode = part;
                continue;
            }
            
            // Check for common city indicators
            if (this.isCityName(part)) {
                city = part;
                continue;
            }
            
            // Check for district indicators
            if (this.isDistrictName(part)) {
                district = part;
                continue;
            }
            
            // Check for landmark indicators
            if (this.isLandmark(part)) {
                landmark = part;
                continue;
            }
            
            // Default to street if not identified
            if (!street) {
                street = part;
            } else {
                street += ', ' + part;
            }
        }

        // Fallbacks
        if (!street) street = addressParts[0] || 'Alamat tidak lengkap';
        if (!city && addressParts.length > 1) city = addressParts[addressParts.length - 1];
        if (!city) city = 'Tidak diketahui';

        return {
            street: street.substring(0, 200), // Limit length
            district: district.substring(0, 50),
            city: city.substring(0, 50),
            postalCode: postalCode,
            landmark: landmark.substring(0, 100)
        };
    }

    /**
     * Check if text looks like a city name
     */
    isCityName(text) {
        const cityIndicators = [
            'jakarta', 'bandung', 'surabaya', 'medan', 'bekasi', 'tangerang',
            'depok', 'semarang', 'palembang', 'makassar', 'batam', 'bogor',
            'pekanbaru', 'bandar lampung', 'malang', 'padang', 'denpasar',
            'samarinda', 'tasikmalaya', 'pontianak', 'cimahi', 'balikpapan',
            'jambi', 'surakarta', 'manado', 'yogyakarta', 'ambon', 'cilacap'
        ];
        
        const lowerText = text.toLowerCase();
        return cityIndicators.some(city => lowerText.includes(city)) ||
               lowerText.includes('kota') || lowerText.includes('kabupaten');
    }

    /**
     * Check if text looks like a district name
     */
    isDistrictName(text) {
        const lowerText = text.toLowerCase();
        return lowerText.includes('kecamatan') || 
               lowerText.includes('kec.') ||
               lowerText.includes('kelurahan') ||
               lowerText.includes('kel.');
    }

    /**
     * Check if text looks like a landmark
     */
    isLandmark(text) {
        const landmarkIndicators = [
            'dekat', 'samping', 'depan', 'belakang', 'seberang',
            'masjid', 'gereja', 'sekolah', 'rumah sakit', 'rs',
            'mall', 'pasar', 'stasiun', 'terminal', 'bandara',
            'kantor', 'bank', 'atm', 'indomaret', 'alfamart'
        ];
        
        const lowerText = text.toLowerCase();
        return landmarkIndicators.some(indicator => lowerText.includes(indicator));
    }

    /**
     * Migrate order addresses from CRM orders
     */
    async migrateOrderAddresses(crmData) {
        const results = {
            total: 0,
            processed: 0,
            addressesUpdated: 0,
            errors: []
        };

        if (!crmData || !crmData.orders) {
            return {
                success: false,
                error: 'No CRM order data found',
                results
            };
        }

        console.log('Starting order address migration...');

        for (const order of crmData.orders) {
            results.total++;

            try {
                if (!order.customerId || !order.address) {
                    results.processed++;
                    continue;
                }

                // Find existing address for customer
                const customerAddresses = await this.addressService.getCustomerAddresses(order.customerId);
                
                if (customerAddresses.success && customerAddresses.data.length > 0) {
                    const address = customerAddresses.data[0];
                    
                    // Update usage statistics based on order
                    const usageData = {
                        orderId: order.id,
                        deliverySuccess: order.status === 'Selesai',
                        deliveryTime: this.calculateDeliveryTime(order),
                        notes: `Order ${order.id} - ${order.item}`
                    };

                    await this.addressService.useAddress(address.id, 'migration');
                    results.addressesUpdated++;
                }

                results.processed++;

            } catch (error) {
                results.errors.push(`Order ${order.id}: ${error.message}`);
                console.error(`Error processing order ${order.id}:`, error);
            }
        }

        console.log(`Order migration completed: ${results.addressesUpdated} addresses updated from ${results.processed} orders`);

        return {
            success: true,
            results
        };
    }

    /**
     * Calculate delivery time from order data
     */
    calculateDeliveryTime(order) {
        // This is a rough estimation since CRM doesn't track delivery time
        // We'll use some heuristics based on order status and date
        
        if (order.status !== 'Selesai') {
            return null;
        }

        // Estimate delivery time based on order type
        const itemLower = (order.item || '').toLowerCase();
        
        if (itemLower.includes('galon')) {
            return Math.floor(Math.random() * 30) + 15; // 15-45 minutes for galon delivery
        }
        
        return Math.floor(Math.random() * 60) + 30; // 30-90 minutes for other items
    }

    /**
     * Validate migrated data integrity
     */
    async validateMigration(crmData) {
        const validation = {
            crmCustomers: 0,
            addressSystemCustomers: 0,
            matches: 0,
            mismatches: [],
            orphanedAddresses: []
        };

        try {
            // Count CRM customers
            validation.crmCustomers = Object.keys(crmData.customers || {}).length;

            // Get all addresses from address system
            const allAddresses = await this.addressService.addressService.repository.findAll();
            validation.addressSystemCustomers = allAddresses.length;

            // Check for matches
            for (const address of allAddresses) {
                const crmCustomer = Object.values(crmData.customers || {}).find(customer => 
                    customer.name === address.customerName
                );

                if (crmCustomer) {
                    validation.matches++;
                } else {
                    validation.orphanedAddresses.push({
                        id: address.id,
                        name: address.customerName,
                        phone: address.customerPhone
                    });
                }
            }

            // Check for CRM customers without addresses
            for (const [customerId, customer] of Object.entries(crmData.customers || {})) {
                const hasAddress = allAddresses.some(addr => 
                    addr.customerName === customer.name
                );

                if (!hasAddress) {
                    validation.mismatches.push({
                        customerId,
                        name: customer.name,
                        reason: 'No corresponding address found'
                    });
                }
            }

        } catch (error) {
            console.error('Error validating migration:', error);
            return {
                success: false,
                error: error.message
            };
        }

        return {
            success: true,
            validation
        };
    }

    /**
     * Generate migration report
     */
    generateMigrationReport(migrationResults, orderResults, validation) {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalCrmCustomers: migrationResults.results.total,
                migratedCustomers: migrationResults.results.migrated,
                skippedCustomers: migrationResults.results.skipped,
                migrationErrors: migrationResults.results.errors.length,
                ordersProcessed: orderResults?.results.processed || 0,
                addressesUpdated: orderResults?.results.addressesUpdated || 0
            },
            validation: validation?.validation || null,
            errors: [
                ...(migrationResults.results.errors || []),
                ...(orderResults?.results.errors || [])
            ]
        };

        return report;
    }

    /**
     * Full migration process
     */
    async performFullMigration(crmData) {
        console.log('Starting full CRM to Address System migration...');

        try {
            // Step 1: Migrate customers
            const migrationResults = await this.migrateCrmCustomers(crmData);
            
            // Step 2: Migrate order data
            const orderResults = await this.migrateOrderAddresses(crmData);
            
            // Step 3: Validate migration
            const validation = await this.validateMigration(crmData);
            
            // Step 4: Generate report
            const report = this.generateMigrationReport(migrationResults, orderResults, validation);
            
            console.log('Migration completed successfully');
            console.log('Report:', JSON.stringify(report.summary, null, 2));

            return {
                success: true,
                report
            };

        } catch (error) {
            console.error('Migration failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = AddressMigration;