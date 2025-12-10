# 供应链管理系统 - 数据库结构

导出时间: 2025/12/9 23:08:33
数据库: railway

---

## 表: audit_logs

### 字段结构

| 字段名 | 类型 | 允许NULL | 键 | 默认值 | 额外 |
|--------|------|----------|-----|--------|------|
| id | int | NO | PRI | - | auto_increment |
| user_id | int | YES | MUL | - | - |
| action | varchar(100) | NO | - | - | - |
| table_name | varchar(100) | YES | - | - | - |
| record_id | int | YES | - | - | - |
| old_value | json | YES | - | - | - |
| new_value | json | YES | - | - | - |
| ip_address | varchar(100) | YES | - | - | - |
| created_at | timestamp | YES | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED |

### 索引

| 索引名 | 类型 | 字段 |
|--------|------|------|
| PRIMARY | UNIQUE | id |
| user_id | INDEX | user_id |

---

## 表: bom

### 字段结构

| 字段名 | 类型 | 允许NULL | 键 | 默认值 | 额外 |
|--------|------|----------|-----|--------|------|
| id | int | NO | PRI | - | auto_increment |
| product_id | int | NO | MUL | - | - |
| material_id | int | NO | MUL | - | - |
| quantity | decimal(10,4) | NO | - | - | - |
| remark | text | YES | - | - | - |
| created_at | timestamp | YES | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED |

### 示例数据

```json
[
  {
    "id": 1,
    "product_id": 1,
    "material_id": 1,
    "quantity": "4.0000",
    "remark": null,
    "created_at": "2025-12-07T00:19:40.000Z"
  },
  {
    "id": 2,
    "product_id": 1,
    "material_id": 3,
    "quantity": "2.0000",
    "remark": null,
    "created_at": "2025-12-07T00:19:40.000Z"
  },
  {
    "id": 3,
    "product_id": 1,
    "material_id": 5,
    "quantity": "12.0000",
    "remark": null,
    "created_at": "2025-12-07T00:19:40.000Z"
  }
]
```

### 索引

| 索引名 | 类型 | 字段 |
|--------|------|------|
| PRIMARY | UNIQUE | id |
| uk_prod_mat | UNIQUE | product_id, material_id |
| material_id | INDEX | material_id |

---

## 表: customers

### 字段结构

| 字段名 | 类型 | 允许NULL | 键 | 默认值 | 额外 |
|--------|------|----------|-----|--------|------|
| id | int | NO | PRI | - | auto_increment |
| customer_code | varchar(50) | NO | UNI | - | - |
| name | varchar(500) | NO | MUL | - | - |
| contact_person | varchar(200) | YES | - | - | - |
| phone | varchar(50) | YES | - | - | - |
| email | varchar(200) | YES | - | - | - |
| address | text | YES | - | - | - |
| status | enum('active','inactive') | YES | MUL | active | - |
| created_at | timestamp | YES | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| updated_at | timestamp | YES | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |

### 示例数据

```json
[
  {
    "id": 1,
    "customer_code": "C001",
    "name": "沃尔玛中国",
    "contact_person": null,
    "phone": null,
    "email": null,
    "address": null,
    "status": "active",
    "created_at": "2025-12-07T00:19:39.000Z",
    "updated_at": "2025-12-07T00:19:39.000Z"
  },
  {
    "id": 2,
    "customer_code": "C002",
    "name": "迪卡侬上海",
    "contact_person": null,
    "phone": null,
    "email": null,
    "address": null,
    "status": "active",
    "created_at": "2025-12-07T00:19:39.000Z",
    "updated_at": "2025-12-07T00:19:39.000Z"
  },
  {
    "id": 3,
    "customer_code": "C003",
    "name": "宜家家居",
    "contact_person": null,
    "phone": null,
    "email": null,
    "address": null,
    "status": "active",
    "created_at": "2025-12-07T00:19:39.000Z",
    "updated_at": "2025-12-07T00:19:39.000Z"
  }
]
```

### 索引

| 索引名 | 类型 | 字段 |
|--------|------|------|
| PRIMARY | UNIQUE | id |
| customer_code | UNIQUE | customer_code |
| idx_name | INDEX | name |
| idx_status | INDEX | status |

---

