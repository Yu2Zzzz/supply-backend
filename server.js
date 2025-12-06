// server.js
const express = require("express");
const cors = require("cors");
const data = require("./data");

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// 提供数据给前端的接口
app.get("/api/data", (req, res) => {
  res.json(data);
});

// ✅ 修改这个路由 - 自动附加采购员信息
app.get("/api/warnings", (req, res) => {
  // 创建物料映射表
  const matMap = {};
  data.mats.forEach(m => {
    matMap[m.code] = m;
  });

  // 给每条预警添加采购员信息
  const warningsWithBuyer = (data.warnings || []).map(w => ({
    ...w,
    buyer: matMap[w.itemCode]?.buyer || null  // 从物料表中获取采购员
  }));

  res.json(warningsWithBuyer);
});

app.listen(PORT, () => {
  console.log(`Backend API running at http://localhost:${PORT}`);
});