// fixPasswords.js
// 在后端目录运行: node fixPasswords.js

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function fixPasswords() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'supply_chain_db'
  });

  console.log('连接数据库成功！\n');

  const users = [
    { username: 'admin', password: 'admin123' },
    { username: 'sales', password: 'sales123' },
    { username: 'purchaser', password: 'purchaser123' }
  ];

  for (const user of users) {
    const hash = await bcrypt.hash(user.password, 10);
    await connection.execute(
      'UPDATE users SET password_hash = ? WHERE username = ?',
      [hash, user.username]
    );
    console.log(`✅ ${user.username} 密码已更新`);
    console.log(`   密码: ${user.password}`);
    console.log(`   哈希: ${hash}\n`);
  }

  // 验证
  const [rows] = await connection.execute('SELECT username, password_hash FROM users');
  console.log('当前用户列表:');
  rows.forEach(r => console.log(`  - ${r.username}: ${r.password_hash.substring(0, 20)}...`));

  await connection.end();
  console.log('\n✅ 密码修复完成！现在可以登录了。');
}

fixPasswords().catch(err => {
  console.error('错误:', err.message);
  process.exit(1);
});
