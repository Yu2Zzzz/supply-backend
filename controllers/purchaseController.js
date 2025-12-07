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

    // 自动生成采购单号（如果没有提供）
    let finalPoNo = poNo;
    if (!finalPoNo) {
      const today = new Date();
      const prefix = `PO${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;
      const [result] = await connection.query(
        "SELECT MAX(po_no) as maxNo FROM purchase_orders WHERE po_no LIKE ?",
        [`${prefix}%`]
      );
      let seq = 1;
      if (result[0].maxNo) {
        const lastSeq = parseInt(result[0].maxNo.slice(-4));
        seq = lastSeq + 1;
      }
      finalPoNo = `${prefix}${String(seq).padStart(4, '0')}`;
    }

    // 验证必填字段
    if (!materialId || !supplierId || !quantity || !orderDate || !expectedDate) {
      return res.status(400).json({
        success: false,
        message: '物料、供应商、数量、下单日期和预计到货日期不能为空'
      });
    }

    const totalAmount = unitPrice ? quantity * unitPrice : null;

    await connection.beginTransaction();

    // 创建采购订单
    const [result] = await connection.query(`
      INSERT INTO purchase_orders (po_no, material_id, supplier_id, quantity, unit_price, total_amount, order_date, expected_date, remark, created_by, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')
    `, [finalPoNo, materialId, supplierId, quantity, unitPrice || 0, totalAmount, orderDate, expectedDate, remark || '', req.user?.id || 1]);

    const poId = result.insertId;

    // 创建在途记录（可选，如果表存在）
    try {
      await connection.query(`
        INSERT INTO in_transit (purchase_order_id, material_id, quantity, expected_date)
        VALUES (?, ?, ?, ?)
      `, [poId, materialId, quantity, expectedDate]);
    } catch (e) {
      console.log('in_transit表可能不存在，跳过:', e.message);
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: '采购订单创建成功',
      data: { id: poId, poNo: finalPoNo }
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
      message: '服务器内部错误: ' + error.message
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

    console.log('更新采购订单请求:', { id, poNo, materialId, supplierId, quantity, status });

    // 检查订单是否存在
    const [existing] = await connection.query('SELECT id, status, material_id, po_no FROM purchase_orders WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: '采购订单不存在'
      });
    }

    const oldOrder = existing[0];
    const oldStatus = oldOrder.status;
    const finalPoNo = poNo || oldOrder.po_no;  // 如果没传poNo，使用原来的
    const totalAmount = unitPrice ? quantity * unitPrice : null;

    await connection.beginTransaction();

    // 更新采购订单
    await connection.query(`
      UPDATE purchase_orders 
      SET po_no = ?, material_id = ?, supplier_id = ?, quantity = ?, unit_price = ?, 
          total_amount = ?, order_date = ?, expected_date = ?, actual_date = ?, status = ?, remark = ?
      WHERE id = ?
    `, [finalPoNo, materialId, supplierId, quantity, unitPrice || 0, totalAmount, orderDate, expectedDate, actualDate || null, status, remark || '', id]);

    // 处理状态变更
    if (status === 'arrived' && oldStatus !== 'arrived') {
      // 到货后删除在途记录
      try {
        await connection.query('DELETE FROM in_transit WHERE purchase_order_id = ?', [id]);
      } catch (e) {
        console.log('删除在途记录失败，可能表不存在:', e.message);
      }
      
      // 增加库存（假设入库到默认仓库 ID=1）
      try {
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
        console.log('库存更新成功');
      } catch (e) {
        console.log('库存更新失败，可能表不存在或结构不同:', e.message);
        // 不抛出错误，继续执行
      }
    } else if (status !== 'cancelled' && status !== 'arrived') {
      // 更新在途数量
      try {
        const [transitExisting] = await connection.query(
          'SELECT id FROM in_transit WHERE purchase_order_id = ?', [id]
        );
        if (transitExisting.length > 0) {
          await connection.query(
            'UPDATE in_transit SET quantity = ?, expected_date = ?, material_id = ? WHERE purchase_order_id = ?',
            [quantity, expectedDate, materialId, id]
          );
        }
      } catch (e) {
        console.log('更新在途记录失败:', e.message);
      }
    } else if (status === 'cancelled') {
      // 取消订单，删除在途记录
      try {
        await connection.query('DELETE FROM in_transit WHERE purchase_order_id = ?', [id]);
      } catch (e) {
        console.log('删除在途记录失败:', e.message);
      }
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
      message: '服务器内部错误: ' + error.message
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
      try {
        await db.query('DELETE FROM in_transit WHERE purchase_order_id = ?', [id]);
      } catch (e) {
        console.log('删除在途记录失败:', e.message);
      }
      return res.json({
        success: true,
        message: '采购订单已取消'
      });
    }

    await connection.beginTransaction();

    // 删除在途记录
    try {
      await connection.query('DELETE FROM in_transit WHERE purchase_order_id = ?', [id]);
    } catch (e) {
      console.log('删除在途记录失败:', e.message);
    }
    
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
      message: '服务器内部错误: ' + error.message
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
    const { status: newStatus } = req.body;

    const [existing] = await db.query('SELECT * FROM purchase_orders WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: '采购订单不存在'
      });
    }

    const order = existing[0];
    
    // 状态流转规则
    const statusFlow = {
      'draft': ['confirmed'],
      'confirmed': ['producing'],
      'producing': ['shipped'],
      'shipped': ['arrived']
    };

    const allowedNextStatus = statusFlow[order.status] || [];
    
    if (newStatus && !allowedNextStatus.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: `当前状态 ${order.status} 不能变更为 ${newStatus}`
      });
    }

    // 默认下一个状态
    const targetStatus = newStatus || allowedNextStatus[0];
    
    if (!targetStatus) {
      return res.status(400).json({
        success: false,
        message: '当前状态无法继续流转'
      });
    }

    await db.query("UPDATE purchase_orders SET status = ? WHERE id = ?", [targetStatus, id]);

    // 如果到货，处理库存
    if (targetStatus === 'arrived') {
      try {
        await db.query('DELETE FROM in_transit WHERE purchase_order_id = ?', [id]);
        
        const [invExisting] = await db.query(
          'SELECT id, quantity FROM inventory WHERE material_id = ? AND warehouse_id = 1',
          [order.material_id]
        );
        
        if (invExisting.length > 0) {
          await db.query(
            'UPDATE inventory SET quantity = quantity + ? WHERE id = ?',
            [order.quantity, invExisting[0].id]
          );
        } else {
          await db.query(
            'INSERT INTO inventory (material_id, warehouse_id, quantity) VALUES (?, 1, ?)',
            [order.material_id, order.quantity]
          );
        }
      } catch (e) {
        console.log('库存处理失败:', e.message);
      }
    }

    res.json({
      success: true,
      message: `采购订单已更新为 ${targetStatus}`
    });

  } catch (error) {
    console.error('确认采购订单错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误: ' + error.message
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