const MOCK_DATA = {
  "orders": [
    {
      "id": "SO2025-001",
      "customer": "沃尔玛中国",
      "orderDate": "2024-11-10",
      "deliveryDate": "2024-12-18",
      "salesPerson": "张伟"
    },
    {
      "id": "SO2025-002",
      "customer": "迪卡侬上海",
      "orderDate": "2024-11-15",
      "deliveryDate": "2024-12-12",
      "salesPerson": "李娜"
    },
    {
      "id": "SO2025-003",
      "customer": "宜家家居",
      "orderDate": "2024-11-20",
      "deliveryDate": "2024-12-28",
      "salesPerson": "王强"
    },
    {
      "id": "SO2025-004",
      "customer": "京东自营",
      "orderDate": "2024-11-22",
      "deliveryDate": "2024-12-15",
      "salesPerson": "张伟"
    },
    {
      "id": "SO2025-005",
      "customer": "苏宁易购",
      "orderDate": "2024-11-25",
      "deliveryDate": "2024-12-30",
      "salesPerson": "李娜"
    },
    {
      "id": "SO2025-006",
      "customer": "天猫国际",
      "orderDate": "2024-11-28",
      "deliveryDate": "2024-12-08",
      "salesPerson": "王强"
    }
  ],
  "orderLines": [
    {
      "orderId": "SO2025-001",
      "productCode": "PRD-CHAIR-001",
      "productName": "户外折叠椅A型",
      "qty": 3000
    },
    {
      "orderId": "SO2025-001",
      "productCode": "PRD-TABLE-001",
      "productName": "便携折叠桌",
      "qty": 1500
    },
    {
      "orderId": "SO2025-002",
      "productCode": "PRD-CHAIR-002",
      "productName": "户外折叠椅B型",
      "qty": 5000
    },
    {
      "orderId": "SO2025-002",
      "productCode": "PRD-TENT-001",
      "productName": "露营帐篷3人款",
      "qty": 800
    },
    {
      "orderId": "SO2025-003",
      "productCode": "PRD-TABLE-002",
      "productName": "多功能野餐桌",
      "qty": 2000
    },
    {
      "orderId": "SO2025-003",
      "productCode": "PRD-CHAIR-001",
      "productName": "户外折叠椅A型",
      "qty": 2500
    },
    {
      "orderId": "SO2025-004",
      "productCode": "PRD-CHAIR-002",
      "productName": "户外折叠椅B型",
      "qty": 4000
    },
    {
      "orderId": "SO2025-004",
      "productCode": "PRD-CABINET-001",
      "productName": "户外储物柜",
      "qty": 600
    },
    {
      "orderId": "SO2025-005",
      "productCode": "PRD-TABLE-001",
      "productName": "便携折叠桌",
      "qty": 1800
    },
    {
      "orderId": "SO2025-005",
      "productCode": "PRD-TENT-001",
      "productName": "露营帐篷3人款",
      "qty": 1200
    },
    {
      "orderId": "SO2025-006",
      "productCode": "PRD-CHAIR-001",
      "productName": "户外折叠椅A型",
      "qty": 6000
    },
    {
      "orderId": "SO2025-006",
      "productCode": "PRD-TABLE-002",
      "productName": "多功能野餐桌",
      "qty": 1000
    }
  ],
  "products": [
    {
      "code": "PRD-CHAIR-001",
      "name": "户外折叠椅A型"
    },
    {
      "code": "PRD-CHAIR-002",
      "name": "户外折叠椅B型"
    },
    {
      "code": "PRD-TABLE-001",
      "name": "便携折叠桌"
    },
    {
      "code": "PRD-TABLE-002",
      "name": "多功能野餐桌"
    },
    {
      "code": "PRD-TENT-001",
      "name": "露营帐篷3人款"
    },
    {
      "code": "PRD-CABINET-001",
      "name": "户外储物柜"
    }
  ],
  "bom": [
    {
      "p": "PRD-CHAIR-001",
      "m": "MAT-STEEL-001",
      "c": 4
    },
    {
      "p": "PRD-CHAIR-001",
      "m": "MAT-FABRIC-001",
      "c": 2
    },
    {
      "p": "PRD-CHAIR-001",
      "m": "MAT-RIVET-001",
      "c": 12
    },
    {
      "p": "PRD-CHAIR-001",
      "m": "MAT-PLASTIC-001",
      "c": 8
    },
    {
      "p": "PRD-CHAIR-002",
      "m": "MAT-STEEL-002",
      "c": 5
    },
    {
      "p": "PRD-CHAIR-002",
      "m": "MAT-FABRIC-002",
      "c": 2
    },
    {
      "p": "PRD-CHAIR-002",
      "m": "MAT-RIVET-001",
      "c": 16
    },
    {
      "p": "PRD-CHAIR-002",
      "m": "MAT-PLASTIC-002",
      "c": 6
    },
    {
      "p": "PRD-CHAIR-002",
      "m": "MAT-FOAM-001",
      "c": 1
    },
    {
      "p": "PRD-TABLE-001",
      "m": "MAT-STEEL-001",
      "c": 6
    },
    {
      "p": "PRD-TABLE-001",
      "m": "MAT-BOARD-001",
      "c": 1
    },
    {
      "p": "PRD-TABLE-001",
      "m": "MAT-RIVET-002",
      "c": 20
    },
    {
      "p": "PRD-TABLE-001",
      "m": "MAT-PLASTIC-001",
      "c": 4
    },
    {
      "p": "PRD-TABLE-002",
      "m": "MAT-STEEL-003",
      "c": 8
    },
    {
      "p": "PRD-TABLE-002",
      "m": "MAT-BOARD-002",
      "c": 1
    },
    {
      "p": "PRD-TABLE-002",
      "m": "MAT-RIVET-002",
      "c": 24
    },
    {
      "p": "PRD-TABLE-002",
      "m": "MAT-PLASTIC-003",
      "c": 8
    },
    {
      "p": "PRD-TABLE-002",
      "m": "MAT-HINGE-001",
      "c": 4
    },
    {
      "p": "PRD-TENT-001",
      "m": "MAT-FABRIC-003",
      "c": 12
    },
    {
      "p": "PRD-TENT-001",
      "m": "MAT-POLE-001",
      "c": 8
    },
    {
      "p": "PRD-TENT-001",
      "m": "MAT-ROPE-001",
      "c": 15
    },
    {
      "p": "PRD-TENT-001",
      "m": "MAT-PEG-001",
      "c": 20
    },
    {
      "p": "PRD-TENT-001",
      "m": "MAT-ZIPPER-001",
      "c": 3
    },
    {
      "p": "PRD-CABINET-001",
      "m": "MAT-STEEL-003",
      "c": 12
    },
    {
      "p": "PRD-CABINET-001",
      "m": "MAT-BOARD-003",
      "c": 4
    },
    {
      "p": "PRD-CABINET-001",
      "m": "MAT-HINGE-002",
      "c": 6
    },
    {
      "p": "PRD-CABINET-001",
      "m": "MAT-HANDLE-001",
      "c": 2
    },
    {
      "p": "PRD-CABINET-001",
      "m": "MAT-LOCK-001",
      "c": 1
    }
  ],
  "mats": [
    {
      "code": "MAT-STEEL-001",
      "name": "Q235方管",
      "spec": "20*20*1.2mm 喷粉黑",
      "unit": "PCS",
      "price": 18.5,
      "inv": 25000,
      "transit": 30000,
      "safe": 40000,
      "lead": 15,
      "suppliers": 3,
      "buyer": "刘洋"
    },
    {
      "code": "MAT-STEEL-002",
      "name": "Q235方管加厚",
      "spec": "25*25*1.5mm 喷粉灰",
      "unit": "PCS",
      "price": 24.8,
      "inv": 8000,
      "transit": 0,
      "safe": 25000,
      "lead": 18,
      "suppliers": 1,
      "buyer": "刘洋"
    },
    {
      "code": "MAT-STEEL-003",
      "name": "Q235角钢",
      "spec": "30*30*3mm 镀锌",
      "unit": "PCS",
      "price": 32.0,
      "inv": 12000,
      "transit": 15000,
      "safe": 20000,
      "lead": 20,
      "suppliers": 2,
      "buyer": "刘洋"
    },
    {
      "code": "MAT-FABRIC-001",
      "name": "600D牛津布",
      "spec": "防水PVC涂层 黑色",
      "unit": "M",
      "price": 12.5,
      "inv": 18000,
      "transit": 20000,
      "safe": 30000,
      "lead": 25,
      "suppliers": 2,
      "buyer": "陈明"
    },
    {
      "code": "MAT-FABRIC-002",
      "name": "800D牛津布",
      "spec": "防水PU涂层 蓝色",
      "unit": "M",
      "price": 15.8,
      "inv": 5000,
      "transit": 8000,
      "safe": 18000,
      "lead": 30,
      "suppliers": 1,
      "buyer": "陈明"
    },
    {
      "code": "MAT-FABRIC-003",
      "name": "210T涤纶布",
      "spec": "防撕裂 防水 橙色",
      "unit": "M",
      "price": 8.2,
      "inv": 15000,
      "transit": 0,
      "safe": 25000,
      "lead": 28,
      "suppliers": 2,
      "buyer": "陈明"
    },
    {
      "code": "MAT-RIVET-001",
      "name": "铝铆钉",
      "spec": "4*10mm 银色",
      "unit": "PCS",
      "price": 0.15,
      "inv": 280000,
      "transit": 500000,
      "safe": 300000,
      "lead": 10,
      "suppliers": 3,
      "buyer": "刘洋"
    },
    {
      "code": "MAT-RIVET-002",
      "name": "铝铆钉加长",
      "spec": "5*15mm 黑色",
      "unit": "PCS",
      "price": 0.22,
      "inv": 180000,
      "transit": 200000,
      "safe": 250000,
      "lead": 10,
      "suppliers": 2,
      "buyer": "刘洋"
    },
    {
      "code": "MAT-PLASTIC-001",
      "name": "ABS脚垫",
      "spec": "直径30mm 黑色",
      "unit": "PCS",
      "price": 0.85,
      "inv": 95000,
      "transit": 80000,
      "safe": 120000,
      "lead": 12,
      "suppliers": 2,
      "buyer": "刘洋"
    },
    {
      "code": "MAT-PLASTIC-002",
      "name": "PP扶手套",
      "spec": "弧形 灰色",
      "unit": "PCS",
      "price": 2.3,
      "inv": 32000,
      "transit": 25000,
      "safe": 50000,
      "lead": 15,
      "suppliers": 1,
      "buyer": "刘洋"
    },
    {
      "code": "MAT-PLASTIC-003",
      "name": "PE桌角保护套",
      "spec": "方形 透明",
      "unit": "PCS",
      "price": 1.2,
      "inv": 18000,
      "transit": 30000,
      "safe": 35000,
      "lead": 12,
      "suppliers": 2,
      "buyer": "刘洋"
    },
    {
      "code": "MAT-BOARD-001",
      "name": "多层板",
      "spec": "600*400*12mm 防水",
      "unit": "PCS",
      "price": 28.0,
      "inv": 4500,
      "transit": 0,
      "safe": 8000,
      "lead": 22,
      "suppliers": 1,
      "buyer": "陈明"
    },
    {
      "code": "MAT-BOARD-002",
      "name": "竹木板",
      "spec": "800*600*15mm 本色",
      "unit": "PCS",
      "price": 45.0,
      "inv": 2800,
      "transit": 5000,
      "safe": 6000,
      "lead": 25,
      "suppliers": 2,
      "buyer": "陈明"
    },
    {
      "code": "MAT-BOARD-003",
      "name": "镀锌铁板",
      "spec": "500*400*1mm",
      "unit": "PCS",
      "price": 18.5,
      "inv": 6500,
      "transit": 8000,
      "safe": 10000,
      "lead": 18,
      "suppliers": 2,
      "buyer": "陈明"
    },
    {
      "code": "MAT-FOAM-001",
      "name": "高密度海绵",
      "spec": "300*250*30mm",
      "unit": "PCS",
      "price": 5.5,
      "inv": 8500,
      "transit": 10000,
      "safe": 15000,
      "lead": 20,
      "suppliers": 2,
      "buyer": "陈明"
    },
    {
      "code": "MAT-HINGE-001",
      "name": "不锈钢铰链",
      "spec": "50*35mm",
      "unit": "PCS",
      "price": 3.8,
      "inv": 18000,
      "transit": 20000,
      "safe": 25000,
      "lead": 15,
      "suppliers": 2,
      "buyer": "刘洋"
    },
    {
      "code": "MAT-HINGE-002",
      "name": "重型铰链",
      "spec": "75*50mm 镀铬",
      "unit": "PCS",
      "price": 6.5,
      "inv": 5200,
      "transit": 6000,
      "safe": 8000,
      "lead": 18,
      "suppliers": 1,
      "buyer": "刘洋"
    },
    {
      "code": "MAT-POLE-001",
      "name": "玻璃纤维杆",
      "spec": "直径11mm 长度1.2m",
      "unit": "PCS",
      "price": 8.8,
      "inv": 12000,
      "transit": 0,
      "safe": 18000,
      "lead": 35,
      "suppliers": 1,
      "buyer": "陈明"
    },
    {
      "code": "MAT-ROPE-001",
      "name": "尼龙绳",
      "spec": "直径5mm 黄色",
      "unit": "M",
      "price": 0.8,
      "inv": 28000,
      "transit": 30000,
      "safe": 35000,
      "lead": 12,
      "suppliers": 3,
      "buyer": "陈明"
    },
    {
      "code": "MAT-PEG-001",
      "name": "钢地钉",
      "spec": "长度250mm",
      "unit": "PCS",
      "price": 1.5,
      "inv": 35000,
      "transit": 40000,
      "safe": 50000,
      "lead": 10,
      "suppliers": 2,
      "buyer": "刘洋"
    },
    {
      "code": "MAT-ZIPPER-001",
      "name": "尼龙拉链",
      "spec": "5号 双头 黑色",
      "unit": "PCS",
      "price": 2.2,
      "inv": 4500,
      "transit": 0,
      "safe": 8000,
      "lead": 20,
      "suppliers": 1,
      "buyer": "陈明"
    },
    {
      "code": "MAT-HANDLE-001",
      "name": "铝合金把手",
      "spec": "长度120mm 磨砂黑",
      "unit": "PCS",
      "price": 4.5,
      "inv": 3800,
      "transit": 5000,
      "safe": 6000,
      "lead": 15,
      "suppliers": 2,
      "buyer": "刘洋"
    },
    {
      "code": "MAT-LOCK-001",
      "name": "密码锁",
      "spec": "3位数字 镀铬",
      "unit": "PCS",
      "price": 12.0,
      "inv": 2200,
      "transit": 3000,
      "safe": 4000,
      "lead": 25,
      "suppliers": 1,
      "buyer": "陈明"
    }
  ],
  "suppliers": [
    {
      "mat": "MAT-STEEL-001",
      "id": "S001",
      "name": "宝钢集团",
      "main": true,
      "onTime": 0.96,
      "quality": 0.98
    },
    {
      "mat": "MAT-STEEL-001",
      "id": "S002",
      "name": "鞍钢股份",
      "main": false,
      "onTime": 0.92,
      "quality": 0.96
    },
    {
      "mat": "MAT-STEEL-001",
      "id": "S003",
      "name": "首钢集团",
      "main": false,
      "onTime": 0.89,
      "quality": 0.95
    },
    {
      "mat": "MAT-STEEL-002",
      "id": "S004",
      "name": "马钢股份",
      "main": true,
      "onTime": 0.78,
      "quality": 0.94
    },
    {
      "mat": "MAT-STEEL-003",
      "id": "S001",
      "name": "宝钢集团",
      "main": true,
      "onTime": 0.95,
      "quality": 0.98
    },
    {
      "mat": "MAT-STEEL-003",
      "id": "S005",
      "name": "河北钢铁",
      "main": false,
      "onTime": 0.88,
      "quality": 0.93
    },
    {
      "mat": "MAT-FABRIC-001",
      "id": "S006",
      "name": "浙江永盛纺织",
      "main": true,
      "onTime": 0.91,
      "quality": 0.96
    },
    {
      "mat": "MAT-FABRIC-001",
      "id": "S007",
      "name": "江苏恒力集团",
      "main": false,
      "onTime": 0.87,
      "quality": 0.94
    },
    {
      "mat": "MAT-FABRIC-002",
      "id": "S008",
      "name": "广东联邦纺织",
      "main": true,
      "onTime": 0.82,
      "quality": 0.95
    },
    {
      "mat": "MAT-FABRIC-003",
      "id": "S006",
      "name": "浙江永盛纺织",
      "main": true,
      "onTime": 0.91,
      "quality": 0.96
    },
    {
      "mat": "MAT-FABRIC-003",
      "id": "S009",
      "name": "绍兴华联纺织",
      "main": false,
      "onTime": 0.89,
      "quality": 0.93
    },
    {
      "mat": "MAT-RIVET-001",
      "id": "S010",
      "name": "温州五金城",
      "main": true,
      "onTime": 0.94,
      "quality": 0.97
    },
    {
      "mat": "MAT-RIVET-001",
      "id": "S011",
      "name": "永康标准件厂",
      "main": false,
      "onTime": 0.90,
      "quality": 0.95
    },
    {
      "mat": "MAT-RIVET-001",
      "id": "S012",
      "name": "宁波紧固件",
      "main": false,
      "onTime": 0.88,
      "quality": 0.94
    },
    {
      "mat": "MAT-RIVET-002",
      "id": "S010",
      "name": "温州五金城",
      "main": true,
      "onTime": 0.94,
      "quality": 0.97
    },
    {
      "mat": "MAT-RIVET-002",
      "id": "S012",
      "name": "宁波紧固件",
      "main": false,
      "onTime": 0.88,
      "quality": 0.94
    },
    {
      "mat": "MAT-PLASTIC-001",
      "id": "S013",
      "name": "台州塑料制品",
      "main": true,
      "onTime": 0.93,
      "quality": 0.96
    },
    {
      "mat": "MAT-PLASTIC-001",
      "id": "S014",
      "name": "余姚模具城",
      "main": false,
      "onTime": 0.89,
      "quality": 0.94
    },
    {
      "mat": "MAT-PLASTIC-002",
      "id": "S015",
      "name": "佛山塑胶厂",
      "main": true,
      "onTime": 0.81,
      "quality": 0.92
    },
    {
      "mat": "MAT-PLASTIC-003",
      "id": "S013",
      "name": "台州塑料制品",
      "main": true,
      "onTime": 0.93,
      "quality": 0.96
    },
    {
      "mat": "MAT-PLASTIC-003",
      "id": "S016",
      "name": "东莞宏大塑胶",
      "main": false,
      "onTime": 0.86,
      "quality": 0.93
    },
    {
      "mat": "MAT-BOARD-001",
      "id": "S017",
      "name": "山东临沂板材",
      "main": true,
      "onTime": 0.79,
      "quality": 0.91
    },
    {
      "mat": "MAT-BOARD-002",
      "id": "S018",
      "name": "浙江安吉竹业",
      "main": true,
      "onTime": 0.90,
      "quality": 0.95
    },
    {
      "mat": "MAT-BOARD-002",
      "id": "S019",
      "name": "福建竹木",
      "main": false,
      "onTime": 0.85,
      "quality": 0.92
    },
    {
      "mat": "MAT-BOARD-003",
      "id": "S020",
      "name": "上海钣金加工",
      "main": true,
      "onTime": 0.92,
      "quality": 0.96
    },
    {
      "mat": "MAT-BOARD-003",
      "id": "S021",
      "name": "苏州精密钣金",
      "main": false,
      "onTime": 0.88,
      "quality": 0.94
    },
    {
      "mat": "MAT-FOAM-001",
      "id": "S022",
      "name": "顺德海绵厂",
      "main": true,
      "onTime": 0.91,
      "quality": 0.95
    },
    {
      "mat": "MAT-FOAM-001",
      "id": "S023",
      "name": "东莞泡绵制品",
      "main": false,
      "onTime": 0.87,
      "quality": 0.93
    },
    {
      "mat": "MAT-HINGE-001",
      "id": "S024",
      "name": "中山五金配件",
      "main": true,
      "onTime": 0.93,
      "quality": 0.97
    },
    {
      "mat": "MAT-HINGE-001",
      "id": "S025",
      "name": "江门铰链厂",
      "main": false,
      "onTime": 0.89,
      "quality": 0.94
    },
    {
      "mat": "MAT-HINGE-002",
      "id": "S024",
      "name": "中山五金配件",
      "main": true,
      "onTime": 0.93,
      "quality": 0.97
    },
    {
      "mat": "MAT-POLE-001",
      "id": "S026",
      "name": "威海玻纤制品",
      "main": true,
      "onTime": 0.76,
      "quality": 0.90
    },
    {
      "mat": "MAT-ROPE-001",
      "id": "S027",
      "name": "青岛绳缆厂",
      "main": true,
      "onTime": 0.95,
      "quality": 0.98
    },
    {
      "mat": "MAT-ROPE-001",
      "id": "S028",
      "name": "烟台绳网",
      "main": false,
      "onTime": 0.92,
      "quality": 0.96
    },
    {
      "mat": "MAT-ROPE-001",
      "id": "S029",
      "name": "江苏绳业",
      "main": false,
      "onTime": 0.88,
      "quality": 0.94
    },
    {
      "mat": "MAT-PEG-001",
      "id": "S010",
      "name": "温州五金城",
      "main": true,
      "onTime": 0.94,
      "quality": 0.97
    },
    {
      "mat": "MAT-PEG-001",
      "id": "S030",
      "name": "义乌小商品",
      "main": false,
      "onTime": 0.90,
      "quality": 0.95
    },
    {
      "mat": "MAT-ZIPPER-001",
      "id": "S031",
      "name": "YKK拉链",
      "main": true,
      "onTime": 0.80,
      "quality": 0.99
    },
    {
      "mat": "MAT-HANDLE-001",
      "id": "S032",
      "name": "广东铝材加工",
      "main": true,
      "onTime": 0.91,
      "quality": 0.96
    },
    {
      "mat": "MAT-HANDLE-001",
      "id": "S033",
      "name": "佛山铝业",
      "main": false,
      "onTime": 0.87,
      "quality": 0.93
    },
    {
      "mat": "MAT-LOCK-001",
      "id": "S034",
      "name": "深圳智能锁具",
      "main": true,
      "onTime": 0.83,
      "quality": 0.95
    }
  ],
  "pos": [
    {
      "po": "PO2025-001",
      "mat": "MAT-STEEL-001",
      "supplier": "宝钢集团",
      "qty": 40000,
      "amt": 740000,
      "date": "2024-12-20",
      "status": "shipped"
    },
    {
      "po": "PO2025-002",
      "mat": "MAT-STEEL-002",
      "supplier": "马钢股份",
      "qty": 30000,
      "amt": 744000,
      "date": "2024-12-25",
      "status": "producing"
    },
    {
      "po": "PO2025-003",
      "mat": "MAT-FABRIC-001",
      "supplier": "浙江永盛纺织",
      "qty": 25000,
      "amt": 312500,
      "date": "2024-12-18",
      "status": "shipped"
    },
    {
      "po": "PO2025-004",
      "mat": "MAT-FABRIC-002",
      "supplier": "广东联邦纺织",
      "qty": 15000,
      "amt": 237000,
      "date": "2024-12-28",
      "status": "confirmed"
    },
    {
      "po": "PO2025-005",
      "mat": "MAT-BOARD-001",
      "supplier": "山东临沂板材",
      "qty": 8000,
      "amt": 224000,
      "date": "2024-12-30",
      "status": "confirmed"
    },
    {
      "po": "PO2025-006",
      "mat": "MAT-BOARD-002",
      "supplier": "浙江安吉竹业",
      "qty": 6000,
      "amt": 270000,
      "date": "2024-12-22",
      "status": "producing"
    },
    {
      "po": "PO2025-007",
      "mat": "MAT-PLASTIC-002",
      "supplier": "佛山塑胶厂",
      "qty": 35000,
      "amt": 80500,
      "date": "2024-12-26",
      "status": "confirmed"
    },
    {
      "po": "PO2025-008",
      "mat": "MAT-RIVET-001",
      "supplier": "温州五金城",
      "qty": 600000,
      "amt": 90000,
      "date": "2024-12-16",
      "status": "arrived"
    },
    {
      "po": "PO2025-009",
      "mat": "MAT-RIVET-002",
      "supplier": "温州五金城",
      "qty": 250000,
      "amt": 55000,
      "date": "2024-12-17",
      "status": "shipped"
    },
    {
      "po": "PO2025-010",
      "mat": "MAT-PLASTIC-001",
      "supplier": "台州塑料制品",
      "qty": 100000,
      "amt": 85000,
      "date": "2024-12-19",
      "status": "shipped"
    },
    {
      "po": "PO2025-011",
      "mat": "MAT-PLASTIC-003",
      "supplier": "台州塑料制品",
      "qty": 35000,
      "amt": 42000,
      "date": "2024-12-21",
      "status": "producing"
    },
    {
      "po": "PO2025-012",
      "mat": "MAT-STEEL-003",
      "supplier": "宝钢集团",
      "qty": 20000,
      "amt": 640000,
      "date": "2024-12-23",
      "status": "producing"
    },
    {
      "po": "PO2025-013",
      "mat": "MAT-HINGE-001",
      "supplier": "中山五金配件",
      "qty": 25000,
      "amt": 95000,
      "date": "2024-12-18",
      "status": "shipped"
    },
    {
      "po": "PO2025-014",
      "mat": "MAT-HINGE-002",
      "supplier": "中山五金配件",
      "qty": 7000,
      "amt": 45500,
      "date": "2024-12-24",
      "status": "producing"
    },
    {
      "po": "PO2025-015",
      "mat": "MAT-POLE-001",
      "supplier": "威海玻纤制品",
      "qty": 20000,
      "amt": 176000,
      "date": "2025-01-05",
      "status": "confirmed"
    },
    {
      "po": "PO2025-016",
      "mat": "MAT-ROPE-001",
      "supplier": "青岛绳缆厂",
      "qty": 35000,
      "amt": 28000,
      "date": "2024-12-20",
      "status": "shipped"
    },
    {
      "po": "PO2025-017",
      "mat": "MAT-ZIPPER-001",
      "supplier": "YKK拉链",
      "qty": 8000,
      "amt": 17600,
      "date": "2024-12-29",
      "status": "confirmed"
    },
    {
      "po": "PO2025-018",
      "mat": "MAT-HANDLE-001",
      "supplier": "广东铝材加工",
      "qty": 6000,
      "amt": 27000,
      "date": "2024-12-21",
      "status": "producing"
    },
    {
      "po": "PO2025-019",
      "mat": "MAT-LOCK-001",
      "supplier": "深圳智能锁具",
      "qty": 3500,
      "amt": 42000,
      "date": "2024-12-27",
      "status": "producing"
    },
    {
      "po": "PO2025-020",
      "mat": "MAT-FOAM-001",
      "supplier": "顺德海绵厂",
      "qty": 12000,
      "amt": 66000,
      "date": "2024-12-22",
      "status": "producing"
    }
  ],
  "warnings": [
    {
      "level": "RED",
      "itemCode": "MAT-STEEL-002",
      "itemName": "Q235方管加厚",
      "productName": "户外折叠椅B型",
      "orderId": "SO2025-002",
      "stockQty": 8000,
      "demandQty": 45000,
      "safetyStock": 25000,
      "dueDate": "2024-12-12",
      "supplier": "马钢股份"
    },
    {
      "level": "RED",
      "itemCode": "MAT-FABRIC-002",
      "itemName": "800D牛津布",
      "productName": "户外折叠椅B型",
      "orderId": "SO2025-002",
      "stockQty": 5000,
      "demandQty": 18000,
      "safetyStock": 18000,
      "dueDate": "2024-12-12",
      "supplier": "广东联邦纺织"
    },
    {
      "level": "RED",
      "itemCode": "MAT-BOARD-001",
      "itemName": "多层板",
      "productName": "便携折叠桌",
      "orderId": "SO2025-001",
      "stockQty": 4500,
      "demandQty": 3300,
      "safetyStock": 8000,
      "dueDate": "2024-12-18",
      "supplier": "山东临沂板材"
    },
    {
      "level": "ORANGE",
      "itemCode": "MAT-FABRIC-003",
      "itemName": "210T涤纶布",
      "productName": "露营帐篷3人款",
      "orderId": "SO2025-006",
      "stockQty": 15000,
      "demandQty": 24000,
      "safetyStock": 25000,
      "dueDate": "2024-12-08",
      "supplier": "浙江永盛纺织"
    },
    {
      "level": "ORANGE",
      "itemCode": "MAT-POLE-001",
      "itemName": "玻璃纤维杆",
      "productName": "露营帐篷3人款",
      "orderId": "SO2025-002",
      "stockQty": 12000,
      "demandQty": 16000,
      "safetyStock": 18000,
      "dueDate": "2024-12-12",
      "supplier": "威海玻纤制品"
    },
    {
      "level": "YELLOW",
      "itemCode": "MAT-ZIPPER-001",
      "itemName": "尼龙拉链",
      "productName": "露营帐篷3人款",
      "orderId": "SO2025-005",
      "stockQty": 4500,
      "demandQty": 6000,
      "safetyStock": 8000,
      "dueDate": "2024-12-30",
      "supplier": "YKK拉链"
    },
    {
      "level": "YELLOW",
      "itemCode": "MAT-PLASTIC-002",
      "itemName": "PP扶手套",
      "productName": "户外折叠椅B型",
      "orderId": "SO2025-004",
      "stockQty": 32000,
      "demandQty": 54000,
      "safetyStock": 50000,
      "dueDate": "2024-12-15",
      "supplier": "佛山塑胶厂"
    },
    {
      "level": "BLUE",
      "itemCode": "MAT-BOARD-002",
      "itemName": "竹木板",
      "productName": "多功能野餐桌",
      "orderId": "SO2025-003",
      "stockQty": 2800,
      "demandQty": 3000,
      "safetyStock": 6000,
      "dueDate": "2024-12-28",
      "supplier": "浙江安吉竹业"
    },
    {
      "level": "BLUE",
      "itemCode": "MAT-LOCK-001",
      "itemName": "密码锁",
      "productName": "户外储物柜",
      "orderId": "SO2025-004",
      "stockQty": 2200,
      "demandQty": 600,
      "safetyStock": 4000,
      "dueDate": "2024-12-15",
      "supplier": "深圳智能锁具"
    }
  ]
};

module.exports = MOCK_DATA;