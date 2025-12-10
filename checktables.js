// export-db-schema.js - 导出数据库结构和示例数据
require('dotenv').config();
const { pool } = require('./config/database');
const fs = require('fs');

async function exportDatabaseSchema() {
  try {
    console.log('========================================');
    console.log('开始导出数据库结构...');
    console.log('========================================\n');

    let output = '';
    output += '# 供应链管理系统 - 数据库结构\n\n';
    output += `导出时间: ${new Date().toLocaleString('zh-CN')}\n`;
    output += `数据库: ${process.env.DB_NAME}\n\n`;
    output += '---\n\n';

    // 获取所有表
    const [tables] = await pool.query('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);

    console.log(`找到 ${tableNames.length} 个表\n`);

    for (const tableName of tableNames) {
      console.log(`导出表: ${tableName}...`);
      
      output += `## 表: ${tableName}\n\n`;

      // 获取表结构
      const [columns] = await pool.query(`DESCRIBE ${tableName}`);
      
      output += '### 字段结构\n\n';
      output += '| 字段名 | 类型 | 允许NULL | 键 | 默认值 | 额外 |\n';
      output += '|--------|------|----------|-----|--------|------|\n';
      
      columns.forEach(col => {
        output += `| ${col.Field} | ${col.Type} | ${col.Null} | ${col.Key || '-'} | ${col.Default || '-'} | ${col.Extra || '-'} |\n`;
      });

      // 获取示例数据（前3条）
      const [rows] = await pool.query(`SELECT * FROM ${tableName} LIMIT 3`);
      
      if (rows.length > 0) {
        output += '\n### 示例数据\n\n';
        output += '```json\n';
        output += JSON.stringify(rows, null, 2);
        output += '\n```\n';
      }

      // 获取索引信息
      const [indexes] = await pool.query(`SHOW INDEX FROM ${tableName}`);
      if (indexes.length > 0) {
        output += '\n### 索引\n\n';
        const indexMap = {};
        indexes.forEach(idx => {
          if (!indexMap[idx.Key_name]) {
            indexMap[idx.Key_name] = {
              name: idx.Key_name,
              unique: idx.Non_unique === 0,
              columns: []
            };
          }
          indexMap[idx.Key_name].columns.push(idx.Column_name);
        });

        output += '| 索引名 | 类型 | 字段 |\n';
        output += '|--------|------|------|\n';
        Object.values(indexMap).forEach(idx => {
          output += `| ${idx.name} | ${idx.unique ? 'UNIQUE' : 'INDEX'} | ${idx.columns.join(', ')} |\n`;
        });
      }

      output += '\n---\n\n';
    }

    // 获取外键关系
    output += '## 外键关系\n\n';
    const [foreignKeys] = await pool.query(`
      SELECT 
        TABLE_NAME,
        COLUMN_NAME,
        CONSTRAINT_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = ? 
        AND REFERENCED_TABLE_NAME IS NOT NULL
      ORDER BY TABLE_NAME, COLUMN_NAME
    `, [process.env.DB_NAME]);

    if (foreignKeys.length > 0) {
      output += '| 表名 | 字段 | 引用表 | 引用字段 |\n';
      output += '|------|------|--------|----------|\n';
      foreignKeys.forEach(fk => {
        output += `| ${fk.TABLE_NAME} | ${fk.COLUMN_NAME} | ${fk.REFERENCED_TABLE_NAME} | ${fk.REFERENCED_COLUMN_NAME} |\n`;
      });
    } else {
      output += '暂无外键关系\n';
    }

    // 保存到文件
    const filename = `database-schema-${Date.now()}.md`;
    fs.writeFileSync(filename, output, 'utf8');

    console.log('\n========================================');
    console.log('✅ 导出完成！');
    console.log(`📄 文件保存为: ${filename}`);
    console.log('========================================\n');

    // 同时在控制台输出
    console.log(output);

    process.exit(0);
  } catch (error) {
    console.error('❌ 导出失败:', error);
    process.exit(1);
  }
}

exportDatabaseSchema();