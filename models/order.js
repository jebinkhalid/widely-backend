const mongoose = require("mongoose"); // 👈 THIS LINE MUST BE AT THE TOP

const OrderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  item: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String }, 
  address: { type: String },
  paymentMethod: { type: String },
  status: { type: String, default: "Placed" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Order", OrderSchema);