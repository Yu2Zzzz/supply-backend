// backend/routes/index.js - 优化版本
const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const { roleMiddleware, PERMISSIONS } = require('../middlewares/roleMiddleware');

// Controllers
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const productController = require('../controllers/productController');
const orderController = require('../controllers/orderController');
const supplierController = require('../controllers/supplierController');
const warehouseController = require('../controllers/warehouseController');
const materialController = require('../controllers/materialController');
const purchaseController = require('../controllers/purchaseController');
const inventoryController = require('../controllers/inventoryController');

// ==================== 认证路由（无需登录） ====================
router.post('/auth/login', authController.login);

// ==================== 需要登录的路由 ====================
router.use(authMiddleware); // 以下所有路由都需要登录

// 获取当前用户信息
router.get('/auth/me', authController.getCurrentUser);
router.post('/auth/change-password', authController.changePassword);

// ==================== 用户管理（仅管理员） ====================
router.get('/roles', userController.getRoles);
router.get('/users', roleMiddleware(PERMISSIONS.ADMIN_ONLY), userController.getUsers);
router.post('/users', roleMiddleware(PERMISSIONS.ADMIN_ONLY), userController.createUser);
router.put('/users/:id', roleMiddleware(PERMISSIONS.ADMIN_ONLY), userController.updateUser);
router.post('/users/:id/reset-password', roleMiddleware(PERMISSIONS.ADMIN_ONLY), userController.resetPassword);
router.delete('/users/:id', roleMiddleware(PERMISSIONS.ADMIN_ONLY), userController.deleteUser);

// ==================== 产品管理（优化权限） ====================
// ✅ 修复：业务员需要读取产品列表来创建订单
router.get('/products', roleMiddleware(PERMISSIONS.ALL_ROLES), productController.getProducts);
router.get('/products/:id', roleMiddleware(PERMISSIONS.ALL_ROLES), productController.getProductById);

// 只有管理员可以修改产品
router.post('/products', roleMiddleware(PERMISSIONS.ADMIN_ONLY), productController.createProduct);
router.put('/products/:id', roleMiddleware(PERMISSIONS.ADMIN_ONLY), productController.updateProduct);
router.delete('/products/:id', roleMiddleware(PERMISSIONS.ADMIN_ONLY), productController.deleteProduct);
router.put('/products/:id/bom', roleMiddleware(PERMISSIONS.ADMIN_ONLY), productController.updateProductBom);

// ==================== 业务订单管理 ====================
// 管理员 + 业务员
router.get('/sales-orders', roleMiddleware(PERMISSIONS.SALES_ACCESS), orderController.getOrders);
router.get('/sales-orders/sales-persons', roleMiddleware(PERMISSIONS.SALES_ACCESS), orderController.getSalesPersons);
router.get('/sales-orders/:id', roleMiddleware(PERMISSIONS.SALES_ACCESS), orderController.getOrderById);
router.post('/sales-orders', roleMiddleware(PERMISSIONS.SALES_ACCESS), orderController.createOrder);
router.put('/sales-orders/:id', roleMiddleware(PERMISSIONS.SALES_ACCESS), orderController.updateOrder);
router.delete('/sales-orders/:id', roleMiddleware(PERMISSIONS.SALES_ACCESS), orderController.deleteOrder);

// ==================== 客户管理 ====================
// ✅ 优化：使用独立的 controller
const db = require('../config/db');
const { success, error } = require('../utils/response');

