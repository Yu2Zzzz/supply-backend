// test-db-connection.js
// 放在 backend 目录下运行：node test-db-connection.js

require('dotenv').config();
const mysql = require('mysql2/promise');

async function testConnection() {
  console.log('========================================');
  console.log('Testing Database Connection');
  console.log('========================================');
  console.log('');
  
  console.log('Configuration:');
  console.log('  Host:', process.env.DB_HOST);
  console.log('  Port:', process.env.DB_PORT);
  console.log('  User:', process.env.DB_USER);
  console.log('  Database:', process.env.DB_NAME);
  console.log('');
  
  try {
    console.log('Connecting to database...');
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
    
    console.log('✅ Connected successfully!');
    console.log('');
    
    // 测试查询
    console.log('Testing query...');
    const [rows] = await connection.execute('SELECT * FROM users WHERE username = ?', ['admin']);
    
    if (rows.length > 0) {
      console.log('✅ Found admin user:');
      console.log('   Username:', rows[0].username);
      console.log('   Real Name:', rows[0].real_name);
      console.log('   Email:', rows[0].email);
      console.log('   Is Active:', rows[0].is_active, rows[0].is_active === 1 ? '✅ (Active)' : '❌ (Disabled)');
      console.log('   Role ID:', rows[0].role_id);
    } else {
      console.log('❌ Admin user not found!');
    }
    
    await connection.end();
    console.log('');
    console.log('========================================');
    
  } catch (error) {
    console.error('❌ Connection failed!');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    console.error('');
    
    if (error.code === 'ETIMEDOUT') {
      console.log('💡 Tip: Check network connection to Railway');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 Tip: Check DB_PASSWORD in .env');
    } else if (error.code === 'ENOTFOUND') {
      console.log('💡 Tip: Check DB_HOST in .env');
    }
    
    console.log('========================================');
  }
}

testConnection();
