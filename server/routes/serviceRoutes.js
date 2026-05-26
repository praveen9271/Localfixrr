import express from 'express';
const router = express.Router();
import { getAllServices, getServiceById, getServiceReviews } from '../controllers/userController.js';

// Public routes for browsing services
router.get('/', getAllServices);
router.get('/:id', getServiceById);
router.get('/:id/reviews', getServiceReviews);

export default router;
