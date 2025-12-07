// backend/controllers/supplierController.js
const db = require('../config/db');

/**
 * 获取供应商列表
 * GET /api/suppliers
 */
const getSuppliers = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, keyword = '', status = '' } = req.query;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (keyword) {
      whereClause += ' AND (supplier_code LIKE ? OR name LIKE ? OR contact_person LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    // 查询总数
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM suppliers ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // 查询列表
    const [suppliers] = await db.query(`
      SELECT * FROM suppliers 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(pageSize), offset]);

    res.json({
      success: true,
      data: {
        list: suppliers.map(s => ({
          id: s.id,
          supplierCode: s.supplier_code,
          name: s.name,
          contactPerson: s.contact_person,
          phone: s.phone,
          email: s.email,
          address: s.address,
          onTimeRate: s.on_time_rate,
          qualityRate: s.quality_rate,
          status: s.status,
          remark: s.remark,
          createdAt: s.created_at
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
    console.error('获取供应商列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

/**
 * 获取供应商详情
 * GET /api/suppliers/:id
 */
const getSupplierById = async (req, res) => {
  try {
    const { id } = req.params;

    const [suppliers] = await db.query('SELECT * FROM suppliers WHERE id = ?', [id]);

    if (suppliers.length === 0) {
      return res.status(404).json({
        success: false,
        message: '供应商不存在'
      });
    }

    // 获取该供应商供应的物料
    const [materials] = await db.query(`
      SELECT m.id, m.material_code, m.name, ms.is_main, ms.price, ms.lead_time
      FROM material_suppliers ms
      JOIN materials m ON ms.material_id = m.id
      WHERE ms.supplier_id = ?
    `, [id]);

    const supplier = suppliers[0];

    res.json({
      success: true,
      data: {
        id: supplier.id,
        supplierCode: supplier.supplier_code,
        name: supplier.name,
        contactPerson: supplier.contact_person,
        phone: supplier.phone,
        email: supplier.email,
        address: supplier.address,
        onTimeRate: supplier.on_time_rate,
        qualityRate: supplier.quality_rate,
        status: supplier.status,
        remark: supplier.remark,
        createdAt: supplier.created_at,
        materials: materials.map(m => ({
          id: m.id,
          materialCode: m.material_code,
          name: m.name,
          isMain: m.is_main,
          price: m.price,
          leadTime: m.lead_time
        }))
      }
    });

  } catch (error) {
    console.error('获取供应商详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

/**
 * 创建供应商
 * POST /api/suppliers
 */
const createSupplier = async (req, res) => {
  try {
    const { 
      supplierCode, 
      name, 
      contactPerson, 
      phone, 
      email, 
      address, 
      onTimeRate = 0.90,
      qualityRate = 0.95,
      remark 
    } = req.body;

    if (!supplierCode || !name) {
      return res.status(400).json({
        success: false,
        message: '供应商编码和名称不能为空'
      });
    }

    const [result] = await db.query(`
      INSERT INTO suppliers (supplier_code, name, contact_person, phone, email, address, on_time_rate, quality_rate, remark)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [supplierCode, name, contactPerson, phone, email, address, onTimeRate, qualityRate, remark]);

    res.status(201).json({
      success: true,
      message: '供应商创建成功',
      data: { id: result.insertId }
    });

  } catch (error) {
    console.error('创建供应商错误:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: '供应商编码已存在'
      });
    }

    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

/**
 * 更新供应商
 * PUT /api/suppliers/:id
 */
const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      supplierCode, 
      name, 
      contactPerson, 
      phone, 
      email, 
      address, 
      onTimeRate,
      qualityRate,
      status,
      remark 
    } = req.body;

    // 检查是否存在
    const [existing] = await db.query('SELECT id FROM suppliers WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: '供应商不存在'
      });
    }

    await db.query(`
      UPDATE suppliers 
      SET supplier_code = ?, name = ?, contact_person = ?, phone = ?, email = ?, 
          address = ?, on_time_rate = ?, quality_rate = ?, status = ?, remark = ?
      WHERE id = ?
    `, [supplierCode, name, contactPerson, phone, email, address, onTimeRate, qualityRate, status, remark, id]);

    res.json({
      success: true,
      message: '供应商更新成功'
    });

  } catch (error) {
    console.error('更新供应商错误:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: '供应商编码已存在'
      });
    }

    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

/**
 * 删除供应商
 * DELETE /api/suppliers/:id
 */
const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;

    // 检查是否存在
    const [existing] = await db.query('SELECT id FROM suppliers WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: '供应商不存在'
      });
    }

    // 检查是否有关联的采购订单
    const [pos] = await db.query('SELECT COUNT(*) as count FROM purchase_orders WHERE supplier_id = ?', [id]);
    
    if (pos[0].count > 0) {
      // 软删除
      await db.query("UPDATE suppliers SET status = 'inactive' WHERE id = ?", [id]);
      return res.json({
        success: true,
        message: '供应商已停用（存在关联采购订单，无法删除）'
      });
    }

    // 硬删除
    await db.query('DELETE FROM material_suppliers WHERE supplier_id = ?', [id]);
    await db.query('DELETE FROM suppliers WHERE id = ?', [id]);

    res.json({
      success: true,
      message: '供应商删除成功'
    });

  } catch (error) {
    console.error('删除供应商错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

module.exports = {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier
};
