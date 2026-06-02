import User from '../models/User.js';
import Service from '../models/Service.js';
import Booking from '../models/Booking.js';
import Provider from '../models/Provider.js';
import Review from '../models/Review.js';
import Category from '../models/Category.js';
import Notification from '../models/Notification.js';
import PendingRegistration from '../models/PendingRegistration.js';
import Report from '../models/Report.js';
import AdminLog from '../models/AdminLog.js';
import { buildPagination, getPagination } from '../utils/pagination.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const BOOKING_STATUSES = ['pending', 'confirmed', 'accepted', 'in_progress', 'completed', 'cancelled', 'rejected'];

const asyncHandler = (handler) => async (req, res) => {
  try {
    await handler(req, res);
  } catch (error) {
    console.error('Admin error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const logAdminAction = async (req, action, targetCollection, targetId = null, metadata = {}) => {
  if (!req.user?._id) return;
  await AdminLog.create({
    adminId: req.user._id,
    action,
    targetCollection,
    targetId,
    metadata,
  });
};

const getPendingRegistrationQuery = (user) => ({
  $or: [
    user?.email ? { email: user.email } : null,
    user?.phone ? { phone: user.phone } : null,
  ].filter(Boolean),
});

const cleanupUserData = async (user, providerOverride = null) => {
  const provider = providerOverride || (user?.role === 'service_provider' ? await Provider.findOne({ user: user._id }) : null);
  const pendingRegistrationQuery = getPendingRegistrationQuery(user);
  const cleanupTasks = [
    Notification.deleteMany({ recipient: user._id }),
    PendingRegistration.deleteMany(pendingRegistrationQuery.$or.length ? pendingRegistrationQuery : { _id: null }),
  ];

  if (provider) {
    cleanupTasks.push(
      Service.deleteMany({ provider: provider._id }),
      Booking.deleteMany({
        $or: [
          { customer: user._id },
          { provider: provider._id },
        ],
      }),
      Review.deleteMany({
        $or: [
          { user: user._id },
          { provider: provider._id },
        ],
      }),
      Provider.deleteOne({ _id: provider._id }),
    );
  } else {
    cleanupTasks.push(
      Booking.deleteMany({ customer: user._id }),
      Review.deleteMany({ user: user._id }),
    );
  }

  await Promise.all(cleanupTasks);
};

const cleanupOrphanProviderData = async (provider) => {
  await Promise.all([
    Service.deleteMany({ provider: provider._id }),
    Booking.deleteMany({ provider: provider._id }),
    Review.deleteMany({ provider: provider._id }),
    Provider.deleteOne({ _id: provider._id }),
  ]);
};

const recalculateProviderRatings = async (providerId) => {
  if (!providerId) return;

  const [providerRating] = await Review.aggregate([
    { $match: { provider: providerId } },
    { $group: { _id: '$provider', rating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  await Provider.findByIdAndUpdate(providerId, {
    rating: Number((providerRating?.rating || 0).toFixed(1)),
    reviewsCount: providerRating?.count || 0,
  });
};

const applySearch = (query, fields, search) => {
  if (!search) return query;
  const regex = new RegExp(String(search).trim(), 'i');
  return { ...query, $or: fields.map((field) => ({ [field]: regex })) };
};

const monthWindow = () => {
  const now = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const next = new Date(date.getFullYear(), date.getMonth() + 1, 1);
    return { label: MONTHS[date.getMonth()], start: date, next };
  });
};

const ensureProviderProfiles = async () => {
  const providerUsers = await User.find({ role: 'service_provider' }).select('-password');
  await Promise.all(providerUsers.map(async (user) => {
    const existing = await Provider.findOne({ user: user._id });
    if (existing) return;
    const provider = await Provider.create({
      user: user._id,
      businessName: `${user.name}'s Services`,
      serviceAreas: [user.address].filter(Boolean),
    });
    user.providerProfile = provider._id;
    await user.save();
  }));
};

const getAllUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { role, status, search } = req.query;
  let query = {};
  if (role && role !== 'all') query.role = role;
  if (status === 'active') query = { ...query, isActive: true, isBlocked: false };
  if (status === 'blocked') query.isBlocked = true;
  if (status === 'inactive') query.isActive = false;
  query = applySearch(query, ['name', 'email', 'phone', 'role'], search);

  const total = await User.countDocuments(query);
  const users = await User.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit);
  res.status(200).json({ success: true, count: users.length, pagination: buildPagination(page, limit, total), users });
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.status(200).json({ success: true, user });
});

const updateUser = asyncHandler(async (req, res) => {
  const allowedFields = ['name', 'email', 'phone', 'address', 'avatar', 'isActive', 'isBlocked', 'location'];
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  if (req.body.role !== undefined && req.body.role !== user.role) {
    return res.status(400).json({ success: false, message: 'User roles cannot be changed from the admin dashboard.' });
  }

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) user[field] = req.body[field];
  });
  await user.save();
  await logAdminAction(req, 'updated user', 'users', user._id, { email: user.email });

  res.status(200).json({ success: true, message: 'User updated successfully', user });
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  if (user.role === 'admin') return res.status(400).json({ success: false, message: 'Admin users cannot be deleted here.' });

  await cleanupUserData(user);
  await logAdminAction(req, 'deleted user', 'users', user._id, { email: user.email });
  await user.deleteOne();
  res.status(200).json({ success: true, message: 'User and related data deleted successfully' });
});

