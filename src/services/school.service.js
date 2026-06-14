const schoolRepo = require('../repositories/school.repository');

const searchSchools = (query) => schoolRepo.search(query);
const getDepts = (school_cd, query) => schoolRepo.getDepts(school_cd, query);

module.exports = { searchSchools, getDepts };
