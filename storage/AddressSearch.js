/**
 * Address Search Engine
 * Advanced search functionality with fuzzy matching and intelligent ranking
 */

const { parseSearchQuery, calculateAddressScore, sortAddressesByRelevance } = require('./AddressUtils');
const { ADDRESS_STATUS, SEARCH_TYPES, PAGINATION } = require('./AddressConstants');

class AddressSearch {
    constructor(repository) {
        this.repository = repository;
    }

    /**
     * Main search method with intelligent query processing
     */
    async search(query, options = {}) {
        try {
            const searchOptions = {
                limit: options.limit || PAGINATION.SEARCH_RESULT_LIMIT,
                offset: options.offset || 0,
                includeProblematic: options.includeProblematic || false,
                sortBy: options.sortBy || 'relevance',
                ...options
            };

            // Parse and analyze search query
            const queryInfo = parseSearchQuery(query);
            
            // Get base results from repository
            let results = await this.getBaseResults(queryInfo, searchOptions);
            
            // Apply fuzzy matching and scoring
            results = this.applyFuzzyMatching(results, queryInfo, query);
            
            // Apply additional filters
            results = this.applyFilters(results, searchOptions);
            
            // Sort and rank results
            results = this.sortResults(results, searchOptions.sortBy, query);
            
            // Apply pagination
            const paginatedResults = this.applyPagination(results, searchOptions);
            
            return {
                results: paginatedResults,
                total: results.length,
                query: query,
                queryType: queryInfo.type,
                pagination: {
                    limit: searchOptions.limit,
                    offset: searchOptions.offset,
                    hasMore: results.length > (searchOptions.offset + searchOptions.limit)
                }
            };
        } catch (error) {
            console.error('Search error:', error);
            throw new Error(`Search failed: ${error.message}`);
        }
    }

    /**
     * Search by customer name with fuzzy matching
     */
    async searchByName(name, options = {}) {
        const results = await this.repository.findAll();
        
        const matches = results.filter(address => {
            if (!address.customerName) return false;
            
            const customerNameLower = address.customerName.toLowerCase();
            const nameLower = name.toLowerCase();
            
            // Check for exact substring match first
            if (customerNameLower.includes(nameLower)) {
                address._searchScore = 0.9;
                return true;
            }
            
            // Check for fuzzy similarity
            const similarity = this.calculateStringSimilarity(nameLower, customerNameLower);
            address._searchScore = similarity;
            return similarity > (options.threshold || 0.3);
        });
        
        return matches.sort((a, b) => b._searchScore - a._searchScore);
    }

    /**
     * Search by phone number with flexible matching
     */
    async searchByPhone(phone, options = {}) {
        const normalizedQuery = this.normalizePhoneForSearch(phone);
        const results = await this.repository.findAll();
        
        const matches = results.filter(address => {
            const normalizedPhone = this.normalizePhoneForSearch(address.customerPhone);
            
            // Exact match
            if (normalizedPhone === normalizedQuery) {
                address._searchScore = 1.0;
                return true;
            }
            
            // Partial match (for incomplete phone numbers)
            if (normalizedPhone.includes(normalizedQuery) || normalizedQuery.includes(normalizedPhone)) {
                const similarity = Math.max(
                    normalizedQuery.length / normalizedPhone.length,
                    normalizedPhone.length / normalizedQuery.length
                );
                
                if (similarity > (options.threshold || 0.7)) {
                    address._searchScore = similarity * 0.9; // Slightly lower than exact match
                    return true;
                }
            }
            
            return false;
        });
        
        return matches.sort((a, b) => b._searchScore - a._searchScore);
    }

    /**
     * Search by address text
     */
    async searchByAddress(addressText, options = {}) {
        const results = await this.repository.findAll();
        const queryLower = addressText.toLowerCase();
        
        const matches = results.filter(address => {
            const fullAddress = this.buildFullAddressText(address).toLowerCase();
            
            // Check for direct substring match
            if (fullAddress.includes(queryLower)) {
                address._searchScore = 0.8;
                return true;
            }
            
            // Check individual address components
            const components = [
                address.address.street,
                address.address.district,
                address.address.city,
                address.address.landmark
            ].filter(Boolean);
            
            let maxSimilarity = 0;
            for (const component of components) {
                const similarity = this.calculateStringSimilarity(
                    queryLower,
                    component.toLowerCase()
                );
                maxSimilarity = Math.max(maxSimilarity, similarity);
            }
            
            if (maxSimilarity > (options.threshold || 0.4)) {
                address._searchScore = maxSimilarity * 0.7;
                return true;
            }
            
            return false;
        });
        
        return matches.sort((a, b) => b._searchScore - a._searchScore);
    }

