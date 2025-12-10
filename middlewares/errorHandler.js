// middlewares/errorHandler.js - 统一错误处理中间件

/**
 * 自定义错误类
 */
class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 异步错误捕获包装器
 * 用法: asyncHandler(async (req, res) => { ... })
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 全局错误处理中间件
 */
const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // MySQL 错误处理
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(400).json({
      success: false,
      message: '该记录已存在，请检查唯一字段'
    });
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      success: false,
      message: '关联的记录不存在，请检查外键'
    });
  }

  if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(400).json({
      success: false,
      message: '该记录被其他数据引用，无法删除'
    });
  }

  if (err.code === 'ER_BAD_FIELD_ERROR') {
    return res.status(400).json({
      success: false,
      message: '数据库字段错误，请联系管理员'
    });
  }

  // JWT 错误
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: '无效的身份验证令牌'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: '身份验证令牌已过期，请重新登录'
    });
  }

  // 验证错误
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors || {}).map(e => e.message).join(', ');
    return res.status(400).json({
      success: false,
      message: message || '数据验证失败'
    });
  }

  // 权限错误
  if (err.statusCode === 403) {
    return res.status(403).json({
      success: false,
      message: '您没有权限执行此操作'
    });
  }

  // 默认错误处理
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : '服务器内部错误';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && {
      error: err.message,
      stack: err.stack
    })
  });
};

/**
 * 404 错误处理
 */
const notFound = (req, res, next) => {
  const error = new AppError(`请求的资源未找到: ${req.originalUrl}`, 404);
  next(error);
};

module.exports = {
  AppError,
  asyncHandler,
  errorHandler,
  notFound
};