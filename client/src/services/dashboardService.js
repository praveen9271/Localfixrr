import api from './api';

const toQueryString = (filters = {}) => {
  const params = new URLSearchParams(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== ''),
  );
  const query = params.toString();
  return query ? `?${query}` : '';
};

const get = async (url, filters, options = {}) => {
  const response = await api.get(`${url}${toQueryString(filters)}`, options);
  return response.data;
};

const post = async (url, data) => {
  const response = await api.post(url, data);
  return response.data;
};

const put = async (url, data) => {
  const response = await api.put(url, data);
  return response.data;
};

const del = async (url) => {
  const response = await api.delete(url);
  return response.data;
};

// Admin APIs
export const getAdminStats = async () => {
  return get('/admin/stats');
};

export const getAllUsers = async (filters = {}) => {
  return get('/admin/users', filters);
};

export const getAllProviders = async (filters = {}) => {
  return get('/admin/providers', filters);
};

export const getAdminServices = async (filters = {}) => {
  return get('/admin/services', filters);
};

export const deleteAdminService = async (id) => {
  return del(`/admin/services/${id}`);
};

export const getAdminBookings = async (filters = {}) => {
  return get('/admin/bookings', filters);
};

export const getAdminReviews = async (filters = {}) => {
  return get('/admin/reviews', filters);
};

export const updateUser = async (id, userData) => {
  return put(`/admin/users/${id}`, userData);
};

export const deleteUser = async (id) => {
  return del(`/admin/users/${id}`);
};

export const deleteProvider = async (id) => {
  return del(`/admin/providers/${id}`);
};

export const updateProviderStatus = async (id, status) => {
  return put(`/admin/providers/${id}/status`, { status });
};

export const updateAdminBookingStatus = async (id, data) => {
  return put(`/admin/bookings/${id}/status`, data);
};

export const getAdminCategories = async () => {
  return get('/admin/categories');
};

export const createAdminCategory = async (categoryData) => {
  return post('/admin/categories', categoryData);
};

export const updateAdminCategory = async (id, categoryData) => {
  return put(`/admin/categories/${id}`, categoryData);
};

export const deleteAdminCategory = async (id) => {
  return del(`/admin/categories/${id}`);
};

export const getAdminNotifications = async () => {
  return get('/admin/notifications');
};

export const createAdminNotification = async (notificationData) => {
  return post('/admin/notifications', notificationData);
};

export const markAdminNotificationRead = async (id) => {
  return put(`/admin/notifications/${id}/read`, {});
};

export const getAdminReports = async () => {
  return get('/admin/reports');
};

export const generateAdminReport = async (reportType = 'operations') => {
  return post('/admin/reports', { reportType });
};

export const getAdminLogs = async () => {
  return get('/admin/logs');
};

export const exportAdminUsersCsv = async () => {
  const response = await api.get('/admin/users/export/csv', { responseType: 'blob' });
  return response.data;
};

// Provider APIs
export const getProviderStats = async () => {
  return get('/provider/stats');
};

export const createService = async (serviceData) => {
  return post('/provider/services', serviceData);
};

export const getMyServices = async () => {
  return get('/provider/services');
};

export const updateService = async (id, serviceData) => {
  return put(`/provider/services/${id}`, serviceData);
};

export const deleteService = async (id) => {
  return del(`/provider/services/${id}`);
};

export const getProviderBookings = async () => {
  return get('/provider/bookings');
};

export const updateBookingStatus = async (id, status) => {
  return put(`/provider/bookings/${id}`, { status });
};

export const getProviderProfile = async () => {
  return get('/provider/profile');
};

export const updateProviderProfile = async (profileData) => {
  return put('/provider/profile', profileData);
};

// User APIs
export const getUserStats = async () => {
  return get('/user/stats');
};

export const browseServices = async (filters = {}, options = {}) => {
  return get('/services', filters, options);
};

export const getServiceDetails = async (id) => {
  return get(`/services/${id}`);
};

export const createBooking = async (bookingData) => {
  return post('/user/bookings', bookingData);
};

export const getMyBookings = async () => {
  return get('/user/bookings');
};

export const cancelBooking = async (id) => {
  return put(`/user/bookings/${id}/cancel`, {});
};

export const submitReview = async (reviewData) => {
  return post('/user/reviews', reviewData);
};

// Public APIs
export const getPublicServices = async (filters = {}, options = {}) => {
  return get('/services', filters, options);
};

export const getPublicServiceDetails = async (id) => {
  return get(`/services/${id}`);
};

export const getServiceReviews = async (id) => {
  return get(`/services/${id}/reviews`);
};

// Profile APIs
export const updateUserProfile = async (profileData) => {
  return put('/auth/profile', profileData);
};

export const changeUserPassword = async (passwordData) => {
  return put('/auth/password', passwordData);
};

export const deleteAccount = async (confirmation) => {
  const response = await api.delete('/auth/account', { data: { confirmation } });
  return response.data;
};

// Provider Reviews API
export const getProviderReviews = async () => {
  return get('/provider/reviews');
};

// Admin Delete APIs
export const deleteReview = async (id) => {
  return del(`/admin/reviews/${id}`);
};
