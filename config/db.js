// backend/config/db.js - 优化版本
const mysql = require('mysql2/promise');
require('dotenv').config();

// ============ 数据库连接池配置（优化版） ============
const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'supply_chain_db',
  
  // ✅ 连接池优化
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
  maxIdle: 10, // 最大空闲连接数
  idleTimeout: 60000, // 空闲超时 60秒
  queueLimit: 0, // 无限制等待队列
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  
  // ✅ 性能优化
  multipleStatements: false, // 安全：禁止多语句
  dateStrings: false, // 自动转换日期
  timezone: '+08:00', // 中国时区
  
  // ✅ 字符集
  charset: 'utf8mb4',
  
  // ✅ 超时配置
  connectTimeout: 10000, // 连接超时 10秒
  
  // ✅ 调试（生产环境关闭）
  debug: process.env.NODE_ENV === 'development' ? false : false
};

const pool = mysql.createPool(poolConfig);

// ============ 连接测试和监控 ============
let isConnected = false;

const testConnection = async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ 数据库连接成功');
    console.log(`   Host: ${poolConfig.host}:${poolConfig.port}`);
    console.log(`   Database: ${poolConfig.database}`);
    console.log(`   Connection Limit: ${poolConfig.connectionLimit}`);
    
    // 测试查询
    const [rows] = await conn.query('SELECT 1 as test');
    if (rows[0].test === 1) {
      console.log('✅ 数据库查询测试通过');
      isConnected = true;
    }
    
    conn.release();
  } catch (err) {
    console.error('❌ 数据库连接失败:', err.message);
    console.error('   请检查：');
    console.error('   1. MySQL 服务是否启动');
    console.error('   2. 数据库配置是否正确（.env文件）');
    console.error('   3. 数据库用户权限是否足够');
    isConnected = false;
  }
};

// 启动时测试连接
testConnection();

// ============ 连接池事件监听 ============
pool.on('acquire', (connection) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔵 Connection %d acquired', connection.threadId);
  }
});

pool.on('connection', (connection) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🟢 New connection established %d', connection.threadId);
  }
});

pool.on('enqueue', () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('⏳ Waiting for available connection slot');
  }
});

pool.on('release', (connection) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔓 Connection %d released', connection.threadId);
  }
});

// ============ 工具函数 ============

/**
 * 获取连接池状态
 */
const getPoolStatus = () => {
  return {
    isConnected,
    totalConnections: pool.pool._allConnections.length,
    freeConnections: pool.pool._freeConnections.length,
    queuedRequests: pool.pool._connectionQueue.length,
    config: {
      host: poolConfig.host,
      database: poolConfig.database,
      connectionLimit: poolConfig.connectionLimit
    }
  };
};

/**
 * 优雅关闭连接池
 */
const closePool = async () => {
  try {
    await pool.end();
    console.log('✅ 数据库连接池已关闭');
  } catch (err) {
    console.error('❌ 关闭数据库连接池失败:', err);
  }
};

// ============ 导出 ============
module.exports = pool;
module.exports.getPoolStatus = getPoolStatus;
module.exports.closePool = closePool;
module.exports.testConnection = testConnection;
