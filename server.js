const http = require("http");
const path = require("path");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const WebSocket = require("ws");

const Blockchain = require("./blockchain");
const db = require("./db");

// Routes
const authRoutes = require("./backend/routes/auth");
const batchRoutes = require("./backend/routes/batches");
const blockchainRoutes = require("./backend/routes/blockchain");
const analyticsRoutes = require("./backend/routes/analytics");

const app = express();
const server = http.createServer(app);

// WebSockets Server for Real-Time Dashboard Broadcasting
const wss = new WebSocket.Server({ server });
const clients = new Set();

wss.on("connection", (ws) => {
  clients.add(ws);
  ws.send(JSON.stringify({ type: "SYSTEM_CONNECTED", message: "Connected to ReLogix Pro Real-Time Stream" }));

  ws.on("close", () => {
    clients.delete(ws);
  });
});

function broadcast(data) {
  const payload = JSON.stringify(data);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

// Instantiate Blockchain Ledger
const pharmaChain = new Blockchain();

// Store shared references in app.locals
app.locals.blockchain = pharmaChain;
app.locals.broadcast = broadcast;

// Middleware
app.use(cors());
app.use(express.json());

// Serve Frontend Static Files
app.use(express.static(path.join(__dirname, "frontend")));
app.use("/css", express.static(path.join(__dirname, "frontend/css")));
app.use("/js", express.static(path.join(__dirname, "frontend/js")));

// API Route Mounts
app.use("/api/auth", authRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/blockchain", blockchainRoutes);
app.use("/api/analytics", analyticsRoutes);

// -------------------------------------------------------------
// BACKWARD COMPATIBILITY ENDPOINTS (Legacy API support)
// -------------------------------------------------------------
const SECRET = process.env.JWT_SECRET || "relogix-pro-super-secret-key-2026";

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const user = db.findUser(username);
  if (user && user.passwordHash === password) {
    const token = jwt.sign({ username: user.username, role: user.role }, SECRET, { expiresIn: "8h" });
    return res.json({ access_token: token, user });
  }

  // Fallback generation for dynamic logins
  const token = jwt.sign({ username }, SECRET, { expiresIn: "1h" });
  res.json({ access_token: token });
});

function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ msg: "Missing Authorization Header" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ msg: "Invalid Token" });
  }
}

app.post("/update", verifyToken, (req, res) => {
  const { batchId, actor, status } = req.body;
  const user = req.user.username;
  const block = pharmaChain.addBlock(batchId, user + " (" + (actor || "Operator") + ")", status);

  broadcast({ type: "BLOCK_ADDED", block, chain: pharmaChain.chain });

  res.json({
    message: "Block Added",
    chain: pharmaChain.chain
  });
});

app.get("/chain", verifyToken, (req, res) => {
  res.json(pharmaChain.chain);
});

app.post("/reset", verifyToken, (req, res) => {
  pharmaChain.resetChain();
  res.json({ message: "Blockchain reset" });
});

// Fallback router for Express 5 SPA serving
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "frontend/index.html"));
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 ReLogix Pro Server running on http://localhost:${PORT}`);
});