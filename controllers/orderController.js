// backend/controllers/orderController.js
const db = require('../config/db');

/**
 * 获取业务订单列表
 * GET /api/sales-orders
 */
const getOrders = async (req, res) => {
  try {
    const { 
      page = 1, 
      pageSize = 20, 
      keyword = '', 
      status = '',
      startDate = '',
      endDate = '',
      salesPerson = ''
    } = req.query;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE 1=1';
    const params = [];

    // 关键字搜索（订单号、客户名）
    if (keyword) {
      whereClause += ' AND (o.order_no LIKE ? OR c.name LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    // 状态筛选
    if (status) {
      whereClause += ' AND o.status = ?';
      params.push(status);
    }

    // 日期范围
    if (startDate) {
      whereClause += ' AND o.delivery_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      whereClause += ' AND o.delivery_date <= ?';
      params.push(endDate);
    }

    // 业务员筛选
    if (salesPerson) {
      whereClause += ' AND o.sales_person = ?';
      params.push(salesPerson);
    }

    // 查询总数
    const [countResult] = await db.query(`
      SELECT COUNT(*) as total 
      FROM sales_orders o
      JOIN customers c ON o.customer_id = c.id
      ${whereClause}
    `, params);
    const total = countResult[0].total;

    // 查询订单列表
    const [orders] = await db.query(`
      SELECT o.*, 
             c.name as customer_name,
             c.customer_code,
             (SELECT GROUP_CONCAT(p.name SEPARATOR ', ')
              FROM order_lines ol
              JOIN products p ON ol.product_id = p.id
              WHERE ol.order_id = o.id) as product_names,
             (SELECT SUM(ol.quantity) FROM order_lines ol WHERE ol.order_id = o.id) as total_qty
      FROM sales_orders o
      JOIN customers c ON o.customer_id = c.id
      ${whereClause}
      ORDER BY o.delivery_date ASC, o.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(pageSize), offset]);

    res.json({
      success: true,
      data: {
        list: orders.map(o => ({
          id: o.id,
          orderNo: o.order_no,
          customerId: o.customer_id,
          customerName: o.customer_name,
          customerCode: o.customer_code,
          orderDate: o.order_date,
          deliveryDate: o.delivery_date,
          salesPerson: o.sales_person,
          status: o.status,
          remark: o.remark,
          productNames: o.product_names,
          totalQty: o.total_qty,
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
    console.error('获取订单列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

/**
 * 获取订单详情
 * GET /api/sales-orders/:id
 */
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    // 获取订单基本信息
    const [orders] = await db.query(`
      SELECT o.*, c.name as customer_name, c.customer_code
      FROM sales_orders o
      JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ?
    `, [id]);

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }

    // 获取订单明细
    const [lines] = await db.query(`
      SELECT ol.*, p.product_code, p.name as product_name
      FROM order_lines ol
      JOIN products p ON ol.product_id = p.id
      WHERE ol.order_id = ?
    `, [id]);

    const order = orders[0];

    res.json({
      success: true,
      data: {
        id: order.id,
        orderNo: order.order_no,
        customerId: order.customer_id,
        customerName: order.customer_name,
        customerCode: order.customer_code,
        orderDate: order.order_date,
        deliveryDate: order.delivery_date,
        salesPerson: order.sales_person,
        status: order.status,
        remark: order.remark,
        createdAt: order.created_at,
        lines: lines.map(l => ({
          id: l.id,
          productId: l.product_id,
          productCode: l.product_code,
          productName: l.product_name,
          quantity: l.quantity,
          unitPrice: l.unit_price,
          remark: l.remark
        }))
      }
    });

  } catch (error) {
    console.error('获取订单详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

/**
 * 创建业务订单
 * POST /api/sales-orders
 */
const createOrder = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { 
      orderNo, 
      customerId, 
      orderDate, 
      deliveryDate, 
      salesPerson, 
      remark,
      lines // [{productId, quantity, unitPrice, remark}]
    } = req.body;

    // 验证必填字段
    if (!orderNo || !customerId || !orderDate || !deliveryDate) {
      return res.status(400).json({
        success: false,
        message: '订单号、客户、下单日期和交货日期不能为空'
      });
    }

    if (!lines || lines.length === 0) {
      return res.status(400).json({
        success: false,
        message: '订单明细不能为空'
      });
    }

    await connection.beginTransaction();

    // 创建订单主表
    const [orderResult] = await connection.query(`
      INSERT INTO sales_orders (order_no, customer_id, order_date, delivery_date, sales_person, remark, created_by, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `, [orderNo, customerId, orderDate, deliveryDate, salesPerson, remark, req.user.id]);

    const orderId = orderResult.insertId;

    // 创建订单明细
    const lineValues = lines.map(line => [
      orderId,
      line.productId,
      line.quantity,
      line.unitPrice || null,
      line.remark || null
    ]);

    await connection.query(`
      INSERT INTO order_lines (order_id, product_id, quantity, unit_price, remark)
      VALUES ?
    `, [lineValues]);

    await connection.commit();

    res.status(201).json({
      success: true,
      message: '订单创建成功',
      data: { id: orderId, orderNo }
    });

  } catch (error) {
    await connection.rollback();
    console.error('创建订单错误:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: '订单号已存在'
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
 * 更新业务订单
 * PUT /api/sales-orders/:id
 */
const updateOrder = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { id } = req.params;
    const { 
      orderNo, 
      customerId, 
      orderDate, 
      deliveryDate, 
      salesPerson, 
      status,
      remark,
      lines
    } = req.body;

    // 检查订单是否存在
    const [existing] = await connection.query('SELECT id, status FROM sales_orders WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }

    // 已完成或已取消的订单不能修改
    if (['completed', 'cancelled'].includes(existing[0].status)) {
      return res.status(400).json({
        success: false,
        message: '已完成或已取消的订单不能修改'
      });
    }

    await connection.beginTransaction();

    // 更新订单主表
    await connection.query(`
      UPDATE sales_orders 
      SET order_no = ?, customer_id = ?, order_date = ?, delivery_date = ?, 
          sales_person = ?, status = ?, remark = ?
      WHERE id = ?
    `, [orderNo, customerId, orderDate, deliveryDate, salesPerson, status, remark, id]);

    // 如果有明细更新
    if (lines && lines.length > 0) {
      // 删除旧明细
      await connection.query('DELETE FROM order_lines WHERE order_id = ?', [id]);

      // 插入新明细
      const lineValues = lines.map(line => [
        id,
        line.productId,
        line.quantity,
        line.unitPrice || null,
        line.remark || null
      ]);

      await connection.query(`
        INSERT INTO order_lines (order_id, product_id, quantity, unit_price, remark)
        VALUES ?
      `, [lineValues]);
    }

    await connection.commit();

    res.json({
      success: true,
      message: '订单更新成功'
    });

  } catch (error) {
    await connection.rollback();
    console.error('更新订单错误:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: '订单号已存在'
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
 * 删除业务订单
 * DELETE /api/sales-orders/:id
 */
const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    // 检查订单是否存在
    const [existing] = await db.query('SELECT id, status FROM sales_orders WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }

    // 只有管理员可以删除已确认的订单
    if (existing[0].status !== 'pending' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '只有待确认的订单可以删除'
      });
    }

    // 软删除：将状态改为 cancelled
    await db.query("UPDATE sales_orders SET status = 'cancelled' WHERE id = ?", [id]);

    res.json({
      success: true,
      message: '订单已取消'
    });

  } catch (error) {
    console.error('删除订单错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

/**
 * 获取业务员列表（用于筛选）
 */
const getSalesPersons = async (req, res) => {
  try {
    const [result] = await db.query(`
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
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
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
