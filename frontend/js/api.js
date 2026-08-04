/**
 * ReLogix Pro - REST & WebSockets API Client
 */

class APIClient {
  constructor() {
    this.baseUrl = window.location.origin;
    this.wsUrl = (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host;
    this.ws = null;
    this.listeners = [];
    this.token = localStorage.getItem('relogix_token') || '';
  }

  setToken(token) {
    this.token = token;
    if (token) localStorage.setItem('relogix_token', token);
    else localStorage.removeItem('relogix_token');
  }

  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    options.headers = { ...this.getHeaders(), ...(options.headers || {}) };
    try {
      const res = await fetch(`${this.baseUrl}${endpoint}`, options);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.msg || 'API Request failed');
      }
      return data;
    } catch (err) {
      console.error(`API Error on ${endpoint}:`, err);
      throw err;
    }
  }

  // API Call Helpers
  async login(username, password) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    this.setToken(data.access_token);
    return data;
  }

  async getDashboardAnalytics() {
    return await this.request('/api/analytics/dashboard');
  }

  async getBatches() {
    return await this.request('/api/batches');
  }

  async getBatchById(id) {
    return await this.request(`/api/batches/${id}`);
  }

  async createBatch(batchData) {
    return await this.request('/api/batches', {
      method: 'POST',
      body: JSON.stringify(batchData)
    });
  }

  async updateBatch(updateData) {
    return await this.request('/api/batches/update', {
      method: 'POST',
      body: JSON.stringify(updateData)
    });
  }

  async getBlockchain() {
    return await this.request('/api/blockchain');
  }

  async verifyBlockchain() {
    return await this.request('/api/blockchain/verify');
  }

  async tamperBlockchain(index, fakeStatus) {
    return await this.request('/api/blockchain/tamper', {
      method: 'POST',
      body: JSON.stringify({ index, fakeStatus })
    });
  }

  async resetBlockchain() {
    return await this.request('/api/blockchain/reset', {
      method: 'POST'
    });
  }

  // WebSockets Connection & Event Subscription
  connectWebSockets(onEvent) {
    try {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => console.log('⚡ WebSockets connected to ReLogix Stream');
      this.ws.onmessage = (msg) => {
        try {
          const payload = JSON.parse(msg.data);
          if (onEvent) onEvent(payload);
        } catch (e) {
          console.error('Error parsing WS message:', e);
        }
      };
      this.ws.onclose = () => {
        console.log('WS disconnected. Reconnecting in 3s...');
        setTimeout(() => this.connectWebSockets(onEvent), 3000);
      };
    } catch (e) {
      console.error('WebSockets init error:', e);
    }
  }
}

window.apiClient = new APIClient();
