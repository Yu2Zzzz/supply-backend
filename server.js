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

// ✅ 添加这个新路由
app.get("/api/warnings", (req, res) => {
  res.json(data.warnings || []);
});

app.listen(PORT, () => {
  console.log(`Backend API running at http://localhost:${PORT}`);
});