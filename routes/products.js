const fs = require('fs');
const path = require('path');
const express = require('express');
const router = express.Router();

// Чтение данных из файла data.json
const readData = () => {
    const rawData = fs.readFileSync(
        path.join(__dirname, '..', 'data/data.json'),
    );
    return JSON.parse(rawData);
};

// Получение списка всех товаров
router.get('/', (req, res) => {
    const products = readData();
    res.json(products);
});

// Получение информации о товаре по ID
router.get('/:id', (req, res) => {
    const products = readData();
    const product = products.find((p) => p.id == req.params.id);
    if (product) {
        res.json(product);
    } else {
        res.status(404).json({ message: 'Product not found' });
    }
});

module.exports = router;
