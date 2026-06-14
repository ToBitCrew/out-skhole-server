const db = require('../config/db');

const search = async ({ q, region, univ_type }) => {
  const where = [];
  const params = [];
  if (q) { where.push('school_nm LIKE ?'); params.push(`%${q}%`); }
  if (region) { where.push('region = ?'); params.push(region); }
  if (univ_type) { where.push('univ_type = ?'); params.push(univ_type); }

  const whereStr = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const [rows] = await db.query(`SELECT * FROM School ${whereStr} LIMIT 50`, params);
  return rows;
};

const getDepts = async (school_cd, { q, is_active } = {}) => {
  const where = ['school_cd = ?'];
  const params = [school_cd];

  if (is_active !== 'false' && is_active !== false) {
    where.push('is_active = 1');
  }
  if (q) { where.push('dept_nm LIKE ?'); params.push(`%${q}%`); }

  const whereStr = 'WHERE ' + where.join(' AND ');
  const [rows] = await db.query(`SELECT * FROM SchoolDept ${whereStr}`, params);
  return rows;
};

module.exports = { search, getDepts };
