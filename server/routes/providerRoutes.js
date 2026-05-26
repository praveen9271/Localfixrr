import express from 'express';
const router = express.Router();
import {
  createService,
  getMyServices,
  updateService,
  deleteService,
  getMyBookings,
  updateBookingStatus,
  getProviderStats,
  getProviderProfile,
  updateProviderProfile,
  getProviderReviews,
} from '../controllers/providerController.js';
import { protect, providerOnly } from '../middleware/roleMiddleware.js';

// All routes are protected and provider-only
router.use(protect);
router.use(providerOnly);

// Service management routes
router.get('/profile', getProviderProfile);
router.put('/profile', updateProviderProfile);
router.post('/services', createService);
router.get('/services', getMyServices);
router.put('/services/:id', updateService);
router.delete('/services/:id', deleteService);

// Booking management routes
router.get('/bookings', getMyBookings);
router.put('/bookings/:id', updateBookingStatus);

// Dashboard stats
router.get('/stats', getProviderStats);

// Reviews route
router.get('/reviews', getProviderReviews);

export default router;