## 表: in_transit

### 字段结构

| 字段名 | 类型 | 允许NULL | 键 | 默认值 | 额外 |
|--------|------|----------|-----|--------|------|
| id | int | NO | PRI | - | auto_increment |
| purchase_order_id | int | NO | MUL | - | - |
| material_id | int | NO | MUL | - | - |
| quantity | int | NO | - | - | - |
| expected_date | date | YES | - | - | - |
| created_at | timestamp | YES | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED |

### 示例数据

```json
[
  {
    "id": 4,
    "purchase_order_id": 4,
    "material_id": 5,
    "quantity": 100,
    "expected_date": "2026-03-22T04:00:00.000Z",
    "created_at": "2025-12-09T08:57:24.000Z"
  }
]
```

### 索引

| 索引名 | 类型 | 字段 |
|--------|------|------|
| PRIMARY | UNIQUE | id |
| purchase_order_id | INDEX | purchase_order_id |
| material_id | INDEX | material_id |

---

## 表: inventory

### 字段结构

| 字段名 | 类型 | 允许NULL | 键 | 默认值 | 额外 |
|--------|------|----------|-----|--------|------|
| id | int | NO | PRI | - | auto_increment |
| material_id | int | NO | MUL | - | - |
| warehouse_id | int | NO | MUL | - | - |
| quantity | int | NO | - | 0 | - |
| updated_at | timestamp | YES | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| safety_stock | decimal(10,2) | YES | - | 100.00 | - |

### 示例数据

```json
[
  {
    "id": 1,
    "material_id": 1,
    "warehouse_id": 1,
    "quantity": 65000,
    "updated_at": "2025-12-07T12:58:11.000Z",
    "safety_stock": "100.00"
  },
  {
    "id": 2,
    "material_id": 2,
    "warehouse_id": 1,
    "quantity": 68000,
    "updated_at": "2025-12-08T04:33:57.000Z",
    "safety_stock": "100.00"
  },
  {
    "id": 3,
    "material_id": 3,
    "warehouse_id": 1,
    "quantity": 118000,
    "updated_at": "2025-12-08T07:18:03.000Z",
    "safety_stock": "100.00"
  }
]
```

### 索引

| 索引名 | 类型 | 字段 |
|--------|------|------|
| PRIMARY | UNIQUE | id |
| uk_mat_wh | UNIQUE | material_id, warehouse_id |
| warehouse_id | INDEX | warehouse_id |

---

## 表: material_suppliers

### 字段结构

| 字段名 | 类型 | 允许NULL | 键 | 默认值 | 额外 |
|--------|------|----------|-----|--------|------|
| id | int | NO | PRI | - | auto_increment |
| material_id | int | NO | MUL | - | - |
| supplier_id | int | NO | MUL | - | - |
| is_main | tinyint(1) | YES | - | 0 | - |
| price | decimal(10,2) | YES | - | - | - |
| lead_time | int | YES | - | - | - |
| created_at | timestamp | YES | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED |

### 示例数据

```json
[
  {
    "id": 1,
    "material_id": 1,
    "supplier_id": 1,
    "is_main": 1,
    "price": null,
    "lead_time": null,
    "created_at": "2025-12-07T00:19:40.000Z"
  },
  {
    "id": 2,
    "material_id": 2,
    "supplier_id": 2,
    "is_main": 1,
    "price": null,
    "lead_time": null,
    "created_at": "2025-12-07T00:19:40.000Z"
  },
  {
    "id": 3,
    "material_id": 3,
    "supplier_id": 3,
    "is_main": 1,
    "price": null,
    "lead_time": null,
    "created_at": "2025-12-07T00:19:40.000Z"
  }
]
```

### 索引

| 索引名 | 类型 | 字段 |
|--------|------|------|
| PRIMARY | UNIQUE | id |
| uk_mat_sup | UNIQUE | material_id, supplier_id |
| supplier_id | INDEX | supplier_id |

---

## 表: materials

### 字段结构

