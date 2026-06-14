const router = require('express').Router();
const ctrl = require('../controllers/category.controller');

router.get('/', ctrl.getTree);

module.exports = router;
