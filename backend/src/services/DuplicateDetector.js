/**
 * Duplicate Detector Service
 * Detects duplicate campaigns using multiple strategies:
 * 1. URL-based (most reliable)
 * 2. Hash-based (md5 of sourceName|title|startDate|endDate)
 * 3. Fuzzy matching (Levenshtein distance on title)
 */

const Campaign = require('../models/Campaign');

class DuplicateDetector {
  /**
   * Check if campaign is duplicate
   * @param {Object} campaign - Normalized campaign data
   * @param {string} sourceId - Source UUID
   * @returns {Promise<Object|null>} - Existing campaign if duplicate, null otherwise
   */
  async checkDuplicate(campaign, sourceId) {
    // Method 1: URL-based (most reliable)
    if (campaign.originalUrl) {
      const existing = await Campaign.findDuplicate(
        campaign.originalUrl,
        sourceId,
        null,
        null,
        null
      );
      
      if (existing) {
        console.log(`🔍 Duplicate found (URL): ${campaign.title}`);
        return existing;
      }
    }

    // Method 2: Hash-based
    if (campaign.dataHash) {
      const existing = await this.findByHash(campaign.dataHash);
      
      if (existing) {
        console.log(`🔍 Duplicate found (Hash): ${campaign.title}`);
        return existing;
      }
    }

    // Method 3: Fuzzy matching (title + source + date)
    if (campaign.title && sourceId) {
      const existing = await this.findByFuzzyMatch(
        campaign.title,
        sourceId,
        campaign.startDate,
        campaign.endDate
      );
      
      if (existing) {
        console.log(`🔍 Duplicate found (Fuzzy): ${campaign.title}`);
        return existing;
      }
    }

    return null;
  }

  /**
   * Find campaign by hash
   * @param {string} dataHash
   * @returns {Promise<Object|null>}
   */
  async findByHash(dataHash) {
    const pool = require('../config/database');
    
    const query = `
      SELECT * FROM campaigns
      WHERE data_hash = $1
      ORDER BY created_at DESC
      LIMIT 1
    `;
    
    const result = await pool.query(query, [dataHash]);
    return result.rows[0] || null;
  }

  /**
   * Find campaign by fuzzy matching
   * Uses Levenshtein distance to find similar titles
   * @param {string} title
   * @param {string} sourceId
   * @param {Date} startDate
   * @param {Date} endDate
   * @returns {Promise<Object|null>}
   */
  async findByFuzzyMatch(title, sourceId, startDate, endDate) {
    const pool = require('../config/database');
    
    // Find campaigns with same source and similar dates
    let query = `
      SELECT * FROM campaigns
      WHERE source_id = $1
        AND is_active = true
    `;
    
    const params = [sourceId];
    let paramIndex = 2;

    // Add date filters if available
    if (startDate) {
      query += ` AND starts_at = $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND expires_at = $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT 10`;

    const result = await pool.query(query, params);
    const candidates = result.rows;

    // Calculate similarity for each candidate
    for (const candidate of candidates) {
      const similarity = this.calculateSimilarity(title, candidate.title);
      
      // If similarity > 80%, consider it a duplicate
      if (similarity > 0.8) {
        console.log(`🔍 Fuzzy match: "${title}" ≈ "${candidate.title}" (${Math.round(similarity * 100)}%)`);
        return candidate;
      }
    }

    return null;
  }

  /**
   * Calculate similarity between two strings using Levenshtein distance
   * @param {string} str1
   * @param {string} str2
   * @returns {number} - Similarity score (0-1)
   */
  calculateSimilarity(str1, str2) {
    if (!str1 || !str2) {
      return 0;
    }

    // Normalize strings (lowercase, trim)
    str1 = str1.toLowerCase().trim();
    str2 = str2.toLowerCase().trim();

    // If strings are identical, return 1
    if (str1 === str2) {
      return 1;
    }

    // Calculate Levenshtein distance
    const distance = this.levenshteinDistance(str1, str2);
    
    // Convert distance to similarity score (0-1)
    const maxLength = Math.max(str1.length, str2.length);
    const similarity = 1 - (distance / maxLength);

    return similarity;
  }

  /**
   * Calculate Levenshtein distance between two strings
   * @param {string} str1
   * @param {string} str2
   * @returns {number} - Edit distance
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];

    // Initialize matrix
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Get duplicate statistics
   * @returns {Promise<Object>}
   */
  async getStats() {
    const pool = require('../config/database');
    
    // Count campaigns with same hash (potential duplicates)
    const hashDuplicates = await pool.query(`
      SELECT data_hash, COUNT(*) as count
      FROM campaigns
      WHERE data_hash IS NOT NULL
        AND is_active = true
      GROUP BY data_hash
      HAVING COUNT(*) > 1
      ORDER BY count DESC
      LIMIT 10
    `);

    // Count campaigns with same URL (definite duplicates)
    const urlDuplicates = await pool.query(`
      SELECT original_url, COUNT(*) as count
      FROM campaigns
      WHERE original_url IS NOT NULL
        AND is_active = true
      GROUP BY original_url
      HAVING COUNT(*) > 1
      ORDER BY count DESC
      LIMIT 10
    `);

    return {
      hashDuplicates: hashDuplicates.rows,
      urlDuplicates: urlDuplicates.rows,
      totalHashDuplicates: hashDuplicates.rows.reduce((sum, row) => sum + parseInt(row.count), 0),
      totalUrlDuplicates: urlDuplicates.rows.reduce((sum, row) => sum + parseInt(row.count), 0),
    };
  }
}

module.exports = new DuplicateDetector();
