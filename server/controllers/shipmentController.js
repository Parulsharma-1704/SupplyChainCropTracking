import Shipment from '../models/shipment.js';
import Crop from '../models/crop.js';
import { successResponse, errorResponse } from '../utils/responseUtils.js';

// Create shipment
export const createShipment = async (req, res) => {
  try {
    const {
      cropId,
      distributorId,
      sourceLocation,
      destinationLocation,
      estimatedDelivery
    } = req.body;

    const crop = await Crop.findById(cropId);
    if (!crop) return errorResponse(res, 404, 'Crop not found');

    if (crop.farmer.toString() !== req.user._id.toString())
      return errorResponse(res, 403, 'Not authorized to ship this crop');

    const trackingNumber = `SH${Date.now()}${Math.random()
      .toString(36)
      .substr(2, 5)
      .toUpperCase()}`;

    const shipment = await Shipment.create({
      trackingNumber,
      crop: cropId,
      farmer: req.user._id,
      distributor: distributorId,
      sourceLocation,
      destinationLocation,
      estimatedDelivery: new Date(estimatedDelivery),
      currentStatus: 'processing'
    });

    crop.status = 'shipped';
    await crop.save();

    return successResponse(res, 201, 'Shipment created successfully', {
      shipment
    });
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, 'Failed to create shipment');
  }
};

// Get all shipments
export const getAllShipments = async (req, res) => {
  try {
    const { status, farmerId, distributorId } = req.query;

    const query = {
      ...(status && { currentStatus: status }),
      ...(farmerId && { farmer: farmerId }),
      ...(distributorId && { distributor: distributorId })
    };

    if (req.user.role !== 'admin') {
      query.$or = [
        { farmer: req.user._id },
        { distributor: req.user._id }
      ];
    }

    const shipments = await Shipment.find(query)
      .populate('crop', 'cropType variety quantity')
      .populate('farmer', 'name phone')
      .populate('distributor', 'name phone')
      .sort({ createdAt: -1 });

    return successResponse(res, 200, 'Shipments retrieved successfully', {
      shipments
    });
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, 'Failed to retrieve shipments');
  }
};

// Get shipment by ID
export const getShipmentById = async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id)
      .populate('crop')
      .populate('farmer')
      .populate('distributor');

    if (!shipment) return errorResponse(res, 404, 'Shipment not found');

    const isFarmer = shipment.farmer._id.toString() === req.user._id.toString();
    const isDistributor =
      shipment.distributor._id.toString() === req.user._id.toString();

    if (req.user.role !== 'admin' && !isFarmer && !isDistributor)
      return errorResponse(res, 403, 'Not authorized to view this shipment');

    return successResponse(res, 200, 'Shipment retrieved successfully', {
      shipment
    });
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, 'Failed to retrieve shipment');
  }
};

// Update shipment status
export const updateShipmentStatus = async (req, res) => {
  try {
    const { status, location, notes } = req.body;
    const shipment = await Shipment.findById(req.params.id);

    if (!shipment) return errorResponse(res, 404, 'Shipment not found');

    if (location && status) {
      shipment.checkpoints.push({
        location,
        status,
        notes,
        verifiedBy: req.user._id
      });
    }

    if (status) {
      shipment.currentStatus = status;
      if (status === 'delivered') shipment.actualDelivery = new Date();
    }

    await shipment.save();

    return successResponse(res, 200, 'Shipment status updated successfully', {
      shipment
    });
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, 'Failed to update shipment');
  }
};

// Track shipment by tracking number
export const trackShipment = async (req, res) => {
  try {
    const shipment = await Shipment.findOne({
      trackingNumber: req.params.trackingNumber
    })
      .populate('crop', 'cropType variety')
      .populate('farmer', 'name phone address')
      .populate('distributor', 'name phone address');

    if (!shipment) return errorResponse(res, 404, 'Shipment not found');

    return successResponse(res, 200, 'Shipment tracking information', {
      shipment
    });
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, 'Failed to track shipment');
  }
};
