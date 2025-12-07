// backend/controllers/userController.js
const bcrypt = require('bcryptjs');
const db = require('../config/db');

/**
 * 获取用户列表
 * GET /api/users
 */
const getUsers = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, keyword = '', roleId = '' } = req.query;
    const offset = (page - 1) * pageSize;

    // 构建查询条件
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (keyword) {
      whereClause += ' AND (u.username LIKE ? OR u.real_name LIKE ? OR u.email LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    if (roleId) {
      whereClause += ' AND u.role_id = ?';
      params.push(roleId);
    }

    // 查询总数
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM users u ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // 查询用户列表
    const [users] = await db.query(`
      SELECT u.id, u.username, u.real_name, u.email, u.phone, 
             u.is_active, u.last_login, u.created_at,
             r.id as role_id, r.role_code, r.role_name
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(pageSize), offset]);

    res.json({
      success: true,
      data: {
        list: users.map(u => ({
          id: u.id,
          username: u.username,
          realName: u.real_name,
          email: u.email,
          phone: u.phone,
          isActive: u.is_active,
          lastLogin: u.last_login,
          createdAt: u.created_at,
          roleId: u.role_id,
          role: u.role_code,
          roleName: u.role_name
        })),
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    });

  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

/**
 * 创建用户
 * POST /api/users
 */
const createUser = async (req, res) => {
  try {
    const { username, password, realName, email, phone, roleId } = req.body;

    // 验证必填字段
    if (!username || !password || !roleId) {
      return res.status(400).json({
        success: false,
        message: '用户名、密码和角色不能为空'
      });
    }

    // 检查用户名是否已存在
    const [existing] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: '用户名已存在'
      });
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(password, 10);

    // 创建用户
    const [result] = await db.query(`
      INSERT INTO users (username, password_hash, real_name, email, phone, role_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [username, passwordHash, realName, email, phone, roleId]);

    res.status(201).json({
      success: true,
      message: '用户创建成功',
      data: { id: result.insertId }
    });

  } catch (error) {
    console.error('创建用户错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

/**
 * 更新用户
 * PUT /api/users/:id
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { realName, email, phone, roleId, isActive } = req.body;

    // 检查用户是否存在
    const [existing] = await db.query('SELECT id FROM users WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 更新用户
    await db.query(`
      UPDATE users 
      SET real_name = ?, email = ?, phone = ?, role_id = ?, is_active = ?
      WHERE id = ?
    `, [realName, email, phone, roleId, isActive, id]);

    res.json({
      success: true,
      message: '用户更新成功'
    });

  } catch (error) {
    console.error('更新用户错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

/**
 * 重置用户密码
 * POST /api/users/:id/reset-password
 */
const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: '新密码不能为空且长度不能少于6位'
      });
    }

    // 检查用户是否存在
    const [existing] = await db.query('SELECT id FROM users WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 加密新密码
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, id]);

    res.json({
      success: true,
      message: '密码重置成功'
    });

  } catch (error) {
    console.error('重置密码错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

/**
 * 删除用户
 * DELETE /api/users/:id
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // 不允许删除自己
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: '不能删除自己的账号'
      });
    }

    // 检查用户是否存在
    const [existing] = await db.query('SELECT id FROM users WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 软删除：禁用账号
    await db.query('UPDATE users SET is_active = FALSE WHERE id = ?', [id]);

    res.json({
      success: true,
      message: '用户已禁用'
    });

  } catch (error) {
    console.error('删除用户错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

/**
 * 获取角色列表
 * GET /api/roles
 */
const getRoles = async (req, res) => {
  try {
    const [roles] = await db.query('SELECT * FROM roles ORDER BY id');

    res.json({
      success: true,
      data: roles.map(r => ({
        id: r.id,
        code: r.role_code,
        name: r.role_name,
        description: r.description
      }))
    });

  } catch (error) {
    console.error('获取角色列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  resetPassword,
  deleteUser,
  getRoles
};
