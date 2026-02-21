import express from 'express';
import { body } from 'express-validator';
import { 
  createCrop, 
  getAllCrops, 
  getCropById, 
  updateCrop, 
  deleteCrop,
  getFarmerCrops,
  scanQRCode,
  getPricePredictionForCrop,
  getMLHealth

} from '../controllers/cropController.js';
import { protect, restrictTo, checkOwnership } from '../middleware/authMiddleware.js';
import { validate } from '../utils/validationUtils.js';
import Crop from '../models/crop.js';

const router = express.Router();

// Create crop validation
const createCropValidation = [
  body('cropType').notEmpty().withMessage('Crop type is required'),
  body('variety').notEmpty().withMessage('Variety is required'),
  body('plantingDate').isISO8601().withMessage('Valid planting date is required'),
  body('harvestDate').isISO8601().withMessage('Valid harvest date is required'),
  body('quantity').isFloat({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('currentPrice').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('location.coordinates').isArray().withMessage('Location coordinates are required')
];

// All routes are protected
router.use(protect);

// Check ML service health
router.get('/ml-health', protect, getMLHealth);

// Get price prediction (standalone)
router.get('/predict-price', protect, getPricePredictionForCrop);

// Crop routes
router.post('/', restrictTo('farmer'), validate(createCropValidation), createCrop);
router.get('/', getAllCrops);
router.get('/farmer', getFarmerCrops);
router.get('/farmer/:farmerId', getFarmerCrops);
router.get('/:id', getCropById);
router.put('/:id', checkOwnership(Crop), updateCrop);
router.delete('/:id', checkOwnership(Crop), deleteCrop);

// QR code routes
router.post('/scan-qr', scanQRCode);

export default router;