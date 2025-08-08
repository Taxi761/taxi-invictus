const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

app.use(cors());
app.use(bodyParser.json());

// Отправка сообщения в Telegram
async function sendTelegramMessage(order) {
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

  try {
    const response = await axios.post(url, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'HTML',
    });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.message, response: error.response?.data };
  }
}

// Приём заказов
app.post('/order', async (req, res) => {
  const order = req.body;

  // Проверяем обязательные поля
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
    return res.status(400).json({
      error: 'Некорректные данные',
      details: 'Отсутствуют обязательные поля: phone, from, to, tariff, payment, datetime, price',
    });
  }

  const telegramResult = await sendTelegramMessage(order);

  if (telegramResult.success) {
    return res.status(201).json({ success: true, message: 'Заказ принят и отправлен в Telegram' });
  } else {
    return res.status(201).json({
      success: true,
      message: 'Заказ принят, но не отправлен в Telegram',
      telegram_error: telegramResult.error,
      telegram_response: telegramResult.response,
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('⚠️ TELEGRAM_TOKEN или TELEGRAM_CHAT_ID не установлены в .env');
  }
});