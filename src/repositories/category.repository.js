const db = require('../config/db');

const getMajors = async () => {
  const [rows] = await db.query('SELECT * FROM EduMajorCategoryTB ORDER BY major_cat_cd');
  return rows;
};

const getMids = async () => {
  const [rows] = await db.query('SELECT * FROM EduMidCategoryTB ORDER BY major_cat_cd, mid_cat_cd');
  return rows;
};

const getSubs = async () => {
  const [rows] = await db.query('SELECT * FROM EduSubCategoryTB ORDER BY major_cat_cd, mid_cat_cd, sub_cat_cd');
  return rows;
};

module.exports = { getMajors, getMids, getSubs };
