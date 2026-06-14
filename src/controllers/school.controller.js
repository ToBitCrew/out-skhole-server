const schoolService = require('../services/school.service');
const { ok } = require('../utils/response');

const searchSchools = async (req, res, next) => {
  try { ok(res, { items: await schoolService.searchSchools(req.query) }); } catch (e) { next(e); }
};

const getDepts = async (req, res, next) => {
  try {
    ok(res, { items: await schoolService.getDepts(req.params.schoolCd, req.query) });
  } catch (e) { next(e); }
};

module.exports = { searchSchools, getDepts };
