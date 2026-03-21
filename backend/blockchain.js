const SHA256 = require("crypto-js/sha256");

class Block
{
    constructor(index, batchId, actor, status, timestamp, previousHash = "")
    {
        this.index = index;
        this.batchId = batchId;
        this.actor = actor;
        this.status = status;
        this.timestamp = timestamp;
        this.previousHash = previousHash;
        this.hash = this.calculateHash();
    }

    calculateHash()
    {
        return SHA256(
            this.index +
            this.batchId +
            this.actor +
            this.status +
            this.timestamp +
            this.previousHash
        ).toString();
    }
}

class Blockchain
{
    constructor()
    {
        this.chain = [this.createGenesisBlock()];
    }

    createGenesisBlock()
    {
        return {
            index: 0,
            batchId: "GENESIS",
            actor: "SYSTEM",
            status: "INITIAL",
            timestamp: new Date().toISOString(),   // ⭐ ADD
            previousHash: "0",
            hash: "0"
        };
    }

    getLatestBlock()
    {
        return this.chain[this.chain.length - 1];
    }

    calculateHash(block)
    {
        return SHA256(
            block.index +
            block.batchId +
            block.actor +
            block.status +
            block.timestamp +
            block.previousHash
        ).toString();
    }

    addBlock(batchId, actor, status)
    {
        const newBlock = 
        {
            index: this.chain.length,
            batchId,
            actor,
            status,
            timestamp: new Date().toISOString(),   // ⭐ ADD THIS
            previousHash: this.getLatestBlock().hash
        };

        newBlock.hash = this.calculateHash(newBlock);

        this.chain.push(newBlock);
    }  
} 

module.exports = Blockchain;