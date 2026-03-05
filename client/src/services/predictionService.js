import axios from 'axios';

const ML_BASE_URL = import.meta.env.VITE_ML_URL || 'http://localhost:5001';

const mlAxiosInstance = axios.create({
  baseURL: ML_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Get AI price prediction from ML service
 * @param {Object} cropData - Crop data for prediction
 * @param {string} cropData.cropType - Type of crop
 * @param {string} cropData.region - Region
 * @param {string} cropData.quality - Quality grade
 * @param {number} cropData.quantity_kg - Quantity in kg
 * @returns {Promise<Object>} Prediction result
 */
export const getPrediction = async (cropData) => {
  try {
    const response = await mlAxiosInstance.post('/predict', {
      cropType: cropData.cropType,
      region: cropData.region || 'North',
      quality_grade: cropData.quality || 'Grade_A',
      quantity_kg: cropData.quantity || 1000,
    });
    return response.data;
  } catch (error) {
    console.error('Error getting prediction:', error);
    throw error;
  }
};

/**
 * Check ML service health
 * @returns {Promise<Object>} Health status
 */
export const checkMLHealth = async () => {
  try {
    const response = await mlAxiosInstance.get('/health');
    return response.data;
  } catch (error) {
    console.error('Error checking ML health:', error);
    return { success: false, message: 'ML service unavailable' };
  }
};