| 字段名 | 类型 | 允许NULL | 键 | 默认值 | 额外 |
|--------|------|----------|-----|--------|------|
| id | int | NO | PRI | - | auto_increment |
| material_code | varchar(50) | NO | UNI | - | - |
| name | varchar(500) | NO | - | - | - |
| spec | varchar(500) | YES | - | - | - |
| unit | varchar(50) | YES | - | PCS | - |
| price | decimal(10,2) | YES | - | - | - |
| safe_stock | int | YES | - | 0 | - |
| lead_time | int | YES | - | 7 | - |
| buyer | varchar(200) | YES | - | - | - |
| category | varchar(200) | YES | - | - | - |
| status | enum('active','inactive') | YES | - | active | - |
| created_at | timestamp | YES | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| updated_at | timestamp | YES | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| in_transit | int | YES | - | 0 | - |

### 示例数据

```json
[
  {
    "id": 1,
    "material_code": "MAT-STEEL-001",
    "name": "Q235方管",
    "spec": "20*20*1.2mm 喷粉黑",
    "unit": "PCS",
    "price": "18.50",
    "safe_stock": 40000,
    "lead_time": 15,
    "buyer": "陈明",
    "category": null,
    "status": null,
    "created_at": "2025-12-07T00:19:40.000Z",
    "updated_at": "2025-12-07T04:16:32.000Z",
    "in_transit": 0
  },
  {
    "id": 2,
    "material_code": "MAT-STEEL-002",
    "name": "Q235方管加厚",
    "spec": "25*25*1.5mm 喷粉灰",
    "unit": "PCS",
    "price": "24.80",
    "safe_stock": 25000,
    "lead_time": 18,
    "buyer": "刘洋",
    "category": null,
    "status": "active",
    "created_at": "2025-12-07T00:19:40.000Z",
    "updated_at": "2025-12-07T00:19:40.000Z",
    "in_transit": 0
  },
  {
    "id": 3,
    "material_code": "MAT-FABRIC-001",
    "name": "600D牛津布",
    "spec": "防水PVC涂层 黑色",
    "unit": "M",
    "price": "12.50",
    "safe_stock": 30000,
    "lead_time": 25,
    "buyer": "陈明",
    "category": null,
    "status": "active",
    "created_at": "2025-12-07T00:19:40.000Z",
    "updated_at": "2025-12-07T00:19:40.000Z",
    "in_transit": 0
  }
]
```

### 索引

| 索引名 | 类型 | 字段 |
|--------|------|------|
| PRIMARY | UNIQUE | id |
| material_code | UNIQUE | material_code |

---

## 表: order_lines

### 字段结构

| 字段名 | 类型 | 允许NULL | 键 | 默认值 | 额外 |
|--------|------|----------|-----|--------|------|
| id | int | NO | PRI | - | auto_increment |
| order_id | int | NO | MUL | - | - |
| product_id | int | NO | MUL | - | - |
| quantity | int | NO | - | - | - |
| unit_price | decimal(10,2) | YES | - | - | - |
| remark | text | YES | - | - | - |
| created_at | timestamp | YES | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| amount | decimal(15,2) | YES | - | 0.00 | - |

### 示例数据

```json
[
  {
    "id": 24,
    "order_id": 3,
    "product_id": 9,
    "quantity": 1,
    "unit_price": "5000.00",
    "remark": null,
    "created_at": "2025-12-08T04:48:01.000Z",
    "amount": "5000.00"
  },
  {
    "id": 25,
    "order_id": 3,
    "product_id": 6,
    "quantity": 1,
    "unit_price": "20000.00",
    "remark": null,
    "created_at": "2025-12-08T04:48:01.000Z",
    "amount": "20000.00"
  },
  {
    "id": 26,
    "order_id": 7,
    "product_id": 4,
    "quantity": 1,
    "unit_price": "2000.00",
    "remark": null,
    "created_at": "2025-12-08T06:36:41.000Z",
    "amount": "2000.00"
  }
]
```

### 索引

| 索引名 | 类型 | 字段 |
|--------|------|------|
| PRIMARY | UNIQUE | id |
| order_id | INDEX | order_id |
| product_id | INDEX | product_id |

---

## 表: product_inventory

### 字段结构

| 字段名 | 类型 | 允许NULL | 键 | 默认值 | 额外 |
|--------|------|----------|-----|--------|------|
| id | int | NO | PRI | - | auto_increment |
| product_id | int | NO | MUL | - | - |
| warehouse_id | int | NO | MUL | - | - |
| quantity | decimal(10,2) | YES | - | 0.00 | - |
| safety_stock | decimal(10,2) | YES | - | 100.00 | - |
| created_at | timestamp | YES | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| updated_at | timestamp | YES | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |

