// backend/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * 验证用户是否已登录（JWT Token有效性检查）
 */
const authMiddleware = (req, res, next) => {
  try {
    // 从 header 获取 token
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '未登录，请先登录'
      });
    }

    const token = authHeader.split(' ')[1];

    // 验证 token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 将用户信息附加到请求对象
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

module.exports = authMiddleware;
