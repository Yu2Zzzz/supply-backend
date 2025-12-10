// backend/controllers/crudFactory.js
const { pool } = require('../config/database');

/**
 * 通用CRUD控制器工厂
 * 用于快速创建标准的增删改查控制器
 * 
 * @param {Object} config - 配置对象
 * @param {string} config.tableName - 数据库表名
 * @param {string} config.displayName - 显示名称（用于错误消息）
 * @param {string[]} config.searchFields - 可搜索的字段
 * @param {string[]} config.selectFields - 查询返回的字段
 * @param {string} config.orderBy - 默认排序字段
 */
const createCrudController = (config) => {
  const { 
    tableName, 
    displayName, 
    searchFields = [], 
    selectFields = ['*'],
    orderBy = 'created_at DESC'
  } = config;

  return {
    /**
     * 获取列表
     */
    getAll: async (req, res) => {
      try {
        const { page = 1, pageSize = 20, keyword = '', status = '' } = req.query;
        const offset = (page - 1) * pageSize;

        // 构建查询条件
        let whereClause = 'WHERE 1=1';
        const params = [];

        // 关键字搜索
        if (keyword && searchFields.length > 0) {
          const searchConditions = searchFields.map(f => `${f} LIKE ?`).join(' OR ');
          whereClause += ` AND (${searchConditions})`;
          searchFields.forEach(() => params.push(`%${keyword}%`));
        }

        // 状态筛选
        if (status) {
          whereClause += ' AND status = ?';
          params.push(status);
        }

        // 查询总数
        const [countResult] = await pool.query(
          `SELECT COUNT(*) as total FROM ${tableName} ${whereClause}`,
          params
        );
        const total = countResult[0].total;

        // 查询列表
        const [rows] = await pool.query(`
          SELECT ${selectFields.join(', ')} 
          FROM ${tableName} 
          ${whereClause}
          ORDER BY ${orderBy}
          LIMIT ? OFFSET ?
        `, [...params, parseInt(pageSize), offset]);

        res.json({
          success: true,
          data: {
            list: rows,
            pagination: {
              page: parseInt(page),
              pageSize: parseInt(pageSize),
              total,
              totalPages: Math.ceil(total / pageSize)
            }
          }
        });

      } catch (error) {
        console.error(`获取${displayName}列表错误:`, error);
        res.status(500).json({
          success: false,
          message: '服务器内部错误'
        });
      }
    },

    /**
     * 获取单个详情
     */
    getById: async (req, res) => {
      try {
        const { id } = req.params;

        const [rows] = await pool.query(
          `SELECT ${selectFields.join(', ')} FROM ${tableName} WHERE id = ?`,
          [id]
        );

        if (rows.length === 0) {
          return res.status(404).json({
            success: false,
            message: `${displayName}不存在`
          });
        }

        res.json({
          success: true,
          data: rows[0]
        });

      } catch (error) {
        console.error(`获取${displayName}详情错误:`, error);
        res.status(500).json({
          success: false,
          message: '服务器内部错误'
        });
      }
    },

    /**
     * 创建
     */
    create: async (req, res) => {
      try {
        const data = req.body;
        const fields = Object.keys(data);
        const values = Object.values(data);
        const placeholders = fields.map(() => '?').join(', ');

        const [result] = await pool.query(
          `INSERT INTO ${tableName} (${fields.join(', ')}) VALUES (${placeholders})`,
          values
        );

        res.status(201).json({
          success: true,
          message: `${displayName}创建成功`,
          data: { id: result.insertId }
        });

      } catch (error) {
        console.error(`创建${displayName}错误:`, error);
        
        // 处理唯一键冲突
        if (error.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({
            success: false,
            message: '编码已存在，请使用其他编码'
          });
        }

        res.status(500).json({
          success: false,
          message: '服务器内部错误'
        });
      }
    },

    /**
     * 更新
     */
    update: async (req, res) => {
      try {
        const { id } = req.params;
        const data = req.body;

        // 移除不应更新的字段
        delete data.id;
        delete data.created_at;

        const fields = Object.keys(data);
        const values = Object.values(data);
        const setClause = fields.map(f => `${f} = ?`).join(', ');

        // 检查是否存在
        const [existing] = await pool.query(`SELECT id FROM ${tableName} WHERE id = ?`, [id]);
        if (existing.length === 0) {
          return res.status(404).json({
            success: false,
            message: `${displayName}不存在`
          });
        }

        await pool.query(
          `UPDATE ${tableName} SET ${setClause} WHERE id = ?`,
          [...values, id]
        );

        res.json({
          success: true,
          message: `${displayName}更新成功`
        });

      } catch (error) {
        console.error(`更新${displayName}错误:`, error);

        if (error.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({
            success: false,
            message: '编码已存在，请使用其他编码'
          });
        }

        res.status(500).json({
          success: false,
          message: '服务器内部错误'
        });
      }
    },

    /**
     * 删除
     */
    delete: async (req, res) => {
      try {
        const { id } = req.params;

        // 检查是否存在
        const [existing] = await pool.query(`SELECT id FROM ${tableName} WHERE id = ?`, [id]);
        if (existing.length === 0) {
          return res.status(404).json({
            success: false,
            message: `${displayName}不存在`
          });
        }

        // 软删除（如果有 status 字段）或硬删除
        try {
          await pool.query(`UPDATE ${tableName} SET status = 'inactive' WHERE id = ?`, [id]);
        } catch {
          await pool.query(`DELETE FROM ${tableName} WHERE id = ?`, [id]);
        }

        res.json({
          success: true,
          message: `${displayName}删除成功`
        });

      } catch (error) {
        console.error(`删除${displayName}错误:`, error);

        // 处理外键约束
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
          return res.status(400).json({
            success: false,
            message: `该${displayName}正在被使用，无法删除`
          });
        }

        res.status(500).json({
          success: false,
          message: '服务器内部错误'
        });
      }
    }
  };
};

module.exports = createCrudController;
