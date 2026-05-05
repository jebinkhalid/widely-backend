require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Joi = require("joi");

// Import Order model from your order.js file
const Order = require("./models/order");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// =======================
// ✅ DATABASE CONNECTION
// =======================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Database Connected!"))
  .catch((err) => console.log("❌ DB Connection Error:", err));

// =======================
// ✅ DATA VALIDATION SCHEMA
// =======================
// This ensures that any data sent to /place-order is correctly formatted
const orderValidationSchema = Joi.object({
  userId: Joi.string().required(),
  item: Joi.string().required(),
  price: Joi.number().required(),
  status: Joi.string().optional()
});

// =======================
// ✅ ROUTES
// =======================

// 1. Test Route
app.get("/test", (req, res) => {
  console.log("🔥 /test route hit");
  res.send("OK WORKING");
});

// 2. Place Order (POST)
app.post("/api/place-order", async (req, res) => {
  console.log("🔥 POST HIT:", req.body);

  // Validate the incoming data against the schema
  const { error } = orderValidationSchema.validate(req.body);
  
  if (error) {
    console.log("⚠️ Validation Failed:", error.details[0].message);
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const newOrder = new Order(req.body);
    await newOrder.save();
    console.log("✅ Order Saved to MongoDB");
    res.status(201).json({ message: "Order saved successfully! 🛒" });
  } catch (err) {
    console.error("❌ SAVE ERROR:", err);
    res.status(500).json({ error: "Failed to save order" });
  }
});

// 3. Get User Orders (GET)
app.get("/api/my-orders/:username", async (req, res) => {
  try {
    const { username } = req.params;
    console.log("🔥 GET ORDERS for:", username);

    // Find all orders where userId matches the URL parameter
    const orders = await Order.find({ userId: username });

    res.status(200).json(orders);
  } catch (error) {
    console.error("❌ FETCH ERROR:", error);
    res.status(500).json({ message: error.message });
  }
});

// =======================
// ✅ START SERVER
// =======================
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});