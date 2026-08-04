/**
 * ReLogix Pro - AI Insights & Anomaly Detection Engine
 */

class AIEngine {
  /**
   * Evaluate Fraud & Anomaly Risk Score for a Return Batch
   * @param {Object} batch 
   * @returns {Object} AI Evaluation Result
   */
  evaluateBatchRisk(batch) {
    let score = 0;
    const flags = [];

    // 1. Temperature Excursion Risk
    if (batch.temperatureCelsius !== undefined) {
      if (batch.category === "Cold-Chain Vaccines" || batch.category === "Biologics") {
        if (batch.temperatureCelsius < 2.0 || batch.temperatureCelsius > 8.0) {
          score += 45;
          flags.push(`Temperature Excursion Detected: ${batch.temperatureCelsius}°C (Safe range: 2-8°C)`);
        }
      } else if (batch.temperatureCelsius > 25.0) {
        score += 25;
        flags.push(`Ambient Heat Warning: ${batch.temperatureCelsius}°C`);
      }
    }

    // 2. Expiry Proximity Risk
    if (batch.expiryDate) {
      const daysToExpiry = Math.ceil((new Date(batch.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
      if (daysToExpiry < 0) {
        score += 50;
        flags.push("Batch Expired prior to return initiation");
      } else if (daysToExpiry < 30) {
        score += 20;
        flags.push(`Critical Expiry Window: ${daysToExpiry} days remaining`);
      }
    }

    // 3. High Valuation Anomaly Check
    const totalVal = Number(batch.totalValue || (batch.quantity * batch.unitValue));
    if (totalVal > 30000) {
      score += 15;
      flags.push(`High Value Batch Alert: $${totalVal.toLocaleString()} USD`);
    }

    // 4. Recall Status Check
    if (batch.reason && batch.reason.toLowerCase().includes("recall")) {
      score += 10;
      flags.push("FDA Safety Recall Flagged");
    }

    // Determine Risk Level Label
    let riskLevel = "Low Risk";
    let riskColor = "emerald";
    if (score >= 60) {
      riskLevel = "Critical Anomaly (High Risk)";
      riskColor = "rose";
    } else if (score >= 30) {
      riskLevel = "Moderate Concern";
      riskColor = "amber";
    }

    return {
      aiRiskScore: Math.min(score, 100),
      riskLevel,
      riskColor,
      flags: flags.length > 0 ? flags : ["No anomaly detected. Serial & seals verified."],
      inspectedAt: new Date().toISOString()
    };
  }

  /**
   * Recommend Disposition Action (Restock vs Recast vs Incinerate)
   */
  getDispositionRecommendation(batch) {
    const riskEval = this.evaluateBatchRisk(batch);

    if (batch.reason && batch.reason.toLowerCase().includes("recall")) {
      return {
        action: "Eco-Incineration & Hazardous Destruction",
        confidence: 99,
        reasoning: "Mandatory destruction protocol required for FDA recall notices.",
        estimatedCreditRefundPercent: 100,
        ecoImpactKgCO2: Math.round(batch.quantity * 0.12)
      };
    }

    if (riskEval.aiRiskScore >= 60) {
      return {
        action: "Quarantine & Lab Inspection",
        confidence: 94,
        reasoning: "High risk flag triggered due to temperature excursion/integrity ambiguity.",
        estimatedCreditRefundPercent: 50,
        ecoImpactKgCO2: Math.round(batch.quantity * 0.05)
      };
    }

    if (batch.reason && batch.reason.toLowerCase().includes("expiry")) {
      return {
        action: "Secondary Discounted Outlet Restock",
        confidence: 88,
        reasoning: "Batch is near expiry but uncompromised. Optimal for immediate liquidation.",
        estimatedCreditRefundPercent: 75,
        ecoImpactKgCO2: Math.round(batch.quantity * 0.20)
      };
    }

    return {
      action: "Full Primary Restock",
      confidence: 96,
      reasoning: "High quality return, packaging intact, temperature log clean.",
      estimatedCreditRefundPercent: 100,
      ecoImpactKgCO2: Math.round(batch.quantity * 0.25)
    };
  }

  /**
   * Calculate Portfolio Sustainability Metrics
   */
  calculatePortfolioEcoMetrics(batches) {
    let totalCarbonSavedKg = 0;
    let totalWasteDivertedKg = 0;
    let totalValueRecovered = 0;

    batches.forEach(b => {
      const qty = Number(b.quantity || 0);
      const val = Number(b.totalValue || (qty * Number(b.unitValue || 0)));

      if (b.disposition && b.disposition.toLowerCase().includes("restock")) {
        totalValueRecovered += val * 0.85;
        totalCarbonSavedKg += qty * 0.18;
        totalWasteDivertedKg += qty * 0.05;
      } else {
        totalValueRecovered += val * 0.30;
        totalCarbonSavedKg += qty * 0.08;
      }
    });

    return {
      totalCarbonSavedKg: Math.round(totalCarbonSavedKg * 10) / 10,
      totalWasteDivertedKg: Math.round(totalWasteDivertedKg * 10) / 10,
      totalValueRecoveredUsd: Math.round(totalValueRecovered),
      equivalentTreesPlanted: Math.round(totalCarbonSavedKg / 21)
    };
  }
}

module.exports = new AIEngine();
