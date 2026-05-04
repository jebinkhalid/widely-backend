const mongoose = require("mongoose");

// This defines exactly what information goes into MongoDB
const OrderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  item: { type: String, required: true },
  price: { type: Number, required: true },
  status: { type: String, default: "Success" },
  createdAt: { type: Date, default: Date.now },
});

// We export it so server.js can use it
module.exports = mongoose.model("Order", OrderSchema);