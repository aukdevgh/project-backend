const mongoose = require("mongoose");

// Модель корзины
const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  items: [
    {
      id: { type: String, required: true },
      name: { type: String, required: true },
      price: { type: String, required: true },
      discountPercentage: { type: String, required: true },
      category: { type: String, required: true },
      image: { type: String, required: true },
      size: { type: String, required: true },
      color: { type: String, required: true },
      quantity: { type: Number, required: true, default: 1 },
    },
  ],
});

const Cart = mongoose.model("Cart", cartSchema);

module.exports = Cart;
