// services/orderService.js
const { pool } = require('../config/database');

const generateOrderNo = async (connection) => {
  const today = new Date();
  const prefix = `SO${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;
  const [result] = await connection.query(
    "SELECT MAX(order_no) as maxNo FROM sales_orders WHERE order_no LIKE ?",
    [`${prefix}%`]
  );
  let seq = 1;
  if (result[0].maxNo) {
    seq = parseInt(result[0].maxNo.slice(-4)) + 1;
  }
  return `${prefix}${String(seq).padStart(4, '0')}`;
};

const calculateTotalAmount = (lines) => {
  if (!lines || lines.length === 0) return 0;
  return lines.reduce((total, line) => {
    return total + (parseFloat(line.quantity) || 0) * (parseFloat(line.unitPrice) || 0);
  }, 0);
};

const transformOrderData = (order) => {
  return {
    id: order.id,
    orderNo: order.order_no,
    customerId: order.customer_id,
    customerName: order.customer_name,
    orderDate: order.order_date,
    deliveryDate: order.delivery_date,
    salesPerson: order.sales_person,
    status: order.status,
    totalAmount: parseFloat(order.total_amount || 0),
    remark: order.remark,
    createdAt: order.created_at
  };
};

module.exports = { generateOrderNo, calculateTotalAmount, transformOrderData };