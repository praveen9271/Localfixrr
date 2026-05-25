const Service = require('../models/Service');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Provider = require('../models/Provider');
const mongoose = require('mongoose');
const fallbackServices = require('../data/fallbackServices');
const { buildPagination, getPagination } = require('../utils/pagination');

const populateServiceProvider = {
  path: 'provider',
  select: 'businessName available rating reviewsCount serviceAreas user',
  populate: { path: 'user', select: 'name email phone address' },
};

const categoryAliases = {
  plumbing: ['Plumbing', 'Plumber'],
  plumber: ['Plumbing', 'Plumber'],
  electrical: ['Electrical', 'Electrician'],
  electrician: ['Electrical', 'Electrician'],
  carpentry: ['Carpentry', 'Carpenter'],
  carpenter: ['Carpentry', 'Carpenter'],
  painting: ['Painting', 'Painter'],
  painter: ['Painting', 'Painter'],
};

const excludedPublicCategories = [];
const serviceAreaPattern = /.*/i;

const getCategoryValues = (category) => {
  if (!category) return [];
  return categoryAliases[String(category).toLowerCase()] || [category];
};

const isDbConnected = () => mongoose.connection.readyState === 1;

const filterFallbackServices = ({ category, search, minPrice, maxPrice }) => {
  const categoryValues = getCategoryValues(category).map((value) => value.toLowerCase());
  const searchValue = String(search || '').trim().toLowerCase();
  const min = minPrice !== undefined && minPrice !== '' ? Number(minPrice) : undefined;
  const max = maxPrice !== undefined && maxPrice !== '' ? Number(maxPrice) : undefined;

  return fallbackServices.filter((service) => {
    if (categoryValues.length && !categoryValues.includes(String(service.category).toLowerCase())) {
      return false;
    }

    if (searchValue) {
      const searchable = [
        service.title,
        service.description,
        service.category,
        service.provider?.businessName,
        service.provider?.user?.name,
        service.location,
      ].join(' ').toLowerCase();
      if (!searchable.includes(searchValue)) return false;
    }

    if (min !== undefined && service.price < min) return false;
    if (max !== undefined && service.price > max) return false;

    return true;
  });
};

const sendFallbackServices = (req, res, message = 'Showing demo services because MongoDB is not connected.') => {
  const { category, search, minPrice, maxPrice } = req.query;
  const { page, limit, skip } = getPagination(req.query);
  const filtered = filterFallbackServices({ category, search, minPrice, maxPrice });
  const services = filtered.slice(skip, skip + limit);

  res.status(200).json({
    success: true,
    demo: true,
    count: services.length,
    pagination: buildPagination(page, limit, filtered.length),
    services,
    message,
  });
};

