/**
 * ReLogix Pro - Blockchain Ledger Explorer & Tamper Visualizer
 */

class BlockchainUI {
  renderChain(chainData, verification) {
    const container = document.getElementById('blockchain-nodes-list');
    const banner = document.getElementById('blockchain-status-banner');

    if (banner && verification) {
      if (verification.valid) {
        banner.className = 'chain-banner';
        banner.innerHTML = `
          <div style="display: flex; align-items: center; gap: 12px;">
            <svg style="width: 24px; height: 24px; color: #10b981;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <div>
              <strong style="color: #10b981; font-size: 15px;">Cryptographic Ledger Verified (Valid)</strong>
              <div style="font-size: 13px; color: var(--text-muted);">All ${verification.blockCount} blocks sealed with valid SHA-256 signatures & unbroken hash pointers.</div>
            </div>
          </div>
          <span class="badge badge-emerald">HEALTHY</span>
        `;
      } else {
        banner.className = 'chain-banner invalid';
        banner.innerHTML = `
          <div style="display: flex; align-items: center; gap: 12px;">
            <svg style="width: 24px; height: 24px; color: #ef4444;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <div>
              <strong style="color: #ef4444; font-size: 15px;">TAMPER DETECTED ON LEDGER!</strong>
              <div style="font-size: 13px; color: #ef4444;">${verification.reason || 'Block hash signature mismatch.'}</div>
            </div>
          </div>
          <span class="badge badge-rose">COMPROMISED</span>
        `;
      }
    }

    if (!container || !chainData) return;

    container.innerHTML = chainData.map(block => `
      <div class="block-node">
        <div class="block-node-header">
          <span class="block-index">Block #${block.index}</span>
          <span class="badge ${block.index === 0 ? 'badge-purple' : 'badge-blue'}">${block.batchId}</span>
        </div>
        <div style="margin-bottom: 8px;">
          <div style="font-size: 11px; color: var(--text-light);">Block Hash (SHA-256):</div>
          <div class="hash-code">${block.hash}</div>
        </div>
        <div style="margin-bottom: 8px;">
          <div style="font-size: 11px; color: var(--text-light);">Previous Hash:</div>
          <div class="hash-code" style="opacity: 0.7;">${block.previousHash.substring(0, 20)}...</div>
        </div>
        <div style="font-size: 12px; color: var(--text-muted); margin-top: 8px;">
          <div>Actor: <strong>${block.actor}</strong></div>
          <div>Status: <span style="color: var(--accent-primary);">${block.status}</span></div>
          <div style="font-size: 11px; color: var(--text-light); margin-top: 4px;">Timestamp: ${new Date(block.timestamp).toLocaleString()}</div>
        </div>
      </div>
    `).join('');
  }
}

window.blockchainUI = new BlockchainUI();
