// backend/utils/generatePassword.js
// 用于生成正确的密码哈希
// 运行: node utils/generatePassword.js

const bcrypt = require('bcryptjs');

const passwords = [
  { user: 'admin', password: 'admin123' },
  { user: 'sales', password: 'sales123' },
  { user: 'purchaser', password: 'purchaser123' }
];

async function generateHashes() {
  console.log('\n=== 密码哈希生成器 ===\n');
  
  for (const item of passwords) {
    const hash = await bcrypt.hash(item.password, 10);
    console.log(`用户: ${item.user}`);
    console.log(`密码: ${item.password}`);
    console.log(`哈希: ${hash}`);
    console.log(`SQL: UPDATE users SET password_hash = '${hash}' WHERE username = '${item.user}';`);
    console.log('---');
  }
  
  console.log('\n请将上面生成的哈希值更新到数据库中！\n');
}

generateHashes();
