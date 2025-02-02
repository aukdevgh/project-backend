import express from "express";
import Order from "../models/Order.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

// Оформление заказа
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { cartItems, totalPrice, paymentMethod, shippingAddress } = req.body;
    const userId = req.user.id;

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const newOrder = new Order({
      user: userId,
      cartItems,
      totalPrice,
      paymentMethod,
      shippingAddress,
      status: "pending", // Заказ в обработке
    });

    await newOrder.save();

    res.status(201).json({ message: "Order created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Ошибка сервера", error: error.message });
  }
});

export default router;
