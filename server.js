const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');
const { Parser } = require('json2csv');
const ExcelJS = require('exceljs');
require('dotenv').config(); // подключение .env

const app = express();
const PORT = process.env.PORT || 3000;

// 🔐 Секреты из .env
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const orders = [];

// 📩 Отправка сообщения в Telegram
async function sendTelegramMessage(order) {
  const message = `
📦 Новый заказ:
📞 Телефон: ${order.phone}
📍 Откуда: ${order.fromText}
📍 Куда: ${order.toText}
🚗 Тариф: ${order.tariff}
📆 Дата: ${order.date || 'Сегодня'}
⏰ Время: ${order.time || 'Как можно скорее'}
📏 Расстояние: ${order.distanceKm || '—'} км
💰 Стоимость: ${order.price || '—'} ₽
💳 Оплата: ${order.payment}
  `;

  try {
  await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    chat_id: TELEGRAM_CHAT_ID,
    text: message,
    parse_mode: "HTML" // если ты используешь теги
  });
} catch (error) {
  console.error('❌ Ошибка отправки в Telegram:', error.message);
}
}

// 📬 Приём заказов
app.post('/order', async (req, res) => {
  const order = req.body;

  if (
    !order ||
    !order.phone ||
    !order.fromText ||
    !order.toText ||
    !order.tariff ||
    !order.payment
  ) {
    return res.status(400).json({ error: 'Некорректные данные' });
  }

  orders.push(order);
  await sendTelegramMessage(order);

  res.status(201).json({ success: true });
});

// 📤 Экспорт CSV
app.get('/export/csv', (req, res) => {
  const fields = ['phone', 'fromText', 'toText', 'tariff', 'distanceKm', 'price', 'date', 'time', 'payment'];
  const json2csv = new Parser({ fields });
  const csv = json2csv.parse(orders);

  res.header('Content-Type', 'text/csv');
  res.attachment('orders.csv');
  res.send(csv);
});

// 📤 Экспорт Excel
app.get('/export/excel', async (req, res) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Orders');

  worksheet.columns = [
    { header: 'Телефон', key: 'phone' },
    { header: 'Откуда', key: 'fromText' },
    { header: 'Куда', key: 'toText' },
    { header: 'Тариф', key: 'tariff' },
    { header: 'Км', key: 'distanceKm' },
    { header: 'Цена', key: 'price' },
    { header: 'Дата', key: 'date' },
    { header: 'Время', key: 'time' },
    { header: 'Оплата', key: 'payment' },
  ];

  orders.forEach(order => worksheet.addRow(order));

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=orders.xlsx');

  await workbook.xlsx.write(res);
  res.end();
});

// 🚀 Запуск
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен: http://localhost:${PORT}`);
});