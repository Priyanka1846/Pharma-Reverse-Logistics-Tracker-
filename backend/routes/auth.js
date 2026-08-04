const express = require("express");
const jwt = require("jsonwebtoken");
const db = require("../../db");

const router = express.Router();
const SECRET = process.env.JWT_SECRET || "relogix-pro-super-secret-key-2026";

// Login endpoint supporting RBAC
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password required." });
  }

  const user = db.findUser(username);

  if (!user || user.passwordHash !== password) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
      location: user.location
    },
    SECRET,
    { expiresIn: "8h" }
  );

  res.json({
    access_token: token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
      location: user.location
    }
  });
});

// Current User Profile Verification
router.get("/me", (req, res) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, SECRET);
    res.json({ user: decoded });
  } catch (err) {
    res.status(403).json({ message: "Invalid or expired token" });
  }
});

module.exports = router;
