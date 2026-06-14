const postService = require('../services/post.service');
const { ok, created } = require('../utils/response');

const getList = async (req, res, next) => {
  try { ok(res, await postService.getList(req.query)); } catch (e) { next(e); }
};

const search = async (req, res, next) => {
  try { ok(res, await postService.search(req.query)); } catch (e) { next(e); }
};

const tagAutocomplete = async (req, res, next) => {
  try {
    ok(res, { items: await postService.getTagAutocomplete(req.query.q, req.query.limit) });
  } catch (e) { next(e); }
};

const getPost = async (req, res, next) => {
  try { ok(res, await postService.getPost(parseInt(req.params.postId))); } catch (e) { next(e); }
};

const createPost = async (req, res, next) => {
  try { created(res, await postService.createPost(req.user.uid, req.body)); } catch (e) { next(e); }
};

const updatePost = async (req, res, next) => {
  try {
    await postService.updatePost(req.user.uid, parseInt(req.params.postId), req.body);
    ok(res, {});
  } catch (e) { next(e); }
};

const deletePost = async (req, res, next) => {
  try {
    await postService.deletePost(req.user.uid, parseInt(req.params.postId), req.user.permission);
    ok(res, {});
  } catch (e) { next(e); }
};

// 프로토타입: 실제 파일 업로드(multer + S3) 없이 URL을 body에서 수신
const addAsset = async (req, res, next) => {
  try {
    const fileUrl = req.body.url || '';
    created(res, [await postService.addAsset(req.user.uid, parseInt(req.params.postId), fileUrl)]);
  } catch (e) { next(e); }
};

const likePost = async (req, res, next) => {
  try { ok(res, await postService.likePost(req.user.uid, parseInt(req.params.postId))); } catch (e) { next(e); }
};

const unlikePost = async (req, res, next) => {
  try { ok(res, await postService.unlikePost(req.user.uid, parseInt(req.params.postId))); } catch (e) { next(e); }
};

const bookmarkPost = async (req, res, next) => {
  try { await postService.bookmarkPost(req.user.uid, parseInt(req.params.postId)); ok(res, {}); } catch (e) { next(e); }
};

const unbookmarkPost = async (req, res, next) => {
  try { await postService.unbookmarkPost(req.user.uid, parseInt(req.params.postId)); ok(res, {}); } catch (e) { next(e); }
};

const getComments = async (req, res, next) => {
  try { ok(res, await postService.getComments(parseInt(req.params.postId), req.query)); } catch (e) { next(e); }
};

const createComment = async (req, res, next) => {
  try {
    created(res, await postService.createComment(req.user.uid, parseInt(req.params.postId), req.body));
  } catch (e) { next(e); }
};

const deleteComment = async (req, res, next) => {
  try {
    await postService.deleteComment(req.user.uid, parseInt(req.params.commentId), req.user.permission);
    ok(res, {});
  } catch (e) { next(e); }
};

module.exports = {
  getList, search, tagAutocomplete,
  getPost, createPost, updatePost, deletePost,
  addAsset,
  likePost, unlikePost, bookmarkPost, unbookmarkPost,
  getComments, createComment, deleteComment,
};
