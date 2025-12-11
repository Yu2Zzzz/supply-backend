// backend/controllers/inventoryController.js - 修复版本
const { pool } = require('../config/database');

/**
 * 获取库存列表
 * GET /api/inventory
 * 参数: warehouseId, materialId, type (material/product)
 */
const getInventory = async (req, res) => {
  try {
    const { 
      warehouseId, 
      materialId,  // ✅ 添加 materialId 参数
      productId,   // ✅ 添加 productId 参数
      type = 'material', 
      page = 1, 
      pageSize = 100 
    } = req.query;
    
    const offset = (page - 1) * pageSize;

    let query, countQuery, params = [];

    if (type === 'product') {
      // 产品库存
      let whereClause = 'WHERE 1=1';
      
      if (warehouseId) {
        whereClause += ' AND pi.warehouse_id = ?';
        params.push(warehouseId);
      }
      
      // ✅ 添加：按 productId 过滤
      if (productId) {
        whereClause += ' AND pi.product_id = ?';
        params.push(productId);
      }

      countQuery = `
        SELECT COUNT(*) as total 
        FROM product_inventory pi
        JOIN products p ON pi.product_id = p.id
        JOIN warehouses w ON pi.warehouse_id = w.id
        ${whereClause}
      `;

      query = `
        SELECT 
          pi.id,
          pi.product_id,
          pi.warehouse_id,
          pi.quantity,
          pi.safety_stock,
          p.product_code,
          p.name as product_name,
          p.spec,
          p.unit,
          w.warehouse_code,
          w.name as warehouse_name
        FROM product_inventory pi
        JOIN products p ON pi.product_id = p.id
        JOIN warehouses w ON pi.warehouse_id = w.id
        ${whereClause}
        ORDER BY p.product_code
        LIMIT ? OFFSET ?
      `;
    } else {
      // 物料库存
      let whereClause = 'WHERE 1=1';
      
      if (warehouseId) {
        whereClause += ' AND i.warehouse_id = ?';
        params.push(warehouseId);
      }
      
      // ✅ 关键修复：按 materialId 过滤
      if (materialId) {
        whereClause += ' AND i.material_id = ?';
        params.push(materialId);
      }

      countQuery = `
        SELECT COUNT(*) as total 
        FROM inventory i
        JOIN materials m ON i.material_id = m.id
        JOIN warehouses w ON i.warehouse_id = w.id
        ${whereClause}
      `;

      query = `
        SELECT 
          i.id,
          i.material_id,
          i.warehouse_id,
          i.quantity,
          i.safety_stock,
          m.material_code,
          m.name as material_name,
          m.spec,
          m.unit,
          w.warehouse_code,
          w.name as warehouse_name
        FROM inventory i
        JOIN materials m ON i.material_id = m.id
        JOIN warehouses w ON i.warehouse_id = w.id
        ${whereClause}
        ORDER BY m.material_code
        LIMIT ? OFFSET ?
      `;
    }

    const [countResult] = await pool.query(countQuery, params);
    const total = countResult[0]?.total || 0;

    const [rows] = await pool.query(query, [...params, parseInt(pageSize), offset]);

    // 格式化响应
    const list = rows.map(row => {
      if (type === 'product') {
        return {
          id: row.id,
          productId: row.product_id,
          warehouseId: row.warehouse_id,
          quantity: row.quantity || 0,
          safetyStock: row.safety_stock || 0,
          productCode: row.product_code,
          productName: row.product_name,
          spec: row.spec,
          unit: row.unit,
          warehouseCode: row.warehouse_code,
          warehouseName: row.warehouse_name
        };
      } else {
        return {
          id: row.id,
          materialId: row.material_id,
          warehouseId: row.warehouse_id,
          quantity: row.quantity || 0,
          safetyStock: row.safety_stock || 0,
          materialCode: row.material_code,
          materialName: row.material_name,
          spec: row.spec,
          unit: row.unit,
          warehouseCode: row.warehouse_code,
          warehouseName: row.warehouse_name
        };
      }
    });

    res.json({
      success: true,
      data: {
        list,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    });

  } catch (error) {
    console.error('获取库存列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误: ' + error.message
    });
  }
};

/**
 * 获取库存详情
 * GET /api/inventory/:id
 */
const getInventoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const { type = 'material' } = req.query;

    let query;
    if (type === 'product') {
      query = `
        SELECT 
          pi.*, 
          p.product_code, p.name as product_name, p.spec, p.unit,
          w.warehouse_code, w.name as warehouse_name
        FROM product_inventory pi
        JOIN products p ON pi.product_id = p.id
        JOIN warehouses w ON pi.warehouse_id = w.id
        WHERE pi.id = ?
      `;
    } else {
      query = `
        SELECT 
          i.*, 
          m.material_code, m.name as material_name, m.spec, m.unit,
          w.warehouse_code, w.name as warehouse_name
        FROM inventory i
        JOIN materials m ON i.material_id = m.id
        JOIN warehouses w ON i.warehouse_id = w.id
        WHERE i.id = ?
      `;
    }

    const [rows] = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '库存记录不存在'
      });
    }

    res.json({
      success: true,
      data: rows[0]
    });

  } catch (error) {
    console.error('获取库存详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

/**
 * 创建库存记录
 * POST /api/inventory
 */
const createInventory = async (req, res) => {
  try {
    const { 
      type = 'material', 
      itemId,           // 物料/产品 ID
      materialId,       // ✅ 兼容 materialId
      productId,        // ✅ 兼容 productId
      warehouseId, 
      quantity = 0, 
      safetyStock = 0,
      safety_stock = 0  // ✅ 兼容下划线命名
    } = req.body;

    // ✅ 灵活处理 ID
    const finalItemId = itemId || materialId || productId;
    const finalSafetyStock = safetyStock || safety_stock || 0;

    if (!finalItemId || !warehouseId) {
      return res.status(400).json({
        success: false,
        message: '物料/产品ID和仓库ID不能为空'
      });
    }

    let table, itemColumn;
    if (type === 'product') {
      table = 'product_inventory';
      itemColumn = 'product_id';
    } else {
      table = 'inventory';
      itemColumn = 'material_id';
    }

    // 检查是否已存在
    const [existing] = await pool.query(
      `SELECT id FROM ${table} WHERE ${itemColumn} = ? AND warehouse_id = ?`,
      [finalItemId, warehouseId]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: '该仓库已存在该物料/产品的库存记录'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO ${table} (${itemColumn}, warehouse_id, quantity, safety_stock) VALUES (?, ?, ?, ?)`,
      [finalItemId, warehouseId, quantity, finalSafetyStock]
    );

    res.status(201).json({
      success: true,
      message: '库存记录创建成功',
      data: { id: result.insertId }
    });

  } catch (error) {
    console.error('创建库存记录错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误: ' + error.message
    });
  }
};

/**
 * 更新库存
 * PUT /api/inventory/:id
 */
const updateInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, safetyStock, safety_stock, type = 'material' } = req.body;

    const table = type === 'product' ? 'product_inventory' : 'inventory';
    const finalSafetyStock = safetyStock || safety_stock;

    // 检查记录是否存在
    const [existing] = await pool.query(`SELECT id FROM ${table} WHERE id = ?`, [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: '库存记录不存在'
      });
    }

    // 构建更新语句
    const updates = [];
    const values = [];

    if (quantity !== undefined) {
      updates.push('quantity = ?');
      values.push(quantity);
    }
    if (finalSafetyStock !== undefined) {
      updates.push('safety_stock = ?');
      values.push(finalSafetyStock);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有要更新的字段'
      });
    }

    values.push(id);
    await pool.query(`UPDATE ${table} SET ${updates.join(', ')} WHERE id = ?`, values);

    res.json({
      success: true,
      message: '库存更新成功'
    });

  } catch (error) {
    console.error('更新库存错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误: ' + error.message
    });
  }
};

/**
 * 删除库存记录
 * DELETE /api/inventory/:id
 */
const deleteInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const { type = 'material' } = req.query;

    const table = type === 'product' ? 'product_inventory' : 'inventory';

    const [existing] = await pool.query(`SELECT id FROM ${table} WHERE id = ?`, [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: '库存记录不存在'
      });
    }

    await pool.query(`DELETE FROM ${table} WHERE id = ?`, [id]);

    res.json({
      success: true,
      message: '库存记录删除成功'
    });

  } catch (error) {
    console.error('删除库存记录错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

/**
 * 库存调整（入库/出库）
 * POST /api/inventory/:id/adjust
 */
const adjustInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const { adjustType, quantity, reason, type = 'material' } = req.body;

    if (!adjustType || !quantity) {
      return res.status(400).json({
        success: false,
        message: '调整类型和数量不能为空'
      });
    }

    const table = type === 'product' ? 'product_inventory' : 'inventory';

    const [existing] = await pool.query(`SELECT id, quantity FROM ${table} WHERE id = ?`, [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: '库存记录不存在'
      });
    }

    const currentQty = existing[0].quantity || 0;
    let newQty;

    if (adjustType === 'in') {
      newQty = currentQty + quantity;
    } else if (adjustType === 'out') {
      newQty = currentQty - quantity;
      if (newQty < 0) {
        return res.status(400).json({
          success: false,
          message: '库存不足，无法出库'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: '无效的调整类型'
      });
    }

    await pool.query(`UPDATE ${table} SET quantity = ? WHERE id = ?`, [newQty, id]);

    res.json({
      success: true,
      message: `库存${adjustType === 'in' ? '入库' : '出库'}成功`,
      data: {
        previousQuantity: currentQty,
        adjustQuantity: quantity,
        newQuantity: newQty
      }
    });

  } catch (error) {
    console.error('库存调整错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

module.exports = {
  getInventory,
  getInventoryById,
  createInventory,
  updateInventory,
  deleteInventory,
  adjustInventory
};