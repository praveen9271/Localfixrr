const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/providerController');
const { protect, providerOnly } = require('../middleware/roleMiddleware');

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

module.exports = router;
