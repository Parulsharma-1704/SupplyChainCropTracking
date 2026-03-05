import { axiosInstance } from './axiosInstance';

/**
 * Fetch price history from backend
 * @param {Object} params - Query parameters (cropType, region, etc)
 * @returns {Promise<Array>} Price history data
 */
export const getPriceHistory = async (params = {}) => {
  try {
    const queryStr = new URLSearchParams(params).toString();
    const response = await axiosInstance.get(`/prices?${queryStr}`);
    return response.data.data?.prices || [];
  } catch (error) {
    console.error('Error fetching prices:', error);
    throw error;
  }
};

/**
 * Fetch all available crops
 * @returns {Promise<Array>} List of crops
 */
export const getCrops = async () => {
  try {
    const response = await axiosInstance.get('/crops');
    return response.data.data?.crops || [];
  } catch (error) {
    console.error('Error fetching crops:', error);
    throw error;
  }
};
