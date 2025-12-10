// backend/controllers/orderController.js - 安全简化版
// controllers/orderController.js
const { pool } = require('../config/database');
const { asyncHandler, AppError } = require('../middlewares/errorHandler');
const { paginated, success } = require('../utils/responseFormatter');
const { sanitizePagination } = require('../utils/validator');

/**
 * 获取订单列表
 */
const getOrders = asyncHandler(async (req, res) => {
  const { page, pageSize } = sanitizePagination(req.query.page, req.query.pageSize);
  const { keyword = '', status = '' } = req.query;
  
  const offset = (page - 1) * pageSize;
  let whereClause = 'WHERE 1=1';
  const params = [];

  if (keyword) {
    whereClause += ' AND (o.order_no LIKE ? OR c.name LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  if (status) {
    whereClause += ' AND o.status = ?';
    params.push(status);
  }

  // 查询总数
  const [countResult] = await pool.query(`
    SELECT COUNT(*) as total 
    FROM sales_orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    ${whereClause}
  `, params);

  const total = countResult[0].total;

  // 查询订单列表
  const [orders] = await pool.query(`
    SELECT 
      o.id, o.order_no, o.customer_id, o.order_date, o.delivery_date,
      o.sales_person, o.status, o.total_amount, o.remark, o.created_at,
      c.name as customer_name, c.customer_code
    FROM sales_orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    ${whereClause}
    ORDER BY o.created_at DESC
    LIMIT ? OFFSET ?
  `, [...params, pageSize, offset]);

  // 获取订单明细
  for (let order of orders) {
    const [lines] = await pool.query(`
      SELECT 
        ol.id, ol.product_id, ol.quantity, ol.unit_price, ol.amount, ol.remark,
        p.name as product_name, p.product_code
      FROM order_lines ol
      LEFT JOIN products p ON ol.product_id = p.id
      WHERE ol.order_id = ?
    `, [order.id]);
    order.lines = lines;
  }

  // 转换为驼峰命名
  const result = orders.map(o => ({
    id: o.id,
    orderNo: o.order_no,
    customerId: o.customer_id,
    customerName: o.customer_name,
    customerCode: o.customer_code,
    orderDate: o.order_date,
    deliveryDate: o.delivery_date,
    salesPerson: o.sales_person,
    status: o.status,
    totalAmount: parseFloat(o.total_amount || 0),
    remark: o.remark,
    createdAt: o.created_at,
    lines: (o.lines || []).map(l => ({
      id: l.id,
      productId: l.product_id,
      productName: l.product_name,
      productCode: l.product_code,
      quantity: parseFloat(l.quantity),
      unitPrice: parseFloat(l.unit_price || 0),
      amount: parseFloat(l.amount || 0),
      remark: l.remark
    }))
  }));

  res.json(paginated(result, { page, pageSize, total }));
});

// 保留你原有的其他函数: getOrderById, createOrder, updateOrder, deleteOrder...
// 只需要在文件开头添加导入即可

module.exports = {
  getOrders,
  // ... 你原有的其他导出
};

/**
 * 获取订单详细 - 简化版
 */
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const [orders] = await pool.query(`
      SELECT o.*, c.name as customer_name
      FROM sales_orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ?
    `, [id]);

    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }

    const order = orders[0];

    const [lines] = await pool.query(`
      SELECT ol.*, p.name as product_name, p.id as product_id 
      FROM order_lines ol
      LEFT JOIN products p ON ol.product_id = p.id
      WHERE ol.order_id = ?
    `, [id]);

    res.json({
      success: true,
      data: {
        id: order.id,
        orderNo: order.order_no,
        customerName: order.customer_name,
        orderDate: order.order_date,
        deliveryDate: order.delivery_date,
        status: order.status,
        remark: order.remark,
        lines: lines.map(l => ({
          productId: l.product_id,
          productName: l.product_name,
          quantity: l.quantity,
          unitPrice: l.unit_price,
          amount: l.amount
        }))
      }
    });
  } catch (error) {
    console.error('获取订单详情错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器内部错误: ' + error.message 
    });
  }
};

/**
 * 创建订单
 */
