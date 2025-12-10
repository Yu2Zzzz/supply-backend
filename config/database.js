// src/config/database.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'supply_chain',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 简化查询方法
const query = async (sql, params) => {
  const [rows] = await pool.execute(sql, params);
  return rows;
};

// 分页查询辅助
const paginate = async (sql, countSql, params, page = 1, pageSize = 20) => {
  const offset = (page - 1) * pageSize;
  const [rows] = await pool.execute(`${sql} LIMIT ? OFFSET ?`, [...params, pageSize, offset]);
  const [countResult] = await pool.execute(countSql, params);
  const total = countResult[0]?.total || 0;
  
  return {
    list: rows,
    pagination: {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  };
};

module.exports = { pool, query, paginate };