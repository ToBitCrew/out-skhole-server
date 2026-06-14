const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.post('/logout', authenticate, ctrl.logout);
router.post('/refresh', ctrl.refresh);
router.post('/otp/send', ctrl.sendOtp);
router.post('/otp/verify', ctrl.verifyOtp);
router.post('/school/verify', authenticate, ctrl.verifySchool);
router.post('/identity/verify', authenticate, ctrl.verifyIdentity);

module.exports = router;
