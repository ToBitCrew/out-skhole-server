const router = require('express').Router();
const ctrl = require('../controllers/school.controller');

/**
 * @swagger
 * tags:
 *   name: Schools
 *   description: 학교 검색 API (인증 불필요)
 */

/**
 * @swagger
 * /schools:
 *   get:
 *     summary: 학교 검색
 *     tags: [Schools]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         example: 서울
 *         description: 학교명 검색어 (미입력 시 전체 조회)
 *     responses:
 *       200:
 *         description: 학교 목록
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
 *                         $ref: '#/components/schemas/School'
 */
router.get('/', ctrl.searchSchools);

/**
 * @swagger
 * /schools/{schoolCd}/departments:
 *   get:
 *     summary: 학과 목록 조회
 *     tags: [Schools]
 *     parameters:
 *       - in: path
 *         name: schoolCd
 *         required: true
 *         schema:
 *           type: string
 *         example: "0000501"
 *         description: 학교 코드
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         example: 컴퓨터
 *         description: 학과명 검색어 (미입력 시 전체 조회)
 *     responses:
 *       200:
 *         description: 학과 목록
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
 *                         $ref: '#/components/schemas/Department'
 */
router.get('/:schoolCd/departments', ctrl.getDepts);

module.exports = router;