const createOrder = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { orderNo, customerId, orderDate, deliveryDate, salesPerson, remark, lines = [] } = req.body;

    // 自动生成订单号
    let finalOrderNo = orderNo;
    if (!finalOrderNo) {
      const today = new Date();
      const prefix = `SO${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;
      const [result] = await connection.query(
        "SELECT MAX(order_no) as maxNo FROM sales_orders WHERE order_no LIKE ?",
        [`${prefix}%`]
      );
      let seq = 1;
      if (result[0].maxNo) {
        const lastSeq = parseInt(result[0].maxNo.slice(-4));
        seq = lastSeq + 1;
      }
      finalOrderNo = `${prefix}${String(seq).padStart(4, '0')}`;
    }

    if (!customerId || !orderDate || !deliveryDate) {
      return res.status(400).json({ success: false, message: '客户、下单日期和交付日期不能为空' });
    }

    await connection.beginTransaction();

    // 计算总金额
    let totalAmount = 0;
    for (const line of lines) {
      totalAmount += (line.quantity || 0) * (line.unitPrice || 0);
    }

    const [result] = await connection.query(`
      INSERT INTO sales_orders (order_no, customer_id, order_date, delivery_date, sales_person, status, total_amount, remark, created_by)
      VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?)
    `, [finalOrderNo, customerId, orderDate, deliveryDate, salesPerson || '', totalAmount, remark || '', req.user?.id || 1]);

    const orderId = result.insertId;

    // 插入订单明细
    for (const line of lines) {
      if (line.productId) {
        const amount = (line.quantity || 0) * (line.unitPrice || 0);
        await connection.query(`
          INSERT INTO order_lines (order_id, product_id, quantity, unit_price, amount)
          VALUES (?, ?, ?, ?, ?)
        `, [orderId, line.productId, line.quantity || 0, line.unitPrice || 0, amount]);
      }
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: '订单创建成功',
      data: { id: orderId, orderNo: finalOrderNo }
    });
  } catch (error) {
    await connection.rollback();
    console.error('创建订单错误:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: '订单号已存在' });
    }

    res.status(500).json({ success: false, message: '服务器内部错误: ' + error.message });
  } finally {
    connection.release();
  }
};

/**
 * 更新订单
 */
const updateOrder = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { id } = req.params;
    const { orderNo, customerId, orderDate, deliveryDate, salesPerson, status, remark, lines = [] } = req.body;

    // 检查订单是否存在
    const [existing] = await connection.query('SELECT id, order_no, status FROM sales_orders WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }

    const oldOrder = existing[0];
    const finalOrderNo = orderNo || oldOrder.order_no;

    await connection.beginTransaction();

    // 计算总金额
    let totalAmount = 0;
    for (const line of lines) {
      totalAmount += (line.quantity || 0) * (line.unitPrice || 0);
    }

    await connection.query(`
      UPDATE sales_orders 
      SET order_no = ?, customer_id = ?, order_date = ?, delivery_date = ?, 
          sales_person = ?, status = ?, total_amount = ?, remark = ?
      WHERE id = ?
    `, [finalOrderNo, customerId, orderDate, deliveryDate, salesPerson || '', status || 'pending', totalAmount, remark || '', id]);

    // 删除旧的订单明细
    await connection.query('DELETE FROM order_lines WHERE order_id = ?', [id]);

    // 插入新的订单明细
    for (const line of lines) {
      if (line.productId) {
        const amount = (line.quantity || 0) * (line.unitPrice || 0);
        await connection.query(`
          INSERT INTO order_lines (order_id, product_id, quantity, unit_price, amount)
          VALUES (?, ?, ?, ?, ?)
        `, [id, line.productId, line.quantity || 0, line.unitPrice || 0, amount]);
      }
    }

    await connection.commit();

    res.json({ success: true, message: '订单更新成功' });
  } catch (error) {
    await connection.rollback();
    console.error('更新订单错误:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: '订单号已存在' });
    }

    res.status(500).json({ success: false, message: '服务器内部错误: ' + error.message });
  } finally {
    connection.release();
  }
};

/**
 * 删除订单
 */
const deleteOrder = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { id } = req.params;

    const [existing] = await connection.query('SELECT id, status FROM sales_orders WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }

    // 只有 pending 能删除，否则改为 cancelled
    if (existing[0].status !== 'pending') {
      await pool.query("UPDATE sales_orders SET status = 'cancelled' WHERE id = ?", [id]);
      return res.json({ success: true, message: '订单已取消' });
    }

    await connection.beginTransaction();

    // 删除订单明细
    await connection.query('DELETE FROM order_lines WHERE order_id = ?', [id]);
    
    // 删除订单
    await connection.query('DELETE FROM sales_orders WHERE id = ?', [id]);

    await connection.commit();

    res.json({ success: true, message: '订单删除成功' });
  } catch (error) {
    await connection.rollback();
    console.error('删除订单错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  } finally {
    connection.release();
  }
};

/**
 * 获取业务员列表
 */
const getSalesPersons = async (req, res) => {
  try {
    const [result] = await pool.query(`
      SELECT DISTINCT sales_person 
      FROM sales_orders 
      WHERE sales_person IS NOT NULL AND sales_person != ''
      ORDER BY sales_person
    `);

    res.json({
      success: true,
      data: result.map(r => r.sales_person)
    });
  } catch (error) {
    console.error('获取业务员列表错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  getSalesPersons
};