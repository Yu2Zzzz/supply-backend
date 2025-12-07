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

module.exports = {
  roleMiddleware,
  ROLES,
  PERMISSIONS
};
