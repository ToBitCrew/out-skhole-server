const router = require('express').Router();
const ctrl = require('../controllers/category.controller');

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: 카테고리 조회 API (인증 불필요)
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: 카테고리 트리 전체 조회
 *     tags: [Categories]
 *     description: 상위·하위 카테고리 전체를 트리 구조로 반환합니다.
 *     responses:
 *       200:
 *         description: 카테고리 트리
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       major_cat_cd:
 *                         type: string
 *                         example: "01"
 *                       cat_major_nm:
 *                         type: string
 *                         example: 학습
 *                       children:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             sub_cat_cd:  { type: integer, example: 1 }
 *                             sub_cat_nm:  { type: string,  example: 스터디모집 }
 */
router.get('/', ctrl.getTree);

module.exports = router;