### 示例数据

```json
[
  {
    "id": 1,
    "product_id": 9,
    "warehouse_id": 1,
    "quantity": "2000.00",
    "safety_stock": "100.00",
    "created_at": "2025-12-08T23:10:21.000Z",
    "updated_at": "2025-12-08T23:19:30.000Z"
  },
  {
    "id": 2,
    "product_id": 1,
    "warehouse_id": 1,
    "quantity": "0.00",
    "safety_stock": "100.00",
    "created_at": "2025-12-08T23:10:22.000Z",
    "updated_at": "2025-12-08T23:10:22.000Z"
  },
  {
    "id": 3,
    "product_id": 2,
    "warehouse_id": 1,
    "quantity": "0.00",
    "safety_stock": "100.00",
    "created_at": "2025-12-08T23:10:22.000Z",
    "updated_at": "2025-12-08T23:10:22.000Z"
  }
]
```

### 索引

| 索引名 | 类型 | 字段 |
|--------|------|------|
| PRIMARY | UNIQUE | id |
| unique_product_warehouse | UNIQUE | product_id, warehouse_id |
| warehouse_id | INDEX | warehouse_id |

---

## 表: products

### 字段结构

| 字段名 | 类型 | 允许NULL | 键 | 默认值 | 额外 |
|--------|------|----------|-----|--------|------|
| id | int | NO | PRI | - | auto_increment |
| product_code | varchar(50) | NO | UNI | - | - |
| name | varchar(500) | NO | - | - | - |
| spec | varchar(200) | YES | - | - | - |
| category | varchar(200) | YES | - | - | - |
| description | text | YES | - | - | - |
| unit | varchar(50) | YES | - | PCS | - |
| status | enum('active','inactive') | YES | MUL | active | - |
| created_at | timestamp | YES | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| updated_at | timestamp | YES | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |

### 示例数据

```json
[
  {
    "id": 1,
    "product_code": "PRD-CHAIR-001",
    "name": "户外折叠椅A型",
    "spec": null,
    "category": "户外家具",
    "description": null,
    "unit": "PCS",
    "status": "active",
    "created_at": "2025-12-07T00:19:39.000Z",
    "updated_at": "2025-12-07T00:19:39.000Z"
  },
  {
    "id": 2,
    "product_code": "PRD-CHAIR-002",
    "name": "户外折叠椅B型",
    "spec": null,
    "category": "户外家具",
    "description": null,
    "unit": "PCS",
    "status": "active",
    "created_at": "2025-12-07T00:19:39.000Z",
    "updated_at": "2025-12-07T00:19:39.000Z"
  },
  {
    "id": 3,
    "product_code": "PRD-TABLE-001",
    "name": "便携折叠桌",
    "spec": null,
    "category": "户外家具",
    "description": null,
    "unit": "PCS",
    "status": "active",
    "created_at": "2025-12-07T00:19:39.000Z",
    "updated_at": "2025-12-07T00:19:39.000Z"
  }
]
```

### 索引

| 索引名 | 类型 | 字段 |
|--------|------|------|
| PRIMARY | UNIQUE | id |
| product_code | UNIQUE | product_code |
| idx_product_code | INDEX | product_code |
| idx_status_created | INDEX | status, created_at |

---

## 表: purchase_orders

### 字段结构

| 字段名 | 类型 | 允许NULL | 键 | 默认值 | 额外 |
|--------|------|----------|-----|--------|------|
| id | int | NO | PRI | - | auto_increment |
| po_no | varchar(50) | NO | UNI | - | - |
| material_id | int | NO | MUL | - | - |
| supplier_id | int | NO | MUL | - | - |
| sales_order_id | int | YES | MUL | - | - |
| quantity | int | NO | - | - | - |
| unit_price | decimal(10,2) | YES | - | - | - |
| total_amount | decimal(12,2) | YES | - | - | - |
| order_date | date | NO | - | - | - |
| expected_date | date | YES | - | - | - |
| actual_date | date | YES | - | - | - |
| status | enum('draft','confirmed','producing','shipped','arrived','cancelled') | YES | - | draft | - |
| created_by | int | YES | MUL | - | - |
| remark | text | YES | - | - | - |
| created_at | timestamp | YES | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| updated_at | timestamp | YES | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |

### 示例数据

```json
[
  {
    "id": 1,
    "po_no": "PO2025-001",
    "material_id": 1,
    "supplier_id": 1,
    "sales_order_id": 2,
    "quantity": 40000,
    "unit_price": "18.50",
    "total_amount": "740000.00",
    "order_date": "2024-11-12T05:00:00.000Z",
    "expected_date": "2024-12-12T05:00:00.000Z",
    "actual_date": null,
    "status": "shipped",
    "created_by": null,
    "remark": "",
    "created_at": "2025-12-07T00:19:40.000Z",
    "updated_at": "2025-12-09T08:56:01.000Z"
  },
  {
    "id": 2,
    "po_no": "PO2025-002",
    "material_id": 2,
    "supplier_id": 2,
    "sales_order_id": 7,
    "quantity": 30000,
    "unit_price": "24.80",
    "total_amount": "744000.00",
    "order_date": "2024-11-20T05:00:00.000Z",
    "expected_date": "2026-01-13T05:00:00.000Z",
    "actual_date": null,
    "status": "arrived",
    "created_by": null,
    "remark": "",
    "created_at": "2025-12-07T00:19:40.000Z",
    "updated_at": "2025-12-09T08:56:08.000Z"
  },
  {
    "id": 3,
    "po_no": "PO2025-003",
    "material_id": 3,
    "supplier_id": 3,
    "sales_order_id": 3,
    "quantity": 25000,
    "unit_price": "12.50",
    "total_amount": "312500.00",
    "order_date": "2024-10-27T04:00:00.000Z",
    "expected_date": "2026-03-19T04:00:00.000Z",
    "actual_date": null,
    "status": "shipped",
    "created_by": null,
    "remark": "",
    "created_at": "2025-12-07T00:19:40.000Z",
    "updated_at": "2025-12-09T07:37:05.000Z"
  }
]
```

### 索引

| 索引名 | 类型 | 字段 |
|--------|------|------|
| PRIMARY | UNIQUE | id |
| po_no | UNIQUE | po_no |
| material_id | INDEX | material_id |
| supplier_id | INDEX | supplier_id |
| created_by | INDEX | created_by |
| idx_sales_order_id | INDEX | sales_order_id |

---

## 表: roles

### 字段结构

| 字段名 | 类型 | 允许NULL | 键 | 默认值 | 额外 |
|--------|------|----------|-----|--------|------|
| id | int | NO | PRI | - | auto_increment |
| role_code | varchar(50) | NO | UNI | - | - |
| role_name | varchar(200) | NO | - | - | - |
| description | text | YES | - | - | - |
| created_at | timestamp | YES | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| updated_at | timestamp | YES | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |

### 示例数据

```json
[
  {
    "id": 1,
    "role_code": "admin",
    "role_name": "管理员",
    "description": "系统管理员，拥有所有权限",
    "created_at": "2025-12-07T00:19:39.000Z",
    "updated_at": "2025-12-07T00:19:39.000Z"
  },
  {
    "id": 2,
    "role_code": "sales",
    "role_name": "业务员",
    "description": "负责销售订单管理",
    "created_at": "2025-12-07T00:19:39.000Z",
    "updated_at": "2025-12-07T00:19:39.000Z"
  },
  {
    "id": 3,
    "role_code": "purchaser",
    "role_name": "采购员",
    "description": "负责物料采购和库存管理",
    "created_at": "2025-12-07T00:19:39.000Z",
    "updated_at": "2025-12-07T00:19:39.000Z"
  }
]
```

### 索引

| 索引名 | 类型 | 字段 |
|--------|------|------|
| PRIMARY | UNIQUE | id |
| role_code | UNIQUE | role_code |

---

## 表: sales_orders

### 字段结构

