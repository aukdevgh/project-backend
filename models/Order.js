const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    cartItems: [
      {
        id: { type: String, required: true },
        quantity: { type: Number, required: true },
        color: { type: String, required: true },
        size: { type: String, required: true },
      },
    ],
    totalPrice: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ["visa", "master-card", "pay-pal", "apple-pay", "google-pay"],
      required: true,
    },
    shippingAddress: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "completed", "canceled"],
      default: "pending",
    },
  },
  { timestamps: true },
);

const Order = mongoose.model("Order", OrderSchema);

module.exports = Order;
