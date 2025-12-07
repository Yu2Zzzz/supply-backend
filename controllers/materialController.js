// backend/controllers/materialController.js
const db = require('../config/db');

/**
 * 获取物料列表
 * GET /api/materials
 */
const getMaterials = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, keyword = '', status = '', buyer = '', category = '' } = req.query;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (keyword) {
      whereClause += ' AND (m.material_code LIKE ? OR m.name LIKE ? OR m.spec LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    if (status) {
      whereClause += ' AND m.status = ?';
      params.push(status);
    }

    if (buyer) {
      whereClause += ' AND m.buyer = ?';
      params.push(buyer);
    }

    if (category) {
      whereClause += ' AND m.category = ?';
      params.push(category);
    }

    // 查询总数
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM materials m ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // 查询列表（包含库存和在途数量）
    const [materials] = await db.query(`
      SELECT m.*,
             COALESCE((SELECT SUM(i.quantity) FROM inventory i WHERE i.material_id = m.id), 0) as current_stock,
             COALESCE((SELECT SUM(it.quantity) FROM in_transit it WHERE it.material_id = m.id), 0) as in_transit_qty,
             (SELECT COUNT(*) FROM material_suppliers ms WHERE ms.material_id = m.id) as supplier_count
      FROM materials m
      ${whereClause}
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(pageSize), offset]);

    res.json({
      success: true,
      data: {
        list: materials.map(m => ({
          id: m.id,
          materialCode: m.material_code,
          name: m.name,
          spec: m.spec,
          unit: m.unit,
          price: m.price,
          safeStock: m.safe_stock,
          leadTime: m.lead_time,
          buyer: m.buyer,
          category: m.category,
          status: m.status,
          currentStock: m.current_stock,
          inTransitQty: m.in_transit_qty,
          supplierCount: m.supplier_count,
          createdAt: m.created_at
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
    console.error('获取物料列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

/**
 * 获取物料详情
 * GET /api/materials/:id
 */
const getMaterialById = async (req, res) => {
  try {
    const { id } = req.params;

    const [materials] = await db.query('SELECT * FROM materials WHERE id = ?', [id]);

    if (materials.length === 0) {
      return res.status(404).json({
        success: false,
        message: '物料不存在'
      });
    }

    // 获取供应商信息
    const [suppliers] = await db.query(`
      SELECT ms.*, s.supplier_code, s.name as supplier_name, s.on_time_rate, s.quality_rate
      FROM material_suppliers ms
      JOIN suppliers s ON ms.supplier_id = s.id
      WHERE ms.material_id = ?
    `, [id]);

    // 获取库存信息
    const [inventory] = await db.query(`
      SELECT i.*, w.warehouse_code, w.name as warehouse_name
      FROM inventory i
      JOIN warehouses w ON i.warehouse_id = w.id
      WHERE i.material_id = ?
    `, [id]);

    // 获取在途信息
    const [inTransit] = await db.query(`
      SELECT it.*, po.po_no, po.status as po_status, s.name as supplier_name
      FROM in_transit it
      JOIN purchase_orders po ON it.purchase_order_id = po.id
      JOIN suppliers s ON po.supplier_id = s.id
      WHERE it.material_id = ?
    `, [id]);

    const material = materials[0];

    res.json({
      success: true,
      data: {
        id: material.id,
        materialCode: material.material_code,
        name: material.name,
        spec: material.spec,
        unit: material.unit,
        price: material.price,
        safeStock: material.safe_stock,
        leadTime: material.lead_time,
        buyer: material.buyer,
        category: material.category,
        status: material.status,
        createdAt: material.created_at,
        suppliers: suppliers.map(s => ({
          id: s.id,
          supplierId: s.supplier_id,
          supplierCode: s.supplier_code,
          supplierName: s.supplier_name,
          isMain: s.is_main,
          price: s.price,
          leadTime: s.lead_time,
          onTimeRate: s.on_time_rate,
          qualityRate: s.quality_rate
        })),
        inventory: inventory.map(i => ({
          id: i.id,
          warehouseId: i.warehouse_id,
          warehouseCode: i.warehouse_code,
          warehouseName: i.warehouse_name,
          quantity: i.quantity,
          updatedAt: i.updated_at
        })),
        inTransit: inTransit.map(t => ({
          id: t.id,
          poNo: t.po_no,
          poStatus: t.po_status,
          supplierName: t.supplier_name,
          quantity: t.quantity,
          expectedDate: t.expected_date
        }))
      }
    });

  } catch (error) {
    console.error('获取物料详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

/**
 * 创建物料
 * POST /api/materials
 */
const createMaterial = async (req, res) => {
  try {
    const { 
      materialCode, 
      name, 
      spec, 
      unit = 'PCS', 
      price, 
      safeStock = 0, 
      leadTime = 7, 
      buyer, 
      category 
    } = req.body;

    if (!materialCode || !name) {
      return res.status(400).json({
        success: false,
        message: '物料编码和名称不能为空'
      });
    }

    const [result] = await db.query(`
      INSERT INTO materials (material_code, name, spec, unit, price, safe_stock, lead_time, buyer, category)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [materialCode, name, spec, unit, price, safeStock, leadTime, buyer, category]);

    res.status(201).json({
      success: true,
      message: '物料创建成功',
      data: { id: result.insertId }
    });

  } catch (error) {
    console.error('创建物料错误:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: '物料编码已存在'
      });
    }

    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

