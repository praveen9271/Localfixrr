const express = require('express');
const router = express.Router();
const {
  getAllServices,
  getServiceById,
  createBooking,
  getMyBookings,
  cancelBooking,
  getUserStats,
  createReview
} = require('../controllers/userController');
const { protect, userOnly } = require('../middleware/roleMiddleware');

// All routes are protected and user-only
router.use(protect);
router.use(userOnly);

// Service browsing routes (public services)
router.get('/services', getAllServices);
router.get('/services/:id', getServiceById);

// Booking routes
router.post('/bookings', createBooking);
router.get('/bookings', getMyBookings);
router.put('/bookings/:id/cancel', cancelBooking);

// Review routes
router.post('/reviews', createReview);

// Dashboard stats
router.get('/stats', getUserStats);

module.exports = router;
