/**
 * ReLogix Pro - Single Page Application Main Controller
 */

class AppController {
  constructor() {
    this.currentView = 'dashboard';
    this.currentRole = 'Pharmacy';
    this.currentUser = { username: 'pharmacy_main', role: 'Pharmacy', name: 'City Care Pharmacy' };
    this.allBatches = [];
  }

  init() {
    this.bindEvents();
    this.initTheme();
    this.loadDashboardData();
    this.connectLiveStream();
  }

  initTheme() {
    const savedTheme = localStorage.getItem('relogix_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const icon = document.getElementById('theme-toggle-icon');
    if (icon) {
      icon.innerHTML = savedTheme === 'light' 
        ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>'
        : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>';
    }
  }

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem('relogix_theme', next);
    this.initTheme();
  }

  bindEvents() {
    // Nav Links Switching
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = link.getAttribute('data-view');
        if (targetView) this.switchView(targetView);
      });
    });

    // Theme Toggle Button
    const themeBtn = document.getElementById('btn-theme-toggle');
    if (themeBtn) themeBtn.addEventListener('click', () => this.toggleTheme());

    // New Return Form Submission
    const newReturnForm = document.getElementById('form-create-return');
    if (newReturnForm) {
      newReturnForm.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'btn-submit-return') {
          this.handleCreateReturn();
        }
      });
    }
  }

  switchView(viewName) {
    this.currentView = viewName;
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const activeLink = document.querySelector(`.nav-link[data-view="${viewName}"]`);
    if (activeLink) activeLink.classList.add('active');

    document.querySelectorAll('.view-section').forEach(sec => sec.style.display = 'none');
    const targetSection = document.getElementById(`view-${viewName}`);
    if (targetSection) targetSection.style.display = 'block';

    const pageTitle = document.getElementById('page-title-text');
    if (pageTitle) {
      const titles = {
        'dashboard': 'Executive Analytics Dashboard',
        'batches': 'Reverse Return Batches & Lifecycle Tracker',
        'blockchain': 'Cryptographic Blockchain Audit Explorer',
        'ai-risk': 'AI Risk & Anomaly Intelligence Center',
        'manifests': 'Manifest & QR Compliance Hub'
      };
      pageTitle.textContent = titles[viewName] || 'ReLogix Pro';
    }

    if (viewName === 'dashboard') this.loadDashboardData();
    if (viewName === 'blockchain') this.loadBlockchainData();
    if (viewName === 'batches') this.loadBatchesTable();
    if (viewName === 'manifests') this.loadManifestsTab();
  }

  async loadDashboardData() {
    try {
      const data = await window.apiClient.getDashboardAnalytics();
      window.dashboardUI.renderKPIs(data.kpis);
      window.dashboardUI.renderCharts(data.charts);
      window.dashboardUI.renderRecentActivity(data.recentEvents);
    } catch (e) {
      console.error('Error loading dashboard analytics:', e);
    }
  }

  async loadBatchesTable() {
    try {
      const data = await window.apiClient.getBatches();
      this.allBatches = data.batches || [];
      const tbody = document.getElementById('batches-table-body');
      if (!tbody) return;

      tbody.innerHTML = this.allBatches.map(b => `
        <tr>
          <td><strong style="color: var(--accent-primary); cursor: pointer;" onclick="window.appController.openBatchDetails('${b.id}')">${b.id}</strong></td>
          <td>
            <div style="font-weight: 600;">${b.productName}</div>
            <div style="font-size: 11px; color: var(--text-light);">${b.category}</div>
          </td>
          <td>${b.quantity} units</td>
          <td>$${(b.totalValue || 0).toLocaleString()}</td>
          <td><span class="badge ${b.currentStage === 'AI Inspected' ? 'badge-blue' : (b.currentStage === 'In Transit' ? 'badge-amber' : 'badge-emerald')}">${b.currentStage}</span></td>
          <td><span class="badge ${b.aiRiskScore >= 60 ? 'badge-rose' : (b.aiRiskScore >= 30 ? 'badge-amber' : 'badge-emerald')}">${b.riskLevel || 'Low'} (${b.aiRiskScore || 0})</span></td>
          <td>
            <button class="btn-secondary" style="padding: 4px 10px; font-size: 12px;" onclick="window.appController.openBatchDetails('${b.id}')">Inspect</button>
          </td>
        </tr>
      `).join('');
    } catch (e) {
      console.error('Error loading batches table:', e);
    }
  }

  async loadBlockchainData(notifyUser = false) {
    try {
      const res = await window.apiClient.getBlockchain();
      const verify = await window.apiClient.verifyBlockchain();
      window.blockchainUI.renderChain(res.chain, verify);

      if (notifyUser) {
        if (verify.valid) {
          this.toast(`✅ Ledger Re-Verified: All ${verify.blockCount} blocks cryptographically valid.`);
        } else {
          this.toast(`⚠️ Tamper Detected: ${verify.reason || 'Hash mismatch!'}`);
        }
      }
    } catch (e) {
      console.error('Error loading blockchain:', e);
    }
  }

  async openBatchDetails(id) {
    try {
      const data = await window.apiClient.getBatchById(id);
      window.aiInsightsUI.renderBatchAnalysis(data.batch, data.aiRisk, data.aiRecommendation);
      window.qrScannerUI.generateQR(data.batch.id);

      const modal = document.getElementById('modal-batch-inspect');
      if (modal) modal.classList.add('open');

      const btnManifest = document.getElementById('btn-download-manifest');
      if (btnManifest) {
        btnManifest.onclick = () => window.qrScannerUI.exportPDFManifest(data.batch, data.events);
      }
    } catch (e) {
      console.error('Error inspecting batch:', e);
    }
  }

  async loadManifestsTab() {
    try {
      const data = await window.apiClient.getBatches();
      const batches = data.batches || [];
      const listEl = document.getElementById('manifest-batch-list');
      if (!listEl) return;

      if (batches.length === 0) {
        listEl.innerHTML = '<div style="color: var(--text-muted); font-size: 13px; padding: 16px; text-align: center;">No batches found. Create a return batch first.</div>';
        return;
      }

      listEl.innerHTML = batches.map(b => {
        const riskClass = b.aiRiskScore >= 60 ? 'badge-rose' : (b.aiRiskScore >= 30 ? 'badge-amber' : 'badge-emerald');
        const stageClass = b.currentStage === 'AI Inspected' ? 'badge-blue' : (b.currentStage === 'In Transit' ? 'badge-amber' : 'badge-emerald');
        return `
          <div class="manifest-batch-item" data-id="${b.id}" onclick="window.appController.selectBatchForManifest('${b.id}')" style="
            padding: 14px 16px;
            border: 1px solid var(--glass-border);
            border-radius: var(--radius-md);
            cursor: pointer;
            transition: all 0.2s;
            background: rgba(255,255,255,0.02);
          " onmouseover="this.style.background='rgba(59,130,246,0.08)';this.style.borderColor='rgba(59,130,246,0.4)'" onmouseout="this.style.background='rgba(255,255,255,0.02)';this.style.borderColor='var(--glass-border)'">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
              <div>
                <div style="font-weight: 700; font-size: 13px; color: var(--accent-primary);">${b.id}</div>
                <div style="font-size: 13px; margin-top: 2px;">${b.productName}</div>
                <div style="font-size: 11px; color: var(--text-light); margin-top: 2px;">${b.category} &bull; ${b.quantity} units &bull; $${(b.totalValue || 0).toLocaleString()}</div>
              </div>
              <div style="display: flex; flex-direction: column; gap: 4px; align-items: flex-end;">
                <span class="badge ${stageClass}" style="font-size: 10px;">${b.currentStage}</span>
                <span class="badge ${riskClass}" style="font-size: 10px;">Risk: ${b.aiRiskScore || 0}</span>
              </div>
            </div>
          </div>
        `;
      }).join('');
    } catch (e) {
      console.error('Error loading manifest batches:', e);
    }
  }

  async selectBatchForManifest(batchId) {
    // Highlight selected item
    document.querySelectorAll('.manifest-batch-item').forEach(el => {
      el.style.background = el.dataset.id === batchId ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.02)';
      el.style.borderColor = el.dataset.id === batchId ? 'rgba(59,130,246,0.6)' : 'var(--glass-border)';
    });

    try {
      const data = await window.apiClient.getBatchById(batchId);
      const batch = data.batch;
      this._manifestBatch = data;

      // Generate QR Code
      const qrDisplay = document.getElementById('manifest-qr-display');
      if (qrDisplay) {
        qrDisplay.innerHTML = '<div id="manifest-qr-canvas" style="background: white; padding: 10px; border-radius: 8px; display: inline-block;"></div>';
        if (window.QRCode) {
          new QRCode(document.getElementById('manifest-qr-canvas'), {
            text: `RELOGIX-PRO:${batch.id}`,
            width: 160,
            height: 160,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
          });
        }
      }

      const batchIdLabel = document.getElementById('manifest-qr-batch-id');
      if (batchIdLabel) batchIdLabel.textContent = `Scan Code: RELOGIX-PRO:${batch.id}`;

      // Render Batch Detail Summary
      const detailBody = document.getElementById('manifest-detail-body');
      if (detailBody) {
        const rows = [
          ['Batch ID', batch.id],
          ['Product', batch.productName],
          ['Category', batch.category],
          ['Quantity', `${batch.quantity} units`],
          ['Total Value', `$${(batch.totalValue || 0).toLocaleString()}`],
          ['Return Reason', batch.reason],
          ['Stage', batch.currentStage],
          ['Disposition', batch.disposition],
          ['Sender', batch.sender],
          ['Carrier', batch.carrier],
          ['Manufacturer', batch.manufacturer],
          ['Expiry Date', batch.expiryDate || 'N/A'],
          ['Temperature', `${batch.temperatureCelsius || 'N/A'} °C`],
          ['AI Risk Score', `${batch.aiRiskScore || 0}/100 — ${batch.riskLevel || 'Low'}`],
          ['Carbon Saved', `${batch.carbonSavedKg || 0} kg CO₂`]
        ];
        detailBody.innerHTML = rows.map(([k, v]) => `
          <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--glass-border);">
            <span style="color: var(--text-muted); font-size: 12px;">${k}</span>
            <span style="font-weight: 600; font-size: 12px; text-align: right; max-width: 55%;">${v}</span>
          </div>
        `).join('');
      }

      const detailCard = document.getElementById('manifest-detail-card');
      if (detailCard) detailCard.style.display = 'block';

      this.toast(`QR & Manifest loaded for ${batch.id}`);
    } catch (e) {
      console.error('Error selecting batch for manifest:', e);
    }
  }

  downloadManifestFromHub() {
    if (!this._manifestBatch) {
      this.toast('Please select a batch first.');
      return;
    }
    window.qrScannerUI.exportPDFManifest(this._manifestBatch.batch, this._manifestBatch.events || []);
  }

  async handleCreateReturn() {
    const name = document.getElementById('input-prod-name').value;
    const cat = document.getElementById('input-prod-cat').value;
    const qty = document.getElementById('input-prod-qty').value;
    const val = document.getElementById('input-prod-val').value;
    const reason = document.getElementById('input-prod-reason').value;
    const temp = document.getElementById('input-prod-temp').value;

    if (!name || !qty || !reason) {
      alert('Please fill out Product Name, Quantity, and Reason.');
      return;
    }

    try {
      const res = await window.apiClient.createBatch({
        productName: name,
        category: cat,
        quantity: qty,
        unitValue: val,
        reason: reason,
        temperatureCelsius: temp,
        sender: this.currentUser.name
      });

      this.closeModal('modal-new-return');
      this.toast(`Return Batch ${res.batch.id} Initiated successfully!`);
      this.loadDashboardData();
      if (this.currentView === 'batches') this.loadBatchesTable();
    } catch (e) {
      alert('Error creating return batch: ' + e.message);
    }
  }

  async triggerTamperSimulation() {
    try {
      const res = await window.apiClient.tamperBlockchain();
      this.toast(`⚠️ Simulated tamper injected on Block #${res.tamperedIndex}!`);
      this.loadBlockchainData();
    } catch (e) {
      alert('Error triggering tamper: ' + (e.message || 'Check connection'));
    }
  }

  runAISimulation() {
    const name = document.getElementById('sim-drug-name').value || 'Drug Batch';
    const cat = document.getElementById('sim-category').value;
    const temp = Number(document.getElementById('sim-temp').value || 4.0);
    const days = Number(document.getElementById('sim-expiry-days').value || 30);
    const val = Number(document.getElementById('sim-value').value || 10000);
    const isRecall = document.getElementById('sim-recall-flag').checked;

    let score = 0;
    const flags = [];

    // Temp Check
    if (cat === 'Cold-Chain Vaccines' || cat === 'Biologics') {
      if (temp < 2.0 || temp > 8.0) {
        score += 45;
        flags.push(`Temperature Excursion Detected: ${temp}°C (Safe zone: 2°C - 8°C)`);
      }
    }

    // Expiry Check
    if (days <= 0) {
      score += 50;
      flags.push('Batch Expired prior to return');
    } else if (days < 30) {
      score += 20;
      flags.push(`Critical Expiry Window: ${days} days remaining`);
    }

    // Valuation Check
    if (val > 30000) {
      score += 15;
      flags.push(`High Value Batch Alert: $${val.toLocaleString()} USD`);
    }

    // Recall Check
    if (isRecall) {
      score += 20;
      flags.push('FDA Safety Recall Flagged');
    }

    if (flags.length === 0) {
      flags.push('No anomalies detected. Thermal logs and expiry clean.');
    }

    score = Math.min(score, 100);

    // Determine Action
    let action = 'Full Primary Restock';
    let reasoning = 'High quality return, packaging intact, temperature log clean.';
    let badgeClass = 'badge-emerald';

    if (isRecall) {
      action = 'Eco-Incineration & Hazardous Destruction';
      reasoning = 'Mandatory destruction protocol required for FDA recall notices.';
      badgeClass = 'badge-rose';
    } else if (score >= 60) {
      action = 'Quarantine & Lab Inspection';
      reasoning = 'High risk flag triggered due to temperature excursion/integrity ambiguity.';
      badgeClass = 'badge-rose';
    } else if (days < 30) {
      action = 'Secondary Discounted Outlet Restock';
      reasoning = 'Batch is near expiry but uncompromised. Optimal for immediate liquidation.';
      badgeClass = 'badge-amber';
    }

    // Render Simulation Output
    const badgeEl = document.getElementById('sim-result-badge');
    if (badgeEl) {
      badgeEl.className = `badge ${badgeClass}`;
      badgeEl.textContent = `Risk Score: ${score}/100`;
    }

    const barEl = document.getElementById('sim-risk-bar');
    if (barEl) {
      barEl.style.width = `${score}%`;
      barEl.style.background = score >= 60 ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : (score >= 30 ? 'linear-gradient(90deg, #10b981, #f59e0b)' : '#10b981');
    }

    const flagsEl = document.getElementById('sim-flags-list');
    if (flagsEl) {
      flagsEl.innerHTML = flags.map(f => `<li>${f}</li>`).join('');
    }

    const actionEl = document.getElementById('sim-action-text');
    if (actionEl) actionEl.textContent = action;

    const reasoningEl = document.getElementById('sim-reasoning-text');
    if (reasoningEl) reasoningEl.textContent = reasoning;

    this.toast(`AI Risk Analysis Complete: Score ${score}/100`);
  }

  connectLiveStream() {
    window.apiClient.connectWebSockets((evt) => {
      console.log('Live WS Event:', evt);
      this.toast(`Live Notification: ${evt.type}`);
      this.loadDashboardData();
    });
  }

  toast(msg) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `
      <svg style="width: 18px; height: 18px; color: var(--accent-primary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <span>${msg}</span>
    `;
    container.appendChild(t);
    setTimeout(() => t.remove(), 4000);
  }

  openModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.add('open');
  }

  closeModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.remove('open');
  }
}

window.appController = new AppController();
document.addEventListener('DOMContentLoaded', () => window.appController.init());
