// backend/server.js - 优化版本
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const responseTime = require('response-time');
require('dotenv').config();

const routes = require('./routes');

// ============ 日志配置 ============
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// 开发环境同时输出到控制台
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// ============ Express 应用配置 ============
const app = express();
const PORT = process.env.PORT || 4000;

// 🚀 修复 Railway / Docker / Nginx 代理导致的 Rate Limit 报错
// 必须在使用 rateLimit 之前设置
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1); // 表示信任一层反向代理
}

// ============ 安全中间件 ============
// Helmet - 设置安全的 HTTP 头
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// ============ CORS 配置优化 ============
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // 允许无 origin 的请求（比如移动应用、Postman）
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24小时预检缓存
}));

// ============ 性能优化中间件 ============
// Gzip 压缩
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6 // 压缩级别 1-9，6 是平衡点
}));

// 响应时间记录
app.use(responseTime((req, res, time) => {
  logger.info(`${req.method} ${req.url} - ${time.toFixed(2)}ms`);
}));

// ============ Rate Limiting ============
// 全局限流
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 1000, // 限制1000次请求
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // 根据 IP 和用户 ID 限流
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  }
});

// API 限流（更严格）
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'API 调用频率超限，请稍后再试'
  }
});

// 登录限流（最严格）
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 分钟
  max: 50,               // 1 分钟 50 次
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: '登录尝试次数过多，请稍后再试'
  }
});


app.use(globalLimiter);
app.use('/api/', apiLimiter);
app.use('/api/auth/login', loginLimiter);

// ============ 请求解析 ============
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============ 请求日志中间件 ============
app.use((req, res, next) => {
  const startTime = Date.now();
  
  // 记录请求
  logger.info({
    type: 'request',
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.id
  });
  
  // 记录响应
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info({
      type: 'response',
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id
    });
  });
  
  next();
});

// ============ 健康检查（优化版） ============
app.get('/health', (req, res) => {
  const healthCheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
    },
    environment: process.env.NODE_ENV || 'development'
  };
  
  res.json(healthCheck);
});

// ============ API 路由 ============
app.use('/api', routes);

// ============ 404 处理 ============
app.use((req, res) => {
  logger.warn({
    type: '404',
    method: req.method,
    url: req.url,
    ip: req.ip
  });
  
  res.status(404).json({
    success: false,
    message: '接口不存在',
    path: req.url
  });
});

// ============ 全局错误处理（增强版） ============
app.use((err, req, res, next) => {
  // 记录错误
  logger.error({
    type: 'error',
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userId: req.user?.id
  });
  
  // 开发环境返回详细错误
  if (process.env.NODE_ENV === 'development') {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message,
      stack: err.stack,
      error: err
    });
  }
  
  // 生产环境返回通用错误
  res.status(err.status || 500).json({
    success: false,
    message: err.isOperational ? err.message : '服务器内部错误'
  });
});

// ============ 优雅关闭 ============
const gracefulShutdown = () => {
  logger.info('收到关闭信号，正在优雅关闭...');
  
  server.close(() => {
    logger.info('HTTP 服务器已关闭');
    
    // 关闭数据库连接等
    // db.close();
    
    process.exit(0);
  });
  
  // 强制关闭超时
  setTimeout(() => {
    logger.error('无法优雅关闭，强制退出');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// ============ 启动服务器 ============
const server = app.listen(PORT, () => {
  logger.info({
    message: '服务器启动成功',
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version
  });
  
  console.log(`
╔════════════════════════════════════════════════════╗
║   供应链管理系统 - 后端服务启动成功 (优化版)        ║
╠════════════════════════════════════════════════════╣
║   地址: http://localhost:${PORT}                       ║
║   API:  http://localhost:${PORT}/api                   ║
║   环境: ${process.env.NODE_ENV || 'development'}                         ║
║   ────────────────────────────────────────────     ║
║   ✅ 安全加固: Helmet + Rate Limiting             ║
║   ✅ 性能优化: Gzip 压缩 + 响应时间监控           ║
║   ✅ 日志系统: Winston 结构化日志                 ║
║   ✅ 优雅关闭: SIGTERM/SIGINT 处理                ║
╚════════════════════════════════════════════════════╝
  `);
});

// 处理未捕获的异常
process.on('uncaughtException', (err) => {
  logger.error({
    type: 'uncaughtException',
    message: err.message,
    stack: err.stack
  });
  
  // 优雅关闭
  gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error({
    type: 'unhandledRejection',
    reason: reason,
    promise: promise
  });
});

module.exports = app; // 导出 app 供测试使用
