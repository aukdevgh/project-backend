const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Устанавливаем middleware для парсинга JSON тела запросов
app.use(express.json());

// Настроим статическую папку для изображений
app.use('/images', express.static(path.join(__dirname, 'data/images')));

// Настройка хранилища для изображений (используем Multer)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'data/images'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));  // Добавляем уникальное имя файлу
  }
});

const upload = multer({ storage: storage });

// Чтение данных из файла data.json
const readData = () => {
  const rawData = fs.readFileSync(path.join(__dirname, 'data/data.json'));
  return JSON.parse(rawData);
};

// Запись данных в файл data.json
const writeData = (data) => {
  fs.writeFileSync(path.join(__dirname, 'data/data.json'), JSON.stringify(data, null, 2));
};

// Получение списка всех товаров
app.get('/products', (req, res) => {
  const products = readData();
  res.json(products);
});

// Получение информации о товаре по ID
app.get('/products/:id', (req, res) => {
  const products = readData();
  const product = products.find(p => p.id == req.params.id);
  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ message: "Product not found" });
  }
});

// Добавление нового продукта
app.post('/products', (req, res) => {
  const products = readData();
  const newProduct = req.body;
  newProduct.id = products.length ? products[products.length - 1].id + 1 : 1;
  products.push(newProduct);
  writeData(products);
  res.status(201).json(newProduct);
});

// Загрузка изображения для продукта
app.post('/upload', upload.array('images', 10), (req, res) => {
  res.json({
    message: 'Images uploaded successfully',
    files: req.files
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
