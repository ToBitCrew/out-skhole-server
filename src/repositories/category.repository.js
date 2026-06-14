const db = require('../config/db');

const getMajors = async () => {
  const [rows] = await db.query('SELECT * FROM EduMajorCategory ORDER BY cat_major_cd');
  return rows;
};

const getMids = async () => {
  const [rows] = await db.query('SELECT * FROM EduMidCategory ORDER BY cat_major_cd, cat_mid_cd');
  return rows;
};

const getSubs = async () => {
  const [rows] = await db.query('SELECT * FROM EduSubCategory ORDER BY cat_major_cd, cat_mid_cd, cat_sub_cd');
  return rows;
};

module.exports = { getMajors, getMids, getSubs };