const deleteProvider = asyncHandler(async (req, res) => {
  const provider = await Provider.findById(req.params.id);
  if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });

  const user = provider.user ? await User.findById(provider.user) : null;
  if (user?.role === 'admin') {
    return res.status(400).json({ success: false, message: 'Admin users cannot be deleted here.' });
  }

  if (user) {
    await cleanupUserData(user, provider);
    await logAdminAction(req, 'deleted provider', 'providers', provider._id, { email: user.email, userId: user._id });
    await user.deleteOne();
  } else {
    await cleanupOrphanProviderData(provider);
    await logAdminAction(req, 'deleted orphan provider', 'providers', provider._id);
  }

  res.status(200).json({ success: true, message: 'Provider account and related data deleted successfully' });
});

const getAllProviders = asyncHandler(async (req, res) => {
  await ensureProviderProfiles();
  const { page, limit, skip } = getPagination(req.query);
  const { status, search } = req.query;
  let query = {};
  if (status && status !== 'all') {
    if (status === 'verified') query.isVerified = true;
    else if (status === 'pending') query.verificationStatus = 'pending';
    else if (status === 'suspended') query.verificationStatus = 'suspended';
  }
  query = applySearch(query, ['businessName', 'bio', 'skills', 'serviceAreas'], search);

  const total = await Provider.countDocuments(query);
  const providers = await Provider.find(query)
    .populate('user', 'name email phone address role avatar isActive isBlocked createdAt')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  res.status(200).json({ success: true, count: providers.length, pagination: buildPagination(page, limit, total), providers });
});

const updateProviderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const provider = await Provider.findById(req.params.id).populate('user', 'name email isBlocked');
  if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });
  if (!['pending', 'verified', 'rejected', 'suspended'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid provider status' });
  }

  provider.verificationStatus = status;
  provider.isVerified = status === 'verified';
  if (status === 'suspended' && provider.user) {
    provider.user.isBlocked = true;
    await provider.user.save();
  }
  if (status === 'verified' && provider.user) {
    provider.user.isBlocked = false;
    await provider.user.save();
  }
  await provider.save();
  await logAdminAction(req, `${status} provider`, 'providers', provider._id, { businessName: provider.businessName });

  res.status(200).json({ success: true, message: 'Provider status updated', provider });
});

const getAllServices = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { category, status, search } = req.query;
  let query = {};
  if (category && category !== 'all') query.category = category;
  if (status && status !== 'all') query.status = status;
  query = applySearch(query, ['title', 'description', 'category', 'location'], search);

  const total = await Service.countDocuments(query);
  const services = await Service.find(query)
    .populate({
      path: 'provider',
      select: 'businessName user rating reviewsCount verificationStatus',
      populate: { path: 'user', select: 'name email phone' },
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  res.status(200).json({ success: true, count: services.length, pagination: buildPagination(page, limit, total), services });
});

const deleteService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) return res.status(404).json({ success: false, message: 'Service not found' });

  const [deletedBookings, deletedReviews] = await Promise.all([
    Booking.deleteMany({ service: service._id }),
    Review.deleteMany({ service: service._id }),
  ]);

  await recalculateProviderRatings(service.provider);
  await logAdminAction(req, 'deleted service', 'services', service._id, {
    title: service.title,
    deletedBookings: deletedBookings.deletedCount || 0,
    deletedReviews: deletedReviews.deletedCount || 0,
  });
  await service.deleteOne();
  res.status(200).json({
    success: true,
    message: 'Service and related records deleted successfully',
    deleted: {
      bookings: deletedBookings.deletedCount || 0,
      reviews: deletedReviews.deletedCount || 0,
      services: 1,
    },
  });
});

