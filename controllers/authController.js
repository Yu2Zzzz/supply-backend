// src/controllers/authController.js
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { generateToken, getUserPermissions } = require('../middlewares/authMiddleware');

/**
 * 用户登录
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '请输入用户名和密码'
      });
    }

    // 查询用户
    const users = await query(
      `SELECT u.*, r.role_code, r.role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.username = ?`,
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    const user = users[0];

    // 检查账号状态
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: '账号已被禁用，请联系管理员'
      });
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 更新最后登录时间
    await query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [user.id]);

    // 获取用户权限
    const permissions = await getUserPermissions(user.role_id);

    // 生成 Token
    const token = generateToken(user);

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          realName: user.real_name,
          email: user.email,
          role: {
            id: user.role_id,
            code: user.role_code,
            name: user.role_name
          },
          permissions
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: '登录失败，请稍后重试'
    });
  }
};

/**
 * 获取当前用户信息
 * GET /api/auth/me
 */
const getCurrentUser = async (req, res) => {
  try {
    const permissions = await getUserPermissions(req.user.roleId);
    
    res.json({
      success: true,
      data: {
        ...req.user,
        permissions
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    });
  }
};

/**
 * 修改密码
 * POST /api/auth/change-password
 */
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: '请输入旧密码和新密码'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: '新密码长度不能少于6位'
      });
    }

    // 查询当前密码
    const users = await query('SELECT password_hash FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 验证旧密码
    const isOldPasswordValid = await bcrypt.compare(oldPassword, users[0].password_hash);
    if (!isOldPasswordValid) {
      return res.status(400).json({
        success: false,
        message: '旧密码错误'
      });
    }

    // 加密新密码并更新
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password_hash = ? WHERE id = ?', [newPasswordHash, userId]);

    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: '密码修改失败'
    });
  }
};

module.exports = {
  login,
  getCurrentUser,
  changePassword
};
