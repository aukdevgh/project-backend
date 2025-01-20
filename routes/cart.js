const express = require('express');
const Cart = require('../models/Cart');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Получение корзины
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        // Проверяем, существует ли пользователь
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Ищем корзину для данного пользователя
        const cart = await Cart.findOne({ userId })
            .populate('items.productId') // Заполняем данные о продукте
            .exec();

        if (!cart) {
            return res
                .status(404)
                .json({ message: 'Cart not found for this user' });
        }

        res.json(cart);
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Создание новой корзины (если ее нет) — необязательно
router.post('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { items } = req.body; // Ожидаем массив товаров

        const cart = new Cart({
            userId,
            items,
            total: items.reduce(
                (total, item) => total + item.price * item.quantity,
                0,
            ),
        });

        await cart.save();
        res.status(201).json(cart);
    } catch (error) {
        console.error('Error creating cart:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
