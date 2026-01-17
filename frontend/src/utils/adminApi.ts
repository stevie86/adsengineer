// API utilities for Admin dashboard
const API_BASE = 'http://172.104.241.225:8090'; // Public IP of your VPS
const ADMIN_TOKEN = 'dev-admin-secret-12345';

export const adminApi = {
  // Get system health
  getSystemHealth: async () => {
    const response = await fetch(`${API_BASE}/api/v1/admin/system/health`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  },

  // Get all agencies
  getAgencies: async () => {
    const response = await fetch(`${API_BASE}/api/v1/admin/agencies`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  },

  // Create new agency
  createAgency: async (agencyData: { name: string; contact_email: string; status?: string }) => {
    const response = await fetch(`${API_BASE}/api/v1/admin/agencies`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(agencyData)
    });
    return response.json();
  },

  // Get agency subscriptions
  getAgencySubscriptions: async (agencyId: string) => {
    const response = await fetch(`${API_BASE}/api/v1/admin/agencies/${agencyId}/subscriptions`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  },

  // Get agency usage
  getAgencyUsage: async (agencyId: string) => {
    const response = await fetch(`${API_BASE}/api/v1/admin/agencies/${agencyId}/usage`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  },

  // Get billing pricing
  getPricing: async () => {
    const response = await fetch(`${API_BASE}/api/v1/billing/pricing`);
    return response.json();
  },

  // Test Stripe integration
  testStripeCustomer: async () => {
    const response = await fetch(`${API_BASE}/api/v1/admin/stripe/test-customer`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }
};