| 字段名 | 类型 | 允许NULL | 键 | 默认值 | 额外 |
|--------|------|----------|-----|--------|------|
| id | int | NO | PRI | - | auto_increment |
| order_no | varchar(50) | NO | UNI | - | - |
| customer_id | int | NO | MUL | - | - |
| order_date | date | NO | - | - | - |
| delivery_date | date | NO | - | - | - |
| sales_person | varchar(200) | YES | - | - | - |
| status | enum('pending','confirmed','producing','shipped','completed','cancelled') | YES | MUL | pending | - |
| remark | text | YES | - | - | - |
| created_by | int | YES | MUL | - | - |
| created_at | timestamp | YES | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| updated_at | timestamp | YES | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| total_amount | double | NO | - | 0 | - |

### 示例数据

```json
[
  {
    "id": 1,
    "order_no": "SO2025-001",
    "customer_id": 1,
    "order_date": "2024-10-28T04:00:00.000Z",
    "delivery_date": "2026-03-06T05:00:00.000Z",
    "sales_person": "张伟",
    "status": "producing",
    "remark": "",
    "created_by": null,
    "created_at": "2025-12-07T00:19:40.000Z",
    "updated_at": "2025-12-09T10:35:43.000Z",
    "total_amount": 53000
  },
  {
    "id": 2,
    "order_no": "SO2025-002",
    "customer_id": 2,
    "order_date": "2024-11-07T05:00:00.000Z",
    "delivery_date": "2024-12-04T05:00:00.000Z",
    "sales_person": "李娜",
    "status": "pending",
    "remark": "",
    "created_by": null,
    "created_at": "2025-12-07T00:19:40.000Z",
    "updated_at": "2025-12-09T06:17:24.000Z",
    "total_amount": 19895
  },
  {
    "id": 3,
    "order_no": "SO2025-003",
    "customer_id": 3,
    "order_date": "2024-11-18T05:00:00.000Z",
    "delivery_date": "2024-12-26T05:00:00.000Z",
    "sales_person": "王强",
    "status": "shipped",
    "remark": "",
    "created_by": null,
    "created_at": "2025-12-07T00:19:40.000Z",
    "updated_at": "2025-12-08T04:48:01.000Z",
    "total_amount": 25000
  }
]
```

### 索引

| 索引名 | 类型 | 字段 |
|--------|------|------|
| PRIMARY | UNIQUE | id |
| order_no | UNIQUE | order_no |
| customer_id | INDEX | customer_id |
| created_by | INDEX | created_by |
| idx_order_no | INDEX | order_no |
| idx_status_delivery | INDEX | status, delivery_date |

---

## 表: suppliers

### 字段结构

| 字段名 | 类型 | 允许NULL | 键 | 默认值 | 额外 |
|--------|------|----------|-----|--------|------|
| id | int | NO | PRI | - | auto_increment |
| supplier_code | varchar(50) | NO | UNI | - | - |
| name | varchar(500) | NO | - | - | - |
| contact_person | varchar(200) | YES | - | - | - |
| phone | varchar(50) | YES | - | - | - |
| email | varchar(200) | YES | - | - | - |
| address | text | YES | - | - | - |
| on_time_rate | decimal(5,2) | YES | - | 0.90 | - |
| quality_rate | decimal(5,2) | YES | - | 0.95 | - |
| status | enum('active','inactive') | YES | - | active | - |
| remark | text | YES | - | - | - |
| created_at | timestamp | YES | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| updated_at | timestamp | YES | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |

### 示例数据

```json
[
  {
    "id": 1,
    "supplier_code": "S001",
    "name": "宝钢集团",
    "contact_person": null,
    "phone": null,
    "email": null,
    "address": null,
    "on_time_rate": "0.92",
    "quality_rate": "0.98",
    "status": "active",
    "remark": null,
    "created_at": "2025-12-07T00:19:39.000Z",
    "updated_at": "2025-12-07T00:19:39.000Z"
  },
  {
    "id": 2,
    "supplier_code": "S002",
    "name": "马钢股份",
    "contact_person": null,
    "phone": null,
    "email": null,
    "address": null,
    "on_time_rate": "0.78",
    "quality_rate": "0.95",
    "status": "active",
    "remark": null,
    "created_at": "2025-12-07T00:19:39.000Z",
    "updated_at": "2025-12-07T00:19:39.000Z"
  },
  {
    "id": 3,
    "supplier_code": "S003",
    "name": "浙江永盛纺织",
    "contact_person": null,
    "phone": null,
    "email": null,
    "address": null,
    "on_time_rate": "0.88",
    "quality_rate": "0.97",
    "status": "active",
    "remark": null,
    "created_at": "2025-12-07T00:19:39.000Z",
    "updated_at": "2025-12-07T00:19:39.000Z"
  }
]
```

