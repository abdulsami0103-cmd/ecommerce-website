import api from './api';

const orderService = {
  createOrder: async (orderData) => {
    console.log('OrderService - Creating order with data:', orderData);
    try {
      const response = await api.post('/orders', orderData);
      console.log('OrderService - Response:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('OrderService - Error:', error.response?.status, error.response?.data);
      throw error;
    }
  },

  getMyOrders: async (params = {}) => {
    const response = await api.get('/orders', { params });
    return response.data;
  },

  getOrder: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data.data;
  },

  updatePaymentStatus: async (orderId, paymentData) => {
    const response = await api.put(`/orders/${orderId}/payment`, paymentData);
    return response.data.data;
  },

  // Vendor orders
  getVendorOrders: async (params = {}) => {
    const response = await api.get('/vendors/me/orders', { params });
    return response.data;
  },

  updateItemStatus: async (orderId, itemId, status, trackingNumber) => {
    const response = await api.put(`/orders/${orderId}/items/${itemId}/status`, {
      status,
      trackingNumber,
    });
    return response.data.data;
  },

  // Vendor Sub-Orders
  getVendorSubOrders: async (params = {}) => {
    const response = await api.get('/vendor/suborders', { params });
    return response.data;
  },

  getVendorSubOrder: async (id) => {
    const response = await api.get(`/vendor/suborders/${id}`);
    return response.data;
  },

  updateSubOrderStatus: async (id, status, note) => {
    const response = await api.put(`/vendor/suborders/${id}/status`, { status, note });
    return response.data;
  },

  getSubOrderStats: async () => {
    const response = await api.get('/vendor/suborders/stats');
    return response.data;
  },

  // Sub-Order Shipments
  getSubOrderShipments: async (subOrderId) => {
    const response = await api.get(`/vendor/suborders/${subOrderId}/shipments`);
    return response.data;
  },

  createSubOrderShipment: async (subOrderId, shipmentData) => {
    const response = await api.post(`/vendor/suborders/${subOrderId}/shipments`, shipmentData);
    return response.data;
  },

  getSubOrderShippingRates: async (subOrderId, packageData) => {
    const response = await api.post(`/vendor/suborders/${subOrderId}/rates`, packageData);
    return response.data;
  },
};

export default orderService;
