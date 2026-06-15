const router = require('express').Router();
const ctrl = require('../controllers/post.controller');
const { authenticate } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Posts
 *   description: 게시글 관련 API (전체 인증 필요)
 */

router.use(authenticate);

/**
 * @swagger
 * /posts/search:
 *   get:
 *     summary: 게시글 검색
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         example: 스터디
 *         description: 검색어 (제목+본문)
 *       - in: query
 *         name: post_type
 *         schema:
 *           type: integer
 *         description: "게시글 유형 필터 (0: 관리자, 1: 공지, 2: 일반, 3: 질문, 4: 마켓)"
 *       - in: query
 *         name: major_cat_cd
 *         schema:
 *           type: string
 *         description: 상위 카테고리 코드 필터
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 50
 *     responses:
 *       200:
 *         description: 검색 결과
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
 *                         $ref: '#/components/schemas/PostListItem'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       400:
 *         description: 검색어 누락
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: 인증 토큰 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/search', ctrl.search);

/**
 * @swagger
 * /posts/tags/autocomplete:
 *   get:
 *     summary: 태그 자동완성
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         example: 스터
 *         description: 태그 검색어
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 최대 반환 개수
 *     responses:
 *       200:
 *         description: 자동완성 태그 목록
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
 *                         type: string
 *                       example: ["스터디", "스터디모집"]
 *       400:
 *         description: 검색어 누락
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: 인증 토큰 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/tags/autocomplete', ctrl.tagAutocomplete);

/**
 * @swagger
 * /posts:
 *   get:
 *     summary: 게시글 목록 조회
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: post_type
 *         schema:
 *           type: integer
 *         description: "게시글 유형 (0: 관리자, 1: 공지, 2: 일반, 3: 질문, 4: 마켓)"
 *       - in: query
 *         name: sub_cat_cd
 *         schema:
 *           type: integer
 *         description: 하위 카테고리 ID 필터
 *       - in: query
 *         name: school_cd
 *         schema:
 *           type: string
 *         description: 학교 코드 필터
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 50
 *     responses:
 *       200:
 *         description: 게시글 목록
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
 *                         $ref: '#/components/schemas/PostListItem'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: 인증 토큰 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', ctrl.getList);

/**
 * @swagger
 * /posts:
 *   post:
 *     summary: 게시글 작성
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [post_title, post_content, post_type]
 *             properties:
 *               post_title:
 *                 type: string
 *                 example: 스터디 모집합니다
 *               post_content:
 *                 type: string
 *                 example: 알고리즘 스터디 모집합니다. 주 2회 진행 예정입니다.
 *               post_type:
 *                 type: integer
 *                 example: 2
 *                 description: "0: 관리자, 1: 공지, 2: 일반, 3: 질문, 4: 마켓"
 *               post_status:
 *                 type: integer
 *                 example: 1
 *                 default: 1
 *               sub_cat_cd:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2]
 *                 description: 하위 카테고리 ID 배열 (최대 5개)
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["스터디", "알고리즘"]
 *                 description: 태그 배열 (최대 5개)
 *               question:
 *                 type: object
 *                 description: post_type=3 (질문) 일 때만 사용
 *                 properties:
 *                   pii_mask: { type: boolean, example: false }
 *               sale:
 *                 type: object
 *                 description: post_type=4 (중고거래) 일 때만 사용
 *                 properties:
 *                   item_nm:     { type: string,  example: 아이폰 14 }
 *                   item_type:   { type: integer, example: 1 }
 *                   item_status: { type: integer, example: 1 }
 *                   price:       { type: integer, example: 500000 }
 *           examples:
 *             관리자:
 *               summary: "post_type 0 - 관리자 게시글"
 *               value:
 *                 post_title: "[공지] 서비스 이용약관 변경 안내"
 *                 post_content: "안녕하세요. 서비스 이용약관이 2026년 7월 1일부로 변경됩니다. 자세한 내용은 본문을 확인해 주세요."
 *                 post_type: 0
 *                 post_status: 1
 *                 tags: ["공지", "약관"]
 *             공지:
 *               summary: "post_type 1 - 공지 게시글"
 *               value:
 *                 post_title: "2026년 1학기 수강신청 안내"
 *                 post_content: "수강신청 일정 및 방법을 안내드립니다. 기간 내에 신청하시기 바랍니다."
 *                 post_type: 1
 *                 post_status: 1
 *                 sub_cat_cd: [1]
 *                 tags: ["수강신청", "학사일정"]
 *             일반:
 *               summary: "post_type 2 - 일반 게시글"
 *               value:
 *                 post_title: "스터디 모집합니다"
 *                 post_content: "알고리즘 스터디 모집합니다. 주 2회 진행 예정입니다."
 *                 post_type: 2
 *                 post_status: 1
 *                 sub_cat_cd: [1, 2]
 *                 tags: ["스터디", "알고리즘"]
 *             질문:
 *               summary: "post_type 3 - 질문 게시글"
 *               value:
 *                 post_title: "교수님께 이메일 어떻게 쓰나요?"
 *                 post_content: "과제 제출 기한 연장 요청 이메일을 처음 써보는데 어떻게 써야 할지 모르겠어요."
 *                 post_type: 3
 *                 post_status: 1
 *                 tags: ["질문", "이메일"]
 *                 question:
 *                   pii_mask: false
 *             마켓:
 *               summary: "post_type 4 - 마켓 게시글"
 *               value:
 *                 post_title: "아이폰 14 팔아요 (급처)"
 *                 post_content: "사용감 거의 없고 케이스 끼워서 사용했습니다. 직거래 선호합니다."
 *                 post_type: 4
 *                 post_status: 1
 *                 tags: ["아이폰", "급처"]
 *                 sale:
 *                   item_nm: 아이폰 14
 *                   item_type: 1
 *                   item_status: 1
 *                   price: 500000
 *     responses:
 *       201:
 *         description: 게시글 작성 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     post_id: { type: integer, example: 1 }
 *       400:
 *         description: 필수 필드 누락
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: 인증 토큰 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', ctrl.createPost);

/**
 * @swagger
 * /posts/{postId}:
 *   get:
 *     summary: 게시글 단건 조회
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: 게시글 상세 정보
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/PostDetail'
 *       401:
 *         description: 인증 토큰 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: 게시글을 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:postId', ctrl.getPost);

/**
 * @swagger
 * /posts/{postId}:
 *   patch:
 *     summary: 게시글 수정
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
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
 *             properties:
 *               post_title:
 *                 type: string
 *                 example: 수정된 제목
 *               post_content:
 *                 type: string
 *                 example: 수정된 본문
 *               post_status:
 *                 type: integer
 *                 example: 1
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["수정태그"]
 *               sale:
 *                 type: object
 *                 description: 중고거래 게시글에서만 사용
 *                 properties:
 *                   price:  { type: integer, example: 450000 }
 *                   sold:   { type: boolean, example: true }
 *     responses:
 *       200:
 *         description: 수정 성공
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
 *         description: 권한 없음 (작성자 본인만 가능)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: 게시글을 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/:postId', ctrl.updatePost);

/**
 * @swagger
 * /posts/{postId}:
 *   delete:
 *     summary: 게시글 삭제
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: 삭제 성공 (소프트 삭제)
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
 *         description: 권한 없음 (작성자 또는 관리자만 가능)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: 게시글을 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:postId', ctrl.deletePost);

/**
 * @swagger
 * /posts/{postId}/assets:
 *   post:
 *     summary: 게시글 파일 에셋 추가
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     description: 프로토타입 단계에서는 URL을 body에서 직접 수신 (추후 multer + S3 연동 예정)
 *     parameters:
 *       - in: path
 *         name: postId
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
 *             properties:
 *               url:
 *                 type: string
 *                 example: https://cdn.example.com/upload/file.jpg
 *     responses:
 *       201:
 *         description: 에셋 추가 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       post_asset_id:  { type: integer, example: 1 }
 *                       post_asset_url: { type: string, example: "https://cdn.example.com/file.jpg" }
 *       401:
 *         description: 인증 토큰 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: 권한 없음 (작성자 본인만 가능)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: 게시글을 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:postId/assets', ctrl.addAsset);

/**
 * @swagger
 * /posts/{postId}/like:
 *   post:
 *     summary: 게시글 좋아요
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: 좋아요 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     like_cnt: { type: integer, example: 6 }
 *       401:
 *         description: 인증 토큰 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: 게시글을 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: 이미 좋아요한 게시글
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:postId/like', ctrl.likePost);

/**
 * @swagger
 * /posts/{postId}/like:
 *   delete:
 *     summary: 게시글 좋아요 취소
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: 좋아요 취소 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     like_cnt: { type: integer, example: 5 }
 *       401:
 *         description: 인증 토큰 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: 게시글을 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:postId/like', ctrl.unlikePost);

/**
 * @swagger
 * /posts/{postId}/bookmark:
 *   post:
 *     summary: 게시글 북마크
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: 북마크 성공
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
 *       404:
 *         description: 게시글을 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: 이미 북마크한 게시글
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:postId/bookmark', ctrl.bookmarkPost);

/**
 * @swagger
 * /posts/{postId}/bookmark:
 *   delete:
 *     summary: 게시글 북마크 취소
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: 북마크 취소 성공
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
router.delete('/:postId/bookmark', ctrl.unbookmarkPost);

/**
 * @swagger
 * /posts/{postId}/comments:
 *   get:
 *     summary: 댓글 목록 조회
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: 댓글 목록
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
 *                         $ref: '#/components/schemas/Comment'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: 인증 토큰 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:postId/comments', ctrl.getComments);

/**
 * @swagger
 * /posts/{postId}/comments:
 *   post:
 *     summary: 댓글 작성
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
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
 *             required: [post_content]
 *             properties:
 *               post_content:
 *                 type: string
 *                 example: 댓글 내용입니다.
 *               parent_post_id:
 *                 type: integer
 *                 nullable: true
 *                 example: null
 *                 description: 대댓글인 경우 부모 댓글의 post_id
 *     responses:
 *       201:
 *         description: 댓글 작성 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     post_id: { type: integer, example: 10 }
 *       400:
 *         description: 댓글 내용 누락
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: 인증 토큰 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: 게시글을 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:postId/comments', ctrl.createComment);

/**
 * @swagger
 * /posts/{postId}/comments/{commentId}:
 *   delete:
 *     summary: 댓글 삭제
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 10
 *     responses:
 *       200:
 *         description: 댓글 삭제 성공 (소프트 삭제)
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
 *         description: 권한 없음 (작성자 또는 관리자만 가능)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: 댓글을 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:postId/comments/:commentId', ctrl.deleteComment);

module.exports = router;
