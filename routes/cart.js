const express = require("express");
const Cart = require("../models/Cart");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();
const fs = require("fs");
const path = require("path");

// Чтение данных из файла data.json
const readData = () => {
  const rawData = fs.readFileSync(path.join(__dirname, "..", "data/data.json"));
  return JSON.parse(rawData);
};

// Получение корзины
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = await Cart.create({ userId, items: [] });
    }

    res.json(cart.items);
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Добавление товара в корзину
router.post("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id, size, color, quantity } = req.body;

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    // Проверяем, есть ли товар с таким же id, size и color
    const existingItem = cart.items.find(
      (item) => item.id === id && item.size === size && item.color === color,
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      const products = readData();
      const product = products.find((product) => product.id === id);

      cart.items.push({
        id,
        name: product.name,
        price: product.price,
        discountPercentage: product.discountPercentage,
        category: product.category,
        image: product?.images.find((image) => image.includes(color)) || "",
        size,
        color,
        quantity,
      });
    }

    await cart.save();
    res.status(201).json({ message: "product added successfully" });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Обновление количества товара
router.patch("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id, size, color, quantity } = req.body;

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const item = cart.items.find(
      (item) => item.id === id && item.size === size && item.color === color,
    );

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    item.quantity = quantity;

    await cart.save();
    res.json({ message: "product updated successfully" });
  } catch (error) {
    console.error("Error updating cart item:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Удаление конкретного варианта товара
router.delete("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id, size, color } = req.body;

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = cart.items.filter(
      (item) => !(item.id === id && item.size === size && item.color === color),
    );

    await cart.save();
    res.json({ message: "product removed successfully" });
  } catch (error) {
    console.error("Error removing item from cart:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Очистка всей корзины
router.delete("/clear", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    await Cart.findOneAndUpdate({ userId }, { items: [] });

    res.json({ message: "Cart cleared" });
  } catch (error) {
    console.error("Error clearing cart:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
