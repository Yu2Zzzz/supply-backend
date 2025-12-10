// backend/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * 认证中间件：
 * - 检查 Authorization: Bearer xxx
 * - 校验 JWT
 * - 把用户信息挂在 req.user 上
 */
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '未登录，请先登录'
      });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
      roleId: decoded.roleId
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token已过期，请重新登录'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Token无效，请重新登录'
    });
  }
};

/**
 * 生成 JWT Token：在 login 成功后调用
 */
const generateToken = (user) => {
  const payload = {
    id: user.id,
    username: user.username,
    role: user.role_code || user.role || null,   // 来自联表 roles 的 role_code
    roleId: user.role_id || user.roleId || null  // users 表里的 role_id
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};

// 为了兼容你现有所有用法：
//
// 1) const authMiddleware = require('../middlewares/authMiddleware')
// 2) const { authMiddleware } = require('../middlewares/authMiddleware')
// 3) const { generateToken } = require('../middlewares/authMiddleware')
authMiddleware.generateToken = generateToken;

module.exports = authMiddleware;
module.exports.authMiddleware = authMiddleware;
module.exports.generateToken = generateToken;
