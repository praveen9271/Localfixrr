import Service from '../models/Service.js';
import Booking from '../models/Booking.js';
import Review from '../models/Review.js';
import Provider from '../models/Provider.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import { buildPagination, getPagination } from '../utils/pagination.js';

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
    const { category, minPrice, maxPrice } = req.query;
    const search = String(req.query.search || '').trim();
    const { page, limit, skip } = getPagination(req.query);
    let query = {
      status: 'active',
      category: { $nin: excludedPublicCategories },
    };

    if (!isDbConnected()) {
      return res.status(503).json({ success: false, message: 'Service database is temporarily unavailable' });
    }

    if (category) {
      const categoryValues = getCategoryValues(category);
      if (categoryValues.some((value) => excludedPublicCategories.includes(value))) {
        return res.status(200).json({
          success: true,
          data: [],
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

    const [total, services] = await Promise.all([
      Service.countDocuments(query),
      Service.find(query)
        .select('title description category price provider status location image rating reviewsCount createdAt')
        .populate(populateServiceProvider)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    if (total === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        count: 0,
        pagination: buildPagination(page, limit, 0),
        services: [],
      });
    }

    res.status(200).json({
      success: true,
      data: services,
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
    if (!isDbConnected()) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    const service = await Service.findById(req.params.id)
      .select('title description category price provider status location image images duration rating reviewsCount createdAt')
      .populate(populateServiceProvider)
      .lean();

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
    const cleanAddress = String(address || req.user?.address || '').trim();
    const cleanNotes = String(notes || '').trim();

    if (!serviceId || !date) {
      return res.status(400).json({ success: false, message: 'Please provide service and date' });
    }
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      return res.status(400).json({ success: false, message: 'Invalid service id' });
    }
    if (!cleanAddress || cleanAddress.length < 5) {
      return res.status(400).json({ success: false, message: 'A complete service address is required' });
    }
    if (cleanNotes.length > 500) {
      return res.status(400).json({ success: false, message: 'Notes must be 500 characters or less' });
    }

    const customerExists = await User.exists({
      _id: req.user.id,
      role: 'user',
      isActive: true,
      isBlocked: false,
    });
    if (!customerExists) {
      return res.status(401).json({ success: false, message: 'Customer account is no longer available' });
    }

    const bookingDate = new Date(date);
    if (isNaN(bookingDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid date format' });
    }
    if (bookingDate < new Date()) {
      return res.status(400).json({ success: false, message: 'Booking date cannot be in the past' });
    }

    const service = await Service.findById(serviceId).populate('provider', 'available user');
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    if (service.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Service is not available for booking' });
    }
    if (!service.provider) {
      return res.status(404).json({ success: false, message: 'Service provider not found' });
    }
    if (service.provider.available === false) {
      return res.status(409).json({ success: false, message: 'Provider is not available for new bookings' });
    }

    const booking = await Booking.create({
      service: serviceId,
      customer: req.user.id,
      provider: service.provider._id,
      date: new Date(date),
      address: cleanAddress,
      notes: cleanNotes,
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
      data: bookings,
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
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid booking id' });
    }

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
    if (!isDbConnected()) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    const { page, limit, skip } = getPagination(req.query);
    const query = { service: req.params.id };
    const [total, reviews] = await Promise.all([
      Review.countDocuments(query),
      Review.find(query)
        .select('user provider booking service rating comment createdAt')
        .populate('user', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    res.status(200).json({
      success: true,
      count: reviews.length,
      pagination: buildPagination(page, limit, total),
      reviews,
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export {
  getAllServices,
  getServiceById,
  createBooking,
  getMyBookings,
  cancelBooking,
  getUserStats,
  createReview,
  getServiceReviews,
};
