// server.js
const express = require("express");
const cors = require("cors");
const data = require("./data");

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// 提供完整数据给前端的接口（原来的）
app.get("/api/data", (req, res) => {
  res.json(data);
});

// ✅ 专门给 Dify / 其他服务用的“库存预警”接口
app.get("/api/warnings", (req, res) => {
  // 从 data 里取出 warnings，如果没有就用空数组
  const warnings = Array.isArray(data.warnings) ? data.warnings : [];

  res.json({
    generated_at: new Date().toISOString(), // 生成时间
    total: warnings.length,                  // 预警条数
    warnings,                                // 具体预警列表
  });
});

app.listen(PORT, () => {
  console.log(`Backend API running at http://localhost:${PORT}`);
});
