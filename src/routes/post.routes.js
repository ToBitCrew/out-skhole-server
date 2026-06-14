const router = require('express').Router();
const ctrl = require('../controllers/post.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);

// 특정 경로가 :postId보다 먼저 선언되어야 함
router.get('/search', ctrl.search);
router.get('/tags/autocomplete', ctrl.tagAutocomplete);

router.get('/', ctrl.getList);
router.post('/', ctrl.createPost);

router.get('/:postId', ctrl.getPost);
router.patch('/:postId', ctrl.updatePost);
router.delete('/:postId', ctrl.deletePost);

router.post('/:postId/assets', ctrl.addAsset);
router.post('/:postId/like', ctrl.likePost);
router.delete('/:postId/like', ctrl.unlikePost);
router.post('/:postId/bookmark', ctrl.bookmarkPost);
router.delete('/:postId/bookmark', ctrl.unbookmarkPost);

router.get('/:postId/comments', ctrl.getComments);
router.post('/:postId/comments', ctrl.createComment);
router.delete('/:postId/comments/:commentId', ctrl.deleteComment);

module.exports = router;
