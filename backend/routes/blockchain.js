const express = require("express");
const router = express.Router();

// GET full cryptographic ledger chain
router.get("/", (req, res) => {
  const blockchain = req.app.locals.blockchain;
  if (!blockchain) {
    return res.status(500).json({ message: "Blockchain engine uninitialized" });
  }

  res.json({
    chainLength: blockchain.chain.length,
    latestBlock: blockchain.getLatestBlock(),
    chain: blockchain.chain
  });
});

// VERIFY cryptographic ledger integrity
router.get("/verify", (req, res) => {
  const blockchain = req.app.locals.blockchain;
  if (!blockchain) {
    return res.status(500).json({ message: "Blockchain engine uninitialized" });
  }

  const validationResult = blockchain.isChainValid();
  res.json(validationResult);
});

// SIMULATE block tampering for audit demonstration
router.post("/tamper", (req, res) => {
  const blockchain = req.app.locals.blockchain;
  const { index, fakeStatus } = req.body;

  const result = blockchain.tamperBlock(index ? Number(index) : null, fakeStatus || "TAMPERED_MALICIOUS_LOG");
  if (!result.success) {
    return res.status(400).json({ message: result.reason || "Failed to tamper block" });
  }

  const verification = blockchain.isChainValid();

  // Broadcast WebSockets event
  if (req.app.locals.broadcast) {
    req.app.locals.broadcast({
      type: "CHAIN_TAMPERED",
      blockIndex: result.tamperedIndex,
      verification
    });
  }

  res.json({
    message: `Simulated tamper injected on Block #${result.tamperedIndex}`,
    tamperedIndex: result.tamperedIndex,
    verification
  });
});

// RESET ledger to genesis state
router.post("/reset", (req, res) => {
  const blockchain = req.app.locals.blockchain;
  if (blockchain) {
    blockchain.resetChain();
  }

  res.json({
    message: "Blockchain ledger reset to Genesis Block with sample nodes",
    chain: blockchain ? blockchain.chain : []
  });
});

module.exports = router;
