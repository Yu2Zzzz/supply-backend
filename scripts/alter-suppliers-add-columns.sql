-- 兼容 MySQL 5.7/8.0：分别按列检查后再新增，避免 IF NOT EXISTS 语法错误
-- 使用当前数据库（也可以手动替换 DB 名）
SET @db := DATABASE();

-- 1) 类目 category
SELECT COUNT(*) INTO @exists FROM information_schema.columns 
  WHERE table_schema = @db AND table_name = 'suppliers' AND column_name = 'category';
SET @sql := IF(@exists = 0, 
  'ALTER TABLE suppliers ADD COLUMN category VARCHAR(255) NULL AFTER quality_rate;',
  'SELECT "category exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2) 品名 product_name
SELECT COUNT(*) INTO @exists FROM information_schema.columns 
  WHERE table_schema = @db AND table_name = 'suppliers' AND column_name = 'product_name';
SET @sql := IF(@exists = 0, 
  'ALTER TABLE suppliers ADD COLUMN product_name VARCHAR(255) NULL AFTER category;',
  'SELECT "product_name exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3) 单价 unit_price
SELECT COUNT(*) INTO @exists FROM information_schema.columns 
  WHERE table_schema = @db AND table_name = 'suppliers' AND column_name = 'unit_price';
SET @sql := IF(@exists = 0, 
  'ALTER TABLE suppliers ADD COLUMN unit_price DECIMAL(12,2) NULL AFTER product_name;',
  'SELECT "unit_price exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 4) 付款方式 payment_method
SELECT COUNT(*) INTO @exists FROM information_schema.columns 
  WHERE table_schema = @db AND table_name = 'suppliers' AND column_name = 'payment_method';
SET @sql := IF(@exists = 0, 
  'ALTER TABLE suppliers ADD COLUMN payment_method VARCHAR(255) NULL AFTER unit_price;',
  'SELECT "payment_method exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
