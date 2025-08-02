
const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const TELEGRAM_BOT_TOKEN = process.env.BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.CHAT_ID;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.post("/send-order", async (req, res) => {
  const order = req.body;
  const message = `🚖 Новый заказ:

📍 Откуда: ${JSON.stringify(order.from)}
📍 Куда: ${JSON.stringify(order.to)}
📅 Время: ${order.datetime}
💼 Тариф: ${order.tariff}
💳 Оплата: ${order.payment}
📞 Телефон: ${order.phone}`;

  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message
      })
    });
    res.sendStatus(200);
  } catch (err) {
    console.error("Ошибка при отправке в Telegram:", err);
    res.sendStatus(500);
  }
});

app.listen(PORT, () => console.log("Сервер запущен на порту " + PORT));
