const db = require('../config/db');

const findByHandle = async (handle_nm) => {
  const [rows] = await db.query('SELECT * FROM UserTB WHERE handle_nm = ?', [handle_nm]);
  return rows[0];
};

const findById = async (uid) => {
  const [rows] = await db.query('SELECT * FROM UserTB WHERE uid = ?', [uid]);
  return rows[0];
};

const findWithSchoolInfo = async (uid) => {
  const [rows] = await db.query(`
    SELECT u.*, s.school_nm, sd.dept_nm
    FROM UserTB u
    LEFT JOIN School s ON u.school_cd = s.school_cd
    LEFT JOIN SchoolDept sd ON u.dept_cd = sd.dept_cd
    WHERE u.uid = ?
  `, [uid]);
  return rows[0];
};

const hasHandle = async (handle_nm) => {
  const [rows] = await db.query('SELECT uid FROM UserTB WHERE handle_nm = ?', [handle_nm]);
  return rows.length > 0;
};

const hasNickname = async (nick_nm, excludeUid) => {
  const [rows] = await db.query(
    'SELECT uid FROM UserTB WHERE nick_nm = ? AND uid != ?',
    [nick_nm, excludeUid]
  );
  return rows.length > 0;
};

// uid는 AUTO_INCREMENT가 없으므로 MAX+1로 생성
const getNextUid = async () => {
  const [rows] = await db.query('SELECT COALESCE(MAX(uid), 0) + 1 AS next_id FROM UserTB');
  return rows[0].next_id;
};

const create = async ({ nick_nm, handle_nm, school_cd, dept_cd }) => {
  const uid = await getNextUid();
  await db.query(
    `INSERT INTO UserTB (uid, nick_nm, handle_nm, profile_img, profile_banner, permission, active, school_cd, dept_cd)
     VALUES (?, ?, ?, '', '', 1, 1, ?, ?)`,
    [uid, nick_nm, handle_nm, school_cd, dept_cd]
  );
  return uid;
};

const createAuth = async (uid, hashedPassword) => {
  await db.query('INSERT INTO UserAuthTB (uid, password) VALUES (?, ?)', [uid, hashedPassword]);
};

const findAuthByUid = async (uid) => {
  const [rows] = await db.query('SELECT * FROM UserAuthTB WHERE uid = ?', [uid]);
  return rows[0];
};

const updateProfile = async (uid, fields) => {
  const keys = Object.keys(fields);
  if (!keys.length) return;
  const set = keys.map((k) => `${k} = ?`).join(', ');
  await db.query(`UPDATE UserTB SET ${set} WHERE uid = ?`, [...Object.values(fields), uid]);
};

const deactivate = async (uid) => {
  await db.query('UPDATE UserTB SET active = 0 WHERE uid = ?', [uid]);
};

const updatePermission = async (uid, permission) => {
  await db.query('UPDATE UserTB SET permission = ? WHERE uid = ?', [permission, uid]);
};

// ── 연락처 ──────────────────────────────────────────────────────────────────

const findContactByValue = async (contact) => {
  const [rows] = await db.query('SELECT * FROM UserContactTB WHERE contact = ?', [contact]);
  return rows[0];
};

const getContactsByUid = async (uid) => {
  const [rows] = await db.query('SELECT * FROM UserContactTB WHERE uid = ?', [uid]);
  return rows;
};

const createContact = async (uid, contact, contact_type, contact_nm) => {
  const [result] = await db.query(
    'INSERT INTO UserContactTB (uid, contact, contact_type, contact_nm) VALUES (?, ?, ?, ?)',
    [uid, contact, contact_type, contact_nm]
  );
  return result.insertId;
};

const deleteContact = async (contact_id, uid) => {
  const [result] = await db.query(
    'DELETE FROM UserContactTB WHERE contact_id = ? AND uid = ?',
    [contact_id, uid]
  );
  return result.affectedRows;
};

// ── 디바이스 ─────────────────────────────────────────────────────────────────

const upsertDevice = async (uid, device, location) => {
  const loc = location || '';
  await db.query(
    `INSERT INTO UserDeviceTB (uid, device, first_login_dt, first_location, last_login, last_location)
     VALUES (?, ?, NOW(), ?, NOW(), ?)
     ON DUPLICATE KEY UPDATE last_login = NOW(), last_location = ?`,
    [uid, device, loc, loc, loc]
  );
};

// ── 제재 ─────────────────────────────────────────────────────────────────────

const getActivePunishments = async (uid) => {
  const [rows] = await db.query(
    'SELECT * FROM UserPunishTB WHERE uid = ? AND punish_end_dt > NOW()',
    [uid]
  );
  return rows;
};

// ── 학교 인증 ────────────────────────────────────────────────────────────────

const findUnivByUid = async (uid) => {
  const [rows] = await db.query('SELECT * FROM UserUnivTB WHERE uid = ?', [uid]);
  return rows[0];
};

const createUniv = async ({ uid, school_mail, school_cd, department, school_major_id, grade }) => {
  await db.query(
    `INSERT INTO UserUnivTB (uid, school_mail, school_cd, department, school_major_id, grade, school_verify_dt)
     VALUES (?, ?, ?, ?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE
       school_mail = VALUES(school_mail), school_cd = VALUES(school_cd),
       department = VALUES(department), school_major_id = VALUES(school_major_id),
       grade = VALUES(grade), school_verify_dt = NOW()`,
    [uid, school_mail, school_cd, department, school_major_id, grade]
  );
};

// ── 본인 인증 ────────────────────────────────────────────────────────────────

const findVerifyByUid = async (uid) => {
  const [rows] = await db.query('SELECT * FROM UserVerifyTB WHERE uid = ?', [uid]);
  return rows[0];
};

const findVerifyByCi = async (verify_ci) => {
  const [rows] = await db.query('SELECT * FROM UserVerifyTB WHERE verify_ci = ?', [verify_ci]);
  return rows[0];
};

const createVerify = async ({ uid, verify_user_nm, birth, gendar, nationally, verify_ci, verify_di }) => {
  await db.query(
    `INSERT INTO UserVerifyTB
       (uid, verify_user_nm, birth, gendar, nationally, verify_user_dt, verify_ci, verify_di,
        first_verify_dt, verify_cnt, last_verify_dt)
     VALUES (?, ?, ?, ?, ?, NOW(), ?, ?, NOW(), 1, NOW())
     ON DUPLICATE KEY UPDATE
       verify_user_dt = NOW(), verify_cnt = verify_cnt + 1, last_verify_dt = NOW()`,
    [uid, verify_user_nm, birth, gendar, nationally, verify_ci, verify_di]
  );
};

module.exports = {
  findByHandle, findById, findWithSchoolInfo, hasHandle, hasNickname,
  create, createAuth, findAuthByUid,
  updateProfile, deactivate, updatePermission,
  findContactByValue, getContactsByUid, createContact, deleteContact,
  upsertDevice, getActivePunishments,
  findUnivByUid, createUniv,
  findVerifyByUid, findVerifyByCi, createVerify,
};
