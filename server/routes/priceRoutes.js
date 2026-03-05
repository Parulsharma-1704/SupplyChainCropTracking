import express from 'express';
import {
  getPriceHistory,
  addPriceData,
  getPricePrediction,
  getPriceTrends
} from '../controllers/priceController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import {
  checkMLHealth,
  getMLServiceInfo,
  retrainMLModel
} from '../utils/mlService.js';
import { successResponse, errorResponse } from '../utils/responseUtils.js';

const router = express.Router();

// PUBLIC ROUTES - Anyone can view prices
// Get price history
router.get('/', getPriceHistory);

// Get price prediction from ML service
router.get('/predict', getPricePrediction);

// Get price trends
router.get('/trends', getPriceTrends);

// Get ML service health status (public)
router.get('/ml/health', async (req, res) => {
  try {
    const health = await checkMLHealth();
    if (health.success) {
      return successResponse(res, 200, 'ML service is healthy', health);
    } else {
      return errorResponse(res, 503, 'ML service unavailable', health);
    }
  } catch (err) {
    console.error('Error checking ML health:', err);
    return errorResponse(res, 500, 'Failed to check ML service health', {
      error: err.message
    });
  }
});

// Get ML service information (public)
router.get('/ml/info', async (req, res) => {
  try {
    const info = await getMLServiceInfo();
    if (info.success) {
      return successResponse(res, 200, 'ML service information retrieved', info);
    } else {
      return errorResponse(res, 503, 'Failed to retrieve ML service info', info);
    }
  } catch (err) {
    console.error('Error getting ML info:', err);
    return errorResponse(res, 500, 'Failed to get ML service information', {
      error: err.message
    });
  }
});

// PROTECTED ROUTES - Admin only
// Add price data (admin only)
router.post('/', protect, restrictTo('admin'), addPriceData);

// Retrain ML model (admin only)
router.post('/ml/retrain', protect, restrictTo('admin'), async (req, res) => {
  try {
    console.log('🔄 Starting ML model retraining...');
    const result = await retrainMLModel();

    if (result.success) {
      return successResponse(res, 200, 'ML model retraining completed successfully', result);
    } else {
      return errorResponse(res, 500, 'ML model retraining failed', result);
    }
  } catch (err) {
    console.error('Error retraining ML model:', err);
    return errorResponse(res, 500, 'Failed to retrain ML model', {
      error: err.message
    });
  }
});

export default router;