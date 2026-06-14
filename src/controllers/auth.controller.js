const authService = require('../services/auth.service');
const { ok, created } = require('../utils/response');

const register = async (req, res, next) => {
  try {
    created(res, await authService.register(req.body));
  } catch (e) { next(e); }
};

const login = async (req, res, next) => {
  try {
    const { accessToken, refreshToken, user } = await authService.login(req.body);
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 14 * 24 * 60 * 60 * 1000,
      sameSite: 'strict',
    });
    ok(res, {
      accessToken,
      user: {
        uid: user.uid,
        nick_nm: user.nick_nm,
        handle_nm: user.handle_nm,
        profile_img: user.profile_img,
        permission: user.permission,
      },
    });
  } catch (e) { next(e); }
};

const logout = (req, res) => {
  res.clearCookie('refreshToken');
  res.json({ success: true });
};

const refresh = async (req, res, next) => {
  try {
    ok(res, await authService.refresh(req.cookies?.refreshToken));
  } catch (e) { next(e); }
};

const sendOtp = async (req, res, next) => {
  try {
    await authService.sendOtp(req.body.email, req.body.purpose);
    ok(res, { message: '인증 코드가 발송되었습니다' });
  } catch (e) { next(e); }
};

const verifyOtp = async (req, res, next) => {
  try {
    ok(res, await authService.verifyOtp(req.body.email, req.body.otp, req.body.purpose));
  } catch (e) { next(e); }
};

const verifySchool = async (req, res, next) => {
  try {
    await authService.verifySchool(req.user.uid, req.body);
    ok(res, { message: '학교 인증이 완료되었습니다' });
  } catch (e) { next(e); }
};

const verifyIdentity = async (req, res, next) => {
  try {
    await authService.verifyIdentity(req.user.uid, req.body.verify_token);
    ok(res, { message: '본인 인증이 완료되었습니다' });
  } catch (e) { next(e); }
};

module.exports = { register, login, logout, refresh, sendOtp, verifyOtp, verifySchool, verifyIdentity };
