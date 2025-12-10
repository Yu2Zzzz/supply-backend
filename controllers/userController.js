// backend/controllers/userController.js - 支持查看已删除用户
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

/**
 * 获取用户列表
 * GET /api/users?showDeleted=false|true|only|all
 */
const getUsers = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, keyword = '', roleId = '', showDeleted = 'false' } = req.query;
    const offset = (page - 1) * pageSize;

    // ✅ 根据参数决定是否显示已删除用户
    let whereClause = '';
    
    if (showDeleted === 'only') {
      // 只显示已删除
      whereClause = 'WHERE u.is_deleted = 1';
    } else if (showDeleted === 'true' || showDeleted === 'all') {
      // 显示全部（包括已删除）
      whereClause = 'WHERE 1=1';
    } else {
      // 默认：只显示未删除
      whereClause = 'WHERE (u.is_deleted = 0 OR u.is_deleted IS NULL)';
    }
    
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
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM users u ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // 查询用户列表
    const [users] = await pool.query(`
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

    if (!username || !password || !roleId) {
      return res.status(400).json({
        success: false,
        message: '用户名、密码和角色不能为空'
      });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: '用户名已存在'
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(`
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

    const [existing] = await pool.query('SELECT id FROM users WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const finalIsActive = isActive !== undefined ? isActive : is_active;
    const finalIsDeleted = isDeleted !== undefined ? isDeleted : is_deleted;

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

    await pool.query(`
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

    const [existing] = await pool.query('SELECT id FROM users WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, id]);

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

    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: '不能删除自己的账号'
      });
    }

    const [existing] = await pool.query(
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
    const [result] = await pool.query(`
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
 * ✨ 新增：恢复已删除用户
 * POST /api/users/:id/restore
 */
const restoreUser = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('♻️ 恢复用户请求 ID:', id);

    // 检查用户是否存在且已删除
    const [existing] = await pool.query(
      'SELECT id, username FROM users WHERE id = ? AND is_deleted = 1', 
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在或未被删除'
      });
    }

    // 恢复用户：is_deleted = 0, is_active = 1
    const [result] = await pool.query(`
      UPDATE users 
      SET is_deleted = 0, is_active = 1
      WHERE id = ?
    `, [id]);

    console.log(`✅ 用户 ${existing[0].username} 已恢复`);

    res.json({
      success: true,
      message: '用户恢复成功'
    });

  } catch (error) {
    console.error('❌ 恢复用户错误:', error);
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
    const [roles] = await pool.query('SELECT * FROM roles ORDER BY id');

    res.json({
      success: true,
      data: roles.map(r => ({
        id: r.id,
        code: r.role_code,
        name: r.role_name,
        roleName: r.role_name,
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
  restoreUser,  // ✨ 新增
  getRoles
};