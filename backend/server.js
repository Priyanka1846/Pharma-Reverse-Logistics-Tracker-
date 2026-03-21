const express = require("express");
const cors = require("cors");
const Blockchain = require("./blockchain");

const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(__dirname));

let pharmaChain = new Blockchain();

/* LOAD SAVED DATA IF EXISTS */

if(fs.existsSync("chain.json"))
{
    const data = JSON.parse(fs.readFileSync("chain.json", "utf-8"));
    pharmaChain.chain = data;
}

app.post("/update", (req, res) =>
{
    const { batchId, actor, status } = req.body;

    pharmaChain.addBlock(batchId, actor, status);

    fs.writeFileSync("chain.json", JSON.stringify(pharmaChain.chain, null, 2));

    res.json({
        message: "Block Added",
        chain: pharmaChain.chain
    });
});

app.get("/chain", (req, res) =>
{
    res.json(pharmaChain.chain);
});

app.post("/reset", (req, res) =>
{
    pharmaChain.chain = [pharmaChain.createGenesisBlock()];
    fs.writeFileSync("chain.json", JSON.stringify(pharmaChain.chain, null, 2));
    res.json({ message: "Blockchain reset" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () =>
{
    console.log("Server running on port" + PORT);
});