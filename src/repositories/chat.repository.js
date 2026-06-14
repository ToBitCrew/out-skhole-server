const db = require('../config/db');

const findRoom = async (uid_a, uid_b) => {
  const [rows] = await db.query(
    `SELECT * FROM ChatRoomTB
     WHERE (user_a_id = ? AND user_b_id = ?) OR (user_a_id = ? AND user_b_id = ?)`,
    [uid_a, uid_b, uid_b, uid_a]
  );
  return rows[0];
};

const getNextRoomId = async () => {
  const [rows] = await db.query('SELECT COALESCE(MAX(chat_room_id), 0) + 1 AS next_id FROM ChatRoomTB');
  return rows[0].next_id;
};

const createRoom = async (chat_room_id, user_a_id, user_b_id) => {
  await db.query(
    `INSERT INTO ChatRoomTB (chat_room_id, create_dt, last_message_dt, conversation_active, user_a_id, user_b_id)
     VALUES (?, NOW(), NOW(), 1, ?, ?)`,
    [chat_room_id, user_a_id, user_b_id]
  );
};

const getRooms = async (uid) => {
  const [rows] = await db.query(
    `SELECT cr.*,
            cb.chat_content AS last_message,
            (SELECT COUNT(*) FROM ChatBlockTB m
             WHERE m.chat_room_id = cr.chat_room_id AND m.sender_id != ? AND m.is_read = 0) AS unread_cnt,
            CASE WHEN cr.user_a_id = ? THEN cr.user_b_id ELSE cr.user_a_id END AS partner_id
     FROM ChatRoomTB cr
     LEFT JOIN ChatBlockTB cb
       ON cb.chat_room_id = cr.chat_room_id
      AND cb.chat_block_id = (
            SELECT MAX(chat_block_id) FROM ChatBlockTB WHERE chat_room_id = cr.chat_room_id
          )
     WHERE (cr.user_a_id = ? OR cr.user_b_id = ?) AND cr.conversation_active = 1
     ORDER BY cr.last_message_dt DESC`,
    [uid, uid, uid, uid]
  );
  return rows;
};

const getPartner = async (uid) => {
  const [rows] = await db.query(
    'SELECT uid, nick_nm, profile_img FROM UserTB WHERE uid = ?',
    [uid]
  );
  return rows[0];
};

const isRoomMember = async (chat_room_id, uid) => {
  const [rows] = await db.query(
    'SELECT chat_room_id FROM ChatRoomTB WHERE chat_room_id = ? AND (user_a_id = ? OR user_b_id = ?)',
    [chat_room_id, uid, uid]
  );
  return rows.length > 0;
};

const getMessages = async (chat_room_id, cursor, limit) => {
  const params = [chat_room_id];
  let cursorClause = '';
  if (cursor) { cursorClause = 'AND cb.chat_block_id < ?'; params.push(cursor); }

  const [rows] = await db.query(
    `SELECT cb.* FROM ChatBlockTB cb
     WHERE cb.chat_room_id = ? ${cursorClause}
     ORDER BY cb.chat_block_id DESC
     LIMIT ?`,
    [...params, parseInt(limit)]
  );
  return rows;
};

const getMessageFiles = async (chat_block_id) => {
  const [rows] = await db.query(
    'SELECT * FROM ChatBlockFileTB WHERE chat_block_id = ?',
    [chat_block_id]
  );
  return rows;
};

const getNextMsgId = async () => {
  const [rows] = await db.query('SELECT COALESCE(MAX(chat_block_id), 0) + 1 AS next_id FROM ChatBlockTB');
  return rows[0].next_id;
};

const createMessage = async ({ chat_block_id, chat_room_id, sender_id, chat_content, chat_message_type }) => {
  await db.query(
    `INSERT INTO ChatBlockTB
       (chat_block_id, chat_room_id, sender_id, chat_content, chat_message_type,
        sent_dt, is_read, del_by_sender, del_by_receiver)
     VALUES (?, ?, ?, ?, ?, NOW(), 0, 0, 0)`,
    [chat_block_id, chat_room_id, sender_id, chat_content, chat_message_type]
  );
  await db.query(
    'UPDATE ChatRoomTB SET last_message_dt = NOW() WHERE chat_room_id = ?',
    [chat_room_id]
  );
};

const markAllRead = async (chat_room_id, uid) => {
  await db.query(
    'UPDATE ChatBlockTB SET is_read = 1 WHERE chat_room_id = ? AND sender_id != ?',
    [chat_room_id, uid]
  );
};

const findMessage = async (chat_block_id) => {
  const [rows] = await db.query(
    'SELECT * FROM ChatBlockTB WHERE chat_block_id = ?',
    [chat_block_id]
  );
  return rows[0];
};

const deleteMessage = async (chat_block_id, isSender) => {
  const col = isSender ? 'del_by_sender' : 'del_by_receiver';
  await db.query(`UPDATE ChatBlockTB SET ${col} = 1 WHERE chat_block_id = ?`, [chat_block_id]);
};

module.exports = {
  findRoom, getNextRoomId, createRoom, getRooms, getPartner,
  isRoomMember, getMessages, getMessageFiles, getNextMsgId, createMessage,
  markAllRead, findMessage, deleteMessage,
};
