const router = require('express').Router();

router.use('/auth', require('./auth.routes'));
router.use('/users', require('./user.routes'));
router.use('/posts', require('./post.routes'));
router.use('/chats', require('./chat.routes'));
router.use('/schools', require('./school.routes'));
router.use('/categories', require('./category.routes'));

module.exports = router;
