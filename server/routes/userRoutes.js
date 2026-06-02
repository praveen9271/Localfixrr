import express from 'express';
const router = express.Router();
import {
  getAllServices,
  getServiceById,
  createBooking,
  getMyBookings,
  cancelBooking,
  getUserStats,
  createReview
} from '../controllers/userController.js';
import { authenticateUser, authorizeRoles } from '../middleware/roleMiddleware.js';

// All routes are protected and user-only
router.use(authenticateUser);
router.use(authorizeRoles('user'));

// Service browsing routes (public services)
router.get('/services', getAllServices);
router.get('/services/:id', getServiceById);

// Booking routes
router.post('/bookings', createBooking);
router.get('/bookings', getMyBookings);
router.put('/bookings/:id/cancel', cancelBooking);
router.delete('/bookings/:id', cancelBooking);

// Review routes
router.post('/reviews', createReview);

// Dashboard stats
router.get('/stats', getUserStats);

export default router;
