const SHA256 = require("crypto-js/sha256");

class Block {
  constructor(index, batchId, actor, status, timestamp, previousHash = "", extraData = {}) {
    this.index = index;
    this.batchId = batchId;
    this.actor = actor;
    this.status = status;
    this.timestamp = timestamp || new Date().toISOString();
    this.previousHash = previousHash;
    this.extraData = extraData;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    return SHA256(
      this.index +
      this.batchId +
      this.actor +
      this.status +
      this.timestamp +
      this.previousHash +
      JSON.stringify(this.extraData || {})
    ).toString();
  }
}

class Blockchain {
  constructor() {
    this.resetChain();
  }

  createGenesisBlock() {
    return new Block(
      0,
      "GENESIS_BLOCK",
      "SYSTEM_ADMIN",
      "INITIALIZED",
      "2026-01-01T00:00:00.000Z",
      "0000000000000000000000000000000000000000000000000000000000000000",
      { system: "ReLogix Pro Ledger", version: "2.0.0" }
    );
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  calculateHash(block) {
    return SHA256(
      block.index +
      block.batchId +
      block.actor +
      block.status +
      block.timestamp +
      block.previousHash +
      JSON.stringify(block.extraData || {})
    ).toString();
  }

  addBlock(batchId, actor, status, extraData = {}) {
    const previousBlock = this.getLatestBlock();
    const newBlock = new Block(
      this.chain.length,
      batchId,
      actor,
      status,
      new Date().toISOString(),
      previousBlock.hash,
      extraData
    );

    this.chain.push(newBlock);
    return newBlock;
  }

  // Cryptographic Ledger Integrity Check
  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      // Re-calculate hash to verify block content hasn't been tampered with
      const recalculatedHash = this.calculateHash(currentBlock);
      if (currentBlock.hash !== recalculatedHash) {
        return {
          valid: false,
          errorBlockIndex: i,
          reason: `Block #${i} hash mismatch! Tampered payload detected.`
        };
      }

      // Check linkage with previous block
      if (currentBlock.previousHash !== previousBlock.hash) {
        return {
          valid: false,
          errorBlockIndex: i,
          reason: `Block #${i} previousHash link broken!`
        };
      }
    }

    return {
      valid: true,
      blockCount: this.chain.length,
      latestHash: this.getLatestBlock().hash
    };
  }

  // Simulation Tool: Force a tamper in a specific block for demo/audit testing
  tamperBlock(index, fakeStatus) {
    let targetIndex = index;
    if (!targetIndex || targetIndex <= 0 || targetIndex >= this.chain.length) {
      targetIndex = this.chain.length - 1; // Default to latest block
    }

    if (targetIndex > 0 && targetIndex < this.chain.length) {
      this.chain[targetIndex].status = fakeStatus || "TAMPERED_MALICIOUS_LOG";
      // We deliberately do NOT re-calculate hash to simulate a malicious tamper!
      return { success: true, tamperedIndex: targetIndex };
    }
    return { success: false, reason: "No tamperable blocks available" };
  }

  // Reset chain to initial state with sample blocks
  resetChain() {
    this.chain = [this.createGenesisBlock()];
    this.addBlock("BATCH-PH-9082", "pharmacy_main (Pharmacy)", "Initiated Return", { location: "New York, NY" });
    this.addBlock("BATCH-VAC-4012", "express_logistics (Carrier)", "In Transit Pickup", { temp: 12.2, location: "Chicago Hub" });
    this.addBlock("BATCH-BIO-7711", "pharma_corp (Manufacturer)", "Received at Warehouse", { location: "Boston HQ" });
  }
}

module.exports = Blockchain;