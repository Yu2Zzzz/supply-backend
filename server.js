// backend/server.js - 优化版本（禁用 304 缓存）

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
    winston.format.colorize(),
    winston.format.printf(info => {
      const { timestamp, level, message, ...meta } = info;

      // 如果 message 是对象，转成 JSON 字符串，避免 [object Object]
      let msg = message;
      if (typeof msg === 'object') {
        try {
          msg = JSON.stringify(msg);
        } catch (e) {
          msg = '[object]';
        }
      }

      const metaString = Object.keys(meta).length
        ? JSON.stringify(meta)
        : '';

      return `${timestamp} [${level}]: ${msg} ${metaString}`;
    })
  ),
  transports: [new winston.transports.Console()],
});

// ============ Express 应用配置 ============
const app = express();
const PORT = process.env.PORT || 4000;

// 生产环境下信任一层代理（Railway / Nginx 等）
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// ============ 禁用缓存 / 304（关键修复） ============

// 关闭 ETag，避免命中 If-None-Match 产生 304
app.set('etag', false);

// 禁用浏览器 / 中间层缓存
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// 防御性：如果某些 handler 把状态码设成 304，这里强制改回 200
app.use((req, res, next) => {
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  res.json = function (body) {
    if (res.statusCode === 304) {
      res.status(200);
    }
    return originalJson(body);
  };

  res.send = function (body) {
    if (res.statusCode === 304) {
      res.status(200);
    }
    return originalSend(body);
  };

  next();
});

// ============ 安全中间件 ============
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

// ============ CORS 配置 ============
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // 允许 Postman 等
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400
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
  level: 6
}));

// 响应时间记录
app.use(responseTime((req, res, time) => {
  logger.info(`${req.method} ${req.url} - ${time.toFixed(2)}ms`);
}));

// ============ Rate Limiting ============
// 全局限流
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  }
});

// API 限流
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'API 调用频率超限，请稍后再试'
  }
});

// 登录限流
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50,
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

// ============ 健康检查 ============
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

// 使用你已有的 errorHandler / notFound 中间件
const { errorHandler, notFound } = require('./middlewares/errorHandler');
app.use(notFound);
app.use(errorHandler);

// ============ 兜底 404 ============
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

// ============ 全局错误处理（增强版兜底） ============
app.use((err, req, res, next) => {
  logger.error({
    type: 'error',
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userId: req.user?.id
  });

  if (process.env.NODE_ENV === 'development') {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message,
      stack: err.stack,
      error: err
    });
  }

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
    process.exit(0);
  });

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

// 未捕获异常 & 未处理 Promise
process.on('uncaughtException', (err) => {
  logger.error({
    type: 'uncaughtException',
    message: err.message,
    stack: err.stack
  });
  gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error({
    type: 'unhandledRejection',
    reason: reason,
    promise: promise
  });
});

module.expor
