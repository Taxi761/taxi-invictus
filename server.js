const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');
// const fs = require('fs'); // Не используется в текущем коде
// const { Parser } = require('json2csv'); // Не используется в текущем коде
// const ExcelJS = require('exceljs'); // Не используется в текущем коде
require('dotenv').config(); // подключение .env

const app = express();
const PORT = process.env.PORT || 3000;

// 🔐 Секреты из .env
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

app.use(cors());
app.use(bodyParser.json());
// app.use(express.static('public')); // Только если у вас есть папка 'public' с фронтендом

// Для логирования (временно, можно убрать)
const orders = [];

// 📩 Отправка сообщения в Telegram
async function sendTelegramMessage(order) {
  console.log("📤 Отправка в Telegram. Token:", TELEGRAM_TOKEN ? "Загружен" : "Отсутствует", "Chat ID:", TELEGRAM_CHAT_ID);

  // Адаптируем поля к формату, ожидаемому сервером, из данных фронтенда
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

  // ИСПРАВЛЕНО: Убраны лишние пробелы в URL
  try {
    const response = await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, // <-- Исправлено
      {
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: "HTML"
      }
    );
    console.log("✅ Сообщение отправлено в Telegram");
    return { success: true };
  } catch (error) {
    console.error("❌ Ошибка отправки в Telegram:", error.message);
    // Добавим больше деталей для отладки
    if (error.response) {
      console.error("Детали ошибки Telegram API:", error.response.data);
    }
    return { success: false, error: error.message };
  }
}

// 📬 Приём заказов
app.post('/order', async (req, res) => {
  const order = req.body;
  console.log("📥 Новый заказ:", JSON.stringify(order, null, 2));

  // ИСПРАВЛЕНО: Проверка полей соответствует данным от фронтенда
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
    console.error("❌ Некорректные данные:", {
      hasPhone: !!order?.phone,
      hasFrom: !!order?.from,
      hasTo: !!order?.to,
      hasTariff: !!order?.tariff,
      hasPayment: !!order?.payment,
      hasDatetime: !!order?.datetime,
      hasPrice: order?.price !== undefined
    });
    return res.status(400).json({ 
      error: 'Некорректные данные', 
      details: 'Отсутствуют обязательные поля: phone, from, to, tariff, payment, datetime, price' 
    });
  }

  orders.push(order);
  
  const telegramResult = await sendTelegramMessage(order);

  if (telegramResult.success) {
    res.status(201).json({ success: true, message: "Заказ принят и уведомление отправлено." });
  } else {
    // Даже если Telegram не сработал, заказ принят
    res.status(201).json({ 
      success: true, 
      message: "Заказ принят, но возникла проблема с уведомлением.", 
      telegram_error: telegramResult.error 
    });
  }
});

// ... (остальные маршруты экспорта закомментированы, так как не используются)

// 🚀 Запуск
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен: http://localhost:${PORT}`);
  // Проверка наличия ключей для отладки
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) {
      console.warn("⚠️  Предупреждение: TELEGRAM_TOKEN или TELEGRAM_CHAT_ID не установлены в .env или Render Environment Variables");
  }
});
