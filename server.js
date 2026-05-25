process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("💥 Unhandled Rejection:", err);
});

require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Joi = require("joi");
const jwt = require("jsonwebtoken");

// Import your Models (Ensure these files exist in your models folder)
const Order = require("./models/order");
const User = require("./models/user"); // Assuming you have a User model

const app = express();

// =======================
// ✅ MIDDLEWARES
// =======================
app.use(cors());
app.use(express.json());

// The "Security Guard"
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; 
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// =======================
// ✅ DATABASE CONNECTION
// =======================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Database Connected!"))
  .catch((err) => console.log("❌ DB Connection Error:", err));

// =======================
// ✅ ROUTES
// =======================

// 1. LOGIN ROUTE (Issues the ID Card)
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    // Replace 'matchPassword' with your actual password check method
    if (user && (await user.matchPassword(password))) {
      const token = jwt.sign(
        { username: user.username }, 
        process.env.JWT_SECRET, 
        { expiresIn: "30d" }
      );
      res.json({ token, user: { username: user.username } });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// 2. SECURE ORDERS ROUTE
app.get("/api/my-orders", protect, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.username });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 3. PLACE ORDER ROUTE
app.post("/api/place-order", async (req, res) => {
  try {
    const newOrder = new Order(req.body);
    await newOrder.save();
    res.status(201).json({ message: "Order saved successfully!" });
  } catch (err) {
    res.status(500).json({ error: "Failed to save order" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});