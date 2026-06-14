const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userRepo = require('../repositories/user.repository');
const AppError = require('../utils/AppError');

// 프로토타입용 인메모리 OTP 저장소 (재시작 시 초기화됨)
const otpStore = new Map();       // `${email}:${purpose}` → { otp, expiresAt }
const verifyTokenStore = new Map(); // token → { email, purpose, expiresAt }

const SALT_ROUNDS = 12;

const register = async ({ handle_nm, nick_nm, password, email, school_cd, dept_cd }) => {
  if (!handle_nm || !nick_nm || !password || !email || !school_cd || !dept_cd) {
    throw new AppError('필수 필드가 누락되었습니다', 400, 'VALIDATION_ERROR');
  }
  if (await userRepo.hasHandle(handle_nm)) {
    throw new AppError('이미 사용 중인 아이디입니다', 409, 'HANDLE_DUPLICATE');
  }
  if (await userRepo.findContactByValue(email)) {
    throw new AppError('이미 등록된 이메일입니다', 409, 'EMAIL_DUPLICATE');
  }

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const uid = await userRepo.create({ nick_nm, handle_nm, school_cd, dept_cd });
  await userRepo.createAuth(uid, hashed);
  await userRepo.createContact(uid, email, 0, '기본 이메일');

  return { uid, handle_nm, nick_nm };
};

const login = async ({ handle_nm, password, device, location }) => {
  if (!handle_nm || !password || !device) {
    throw new AppError('필수 필드가 누락되었습니다', 400, 'VALIDATION_ERROR');
  }

  const user = await userRepo.findByHandle(handle_nm);
  if (!user) throw new AppError('아이디 또는 비밀번호가 올바르지 않습니다', 401, 'INVALID_CREDENTIALS');
  if (!user.active) throw new AppError('탈퇴한 계정입니다', 403, 'ACCOUNT_INACTIVE');

  const punishments = await userRepo.getActivePunishments(user.uid);
  if (punishments.length > 0) throw new AppError('제재된 계정입니다', 403, 'ACCOUNT_SUSPENDED');

  const auth = await userRepo.findAuthByUid(user.uid);
  if (!auth || !(await bcrypt.compare(password, auth.password))) {
    throw new AppError('아이디 또는 비밀번호가 올바르지 않습니다', 401, 'INVALID_CREDENTIALS');
  }

  await userRepo.upsertDevice(user.uid, device, location);

  const accessToken = jwt.sign(
    { uid: user.uid, permission: user.permission },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  const refreshToken = jwt.sign(
    { uid: user.uid },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '14d' }
  );

  return { accessToken, refreshToken, user };
};

const refresh = async (refreshToken) => {
  if (!refreshToken) throw new AppError('Refresh token이 없습니다', 401, 'UNAUTHORIZED');
  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await userRepo.findById(payload.uid);
    if (!user) throw new AppError('사용자를 찾을 수 없습니다', 401, 'UNAUTHORIZED');
    const accessToken = jwt.sign(
      { uid: user.uid, permission: user.permission },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    return { accessToken };
  } catch (e) {
    if (e.isOperational) throw e;
    throw new AppError('Refresh token이 만료되었습니다', 401, 'REFRESH_TOKEN_EXPIRED');
  }
};

const sendOtp = async (email, purpose) => {
  if (!email || !purpose) throw new AppError('필수 필드가 누락되었습니다', 400, 'VALIDATION_ERROR');

  const key = `${email}:${purpose}`;
  const existing = otpStore.get(key);
  if (existing && existing.expiresAt > Date.now()) {
    throw new AppError('5분 내 재발송이 불가합니다', 429, 'TOO_MANY_REQUESTS');
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  otpStore.set(key, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });

  // TODO: 실제 이메일 발송 (nodemailer 연동 필요)
  console.log(`[OTP] ${email} (${purpose}): ${otp}`);
};

const verifyOtp = async (email, otp, purpose) => {
  if (!email || !otp || !purpose) throw new AppError('필수 필드가 누락되었습니다', 400, 'VALIDATION_ERROR');

  const key = `${email}:${purpose}`;
  const stored = otpStore.get(key);
  if (!stored || stored.expiresAt < Date.now() || stored.otp !== String(otp)) {
    throw new AppError('인증 코드가 올바르지 않거나 만료되었습니다', 400, 'INVALID_OTP');
  }

  otpStore.delete(key);
  const verifyToken = `tmp_verify_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  verifyTokenStore.set(verifyToken, { email, purpose, expiresAt: Date.now() + 10 * 60 * 1000 });
  return { verifyToken };
};

const verifySchool = async (uid, { school_mail, email_verify_token, school_cd, department, school_major_id, grade }) => {
  const stored = verifyTokenStore.get(email_verify_token);
  if (!stored || stored.expiresAt < Date.now() || stored.purpose !== 'school') {
    throw new AppError('유효하지 않은 인증 토큰입니다', 400, 'INVALID_OTP');
  }

  const existing = await userRepo.findUnivByUid(uid);
  if (existing) throw new AppError('이미 인증된 계정입니다', 409, 'ALREADY_VERIFIED');

  await userRepo.createUniv({ uid, school_mail, school_cd, department, school_major_id, grade });
  await userRepo.updatePermission(uid, 3);
  verifyTokenStore.delete(email_verify_token);
};

// NICE API 연동 전 프로토타입용 mock 처리
const verifyIdentity = async (uid, verify_token) => {
  if (!verify_token) throw new AppError('인증 토큰이 없습니다', 400, 'VALIDATION_ERROR');

  const mockCi = `CI_${uid}_${verify_token.slice(0, 8)}`;
  const mockDi = `DI_${uid}_${verify_token.slice(0, 6)}`;

  const existing = await userRepo.findVerifyByCi(mockCi);
  if (existing && existing.uid !== uid) {
    throw new AppError('이미 다른 계정에 등록된 인증 정보입니다', 409, 'IDENTITY_DUPLICATE');
  }

  await userRepo.createVerify({
    uid, verify_user_nm: '미확인', birth: '2000-01-01',
    gendar: 0, nationally: 0, verify_ci: mockCi, verify_di: mockDi,
  });
  const user = await userRepo.findById(uid);
  if (user.permission < 2) await userRepo.updatePermission(uid, 2);
};

module.exports = { register, login, refresh, sendOtp, verifyOtp, verifySchool, verifyIdentity };
