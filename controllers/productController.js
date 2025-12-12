// backend/controllers/productController.js
const createCrudController = require('./crudFactory');
const { pool } = require('../config/database');

// 使用工厂函数创建基础CRUD
const baseCrud = createCrudController({
  tableName: 'products',
  displayName: '产品',
  searchFields: ['product_code', 'name', 'category'],
  selectFields: ['id', 'product_code', 'name', 'category', 'description', 'unit', 'status', 'created_at', 'updated_at'],
  orderBy: 'created_at DESC'
});

/**
 * 获取产品列表（扩展版，包含BOM物料数量）
 */
const getProducts = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, keyword = '', status = '' } = req.query;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (keyword) {
      whereClause += ' AND (p.product_code LIKE ? OR p.name LIKE ? OR p.category LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    if (status) {
      whereClause += ' AND p.status = ?';
      params.push(status);
    }

    // 查询总数
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM products p ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // 查询列表（包含BOM物料数量）
    const [products] = await pool.query(`
      SELECT p.*, 
             (SELECT COUNT(*) FROM bom b WHERE b.product_id = p.id) as material_count
      FROM products p
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(pageSize), offset]);

    res.json({
      success: true,
      data: {
        list: products.map(p => ({
          id: p.id,
          productCode: p.product_code,
          name: p.name,
          category: p.category,
          description: p.description,
          unit: p.unit,
          status: p.status,
          materialCount: p.material_count,
          createdAt: p.created_at,
          updatedAt: p.updated_at
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
    console.error('获取产品列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

/**
 * 获取产品详情（包含BOM）
 */
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // 获取产品信息
    const [products] = await pool.query(
      'SELECT * FROM products WHERE id = ?',
      [id]
    );

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: '产品不存在'
      });
    }

    // 获取BOM物料
    const [bomItems] = await pool.query(`
      SELECT b.*, m.material_code, m.name as material_name, m.spec, m.unit
      FROM bom b
      JOIN materials m ON b.material_id = m.id
      WHERE b.product_id = ?
    `, [id]);

    const product = products[0];

    res.json({
      success: true,
      data: {
        id: product.id,
        productCode: product.product_code,
        name: product.name,
        category: product.category,
        description: product.description,
        unit: product.unit,
        status: product.status,
        createdAt: product.created_at,
        updatedAt: product.updated_at,
        bomItems: bomItems.map(b => ({
          id: b.id,
          materialId: b.material_id,
          materialCode: b.material_code,
          materialName: b.material_name,
          spec: b.spec,
          unit: b.unit,
          quantity: b.quantity
        }))
      }
    });

  } catch (error) {
    console.error('获取产品详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

/**
 * 创建产品
 */
const createProduct = async (req, res) => {
  try {
    const { productCode, name, category, description, unit = 'PCS', status = 'active' } = req.body;

    if (!productCode || !name) {
      return res.status(400).json({
        success: false,
        message: '产品编码和名称不能为空'
      });
    }

    const [result] = await pool.query(`
      INSERT INTO products (product_code, name, category, description, unit, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [productCode, name, category, description, unit, status]);

    res.status(201).json({
      success: true,
      message: '产品创建成功',
      data: { id: result.insertId }
    });

  } catch (error) {
    console.error('创建产品错误:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: '产品编码已存在'
      });
    }

    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

/**
 * 更新产品
 */
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { productCode, name, category, description, unit, status } = req.body;

    // 检查产品是否存在
    const [existing] = await pool.query('SELECT id FROM products WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: '产品不存在'
      });
    }

    await pool.query(`
      UPDATE products 
      SET product_code = ?, name = ?, category = ?, description = ?, unit = ?, status = ?
      WHERE id = ?
    `, [productCode, name, category, description, unit, status, id]);

    res.json({
      success: true,
      message: '产品更新成功'
    });

  } catch (error) {
    console.error('更新产品错误:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: '产品编码已存在'
      });
    }

    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

/**
 * 删除产品
 */
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // 检查产品是否存在
    const [existing] = await pool.query('SELECT id FROM products WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: '产品不存在'
      });
    }

    // 检查是否有关联订单
    const [orders] = await pool.query(
      'SELECT COUNT(*) as count FROM order_lines WHERE product_id = ?',
      [id]
    );

    if (orders[0].count > 0) {
      // 软删除
      await pool.query("UPDATE products SET status = 'inactive' WHERE id = ?", [id]);
      return res.json({
        success: true,
        message: '产品已停用（存在关联订单，无法删除）'
      });
    }

    // 硬删除（会级联删除BOM）
    await pool.query('DELETE FROM products WHERE id = ?', [id]);

    res.json({
      success: true,
      message: '产品删除成功'
    });

  } catch (error) {
    console.error('删除产品错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

/**
 * 更新产品BOM
 */
const updateProductBom = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { id } = req.params;
    const { bomItems } = req.body; // [{materialId, quantity}]

    await connection.beginTransaction();

    // 检查产品是否存在
    const [existing] = await connection.query('SELECT id FROM products WHERE id = ?', [id]);
    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: '产品不存在'
      });
    }

    // 删除旧的BOM
    await connection.query('DELETE FROM bom WHERE product_id = ?', [id]);

    // 插入新的BOM
    if (bomItems && bomItems.length > 0) {
      const values = bomItems.map(item => [id, item.materialId, item.quantity]);
      await connection.query(
        'INSERT INTO bom (product_id, material_id, quantity) VALUES ?',
        [values]
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'BOM更新成功'
    });

  } catch (error) {
    await connection.rollback();
    console.error('更新BOM错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductBom
};