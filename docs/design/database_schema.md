# DATABASE SCHEMA DESIGN

## COLLECTIONS (MongoDB)

### 1. User Collection
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String, // 'farmer', 'distributor', 'admin'
  phone: String,
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    coordinates: [longitude, latitude] // for maps
  },
  farmDetails: { // only for farmers
    farmName: String,
    farmSize: Number, // in acres
    farmType: String // 'organic', 'conventional'
  },
  businessDetails: { // only for distributors
    businessName: String,
    licenseNumber: String
  },
  createdAt: Date,
  updatedAt: Date
}

### 2. Crop Collection
{
  _id: ObjectId,
  farmerId: ObjectId (ref: User),
  cropType: String, // 'Wheat', 'Rice', 'Corn', etc.
  variety: String,
  plantingDate: Date,
  harvestDate: Date,
  quantity: Number, // in kg
  qualityGrade: String, // 'Premium', 'A', 'B', 'C'
  status: String, // 'planted', 'harvested', 'ready_for_sale', 'sold'
  pricePerKg: Number,
  description: String,
  images: [String], // URLs to stored images
  qrCode: String, // unique identifier
  certifications: [String], // ['organic', 'non-gmo']
  createdAt: Date
}

### 3. Shipment Collection
{
  _id: ObjectId,
  cropId: ObjectId (ref: Crop),
  farmerId: ObjectId (ref: User),
  distributorId: ObjectId (ref: User),
  trackingNumber: String (unique),
  currentStatus: String, // 'packed', 'in_transit', 'delivered', 'delayed'
  sourceLocation: String,
  destinationLocation: String,
  estimatedDelivery: Date,
  actualDelivery: Date,
  checkpoints: [
    {
      location: String,
      status: String,
      timestamp: Date,
      notes: String
    }
  ],
  createdAt: Date
}

### 4. Transaction Collection
{
  _id: ObjectId,
  cropId: ObjectId (ref: Crop),
  farmerId: ObjectId (ref: User),
  distributorId: ObjectId (ref: User),
  quantity: Number,
  pricePerKg: Number,
  totalAmount: Number,
  paymentStatus: String, // 'pending', 'completed', 'failed'
  transactionDate: Date,
  paymentMethod: String // 'bank_transfer', 'cash', 'digital'
}

### 5. PriceHistory Collection (for ML training)
{
  _id: ObjectId,
  cropType: String,
  market: String,
  price: Number,
  quantity: Number,
  quality: String,
  date: Date,
  season: String,
  region: String,
  recordedAt: Date
}

### 6. PricePrediction Collection
{
  _id: ObjectId,
  cropType: String,
  predictedPrice: Number,
  confidence: Number, // 0-1
  predictionDate: Date,
  features: {
    season: String,
    region: String,
    quality: String,
    marketDemand: String // 'low', 'medium', 'high'
  }
}