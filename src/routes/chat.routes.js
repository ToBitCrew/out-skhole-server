const router = require('express').Router();
const ctrl = require('../controllers/chat.controller');
const { authenticate } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Chats
 *   description: 채팅 관련 API (전체 인증 필요)
 */

router.use(authenticate);

/**
 * @swagger
 * /chats:
 *   get:
 *     summary: 채팅방 목록 조회
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 내가 참여 중인 채팅방 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ChatRoom'
 *       401:
 *         description: 인증 토큰 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', ctrl.getRooms);

/**
 * @swagger
 * /chats:
 *   post:
 *     summary: 채팅방 생성 또는 조회
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     description: 상대방과의 채팅방이 이미 있으면 기존 방을 반환(200), 없으면 새로 생성(201)합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [partner_uid]
 *             properties:
 *               partner_uid:
 *                 type: integer
 *                 example: 2
 *                 description: 대화 상대방의 uid
 *     responses:
 *       200:
 *         description: 기존 채팅방 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     chat_room_id: { type: integer, example: 1 }
 *       201:
 *         description: 새 채팅방 생성
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     chat_room_id: { type: integer, example: 5 }
 *       401:
 *         description: 인증 토큰 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', ctrl.createRoom);

/**
 * @swagger
 * /chats/{roomId}:
 *   delete:
 *     summary: 채팅방 나가기
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: 채팅방 나가기 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:   { type: object }
 *       401:
 *         description: 인증 토큰 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:roomId', ctrl.leaveRoom);

/**
 * @swagger
 * /chats/{roomId}/messages:
 *   get:
 *     summary: 채팅 메시지 목록 조회
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: query
 *         name: before
 *         schema:
 *           type: integer
 *         description: 이 chat_msg_id 이전 메시지 조회 (커서 페이지네이션)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 30
 *         description: 최대 조회 개수
 *     responses:
 *       200:
 *         description: 메시지 목록 (최신순)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Message'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: 인증 토큰 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:roomId/messages', ctrl.getMessages);

/**
 * @swagger
 * /chats/{roomId}/messages:
 *   post:
 *     summary: 메시지 전송
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *                 example: 안녕하세요!
 *               msg_type:
 *                 type: integer
 *                 default: 0
 *                 example: 0
 *                 description: "0: 텍스트, 1: 이미지"
 *     responses:
 *       201:
 *         description: 메시지 전송 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/Message'
 *       401:
 *         description: 인증 토큰 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:roomId/messages', ctrl.sendMessage);

/**
 * @swagger
 * /chats/{roomId}/messages/read:
 *   patch:
 *     summary: 메시지 읽음 처리
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: 읽음 처리 성공 (해당 방의 미읽음 메시지 전체 읽음 처리)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:   { type: object }
 *       401:
 *         description: 인증 토큰 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/:roomId/messages/read', ctrl.markRead);

/**
 * @swagger
 * /chats/{roomId}/messages/{messageId}:
 *   delete:
 *     summary: 메시지 삭제
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 10
 *     responses:
 *       200:
 *         description: 메시지 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:   { type: object }
 *       401:
 *         description: 인증 토큰 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: 권한 없음 (본인 메시지만 삭제 가능)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:roomId/messages/:messageId', ctrl.deleteMessage);

module.exports = router;
