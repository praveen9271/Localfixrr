import Service, { normalizeServiceText } from '../models/Service.js';
import Booking from '../models/Booking.js';
import Review from '../models/Review.js';
import Provider from '../models/Provider.js';
import { buildPagination, getPagination } from '../utils/pagination.js';
import { normalizeServiceCategory } from '../config/serviceCategories.js';

const ensureProviderProfile = async (user) => {
  try {
    let provider = await Provider.findOne({ user: user._id });
    if (!provider) {
      provider = await Provider.create({
        user: user._id,
        businessName: `${user.name}'s Services`,
        serviceAreas: [user.address].filter(Boolean),
      });
      user.providerProfile = provider._id;
      await user.save();
    }
    return provider;
  } catch (error) {
    console.error('Error ensuring provider profile:', error);
    throw new Error('Failed to create or find provider profile');
  }
};

const populateProviderBooking = [
  { path: 'service', select: 'title category price location' },
  { path: 'customer', select: 'name email phone address' },
];

const getDuplicateServiceQuery = ({ providerId, title, category, excludeId = null }) => {
  const query = {
    provider: providerId,
    normalizedTitle: normalizeServiceText(title),
    category,
  };

  if (excludeId) query._id = { $ne: excludeId };
  return query;
};

// @desc    Create a new service
// @route   POST /api/provider/services
// @access  Service Provider
const createService = async (req, res) => {
  try {
    const { title, description, category, price, location, image } = req.body;

    // Enhanced validation
    if (!title || title.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Service title must be at least 3 characters' });
    }
    if (!description || description.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'Service description must be at least 10 characters' });
    }
    if (!category || category.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Service category is required' });
    }
    const normalizedCategory = normalizeServiceCategory(category);
    if (!normalizedCategory) {
      return res.status(400).json({ success: false, message: 'Please select a valid LocalFixr service category' });
    }
    if (price === undefined || price === null || isNaN(price) || price < 0) {
      return res.status(400).json({ success: false, message: 'Valid price is required' });
    }

    const provider = req.provider || await ensureProviderProfile(req.user);
    const duplicateService = await Service.exists(getDuplicateServiceQuery({
      providerId: provider._id,
      title,
      category: normalizedCategory,
    }));

    if (duplicateService) {
      return res.status(409).json({
        success: false,
        message: 'You already have this service listed in the same category',
      });
    }

    const service = await Service.create({
      title: title.trim(),
      description: description.trim(),
      category: normalizedCategory,
      price: Number(price),
      provider: provider._id,
      location: location?.trim() || req.user.address?.trim() || '',
      image: image?.trim() || ''
    });

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      service
    });
  } catch (error) {
    console.error('Create service error:', error);
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'You already have this service listed in the same category' });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get provider's services
// @route   GET /api/provider/services
// @access  Service Provider
const getMyServices = async (req, res) => {
  try {
    const provider = req.provider || await ensureProviderProfile(req.user);
    const { page, limit, skip } = getPagination(req.query);
    
    // Get total count first
    const total = await Service.countDocuments({ provider: provider._id });
    
    // Get services with proper sorting and pagination
    const services = await Service.find({ provider: provider._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('provider', 'businessName');
    
    res.status(200).json({
      success: true,
      count: services.length,
      pagination: buildPagination(page, limit, total),
      services
    });
  } catch (error) {
    console.error('Get my services error:', error);
    if (error.message.includes('Failed to create or find provider profile')) {
      return res.status(400).json({ success: false, message: 'Provider profile not found. Please complete your registration.' });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Update a service
// @route   PUT /api/provider/services/:id
// @access  Service Provider
const updateService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    // Check if provider owns this service
    const provider = req.provider || await ensureProviderProfile(req.user);
    if (service.provider.toString() !== provider._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this service' });
    }

    const { title, description, category, price, location, image, status } = req.body;
    const nextTitle = title !== undefined ? title : service.title;
    let nextCategory = service.category;

    if (title !== undefined) service.title = title;
    if (description !== undefined) service.description = description;
    if (category !== undefined) {
      const normalizedCategory = normalizeServiceCategory(category);
      if (!normalizedCategory) {
        return res.status(400).json({ success: false, message: 'Please select a valid LocalFixr service category' });
      }
      nextCategory = normalizedCategory;
      service.category = normalizedCategory;
    }

    const duplicateService = await Service.exists(getDuplicateServiceQuery({
      providerId: provider._id,
      title: nextTitle,
      category: nextCategory,
      excludeId: service._id,
    }));

    if (duplicateService) {
      return res.status(409).json({
        success: false,
        message: 'You already have this service listed in the same category',
      });
    }

    if (price !== undefined) service.price = price;
    if (location !== undefined) service.location = location;
    if (image !== undefined) service.image = image;
    if (status) service.status = status;

    await service.save();

    res.status(200).json({
      success: true,
      message: 'Service updated successfully',
      service
    });
  } catch (error) {
    console.error('Update service error:', error);
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'You already have this service listed in the same category' });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Delete a service
// @route   DELETE /api/provider/services/:id
// @access  Service Provider
const deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    const provider = req.provider || await ensureProviderProfile(req.user);
    if (service.provider.toString() !== provider._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this service' });
    }

    const activeBookings = await Booking.countDocuments({
      service: service._id,
      status: { $in: ['pending', 'accepted', 'in_progress'] },
    });
    if (activeBookings > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a service with active booking requests. Mark it inactive instead.',
      });
    }

    await service.deleteOne();
    res.status(200).json({ success: true, message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get provider's bookings
// @route   GET /api/provider/bookings
// @access  Service Provider
const getMyBookings = async (req, res) => {
  try {
    const provider = req.provider || await ensureProviderProfile(req.user);
    const { page, limit, skip } = getPagination(req.query);
    const total = await Booking.countDocuments({ provider: provider._id });
    const bookings = await Booking.find({ provider: provider._id })
      .populate(populateProviderBooking)
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

// @desc    Update booking status
// @route   PUT /api/provider/bookings/:id
// @access  Service Provider
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['accepted', 'rejected', 'in_progress', 'completed', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid booking status' });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const provider = req.provider || await ensureProviderProfile(req.user);
    if (booking.provider.toString() !== provider._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (['completed', 'cancelled', 'rejected'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: `Cannot update a ${booking.status} booking` });
    }

    booking.status = status;
    await booking.save();

    res.status(200).json({
      success: true,
      message: `Booking ${status} successfully`,
      booking: await booking.populate(populateProviderBooking)
    });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get provider dashboard stats
// @route   GET /api/provider/stats
// @access  Service Provider
const getProviderStats = async (req, res) => {
  try {
    const provider = req.provider || await ensureProviderProfile(req.user);
    
    // Use Promise.all for better performance
    const [
      totalServices,
      activeServices,
      totalBookings,
      pendingBookings,
      completedBookings,
      reviewsCount,
      totalEarnings
    ] = await Promise.all([
      Service.countDocuments({ provider: provider._id }),
      Service.countDocuments({ provider: provider._id, status: 'active' }),
      Booking.countDocuments({ provider: provider._id }),
      Booking.countDocuments({ provider: provider._id, status: 'pending' }),
      Booking.countDocuments({ provider: provider._id, status: 'completed' }),
      Review.countDocuments({ provider: provider._id }),
      Booking.aggregate([
        { $match: { provider: provider._id, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ])
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalServices: totalServices || 0,
        activeServices: activeServices || 0,
        totalBookings: totalBookings || 0,
        pendingBookings: pendingBookings || 0,
        completedBookings: completedBookings || 0,
        reviewsCount: reviewsCount || 0,
        rating: provider?.rating || 0,
        totalEarnings: (totalEarnings && totalEarnings[0]) ? totalEarnings[0].total : 0
      }
    });
  } catch (error) {
    console.error('Get provider stats error:', error);
    if (error.message.includes('Failed to create or find provider profile')) {
      return res.status(400).json({ success: false, message: 'Provider profile not found. Please complete your registration.' });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const getProviderProfile = async (req, res) => {
  try {
    const provider = req.provider || await ensureProviderProfile(req.user);
    await provider.populate('user', 'name email phone address');
    res.status(200).json({ success: true, provider });
  } catch (error) {
    console.error('Get provider profile error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const updateProviderProfile = async (req, res) => {
  try {
    const provider = req.provider || await ensureProviderProfile(req.user);
    const { businessName, bio, skills, serviceAreas, experienceYears, available } = req.body;

    if (businessName !== undefined) provider.businessName = businessName;
    if (bio !== undefined) provider.bio = bio;
    if (Array.isArray(skills)) {
      provider.skills = skills.map(normalizeServiceCategory).filter(Boolean);
    }
    if (Array.isArray(serviceAreas)) provider.serviceAreas = serviceAreas;
    if (experienceYears !== undefined) provider.experienceYears = Number(experienceYears) || 0;
    if (available !== undefined) provider.available = Boolean(available);

    await provider.save();
    res.status(200).json({ success: true, message: 'Profile updated successfully', provider });
  } catch (error) {
    console.error('Update provider profile error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get provider reviews
// @route   GET /api/provider/reviews
// @access  Provider
const getProviderReviews = async (req, res) => {
  try {
    const provider = await Provider.findOne({ user: req.user.id });
    if (!provider) {
      return res.status(404).json({ success: false, message: 'Provider profile not found' });
    }
    const reviews = await Review.find({ provider: provider._id })
      .populate('user', 'name email')
      .populate('service', 'title')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: reviews.length, reviews });
  } catch (error) {
    console.error('Get provider reviews error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export {
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
};
