const db = require('../config/db');

// ── 목록 조회 ────────────────────────────────────────────────────────────────

const getList = async ({ page, limit, post_type, sub_cat_cd, school_cd }) => {
  const offset = (page - 1) * limit;
  const where = ['p.post_status = 2', 'p.post_id_top = 0'];
  const params = [];

  if (post_type != null) { where.push('p.post_type = ?'); params.push(post_type); }
  if (school_cd) { where.push('u.school_cd = ?'); params.push(school_cd); }
  if (sub_cat_cd) {
    where.push('EXISTS (SELECT 1 FROM PostSubCategoryTB sc WHERE sc.post_id = p.post_id AND sc.sub_cat_cd = ?)');
    params.push(sub_cat_cd);
  }

  const whereStr = 'WHERE ' + where.join(' AND ');

  const [countRows] = await db.query(
    `SELECT COUNT(*) AS total FROM PostTB p JOIN UserTB u ON p.uid = u.uid ${whereStr}`,
    params
  );

  const [rows] = await db.query(
    `SELECT p.post_id, p.post_type, p.post_status, p.post_title, p.write_dt, p.like_cnt, p.bookmark_cnt,
            u.uid, u.nick_nm, u.profile_img,
            (SELECT COUNT(*) FROM PostTB c WHERE c.post_id_top = p.post_id AND c.post_status != 3) AS comment_cnt
     FROM PostTB p
     JOIN UserTB u ON p.uid = u.uid
     ${whereStr}
     ORDER BY p.write_dt DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return { rows, total: countRows[0].total };
};

// ── 검색 ─────────────────────────────────────────────────────────────────────

const search = async ({ q, page, limit, post_type, major_cat_cd }) => {
  const offset = (page - 1) * limit;
  const where = [
    'p.post_status = 2',
    'p.post_id_top = 0',
    `(p.post_title LIKE ? OR p.post_content LIKE ?
       OR EXISTS (
         SELECT 1 FROM PostTagMapTB tm
         JOIN PostTagTB t ON tm.tag_id = t.id
         WHERE tm.post_id = p.post_id AND t.tag_name LIKE ?
       ))`,
  ];
  const params = [`%${q}%`, `%${q}%`, `%${q}%`];

  if (post_type != null) { where.push('p.post_type = ?'); params.push(post_type); }
  if (major_cat_cd) {
    where.push(`EXISTS (
      SELECT 1 FROM PostSubCategoryTB psc
      JOIN EduSubCategoryTB esc ON psc.sub_cat_cd = esc.sub_cat_cd
      WHERE psc.post_id = p.post_id AND esc.major_cat_cd = ?
    )`);
    params.push(major_cat_cd);
  }

  const whereStr = 'WHERE ' + where.join(' AND ');

  const [countRows] = await db.query(
    `SELECT COUNT(*) AS total FROM PostTB p ${whereStr}`,
    params
  );
  const [rows] = await db.query(
    `SELECT p.post_id, p.post_type, p.post_status, p.post_title, p.write_dt, p.like_cnt, p.bookmark_cnt,
            u.uid, u.nick_nm, u.profile_img,
            (SELECT COUNT(*) FROM PostTB c WHERE c.post_id_top = p.post_id AND c.post_status != 3) AS comment_cnt
     FROM PostTB p
     JOIN UserTB u ON p.uid = u.uid
     ${whereStr}
     ORDER BY p.write_dt DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return { rows, total: countRows[0].total };
};

// ── 태그 자동완성 ─────────────────────────────────────────────────────────────

const getTagAutocomplete = async (q, limit) => {
  const [rows] = await db.query(
    'SELECT tag_name, use_cnt FROM PostTagTB WHERE tag_name LIKE ? ORDER BY use_cnt DESC LIMIT ?',
    [`${q}%`, parseInt(limit) || 10]
  );
  return rows;
};

// ── 단건 조회 ────────────────────────────────────────────────────────────────

const findById = async (post_id) => {
  const [rows] = await db.query(
    `SELECT p.*, u.uid, u.nick_nm, u.profile_img
     FROM PostTB p
     JOIN UserTB u ON p.uid = u.uid
     WHERE p.post_id = ? AND p.post_status != 3`,
    [post_id]
  );
  return rows[0];
};

const getAssets = async (post_id) => {
  const [rows] = await db.query('SELECT * FROM PostAssetTB WHERE post_id = ?', [post_id]);
  return rows;
};

const getTags = async (post_id) => {
  const [rows] = await db.query(
    `SELECT t.tag_name FROM PostTagMapTB tm
     JOIN PostTagTB t ON tm.tag_id = t.id
     WHERE tm.post_id = ?`,
    [post_id]
  );
  return rows.map((r) => r.tag_name);
};

const getQuestion = async (post_id) => {
  const [rows] = await db.query('SELECT * FROM PostQuestionTB WHERE post_id = ?', [post_id]);
  return rows[0];
};

const getSale = async (post_id) => {
  const [rows] = await db.query('SELECT * FROM PostSaleTB WHERE post_id = ?', [post_id]);
  return rows[0];
};

// ── 생성 ─────────────────────────────────────────────────────────────────────

const getNextPostId = async () => {
  const [rows] = await db.query('SELECT COALESCE(MAX(post_id), 0) + 1 AS next_id FROM PostTB');
  return rows[0].next_id;
};

const create = async ({ post_id, uid, post_title, post_content, post_type, post_status }) => {
  await db.query(
    `INSERT INTO PostTB
       (post_ver, post_id, post_id_top, post_status, post_type, uid, post_title, post_content,
        write_dt, write_ver, edit_dt, like_cnt, bookmark_cnt)
     VALUES (0, ?, 0, ?, ?, ?, ?, ?, NOW(), 1, NOW(), 0, 0)`,
    [post_id, post_status, post_type, uid, post_title, post_content]
  );
};

const createQuestion = async (post_id, pii_mask) => {
  await db.query(
    'INSERT INTO PostQuestionTB (post_id, pii_mask) VALUES (?, ?)',
    [post_id, pii_mask ? 1 : 0]
  );
};

const createSale = async (post_id, { item_nm, item_type, item_status, price }) => {
  await db.query(
    'INSERT INTO PostSaleTB (post_id, item_nm, item_type, item_status, price) VALUES (?, ?, ?, ?, ?)',
    [post_id, item_nm, item_type, item_status, price]
  );
};

// ── 태그 ─────────────────────────────────────────────────────────────────────

const getOrCreateTag = async (tag_name) => {
  const [existing] = await db.query('SELECT id FROM PostTagTB WHERE tag_name = ?', [tag_name]);
  if (existing[0]) {
    await db.query('UPDATE PostTagTB SET use_cnt = use_cnt + 1 WHERE id = ?', [existing[0].id]);
    return existing[0].id;
  }
  const [result] = await db.query(
    'INSERT INTO PostTagTB (tag_name, tag_type, use_cnt, created_dt) VALUES (?, 0, 1, NOW())',
    [tag_name]
  );
  return result.insertId;
};

const getNextTagMapId = async () => {
  const [rows] = await db.query('SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM PostTagMapTB');
  return rows[0].next_id;
};

const createTagMap = async (id, post_id, tag_id) => {
  await db.query('INSERT INTO PostTagMapTB (id, post_id, tag_id) VALUES (?, ?, ?)', [id, post_id, tag_id]);
};

const deleteTagsByPost = async (post_id) => {
  await db.query('DELETE FROM PostTagMapTB WHERE post_id = ?', [post_id]);
};

// ── 서브카테고리 ──────────────────────────────────────────────────────────────

const getNextSubCatId = async () => {
  const [rows] = await db.query('SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM PostSubCategoryTB');
  return rows[0].next_id;
};

const createSubCat = async (id, post_id, sub_cat_cd) => {
  await db.query(
    'INSERT INTO PostSubCategoryTB (id, post_id, sub_cat_cd) VALUES (?, ?, ?)',
    [id, post_id, sub_cat_cd]
  );
};

// ── 에셋 ─────────────────────────────────────────────────────────────────────

const addAsset = async (post_id, post_asset_url) => {
  const [result] = await db.query(
    'INSERT INTO PostAssetTB (post_id, post_asset_url) VALUES (?, ?)',
    [post_id, post_asset_url]
  );
  return result.insertId;
};

// ── 수정 / 삭제 ───────────────────────────────────────────────────────────────

const update = async (post_id, fields) => {
  const allowed = ['post_title', 'post_content', 'post_status'];
  const keys = Object.keys(fields).filter((k) => allowed.includes(k));
  if (!keys.length) return;
  const set = keys.map((k) => `${k} = ?`).join(', ');
  await db.query(
    `UPDATE PostTB SET ${set}, edit_dt = NOW() WHERE post_id = ?`,
    [...keys.map((k) => fields[k]), post_id]
  );
};

const updateSale = async (post_id, fields) => {
  const allowed = ['sold', 'item_status', 'price', 'item_nm'];
  const keys = Object.keys(fields).filter((k) => allowed.includes(k));
  if (!keys.length) return;
  const set = keys.map((k) => `${k} = ?`).join(', ');
  await db.query(
    `UPDATE PostSaleTB SET ${set} WHERE post_id = ?`,
    [...keys.map((k) => fields[k]), post_id]
  );
};

const softDelete = async (post_id) => {
  await db.query('UPDATE PostTB SET post_status = 3 WHERE post_id = ?', [post_id]);
};

// ── 좋아요 / 북마크 ──────────────────────────────────────────────────────────

const incrementLike = async (post_id) => {
  await db.query('UPDATE PostTB SET like_cnt = like_cnt + 1 WHERE post_id = ?', [post_id]);
  const [rows] = await db.query('SELECT like_cnt FROM PostTB WHERE post_id = ?', [post_id]);
  return rows[0]?.like_cnt;
};

const decrementLike = async (post_id) => {
  await db.query('UPDATE PostTB SET like_cnt = GREATEST(like_cnt - 1, 0) WHERE post_id = ?', [post_id]);
  const [rows] = await db.query('SELECT like_cnt FROM PostTB WHERE post_id = ?', [post_id]);
  return rows[0]?.like_cnt;
};

const incrementBookmark = async (post_id) => {
  await db.query('UPDATE PostTB SET bookmark_cnt = bookmark_cnt + 1 WHERE post_id = ?', [post_id]);
};

const decrementBookmark = async (post_id) => {
  await db.query('UPDATE PostTB SET bookmark_cnt = GREATEST(bookmark_cnt - 1, 0) WHERE post_id = ?', [post_id]);
};

// ── 댓글 ─────────────────────────────────────────────────────────────────────

const getComments = async (post_id, page, limit) => {
  const offset = (page - 1) * limit;
  const [countRows] = await db.query(
    'SELECT COUNT(*) AS total FROM PostTB WHERE post_id_top = ? AND post_status != 3',
    [post_id]
  );
  const [rows] = await db.query(
    `SELECT p.post_id, p.post_id_top, p.post_content, p.post_status, p.write_dt,
            u.uid, u.nick_nm, u.profile_img
     FROM PostTB p
     JOIN UserTB u ON p.uid = u.uid
     WHERE p.post_id_top = ? AND p.post_status != 3
     ORDER BY p.write_dt ASC
     LIMIT ? OFFSET ?`,
    [post_id, limit, offset]
  );
  return { rows, total: countRows[0].total };
};

const createComment = async ({ post_id, post_id_top, uid, post_content }) => {
  await db.query(
    `INSERT INTO PostTB
       (post_ver, post_id, post_id_top, post_status, post_type, uid, post_title, post_content,
        write_dt, write_ver, edit_dt, like_cnt, bookmark_cnt)
     VALUES (0, ?, ?, 2, 2, ?, '', ?, NOW(), 1, NOW(), 0, 0)`,
    [post_id, post_id_top, uid, post_content]
  );
};

module.exports = {
  getList, search, getTagAutocomplete,
  findById, getAssets, getTags, getQuestion, getSale,
  getNextPostId, create, createQuestion, createSale,
  getOrCreateTag, getNextTagMapId, createTagMap, deleteTagsByPost,
  getNextSubCatId, createSubCat,
  addAsset,
  update, updateSale, softDelete,
  incrementLike, decrementLike, incrementBookmark, decrementBookmark,
  getComments, createComment,
};
