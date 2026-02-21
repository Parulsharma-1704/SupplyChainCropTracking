import Crop from '../models/crop.js';
import { generateCropQR } from '../utils/qrUtils.js';
import { successResponse, errorResponse } from '../utils/responseUtils.js';
import { getPricePrediction, checkMLHealth } from '../utils/mlService.js';

/* ----------------------- Create a New Crop ----------------------- */
export const createCrop = async (req, res) => {
  try {
    const {
      cropType, variety, plantingDate, harvestDate,
      quantity, unit, qualityGrade, currentPrice,
      description, location, soilType, irrigationType,
      certifications, tags, region
    } = req.body;

    // Create crop first
    const crop = await Crop.create({
      farmer: req.user._id,
      cropType,
      variety,
      plantingDate: new Date(plantingDate),
      harvestDate: new Date(harvestDate),
      quantity,
      unit: unit || 'kg',
      qualityGrade: qualityGrade || 'grade_a',
      currentPrice,
      description,
      location: {
        type: 'Point',
        coordinates: location?.coordinates || [0, 0],
      },
      soilType,
      irrigationType,
      certifications,
      tags,
      status: 'planted',
    });

    //Generate QR code
    const qr = await generateCropQR(crop._id, cropType);
    crop.qrCode = qr.qrData;
    crop.qrCodeImage = qr.qrUrl;

    // Get ML Prediction (via service layer)
    const prediction = await getPricePrediction({
      cropType,
      region: region || req.user.address?.state || 'North',
      qualityGrade,
      quantity,
      season: getSeason(new Date(plantingDate))
    });

    if (prediction.success) {
      crop.predictedPrice = prediction.predictedPrice;
      crop.priceConfidence = prediction.confidence;
    } else {
      // Fallback logic handled inside service
      crop.predictedPrice = prediction.predictedPrice || currentPrice;
      crop.priceConfidence = 0.6;
    }

    await crop.save();

    return successResponse(res, 201, 'Crop created', {
      crop,
      ml_prediction: prediction.success
        ? {
            price: prediction.predictedPrice,
            confidence: prediction.confidence,
            method: prediction.method
          }
        : { method: 'fallback' }
    });

  } catch (error) {
    console.error('Create crop error:', error);
    return errorResponse(res, 500, 'Creation failed');
  }
};

/* ----------------------- ML Standalone Prediction ----------------------- */
export const getPricePredictionForCrop = async (req, res) => {
  try {
    const { cropType, region, quality, quantity } = req.query;

    if (!cropType || !quantity) {
      return errorResponse(res, 400, 'cropType and quantity required');
    }

    const prediction = await getPricePrediction({
      cropType,
      region: region || 'North',
      qualityGrade: quality || 'grade_a',
      quantity: parseFloat(quantity)
    });

    return successResponse(res, 200, 'Prediction result', { prediction });

  } catch (error) {
    return errorResponse(res, 500, 'Prediction failed');
  }
};

/* ----------------------- ML Health Check ----------------------- */
export const getMLHealth = async (req, res) => {
  try {
    const health = await checkMLHealth();
    return successResponse(res, 200, 'ML Health', { health });
  } catch {
    return errorResponse(res, 500, 'ML health check failed');
  }
};


/* ----------------------- Get All Crops (Filtered) ----------------------- */
export const getAllCrops = async (req, res) => {
  try {
    const {
      cropType, quality, minPrice, maxPrice,
      status, farmerId, page = 1, limit = 10
    } = req.query;

    const query = {};

    if (cropType) query.cropType = cropType;
    if (quality) query.qualityGrade = quality;

    if (minPrice || maxPrice) {
      query.currentPrice = {};
      if (minPrice) query.currentPrice.$gte = parseFloat(minPrice);
      if (maxPrice) query.currentPrice.$lte = parseFloat(maxPrice);
    }

    if (status) query.status = status;
    if (farmerId) query.farmer = farmerId;

    // Default: show only available crops
    if (!status) {
      query.status = { $in: ['ready_for_sale', 'harvested'] };
    }

    const skip = (page - 1) * limit;

    const crops = await Crop.find(query)
      .populate('farmer', 'name email phone address')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Crop.countDocuments(query);

    return successResponse(res, 200, 'Crops retrieved', {
      crops,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      }
    });

  } catch (error) {
    console.error('Get crops error:', error);
    return errorResponse(res, 500, 'Failed to retrieve crops');
  }
};

