require("dotenv").config();

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');
const { Parser } = require('json2csv');
const ExcelJS = require('exceljs');

const app = express();
const PORT = process.env.PORT || 3000;

// 🔐 Вставь сюда токен своего Telegram-бота и ID чата
const TELEGRAM_TOKEN = '8085403378:AAH-MPOKjpeGtHot1Lz651IErCkdGk1F8X4';
const TELEGRAM_CHAT_ID = '-4953236596';

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname)); // чтобы отдавался index.html

const orders = [];

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
    });
  } catch (error) {
    console.error('Ошибка отправки в Telegram:', error.message);
  }
}

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

app.get('/export/csv', (req, res) => {
  const fields = ['phone', 'fromText', 'toText', 'tariff', 'distanceKm', 'price', 'date', 'time', 'payment'];
  const json2csv = new Parser({ fields });
  const csv = json2csv.parse(orders);

  res.header('Content-Type', 'text/csv');
  res.attachment('orders.csv');
  res.send(csv);
});

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

// старт сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен: http://localhost:${PORT}`);
});