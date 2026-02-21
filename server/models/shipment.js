import mongoose from 'mongoose';

const checkpointSchema = new mongoose.Schema({
  location: String,
  coordinates: [Number],
  status: String,
  timestamp: { type: Date, default: Date.now },
  notes: String,
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const shipmentSchema = new mongoose.Schema({
  trackingNumber: {
    type: String,
    required: true,
    unique: true
  },
  
  crop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Crop',
    required: true
  },
  
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  distributor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  sourceLocation: {
    address: String,
    coordinates: [Number]
  },
  
  destinationLocation: {
    address: String,
    coordinates: [Number]
  },
  
  currentStatus: {
    type: String,
    enum: ['processing', 'packed', 'in_transit', 'delivered', 'cancelled'],
    default: 'processing'
  },
  
  estimatedDelivery: Date,
  actualDelivery: Date,
  
  checkpoints: [checkpointSchema],
  
  vehicleDetails: {
    type: String,
    licensePlate: String,
    driverName: String,
    driverPhone: String
  },
  
  notes: String,
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

shipmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Shipment = mongoose.model('Shipment', shipmentSchema);
export default Shipment;