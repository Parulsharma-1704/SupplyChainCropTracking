// server/utils/mlService.js
import axios from 'axios';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';
const ML_TIMEOUT = 30000; // 30 seconds for prediction, longer for training
const ML_TRAIN_TIMEOUT = 300000; // 5 minutes for training

/**
 * Get price prediction from ML service
 * @param {Object} cropData - Crop data containing type, region, quality, quantity
 * @returns {Object} - Prediction result with price and confidence
 */
export const getPricePrediction = async (cropData) => {
  try {
    console.log('📡 Calling ML service for price prediction...');

    const features = {
      crop_type: cropData.cropType || 'Wheat',
      region: cropData.region || 'North',
      quality: cropData.quality || cropData.qualityGrade || 'Grade_A',
      quantity_kg: parseFloat(cropData.quantity || cropData.quantity_kg || 1000),
      season: cropData.season || getCurrentSeason(),
      weather: cropData.weather || 'Normal',
      market_demand: cropData.marketDemand || 'Medium',
      ...(cropData.year && { year: cropData.year }),
      ...(cropData.month && { month: cropData.month })
    };

    console.log('📊 Features prepared:', features);

    const { data } = await axios.post(
      `${ML_SERVICE_URL}/api/predict`,
      features,
      { timeout: ML_TIMEOUT }
    );

    if (!data.success) {
      console.warn('⚠️ ML service returned error:', data.error);
      return {
        success: false,
        error: data.error || 'ML prediction failed',
        fallback: true
      };
    }

    console.log('✅ ML prediction successful:', data.predicted_price);

    return {
      success: true,
      predictedPrice: data.predicted_price,
      totalValue: data.total_value,
      confidence: data.confidence,
      method: data.method,
      currency: data.currency || 'INR',
      unit: data.unit || 'per kg',
      timestamp: data.timestamp,
      inputFeatures: data.input_features,
      fullResponse: data
    };

  } catch (err) {
    console.error('❌ ML service error:', err.message);

    return {
      success: false,
      error: err.message,
      fallback: true,
      predictedPrice: getFallbackPrice(cropData)
    };
  }
};

/**
 * Check ML service health and model status
 * @returns {Object} - Health status including model loaded state
 */
export const checkMLHealth = async () => {
  try {
    console.log('🏥 Checking ML service health...');

    const { data } = await axios.get(`${ML_SERVICE_URL}/health`, {
      timeout: 5000
    });

    const result = {
      success: true,
      status: data.status,
      modelLoaded: data.model_loaded,
      timestamp: data.timestamp,
      mlServiceUrl: ML_SERVICE_URL
    };

    console.log('✅ ML service is healthy:', result);
    return result;
  } catch (err) {
    console.error('❌ ML service health check failed:', err.message);
    return {
      success: false,
      error: err.message,
      mlServiceUrl: ML_SERVICE_URL
    };
  }
};

/**
 * Get ML service info
 * @returns {Object} - Service information including endpoints
 */
export const getMLServiceInfo = async () => {
  try {
    console.log('📋 Getting ML service info...');

    const { data } = await axios.get(`${ML_SERVICE_URL}/`, {
      timeout: 5000
    });

    return {
      success: true,
      ...data
    };
  } catch (err) {
    console.error('❌ ML service info fetch failed:', err.message);
    return {
      success: false,
      error: err.message
    };
  }
};

/**
 * Retrain ML model
 * @returns {Object} - Training status and result
 */
export const retrainMLModel = async () => {
  try {
    console.log('🔄 Starting ML model retraining...');

    const { data } = await axios.post(
      `${ML_SERVICE_URL}/api/train`,
      {},
      { timeout: ML_TRAIN_TIMEOUT }
    );

    console.log('✅ ML model training completed:', data.message);

    return {
      success: true,
      message: data.message,
      modelLoaded: data.model_loaded,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    console.error('❌ ML model retraining failed:', err.message);
    return {
      success: false,
      error: err.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Get current season based on current month
 * @returns {string} - Season name
 */
const getCurrentSeason = () => {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return 'Spring';
  if (month >= 6 && month <= 8) return 'Summer';
  if (month >= 9 && month <= 11) return 'Autumn';
  return 'Winter';
};

/**
 * Get fallback price when ML service is unavailable
 * @param {Object} cropData - Crop data
 * @returns {number} - Estimated fallback price
 */
const getFallbackPrice = (cropData) => {
  const basePrices = {
    wheat: 45,
    rice: 65,
    corn: 35,
    pulses: 85,
    vegetables: 32,
    fruits: 55,
    sugarcane: 40,
    cotton: 60,
    soybean: 50
  };

  const crop = cropData.cropType?.toLowerCase() || 'wheat';
  const base = basePrices[crop] || 40;

  const multipliers = {
    premium: 1.2,
    grade_a: 1.0,
    grade_b: 0.8,
    grade_c: 0.6
  };

  const quality = (cropData.quality || cropData.qualityGrade || '').toLowerCase();
  const multiplier = multipliers[quality] || 1.0;

  return Math.round(base * multiplier * 100) / 100;
};

export default {
  getPricePrediction,
  checkMLHealth,
  getMLServiceInfo,
  retrainMLModel
};
