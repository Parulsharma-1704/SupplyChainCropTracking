import mongoose from 'mongoose';

const cropSchema = new mongoose.Schema({
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  cropType: {
    type: String,
    required: [true, 'Crop type is required'],
    enum: ['wheat', 'rice', 'corn', 'sugarcane', 'cotton', 'soybean', 'pulses', 'vegetables', 'fruits', 'others']
  },
  
  variety: {
    type: String,
    required: [true, 'Variety is required']
  },
  
  plantingDate: {
    type: Date,
    required: [true, 'Planting date is required']
  },
  
  harvestDate: {
    type: Date,
    required: [true, 'Harvest date is required']
  },
  
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1 kg']
  },
  
  unit: {
    type: String,
    enum: ['kg', 'quintal', 'ton'],
    default: 'kg'
  },
  
  qualityGrade: {
    type: String,
    enum: ['premium', 'grade_a', 'grade_b', 'grade_c'],
    default: 'grade_a'
  },
  
  currentPrice: {
    type: Number,
    required: [true, 'Current price is required'],
    min: [0, 'Price cannot be negative']
  },
  
  predictedPrice: {
    type: Number,
    default: null
  },
  
  priceConfidence: {
    type: Number,
    min: 0,
    max: 1,
    default: null
  },
  
  status: {
    type: String,
    enum: ['planted', 'growing', 'harvested', 'ready_for_sale', 'reserved', 'sold', 'shipped'],
    default: 'planted'
  },
  
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  images: [{
    url: String,
    caption: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  qrCode: {
    type: String,
    unique: true
  },
  
  qrCodeImage: {
    type: String
  },
  
  certifications: [{
    type: String,
    enum: ['organic', 'non_gmo', 'fair_trade', 'rainforest_alliance', 'utZ_certified']
  }],
  
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  
  soilType: {
    type: String,
    enum: ['clay', 'sandy', 'loamy', 'silt', 'peaty', 'chalky']
  },
  
  irrigationType: {
    type: String,
    enum: ['drip', 'sprinkler', 'flood', 'rainfed']
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  tags: [String]
  
}, {
  timestamps: true
});

// Indexes
cropSchema.index({ location: '2dsphere' });
cropSchema.index({ farmer: 1, status: 1 });
cropSchema.index({ cropType: 1, qualityGrade: 1 });
cropSchema.index({ createdAt: -1 });

// Virtuals
cropSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.plantingDate) / (1000 * 60 * 60 * 24));
});

cropSchema.virtual('estimatedValue').get(function() {
  return this.quantity * this.currentPrice;
});

const Crop = mongoose.model('Crop', cropSchema);
export default Crop;