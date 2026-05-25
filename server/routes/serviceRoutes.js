const express = require('express');
const router = express.Router();
const { getAllServices, getServiceById, getServiceReviews } = require('../controllers/userController');

// Public routes for browsing services
router.get('/', getAllServices);
router.get('/:id', getServiceById);
router.get('/:id/reviews', getServiceReviews);

module.exports = router;
