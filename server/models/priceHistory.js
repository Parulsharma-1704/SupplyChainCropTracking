import mongoose from 'mongoose';

const priceHistorySchema = new mongoose.Schema({
  cropType: {
    type: String,
    required: true
  },
  
  market: {
    type: String,
    required: true
  },
  
  region: {
    type: String,
    required: true
  },
  
  price: {
    type: Number,
    required: true
  },
  
  quality: {
    type: String,
    enum: ['premium', 'grade_a', 'grade_b', 'grade_c']
  },
  
  date: {
    type: Date,
    required: true
  },
  
  season: String,
  
  source: {
    type: String,
    enum: ['manual', 'api', 'scraped']
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const PriceHistory = mongoose.model('PriceHistory', priceHistorySchema);
export default PriceHistory;