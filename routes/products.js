const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

const filterCategories = (categories, prefix) => {
  return categories.filter((category) => category.startsWith(prefix));
};

// Чтение данных из файла data.json
const readData = () => {
  const rawData = fs.readFileSync(path.join(__dirname, "..", "data/data.json"));
  return JSON.parse(rawData);
};

// Функция для пагинации
function paginate(array, page, limit) {
  const offset = (page - 1) * limit || 0;
  return array.slice(offset, offset + limit);
}

// Получение списка всех товаров с пагинацией
router.get("/", (req, res) => {
  const {
    page,
    limit,
    category,
    sortBy,
    order,
    minPrice,
    maxPrice,
    select,
    colors,
    sizes,
  } = req.query;

  const parsedPage = parseInt(page);
  const parsedLimit = parseInt(limit);

  const products = readData();

  let filteredProducts = [...products];

  // Фильтрация по категории, если она указана
  if (category) {
    filteredProducts = filteredProducts.filter((product) =>
      product.category.toLowerCase().startsWith(category.toLowerCase()),
    );
  }

  // Фильтрация по цветам, если они указаны
  if (colors) {
    const selectedColors = colors.split(",");

    filteredProducts = filteredProducts.filter((product) =>
      product.colors.some((color) =>
        selectedColors.some((selectedColor) => color.includes(selectedColor)),
      ),
    );
  }

  // Фильтрация по размерам, если она указана
  if (sizes) {
    const selectedSizes = sizes.split(",");
    filteredProducts = filteredProducts.filter((product) =>
      product.sizes.some((size) => selectedSizes.includes(size)),
    );
  }

  // Фильтрация по диапазону цены
  if (minPrice || maxPrice) {
    filteredProducts = filteredProducts.filter(
      (product) => product.price >= minPrice && product.price <= maxPrice,
    );
  }

  // Сортировка
  if (sortBy) {
    filteredProducts.sort((a, b) => {
      if (sortBy === "rating" || sortBy === "sale") {
        const sortKey = {
          rating: "rating",
          sale: "discountPercentage",
        };

        return order === "desc"
          ? b[sortKey[sortBy]] - a[sortKey[sortBy]]
          : a[sortKey[sortBy]] - b[sortKey[sortBy]];
      } else if (sortBy === "popular") {
        const popularityA = a.rating * a.stock;
        const popularityB = b.rating * b.stock;
        return popularityB - popularityA;
      } else if (sortBy === "price") {
        const getDsicountPrice = (price, discountPercentage) => {
          if (price < 0 || discountPercentage < 0 || discountPercentage > 100) {
            throw new Error("Invalid price or discount percentage");
          }

          const discount = (price * discountPercentage) / 100;
          return price - discount;
        };

        return order === "desc"
          ? getDsicountPrice(b.price, b.discountPercentage) -
              getDsicountPrice(a.price, a.discountPercentage)
          : getDsicountPrice(a.price, a.discountPercentage) -
              getDsicountPrice(b.price, b.discountPercentage);
      } else if (sortBy === "new") {
        return new Date(b.meta.createdAt) - new Date(a.meta.createdAt);
      }
      return 0;
    });
  }

  // Выбранные поля
  if (select) {
    filteredProducts = filteredProducts.map((product) => {
      const selected = {};
      select.split(",").forEach((field) => {
        if (field in product) selected[field] = product[field];
      });
      return selected;
    });
  }

  // Применяем пагинацию
  const paginatedProducts = paginate(filteredProducts, parsedPage, parsedLimit);

  // Проверяем, есть ли еще товары для подгрузки
  const hasMore = filteredProducts.length > parsedPage * parsedLimit;

  res.json({
    products: paginatedProducts,
    total: filteredProducts.length,
    hasMore,
  });
});

// Поиск товаров
router.get("/search", (req, res) => {
  const { q, select } = req.query;

  const products = readData();

  let filteredProducts = [...products];

  // Фильтрация по search параметру, если она указана
  if (q) {
    filteredProducts = filteredProducts.filter((product) =>
      product.name.toLowerCase().includes(q.toLowerCase()),
    );
  }

  if (select) {
    filteredProducts = filteredProducts.map((product) => {
      const selected = {};
      select.split(",").forEach((field) => {
        if (field in product) selected[field] = product[field];
      });
      return selected;
    });
  }

  res.json({ products: filteredProducts });
});

// Список категории
router.get("/category-list", (req, res) => {
  const { category } = req.query;

  const products = readData();

  // Получить все категории
  const categoriesData = products.map((product) => product.category);

  // Получить все категории по префиксу
  const categories = category
    ? filterCategories(categoriesData, category)
    : categoriesData;

  res.json([...new Set(categories)]);
});

// Список цветов
router.get("/colors", (req, res) => {
  const products = readData();

  // Получить все цвета
  const colors = products.flatMap((product) =>
    product.colors.map((color) => {
      if (color.split("-")[1]) {
        return color.split("-")[1];
      }
      return color;
    }),
  );

  res.json([...new Set(colors)]);
});

// Список размеров
router.get("/sizes", (req, res) => {
  const products = readData();

  // Получить все размеры
  const sizes = products.flatMap((product) => product.sizes);

  res.json([...new Set(sizes)]);
});

router.get("/price-limits", (req, res) => {
  const products = readData();

  //sort by price
  products.sort((a, b) => a.price - b.price);

  const minPrice = Math.floor(products[0].price);
  const maxPrice = Math.ceil(products[products.length - 1].price);

  res.json({ min: minPrice, max: maxPrice });
});

// Получение информации о товаре по ID
router.get("/:id", (req, res) => {
  const products = readData();
  const product = products.find((p) => p.id == req.params.id);
  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ message: "Product not found" });
  }
});

module.exports = router;
