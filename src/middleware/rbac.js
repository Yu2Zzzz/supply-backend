// src/middleware/rbac.js
const { getUserPermissions } = require('./auth');

/**
 * 角色检查中间件
 * @param {string[]} allowedRoles - 允许的角色代码数组
 */
const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '请先登录',
        code: 'UNAUTHORIZED'
      });
    }

    const userRole = req.user.roleCode;
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: '您没有权限执行此操作',
        code: 'FORBIDDEN',
        requiredRoles: allowedRoles,
        currentRole: userRole
      });
    }

    next();
  };
};

/**
 * 权限检查中间件
 * @param {string|string[]} requiredPermissions - 需要的权限代码
 * @param {string} mode - 'any' 满足任一即可, 'all' 需要全部满足
 */
const permissionMiddleware = (requiredPermissions, mode = 'any') => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '请先登录',
        code: 'UNAUTHORIZED'
      });
    }

    try {
      // 管理员拥有所有权限
      if (req.user.roleCode === 'admin') {
        return next();
      }

      const userPermissions = await getUserPermissions(req.user.roleId);
      const permsToCheck = Array.isArray(requiredPermissions) 
        ? requiredPermissions 
        : [requiredPermissions];

      let hasPermission = false;
      
      if (mode === 'any') {
        hasPermission = permsToCheck.some(p => userPermissions.includes(p));
      } else {
        hasPermission = permsToCheck.every(p => userPermissions.includes(p));
      }

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: '您没有权限执行此操作',
          code: 'PERMISSION_DENIED',
          required: permsToCheck,
          mode
        });
      }

      // 缓存用户权限到请求对象，后续可能用到
      req.userPermissions = userPermissions;
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({
        success: false,
        message: '权限验证异常'
      });
    }
  };
};

/**
 * 便捷权限检查方法
 */
const requirePermission = {
  // 业务订单
  ordersRead: permissionMiddleware('orders:read'),
  ordersWrite: permissionMiddleware('orders:write'),
  ordersDelete: permissionMiddleware('orders:delete'),
  
  // 产品
  productsRead: permissionMiddleware('products:read'),
  productsWrite: permissionMiddleware('products:write'),
  productsDelete: permissionMiddleware('products:delete'),
  
  // 物料
  materialsRead: permissionMiddleware('materials:read'),
  materialsWrite: permissionMiddleware('materials:write'),
  materialsDelete: permissionMiddleware('materials:delete'),
  
  // 供应商
  suppliersRead: permissionMiddleware('suppliers:read'),
  suppliersWrite: permissionMiddleware('suppliers:write'),
  suppliersDelete: permissionMiddleware('suppliers:delete'),
  
  // 仓库
  warehousesRead: permissionMiddleware('warehouses:read'),
  warehousesWrite: permissionMiddleware('warehouses:write'),
  warehousesDelete: permissionMiddleware('warehouses:delete'),
  
  // 库存
  inventoryRead: permissionMiddleware('inventory:read'),
  inventoryWrite: permissionMiddleware('inventory:write'),
  
  // 采购
  purchaseRead: permissionMiddleware('purchase:read'),
  purchaseWrite: permissionMiddleware('purchase:write'),
  purchaseDelete: permissionMiddleware('purchase:delete'),
  
  // 用户管理
  usersRead: permissionMiddleware('users:read'),
  usersWrite: permissionMiddleware('users:write'),
  usersDelete: permissionMiddleware('users:delete'),
  
  // 预警
  warningsRead: permissionMiddleware('warnings:read'),
};

// 角色快捷方法
const onlyAdmin = roleMiddleware(['admin']);
const onlySales = roleMiddleware(['sales', 'admin']);
const onlyPurchaser = roleMiddleware(['purchaser', 'admin']);
const salesOrPurchaser = roleMiddleware(['sales', 'purchaser', 'admin']);

module.exports = {
  roleMiddleware,
  permissionMiddleware,
  requirePermission,
  onlyAdmin,
  onlySales,
  onlyPurchaser,
  salesOrPurchaser
};