### 索引

| 索引名 | 类型 | 字段 |
|--------|------|------|
| PRIMARY | UNIQUE | id |
| supplier_code | UNIQUE | supplier_code |

---

## 表: users

### 字段结构

| 字段名 | 类型 | 允许NULL | 键 | 默认值 | 额外 |
|--------|------|----------|-----|--------|------|
| id | int | NO | PRI | - | auto_increment |
| username | varchar(50) | NO | UNI | - | - |
| password_hash | varchar(255) | NO | - | - | - |
| real_name | varchar(200) | YES | - | - | - |
| email | varchar(200) | YES | - | - | - |
| phone | varchar(50) | YES | - | - | - |
| role_id | int | NO | MUL | - | - |
| is_active | tinyint(1) | YES | - | 1 | - |
| last_login | timestamp | YES | - | - | - |
| created_at | timestamp | YES | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| updated_at | timestamp | YES | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| is_deleted | tinyint(1) | YES | MUL | 0 | - |

### 示例数据

```json
[
  {
    "id": 1,
    "username": "admin",
    "password_hash": "$2b$10$Cz1I2WtTn2hFil6vB0C4p.TAeJQih1CTYV35gN4aYB/fcwNP/OwoK",
    "real_name": "系统管理员",
    "email": null,
    "phone": null,
    "role_id": 1,
    "is_active": 1,
    "last_login": "2025-12-10T09:01:34.000Z",
    "created_at": "2025-12-07T00:19:39.000Z",
    "updated_at": "2025-12-10T09:01:34.000Z",
    "is_deleted": 0
  },
  {
    "id": 2,
    "username": "sales",
    "password_hash": "$2b$10$.AJhVBZLDHFyoBe0WLefC.kOXPT3BUmBcDaOfrEZQJLQnIjXl/VLi",
    "real_name": "张伟",
    "email": null,
    "phone": null,
    "role_id": 2,
    "is_active": 1,
    "last_login": "2025-12-08T06:43:03.000Z",
    "created_at": "2025-12-07T00:19:39.000Z",
    "updated_at": "2025-12-08T06:43:03.000Z",
    "is_deleted": 0
  },
  {
    "id": 3,
    "username": "purchaser",
    "password_hash": "$2b$10$z0vqgJdAjA9yIFqJ0KLKIeeEuy2slmNl/pvaxzKm1/2oZM02XlYTm",
    "real_name": "刘洋",
    "email": null,
    "phone": null,
    "role_id": 3,
    "is_active": 1,
    "last_login": "2025-12-08T06:36:52.000Z",
    "created_at": "2025-12-07T00:19:39.000Z",
    "updated_at": "2025-12-08T06:36:52.000Z",
    "is_deleted": 0
  }
]
```

### 索引

| 索引名 | 类型 | 字段 |
|--------|------|------|
| PRIMARY | UNIQUE | id |
| username | UNIQUE | username |
| role_id | INDEX | role_id |
| idx_users_is_deleted | INDEX | is_deleted |

---

## 表: warehouses

### 字段结构

| 字段名 | 类型 | 允许NULL | 键 | 默认值 | 额外 |
|--------|------|----------|-----|--------|------|
| id | int | NO | PRI | - | auto_increment |
| warehouse_code | varchar(50) | NO | UNI | - | - |
| name | varchar(500) | NO | - | - | - |
| location | varchar(500) | YES | - | - | - |
| capacity | int | YES | - | - | - |
| manager | varchar(200) | YES | - | - | - |
| status | enum('active','inactive') | YES | - | active | - |
| remark | text | YES | - | - | - |
| created_at | timestamp | YES | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| updated_at | timestamp | YES | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |

### 示例数据

