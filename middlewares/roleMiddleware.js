// backend/middlewares/roleMiddleware.js

/**
 * 角色权限中间件
 * @param {string[]} allowedRoles - 允许访问的角色代码数组
 * @returns {Function} Express中间件
 * 
 * 使用示例:
 *   router.post('/users', authMiddleware, roleMiddleware(['admin']), createUser);
 *   router.get('/orders', authMiddleware, roleMiddleware(['admin', 'sales']), getOrders);
 */
const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    // 确保已经通过 authMiddleware 验证
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未认证的请求'
      });
    }

    const userRole = req.user.role;

    // 检查用户角色是否在允许列表中
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `权限不足，需要 [${allowedRoles.join(' 或 ')}] 角色`,
        requiredRoles: allowedRoles,
        currentRole: userRole
      });
    }

    next();
  };
};

/**
 * 预定义的角色常量
 */
const ROLES = {
  ADMIN: 'admin',
  SALES: 'sales',
  PURCHASER: 'purchaser'
};

/**
 * 便捷的权限组合
 */
const PERMISSIONS = {
  // 只有管理员
  ADMIN_ONLY: [ROLES.ADMIN],
  
  // 管理员 + 业务员
  SALES_ACCESS: [ROLES.ADMIN, ROLES.SALES],
  
  // 管理员 + 采购员
  PURCHASER_ACCESS: [ROLES.ADMIN, ROLES.PURCHASER],
  
  // 所有角色
  ALL_ROLES: [ROLES.ADMIN, ROLES.SALES, ROLES.PURCHASER]
};

/**
 * 👉 关键：根据 role_id 返回权限数组
 * 这里直接用硬编码映射，不需要改数据库
 */
async function getUserPermissions(roleId) {
  // 你当前 roles 表里：1=admin, 2=sales, 3=purchaser :contentReference[oaicite:4]{index=4}
  const ROLE_PERMISSIONS = {
    1: [ // admin
      'VIEW_DASHBOARD',
      'MANAGE_USERS',
      'MANAGE_PRODUCTS',
      'MANAGE_SALES_ORDERS',
      'MANAGE_PURCHASE_ORDERS',
      'MANAGE_MATERIALS',
      'VIEW_WARNINGS'
    ],
    2: [ // sales
      'VIEW_DASHBOARD',
      'VIEW_PRODUCTS',
      'VIEW_SALES_ORDERS',
      'EDIT_SALES_ORDERS',
      'VIEW_WARNINGS'
    ],
    3: [ // purchaser
      'VIEW_DASHBOARD',
      'VIEW_MATERIALS',
      'EDIT_MATERIALS',
      'VIEW_PURCHASE_ORDERS',
      'EDIT_PURCHASE_ORDERS',
      'VIEW_WARNINGS'
    ]
  };

  // 确保 roleId 是数字
  const id = Number(roleId);
  return ROLE_PERMISSIONS[id] || [];
}

module.exports = {
  roleMiddleware,
  ROLES,
  PERMISSIONS,
  getUserPermissions // ✅ 一定要导出去
};
