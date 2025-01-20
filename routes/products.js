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

// Функция для пагинации
function paginate(array, page, limit) {
    const offset = (page - 1) * limit;
    return array.slice(offset, offset + limit);
}

// Получение списка всех товаров с пагинацией
router.get('/', (req, res) => {
    const { page = 2, limit = 3, category, search } = req.query;
    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);

    const products = readData();

    let filteredProducts = [...products];

    // Фильтрация по категории, если она указана
    if (category) {
        filteredProducts = filteredProducts.filter(
            (product) =>
                product.category.toLowerCase() == category.toLowerCase(),
        );
    }

    // Фильтрация по search параметру, если она указана
    if (search) {
        filteredProducts = filteredProducts.filter((product) =>
            product.name.toLowerCase().includes(search.toLowerCase()),
        );
    }

    // Применяем пагинацию
    const paginatedProducts = paginate(
        filteredProducts,
        parsedPage,
        parsedLimit,
    );

    // Проверяем, есть ли еще товары для подгрузки
    const hasMore = filteredProducts.length > parsedPage * parsedLimit;

    res.json({
        products: paginatedProducts,
        hasMore,
    });
});

router.get('/price-limits', (req, res) => {
    const products = readData();

    //sort by price
    products.sort((a, b) => a.price - b.price);

    const minPrice = Math.floor(products[0].price);
    const maxPrice = Math.ceil(products[products.length - 1].price);

    res.json({ min: minPrice, max: maxPrice });
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
