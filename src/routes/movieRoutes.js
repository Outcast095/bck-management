// это файл movieRoutes.js, 
// она находится по адресу src/routes/movieRoutes.js

import express from "express";

const router = express.Router();


// req - полученная информация от клиента, 
// res - ответ который мы отправляем клиенту.


router.get("/", (req, res) => {
  res.json({ httpMethod: "get" });
});

router.post("/", (req, res) => {
  res.json({ httpMethod: "post" });
});

router.put("/", (req, res) => {
  res.json({ httpMethod: "put" });
});

router.delete("/", (req, res) => {
  res.json({ httpMethod: "delete" });
});

export default router;