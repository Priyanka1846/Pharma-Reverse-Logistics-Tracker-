/**
 * ReLogix Pro - Dynamic Dashboard & Chart Visualization Module
 */

class DashboardUI {
  constructor() {
    this.stageChart = null;
    this.reasonChart = null;
  }

  setElementText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  renderKPIs(kpis) {
    if (!kpis) return;
    this.setElementText('kpi-total-batches', kpis.totalBatches || '0');
    this.setElementText('kpi-total-val', `$${(kpis.totalValueUSD || 0).toLocaleString()}`);
    this.setElementText('kpi-active-returns', kpis.activeReturns || '0');
    this.setElementText('kpi-carbon-saved', `${kpis.carbonSavedKg || '0'} kg`);
    this.setElementText('kpi-high-risk', kpis.highRiskCount || '0');
  }

  renderCharts(chartsData) {
    if (!chartsData) return;

    if (!window.Chart) {
      console.warn("Chart.js CDN loading... Retrying chart render in 300ms");
      setTimeout(() => this.renderCharts(chartsData), 300);
      return;
    }

    // 1. Stage Distribution Chart (Doughnut)
    const stageCtx = document.getElementById('chart-stage-distribution');
    if (stageCtx) {
      const labels = Object.keys(chartsData.stageDistribution || {});
      const values = Object.values(chartsData.stageDistribution || {});

      if (this.stageChart) this.stageChart.destroy();
      this.stageChart = new Chart(stageCtx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: values,
            backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { color: '#9ca3af', font: { family: 'Inter' } } }
          }
        }
      });
    }

    // 2. Return Reasons Chart (Bar)
    const reasonCtx = document.getElementById('chart-reason-breakdown');
    if (reasonCtx) {
      const labels = Object.keys(chartsData.reasonDistribution || {});
      const values = Object.values(chartsData.reasonDistribution || {});

      if (this.reasonChart) this.reasonChart.destroy();
      this.reasonChart = new Chart(reasonCtx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Return Count',
            data: values,
            backgroundColor: 'rgba(59, 130, 246, 0.7)',
            borderColor: '#3b82f6',
            borderWidth: 1,
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { ticks: { color: '#9ca3af' }, grid: { display: false } },
            y: { ticks: { color: '#9ca3af', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.05)' } }
          },
          plugins: {
            legend: { display: false }
          }
        }
      });
    }
  }

  renderRecentActivity(events) {
    const listEl = document.getElementById('recent-activity-list');
    if (!listEl || !events) return;

    if (events.length === 0) {
      listEl.innerHTML = '<div style="padding: 16px; color: var(--text-muted);">No recent events recorded.</div>';
      return;
    }

    listEl.innerHTML = events.map(evt => `
      <div style="display: flex; align-items: flex-start; gap: 14px; padding: 12px 0; border-bottom: 1px solid var(--glass-border);">
        <div style="width: 10px; height: 10px; border-radius: 50%; background: var(--accent-primary); margin-top: 6px;"></div>
        <div style="flex: 1;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="font-size: 14px;">${evt.action}</strong>
            <span style="font-size: 11px; color: var(--text-light);">${new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <p style="font-size: 13px; color: var(--text-muted); margin-top: 2px;">Batch: <strong>${evt.batchId}</strong> by ${evt.actor}</p>
          <p style="font-size: 12px; color: var(--text-light); margin-top: 2px;">${evt.notes || ''}</p>
        </div>
      </div>
    `).join('');
  }
}

window.dashboardUI = new DashboardUI();