// 获取客户列表
router.get('/customers', roleMiddleware(PERMISSIONS.SALES_ACCESS), async (req, res) => {
  try {
    const { page = 1, pageSize = 100, keyword = '', status = 'active' } = req.query;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    if (keyword) {
      whereClause += ' AND (customer_code LIKE ? OR name LIKE ? OR contact_person LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    // 查询总数
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM customers ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // 查询列表
    const [customers] = await db.query(`
      SELECT id, customer_code, name, contact_person, phone, email, address, status, created_at
      FROM customers 
      ${whereClause}
      ORDER BY name
      LIMIT ? OFFSET ?
    `, [...params, parseInt(pageSize), offset]);

    res.json({
      success: true,
      data: {
        list: customers.map(c => ({
          id: c.id,
          customerCode: c.customer_code,
          name: c.name,
          contactPerson: c.contact_person,
          phone: c.phone,
          email: c.email,
          address: c.address,
          status: c.status,
          createdAt: c.created_at
        })),
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    });
  } catch (err) {
    console.error('获取客户列表错误:', err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 创建客户
router.post('/customers', roleMiddleware(PERMISSIONS.SALES_ACCESS), async (req, res) => {
  try {
    const { customerCode, name, contactPerson, phone, email, address } = req.body;
    
    if (!customerCode || !name) {
      return res.status(400).json({ success: false, message: '客户编码和名称不能为空' });
    }

    const [result] = await db.query(
      'INSERT INTO customers (customer_code, name, contact_person, phone, email, address) VALUES (?, ?, ?, ?, ?, ?)',
      [customerCode, name, contactPerson, phone, email, address]
    );
    
    res.status(201).json({ 
      success: true, 
      message: '客户创建成功',
      data: { id: result.insertId } 
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: '客户编码已存在' });
    }
    console.error('创建客户错误:', err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// ==================== 供应商管理 ====================
// 管理员 + 采购员
router.get('/suppliers', roleMiddleware(PERMISSIONS.PURCHASER_ACCESS), supplierController.getSuppliers);
router.get('/suppliers/:id', roleMiddleware(PERMISSIONS.PURCHASER_ACCESS), supplierController.getSupplierById);
router.post('/suppliers', roleMiddleware(PERMISSIONS.PURCHASER_ACCESS), supplierController.createSupplier);
router.put('/suppliers/:id', roleMiddleware(PERMISSIONS.PURCHASER_ACCESS), supplierController.updateSupplier);
router.delete('/suppliers/:id', roleMiddleware(PERMISSIONS.PURCHASER_ACCESS), supplierController.deleteSupplier);

// ==================== 仓库管理 ====================
// 管理员 + 采购员
router.get('/warehouses', roleMiddleware(PERMISSIONS.PURCHASER_ACCESS), warehouseController.getWarehouses);
router.get('/warehouses/:id', roleMiddleware(PERMISSIONS.PURCHASER_ACCESS), warehouseController.getWarehouseById);
router.post('/warehouses', roleMiddleware(PERMISSIONS.PURCHASER_ACCESS), warehouseController.createWarehouse);
router.put('/warehouses/:id', roleMiddleware(PERMISSIONS.PURCHASER_ACCESS), warehouseController.updateWarehouse);
router.delete('/warehouses/:id', roleMiddleware(PERMISSIONS.PURCHASER_ACCESS), warehouseController.deleteWarehouse);

// ==================== 库存管理 ====================
// 管理员 + 采购员
router.get('/inventory', roleMiddleware(PERMISSIONS.PURCHASER_ACCESS), inventoryController.getInventory);
router.get('/inventory/:id', roleMiddleware(PERMISSIONS.PURCHASER_ACCESS), inventoryController.getInventoryById);
router.post('/inventory', roleMiddleware(PERMISSIONS.PURCHASER_ACCESS), inventoryController.createInventory);
router.put('/inventory/:id', roleMiddleware(PERMISSIONS.PURCHASER_ACCESS), inventoryController.updateInventory);
router.delete('/inventory/:id', roleMiddleware(PERMISSIONS.PURCHASER_ACCESS), inventoryController.deleteInventory);
router.post('/inventory/:id/adjust', roleMiddleware(PERMISSIONS.PURCHASER_ACCESS), inventoryController.adjustInventory);

// ==================== 物料管理 ====================
// 管理员 + 采购员
router.get('/materials', roleMiddleware(PERMISSIONS.PURCHASER_ACCESS), materialController.getMaterials);
router.get('/materials/buyers', roleMiddleware(PERMISSIONS.PURCHASER_ACCESS), materialController.getBuyers);
router.get('/materials/:id', roleMiddleware(PERMISSIONS.PURCHASER_ACCESS), materialController.getMaterialById);
router.post('/materials', roleMiddleware(PERMISSIONS.PURCHASER_ACCESS), materialController.createMaterial);
router.put('/materials/:id', roleMiddleware(PERMISSIONS.PURCHASER_ACCESS), materialController.updateMaterial);
router.delete('/materials/:id', roleMiddleware(PERMISSIONS.PURCHASER_ACCESS), materialController.deleteMaterial);
router.put('/materials/:id/inventory', roleMiddleware(PERMISSIONS.PURCHASER_ACCESS), materialController.updateInventory);

// ==================== 采购订单管理 ====================
// 管理员 + 采购员
router.get('/purchase-orders', roleMiddleware(PERMISSIONS.PURCHASER_ACCESS), purchaseController.getPurchaseOrders);
router.get('/purchase-orders/generate-no', roleMiddleware(PERMISSIONS.PURCHASER_ACCESS), purchaseController.generatePoNo);
router.get('/purchase-orders/:id', roleMiddleware(PERMISSIONS.PURCHASER_ACCESS), purchaseController.getPurchaseOrderById);
router.post('/purchase-orders', roleMiddleware(PERMISSIONS.PURCHASER_ACCESS), purchaseController.createPurchaseOrder);
router.put('/purchase-orders/:id', roleMiddleware(PERMISSIONS.PURCHASER_ACCESS), purchaseController.updatePurchaseOrder);
router.delete('/purchase-orders/:id', roleMiddleware(PERMISSIONS.PURCHASER_ACCESS), purchaseController.deletePurchaseOrder);
router.post('/purchase-orders/:id/confirm', roleMiddleware(PERMISSIONS.PURCHASER_ACCESS), purchaseController.confirmPurchaseOrder);

// ==================== 预警数据（所有已登录用户可访问，但返回内容根据角色过滤） ====================
router.get('/warnings', async (req, res) => {
  try {
    const userRole = req.user.role;
    
    let query = `
      SELECT w.*, 
             m.material_code, m.name as material_name, m.buyer,
             p.product_code, p.name as product_name,
             o.order_no
      FROM warnings w
      LEFT JOIN materials m ON w.material_id = m.id
      LEFT JOIN products p ON w.product_id = p.id
      LEFT JOIN sales_orders o ON w.order_id = o.id
      WHERE w.is_resolved = FALSE
    `;

    // 业务员只能看到订单相关的预警
    if (userRole === 'sales') {
      query += ' AND w.order_id IS NOT NULL';
    }
    // 采购员只能看到物料相关的预警
    else if (userRole === 'purchaser') {
      query += ' AND w.material_id IS NOT NULL';
    }
    // 管理员可以看到所有

    query += ' ORDER BY FIELD(w.level, "RED", "ORANGE", "YELLOW", "BLUE"), w.created_at DESC';

    const [warnings] = await db.query(query);

    res.json({
      success: true,
      data: warnings.map(w => ({
        id: w.id,
        level: w.level,
        materialId: w.material_id,
        materialCode: w.material_code,
        materialName: w.material_name,
        buyer: w.buyer,
        productId: w.product_id,
        productCode: w.product_code,
        productName: w.product_name,
        orderId: w.order_id,
        orderNo: w.order_no,
        warningType: w.warning_type,
        message: w.message,
        createdAt: w.created_at
      }))
    });

  } catch (err) {
    console.error('获取预警数据错误:', err);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// ==================== 仪表板数据（兼容旧接口） ====================
router.get('/data', async (req, res) => {
  try {
    const userRole = req.user.role;
    const result = {};

    // 管理员和业务员可以看订单
    if (['admin', 'sales'].includes(userRole)) {
      const [orders] = await db.query(`
        SELECT o.id, o.order_no, c.name as customer, o.order_date, o.delivery_date, o.sales_person
        FROM sales_orders o
        JOIN customers c ON o.customer_id = c.id
        WHERE o.status NOT IN ('completed', 'cancelled')
        ORDER BY o.delivery_date ASC
      `);
      result.orders = orders.map(o => ({
        id: o.order_no,
        customer: o.customer,
        orderDate: o.order_date,
        deliveryDate: o.delivery_date,
        salesPerson: o.sales_person
      }));

      const [orderLines] = await db.query(`
        SELECT ol.order_id, o.order_no as orderId, p.product_code as productCode, 
               p.name as productName, ol.quantity as qty
        FROM order_lines ol
        JOIN sales_orders o ON ol.order_id = o.id
        JOIN products p ON ol.product_id = p.id
        WHERE o.status NOT IN ('completed', 'cancelled')
      `);
      result.orderLines = orderLines;
    }

    // 管理员和采购员可以看物料
    if (['admin', 'purchaser'].includes(userRole)) {
      const [mats] = await db.query(`
        SELECT m.*, 
               COALESCE((SELECT SUM(i.quantity) FROM inventory i WHERE i.material_id = m.id), 0) as inv,
               COALESCE((SELECT SUM(it.quantity) FROM in_transit it WHERE it.material_id = m.id), 0) as transit,
               (SELECT COUNT(*) FROM material_suppliers ms WHERE ms.material_id = m.id) as suppliers
        FROM materials m
        WHERE m.status = 'active'
      `);
      result.mats = mats.map(m => ({
        code: m.material_code,
        name: m.name,
        spec: m.spec,
        unit: m.unit,
        price: parseFloat(m.price) || 0,
        inv: parseInt(m.inv) || 0,
        transit: parseInt(m.transit) || 0,
        safe: m.safe_stock,
        lead: m.lead_time,
        suppliers: parseInt(m.suppliers) || 0,
        buyer: m.buyer
      }));

      // 采购订单
      const [pos] = await db.query(`
        SELECT po.po_no as po, m.material_code as mat, s.name as supplier,
               po.quantity as qty, po.total_amount as amt, po.expected_date as date, po.status
        FROM purchase_orders po
        JOIN materials m ON po.material_id = m.id
        JOIN suppliers s ON po.supplier_id = s.id
        WHERE po.status NOT IN ('arrived', 'cancelled')
      `);
      result.pos = pos;

      // 供应商
      const [suppliers] = await db.query(`
        SELECT ms.material_id, m.material_code as mat, s.id, s.name, 
               ms.is_main as main, s.on_time_rate as onTime, s.quality_rate as quality
        FROM material_suppliers ms
        JOIN materials m ON ms.material_id = m.id
        JOIN suppliers s ON ms.supplier_id = s.id
      `);
      result.suppliers = suppliers.map(s => ({
        mat: s.mat,
        id: s.id.toString(),
        name: s.name,
        main: s.main === 1,
        onTime: parseFloat(s.onTime) || 0,
        quality: parseFloat(s.quality) || 0
      }));
    }

    // 产品和BOM（管理员和采购员可以看）
    if (['admin', 'purchaser'].includes(userRole)) {
      const [products] = await db.query('SELECT product_code as code, name FROM products WHERE status = "active"');
      result.products = products;

      const [bom] = await db.query(`
        SELECT p.product_code as p, m.material_code as m, b.quantity as c
        FROM bom b
        JOIN products p ON b.product_id = p.id
        JOIN materials m ON b.material_id = m.id
      `);
      result.bom = bom;
    }

    res.json(result);

  } catch (err) {
    console.error('获取仪表板数据错误:', err);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

module.exports = router;