const recalculateRatings = async (serviceId, providerId) => {
  const [serviceRating] = await Review.aggregate([
    { $match: { service: serviceId } },
    { $group: { _id: '$service', rating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  await Service.findByIdAndUpdate(serviceId, {
    rating: Number((serviceRating?.rating || 0).toFixed(1)),
    reviewsCount: serviceRating?.count || 0,
  });

  const [providerRating] = await Review.aggregate([
    { $match: { provider: providerId } },
    { $group: { _id: '$provider', rating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  await Provider.findByIdAndUpdate(providerId, {
    rating: Number((providerRating?.rating || 0).toFixed(1)),
    reviewsCount: providerRating?.count || 0,
  });
};

// @desc    Get all available services (Public)
// @route   GET /api/services
// @access  Public
const getAllServices = async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice } = req.query;
    const { page, limit, skip } = getPagination(req.query);
    let query = {
      status: 'active',
      category: { $nin: excludedPublicCategories },
    };

    if (!isDbConnected()) {
      return sendFallbackServices(req, res);
    }

    if (category) {
      const categoryValues = getCategoryValues(category);
      if (categoryValues.some((value) => excludedPublicCategories.includes(value))) {
        return res.status(200).json({
          success: true,
          count: 0,
          pagination: buildPagination(page, limit, 0),
          services: [],
        });
      }
      query.category = { $in: categoryValues, $nin: excludedPublicCategories };
    }

    if (search) {
      query.$text = { $search: search };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
    }

    const total = await Service.countDocuments(query);
    if (total === 0) {
      return sendFallbackServices(req, res, 'Showing demo services because MongoDB has no matching active services.');
    }

    const services = await Service.find(query)
      .populate(populateServiceProvider)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: services.length,
      pagination: buildPagination(page, limit, total),
      services
    });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get service by ID
// @route   GET /api/user/services/:id
// @access  User
const getServiceById = async (req, res) => {
  try {
    const fallbackService = fallbackServices.find((item) => item._id === req.params.id);
    if (fallbackService) {
      return res.status(200).json({ success: true, demo: true, service: fallbackService });
    }

    if (!isDbConnected()) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    const service = await Service.findById(req.params.id)
      .populate(populateServiceProvider);

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    res.status(200).json({ success: true, service });
  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Book a service
// @route   POST /api/user/bookings
// @access  User
const createBooking = async (req, res) => {
  try {
    const { serviceId, date, notes, address } = req.body;

    if (!serviceId || !date) {
      return res.status(400).json({ message: 'Please provide service and date' });
    }

    const bookingDate = new Date(date);
    if (isNaN(bookingDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid date format' });
    }
    if (bookingDate < new Date()) {
      return res.status(400).json({ success: false, message: 'Booking date cannot be in the past' });
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    if (service.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Service is not available for booking' });
    }

    const booking = await Booking.create({
      service: serviceId,
      customer: req.user.id,
      provider: service.provider,
      date: new Date(date),
      address: address || req.user.address,
      notes: notes || '',
      totalAmount: service.price
    });

    await booking.populate('service', 'title category price');
    await booking.populate(populateServiceProvider);

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get user's bookings
// @route   GET /api/user/bookings
// @access  User
const getMyBookings = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const total = await Booking.countDocuments({ customer: req.user.id });
    const bookings = await Booking.find({ customer: req.user.id })
      .populate('service', 'title category price')
      .populate(populateServiceProvider)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: bookings.length,
      pagination: buildPagination(page, limit, total),
      bookings
    });
  } catch (error) {
    console.error('Get my bookings error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Cancel a booking
// @route   PUT /api/user/bookings/:id/cancel
// @access  User
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.customer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (['completed', 'cancelled', 'rejected'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: `Cannot cancel a ${booking.status} booking` });
    }

    booking.status = 'cancelled';
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      booking
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get user dashboard stats
// @route   GET /api/user/stats
// @access  User
const getUserStats = async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments({ customer: req.user.id });
    const pendingBookings = await Booking.countDocuments({ customer: req.user.id, status: 'pending' });
    const completedBookings = await Booking.countDocuments({ customer: req.user.id, status: 'completed' });
    const reviewsGiven = await Review.countDocuments({ user: req.user.id });
    const totalSpent = await Booking.aggregate([
      { $match: { customer: req.user._id, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalBookings,
        pendingBookings,
        completedBookings,
        reviewsGiven,
        totalSpent: totalSpent[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Review a completed booking
// @route   POST /api/user/reviews
// @access  User
const createReview = async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;

    if (!bookingId || rating === undefined || rating === null || !comment) {
      return res.status(400).json({ success: false, message: 'Booking, rating and comment are required' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    if (booking.customer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to review this booking' });
    }
    if (booking.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Only completed bookings can be reviewed' });
    }

    const review = await Review.create({
      user: req.user.id,
      provider: booking.provider,
      booking: booking._id,
      service: booking.service,
      rating,
      comment,
    });

    await recalculateRatings(booking.service, booking.provider);
    await review.populate('user', 'name');

    res.status(201).json({ success: true, message: 'Review submitted successfully', review });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(error.code === 11000 ? 409 : 500).json({
      success: false,
      message: error.code === 11000 ? 'You have already reviewed this booking' : 'Server error',
      error: error.message,
    });
  }
};


// @desc    Get service reviews
// @route   GET /api/services/:id/reviews
// @access  Public
const getServiceReviews = async (req, res) => {
  try {
    const fallbackService = fallbackServices.find((item) => item._id === req.params.id);
    if (fallbackService) {
      return res.status(200).json({ success: true, demo: true, count: 0, reviews: [] });
    }

    if (!isDbConnected()) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    const reviews = await Review.find({ service: req.params.id })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: reviews.length, reviews });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = {
  getAllServices,
  getServiceById,
  createBooking,
  getMyBookings,
  cancelBooking,
  getUserStats,
  createReview,
  getServiceReviews,
};
