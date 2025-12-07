// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

/**
 * 生成 JWT Token
 */
const generateToken = (user) => {
  return jwt.sign(
    { 
      userId: user.id, 
      username: user.username, 
      roleId: user.role_id,
      roleCode: user.role_code 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

/**
 * 认证中间件 - 验证用户是否已登录
 */
const authMiddleware = async (req, res, next) => {
  try {
    // 从 Header 获取 Token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌',
        code: 'UNAUTHORIZED'
      });
    }

    const token = authHeader.substring(7);
    
    // 验证 Token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: '登录已过期，请重新登录',
          code: 'TOKEN_EXPIRED'
        });
      }
      return res.status(401).json({
        success: false,
        message: '无效的认证令牌',
        code: 'INVALID_TOKEN'
      });
    }

    // 查询用户信息（确保用户仍然有效）
    const users = await query(
      `SELECT u.id, u.username, u.real_name, u.status, u.role_id, r.role_code, r.role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: '用户不存在',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = users[0];
    
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: '账号已被禁用',
        code: 'ACCOUNT_DISABLED'
      });
    }

    // 将用户信息附加到请求对象
    req.user = {
      id: user.id,
      username: user.username,
      realName: user.real_name,
      roleId: user.role_id,
      roleCode: user.role_code,
      roleName: user.role_name
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: '认证服务异常',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * 获取用户权限列表
 */
const getUserPermissions = async (roleId) => {
  const permissions = await query(
    `SELECT p.perm_code 
     FROM role_permissions rp
     JOIN permissions p ON rp.permission_id = p.id
     WHERE rp.role_id = ?`,
    [roleId]
  );
  return permissions.map(p => p.perm_code);
};

module.exports = { 
  generateToken, 
  authMiddleware, 
  getUserPermissions,
  JWT_SECRET 
};
