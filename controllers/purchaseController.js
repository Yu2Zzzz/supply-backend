// backend/controllers/purchaseController.js
const db = require('../config/db');

/**
 * 获取采购订单列表
 * GET /api/purchase-orders
 */
const getPurchaseOrders = async (req, res) => {
  try {
    const { 
      page = 1, 
      pageSize = 20, 
      keyword = '', 
      status = '',
      supplierId = '',
      materialId = '',
      startDate = '',
      endDate = ''
    } = req.query;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (keyword) {
      whereClause += ' AND (po.po_no LIKE ? OR m.name LIKE ? OR s.name LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    if (status) {
      whereClause += ' AND po.status = ?';
      params.push(status);
    }

    if (supplierId) {
      whereClause += ' AND po.supplier_id = ?';
      params.push(supplierId);
    }

    if (materialId) {
      whereClause += ' AND po.material_id = ?';
      params.push(materialId);
    }

    if (startDate) {
      whereClause += ' AND po.expected_date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND po.expected_date <= ?';
      params.push(endDate);
    }

    // 查询总数
    const [countResult] = await db.query(`
      SELECT COUNT(*) as total 
      FROM purchase_orders po
      JOIN materials m ON po.material_id = m.id
      JOIN suppliers s ON po.supplier_id = s.id
      ${whereClause}
    `, params);
    const total = countResult[0].total;

    // 查询列表
    const [orders] = await db.query(`
      SELECT po.*, 
             m.material_code, m.name as material_name, m.unit,
             s.supplier_code, s.name as supplier_name
      FROM purchase_orders po
      JOIN materials m ON po.material_id = m.id
      JOIN suppliers s ON po.supplier_id = s.id
      ${whereClause}
      ORDER BY po.expected_date ASC, po.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(pageSize), offset]);

    res.json({
      success: true,
      data: {
        list: orders.map(o => ({
          id: o.id,
          poNo: o.po_no,
          materialId: o.material_id,
          materialCode: o.material_code,
          materialName: o.material_name,
          unit: o.unit,
          supplierId: o.supplier_id,
          supplierCode: o.supplier_code,
          supplierName: o.supplier_name,
          quantity: o.quantity,
          unitPrice: o.unit_price,
          totalAmount: o.total_amount,
          orderDate: o.order_date,
          expectedDate: o.expected_date,
          actualDate: o.actual_date,
          status: o.status,
          remark: o.remark,
          createdAt: o.created_at
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
    console.error('获取采购订单列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

/**
 * 获取采购订单详情
 * GET /api/purchase-orders/:id
 */
const getPurchaseOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const [orders] = await db.query(`
      SELECT po.*, 
             m.material_code, m.name as material_name, m.spec, m.unit,
             s.supplier_code, s.name as supplier_name, s.contact_person, s.phone
      FROM purchase_orders po
      JOIN materials m ON po.material_id = m.id
      JOIN suppliers s ON po.supplier_id = s.id
      WHERE po.id = ?
    `, [id]);

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: '采购订单不存在'
      });
    }

    const order = orders[0];

    res.json({
      success: true,
      data: {
        id: order.id,
        poNo: order.po_no,
        materialId: order.material_id,
        materialCode: order.material_code,
        materialName: order.material_name,
        materialSpec: order.spec,
        unit: order.unit,
        supplierId: order.supplier_id,
        supplierCode: order.supplier_code,
        supplierName: order.supplier_name,
        supplierContact: order.contact_person,
        supplierPhone: order.phone,
        quantity: order.quantity,
        unitPrice: order.unit_price,
        totalAmount: order.total_amount,
        orderDate: order.order_date,
        expectedDate: order.expected_date,
        actualDate: order.actual_date,
        status: order.status,
        remark: order.remark,
        createdAt: order.created_at
      }
    });

  } catch (error) {
    console.error('获取采购订单详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

/**
 * 创建采购订单
 * POST /api/purchase-orders
 */
const createPurchaseOrder = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { 
      poNo, 
      materialId, 
      supplierId, 
      quantity, 
      unitPrice, 
      orderDate, 
      expectedDate, 
      remark 
    } = req.body;

    // 验证必填字段
    if (!poNo || !materialId || !supplierId || !quantity || !orderDate || !expectedDate) {
      return res.status(400).json({
        success: false,
        message: '采购单号、物料、供应商、数量、下单日期和预计到货日期不能为空'
      });
    }

    const totalAmount = unitPrice ? quantity * unitPrice : null;

    await connection.beginTransaction();

    // 创建采购订单
    const [result] = await connection.query(`
      INSERT INTO purchase_orders (po_no, material_id, supplier_id, quantity, unit_price, total_amount, order_date, expected_date, remark, created_by, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')
    `, [poNo, materialId, supplierId, quantity, unitPrice, totalAmount, orderDate, expectedDate, remark, req.user.id]);

    const poId = result.insertId;

    // 创建在途记录
    await connection.query(`
      INSERT INTO in_transit (purchase_order_id, material_id, quantity, expected_date)
      VALUES (?, ?, ?, ?)
    `, [poId, materialId, quantity, expectedDate]);

    await connection.commit();

    res.status(201).json({
      success: true,
      message: '采购订单创建成功',
      data: { id: poId, poNo }
    });

  } catch (error) {
    await connection.rollback();
    console.error('创建采购订单错误:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: '采购单号已存在'
      });
    }

    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  } finally {
    connection.release();
  }
};

/**
 * 更新采购订单
 * PUT /api/purchase-orders/:id
 */
const updatePurchaseOrder = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { id } = req.params;
    const { 
      poNo, 
      materialId, 
      supplierId, 
      quantity, 
      unitPrice, 
      orderDate, 
      expectedDate,
      actualDate,
      status,
      remark 
    } = req.body;

    // 检查订单是否存在
    const [existing] = await connection.query('SELECT id, status, material_id FROM purchase_orders WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: '采购订单不存在'
      });
    }

    const oldStatus = existing[0].status;
    const totalAmount = unitPrice ? quantity * unitPrice : null;

    await connection.beginTransaction();

    // 更新采购订单
    await connection.query(`
      UPDATE purchase_orders 
      SET po_no = ?, material_id = ?, supplier_id = ?, quantity = ?, unit_price = ?, 
          total_amount = ?, order_date = ?, expected_date = ?, actual_date = ?, status = ?, remark = ?
      WHERE id = ?
    `, [poNo, materialId, supplierId, quantity, unitPrice, totalAmount, orderDate, expectedDate, actualDate, status, remark, id]);

    // 更新在途记录
    if (status === 'arrived') {
      // 到货后删除在途记录
      await connection.query('DELETE FROM in_transit WHERE purchase_order_id = ?', [id]);
      
      // 增加库存（假设入库到默认仓库 ID=1）
      const [invExisting] = await connection.query(
        'SELECT id, quantity FROM inventory WHERE material_id = ? AND warehouse_id = 1',
        [materialId]
      );
      
      if (invExisting.length > 0) {
        await connection.query(
          'UPDATE inventory SET quantity = quantity + ? WHERE id = ?',
          [quantity, invExisting[0].id]
        );
      } else {
        await connection.query(
          'INSERT INTO inventory (material_id, warehouse_id, quantity) VALUES (?, 1, ?)',
          [materialId, quantity]
        );
      }
    } else if (status !== 'cancelled') {
      // 更新在途数量
      await connection.query(
        'UPDATE in_transit SET quantity = ?, expected_date = ?, material_id = ? WHERE purchase_order_id = ?',
        [quantity, expectedDate, materialId, id]
      );
    } else {
      // 取消订单，删除在途记录
      await connection.query('DELETE FROM in_transit WHERE purchase_order_id = ?', [id]);
    }

    await connection.commit();

    res.json({
      success: true,
      message: '采购订单更新成功'
    });

  } catch (error) {
    await connection.rollback();
    console.error('更新采购订单错误:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: '采购单号已存在'
      });
    }

    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  } finally {
    connection.release();
  }
};

/**
 * 删除采购订单
 * DELETE /api/purchase-orders/:id
 */
const deletePurchaseOrder = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { id } = req.params;

    // 检查订单是否存在
    const [existing] = await connection.query('SELECT id, status FROM purchase_orders WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: '采购订单不存在'
      });
    }

    // 只有草稿状态可以删除，其他状态改为取消
    if (existing[0].status !== 'draft') {
      await db.query("UPDATE purchase_orders SET status = 'cancelled' WHERE id = ?", [id]);
      await db.query('DELETE FROM in_transit WHERE purchase_order_id = ?', [id]);
      return res.json({
        success: true,
        message: '采购订单已取消'
      });
    }

    await connection.beginTransaction();

    // 删除在途记录
    await connection.query('DELETE FROM in_transit WHERE purchase_order_id = ?', [id]);
    
    // 删除采购订单
    await connection.query('DELETE FROM purchase_orders WHERE id = ?', [id]);

    await connection.commit();

    res.json({
      success: true,
      message: '采购订单删除成功'
    });

  } catch (error) {
    await connection.rollback();
    console.error('删除采购订单错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  } finally {
    connection.release();
  }
};

/**
 * 确认采购订单（状态流转）
 * POST /api/purchase-orders/:id/confirm
 */
const confirmPurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await db.query('SELECT id, status FROM purchase_orders WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: '采购订单不存在'
      });
    }

    if (existing[0].status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: '只有草稿状态的订单可以确认'
      });
    }

    await db.query("UPDATE purchase_orders SET status = 'confirmed' WHERE id = ?", [id]);

    res.json({
      success: true,
      message: '采购订单已确认'
    });

  } catch (error) {
    console.error('确认采购订单错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

/**
 * 生成采购单号
 * GET /api/purchase-orders/generate-no
 */
const generatePoNo = async (req, res) => {
  try {
    const today = new Date();
    const prefix = `PO${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;
    
    const [result] = await db.query(
      "SELECT MAX(po_no) as maxNo FROM purchase_orders WHERE po_no LIKE ?",
      [`${prefix}%`]
    );

    let seq = 1;
    if (result[0].maxNo) {
      const lastSeq = parseInt(result[0].maxNo.slice(-4));
      seq = lastSeq + 1;
    }

    const poNo = `${prefix}${String(seq).padStart(4, '0')}`;

    res.json({
      success: true,
      data: { poNo }
    });

  } catch (error) {
    console.error('生成采购单号错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

module.exports = {
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  confirmPurchaseOrder,
  generatePoNo
};
