const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 🔐 Секреты из .env
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

app.use(cors());
app.use(bodyParser.json());

const orders = [];

// 📩 Отправка сообщения в Telegram
async function sendTelegramMessage(order) {
  console.log("=== 📤 Отправка в Telegram START ===");
  console.log("TELEGRAM_TOKEN:", TELEGRAM_TOKEN ? "✅ Загружен" : "❌ Отсутствует");
  console.log("TELEGRAM_CHAT_ID:", TELEGRAM_CHAT_ID || "❌ Пустой");
  
  const message = `
🚕 <b>Новый заказ</b>
📍 <b>Откуда:</b> ${order.from}
📍 <b>Куда:</b> ${order.to}
🕒 <b>Когда:</b> ${order.datetime}
💳 <b>Оплата:</b> ${order.payment}
☎️ <b>Телефон:</b> ${order.phone}
🚘 <b>Тариф:</b> ${order.tariff}
💰 <b>Цена:</b> ${order.price} ₽
`;

  const url = https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage;
  console.log("📡 Запрос в Telegram API:", url);

  try {
    const response = await axios.post(url, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: "HTML"
    });
    console.log("✅ Ответ Telegram API:", response.data);
    console.log("=== 📤 Отправка в Telegram END ===\n");
    return { success: true };
  } catch (error) {
    console.error("❌ Ошибка отправки в Telegram:", error.message);
    if (error.response) {
      console.error("Ответ Telegram API:", error.response.data);
    }
    console.log("=== 📤 Отправка в Telegram FAIL ===\n");
    return { success: false, error: error.message };
  }
}

// 📬 Приём заказов
app.post('/order', async (req, res) => {
  const order = req.body;
  console.log("=== 📥 Новый заказ START ===");
  console.log(order);

  if (
    !order ||
    !order.phone ||
    !order.from ||
    !order.to ||
    !order.tariff ||
    !order.payment ||
    !order.datetime ||
    order.price === undefined
  ) {
    console.error("❌ Некорректные данные");
    console.log("=== 📥 Новый заказ FAIL ===\n");
    return res.status(400).json({
      error: 'Некорректные данные',
      details: 'Отсутствуют обязательные поля: phone, from, to, tariff, payment, datetime, price'
    });
  }

  orders.push(order);
  const telegramResult = await sendTelegramMessage(order);

  if (telegramResult.success) {
    console.log("=== 📥 Новый заказ END ===\n");
    res.status(201).json({ success: true, message: "Заказ принят и отправлен в Telegram" });
  } else {
    console.log("=== 📥 Новый заказ END с ошибкой ===\n");
    res.status(201).json({
      success: true,
      message: "Заказ принят, но не отправлен в Telegram",
      telegram_error: telegramResult.error
    });
  }
});

// 🚀 Запуск
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен: http://localhost:${PORT}`);
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn("⚠️  TELEGRAM_TOKEN или TELEGRAM_CHAT_ID не установлены!");
  }
});