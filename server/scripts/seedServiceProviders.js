const dotenv = require('dotenv');
const mongoose = require('mongoose');
const User = require('../models/User');
const Provider = require('../models/Provider');
const Service = require('../models/Service');

dotenv.config({ quiet: true });

const defaultPassword = 'provider123';
const defaultAddress = 'Phagwara, Punjab, India';

const providers = [
  {
    name: 'Happy',
    email: 'happy.carpenter@localfixr.test',
    phone: '9592214539',
    businessName: 'Happy Carpenter',
    category: 'Carpenter',
    title: 'Carpentry Services',
    price: 499,
    skills: ['Carpentry', 'Furniture repair', 'Woodwork'],
    description: 'Reliable carpentry work for furniture repair, fittings, and local home woodwork.',
  },
  {
    name: 'Local Electrician',
    email: 'local.electrician@localfixr.test',
    phone: '9878233595',
    businessName: 'Electrician Services',
    category: 'Electrician',
    title: 'Electrical Repair Services',
    price: 399,
    skills: ['Electrical repair', 'Wiring', 'Switchboard repair'],
    description: 'Local electrician for wiring, switchboard, lighting, and general electrical repair work.',
  },
  {
    name: 'Ravi',
    email: 'ravi.plumber@localfixr.test',
    phone: '8146716238',
    businessName: 'Ravi Plumber',
    category: 'Plumber',
    title: 'Plumbing Services',
    price: 399,
    skills: ['Plumbing', 'Leak repair', 'Tap fitting'],
    description: 'Plumbing support for leaks, taps, fittings, drainage, and general repair jobs.',
  },
  {
    name: 'Sajan',
    email: 'sajan.plumber@localfixr.test',
    phone: '7340847850',
    businessName: 'Sajan Plumber',
    category: 'Plumber',
    title: 'Home Plumbing Services',
    price: 399,
    skills: ['Plumbing', 'Pipe repair', 'Bathroom fitting'],
    description: 'Home plumbing service for pipe repair, fittings, water issues, and maintenance.',
  },
  {
    name: 'Jeet Lal',
    email: 'jeet.lal.painter@localfixr.test',
    phone: '9815623585',
    businessName: 'Jeet Lal Painter',
    category: 'Painter',
    title: 'Painting Services',
    price: 599,
    skills: ['Painting', 'Wall painting', 'Touch-up work'],
    description: 'Painter for wall painting, touch-ups, finishing work, and local home painting jobs.',
  },
  {
    name: 'Simran Kaur',
    email: 'simran.cleaning@localfixr.test',
    phone: '9876504321',
    businessName: 'Simran Home Cleaning',
    category: 'Cleaning',
    title: 'Home Cleaning Services',
    price: 699,
    skills: ['Cleaning', 'Deep cleaning', 'Kitchen cleaning'],
    description: 'Home cleaning support for rooms, kitchens, bathrooms, and regular local cleaning jobs.',
  },
];

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is missing in .env');
  }

  await mongoose.connect(process.env.MONGODB_URI);
};

const seedProvider = async (providerData) => {
  let user = await User.findOne({ email: providerData.email });

  if (!user) {
    user = await User.create({
      name: providerData.name,
      email: providerData.email,
      phone: providerData.phone,
      address: defaultAddress,
      password: defaultPassword,
      role: 'service_provider',
      isEmailVerified: true,
      isPhoneVerified: true,
    });
  } else {
    user.name = providerData.name;
    user.phone = providerData.phone;
    user.address = user.address || defaultAddress;
    user.role = 'service_provider';
    user.isActive = true;
    user.isBlocked = false;
    await user.save();
  }

  let provider = await Provider.findOne({ user: user._id });

  if (!provider) {
    provider = await Provider.create({
      user: user._id,
      businessName: providerData.businessName,
      bio: providerData.description,
      skills: providerData.skills,
      serviceAreas: [defaultAddress],
      available: true,
      isVerified: true,
    });
  } else {
    provider.businessName = providerData.businessName;
    provider.bio = providerData.description;
    provider.skills = providerData.skills;
    provider.serviceAreas = provider.serviceAreas?.length ? provider.serviceAreas : [defaultAddress];
    provider.available = true;
    provider.isVerified = true;
    await provider.save();
  }

  user.providerProfile = provider._id;
  await user.save();

  const existingService = await Service.findOne({
    provider: provider._id,
    category: providerData.category,
    title: providerData.title,
  });

  if (!existingService) {
    await Service.create({
      title: providerData.title,
      description: providerData.description,
      category: providerData.category,
      price: providerData.price,
      provider: provider._id,
      status: 'active',
      location: defaultAddress,
    });
  } else {
    existingService.description = providerData.description;
    existingService.price = providerData.price;
    existingService.status = 'active';
    existingService.location = existingService.location || defaultAddress;
    await existingService.save();
  }

  return providerData.businessName;
};

const run = async () => {
  await connectDB();

  const seeded = [];
  for (const providerData of providers) {
    seeded.push(await seedProvider(providerData));
  }

  console.log(`Seeded ${seeded.length} service providers: ${seeded.join(', ')}`);
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error('Failed to seed service providers:');
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
