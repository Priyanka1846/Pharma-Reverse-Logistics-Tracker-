/**
 * ReLogix Pro - AI Intelligent Insights & Anomaly Detection Panel
 */

class AIInsightsUI {
  renderBatchAnalysis(batch, aiRisk, aiRecommendation) {
    const modalContent = document.getElementById('ai-modal-content');
    if (!modalContent || !batch) return;

    const riskBadgeClass = aiRisk.aiRiskScore >= 60 ? 'badge-rose' : (aiRisk.aiRiskScore >= 30 ? 'badge-amber' : 'badge-emerald');

    modalContent.innerHTML = `
      <div style="margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <h3 style="margin: 0; font-size: 18px;">${batch.productName}</h3>
          <span class="badge ${riskBadgeClass}">AI Risk Score: ${aiRisk.aiRiskScore}/100</span>
        </div>
        <div style="font-size: 13px; color: var(--text-muted);">Batch ID: <strong>${batch.id}</strong> | Category: ${batch.category}</div>
      </div>

      <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--glass-border); padding: 16px; border-radius: var(--radius-md); margin-bottom: 20px;">
        <h4 style="margin: 0 0 8px 0; font-size: 14px; color: var(--accent-primary);">AI Anomaly Evaluation Flags</h4>
        <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: var(--text-main);">
          ${(aiRisk.flags || []).map(flag => `<li style="margin-bottom: 4px;">${flag}</li>`).join('')}
        </ul>
      </div>

      <div style="background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.2); padding: 16px; border-radius: var(--radius-md);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <h4 style="margin: 0; font-size: 14px; color: #3b82f6;">AI Recommended Disposition Action</h4>
          <span style="font-size: 12px; color: #3b82f6; font-weight: 600;">${aiRecommendation.confidence}% Confidence</span>
        </div>
        <div style="font-size: 15px; font-weight: 700; margin-bottom: 6px;">${aiRecommendation.action}</div>
        <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 10px;">${aiRecommendation.reasoning}</p>
        <div style="display: flex; gap: 20px; font-size: 12px; color: var(--text-light); border-top: 1px solid var(--glass-border); padding-top: 10px;">
          <div>Est. Credit Refund: <strong>${aiRecommendation.estimatedCreditRefundPercent}%</strong></div>
          <div>Carbon Saved: <strong>${aiRecommendation.ecoImpactKgCO2} kg CO2</strong></div>
        </div>
      </div>
    `;
  }
}

window.aiInsightsUI = new AIInsightsUI();
