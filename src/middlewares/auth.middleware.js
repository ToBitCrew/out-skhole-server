const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

const authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new AppError('토큰이 필요합니다', 401, 'UNAUTHORIZED'));
  }
  const token = header.slice(7);
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    next(new AppError('토큰이 만료되었거나 유효하지 않습니다', 401, 'UNAUTHORIZED'));
  }
};

module.exports = { authenticate };
