// backend/controllers/orderController.js - 修复版本
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

/**
 * ✅ 获取订单详情 - 修复：支持订单号和数字 ID
 */
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // ✅ 关键修复：判断是订单号还是数字 ID
    const isOrderNo = isNaN(id);
    const field = isOrderNo ? 'o.order_no' : 'o.id';
    
    console.log(`🔍 Fetching order by ${field}:`, id);

    // 获取订单基本信息
    const [orders] = await pool.query(`
      SELECT 
        o.id, o.order_no, o.customer_id, o.order_date, o.delivery_date,
        o.sales_person, o.status, o.total_amount, o.remark, o.created_at,
        c.name as customer_name, c.customer_code, c.contact_person, c.phone
      FROM sales_orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE ${field} = ?
    `, [id]);

    if (orders.length === 0) {
      console.log('❌ 订单未找到:', id);
      return res.status(404).json({ 
        success: false, 
        message: '订单不存在' 
      });
    }

    const order = orders[0];
    console.log('✅ Found order:', order.id, order.order_no);

    // 获取订单明细
    const [lines] = await pool.query(`
      SELECT 
        ol.id, ol.product_id, ol.quantity, ol.unit_price, ol.amount, ol.remark,
        p.name as product_name, p.product_code, p.spec, p.unit
      FROM order_lines ol
      LEFT JOIN products p ON ol.product_id = p.id
      WHERE ol.order_id = ?
      ORDER BY ol.id
    `, [order.id]);

    console.log(`✅ Found ${lines.length} order lines`);

    // 返回数据
    res.json({
      success: true,
      data: {
        id: order.id,
        orderNo: order.order_no,
        customerId: order.customer_id,
        customerName: order.customer_name,
        customerCode: order.customer_code,
        contactPerson: order.contact_person,
        phone: order.phone,
        orderDate: order.order_date,
        deliveryDate: order.delivery_date,
        salesPerson: order.sales_person,
        status: order.status,
        totalAmount: parseFloat(order.total_amount || 0),
        remark: order.remark,
        createdAt: order.created_at,
        lines: lines.map(l => ({
          id: l.id,
          productId: l.product_id,
          productName: l.product_name,
          productCode: l.product_code,
          spec: l.spec,
          unit: l.unit,
          quantity: parseFloat(l.quantity),
          unitPrice: parseFloat(l.unit_price || 0),
          amount: parseFloat(l.amount || 0),
          remark: l.remark
        }))
      }
    });
  } catch (error) {
    console.error('❌ 获取订单详情错误:', error);
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
  let connection;
  try {
    connection = await pool.getConnection();
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
    if (connection) await connection.rollback();
    console.error('创建订单错误:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: '订单号已存在' });
    }

    res.status(500).json({ success: false, message: '服务器内部错误: ' + error.message });
  } finally {
    if (connection) connection.release();
  }
};

/**
 * 更新订单
 */
const updateOrder = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
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
    if (connection) await connection.rollback();
    console.error('更新订单错误:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: '订单号已存在' });
    }

    res.status(500).json({ success: false, message: '服务器内部错误: ' + error.message });
  } finally {
    if (connection) connection.release();
  }
};

/**
 * 删除订单
 */
const deleteOrder = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const { id } = req.params;

    const [existing] = await connection.query('SELECT id, status FROM sales_orders WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }

    // 只有 pending 能删除，否则改为 cancelled
    if (existing[0].status !== 'pending') {
      await connection.query("UPDATE sales_orders SET status = 'cancelled' WHERE id = ?", [id]);
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
    if (connection) await connection.rollback();
    console.error('删除订单错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  } finally {
    if (connection) connection.release();
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