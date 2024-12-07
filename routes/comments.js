const express = require('express');
const Comment = require('../models/Comment');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Добавить комментарий с рейтингом к товару
router.post('/:productId', authMiddleware, async (req, res) => {
    const { text, rating } = req.body;
    const { productId } = req.params;

    if (!text || !rating) {
        return res.status(400).json({ msg: 'Text and rating are required' });
    }

    // Проверяем, что рейтинг находится в пределах от 1 до 5
    if (rating < 1 || rating > 5) {
        return res.status(400).json({ msg: 'Rating must be between 1 and 5' });
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
        res.status(500).send('Server Error');
    }
});

// Получить все комментарии к товару
router.get('/:productId', async (req, res) => {
    const { productId } = req.params;

    try {
        const comments = await Comment.find({ productId })
            .populate('userId', 'name email') // Можно добавить информацию о пользователе
            .sort({ createdAt: -1 }); // Сортировка по времени создания (от новых к старым)

        if (comments.length === 0) {
            return res
                .status(404)
                .json({ msg: 'No comments found for this product' });
        }

        res.json(comments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
