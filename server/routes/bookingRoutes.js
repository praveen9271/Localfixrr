import express from 'express';
import { cancelBooking, createBooking, getMyBookings } from '../controllers/userController.js';
import { authenticateUser, authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authenticateUser);
router.use(authorizeRoles('user'));

router.post('/bookings', createBooking);
router.get('/my-bookings', getMyBookings);
router.delete('/booking/:id', cancelBooking);

export default router;
