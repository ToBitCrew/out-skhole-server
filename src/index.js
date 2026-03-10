const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "서버 정상 작동 중" });
});

app.listen(PORT, () => {
  console.log(`서버 실행중 : http://localhost:${PORT}`);
});
