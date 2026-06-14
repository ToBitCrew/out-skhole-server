const router = require('express').Router();
const ctrl = require('../controllers/user.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);

router.get('/me', ctrl.getMe);
router.patch('/me', ctrl.updateMe);
router.delete('/me', ctrl.deleteMe);
router.get('/me/contacts', ctrl.getContacts);
router.post('/me/contacts', ctrl.addContact);
router.delete('/me/contacts/:contactId', ctrl.removeContact);
router.get('/:uid', ctrl.getUser);

module.exports = router;