const getAllBookings = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { status, paymentStatus, search } = req.query;
  let query = {};
  if (status && status !== 'all') query.status = status;
  if (paymentStatus && paymentStatus !== 'all') query.paymentStatus = paymentStatus;

  const total = await Booking.countDocuments(query);
  let bookings = await Booking.find(query)
    .populate('service', 'title category price')
    .populate('customer', 'name email phone')
    .populate({
      path: 'provider',
      select: 'businessName user',
      populate: { path: 'user', select: 'name email phone' },
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  if (search) {
    const regex = new RegExp(String(search).trim(), 'i');
    bookings = bookings.filter((booking) =>
      regex.test(booking.customer?.name || '') ||
      regex.test(booking.customer?.email || '') ||
      regex.test(booking.service?.title || '') ||
      regex.test(booking.provider?.businessName || '') ||
      regex.test(booking.status || ''),
    );
  }

  res.status(200).json({ success: true, count: bookings.length, pagination: buildPagination(page, limit, total), bookings });
});

const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status, paymentStatus } = req.body;
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
  if (status !== undefined) {
    if (!BOOKING_STATUSES.includes(status)) return res.status(400).json({ success: false, message: 'Invalid booking status' });
    booking.status = status;
  }
  if (paymentStatus !== undefined) {
    if (!['pending', 'paid', 'refunded'].includes(paymentStatus)) return res.status(400).json({ success: false, message: 'Invalid payment status' });
    booking.paymentStatus = paymentStatus;
  }
  await booking.save();
  await logAdminAction(req, 'updated booking', 'bookings', booking._id, { status: booking.status, paymentStatus: booking.paymentStatus });
  res.status(200).json({ success: true, message: 'Booking updated', booking });
});

const getAllReviews = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const total = await Review.countDocuments();
  const reviews = await Review.find()
    .populate('user', 'name email')
    .populate('service', 'title category')
    .populate({
      path: 'provider',
      select: 'businessName user',
      populate: { path: 'user', select: 'name email' },
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({ success: true, count: reviews.length, pagination: buildPagination(page, limit, total), reviews });
});

const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
  await logAdminAction(req, 'deleted review', 'reviews', review._id, { rating: review.rating });
  await review.deleteOne();
  res.status(200).json({ success: true, message: 'Review deleted successfully' });
});

const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ createdAt: -1 });
  res.status(200).json({ success: true, categories });
});

const createCategory = asyncHandler(async (req, res) => {
  const { name, icon, description, isActive } = req.body;
  if (!name?.trim()) return res.status(400).json({ success: false, message: 'Category name is required' });
  const category = await Category.create({ name: name.trim(), icon, description, isActive });
  await logAdminAction(req, 'created category', 'categories', category._id, { name: category.name });
  res.status(201).json({ success: true, message: 'Category created', category });
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
  await logAdminAction(req, 'updated category', 'categories', category._id, { name: category.name });
  res.status(200).json({ success: true, message: 'Category updated', category });
});

const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
  const serviceCount = await Service.countDocuments({ category: category.name });
  if (serviceCount > 0) return res.status(400).json({ success: false, message: 'Cannot delete category with services.' });
  await logAdminAction(req, 'deleted category', 'categories', category._id, { name: category.name });
  await category.deleteOne();
  res.status(200).json({ success: true, message: 'Category deleted' });
});

const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find()
    .populate('recipient', 'name email role')
    .sort({ createdAt: -1 })
    .limit(100);
  res.status(200).json({ success: true, notifications });
});

const createNotification = asyncHandler(async (req, res) => {
  const { title, message, type, recipient } = req.body;
  if (!title?.trim() || !message?.trim()) return res.status(400).json({ success: false, message: 'Title and message are required' });
  const notification = await Notification.create({ title, message, type, recipient: recipient || null });
  await logAdminAction(req, 'created notification', 'notifications', notification._id, { title });
  res.status(201).json({ success: true, message: 'Notification created', notification });
});

const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
  if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
  res.status(200).json({ success: true, message: 'Notification marked read', notification });
});

const getReports = asyncHandler(async (req, res) => {
  const reports = await Report.find().populate('generatedBy', 'name email').sort({ createdAt: -1 }).limit(50);
  res.status(200).json({ success: true, reports });
});

const generateReport = asyncHandler(async (req, res) => {
  const reportType = req.body.reportType || 'operations';
  const [
    totalUsers,
    totalProviders,
    totalBookings,
    completedBookings,
    revenue,
    topCategories,
  ] = await Promise.all([
    User.countDocuments(),
    Provider.countDocuments(),
    Booking.countDocuments(),
    Booking.countDocuments({ status: 'completed' }),
    Booking.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
    Service.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 5 }]),
  ]);
  const report = await Report.create({
    reportType,
    generatedBy: req.user._id,
    reportData: {
      totalUsers,
      totalProviders,
      totalBookings,
      completedBookings,
      revenue: revenue[0]?.total || 0,
      topCategories,
    },
  });
  await logAdminAction(req, 'generated report', 'reports', report._id, { reportType });
  res.status(201).json({ success: true, message: 'Report generated', report });
});

