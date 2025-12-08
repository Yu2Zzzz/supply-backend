// backend/controllers/userController.js - 修复版
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

    // ✅ 修复：添加 is_deleted 过滤条件
    let whereClause = 'WHERE (u.is_deleted = 0 OR u.is_deleted IS NULL)';
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
             u.is_active, u.is_deleted, u.last_login, u.created_at,
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
          isDeleted: u.is_deleted,  // ✅ 返回删除状态
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

    // 检查用户名是否已存在（包括已删除的）
    const [existing] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: '用户名已存在'
      });
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(password, 10);

    // ✅ 创建用户时设置 is_deleted = 0
    const [result] = await db.query(`
      INSERT INTO users (username, password_hash, real_name, email, phone, role_id, is_deleted)
      VALUES (?, ?, ?, ?, ?, ?, 0)
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
    const { realName, email, phone, roleId, isActive, is_active, isDeleted, is_deleted } = req.body;

    // 检查用户是否存在
    const [existing] = await db.query('SELECT id FROM users WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // ✅ 修复：支持更新 is_deleted 字段（用于软删除）
    const finalIsActive = isActive !== undefined ? isActive : is_active;
    const finalIsDeleted = isDeleted !== undefined ? isDeleted : is_deleted;

    // 构建更新语句
    const updates = [];
    const values = [];

    if (realName !== undefined) {
      updates.push('real_name = ?');
      values.push(realName);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone);
    }
    if (roleId !== undefined) {
      updates.push('role_id = ?');
      values.push(roleId);
    }
    if (finalIsActive !== undefined) {
      updates.push('is_active = ?');
      values.push(finalIsActive ? 1 : 0);
    }
    
    // ✅ 支持软删除标记
    if (finalIsDeleted !== undefined) {
      updates.push('is_deleted = ?');
      values.push(finalIsDeleted ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有要更新的字段'
      });
    }

    values.push(id);

    await db.query(`
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = ?
    `, values);

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
 * 删除用户（软删除）
 * DELETE /api/users/:id
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🗑️ 删除用户请求 ID:', id);

    // 不允许删除自己
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: '不能删除自己的账号'
      });
    }

    // 检查用户是否存在
    const [existing] = await db.query(
      'SELECT id, username FROM users WHERE id = ? AND (is_deleted = 0 OR is_deleted IS NULL)', 
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在或已被删除'
      });
    }

    // ✅ 软删除：标记为已删除
    const [result] = await db.query(`
      UPDATE users 
      SET is_deleted = 1, is_active = 0
      WHERE id = ?
    `, [id]);

    console.log('📊 软删除结果:', result);

    if (result.affectedRows === 0) {
      return res.status(500).json({
        success: false,
        message: '删除失败'
      });
    }

    console.log(`✅ 用户 ${existing[0].username} 已软删除`);

    res.json({
      success: true,
      message: '用户删除成功'
    });

  } catch (error) {
    console.error('❌ 删除用户错误:', error);
    
    // 处理外键约束错误
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({
        success: false,
        message: '无法删除：该用户有关联数据'
      });
    }
    
    res.status(500).json({
      success: false,
      message: '服务器内部错误: ' + error.message
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
        roleName: r.role_name,  // ✅ 兼容前端
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