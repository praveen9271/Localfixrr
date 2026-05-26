import express from 'express';
const router = express.Router();
import {
  getAllUsers,
  getAllProviders,
  getUserById,
  updateUser,
  deleteUser,
  getAllServices,
  deleteService,
  getAllBookings,
  updateBookingStatus,
  getDashboardStats,
  getAllReviews,
  deleteReview,
  updateProviderStatus,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getNotifications,
  createNotification,
  markNotificationRead,
  getReports,
  generateReport,
  getAdminLogs,
  exportUsersCsv,
} from '../controllers/adminController.js';
import { protect, adminOnly } from '../middleware/roleMiddleware.js';

// All routes are protected and admin-only
router.use(protect);
router.use(adminOnly);

// User management routes
router.get('/users', getAllUsers);
router.get('/users/export/csv', exportUsersCsv);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Provider management routes
router.get('/providers', getAllProviders);
router.put('/providers/:id/status', updateProviderStatus);

// Service management routes
router.get('/services', getAllServices);
router.delete('/services/:id', deleteService);

// Booking management routes
router.get('/bookings', getAllBookings);
router.put('/bookings/:id/status', updateBookingStatus);

// Review monitoring routes
router.get('/reviews', getAllReviews);
router.delete('/reviews/:id', deleteReview);

// Category management routes
router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Notifications, reports, and audit logs
router.get('/notifications', getNotifications);
router.post('/notifications', createNotification);
router.put('/notifications/:id/read', markNotificationRead);
router.get('/reports', getReports);
router.post('/reports', generateReport);
router.get('/logs', getAdminLogs);

// Dashboard stats
router.get('/stats', getDashboardStats);

export default router;
