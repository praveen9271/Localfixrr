import express from 'express';
import { uploadImage } from '../controllers/uploadController.js';
import { parseSingleImage } from '../middleware/uploadMiddleware.js';
import { protect } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.post('/image', protect, parseSingleImage, uploadImage);

export default router;
