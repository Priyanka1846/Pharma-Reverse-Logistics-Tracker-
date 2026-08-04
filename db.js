const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial Seed Data
const initialData = {
  users: [
    { id: 1, username: "pharmacy_main", passwordHash: "pharmacy123", role: "Pharmacy", name: "City Care Pharmacy", location: "New York, NY" },
    { id: 2, username: "express_logistics", passwordHash: "carrier123", role: "Carrier", name: "Express Cold Logistics", location: "Chicago Hub, IL" },
    { id: 3, username: "pharma_corp", passwordHash: "pharma123", role: "Manufacturer", name: "AstraPharma Global", location: "Boston HQ, MA" },
    { id: 4, username: "fda_auditor", passwordHash: "audit123", role: "Auditor", name: "Federal Safety Auditor", location: "Washington DC" },
    { id: 5, username: "admin", passwordHash: "admin123", role: "Admin", name: "System Administrator", location: "Global Operations" }
  ],
  batches: [
    {
      id: "BATCH-PH-9082",
      productName: "Amoxicillin 500mg Vials",
      category: "Antibiotics",
      quantity: 500,
      unitValue: 18.50,
      totalValue: 9250.00,
      reason: "Near Expiry (< 30 days)",
      currentStage: "AI Inspected",
      sender: "City Care Pharmacy",
      carrier: "Express Cold Logistics",
      manufacturer: "AstraPharma Global",
      disposition: "Restock (Discounted Outlet)",
      aiRiskScore: 12,
      riskLevel: "Low",
      carbonSavedKg: 34.2,
      expiryDate: "2026-08-25",
      temperatureCelsius: 4.5,
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
      id: "BATCH-VAC-4012",
      productName: "mRNA Vaccine Cold-Chain",
      category: "Cold-Chain Vaccines",
      quantity: 200,
      unitValue: 95.00,
      totalValue: 19000.00,
      reason: "Temperature Excursion Alert",
      currentStage: "In Transit",
      sender: "Metro Hospital Clinic",
      carrier: "Express Cold Logistics",
      manufacturer: "BioShield Labs",
      disposition: "Pending AI Analysis",
      aiRiskScore: 78,
      riskLevel: "High Risk (Temp Fluctuation)",
      carbonSavedKg: 12.8,
      expiryDate: "2027-01-15",
      temperatureCelsius: 12.2, // Excursion!
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 6).toISOString()
    },
    {
      id: "BATCH-BIO-7711",
      productName: "Humira Auto-Injectors 40mg",
      category: "Biologics",
      quantity: 150,
      unitValue: 240.00,
      totalValue: 36000.00,
      reason: "FDA Batch Recall #4029",
      currentStage: "Received at Warehouse",
      sender: "St. Jude Pharmacy",
      carrier: "SafeMed Transport",
      manufacturer: "AstraPharma Global",
      disposition: "Eco-Incineration",
      aiRiskScore: 25,
      riskLevel: "Low",
      carbonSavedKg: 58.0,
      expiryDate: "2026-11-30",
      temperatureCelsius: 3.8,
      createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 1).toISOString()
    },
    {
      id: "BATCH-ONC-3309",
      productName: "Keytruda Infusion Vials",
      category: "Oncology",
      quantity: 80,
      unitValue: 480.00,
      totalValue: 38400.00,
      reason: "Overstock Return",
      currentStage: "Initiated",
      sender: "City Care Pharmacy",
      carrier: "Express Cold Logistics",
      manufacturer: "OncoGen Therapeutics",
      disposition: "Full Restock",
      aiRiskScore: 8,
      riskLevel: "Low",
      carbonSavedKg: 22.4,
      expiryDate: "2027-06-10",
      temperatureCelsius: 5.0,
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 4).toISOString()
    },
    {
      id: "BATCH-CARD-1102",
      productName: "Lipitor 20mg Tablets (Box of 100)",
      category: "Cardiovascular",
      quantity: 1000,
      unitValue: 6.50,
      totalValue: 6500.00,
      reason: "Damaged Outer Packaging",
      currentStage: "Completed & Settled",
      sender: "Valley Health Depot",
      carrier: "SafeMed Transport",
      manufacturer: "AstraPharma Global",
      disposition: "Repackage & Secondary Market",
      aiRiskScore: 18,
      riskLevel: "Low",
      carbonSavedKg: 41.5,
      expiryDate: "2027-04-18",
      temperatureCelsius: 21.0,
      createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 3).toISOString()
    }
  ],
  events: [
    {
      id: "EVT-1001",
      batchId: "BATCH-PH-9082",
      actor: "pharmacy_main (Pharmacy)",
      action: "Initiated Return Request",
      notes: "Batch near expiration date. Returned for credit.",
      location: "New York, NY",
      timestamp: new Date(Date.now() - 86400000 * 5).toISOString()
    },
    {
      id: "EVT-1002",
      batchId: "BATCH-PH-9082",
      actor: "express_logistics (Carrier)",
      action: "In Transit Pickup",
      notes: "Inspected climate box. Temp maintained at 4.5°C.",
      location: "New Jersey Transit Hub",
      timestamp: new Date(Date.now() - 86400000 * 4).toISOString()
    },
    {
      id: "EVT-1003",
      batchId: "BATCH-PH-9082",
      actor: "pharma_corp (Manufacturer)",
      action: "AI Inspected & Approved",
      notes: "AI verification passed. Approved for discounted outlet restock.",
      location: "Boston Central Depot",
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
    }
  ]
};

class Database {
  constructor() {
    this.data = this.loadData();
  }

  loadData() {
    try {
      if (fs.existsSync(STORE_PATH)) {
        const raw = fs.readFileSync(STORE_PATH, "utf8");
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error("Error reading database store, resetting to seed data:", e);
    }
    this.saveData(initialData);
    return initialData;
  }

  saveData(data = this.data) {
    try {
      fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), "utf8");
    } catch (e) {
      console.error("Error saving database store:", e);
    }
  }

  getUsers() {
    return this.data.users;
  }

  findUser(username) {
    return this.data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  getBatches() {
    return this.data.batches;
  }

  getBatchById(id) {
    return this.data.batches.find(b => b.id === id);
  }

  createBatch(batchObj) {
    const newBatch = {
      ...batchObj,
      totalValue: Number(batchObj.quantity || 0) * Number(batchObj.unitValue || 0),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.batches.unshift(newBatch);
    this.saveData();
    return newBatch;
  }

  updateBatch(id, updates) {
    const idx = this.data.batches.findIndex(b => b.id === id);
    if (idx !== -1) {
      this.data.batches[idx] = {
        ...this.data.batches[idx],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.saveData();
      return this.data.batches[idx];
    }
    return null;
  }

  getEvents(batchId = null) {
    if (batchId) {
      return this.data.events.filter(e => e.batchId === batchId);
    }
    return this.data.events;
  }

  addEvent(eventObj) {
    const newEvent = {
      id: "EVT-" + Math.floor(1000 + Math.random() * 9000),
      timestamp: new Date().toISOString(),
      ...eventObj
    };
    this.data.events.unshift(newEvent);
    this.saveData();
    return newEvent;
  }
}

module.exports = new Database();
