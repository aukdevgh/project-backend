const express = require('express');
const path = require('path');
const connectDB = require('./config/db');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/products');
const settingsRoutes = require('./routes/settings');
const commentRoutes = require('./routes/comments');

// Загружаем переменные окружения
dotenv.config();

// Создаем сервер
const app = express();
const PORT = process.env.PORT || 3000;

// Подключаем MongoDB
connectDB();

// Устанавливаем middleware для парсинга JSON тела запросов
app.use(express.json());

// Роуты для аутентификации
app.use('/api/auth', authRoutes);

// Роуты для products
app.use('/api/products', productsRoutes);

// Роуты для userSettings
app.use('/api/settings', settingsRoutes);

// Роуты для комментариев
app.use('/api/comments', commentRoutes);

// Настроим статическую папку для изображений
app.use('/api/images', express.static(path.join(__dirname, 'data/images')));

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
