/**
 * 临时脚本：从采购进度 Excel 自动生成采购订单/物料/供应商
 * 用法：
 *   1) 在 backend 目录运行：npm install xlsx
 *   2) node scripts/import-purchase-from-excel.js
 * 注意：根据需要修改 FILES 数组为你的 Excel 路径；会直接往数据库写数据，请先备份！
 */

require('dotenv').config();
const path = require('path');
const XLSX = require('xlsx');
const { pool } = require('../config/database');

// ===== 配置：把你的文件路径填到这里 =====
const FILES = [
  'C:\\Users\\Howard\\OneDrive - Northeastern University\\Desktop\\7203-20 BOM.xls',
  'C:\\Users\\Howard\\OneDrive - Northeastern University\\Desktop\\7442-02 PI 0526.xlsx',
  'C:\\Users\\Howard\\OneDrive - Northeastern University\\Desktop\\物料采购进度表俞海燕12.4.xlsx',
  'C:\\Users\\Howard\\OneDrive - Northeastern University\\Desktop\\物料采购进度表汪美华12.4.xlsx',
];

// 必填列名映射
const COL_ORDER_NO = '客户订单号';
const COL_CONTAINER = '货柜量';
const COL_PLAN_DATE = '计划完成时间';

// ========== 辅助：解析日期 ==========
function parseDate(val) {
  if (!val) return null;
  if (val instanceof Date && !isNaN(val)) return val;
  const s = String(val).trim();
  // 10/16/2025 或 10-16-2025
  const m1 = s.match(/(\\d{1,2})[\\/-](\\d{1,2})[\\/-](\\d{2,4})/);
  if (m1) {
    const y = Number(m1[3].length === 2 ? '20' + m1[3] : m1[3]);
    return new Date(y, Number(m1[1]) - 1, Number(m1[2]));
  }
  // 10月15号 / 10月15日
  const m2 = s.match(/(\\d{1,2})\\s*月\\s*(\\d{1,2})/);
  if (m2) {
    const year = new Date().getFullYear();
    return new Date(year, Number(m2[1]) - 1, Number(m2[2]));
  }
  return null;
}

function extractLeadTimeDays(header = '') {
  const nums = String(header).match(/(\\d+)(?:-\\d+)?\\s*天/);
  return nums ? Number(nums[1]) : null;
}

// 状态映射
function mapStatus(text = '') {
  const s = String(text).trim();
  if (!s) return { status: 'pending', remark: '' };
  if (s.includes('已到')) return { status: 'arrived', remark: s };
  if (s.includes('已下')) return { status: 'ordered', remark: s };
  if (s.includes('部分')) return { status: 'partial', remark: s };
  if (s.includes('未定')) return { status: 'pending', remark: s };
  return { status: 'pending', remark: s };
}

// 缓存
const supplierCache = new Map(); // name -> id
const materialCache = new Map(); // name -> id
let supSeq = 1;
let matSeq = 1;

async function getSupplierId(name, leadTimeDays = null) {
  if (supplierCache.has(name)) return supplierCache.get(name);
  const code = `SUP-AUTO-${String(supSeq).padStart(4, '0')}`;
  supSeq += 1;
  const [res] = await pool.execute(
    `INSERT INTO suppliers (supplier_code, name, lead_time, status) VALUES (?, ?, ?, 'active')`,
    [code, name, leadTimeDays]
  ).catch(() => []);
  const id = res?.insertId || null;
  supplierCache.set(name, id);
  return id;
}

async function getMaterialId(name) {
  if (materialCache.has(name)) return materialCache.get(name);
  const code = `MAT-AUTO-${String(matSeq).padStart(5, '0')}`;
  matSeq += 1;
  const [res] = await pool.execute(
    `INSERT INTO materials (material_code, name, unit, price, safe_stock, status) VALUES (?, ?, 'PCS', 0, 0, 'active')`,
    [code, name]
  ).catch(() => []);
  const id = res?.insertId || null;
  materialCache.set(name, id);
  return id;
}

async function insertPurchase(poNo, materialId, supplierId, qty, expectedDate, status, remark) {
  const orderDate = new Date();
  const expected = expectedDate || orderDate;
  await pool.execute(
    `INSERT INTO purchase_orders 
      (po_no, material_id, supplier_id, sales_order_id, quantity, unit_price, total_amount, order_date, expected_date, status, remark)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      poNo,
      materialId,
      supplierId,
      null,               // sales_order_id
      qty || 1,
      0,                  // unit_price
      null,               // total_amount
      orderDate,
      expected,
      status || 'pending',
      remark || null,
    ]
  );
}

function cleanHeaderName(header = '') {
  return String(header).replace(/\\s+/g, '').trim();
}

async function processFile(filePath) {
  console.log('处理文件:', filePath);
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  if (!rows.length) {
    console.warn('空表，跳过:', filePath);
    return;
  }

  // 取表头字段
  const headers = Object.keys(rows[0]);

  // 确定物料/供应商列（排除前三列固定字段）
  const itemHeaders = headers.filter(
    (h) => ![COL_ORDER_NO, COL_CONTAINER, COL_PLAN_DATE, '订单序号'].includes(h)
  );

  // 准备列对应的 supplier/material
  const columnMeta = [];
  for (const h of itemHeaders) {
    const lead = extractLeadTimeDays(h);
    const supplierName = cleanHeaderName(h);
    const materialName = cleanHeaderName(h);
    columnMeta.push({ header: h, supplierName, materialName, lead });
  }

  // 遍历数据行
  for (const row of rows) {
    const orderNo = String(row[COL_ORDER_NO] || '').trim();
    if (!orderNo) continue;
    const container = String(row[COL_CONTAINER] || '').trim();
    const planDate = parseDate(row[COL_PLAN_DATE]);

    for (const meta of columnMeta) {
      const cell = row[meta.header];
      if (!cell || String(cell).trim() === '') continue;
      const { status, remark } = mapStatus(cell);
      const supplierId = await getSupplierId(meta.supplierName, meta.lead);
      const materialId = await getMaterialId(meta.materialName);
      const poNo = `${orderNo}-${meta.header}`.slice(0, 50);
      await insertPurchase(poNo, materialId, supplierId, 1, planDate, status, remark);
    }
  }
}

async function main() {
  try {
    for (const f of FILES) {
      const resolved = path.resolve(f);
      await processFile(resolved);
    }
    console.log('导入完成');
  } catch (err) {
    console.error('导入失败:', err);
  } finally {
    pool.end();
  }
}

main();
