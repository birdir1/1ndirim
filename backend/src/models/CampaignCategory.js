const pool = require('../config/database');

async function fetchActiveCategories() {
  const result = await pool.query(
    `SELECT id, name, display_name, icon, description, min_campaigns, fixed_sources, is_active
     FROM campaign_categories
     WHERE is_active = true
     ORDER BY display_name ASC`
  );
  return result.rows;
}

async function findActiveByName(name) {
  const result = await pool.query(
    `SELECT id, name, display_name, icon, description, min_campaigns, fixed_sources, is_active
     FROM campaign_categories
     WHERE is_active = true AND name = $1
     LIMIT 1`,
    [name]
  );
  return result.rows[0] || null;
}

module.exports = {
  fetchActiveCategories,
  findActiveByName,
};