/**
 * 更新物料
 * PUT /api/materials/:id
 */
const updateMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const { materialCode, name, spec, unit, price, safeStock, leadTime, buyer, category, status } = req.body;

    // 检查是否存在
    const [existing] = await db.query('SELECT id FROM materials WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: '物料不存在'
      });
    }

    await db.query(`
      UPDATE materials 
      SET material_code = ?, name = ?, spec = ?, unit = ?, price = ?, 
          safe_stock = ?, lead_time = ?, buyer = ?, category = ?, status = ?
      WHERE id = ?
    `, [materialCode, name, spec, unit, price, safeStock, leadTime, buyer, category, status, id]);

    res.json({
      success: true,
      message: '物料更新成功'
    });

  } catch (error) {
    console.error('更新物料错误:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: '物料编码已存在'
      });
    }

    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

/**
 * 删除物料
 * DELETE /api/materials/:id
 */
const deleteMaterial = async (req, res) => {
  try {
    const { id } = req.params;

    // 检查是否存在
    const [existing] = await db.query('SELECT id FROM materials WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: '物料不存在'
      });
    }

    // 检查是否有库存或采购订单
    const [inv] = await db.query('SELECT SUM(quantity) as qty FROM inventory WHERE material_id = ?', [id]);
    const [po] = await db.query('SELECT COUNT(*) as count FROM purchase_orders WHERE material_id = ?', [id]);

    if ((inv[0].qty && inv[0].qty > 0) || po[0].count > 0) {
      // 软删除
      await db.query("UPDATE materials SET status = 'inactive' WHERE id = ?", [id]);
      return res.json({
        success: true,
        message: '物料已停用（存在库存或采购记录，无法删除）'
      });
    }

    // 硬删除
    await db.query('DELETE FROM material_suppliers WHERE material_id = ?', [id]);
    await db.query('DELETE FROM bom WHERE material_id = ?', [id]);
    await db.query('DELETE FROM materials WHERE id = ?', [id]);

    res.json({
      success: true,
      message: '物料删除成功'
    });

  } catch (error) {
    console.error('删除物料错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

/**
 * 获取采购员列表
 * GET /api/materials/buyers
 */
const getBuyers = async (req, res) => {
  try {
    const [result] = await db.query(`
      SELECT DISTINCT buyer 
      FROM materials 
      WHERE buyer IS NOT NULL AND buyer != ''
      ORDER BY buyer
    `);

    res.json({
      success: true,
      data: result.map(r => r.buyer)
    });

  } catch (error) {
    console.error('获取采购员列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

/**
 * 更新物料库存
 * PUT /api/materials/:id/inventory
 */
const updateInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const { warehouseId, quantity, operation = 'set' } = req.body;
    // operation: 'set' 直接设置, 'add' 增加, 'subtract' 减少

    if (!warehouseId || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: '仓库ID和数量不能为空'
      });
    }

    // 检查物料是否存在
    const [material] = await db.query('SELECT id FROM materials WHERE id = ?', [id]);
    if (material.length === 0) {
      return res.status(404).json({
        success: false,
        message: '物料不存在'
      });
    }

    // 检查是否已有库存记录
    const [existing] = await db.query(
      'SELECT id, quantity FROM inventory WHERE material_id = ? AND warehouse_id = ?',
      [id, warehouseId]
    );

    let newQuantity = quantity;
    if (existing.length > 0) {
      if (operation === 'add') {
        newQuantity = existing[0].quantity + quantity;
      } else if (operation === 'subtract') {
        newQuantity = existing[0].quantity - quantity;
        if (newQuantity < 0) newQuantity = 0;
      }
      
      await db.query(
        'UPDATE inventory SET quantity = ? WHERE id = ?',
        [newQuantity, existing[0].id]
      );
    } else {
      await db.query(
        'INSERT INTO inventory (material_id, warehouse_id, quantity) VALUES (?, ?, ?)',
        [id, warehouseId, newQuantity]
      );
    }

    res.json({
      success: true,
      message: '库存更新成功',
      data: { quantity: newQuantity }
    });

  } catch (error) {
    console.error('更新库存错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

module.exports = {
  getMaterials,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  getBuyers,
  updateInventory
};
