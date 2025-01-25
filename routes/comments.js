const express = require("express");
const Comment = require("../models/Comment");
const authMiddleware = require("../middleware/auth");
const router = express.Router();
const fs = require("fs");
const path = require("path");

// Функция для пагинации
function paginate(array, page, limit) {
  const offset = (page - 1) * limit || 0;
  return array.slice(offset, offset + limit);
}

// Чтение данных из файла reviews.json
const readReviews = () => {
  const rawData = fs.readFileSync(
    path.join(__dirname, "..", "data/reviews.json"),
  );
  return JSON.parse(rawData);
};

// Все отзывы с высоким рейтингом (заглушка)
router.get("/", async (req, res) => {
  const { page, limit } = req.query;

  const parsedPage = parseInt(page);
  const parsedLimit = parseInt(limit);
  const highRatingReviews = readReviews();

  // Общее количество до разбивки на страницы
  const total = highRatingReviews.length;

  // Применяем пагинацию
  const paginatedRatingReviews = paginate(
    highRatingReviews,
    parsedPage,
    parsedLimit,
  );

  // Проверяем, есть ли еще товары для подгрузки
  const hasMore = total > parsedPage * parsedLimit;

  res.json({
    reviews: paginatedRatingReviews,
    total,
    hasMore,
  });
});

// Добавить комментарий с рейтингом к товару
router.post("/:productId", authMiddleware, async (req, res) => {
  const { text, rating } = req.body;
  const { productId } = req.params;

  if (!text || !rating) {
    return res.status(400).json({ msg: "Text and rating are required" });
  }

  // Проверяем, что рейтинг находится в пределах от 1 до 5
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ msg: "Rating must be between 1 and 5" });
  }

  try {
    // Создаем новый комментарий с рейтингом
    const newComment = new Comment({
      productId,
      userId: req.user.id, // id авторизованного пользователя из токена
      text,
      rating,
    });

    // Сохраняем комментарий в базе данных
    await newComment.save();

    res.status(201).json(newComment);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Получить все комментарии к товару
router.get("/:productId", async (req, res) => {
  const { productId } = req.query;

  try {
    const comments = await Comment.find({ productId })
      .populate("userId", "name email") // Можно добавить информацию о пользователе
      .sort({ createdAt: -1 }); // Сортировка по времени создания (от новых к старым)

    if (comments.length === 0) {
      return res.json({
        reviews: [],
        total: 0,
        hasMore: false,
      });
    }
    // Общее количество до разбивки на страницы
    const total = comments.length;

    // Разбивка результатов на страницы
    const offset = (req.query.page - 1) * req.query.limit;
    const limit = req.query.limit ? Number(req.query.limit) : total;
    const paginatedRatingReviews = comments.slice(offset, offset + limit);

    // есть ли еще результаты
    const hasMore = offset + limit < total;

    res.json({
      reviews: paginatedRatingReviews,
      total,
      hasMore,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
