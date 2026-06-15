const postRepo = require('../repositories/post.repository');
const AppError = require('../utils/AppError');

// 좋아요·북마크 중복 방지용 인메모리 추적 (프로토타입 - 재시작 시 초기화됨)
// TODO: 유저별 기록 테이블 또는 Redis Set으로 교체
const likedSet = new Map();      // uid → Set<post_id>
const bookmarkedSet = new Map(); // uid → Set<post_id>

const getUserSet = (map, uid) => {
  if (!map.has(uid)) map.set(uid, new Set());
  return map.get(uid);
};

// ── 공통 헬퍼 ────────────────────────────────────────────────────────────────

const buildListItem = async (row) => {
  const tags = await postRepo.getTags(row.post_id);
  return {
    post_id: row.post_id,
    post_type: row.post_type,
    post_status: row.post_status,
    post_title: row.post_title,
    write_dt: row.write_dt,
    like_cnt: row.like_cnt,
    bookmark_cnt: row.bookmark_cnt,
    comment_cnt: Number(row.comment_cnt),
    author: { uid: row.uid, nick_nm: row.nick_nm, profile_img: row.profile_img },
    tags,
  };
};

// ── 목록 / 검색 ───────────────────────────────────────────────────────────────

const getList = async (query) => {
  const page = Math.max(parseInt(query.page) || 1, 1);
  const limit = Math.min(parseInt(query.limit) || 20, 50);
  const { rows, total } = await postRepo.getList({
    page, limit,
    post_type: query.post_type != null ? parseInt(query.post_type) : null,
    sub_cat_cd: query.sub_cat_cd ? parseInt(query.sub_cat_cd) : null,
    school_cd: query.school_cd || null,
  });
  const items = await Promise.all(rows.map(buildListItem));
  return { items, pagination: { page, limit, total: Number(total), hasNext: page * limit < Number(total) } };
};

const search = async (query) => {
  if (!query.q) throw new AppError('검색어(q)가 필요합니다', 400, 'VALIDATION_ERROR');
  const page = Math.max(parseInt(query.page) || 1, 1);
  const limit = Math.min(parseInt(query.limit) || 20, 50);
  const { rows, total } = await postRepo.search({
    q: query.q, page, limit,
    post_type: query.post_type != null ? parseInt(query.post_type) : null,
    major_cat_cd: query.major_cat_cd || null,
  });
  const items = await Promise.all(rows.map(buildListItem));
  return { items, pagination: { page, limit, total: Number(total), hasNext: page * limit < Number(total) } };
};

const getTagAutocomplete = async (q, limit) => {
  if (!q) throw new AppError('검색어(q)가 필요합니다', 400, 'VALIDATION_ERROR');
  return postRepo.getTagAutocomplete(q, limit);
};

// ── 단건 조회 ────────────────────────────────────────────────────────────────

const getPost = async (post_id) => {
  const post = await postRepo.findById(post_id);
  if (!post) throw new AppError('게시글을 찾을 수 없습니다', 404, 'NOT_FOUND');

  const [assets, tags, question, sale] = await Promise.all([
    postRepo.getAssets(post_id),
    postRepo.getTags(post_id),
    postRepo.getQuestion(post_id),
    postRepo.getSale(post_id),
  ]);

  return {
    post_id: post.post_id,
    post_ver: post.post_ver,
    post_type: post.post_type,
    post_status: post.post_status,
    post_title: post.post_title,
    post_content: post.post_content,
    write_dt: post.write_dt,
    edit_dt: post.edit_dt,
    like_cnt: post.like_cnt,
    bookmark_cnt: post.bookmark_cnt,
    author: { uid: post.uid, nick_nm: post.nick_nm, profile_img: post.profile_img },
    assets,
    tags,
    question: question
      ? { archive: !!question.archive, pii_mask: !!question.pii_mask }
      : null,
    sale: sale
      ? { item_nm: sale.item_nm, item_type: sale.item_type, item_status: sale.item_status, price: sale.price, sold: !!sale.sold }
      : null,
  };
};

// ── 작성 ─────────────────────────────────────────────────────────────────────

const createPost = async (uid, body) => {
  const { post_title, post_content, post_type, post_status = 1, sub_cat_cd = [], tags = [], question, sale } = body;

  if (!post_title || !post_content || post_type == null) {
    throw new AppError('post_title, post_content, post_type은 필수입니다', 400, 'VALIDATION_ERROR');
  }

  const post_id = await postRepo.getNextPostId();
  await postRepo.create({ post_id, uid, post_title, post_content, post_type: parseInt(post_type), post_status: parseInt(post_status) });

  if (post_type === 3 && question) await postRepo.createQuestion(post_id, question.pii_mask);
  if (post_type === 4 && sale) await postRepo.createSale(post_id, sale);

  let tagMapId = await postRepo.getNextTagMapId();
  for (const tag_name of tags.slice(0, 5)) {
    const tag_id = await postRepo.getOrCreateTag(String(tag_name).trim());
    await postRepo.createTagMap(tagMapId++, post_id, tag_id);
  }

  let subCatId = await postRepo.getNextSubCatId();
  for (const sub_cat_cd of sub_cat_cd) {
    await postRepo.createSubCat(subCatId++, post_id, parseInt(sub_cat_cd));
  }

  return { post_id };
};

// ── 수정 ─────────────────────────────────────────────────────────────────────

