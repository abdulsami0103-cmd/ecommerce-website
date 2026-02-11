import api from './api';

const vendorService = {
  registerVendor: async (vendorData) => {
    const response = await api.post('/vendors/register', vendorData);
    return response.data.data;
  },

  getVendors: async (params = {}) => {
    const response = await api.get('/vendors', { params });
    return response.data;
  },

  getVendor: async (slug) => {
    const response = await api.get(`/vendors/${slug}`);
    return response.data.data;
  },

  getMyVendorProfile: async () => {
    const response = await api.get('/vendors/me/profile');
    return response.data.data;
  },

  updateVendorProfile: async (profileData) => {
    const response = await api.put('/vendors/profile', profileData);
    return response.data.data;
  },

  getDashboard: async () => {
    const response = await api.get('/vendors/me/dashboard');
    return response.data.data;
  },

  // Stripe Connect
  createStripeAccount: async () => {
    const response = await api.post('/vendors/stripe-connect');
    return response.data;
  },

  requestPayout: async (amount) => {
    const response = await api.post('/vendors/payout', { amount });
    return response.data.data;
  },

  getPayoutHistory: async (params = {}) => {
    const response = await api.get('/vendors/me/payouts', { params });
    return response.data;
  },
};

export default vendorService;
