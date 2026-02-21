import express from 'express';
import { 
  createShipment, 
  getAllShipments, 
  getShipmentById, 
  updateShipmentStatus,
  trackShipment 
} from '../controllers/shipmentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Shipment routes
router.post('/', createShipment);
router.get('/', getAllShipments);
router.get('/:id', getShipmentById);
router.put('/:id/status', updateShipmentStatus);
router.get('/track/:trackingNumber', trackShipment);

export default router;