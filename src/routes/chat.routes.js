const router = require('express').Router();
const ctrl = require('../controllers/chat.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);

router.get('/', ctrl.getRooms);
router.post('/', ctrl.createRoom);
router.delete('/:roomId', ctrl.leaveRoom);
router.get('/:roomId/messages', ctrl.getMessages);
router.post('/:roomId/messages', ctrl.sendMessage);
router.patch('/:roomId/messages/read', ctrl.markRead);
router.delete('/:roomId/messages/:messageId', ctrl.deleteMessage);

module.exports = router;