const updatePost = async (uid, post_id, body) => {
  const post = await postRepo.findById(post_id);
  if (!post) throw new AppError('게시글을 찾을 수 없습니다', 404, 'NOT_FOUND');
  if (post.uid !== uid) throw new AppError('권한이 없습니다', 403, 'FORBIDDEN');

  const { tags, sale, ...rest } = body;
  await postRepo.update(post_id, rest);
  if (sale) await postRepo.updateSale(post_id, sale);

  if (tags) {
    await postRepo.deleteTagsByPost(post_id);
    let tagMapId = await postRepo.getNextTagMapId();
    for (const tag_name of tags.slice(0, 5)) {
      const tag_id = await postRepo.getOrCreateTag(String(tag_name).trim());
      await postRepo.createTagMap(tagMapId++, post_id, tag_id);
    }
  }
};

// ── 삭제 ─────────────────────────────────────────────────────────────────────

const deletePost = async (uid, post_id, permission) => {
  const post = await postRepo.findById(post_id);
  if (!post) throw new AppError('게시글을 찾을 수 없습니다', 404, 'NOT_FOUND');
  if (post.uid !== uid && permission < 8) throw new AppError('권한이 없습니다', 403, 'FORBIDDEN');
  await postRepo.softDelete(post_id);
};

// ── 에셋 ─────────────────────────────────────────────────────────────────────

const addAsset = async (uid, post_id, fileUrl) => {
  const post = await postRepo.findById(post_id);
  if (!post) throw new AppError('게시글을 찾을 수 없습니다', 404, 'NOT_FOUND');
  if (post.uid !== uid) throw new AppError('권한이 없습니다', 403, 'FORBIDDEN');
  const post_asset_id = await postRepo.addAsset(post_id, fileUrl);
  return { post_asset_id, post_asset_url: fileUrl };
};

// ── 좋아요 ────────────────────────────────────────────────────────────────────

const likePost = async (uid, post_id) => {
  const post = await postRepo.findById(post_id);
  if (!post) throw new AppError('게시글을 찾을 수 없습니다', 404, 'NOT_FOUND');
  const liked = getUserSet(likedSet, uid);
  if (liked.has(post_id)) throw new AppError('이미 좋아요한 게시글입니다', 409, 'ALREADY_LIKED');
  liked.add(post_id);
  const like_cnt = await postRepo.incrementLike(post_id);
  return { like_cnt };
};

const unlikePost = async (uid, post_id) => {
  const post = await postRepo.findById(post_id);
  if (!post) throw new AppError('게시글을 찾을 수 없습니다', 404, 'NOT_FOUND');
  getUserSet(likedSet, uid).delete(post_id);
  const like_cnt = await postRepo.decrementLike(post_id);
  return { like_cnt };
};

// ── 북마크 ────────────────────────────────────────────────────────────────────

const bookmarkPost = async (uid, post_id) => {
  const post = await postRepo.findById(post_id);
  if (!post) throw new AppError('게시글을 찾을 수 없습니다', 404, 'NOT_FOUND');
  const bookmarked = getUserSet(bookmarkedSet, uid);
  if (bookmarked.has(post_id)) throw new AppError('이미 북마크한 게시글입니다', 409, 'ALREADY_BOOKMARKED');
  bookmarked.add(post_id);
  await postRepo.incrementBookmark(post_id);
};

const unbookmarkPost = async (uid, post_id) => {
  getUserSet(bookmarkedSet, uid).delete(post_id);
  await postRepo.decrementBookmark(post_id);
};

// ── 댓글 ─────────────────────────────────────────────────────────────────────

const getComments = async (post_id, query) => {
  const page = Math.max(parseInt(query.page) || 1, 1);
  const limit = Math.max(parseInt(query.limit) || 20, 1);
  const { rows, total } = await postRepo.getComments(post_id, page, limit);
  const items = rows.map((r) => ({
    post_id: r.post_id,
    post_id_top: r.post_id_top,
    post_content: r.post_content,
    post_status: r.post_status,
    write_dt: r.write_dt,
    author: { uid: r.uid, nick_nm: r.nick_nm, profile_img: r.profile_img },
  }));
  return { items, pagination: { page, limit, total: Number(total), hasNext: page * limit < Number(total) } };
};

const createComment = async (uid, post_id, { post_content, parent_post_id }) => {
  if (!post_content) throw new AppError('댓글 내용이 필요합니다', 400, 'VALIDATION_ERROR');
  const parent = await postRepo.findById(post_id);
  if (!parent) throw new AppError('게시글을 찾을 수 없습니다', 404, 'NOT_FOUND');
  const new_post_id = await postRepo.getNextPostId();
  const post_id_top = parent_post_id || post_id;
  await postRepo.createComment({ post_id: new_post_id, post_id_top, uid, post_content });
  return { post_id: new_post_id };
};

const deleteComment = async (uid, comment_id, permission) => {
  const comment = await postRepo.findById(comment_id);
  if (!comment) throw new AppError('댓글을 찾을 수 없습니다', 404, 'NOT_FOUND');
  if (comment.uid !== uid && permission < 8) throw new AppError('권한이 없습니다', 403, 'FORBIDDEN');
  await postRepo.softDelete(comment_id);
};

module.exports = {
  getList, search, getTagAutocomplete,
  getPost, createPost, updatePost, deletePost,
  addAsset,
  likePost, unlikePost, bookmarkPost, unbookmarkPost,
  getComments, createComment, deleteComment,
};
