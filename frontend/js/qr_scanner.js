/**
 * ReLogix Pro - QR Code Generator & PDF Manifest Exporter
 */

class QRScannerUI {
  generateQR(batchId, containerId = 'qr-code-canvas') {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = '';

    if (window.QRCode) {
      new QRCode(el, {
        text: `RELOGIX-PRO:${batchId}`,
        width: 160,
        height: 160,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
      });
    } else {
      el.innerHTML = `<div style="padding: 20px; font-family: monospace;">QR: RELOGIX-${batchId}</div>`;
    }
  }

  exportPDFManifest(batch, events = []) {
    if (!batch) return;

    if (window.jspdf && window.jspdf.jsPDF) {
      const doc = new window.jspdf.jsPDF();
      
      doc.setFontSize(22);
      doc.setTextColor(37, 99, 235);
      doc.text('ReLogix Pro - Reverse Logistics Manifest', 14, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated: ${new Date().toLocaleString()} | Official Blockchain Verified Document`, 14, 28);
      
      doc.setLineWidth(0.5);
      doc.setDrawColor(200);
      doc.line(14, 32, 196, 32);

      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text(`Batch ID: ${batch.id}`, 14, 44);

      doc.setFontSize(11);
      doc.text(`Product Name: ${batch.productName}`, 14, 54);
      doc.text(`Category: ${batch.category}`, 14, 62);
      doc.text(`Quantity: ${batch.quantity} units ($${batch.totalValue})`, 14, 70);
      doc.text(`Return Reason: ${batch.reason}`, 14, 78);
      doc.text(`Current Stage: ${batch.currentStage}`, 14, 86);
      doc.text(`Sender: ${batch.sender}`, 14, 94);
      doc.text(`Manufacturer: ${batch.manufacturer}`, 14, 102);

      doc.line(14, 110, 196, 110);
      doc.text('Audit Trail / Blockchain Proof Log:', 14, 120);

      let y = 130;
      events.forEach((evt, idx) => {
        doc.setFontSize(10);
        doc.text(`${idx + 1}. [${new Date(evt.timestamp).toLocaleDateString()}] ${evt.action} by ${evt.actor}`, 16, y);
        doc.setFontSize(8);
        doc.setTextColor(120);
        doc.text(`   Location: ${evt.location} | Block Hash: ${evt.blockHash ? evt.blockHash.substring(0, 30) + '...' : 'N/A'}`, 16, y + 5);
        y += 12;
      });

      doc.save(`Manifest_${batch.id}.pdf`);
    } else {
      window.print();
    }
  }
}

window.qrScannerUI = new QRScannerUI();
