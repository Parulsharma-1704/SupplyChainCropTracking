import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import PriceHistory from './models/priceHistory.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const SAMPLE_PRICES = [
  // Wheat prices - 6 months back
  { cropType: 'Wheat', market: 'Delhi Market', region: 'North', price: 2500, quality: 'grade_a', date: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), season: 'Rabi', source: 'manual' },
  { cropType: 'Wheat', market: 'Delhi Market', region: 'North', price: 2520, quality: 'grade_a', date: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000), season: 'Rabi', source: 'manual' },
  { cropType: 'Wheat', market: 'Delhi Market', region: 'North', price: 2540, quality: 'grade_a', date: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), season: 'Rabi', source: 'manual' },
  { cropType: 'Wheat', market: 'Delhi Market', region: 'North', price: 2560, quality: 'grade_a', date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), season: 'Rabi', source: 'manual' },
  { cropType: 'Wheat', market: 'Delhi Market', region: 'North', price: 2580, quality: 'grade_a', date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), season: 'Rabi', source: 'manual' },
  { cropType: 'Wheat', market: 'Delhi Market', region: 'North', price: 2600, quality: 'grade_a', date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), season: 'Rabi', source: 'manual' },

  // Rice prices
  { cropType: 'Rice', market: 'Chennai Market', region: 'South', price: 3200, quality: 'grade_a', date: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), season: 'Kharif', source: 'manual' },
  { cropType: 'Rice', market: 'Chennai Market', region: 'South', price: 3250, quality: 'grade_a', date: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), season: 'Kharif', source: 'manual' },
  { cropType: 'Rice', market: 'Chennai Market', region: 'South', price: 3300, quality: 'grade_a', date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), season: 'Kharif', source: 'manual' },
  { cropType: 'Rice', market: 'Chennai Market', region: 'South', price: 3350, quality: 'grade_a', date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), season: 'Kharif', source: 'manual' },

  // Corn prices
  { cropType: 'Corn', market: 'Mumbai Market', region: 'West', price: 1800, quality: 'grade_b', date: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), season: 'Kharif', source: 'manual' },
  { cropType: 'Corn', market: 'Mumbai Market', region: 'West', price: 1850, quality: 'grade_b', date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), season: 'Kharif', source: 'manual' },
  { cropType: 'Corn', market: 'Mumbai Market', region: 'West', price: 1900, quality: 'grade_b', date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), season: 'Kharif', source: 'manual' },

  // Soybeans prices
  { cropType: 'Soybeans', market: 'Indore Market', region: 'Central', price: 4200, quality: 'grade_a', date: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), season: 'Kharif', source: 'manual' },
  { cropType: 'Soybeans', market: 'Indore Market', region: 'Central', price: 4300, quality: 'grade_a', date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), season: 'Kharif', source: 'manual' },
  { cropType: 'Soybeans', market: 'Indore Market', region: 'Central', price: 4400, quality: 'grade_a', date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), season: 'Kharif', source: 'manual' },

  // Cotton prices
  { cropType: 'Cotton', market: 'Bangalore Market', region: 'South', price: 5500, quality: 'premium', date: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), season: 'Kharif', source: 'manual' },
  { cropType: 'Cotton', market: 'Bangalore Market', region: 'South', price: 5700, quality: 'premium', date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), season: 'Kharif', source: 'manual' },
  { cropType: 'Cotton', market: 'Bangalore Market', region: 'South', price: 5900, quality: 'premium', date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), season: 'Kharif', source: 'manual' },

  // Sugarcane prices
  { cropType: 'Sugarcane', market: 'Kolkata Market', region: 'East', price: 450, quality: 'grade_a', date: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), season: 'Rabi', source: 'manual' },
  { cropType: 'Sugarcane', market: 'Kolkata Market', region: 'East', price: 480, quality: 'grade_a', date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), season: 'Rabi', source: 'manual' },
  { cropType: 'Sugarcane', market: 'Kolkata Market', region: 'East', price: 520, quality: 'grade_a', date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), season: 'Rabi', source: 'manual' },
];

const seedDatabase = async () => {
  try {
    console.log('Starting seed process...');
    const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/supplychaindb';
    
    console.log('🌱 Connecting to MongoDB:', mongoUrl);
    await mongoose.connect(mongoUrl);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🗑️ Clearing existing price data...');
    await PriceHistory.deleteMany({});
    console.log('✅ Cleared existing data');

    // Insert sample data
    console.log('📝 Inserting sample price data...');
    const result = await PriceHistory.insertMany(SAMPLE_PRICES);
    console.log(`✅ Successfully inserted ${result.length} price records`);

    // Show insertion details
    console.log('\n📊 Sample of inserted data:');
    const inserted = await PriceHistory.find().limit(5).sort({ date: -1 });
    console.table(inserted.map(doc => ({
      cropType: doc.cropType,
      market: doc.market,
      region: doc.region,
      price: `₹${doc.price}`,
      quality: doc.quality,
      date: doc.date.toLocaleDateString()
    })));

    await mongoose.connection.close();
    console.log('\n✅ Seed completed successfully! Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
