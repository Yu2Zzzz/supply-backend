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

app.listen(PORT, () => {
  console.log(`Backend API running at http://localhost:${PORT}`);
});

