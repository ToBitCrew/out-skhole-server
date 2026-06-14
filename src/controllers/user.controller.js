const userService = require('../services/user.service');
const { ok, created } = require('../utils/response');

const getMe = async (req, res, next) => {
  try { ok(res, await userService.getMe(req.user.uid)); } catch (e) { next(e); }
};

const updateMe = async (req, res, next) => {
  try { await userService.updateMe(req.user.uid, req.body); ok(res, {}); } catch (e) { next(e); }
};

const getUser = async (req, res, next) => {
  try { ok(res, await userService.getUser(parseInt(req.params.uid))); } catch (e) { next(e); }
};

const getContacts = async (req, res, next) => {
  try { ok(res, { items: await userService.getContacts(req.user.uid) }); } catch (e) { next(e); }
};

const addContact = async (req, res, next) => {
  try { await userService.addContact(req.user.uid, req.body); created(res, {}); } catch (e) { next(e); }
};

const removeContact = async (req, res, next) => {
  try { await userService.removeContact(req.user.uid, parseInt(req.params.contactId)); ok(res, {}); } catch (e) { next(e); }
};

const deleteMe = async (req, res, next) => {
  try { await userService.deleteMe(req.user.uid); ok(res, {}); } catch (e) { next(e); }
};

module.exports = { getMe, updateMe, getUser, getContacts, addContact, removeContact, deleteMe };