/* ----------------------- Get One Crop ----------------------- */
export const getCropById = async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id)
      .populate('farmer', 'name email phone address farmDetails');

    if (!crop) return errorResponse(res, 404, 'Crop not found');

    return successResponse(res, 200, 'Crop retrieved', { crop });

  } catch (error) {
    console.error('Get crop error:', error);
    return errorResponse(res, 500, 'Failed to retrieve crop');
  }
};

/* ----------------------- Update Crop ----------------------- */
export const updateCrop = async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id);
    if (!crop) return errorResponse(res, 404, 'Crop not found');

    // Ownership check
    const isOwner = crop.farmer.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Not authorized');
    }

    const allowed = [
      'quantity', 'currentPrice', 'qualityGrade',
      'description', 'status', 'images', 'certifications', 'tags'
    ];

    allowed.forEach(field => {
      if (req.body[field] !== undefined) crop[field] = req.body[field];
    });

    await crop.save();

    return successResponse(res, 200, 'Crop updated', { crop });

  } catch (error) {
    console.error('Update crop error:', error);
    return errorResponse(res, 500, 'Update failed');
  }
};

/* ----------------------- Delete Crop ----------------------- */
export const deleteCrop = async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id);
    if (!crop) return errorResponse(res, 404, 'Crop not found');

    const isOwner = crop.farmer.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Not authorized');
    }

    crop.isActive = false; // soft delete
    await crop.save();

    return successResponse(res, 200, 'Crop deleted');

  } catch (error) {
    console.error('Delete crop error:', error);
    return errorResponse(res, 500, 'Delete failed');
  }
};

/* ----------------------- Get Crops for a Farmer ----------------------- */
export const getFarmerCrops = async (req, res) => {
  try {
     if (req.params.farmerId && req.params.farmerId !== 'undefined' && req.params.farmerId !== 'null') {
      farmerId = req.params.farmerId;
    } else {
      farmerId = req.user._id;
    }

    const crops = await Crop.find({
      farmer: farmerId,
      isActive: true,
    }).sort({ createdAt: -1 });

    return successResponse(res, 200, 'Farmer crops retrieved', { crops });

  } catch (error) {
    console.error('Farmer crops error:', error);
    return errorResponse(res, 500, 'Failed to load crops');
  }
};

/* ----------------------- Scan QR Code ----------------------- */
export const scanQRCode = async (req, res) => {
  try {
    const { qrData } = req.body;
    if (!qrData) return errorResponse(res, 400, 'QR data required');

    let parsed;
    try {
      parsed = JSON.parse(qrData);
    } catch {
      return errorResponse(res, 400, 'Invalid QR code');
    }

    if (parsed.type === 'crop' && parsed.id) {
      const crop = await Crop.findById(parsed.id)
        .populate('farmer', 'name email phone address farmDetails');

      if (!crop) return errorResponse(res, 404, 'Crop not found');

      return successResponse(res, 200, 'Crop details', {
        type: 'crop',
        data: crop,
      });
    }

    return errorResponse(res, 400, 'Unknown QR type');

  } catch (error) {
    console.error('QR scan error:', error);
    return errorResponse(res, 500, 'Failed to scan');
  }
};

/* ----------------------- Helper: Get Season ----------------------- */
const getSeason = (date) => {
  const m = date.getMonth() + 1;
  if (m >= 3 && m <= 5) return 'spring';
  if (m >= 6 && m <= 8) return 'summer';
  if (m >= 9 && m <= 11) return 'autumn';
  return 'winter';
};
