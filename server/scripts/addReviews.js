require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Provider = require('../models/Provider');
const Service = require('../models/Service');
const Review = require('../models/Review');
const Booking = require('../models/Booking');

const reviews = [
  {
    rating: 5,
    comment: "Excellent service! The provider was very professional and completed the work on time. Highly recommended for anyone looking for quality carpentry work.",
    user: null, // Will be filled dynamically
    provider: null, // Will be filled dynamically
    service: null, // Will be filled dynamically
    booking: null, // Will be filled dynamically
  },
  {
    rating: 4,
    comment: "Great work overall. The provider was skilled and the quality of work was good. Minor delay in completion but nothing major. Would use again.",
    user: null,
    provider: null,
    service: null,
    booking: null,
  },
  {
    rating: 5,
    comment: "Outstanding service! The provider exceeded my expectations. The custom dining table they built is absolutely beautiful and the craftsmanship is top-notch.",
    user: null,
    provider: null,
    service: null,
    booking: null,
  },
  {
    rating: 4,
    comment: "Very satisfied with the service. The provider was professional and the work was done to a high standard. The kitchen cabinets look amazing!",
    user: null,
    provider: null,
    service: null,
    booking: null,
  },
  {
    rating: 5,
    comment: "Fantastic experience from start to finish. The provider was responsive, skilled, and delivered exactly what was promised. Will definitely use their services again.",
    user: null,
    provider: null,
    service: null,
    booking: null,
  },
  {
    rating: 4,
    comment: "Good service at a fair price. The provider was knowledgeable and completed the work efficiently. Some minor communication issues but nothing that affected the quality.",
    user: null,
    provider: null,
    service: null,
    booking: null,
  },
];

async function addReviews() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/localfixr');
    
    console.log('Fetching existing data...');
    const users = await User.find({ role: 'user' }).limit(5);
    const providers = await Provider.find().limit(3);
    const services = await Service.find().limit(5);
    const bookings = await Booking.find().limit(5);
    
    console.log(`Found ${users.length} users, ${providers.length} providers, ${services.length} services, ${bookings.length} bookings`);
    
    if (users.length === 0 || providers.length === 0 || services.length === 0) {
      console.log('Not enough data to create reviews. Please create users, providers, and services first.');
      process.exit(1);
    }
    
    console.log('Creating reviews...');
    const createdReviews = [];
    
    for (let i = 0; i < Math.min(reviews.length, services.length); i++) {
      const reviewData = { ...reviews[i] };
      reviewData.user = users[i % users.length]._id;
      reviewData.provider = providers[i % providers.length]._id;
      reviewData.service = services[i]._id;
      reviewData.booking = bookings[i % Math.max(bookings.length, 1)]?._id || null;
      
      const review = await Review.create(reviewData);
      createdReviews.push(review);
      console.log(`✓ Created review ${i + 1}: Rating ${review.rating}/5 for service "${services[i].title}"`);
    }
    
    console.log('\n✅ Reviews created successfully!');
    console.log(`Total reviews added: ${createdReviews.length}`);
    
    // Update service ratings
    console.log('\nUpdating service ratings...');
    for (const service of services.slice(0, createdReviews.length)) {
      const serviceReviews = await Review.find({ service: service._id });
      const avgRating = serviceReviews.reduce((sum, r) => sum + r.rating, 0) / serviceReviews.length;
      await Service.findByIdAndUpdate(service._id, {
        rating: Number(avgRating.toFixed(1)),
        reviewsCount: serviceReviews.length,
      });
      console.log(`✓ Updated "${service.title}": Rating ${avgRating.toFixed(1)}/5 (${serviceReviews.length} reviews)`);
    }
    
    // Update provider ratings
    console.log('\nUpdating provider ratings...');
    for (const provider of providers) {
      const providerReviews = await Review.find({ provider: provider._id });
      if (providerReviews.length > 0) {
        const avgRating = providerReviews.reduce((sum, r) => sum + r.rating, 0) / providerReviews.length;
        await Provider.findByIdAndUpdate(provider._id, {
          rating: Number(avgRating.toFixed(1)),
          reviewsCount: providerReviews.length,
        });
        console.log(`✓ Updated "${provider.businessName}": Rating ${avgRating.toFixed(1)}/5 (${providerReviews.length} reviews)`);
      }
    }
    
    await mongoose.disconnect();
    console.log('\n✅ All reviews added and ratings updated successfully!');
    
  } catch (error) {
    console.error('Error adding reviews:', error);
    process.exit(1);
  }
}

addReviews();
