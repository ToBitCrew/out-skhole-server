const db = require('../config/db');
const chatRepo = require('../repositories/chat.repository');
const AppError = require('../utils/AppError');

const getRooms = async (uid) => {
  const rooms = await chatRepo.getRooms(uid);
  return Promise.all(
    rooms.map(async (r) => {
      const partner = await chatRepo.getPartner(r.partner_id);
      return {
        chat_room_id: r.chat_room_id,
        last_message: r.last_message,
        last_message_dt: r.last_message_dt,
        unread_cnt: Number(r.unread_cnt),
        conversation_active: !!r.conversation_active,
        partner,
      };
    })
  );
};

const getOrCreateRoom = async (uid, partner_uid) => {
  if (!partner_uid) throw new AppError('partner_uid가 필요합니다', 400, 'VALIDATION_ERROR');
  if (uid === parseInt(partner_uid)) throw new AppError('자신과 채팅할 수 없습니다', 400, 'VALIDATION_ERROR');
  const existing = await chatRepo.findRoom(uid, parseInt(partner_uid));
  if (existing) return { chat_room_id: existing.chat_room_id, created: false };
  const chat_room_id = await chatRepo.getNextRoomId();
  await chatRepo.createRoom(chat_room_id, uid, parseInt(partner_uid));
  return { chat_room_id, created: true };
};

const leaveRoom = async (uid, room_id) => {
  const isMember = await chatRepo.isRoomMember(room_id, uid);
  if (!isMember) throw new AppError('채팅방을 찾을 수 없습니다', 404, 'NOT_FOUND');
  // TODO: 양쪽 모두 나갔을 때 conversation_active = 0 처리 (user별 left 컬럼 필요)
  // 프로토타입: 즉시 비활성화
  await db.query('UPDATE ChatRoomTB SET conversation_active = 0 WHERE chat_room_id = ?', [room_id]);
};

const getMessages = async (uid, room_id, { cursor, limit = 30 }) => {
  const isMember = await chatRepo.isRoomMember(room_id, uid);
  if (!isMember) throw new AppError('채팅방에 접근할 수 없습니다', 403, 'FORBIDDEN');

  const msgs = await chatRepo.getMessages(
    room_id,
    cursor ? parseInt(cursor) : null,
    parseInt(limit)
  );
  const items = await Promise.all(
    msgs.map(async (m) => {
      const files = await chatRepo.getMessageFiles(m.chat_block_id);
      return {
        chat_block_id: m.chat_block_id,
        sender_id: m.sender_id,
        chat_content: m.chat_content,
        chat_message_type: m.chat_message_type,
        sent_dt: m.sent_dt,
        is_read: !!m.is_read,
        del_by_sender: !!m.del_by_sender,
        del_by_receiver: !!m.del_by_receiver,
        files,
      };
    })
  );

  const next_cursor = items.length > 0 ? items[items.length - 1].chat_block_id : null;
  return { items, has_prev: items.length === parseInt(limit), next_cursor };
};

const sendMessage = async (uid, room_id, { chat_content, chat_message_type }) => {
  if (chat_content == null || chat_message_type == null) {
    throw new AppError('chat_content, chat_message_type은 필수입니다', 400, 'VALIDATION_ERROR');
  }
  const isMember = await chatRepo.isRoomMember(room_id, uid);
  if (!isMember) throw new AppError('채팅방에 접근할 수 없습니다', 403, 'FORBIDDEN');

  const chat_block_id = await chatRepo.getNextMsgId();
  await chatRepo.createMessage({ chat_block_id, chat_room_id: room_id, sender_id: uid, chat_content, chat_message_type });

  const [rows] = await db.query('SELECT sent_dt FROM ChatBlockTB WHERE chat_block_id = ?', [chat_block_id]);
  return { chat_block_id, sent_dt: rows[0]?.sent_dt };
};

const markRead = async (uid, room_id) => {
  const isMember = await chatRepo.isRoomMember(room_id, uid);
  if (!isMember) throw new AppError('채팅방에 접근할 수 없습니다', 403, 'FORBIDDEN');
  await chatRepo.markAllRead(room_id, uid);
};

const deleteMessage = async (uid, room_id, message_id) => {
  const isMember = await chatRepo.isRoomMember(room_id, uid);
  if (!isMember) throw new AppError('채팅방에 접근할 수 없습니다', 403, 'FORBIDDEN');

  const msg = await chatRepo.findMessage(message_id);
  if (!msg || msg.chat_room_id !== room_id) {
    throw new AppError('메시지를 찾을 수 없습니다', 404, 'NOT_FOUND');
  }
  if (msg.sender_id !== uid) {
    // 수신자만 del_by_receiver 처리 가능
    const [rows] = await db.query(
      'SELECT user_a_id, user_b_id FROM ChatRoomTB WHERE chat_room_id = ?', [room_id]
    );
    const room = rows[0];
    const isReceiver = room && (room.user_a_id === uid || room.user_b_id === uid);
    if (!isReceiver) throw new AppError('권한이 없습니다', 403, 'FORBIDDEN');
  }
  await chatRepo.deleteMessage(message_id, msg.sender_id === uid);
};

module.exports = { getRooms, getOrCreateRoom, leaveRoom, getMessages, sendMessage, markRead, deleteMessage };
