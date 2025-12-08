// backend/test-database.js - 临时测试文件
const db = require('./config/db');

async function checkDatabase() {
  try {
    // 1. 显示连接信息
    console.log('📊 数据库连接配置:');
    console.log('HOST:', process.env.DB_HOST || 'localhost');
    console.log('PORT:', process.env.DB_PORT || '3306');
    console.log('DATABASE:', process.env.DB_NAME || 'railway');
    console.log('---');
    
    // 2. 查询所有用户（包括已删除）
    const [allUsers] = await db.query(`
      SELECT id, username, is_active, is_deleted 
      FROM users 
      ORDER BY id
    `);
    
    console.log('👥 所有用户（包括已删除）:');
    allUsers.forEach(u => {
      console.log(`  ${u.id}. ${u.username} - active:${u.is_active} deleted:${u.is_deleted || 0}`);
    });
    console.log('---');
    
    // 3. 查询未删除用户
    const [activeUsers] = await db.query(`
      SELECT id, username 
      FROM users 
      WHERE is_deleted = 0 OR is_deleted IS NULL
    `);
    
    console.log('✅ 未删除用户:');
    activeUsers.forEach(u => {
      console.log(`  ${u.id}. ${u.username}`);
    });
    console.log('---');
    
    // 4. 查询已删除用户
    const [deletedUsers] = await db.query(`
      SELECT id, username 
      FROM users 
      WHERE is_deleted = 1
    `);
    
    console.log('🗑️ 已删除用户:');
    if (deletedUsers.length === 0) {
      console.log('  (无)');
    } else {
      deletedUsers.forEach(u => {
        console.log(`  ${u.id}. ${u.username}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 错误:', error);
    process.exit(1);
  }
}

checkDatabase();