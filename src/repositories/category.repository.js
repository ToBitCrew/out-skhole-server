const db = require('../config/db');

const getMajors = async () => {
  const [rows] = await db.query('SELECT * FROM EduMajorCategory ORDER BY major_cat_cd');
  return rows;
};

const getMids = async () => {
  const [rows] = await db.query('SELECT * FROM EduMidCategory ORDER BY major_cat_cd, mid_cat_cd');
  return rows;
};

const getSubs = async () => {
  const [rows] = await db.query('SELECT * FROM EduSubCategory ORDER BY major_cat_cd, mid_cat_cd, sub_cat_cd');
  return rows;
};

module.exports = { getMajors, getMids, getSubs };
