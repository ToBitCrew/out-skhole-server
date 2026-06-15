const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: 인증 관련 API
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: 회원가입
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [handle_nm, nick_nm, password, email, school_cd, dept_cd]
 *             properties:
 *               handle_nm:
 *                 type: string
 *                 example: honggildong
 *                 description: 로그인에 사용하는 고유 아이디
 *               nick_nm:
 *                 type: string
 *                 example: 홍길동
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123!
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               school_cd:
 *                 type: string
 *                 example: "7010417"
 *               dept_cd:
 *                 type: string
 *                 example: "001"
 *     responses:
 *       201:
 *         description: 회원가입 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     uid:       { type: integer, example: 1 }
 *                     handle_nm: { type: string,  example: honggildong }
 *                     nick_nm:   { type: string,  example: 홍길동 }
 *       400:
 *         description: 필수 필드 누락
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: 중복된 아이디 또는 이메일
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', ctrl.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: 로그인
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [contact, password, device]
 *             properties:
 *               contact:
 *                 type: string
 *                 example: user@example.com
 *                 description: 로그인에 사용하는 이메일(type 0) 또는 전화번호(type 1)
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123!
 *               device:
 *                 type: string
 *                 example: iPhone 15
 *                 description: 접속 기기 정보
 *               location:
 *                 type: string
 *                 example: Seoul
 *                 description: 접속 위치 (선택)
 *     responses:
 *       200:
 *         description: 로그인 성공 (refreshToken은 httpOnly 쿠키로 설정됨)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                     user:
 *                       type: object
 *                       properties:
 *                         uid:         { type: integer, example: 1 }
 *                         nick_nm:     { type: string,  example: 홍길동 }
 *                         handle_nm:   { type: string,  example: honggildong }
 *                         profile_img: { type: string,  nullable: true }
 *                         permission:  { type: integer, example: 3 }
 *       400:
 *         description: 필수 필드 누락
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: 아이디 또는 비밀번호 불일치
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: 탈퇴 또는 제재된 계정
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', ctrl.login);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: 로그아웃
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 로그아웃 성공 (refreshToken 쿠키 삭제됨)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *       401:
 *         description: 인증 토큰 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/logout', authenticate, ctrl.logout);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: 액세스 토큰 재발급
 *     tags: [Auth]
 *     description: httpOnly 쿠키의 refreshToken을 이용해 새 accessToken을 발급합니다.
 *     responses:
 *       200:
 *         description: 토큰 재발급 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       401:
 *         description: refreshToken 없음 또는 만료
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/refresh', ctrl.refresh);

/**
 * @swagger
 * /auth/otp/send:
 *   post:
 *     summary: OTP 인증 코드 발송
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, purpose]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@university.ac.kr
 *               purpose:
 *                 type: string
 *                 example: school
 *                 description: "인증 목적 (예: school, register)"
 *     responses:
 *       200:
 *         description: 인증 코드 발송 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     message: { type: string, example: 인증 코드가 발송되었습니다 }
 *       400:
 *         description: 필수 필드 누락
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: 5분 내 재발송 불가
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/otp/send', ctrl.sendOtp);

/**
 * @swagger
 * /auth/otp/verify:
 *   post:
 *     summary: OTP 인증 코드 검증
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp, purpose]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@university.ac.kr
 *               otp:
 *                 type: string
 *                 example: "123456"
 *               purpose:
 *                 type: string
 *                 example: school
 *     responses:
 *       200:
 *         description: 검증 성공, 10분 유효한 verifyToken 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     verifyToken:
 *                       type: string
 *                       example: tmp_verify_1717849200000_abc123
 *       400:
 *         description: 인증 코드 불일치 또는 만료
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/otp/verify', ctrl.verifyOtp);

/**
 * @swagger
 * /auth/school/verify:
 *   post:
 *     summary: 학교 이메일 인증 (재학생 인증)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [school_mail, email_verify_token, school_cd, department, school_major_id, grade]
 *             properties:
 *               school_mail:
 *                 type: string
 *                 format: email
 *                 example: student@snu.ac.kr
 *               email_verify_token:
 *                 type: string
 *                 example: tmp_verify_1717849200000_abc123
 *                 description: /auth/otp/verify 에서 발급된 verifyToken
 *               school_cd:
 *                 type: string
 *                 example: "7010417"
 *               department:
 *                 type: string
 *                 example: 컴퓨터공학부
 *               school_major_id:
 *                 type: integer
 *                 example: 1
 *               grade:
 *                 type: integer
 *                 example: 3
 *     responses:
 *       200:
 *         description: 학교 인증 완료 (permission 3으로 상승)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     message: { type: string, example: 학교 인증이 완료되었습니다 }
 *       400:
 *         description: 유효하지 않은 인증 토큰
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
 *       409:
 *         description: 이미 인증된 계정
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/school/verify', authenticate, ctrl.verifySchool);

/**
 * @swagger
 * /auth/identity/verify:
 *   post:
 *     summary: 본인 인증 (NICE API 연동 전 mock 처리)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [verify_token]
 *             properties:
 *               verify_token:
 *                 type: string
 *                 example: nice_verify_token_example
 *                 description: NICE 본인인증 후 받은 토큰
 *     responses:
 *       200:
 *         description: 본인 인증 완료 (permission 최소 2로 상승)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     message: { type: string, example: 본인 인증이 완료되었습니다 }
 *       400:
 *         description: 인증 토큰 없음
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
 *       409:
 *         description: 다른 계정에 이미 등록된 인증 정보
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/identity/verify', authenticate, ctrl.verifyIdentity);

module.exports = router;
