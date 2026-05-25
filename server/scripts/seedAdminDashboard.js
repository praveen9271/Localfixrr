require('dotenv').config({ quiet: true });

const connectDB = require('../config/db');
const User = require('../models/User');
const Provider = require('../models/Provider');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Category = require('../models/Category');
const Notification = require('../models/Notification');
const Report = require('../models/Report');
const AdminLog = require('../models/AdminLog');

const categories = [
  { name: 'Plumbing', icon: 'Droplet', description: 'Pipe repairs, leak fixes, and installation work.' },
  { name: 'Electrical', icon: 'Bolt', description: 'Wiring, switches, lighting, and appliance power support.' },
  { name: 'Cleaning', icon: 'Sparkles', description: 'Home, kitchen, bathroom, and move-in cleaning.' },
  { name: 'Carpentry', icon: 'Hammer', description: 'Furniture repair, shelves, doors, and custom woodwork.' },
  { name: 'Appliance Repair', icon: 'Wrench', description: 'AC, washing machine, refrigerator, and kitchen appliance repairs.' },
  { name: 'Painting', icon: 'Brush', description: 'Interior, exterior, touch-up, and finishing services.' },
];

const users = [
  { name: 'Admin User', email: 'admin@localfixr.test', phone: '9000000001', address: 'LocalFixr HQ', role: 'admin' },
  { name: 'Ravi Kumar', email: 'john.doe@localfixr.test', phone: '9000000002', address: 'MG Road, Bengaluru', role: 'user' },
  { name: 'Alice Smith', email: 'alice.smith@localfixr.test', phone: '9000000003', address: 'Indiranagar, Bengaluru', role: 'user' },
  { name: 'SmartFix Solutions', email: 'smartfix@localfixr.test', phone: '9000000004', address: 'Whitefield, Bengaluru', role: 'service_provider' },
  { name: 'Best Electricals', email: 'best.electricals@localfixr.test', phone: '9000000005', address: 'HSR Layout, Bengaluru', role: 'service_provider' },
  { name: 'Clean And Shine', email: 'clean.shine@localfixr.test', phone: '9000000006', address: 'Koramangala, Bengaluru', role: 'service_provider' },
];

const password = 'Admin123';

const upsertUser = async (data) => {
  let user = await User.findOne({ email: data.email });
  if (!user) {
    user = await User.create({ ...data, password, isEmailVerified: true });
    return user;
  }
  Object.assign(user, data, { isEmailVerified: true });
  await user.save();
  return user;
};

const run = async () => {
  await connectDB();

  await Category.bulkWrite(categories.map((category) => ({
    updateOne: {
      filter: { name: category.name },
      update: { $set: { ...category, isActive: true } },
      upsert: true,
    },
  })));

  const savedUsers = {};
  for (const userData of users) {
    savedUsers[userData.email] = await upsertUser(userData);
  }

  const admin = savedUsers['admin@localfixr.test'];
  const providerUsers = [
    savedUsers['smartfix@localfixr.test'],
    savedUsers['best.electricals@localfixr.test'],
    savedUsers['clean.shine@localfixr.test'],
  ];

  const providers = [];
  for (const user of providerUsers) {
    const provider = await Provider.findOneAndUpdate(
      { user: user._id },
      {
        user: user._id,
        businessName: user.name,
        bio: `${user.name} is a verified LocalFixr partner.`,
        skills: user.name.includes('Electrical') ? ['Electrical'] : user.name.includes('Clean') ? ['Cleaning'] : ['Plumbing', 'Appliance Repair'],
        serviceAreas: [user.address],
        experienceYears: 5,
        available: true,
        isVerified: true,
        verificationStatus: 'verified',
        rating: user.name.includes('Clean') ? 4.4 : 4.7,
        reviewsCount: 12,
        earnings: user.name.includes('Clean') ? 18500 : 32500,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    user.providerProfile = provider._id;
    await user.save();
    providers.push(provider);
  }

  const serviceSeeds = [
    { title: 'Leak Repair', category: 'Plumbing', price: 699, provider: providers[0]._id },
    { title: 'Switchboard Repair', category: 'Electrical', price: 499, provider: providers[1]._id },
    { title: 'Deep Home Cleaning', category: 'Cleaning', price: 1899, provider: providers[2]._id },
    { title: 'AC Service', category: 'Appliance Repair', price: 999, provider: providers[0]._id },
  ];

  const services = [];
  for (const seed of serviceSeeds) {
    const service = await Service.findOneAndUpdate(
      { title: seed.title, provider: seed.provider },
      {
        ...seed,
        description: `${seed.title} by a verified LocalFixr provider.`,
        status: 'active',
        location: 'Bengaluru',
        duration: 60,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    services.push(service);
  }

  const customers = [savedUsers['john.doe@localfixr.test'], savedUsers['alice.smith@localfixr.test']];
  const bookingStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
  for (let index = 0; index < services.length; index += 1) {
    const service = services[index];
    await Booking.findOneAndUpdate(
      { service: service._id, customer: customers[index % customers.length]._id },
      {
        service: service._id,
        customer: customers[index % customers.length]._id,
        provider: service.provider,
        status: bookingStatuses[index % bookingStatuses.length],
        date: new Date(Date.now() + index * 86400000),
        timeSlot: '10:00 AM - 12:00 PM',
        address: customers[index % customers.length].address,
        totalAmount: service.price,
        paymentStatus: index % 2 === 0 ? 'paid' : 'pending',
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
  }

  const completedBooking = await Booking.findOne({ status: 'completed' });
  if (completedBooking) {
    await Review.findOneAndUpdate(
      { booking: completedBooking._id, user: completedBooking.customer },
      {
        user: completedBooking.customer,
        provider: completedBooking.provider,
        booking: completedBooking._id,
        service: completedBooking.service,
        rating: 5,
        comment: 'Fast service and professional support.',
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
  }

  await Notification.create({
    title: 'Admin seed completed',
    message: 'Dashboard demo data is ready.',
    type: 'success',
    recipient: admin._id,
  });

  await Report.create({
    reportType: 'seed-summary',
    generatedBy: admin._id,
    reportData: { users: users.length, categories: categories.length, services: services.length },
  });

  await AdminLog.create({
    adminId: admin._id,
    action: 'seeded admin dashboard data',
    targetCollection: 'system',
  });

  console.log('Admin dashboard seed completed.');
  console.log('Admin login: admin@localfixr.test / Admin123');
  process.exit(0);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
