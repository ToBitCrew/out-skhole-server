const userRepo = require('../repositories/user.repository');
const AppError = require('../utils/AppError');

const getMe = async (uid) => {
  const user = await userRepo.findWithSchoolInfo(uid);
  if (!user) throw new AppError('사용자를 찾을 수 없습니다', 404, 'NOT_FOUND');
  const [univ, verify] = await Promise.all([
    userRepo.findUnivByUid(uid),
    userRepo.findVerifyByUid(uid),
  ]);
  return {
    uid: user.uid,
    nick_nm: user.nick_nm,
    handle_nm: user.handle_nm,
    profile_img: user.profile_img,
    profile_banner: user.profile_banner,
    permission: user.permission,
    school_cd: user.school_cd,
    school_nm: user.school_nm,
    dept_cd: user.dept_cd,
    dept_nm: user.dept_nm,
    is_univ_verified: !!univ,
    is_identity_verified: !!verify,
    active: !!user.active,
  };
};

const updateMe = async (uid, { nick_nm, profile_img, profile_banner }) => {
  const fields = {};
  if (nick_nm !== undefined) {
    if (await userRepo.hasNickname(nick_nm, uid)) {
      throw new AppError('이미 사용 중인 닉네임입니다', 409, 'NICK_DUPLICATE');
    }
    fields.nick_nm = nick_nm;
  }
  if (profile_img !== undefined) fields.profile_img = profile_img;
  if (profile_banner !== undefined) fields.profile_banner = profile_banner;
  await userRepo.updateProfile(uid, fields);
};

const getUser = async (uid) => {
  const user = await userRepo.findWithSchoolInfo(uid);
  if (!user || !user.active) throw new AppError('사용자를 찾을 수 없습니다', 404, 'NOT_FOUND');
  return {
    uid: user.uid,
    nick_nm: user.nick_nm,
    handle_nm: user.handle_nm,
    profile_img: user.profile_img,
    profile_banner: user.profile_banner,
    school_nm: user.school_nm,
    dept_nm: user.dept_nm,
    permission: user.permission,
  };
};

const getContacts = async (uid) => userRepo.getContactsByUid(uid);

const addContact = async (uid, { contact, contact_type, contact_nm }) => {
  if (!contact || contact_type == null || !contact_nm) {
    throw new AppError('필수 필드가 누락되었습니다', 400, 'VALIDATION_ERROR');
  }
  const existing = await userRepo.findContactByValue(contact);
  if (existing) throw new AppError('이미 등록된 연락처입니다', 409, 'CONTACT_DUPLICATE');
  return userRepo.createContact(uid, contact, contact_type, contact_nm);
};

const removeContact = async (uid, contact_id) => {
  const affected = await userRepo.deleteContact(contact_id, uid);
  if (!affected) throw new AppError('연락처를 찾을 수 없습니다', 404, 'NOT_FOUND');
};

const deleteMe = async (uid) => userRepo.deactivate(uid);

module.exports = { getMe, updateMe, getUser, getContacts, addContact, removeContact, deleteMe };
