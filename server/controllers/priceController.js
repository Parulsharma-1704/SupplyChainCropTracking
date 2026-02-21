import PriceHistory from '../models/priceHistory.js';
import { successResponse, errorResponse } from '../utils/responseUtils.js';
import { getPricePrediction as getMLPrediction } from '../utils/mlService.js';

// Get price history
export const getPriceHistory = async (req, res) => {
  try {
    const { cropType, region, startDate, endDate } = req.query;

    const query = {
      ...(cropType && { cropType }),
      ...(region && { region }),
      ...((startDate || endDate) && {
        date: {
          ...(startDate && { $gte: new Date(startDate) }),
          ...(endDate && { $lte: new Date(endDate) })
        }
      })
    };

    const prices = await PriceHistory.find(query)
      .sort({ date: -1 })
      .limit(100);

    return successResponse(res, 200, 'Price history retrieved successfully', {
      prices
    });
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, 'Failed to retrieve price history');
  }
};

// Add price data (admin only)
export const addPriceData = async (req, res) => {
  try {
    const {
      cropType,
      market,
      region,
      price,
      quality,
      date,
      season
    } = req.body;

    const priceData = await PriceHistory.create({
      cropType,
      market,
      region,
      price,
      quality,
      date: date || new Date(),
      season,
      source: 'manual'
    });

    return successResponse(res, 201, 'Price data added successfully', {
      priceData
    });
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, 'Failed to add price data');
  }
};

// Get price prediction using ML service
export const getPricePrediction = async (req, res) => {
  try {
    const { cropType, region, quality, quantity } = req.query;

    // Validate required parameters
    if (!cropType) {
      return errorResponse(res, 400, 'cropType is required');
    }

    const cropData = {
      cropType,
      region: region || 'North',
      quality: quality || 'Grade_A',
      quantity_kg: quantity ? parseInt(quantity) : 1000
    };

    // Try to get ML prediction
    console.log('🔍 Fetching ML prediction for:', cropData);
    const mlResult = await getMLPrediction(cropData);

    if (mlResult.success) {
      return successResponse(res, 200, 'Price prediction retrieved from ML model', {
        source: 'ml_service',
        prediction: {
          predictedPrice: mlResult.predictedPrice,
          totalValue: mlResult.totalValue,
          confidence: mlResult.confidence,
          method: mlResult.method,
          currency: mlResult.currency,
          unit: mlResult.unit,
          timestamp: mlResult.timestamp
        }
      });
    }

    // ML service failed or not available, use database fallback
    console.log('⚠️ ML service unavailable or failed, using database fallback');

    const history = await PriceHistory.find({
      cropType,
      region,
      quality
    })
      .sort({ date: -1 })
      .limit(10);

    if (history.length === 0) {
      // If no history and ML failed, return fallback calculation
      return successResponse(res, 200, 'Price prediction (calculated fallback)', {
        source: 'calculated_fallback',
        prediction: {
          predictedPrice: mlResult.predictedPrice,
          confidence: 0.6,
          unit: 'per kg',
          message: 'ML service unavailable - calculated based on crop type and quality',
          currency: 'INR'
        }
      });
    }

    // Use historical average
    const avgPrice = history.reduce((sum, h) => sum + h.price, 0) / history.length;

    return successResponse(res, 200, 'Price prediction (historical average)', {
      source: 'historical_average',
      prediction: {
        predictedPrice: parseFloat((avgPrice * 1.1).toFixed(2)), // 10% markup for current estimate
        confidence: 0.75,
        basedOn: history.length,
        unit: 'per kg',
        message: 'Based on historical average (ML service unavailable)',
        currency: 'INR'
      }
    });

  } catch (err) {
    console.error('❌ Price prediction error:', err);
    return errorResponse(res, 500, 'Failed to get price prediction', {
      error: err.message
    });
  }
};

// Get price trends
export const getPriceTrends = async (req, res) => {
  try {
    const { cropType, region } = req.query;

    if (!cropType) {
      return errorResponse(res, 400, 'cropType is required');
    }

    const trends = await PriceHistory.aggregate([
      {
        $match: {
          cropType,
          ...(region && { region }),
          date: {
            $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            day: { $dayOfMonth: '$date' }
          },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    return successResponse(res, 200, 'Price trends retrieved', { trends });
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, 'Failed to get price trends');
  }
};

// Helper to get current season
const getCurrentSeason = () => {
  const m = new Date().getMonth() + 1;
  if (m >= 3 && m <= 5) return 'spring';
  if (m >= 6 && m <= 8) return 'summer';
  if (m >= 9 && m <= 11) return 'autumn';
  return 'winter';
};
