const express = require("express");
const db = require("../../db");
const aiEngine = require("../../ai_engine");

const router = express.Router();

// GET all return batches (with optional category / status filter)
router.get("/", (req, res) => {
  const batches = db.getBatches();
  res.json({
    total: batches.length,
    batches
  });
});

// GET batch by ID with audit trail events
router.get("/:id", (req, res) => {
  const batch = db.getBatchById(req.params.id);
  if (!batch) {
    return res.status(404).json({ message: "Batch not found" });
  }

  const events = db.getEvents(batch.id);
  const aiRecommendation = aiEngine.getDispositionRecommendation(batch);
  const aiRisk = aiEngine.evaluateBatchRisk(batch);

  res.json({
    batch,
    events,
    aiRisk,
    aiRecommendation
  });
});

// CREATE new return batch (Pharmacy / Hospital action)
router.post("/", (req, res) => {
  const { productName, category, quantity, unitValue, reason, sender, carrier, manufacturer, expiryDate, temperatureCelsius } = req.body;

  if (!productName || !quantity || !reason) {
    return res.status(400).json({ message: "Product name, quantity, and reason are required." });
  }

  const newId = `BATCH-${category ? category.substring(0, 3).toUpperCase() : "PH"}-${Math.floor(1000 + Math.random() * 9000)}`;

  const tempVal = temperatureCelsius !== undefined ? Number(temperatureCelsius) : 4.0;
  const draftBatch = {
    id: newId,
    productName,
    category: category || "General Pharma",
    quantity: Number(quantity),
    unitValue: Number(unitValue || 10.0),
    reason,
    currentStage: "Initiated",
    sender: sender || (req.user ? req.user.name : "City Care Pharmacy"),
    carrier: carrier || "Express Cold Logistics",
    manufacturer: manufacturer || "AstraPharma Global",
    disposition: "Pending AI Analysis",
    expiryDate: expiryDate || "2027-01-01",
    temperatureCelsius: tempVal
  };

  // Run AI Risk Evaluation
  const riskEval = aiEngine.evaluateBatchRisk(draftBatch);
  draftBatch.aiRiskScore = riskEval.aiRiskScore;
  draftBatch.riskLevel = riskEval.riskLevel;
  draftBatch.carbonSavedKg = Math.round(draftBatch.quantity * 0.15 * 10) / 10;

  const savedBatch = db.createBatch(draftBatch);

  // Add initial audit trail event
  const actorStr = req.user ? `${req.user.username} (${req.user.role})` : "pharmacy_main (Pharmacy)";
  const event = db.addEvent({
    batchId: savedBatch.id,
    actor: actorStr,
    action: "Initiated Return Batch",
    notes: `Return initialized for ${savedBatch.quantity} units. Reason: ${savedBatch.reason}`,
    location: req.user ? req.user.location || "Origin Facility" : "New York, NY"
  });

  // Broadcast WebSockets update if handler available
  if (req.app.locals.broadcast) {
    req.app.locals.broadcast({
      type: "BATCH_CREATED",
      batch: savedBatch,
      event
    });
  }

  res.status(201).json({
    message: "Return Batch Initiated Successfully",
    batch: savedBatch,
    event
  });
});

// UPDATE batch status & lifecycle stage
router.post("/update", (req, res) => {
  const { batchId, stage, disposition, notes, temperatureCelsius, location } = req.body;

  if (!batchId) {
    return res.status(400).json({ message: "batchId is required" });
  }

  const existing = db.getBatchById(batchId);
  if (!existing) {
    return res.status(404).json({ message: "Batch not found" });
  }

  const updates = {};
  if (stage) updates.currentStage = stage;
  if (disposition) updates.disposition = disposition;
  if (temperatureCelsius !== undefined) updates.temperatureCelsius = Number(temperatureCelsius);

  // Re-run AI evaluation on update
  const updatedBatchDraft = { ...existing, ...updates };
  const riskEval = aiEngine.evaluateBatchRisk(updatedBatchDraft);
  updates.aiRiskScore = riskEval.aiRiskScore;
  updates.riskLevel = riskEval.riskLevel;

  const updatedBatch = db.updateBatch(batchId, updates);

  // Log Event
  const actorStr = req.user ? `${req.user.username} (${req.user.role})` : (req.body.actor || "Logistics Operator");
  const event = db.addEvent({
    batchId: updatedBatch.id,
    actor: actorStr,
    action: `Stage Updated: ${updatedBatch.currentStage}`,
    notes: notes || `Batch status updated to ${updatedBatch.currentStage}. Disposition: ${updatedBatch.disposition}`,
    location: location || (req.user ? req.user.location : "Warehouse Facility")
  });

  // Automatically record to Blockchain Ledger
  if (req.app.locals.blockchain) {
    const block = req.app.locals.blockchain.addBlock(
      updatedBatch.id,
      actorStr,
      updatedBatch.currentStage,
      {
        disposition: updatedBatch.disposition,
        temperature: updatedBatch.temperatureCelsius,
        aiRiskScore: updatedBatch.aiRiskScore
      }
    );
    event.blockHash = block.hash;
  }

  // Broadcast WebSockets event
  if (req.app.locals.broadcast) {
    req.app.locals.broadcast({
      type: "BATCH_UPDATED",
      batch: updatedBatch,
      event
    });
  }

  res.json({
    message: "Batch status updated & block recorded to ledger",
    batch: updatedBatch,
    event
  });
});

module.exports = router;
