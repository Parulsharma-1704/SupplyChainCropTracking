import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from './config/database.js';
import { checkMLHealth } from './utils/mlService.js';

dotenv.config();

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import Routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import cropRoutes from './routes/cropRoutes.js';
import shipmentRoutes from './routes/shipmentRoutes.js';
import priceRoutes from './routes/priceRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';

import { notFound, errorHandler } from './middleware/errorMiddleware.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Global state for ML service
let mlServiceStatus = {
  available: false,
  lastCheck: null,
  message: 'Not checked'
};

// Basic middleware
app.use(cors());
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ML Service health check - attach to request object
const checkMLServiceHealth = async (req, res, next) => {
  try {
    const health = await checkMLHealth();
    req.mlService = health;
    res.locals.mlService = health;
    next();
  } catch (err) {
    req.mlService = { available: false, error: err.message };
    res.locals.mlService = { available: false };
    next();
  }
};

app.use(checkMLServiceHealth);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/crops', cropRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/prices', priceRoutes);
app.use('/api/transactions', transactionRoutes);

// API home
app.get('/', (req, res) => {
  res.json({
    message: 'Supply Chain Backend Running',
    mlService: {
      status: mlServiceStatus.available ? 'connected' : 'disconnected',
      lastCheck: mlServiceStatus.lastCheck
    }
  });
});

// System status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    backend: 'running',
    database: 'connected',
    mlService: mlServiceStatus
  });
});

// Error handlers
app.use(notFound);
app.use(errorHandler);

// Start Server
const startServer = async () => {
  await connectDB();

  // Check ML service health on startup
  const health = await checkMLHealth();
  mlServiceStatus = {
    available: health.success || false,
    lastCheck: new Date().toISOString(),
    message: health.success ? 'Connected' : `Disconnected: ${health.error}`
  };

  if (mlServiceStatus.available) {
    console.log('✅ ML Service connected:', health.mlServiceUrl);
  } else {
    console.warn('⚠️ ML Service not available - Price predictions will use fallback method');
  }

  // Periodic ML health check every 5 minutes
  setInterval(async () => {
    const newHealth = await checkMLHealth();
    mlServiceStatus = {
      available: newHealth.success || false,
      lastCheck: new Date().toISOString(),
      message: newHealth.success ? 'Connected' : `Disconnected: ${newHealth.error}`
    };

    if (mlServiceStatus.available) {
      console.log('✅ ML Service status: Connected');
    } else {
      console.warn('⚠️ ML Service status: Disconnected');
    }
  }, 5 * 60 * 1000); // Every 5 minutes

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 ML Service URL: ${process.env.ML_SERVICE_URL || 'http://localhost:5001'}`);
  });
};

startServer();
export default app;
