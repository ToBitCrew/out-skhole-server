const router = require('express').Router();
const ctrl = require('../controllers/school.controller');

router.get('/', ctrl.searchSchools);
router.get('/:schoolCd/departments', ctrl.getDepts);

module.exports = router;
