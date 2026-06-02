import express from 'express';
const router = express.Router();
import { getAllServices, getServiceById, getServiceReviews } from '../controllers/userController.js';
import { cacheResponse } from '../middleware/cacheMiddleware.js';

// Public routes for browsing services
router.get('/', cacheResponse(45), getAllServices);
router.get('/:id', cacheResponse(30), getServiceById);
router.get('/:id/reviews', cacheResponse(30), getServiceReviews);

export default router;
