const pool = require('../config/database');

class Source {
  /**
   * Tüm kaynakları getirir (Public API - sadece active status)
   * HARD_BACKLOG sources excluded from public API
   * @returns {Promise<Array>}
   */
  static async findAll() {
    const query = `
      SELECT 
        s.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', seg.id,
              'name', seg.name,
              'isSelected', false
            )
          ) FILTER (WHERE seg.id IS NOT NULL),
          '[]'::json
        ) as segments
      FROM sources s
      LEFT JOIN source_segments seg ON s.id = seg.source_id
      WHERE s.is_active = true
        AND (s.source_status = 'active' OR s.source_status IS NULL)
      GROUP BY s.id
      ORDER BY s.type, s.name
    `;

    const result = await pool.query(query);
    return result.rows.map((row) => ({
      ...row,
      segments: row.segments || [],
    }));
  }
  
  /**
   * Tüm kaynakları getirir (Admin-only - tüm status'ler)
   * @returns {Promise<Array>}
   */
  static async findAllForAdmin() {
    const query = `
      SELECT 
        s.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', seg.id,
              'name', seg.name,
              'isSelected', false
            )
          ) FILTER (WHERE seg.id IS NOT NULL),
          '[]'::json
        ) as segments
      FROM sources s
      LEFT JOIN source_segments seg ON s.id = seg.source_id
      GROUP BY s.id
      ORDER BY s.source_status, s.type, s.name
    `;

    const result = await pool.query(query);
    return result.rows.map((row) => ({
      ...row,
      segments: row.segments || [],
    }));
  }

  /**
   * ID'ye göre kaynak getirir
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    const query = `
      SELECT 
        s.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', seg.id,
              'name', seg.name,
              'isSelected', false
            )
          ) FILTER (WHERE seg.id IS NOT NULL),
          '[]'::json
        ) as segments
      FROM sources s
      LEFT JOIN source_segments seg ON s.id = seg.source_id
      WHERE s.id = $1
      GROUP BY s.id
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Bot routing: name -> source_status for all sources.
   * Used by bot to decide whether to scrape (e.g. skip hard_backlog).
   * Requires source_status column (add_source_status migration).
   * @returns {Promise<Array<{name:string, source_status:string}>>}
   */
  static async getSourceStatusForBot() {
    const result = await pool.query(`
      SELECT name, COALESCE(source_status::text, 'active') AS source_status
      FROM sources
    `);
    return result.rows;
  }

  /**
   * Yeni kaynak oluşturur
   * @param {Object} sourceData
   * @returns {Promise<Object>}
   */
  static async create(sourceData) {
    const { name, type, logoUrl, websiteUrl, isActive = true } = sourceData;

    const query = `
      INSERT INTO sources (name, type, logo_url, website_url, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
    `;

    const result = await pool.query(query, [name, type, logoUrl, websiteUrl, isActive]);
    return result.rows[0];
  }
}

module.exports = Source;
