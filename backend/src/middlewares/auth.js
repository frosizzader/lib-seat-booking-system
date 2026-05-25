const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const { User } = require('../models');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
      return res.status(401).json({ code: 401, message: '未提供认证令牌', data: null });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, jwtConfig.secret);
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(401).json({ code: 401, message: '用户不存在', data: null });
    }
    if (user.status === 'banned') {
      return res.status(403).json({ code: 403, message: '账户已被禁用', data: null });
    }
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ code: 401, message: '令牌已过期', data: null });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ code: 401, message: '无效的令牌', data: null });
    }
    return res.status(401).json({ code: 401, message: '认证失败', data: null });
  }
};

module.exports = auth;