```json
[
  {
    "id": 1,
    "warehouse_code": "WH001",
    "name": "主仓库",
    "location": "上海市浦东新区",
    "capacity": 100000,
    "manager": null,
    "status": "active",
    "remark": null,
    "created_at": "2025-12-07T00:19:40.000Z",
    "updated_at": "2025-12-07T00:19:40.000Z"
  },
  {
    "id": 2,
    "warehouse_code": "WH002",
    "name": "北方仓库",
    "location": "北京市大兴区",
    "capacity": 50000,
    "manager": null,
    "status": "active",
    "remark": null,
    "created_at": "2025-12-07T00:19:40.000Z",
    "updated_at": "2025-12-07T00:19:40.000Z"
  },
  {
    "id": 3,
    "warehouse_code": "tesing",
    "name": "测试仓库",
    "location": "宁波",
    "capacity": 300000,
    "manager": "zyhh",
    "status": "active",
    "remark": null,
    "created_at": "2025-12-09T04:00:33.000Z",
    "updated_at": "2025-12-09T04:00:33.000Z"
  }
]
```

### 索引

| 索引名 | 类型 | 字段 |
|--------|------|------|
| PRIMARY | UNIQUE | id |
| warehouse_code | UNIQUE | warehouse_code |

---

## 表: warnings

### 字段结构

| 字段名 | 类型 | 允许NULL | 键 | 默认值 | 额外 |
|--------|------|----------|-----|--------|------|
| id | int | NO | PRI | - | auto_increment |
| level | enum('RED','ORANGE','YELLOW','BLUE') | NO | - | - | - |
| material_id | int | YES | MUL | - | - |
| order_id | int | YES | MUL | - | - |
| product_id | int | YES | MUL | - | - |
| warning_type | varchar(100) | YES | - | - | - |
| message | text | YES | - | - | - |
| is_resolved | tinyint(1) | YES | - | 0 | - |
| created_at | timestamp | YES | - | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| resolved_at | timestamp | YES | - | - | - |

### 示例数据

```json
[
  {
    "id": 1,
    "level": "RED",
    "material_id": 2,
    "order_id": null,
    "product_id": null,
    "warning_type": "stock_shortage",
    "message": "Q235方管加厚 库存不足，当前8000，需求45000",
    "is_resolved": 0,
    "created_at": "2025-12-07T00:19:40.000Z",
    "resolved_at": null
  },
  {
    "id": 2,
    "level": "ORANGE",
    "material_id": 4,
    "order_id": null,
    "product_id": null,
    "warning_type": "stock_shortage",
    "message": "800D牛津布 库存低于安全库存",
    "is_resolved": 0,
    "created_at": "2025-12-07T00:19:40.000Z",
    "resolved_at": null
  },
  {
    "id": 3,
    "level": "YELLOW",
    "material_id": 7,
    "order_id": null,
    "product_id": null,
    "warning_type": "delivery_delay",
    "message": "多层板 采购订单可能延期",
    "is_resolved": 0,
    "created_at": "2025-12-07T00:19:40.000Z",
    "resolved_at": null
  }
]
```

### 索引

| 索引名 | 类型 | 字段 |
|--------|------|------|
| PRIMARY | UNIQUE | id |
| material_id | INDEX | material_id |
| order_id | INDEX | order_id |
| product_id | INDEX | product_id |

---

## 外键关系

| 表名 | 字段 | 引用表 | 引用字段 |
|------|------|--------|----------|
| audit_logs | user_id | users | id |
| bom | material_id | materials | id |
| bom | product_id | products | id |
| in_transit | material_id | materials | id |
| in_transit | purchase_order_id | purchase_orders | id |
| inventory | material_id | materials | id |
| inventory | warehouse_id | warehouses | id |
| material_suppliers | material_id | materials | id |
| material_suppliers | supplier_id | suppliers | id |
| order_lines | order_id | sales_orders | id |
| order_lines | product_id | products | id |
| product_inventory | product_id | products | id |
| product_inventory | warehouse_id | warehouses | id |
| purchase_orders | created_by | users | id |
| purchase_orders | material_id | materials | id |
| purchase_orders | sales_order_id | sales_orders | id |
| purchase_orders | supplier_id | suppliers | id |
| sales_orders | created_by | users | id |
| sales_orders | customer_id | customers | id |
| users | role_id | roles | id |
| warnings | material_id | materials | id |
| warnings | order_id | sales_orders | id |
| warnings | product_id | products | id |