    /**
     * Get frequently used addresses for a courier
     */
    async getFrequentAddresses(courierId, limit = 10) {
        const results = await this.repository.search({
            createdBy: courierId,
            limit: limit * 2 // Get more to filter and sort
        });
        
        // Sort by usage frequency and recency
        const frequentAddresses = results
            .filter(addr => addr.usageCount > 0)
            .sort((a, b) => {
                // Primary sort: usage count
                if (a.usageCount !== b.usageCount) {
                    return b.usageCount - a.usageCount;
                }
                
                // Secondary sort: recency
                const dateA = new Date(a.lastUsed || a.createdAt);
                const dateB = new Date(b.lastUsed || b.createdAt);
                return dateB - dateA;
            })
            .slice(0, limit);
        
        return frequentAddresses;
    }

    /**
     * Get recent addresses for quick access
     */
    async getRecentAddresses(courierId, limit = 5) {
        const results = await this.repository.search({
            createdBy: courierId,
            limit: limit * 2
        });
        
        return results
            .filter(addr => addr.lastUsed)
            .sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed))
            .slice(0, limit);
    }

    /**
     * Smart search suggestions based on partial input
     */
    async getSuggestions(partialQuery, limit = 5) {
        if (!partialQuery || partialQuery.length < 2) {
            return [];
        }
        
        const results = await this.repository.findAll();
        const queryLower = partialQuery.toLowerCase();
        
        const suggestions = new Set();
        
        results.forEach(address => {
            // Name suggestions
            if (address.customerName.toLowerCase().startsWith(queryLower)) {
                suggestions.add(address.customerName);
            }
            
            // Phone suggestions
            if (address.customerPhone.includes(partialQuery)) {
                suggestions.add(address.customerPhone);
            }
            
            // Address suggestions
            const addressComponents = [
                address.address.street,
                address.address.city,
                address.address.district
            ].filter(Boolean);
            
            addressComponents.forEach(component => {
                if (component.toLowerCase().includes(queryLower)) {
                    suggestions.add(component);
                }
            });
        });
        
        return Array.from(suggestions).slice(0, limit);
    }

    /**
     * Get base results from repository based on query type
     */
    async getBaseResults(queryInfo, options) {
        if (queryInfo.terms.length === 0) {
            return await this.repository.findAll();
        }
        
        if (queryInfo.type === 'phone') {
            return await this.searchByPhone(queryInfo.terms[0], options);
        }
        
        // For text queries, search across all fields using repository search
        const searchResults = await this.repository.search({
            query: queryInfo.terms.join(' '),
            limit: options.limit * 3 // Get more results for better filtering
        });
        
        // If no results from repository search, try direct name search
        if (searchResults.length === 0) {
            return await this.searchByName(queryInfo.terms[0], { threshold: 0.2 });
        }
        
        return searchResults;
    }

    /**
     * Apply fuzzy matching to results
     */
    applyFuzzyMatching(results, queryInfo, originalQuery) {
        if (queryInfo.type === 'phone' || queryInfo.terms.length === 0) {
            return results; // Phone search already has scoring
        }
        
        const queryLower = originalQuery.toLowerCase();
        
        return results.map(address => {
            if (address._searchScore) {
                return address; // Already scored
            }
            
            // Calculate relevance score based on multiple factors
            let score = 0;
            
            // Name matching
            const nameSimilarity = this.calculateStringSimilarity(
                queryLower,
                address.customerName.toLowerCase()
            );
            score += nameSimilarity * 0.4;
            
            // Address matching
            const addressText = this.buildFullAddressText(address).toLowerCase();
            const addressSimilarity = this.calculateStringSimilarity(queryLower, addressText);
            score += addressSimilarity * 0.3;
            
            // Substring matching bonus
            if (address.customerName.toLowerCase().includes(queryLower)) {
                score += 0.2;
            }
            if (addressText.includes(queryLower)) {
                score += 0.1;
            }
            
            address._searchScore = score;
            return address;
        });
    }

    /**
     * Apply additional filters to results
     */
    applyFilters(results, options) {
        let filtered = results;
        
        // Filter out problematic addresses unless explicitly requested
        if (!options.includeProblematic) {
            filtered = filtered.filter(addr => !addr.isProblematic);
        }
        
        // Filter by status if specified
        if (options.status) {
            filtered = filtered.filter(addr => addr.status === options.status);
        }
        
        // Filter by courier if specified
        if (options.courierId) {
            filtered = filtered.filter(addr => addr.createdBy === options.courierId);
        }
        
        // Minimum score threshold
        const minScore = options.minScore || 0.1;
        filtered = filtered.filter(addr => (addr._searchScore || 0) >= minScore);
        
        return filtered;
    }

    /**
     * Sort results by specified criteria
     */
    sortResults(results, sortBy, query) {
        switch (sortBy) {
            case 'relevance':
                return results.sort((a, b) => {
                    const scoreA = (a._searchScore || 0) + (calculateAddressScore(a) / 1000);
                    const scoreB = (b._searchScore || 0) + (calculateAddressScore(b) / 1000);
                    return scoreB - scoreA;
                });
                
            case 'usage':
                return results.sort((a, b) => b.usageCount - a.usageCount);
                
            case 'recent':
                return results.sort((a, b) => {
                    const dateA = new Date(a.lastUsed || a.createdAt);
                    const dateB = new Date(b.lastUsed || b.createdAt);
                    return dateB - dateA;
                });
                
            case 'name':
                return results.sort((a, b) => a.customerName.localeCompare(b.customerName));
                
            default:
                return sortAddressesByRelevance(results);
        }
    }

    /**
     * Apply pagination to results
     */
    applyPagination(results, options) {
        const { limit, offset } = options;
        return results.slice(offset, offset + limit);
    }

    /**
     * Build full address text for searching
     */
    buildFullAddressText(address) {
        return [
            address.address.street,
            address.address.district,
            address.address.city,
            address.address.landmark,
            address.notes
        ].filter(Boolean).join(' ');
    }

    /**
     * Normalize phone number for search
     */
    normalizePhoneForSearch(phone) {
        if (!phone) return '';
        return phone.replace(/[^\d]/g, '');
    }

    /**
     * Calculate string similarity using Levenshtein distance
     */
    calculateStringSimilarity(str1, str2) {
        if (!str1 || !str2) return 0;
        
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

    /**
     * Advanced search with multiple criteria
     */
    async advancedSearch(criteria) {
        const {
            name,
            phone,
            address,
            city,
            status,
            isProblematic,
            createdBy,
            dateRange,
            usageRange,
            limit = PAGINATION.DEFAULT_PAGE_SIZE,
            offset = 0
        } = criteria;

        let results = await this.repository.findAll();

        // Apply individual filters
        if (name) {
            const nameMatches = await this.searchByName(name, { threshold: 0.3 });
            const nameIds = new Set(nameMatches.map(addr => addr.id));
            results = results.filter(addr => nameIds.has(addr.id));
        }

        if (phone) {
            const phoneMatches = await this.searchByPhone(phone);
            const phoneIds = new Set(phoneMatches.map(addr => addr.id));
            results = results.filter(addr => phoneIds.has(addr.id));
        }

        if (address) {
            results = results.filter(addr => {
                const fullAddress = this.buildFullAddressText(addr).toLowerCase();
                return fullAddress.includes(address.toLowerCase());
            });
        }

        if (city) {
            results = results.filter(addr => 
                addr.address.city.toLowerCase().includes(city.toLowerCase())
            );
        }

        if (status) {
            results = results.filter(addr => addr.status === status);
        }

        if (isProblematic !== undefined) {
            results = results.filter(addr => addr.isProblematic === isProblematic);
        }

        if (createdBy) {
            results = results.filter(addr => addr.createdBy === createdBy);
        }

        if (dateRange) {
            const { start, end } = dateRange;
            results = results.filter(addr => {
                const createdDate = new Date(addr.createdAt);
                return createdDate >= new Date(start) && createdDate <= new Date(end);
            });
        }

        if (usageRange) {
            const { min, max } = usageRange;
            results = results.filter(addr => {
                const usage = addr.usageCount || 0;
                return usage >= min && usage <= max;
            });
        }

        // Sort by relevance
        results = sortAddressesByRelevance(results);

        // Apply pagination
        const paginatedResults = results.slice(offset, offset + limit);

        return {
            results: paginatedResults,
            total: results.length,
            pagination: {
                limit,
                offset,
                hasMore: results.length > (offset + limit)
            }
        };
    }
}

module.exports = AddressSearch;