const getAdminLogs = asyncHandler(async (req, res) => {
  const logs = await AdminLog.find().populate('adminId', 'name email').sort({ createdAt: -1 }).limit(80);
  res.status(200).json({ success: true, logs });
});

const getDashboardStats = asyncHandler(async (req, res) => {
  const windows = monthWindow();
  const [
    totalUsers,
    totalProviders,
    totalServices,
    totalBookings,
    activeBookings,
    completedBookings,
    cancelledBookings,
    pendingProviderRequests,
    totalReviews,
    blockedUsers,
    revenue,
    categoryCounts,
    recentBookings,
    topProviders,
    logs,
  ] = await Promise.all([
    User.countDocuments(),
    Provider.countDocuments(),
    Service.countDocuments(),
    Booking.countDocuments(),
    Booking.countDocuments({ status: { $in: ['pending', 'accepted', 'confirmed', 'in_progress'] } }),
    Booking.countDocuments({ status: 'completed' }),
    Booking.countDocuments({ status: 'cancelled' }),
    Provider.countDocuments({ verificationStatus: 'pending' }),
    Review.countDocuments(),
    User.countDocuments({ isBlocked: true }),
    Booking.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
    Service.aggregate([{ $group: { _id: '$category', bookings: { $sum: 1 } } }, { $sort: { bookings: -1 } }, { $limit: 8 }]),
    Booking.find()
      .populate('service', 'title category')
      .populate('customer', 'name email')
      .populate({ path: 'provider', select: 'businessName user', populate: { path: 'user', select: 'name' } })
      .sort({ createdAt: -1 })
      .limit(6),
    Provider.find()
      .populate('user', 'name email')
      .sort({ rating: -1, reviewsCount: -1 })
      .limit(5),
    AdminLog.find().populate('adminId', 'name').sort({ createdAt: -1 }).limit(6),
  ]);

  const bookingChart = await Promise.all(windows.map(async (window) => ({
    month: window.label,
    bookings: await Booking.countDocuments({ createdAt: { $gte: window.start, $lt: window.next } }),
  })));

  const revenueChart = await Promise.all(windows.map(async (window) => {
    const result = await Booking.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: window.start, $lt: window.next } } },
      { $group: { _id: null, revenue: { $sum: '$totalAmount' } } },
    ]);
    return { month: window.label, revenue: result[0]?.revenue || 0 };
  }));

  const userGrowth = await Promise.all(windows.map(async (window) => ({
    month: window.label,
    users: await User.countDocuments({ role: 'user', createdAt: { $gte: window.start, $lt: window.next } }),
    providers: await User.countDocuments({ role: 'service_provider', createdAt: { $gte: window.start, $lt: window.next } }),
  })));

  res.status(200).json({
    success: true,
    stats: {
      totalUsers,
      totalProviders,
      totalServices,
      totalBookings,
      activeBookings,
      completedBookings,
      cancelledBookings,
      pendingBookings: activeBookings,
      pendingProviderRequests,
      totalReviews,
      blockedUsers,
      totalRevenue: revenue[0]?.total || 0,
      revenue: revenue[0]?.total || 0,
    },
    analytics: {
      bookingChart,
      revenueChart,
      userGrowth,
      categoryBookings: categoryCounts.map((item) => ({ category: item._id || 'Uncategorized', bookings: item.bookings })),
    },
    recentActivities: logs.map((log) => ({
      id: log._id,
      action: log.action,
      actor: log.adminId?.name || 'Admin',
      targetCollection: log.targetCollection,
      createdAt: log.createdAt,
    })),
    latestBookings: recentBookings,
    topProviders,
  });
});

const exportUsersCsv = asyncHandler(async (_req, res) => {
  const users = await User.find().select('name email phone role isActive isBlocked createdAt').sort({ createdAt: -1 });
  const rows = [
    ['Name', 'Email', 'Phone', 'Role', 'Active', 'Blocked', 'Created At'],
    ...users.map((user) => [
      user.name,
      user.email,
      user.phone,
      user.role,
      user.isActive,
      user.isBlocked,
      user.createdAt.toISOString(),
    ]),
  ];
  const csv = rows.map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="localfixr-users.csv"');
  res.status(200).send(csv);
});

export {
  getAllUsers,
  getAllProviders,
  getUserById,
  updateUser,
  deleteUser,
  deleteProvider,
  getAllServices,
  deleteService,
  getAllBookings,
  updateBookingStatus,
  getDashboardStats,
  getAllReviews,
  deleteReview,
  updateProviderStatus,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getNotifications,
  createNotification,
  markNotificationRead,
  getReports,
  generateReport,
  getAdminLogs,
  exportUsersCsv,
};
