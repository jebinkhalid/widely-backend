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

// 1. INITIALIZE APP (This was missing!)
const app = express(); 

// Import your Models
const Order = require("./models/order");
const User = require('./models/user'); 

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
app.get("/api/check-database", async (req, res) => {
  try {
    const users = await User.find({}, "username password");
    res.json(users);
  } catch (err) {
    console.error("Database Check Error:", err);
    res.status(500).send(err.message);
  }
});
// =======================
// ✅ DATABASE CONNECTION
// =======================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Database Connected!"))
  .catch((err) => console.log("❌ DB Connection Error:", err));

// =======================
// ✅ ROUTES
// =======================

app.post("/api/login", async (req, res) => {
  try {
    // 1. Log what the server actually sees (Check Railway Deploy Logs for this!)
    console.log("Login Body:", req.body);

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password required" });
    }

    // 2. Clean the input
    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    // 3. Find the user
    const user = await User.findOne({ username: cleanUsername });

    // 4. Detailed comparison logic
    if (user && user.password === cleanPassword) {
      const token = jwt.sign(
        { username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
      );
      return res.json({ token, user: { username: user.username } });
    } 
    
    // If we reach here, it failed
    return res.status(401).json({ message: "Invalid credentials" });

  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server error" });
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
// server.js (add before app.listen)

app.get("/api/seed-users", async (req, res) => {
  try {
    await User.deleteMany({}); // Clears any old data
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

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});