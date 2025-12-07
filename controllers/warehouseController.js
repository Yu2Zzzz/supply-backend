// backend/controllers/warehouseController.js
const db = require('../config/db');

/**
 * 获取仓库列表
 * GET /api/warehouses
 */
const getWarehouses = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, keyword = '', status = '' } = req.query;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (keyword) {
      whereClause += ' AND (warehouse_code LIKE ? OR name LIKE ? OR location LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    // 查询总数
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM warehouses ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // 查询列表
    const [warehouses] = await db.query(`
      SELECT w.*,
             (SELECT COUNT(*) FROM inventory i WHERE i.warehouse_id = w.id) as material_count,
             (SELECT SUM(i.quantity) FROM inventory i WHERE i.warehouse_id = w.id) as total_stock
      FROM warehouses w
      ${whereClause}
      ORDER BY w.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(pageSize), offset]);

    res.json({
      success: true,
      data: {
        list: warehouses.map(w => ({
          id: w.id,
          warehouseCode: w.warehouse_code,
          name: w.name,
          location: w.location,
          capacity: w.capacity,
          manager: w.manager,
          status: w.status,
          remark: w.remark,
          materialCount: w.material_count,
          totalStock: w.total_stock || 0,
          createdAt: w.created_at
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
    console.error('获取仓库列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

/**
 * 获取仓库详情
 * GET /api/warehouses/:id
 */
const getWarehouseById = async (req, res) => {
  try {
    const { id } = req.params;

    const [warehouses] = await db.query('SELECT * FROM warehouses WHERE id = ?', [id]);

    if (warehouses.length === 0) {
      return res.status(404).json({
        success: false,
        message: '仓库不存在'
      });
    }

    // 获取该仓库的库存
    const [inventory] = await db.query(`
      SELECT i.*, m.material_code, m.name as material_name, m.unit
      FROM inventory i
      JOIN materials m ON i.material_id = m.id
      WHERE i.warehouse_id = ?
    `, [id]);

    const warehouse = warehouses[0];

    res.json({
      success: true,
      data: {
        id: warehouse.id,
        warehouseCode: warehouse.warehouse_code,
        name: warehouse.name,
        location: warehouse.location,
        capacity: warehouse.capacity,
        manager: warehouse.manager,
        status: warehouse.status,
        remark: warehouse.remark,
        createdAt: warehouse.created_at,
        inventory: inventory.map(i => ({
          id: i.id,
          materialId: i.material_id,
          materialCode: i.material_code,
          materialName: i.material_name,
          unit: i.unit,
          quantity: i.quantity,
          updatedAt: i.updated_at
        }))
      }
    });

  } catch (error) {
    console.error('获取仓库详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

/**
 * 创建仓库
 * POST /api/warehouses
 */
const createWarehouse = async (req, res) => {
  try {
    const { warehouseCode, name, location, capacity, manager, remark } = req.body;

    if (!warehouseCode || !name) {
      return res.status(400).json({
        success: false,
        message: '仓库编码和名称不能为空'
      });
    }

    const [result] = await db.query(`
      INSERT INTO warehouses (warehouse_code, name, location, capacity, manager, remark)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [warehouseCode, name, location, capacity, manager, remark]);

    res.status(201).json({
      success: true,
      message: '仓库创建成功',
      data: { id: result.insertId }
    });

  } catch (error) {
    console.error('创建仓库错误:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: '仓库编码已存在'
      });
    }

    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

/**
 * 更新仓库
 * PUT /api/warehouses/:id
 */
const updateWarehouse = async (req, res) => {
  try {
    const { id } = req.params;
    const { warehouseCode, name, location, capacity, manager, status, remark } = req.body;

    // 检查是否存在
    const [existing] = await db.query('SELECT id FROM warehouses WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: '仓库不存在'
      });
    }

    await db.query(`
      UPDATE warehouses 
      SET warehouse_code = ?, name = ?, location = ?, capacity = ?, manager = ?, status = ?, remark = ?
      WHERE id = ?
    `, [warehouseCode, name, location, capacity, manager, status, remark, id]);

    res.json({
      success: true,
      message: '仓库更新成功'
    });

  } catch (error) {
    console.error('更新仓库错误:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: '仓库编码已存在'
      });
    }

    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

/**
 * 删除仓库
 * DELETE /api/warehouses/:id
 */
const deleteWarehouse = async (req, res) => {
  try {
    const { id } = req.params;

    // 检查是否存在
    const [existing] = await db.query('SELECT id FROM warehouses WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: '仓库不存在'
      });
    }

    // 检查是否有库存
    const [inv] = await db.query('SELECT COUNT(*) as count FROM inventory WHERE warehouse_id = ? AND quantity > 0', [id]);
    
    if (inv[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: '该仓库还有库存，无法删除'
      });
    }

    // 删除库存记录和仓库
    await db.query('DELETE FROM inventory WHERE warehouse_id = ?', [id]);
    await db.query('DELETE FROM warehouses WHERE id = ?', [id]);

    res.json({
      success: true,
      message: '仓库删除成功'
    });

  } catch (error) {
    console.error('删除仓库错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

module.exports = {
  getWarehouses,
  getWarehouseById,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse
};
