const categoryService = require('../services/category.service');
const { ok } = require('../utils/response');

const getTree = async (req, res, next) => {
  try { ok(res, await categoryService.getTree()); } catch (e) { next(e); }
};

module.exports = { getTree };
