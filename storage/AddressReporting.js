/**
 * Address Reporting System
 * Advanced reporting and analytics for address management
 */

const { formatDate } = require('./AddressUtils');
const { ADDRESS_STATUS, EMOJIS } = require('./AddressConstants');

class AddressReporting {
    constructor(addressService) {
        this.addressService = addressService;
    }

    /**
     * Generate comprehensive address statistics
     */
    async generateComprehensiveStats() {
        try {
            const allAddresses = await this.addressService.repository.findAll();
            const problematicAddresses = await this.addressService.getProblematicAddresses();
            
            const stats = {
                overview: this.calculateOverviewStats(allAddresses),
                statusBreakdown: this.calculateStatusBreakdown(allAddresses),
                usageStats: this.calculateUsageStats(allAddresses),
                problematicStats: this.calculateProblematicStats(problematicAddresses.data || []),
                courierStats: this.calculateCourierStats(allAddresses),
                timeStats: this.calculateTimeStats(allAddresses),
                qualityMetrics: this.calculateQualityMetrics(allAddresses)
            };

            return {
                success: true,
                data: stats,
                generatedAt: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error generating comprehensive stats:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Calculate overview statistics
     */
    calculateOverviewStats(addresses) {
        return {
            totalAddresses: addresses.length,
            activeAddresses: addresses.filter(addr => !addr.isDeleted).length,
            deletedAddresses: addresses.filter(addr => addr.isDeleted).length,
            uniqueCustomers: new Set(addresses.map(addr => addr.customerPhone)).size,
            averageAddressesPerCustomer: addresses.length > 0 ? 
                (addresses.length / new Set(addresses.map(addr => addr.customerPhone)).size).toFixed(2) : 0
        };
    }

    /**
     * Calculate status breakdown
     */
    calculateStatusBreakdown(addresses) {
        const activeAddresses = addresses.filter(addr => !addr.isDeleted);
        
        return {
            verified: activeAddresses.filter(addr => addr.status === ADDRESS_STATUS.VERIFIED).length,
            unverified: activeAddresses.filter(addr => addr.status === ADDRESS_STATUS.UNVERIFIED).length,
            problematic: activeAddresses.filter(addr => addr.isProblematic).length,
            verificationRate: activeAddresses.length > 0 ? 
                ((activeAddresses.filter(addr => addr.status === ADDRESS_STATUS.VERIFIED).length / activeAddresses.length) * 100).toFixed(1) : 0
        };
    }

    /**
     * Calculate usage statistics
     */
    calculateUsageStats(addresses) {
        const usedAddresses = addresses.filter(addr => addr.usageCount > 0);
        const totalUsage = addresses.reduce((sum, addr) => sum + (addr.usageCount || 0), 0);
        
        return {
            totalUsage: totalUsage,
            usedAddresses: usedAddresses.length,
            unusedAddresses: addresses.length - usedAddresses.length,
            averageUsagePerAddress: addresses.length > 0 ? (totalUsage / addresses.length).toFixed(2) : 0,
            mostUsedAddress: this.findMostUsedAddress(addresses),
            usageDistribution: this.calculateUsageDistribution(addresses)
        };
    }

    /**
     * Calculate problematic address statistics
     */
    calculateProblematicStats(problematicAddresses) {
        const problemTypes = {};
        const escalatedCount = problematicAddresses.filter(addr => 
            addr.tags && addr.tags.includes('escalated_problem')
        ).length;

        problematicAddresses.forEach(addr => {
            const reason = addr.problematicReason || 'Tidak diketahui';
            const key = reason.substring(0, 50); // Group similar reasons
            problemTypes[key] = (problemTypes[key] || 0) + 1;
        });

        return {
            totalProblematic: problematicAddresses.length,
            escalatedProblems: escalatedCount,
            regularProblems: problematicAddresses.length - escalatedCount,
            problemTypes: problemTypes,
            topProblems: Object.entries(problemTypes)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([problem, count]) => ({ problem, count }))
        };
    }

    /**
     * Calculate courier statistics
     */
    calculateCourierStats(addresses) {
        const courierStats = {};
        
        addresses.forEach(addr => {
            if (addr.createdBy) {
                if (!courierStats[addr.createdBy]) {
                    courierStats[addr.createdBy] = {
                        addressesCreated: 0,
                        addressesVerified: 0,
                        totalUsage: 0
                    };
                }
                
                courierStats[addr.createdBy].addressesCreated++;
                
                if (addr.verifiedBy === addr.createdBy) {
                    courierStats[addr.createdBy].addressesVerified++;
                }
                
                courierStats[addr.createdBy].totalUsage += (addr.usageCount || 0);
            }
        });

        return {
            totalCouriers: Object.keys(courierStats).length,
            courierBreakdown: courierStats,
            topCouriers: Object.entries(courierStats)
                .sort(([,a], [,b]) => b.addressesCreated - a.addressesCreated)
                .slice(0, 5)
                .map(([courier, stats]) => ({ courier, ...stats }))
        };
    }

    /**
     * Calculate time-based statistics
     */
    calculateTimeStats(addresses) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const thisWeek = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        return {
            createdToday: addresses.filter(addr => 
                new Date(addr.createdAt) >= today
            ).length,
            createdThisWeek: addresses.filter(addr => 
                new Date(addr.createdAt) >= thisWeek
            ).length,
            createdThisMonth: addresses.filter(addr => 
                new Date(addr.createdAt) >= thisMonth
            ).length,
            usedToday: addresses.filter(addr => 
                addr.lastUsed && new Date(addr.lastUsed) >= today
            ).length,
            usedThisWeek: addresses.filter(addr => 
                addr.lastUsed && new Date(addr.lastUsed) >= thisWeek
            ).length,
            averageAgeInDays: this.calculateAverageAge(addresses)
        };
    }

    /**
     * Calculate quality metrics
     */
    calculateQualityMetrics(addresses) {
        const activeAddresses = addresses.filter(addr => !addr.isDeleted);
        const addressesWithNotes = activeAddresses.filter(addr => addr.notes && addr.notes.trim().length > 0);
        const addressesWithCoordinates = activeAddresses.filter(addr => 
            addr.coordinates && addr.coordinates.latitude && addr.coordinates.longitude
        );

        return {
            completenessScore: this.calculateCompletenessScore(activeAddresses),
            addressesWithNotes: addressesWithNotes.length,
            addressesWithCoordinates: addressesWithCoordinates.length,
            notesCompletionRate: activeAddresses.length > 0 ? 
                ((addressesWithNotes.length / activeAddresses.length) * 100).toFixed(1) : 0,
            coordinatesCompletionRate: activeAddresses.length > 0 ? 
                ((addressesWithCoordinates.length / activeAddresses.length) * 100).toFixed(1) : 0
        };
    }

    /**
     * Generate courier performance report
     */
    async generateCourierReport(courierId, dateRange = null) {
        try {
            const allAddresses = await this.addressService.repository.findAll();
            const courierAddresses = allAddresses.filter(addr => 
                addr.createdBy === courierId || addr.verifiedBy === courierId
            );

            // Apply date filter if provided
            let filteredAddresses = courierAddresses;
            if (dateRange) {
                filteredAddresses = courierAddresses.filter(addr => {
                    const createdDate = new Date(addr.createdAt);
                    return createdDate >= new Date(dateRange.start) && 
                           createdDate <= new Date(dateRange.end);
                });
            }

            const report = {
                courierId: courierId,
                dateRange: dateRange,
                summary: {
                    addressesCreated: filteredAddresses.filter(addr => addr.createdBy === courierId).length,
                    addressesVerified: filteredAddresses.filter(addr => addr.verifiedBy === courierId).length,
                    totalUsage: filteredAddresses.reduce((sum, addr) => sum + (addr.usageCount || 0), 0),
                    problematicAddresses: filteredAddresses.filter(addr => 
                        addr.isProblematic && addr.createdBy === courierId
                    ).length
                },
                performance: {
                    verificationRate: this.calculateVerificationRate(filteredAddresses, courierId),
                    averageUsagePerAddress: this.calculateAverageUsage(filteredAddresses),
                    qualityScore: this.calculateCourierQualityScore(filteredAddresses, courierId)
                },
                recentActivity: this.getRecentActivity(filteredAddresses, courierId)
            };

            return {
                success: true,
                data: report
            };

        } catch (error) {
            console.error('Error generating courier report:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Generate daily summary report
     */
    async generateDailySummary(date = null) {
        try {
            const targetDate = date ? new Date(date) : new Date();
            const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
            const endOfDay = new Date(startOfDay.getTime() + (24 * 60 * 60 * 1000));

            const allAddresses = await this.addressService.repository.findAll();
            
            const dailyAddresses = allAddresses.filter(addr => {
                const createdDate = new Date(addr.createdAt);
                return createdDate >= startOfDay && createdDate < endOfDay;
            });

            const usedToday = allAddresses.filter(addr => {
                if (!addr.lastUsed) return false;
                const usedDate = new Date(addr.lastUsed);
                return usedDate >= startOfDay && usedDate < endOfDay;
            });

            const summary = {
                date: targetDate.toISOString().split('T')[0],
                newAddresses: dailyAddresses.length,
                addressesUsed: usedToday.length,
                totalUsage: usedToday.reduce((sum, addr) => sum + (addr.usageCount || 0), 0),
                verifiedToday: dailyAddresses.filter(addr => addr.status === ADDRESS_STATUS.VERIFIED).length,
                problematicToday: dailyAddresses.filter(addr => addr.isProblematic).length,
                topCouriers: this.getTopCouriersForDay(dailyAddresses),
                addressQuality: this.calculateDayQuality(dailyAddresses)
            };

            return {
                success: true,
                data: summary
            };

        } catch (error) {
            console.error('Error generating daily summary:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Helper methods
     */
    findMostUsedAddress(addresses) {
        if (addresses.length === 0) return null;
        
        return addresses.reduce((max, addr) => 
            (addr.usageCount || 0) > (max.usageCount || 0) ? addr : max
        );
    }

    calculateUsageDistribution(addresses) {
        const distribution = {
            unused: 0,
            lowUsage: 0,    // 1-5 uses
            mediumUsage: 0, // 6-15 uses
            highUsage: 0    // 16+ uses
        };

        addresses.forEach(addr => {
            const usage = addr.usageCount || 0;
            if (usage === 0) distribution.unused++;
            else if (usage <= 5) distribution.lowUsage++;
            else if (usage <= 15) distribution.mediumUsage++;
            else distribution.highUsage++;
        });

        return distribution;
    }

    calculateAverageAge(addresses) {
        if (addresses.length === 0) return 0;
        
        const now = new Date();
        const totalAge = addresses.reduce((sum, addr) => {
            const age = now - new Date(addr.createdAt);
            return sum + (age / (1000 * 60 * 60 * 24)); // Convert to days
        }, 0);

        return (totalAge / addresses.length).toFixed(1);
    }

    calculateCompletenessScore(addresses) {
        if (addresses.length === 0) return 100;

        let totalScore = 0;
        addresses.forEach(addr => {
            let score = 0;
            
            // Required fields (60 points)
            if (addr.customerName && addr.customerName.trim()) score += 15;
            if (addr.customerPhone) score += 15;
            if (addr.address && addr.address.street && addr.address.street.trim()) score += 15;
            if (addr.address && addr.address.city && addr.address.city.trim()) score += 15;
            
            // Optional but valuable fields (40 points)
            if (addr.address && addr.address.district && addr.address.district.trim()) score += 10;
            if (addr.notes && addr.notes.trim()) score += 10;
            if (addr.coordinates && addr.coordinates.latitude) score += 10;
            if (addr.status === ADDRESS_STATUS.VERIFIED) score += 10;
            
            totalScore += score;
        });

        return (totalScore / (addresses.length * 100) * 100).toFixed(1);
    }

    calculateVerificationRate(addresses, courierId) {
        const created = addresses.filter(addr => addr.createdBy === courierId);
        const verified = created.filter(addr => addr.status === ADDRESS_STATUS.VERIFIED);
        
        return created.length > 0 ? ((verified.length / created.length) * 100).toFixed(1) : 0;
    }

    calculateAverageUsage(addresses) {
        if (addresses.length === 0) return 0;
        
        const totalUsage = addresses.reduce((sum, addr) => sum + (addr.usageCount || 0), 0);
        return (totalUsage / addresses.length).toFixed(2);
    }

    calculateCourierQualityScore(addresses, courierId) {
        const courierAddresses = addresses.filter(addr => addr.createdBy === courierId);
        if (courierAddresses.length === 0) return 0;

        let score = 0;
        let maxScore = 0;

        courierAddresses.forEach(addr => {
            maxScore += 100;
            
            // Verification bonus
            if (addr.status === ADDRESS_STATUS.VERIFIED) score += 30;
            
            // Usage bonus
            if (addr.usageCount > 0) score += 20;
            if (addr.usageCount > 5) score += 10;
            
            // Completeness bonus
            if (addr.notes && addr.notes.trim()) score += 15;
            if (addr.coordinates && addr.coordinates.latitude) score += 15;
            
            // Penalty for problematic
            if (addr.isProblematic) score -= 20;
            
            // Base score for creation
            score += 10;
        });

        return Math.max(0, (score / maxScore * 100)).toFixed(1);
    }

    getRecentActivity(addresses, courierId) {
        return addresses
            .filter(addr => addr.createdBy === courierId || addr.verifiedBy === courierId)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 10)
            .map(addr => ({
                id: addr.id,
                customerName: addr.customerName,
                action: addr.createdBy === courierId ? 'created' : 'verified',
                date: addr.createdAt,
                usageCount: addr.usageCount || 0
            }));
    }

    getTopCouriersForDay(addresses) {
        const courierCounts = {};
        
        addresses.forEach(addr => {
            if (addr.createdBy) {
                courierCounts[addr.createdBy] = (courierCounts[addr.createdBy] || 0) + 1;
            }
        });

        return Object.entries(courierCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([courier, count]) => ({ courier, count }));
    }

    calculateDayQuality(addresses) {
        if (addresses.length === 0) return 100;

        const withNotes = addresses.filter(addr => addr.notes && addr.notes.trim()).length;
        const verified = addresses.filter(addr => addr.status === ADDRESS_STATUS.VERIFIED).length;
        
        return {
            notesRate: ((withNotes / addresses.length) * 100).toFixed(1),
            verificationRate: ((verified / addresses.length) * 100).toFixed(1),
            overallQuality: (((withNotes + verified) / (addresses.length * 2)) * 100).toFixed(1)
        };
    }
}

module.exports = AddressReporting;