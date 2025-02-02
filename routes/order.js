const authMiddleware = require("../middleware/authMiddleware");
const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const fs = require("fs");
const path = require("path");

// Чтение данных из файла data.json
const readData = () => {
  const rawData = fs.readFileSync(path.join(__dirname, "..", "data/data.json"));
  return JSON.parse(rawData);
};

const products = readData();

router.post("/checkout", authMiddleware, async (req, res) => {
  try {
    const { cartItems, totalPrice, paymentMethod, shippingAddress } = req.body;
    const userId = req.user.id;

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ message: "Корзина пуста" });
    }

    // Создаем новый заказ
    const order = new Order({
      userId,
      cartItems,
      totalPrice,
      paymentMethod,
      shippingAddress,
      status: "pending",
    });

    await order.save();

    // Очищаем корзину после оформления заказа
    await Cart.findOneAndDelete({ userId });

    res.status(201).json({ message: "Order created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.get("/orders", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });

    const completedOrders = orders.map((order) => {
      const items = order.cartItems.map((item) => {
        const product = products.find((product) => product.id === item.id);

        return {
          id: item.id,
          name: product.name,
          price: product.price,
          discountPercentage: product.discountPercentage,
          category: product.category,
          image:
            product?.images.find((image) => image.includes(item.color)) || "",
          size: item.size,
          color: item.color,
          quantity: item.quantity,
        };
      });

      return {
        id: order.id,
        cartItems: items,
        totalPrice: Number(order.totalPrice.toFixed(2)),
        paymentMethod: order.paymentMethod,
        shippingAddress: order.shippingAddress,
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      };
    });

    res.status(200).json(completedOrders);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
