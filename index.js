require("dotenv").config()
const express = require("express");
const app = express();

app.get("/ali", (req, res) => {
  res.send("hello world");
});
app.listen(process.env.PORT, () => {
  console.log(`example app listening, ${port}`);
});
