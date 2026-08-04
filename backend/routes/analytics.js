const express = require("express");
const db = require("../../db");
const aiEngine = require("../../ai_engine");

const router = express.Router();

// GET aggregated executive dashboard metrics & charts payload
router.get("/dashboard", (req, res) => {
  const batches = db.getBatches();
  const events = db.getEvents();

  // 1. KPI Summary Cards
  const totalBatches = batches.length;
  let totalValueUSD = 0;
  let activeReturns = 0;
  let completedReturns = 0;
  let highRiskCount = 0;

  // Breakdown aggregations
  const stageDistribution = {};
  const reasonDistribution = {};
  const categoryDistribution = {};

  batches.forEach(b => {
    const val = Number(b.totalValue || (b.quantity * b.unitValue));
    totalValueUSD += val;

    if (b.currentStage === "Completed & Settled" || b.currentStage === "Restocked" || b.currentStage === "Eco-Incinerated") {
      completedReturns++;
    } else {
      activeReturns++;
    }

    if (b.aiRiskScore >= 60 || (b.riskLevel && b.riskLevel.includes("High"))) {
      highRiskCount++;
    }

    // Stage count
    stageDistribution[b.currentStage] = (stageDistribution[b.currentStage] || 0) + 1;
    // Reason count
    reasonDistribution[b.reason] = (reasonDistribution[b.reason] || 0) + 1;
    // Category count
    categoryDistribution[b.category] = (categoryDistribution[b.category] || 0) + 1;
  });

  // 2. Eco-Sustainability Metrics
  const ecoMetrics = aiEngine.calculatePortfolioEcoMetrics(batches);

  res.json({
    kpis: {
      totalBatches,
      totalValueUSD: Math.round(totalValueUSD),
      activeReturns,
      completedReturns,
      highRiskCount,
      carbonSavedKg: ecoMetrics.totalCarbonSavedKg,
      wasteDivertedKg: ecoMetrics.totalWasteDivertedKg,
      equivalentTrees: ecoMetrics.equivalentTreesPlanted
    },
    charts: {
      stageDistribution,
      reasonDistribution,
      categoryDistribution
    },
    recentEvents: events.slice(0, 10)
  });
});

module.exports = router;
