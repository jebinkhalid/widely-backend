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
const jwt = require("jsonwebtoken");
const app = express(); 

// Import Models
const Order = require("./models/order");
const User = require('./models/user'); 

// =======================
// ✅ MIDDLEWARES
// =======================
app.use(cors());
app.use(express.json());

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
if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI environment variable is missing!");
}

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Database Connected!"))
  .catch((err) => console.log("❌ DB Connection Error:", err));

// =======================
// ✅ ROUTES
// =======================

// Health Check Route (Use this to test if your deployment is live)
app.get("/", (req, res) => {
  res.send("🚀 Backend is running smoothly on Render!");
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    const cleanUsername = String(username).trim().toLowerCase();
    const cleanPassword = String(password).trim();

    const user = await User.findOne({ username: cleanUsername });

    if (user && user.password === cleanPassword) { 
      const token = jwt.sign(
        { username: user.username, id: user._id }, 
        process.env.JWT_SECRET || "fallback_secret_for_dev", 
        { expiresIn: "30d" }
      );
      
      res.json({ 
        token, 
        user: { 
          id: user._id,
          username: user.username,
          name: user.name,
          email: user.email 
        } 
      });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/place-order", protect, async (req, res) => {
  try {
    const newOrder = new Order(req.body);
    await newOrder.save();
    res.status(201).json({ message: "Order saved successfully!", order: newOrder });
  } catch (err) {
    console.error("❌ Order Save Error:", err);
    res.status(500).json({ error: "Failed to save order" });
  }
});

app.get("/api/my-orders/:userId", protect, async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`📡 Fetching tracked orders for user: ${userId}`);
    
    const orders = await Order.find({ userId: userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error("❌ Fetch Orders Error:", err);
    res.status(500).json({ error: "Failed to fetch order list" });
  }
});

// Admin Route: Use with caution in production
app.get("/api/seed-users", async (req, res) => {
  try {
    await User.deleteMany({}); 
    await User.insertMany([
      {
        username: "admin1",
        password: "password1",
        name: "Rashid Mohammed",
        email: "rashidmohammed359862@gmail.com",
      },
      {
        username: "admin2",
        password: "password2",
        name: "System Admin",
        email: "admin@widely.com",
      }
    ]);
    res.send("✅ Database successfully populated with admin users!");
  } catch (err) {
    res.status(500).send("❌ Error seeding: " + err.message);
  }
});

// =======================
// ✅ SERVER INITIALIZATION
// =======================
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});