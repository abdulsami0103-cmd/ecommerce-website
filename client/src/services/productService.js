import api from './api';

const productService = {
  getProducts: async (params = {}) => {
    const response = await api.get('/products', { params });
    return response.data;
  },

  getProduct: async (slug) => {
    const response = await api.get(`/products/${slug}`);
    return response.data.data;
  },

  getVendorProducts: async (vendorId, params = {}) => {
    const response = await api.get('/products', { params: { ...params, vendor: vendorId } });
    return response.data;
  },

  getCategories: async () => {
    const response = await api.get('/categories');
    return response.data.data;
  },

  getCategory: async (slug) => {
    const response = await api.get(`/categories/${slug}`);
    return response.data.data;
  },

  // Vendor product management
  createProduct: async (productData) => {
    const response = await api.post('/products', productData);
    return response.data.data;
  },

  updateProduct: async (id, productData) => {
    const response = await api.put(`/products/${id}`, productData);
    return response.data.data;
  },

  deleteProduct: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  getMyProducts: async (params = {}) => {
    const response = await api.get('/products/my/products', { params });
    return response.data;
  },

  // Reviews
  getProductReviews: async (productId, params = {}) => {
    const response = await api.get(`/products/${productId}/reviews`, { params });
    return response.data;
  },

  addReview: async (productId, reviewData) => {
    const response = await api.post(`/products/${productId}/reviews`, reviewData);
    return response.data.data;
  },
};

export default productService;
