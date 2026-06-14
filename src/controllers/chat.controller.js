const chatService = require('../services/chat.service');
const { ok, created } = require('../utils/response');

const getRooms = async (req, res, next) => {
  try { ok(res, { items: await chatService.getRooms(req.user.uid) }); } catch (e) { next(e); }
};

const createRoom = async (req, res, next) => {
  try {
    const { chat_room_id, created: isNew } = await chatService.getOrCreateRoom(
      req.user.uid,
      req.body.partner_uid
    );
    res.status(isNew ? 201 : 200).json({ success: true, data: { chat_room_id } });
  } catch (e) { next(e); }
};

const leaveRoom = async (req, res, next) => {
  try { await chatService.leaveRoom(req.user.uid, parseInt(req.params.roomId)); ok(res, {}); } catch (e) { next(e); }
};

const getMessages = async (req, res, next) => {
  try {
    ok(res, await chatService.getMessages(req.user.uid, parseInt(req.params.roomId), req.query));
  } catch (e) { next(e); }
};

const sendMessage = async (req, res, next) => {
  try {
    created(res, await chatService.sendMessage(req.user.uid, parseInt(req.params.roomId), req.body));
  } catch (e) { next(e); }
};

const markRead = async (req, res, next) => {
  try { await chatService.markRead(req.user.uid, parseInt(req.params.roomId)); ok(res, {}); } catch (e) { next(e); }
};

const deleteMessage = async (req, res, next) => {
  try {
    await chatService.deleteMessage(
      req.user.uid,
      parseInt(req.params.roomId),
      parseInt(req.params.messageId)
    );
    ok(res, {});
  } catch (e) { next(e); }
};

module.exports = { getRooms, createRoom, leaveRoom, getMessages, sendMessage, markRead, deleteMessage };
