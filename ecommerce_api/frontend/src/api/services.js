import api from './client';

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register/', data),
  login: (data) => api.post('/auth/login/', data),
  logout: (refreshToken) => api.post('/auth/logout/', { refresh: refreshToken }),
  getProfile: () => api.get('/users/profile/'),
  updateProfile: (data) => api.patch('/users/profile/', data),
  changePassword: (data) => api.post('/users/change-password/', data),
};

// ─── Products ─────────────────────────────────────────────────────────────────
export const productsAPI = {
  list: (params) => api.get('/products/', { params }),
  detail: (slug) => api.get(`/products/${slug}/`),
  featured: () => api.get('/products/featured/'),
  reviews: (slug) => api.get(`/products/${slug}/reviews/`),
  addReview: (slug, data) => api.post(`/products/${slug}/reviews/`, data),
};

// ─── Categories ───────────────────────────────────────────────────────────────
export const categoriesAPI = {
  list: () => api.get('/categories/'),
  detail: (slug) => api.get(`/categories/${slug}/`),
};

// ─── Cart ─────────────────────────────────────────────────────────────────────
export const cartAPI = {
  get: () => api.get('/cart/'),
  addItem: (productId, quantity = 1) =>
    api.post('/cart/items/', { product_id: productId, quantity }),
  updateItem: (itemId, quantity) =>
    api.put(`/cart/items/${itemId}/`, { quantity }),
  removeItem: (itemId) => api.delete(`/cart/items/${itemId}/`),
  clear: () => api.delete('/cart/'),
};

// ─── Orders ───────────────────────────────────────────────────────────────────
export const ordersAPI = {
  checkout: (data) => api.post('/orders/checkout/', data),
  list: (params) => api.get('/orders/', { params }),
  detail: (id) => api.get(`/orders/${id}/`),
  cancel: (id) => api.put(`/orders/${id}/cancel/`),
  updateStatus: (id, data) => api.put(`/orders/${id}/status/`, data),
};

// ─── Inventory (Admin) ────────────────────────────────────────────────────────
export const inventoryAPI = {
  adjust: (data) => api.post('/inventory/adjust/', data),
  logs: (params) => api.get('/inventory/logs/', { params }),
  lowStock: () => api.get('/inventory/low-stock/'),
};
