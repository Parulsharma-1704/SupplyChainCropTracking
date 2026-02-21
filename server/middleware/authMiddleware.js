import User from '../models/user.js';
import { getTokenFromHeader, verifyToken } from '../utils/jwtUtils.js';
import { errorResponse } from '../utils/responseUtils.js';

/* --------------------- Protect Routes --------------------- */
export const protect = async (req, res, next) => {
  try {
    const token = getTokenFromHeader(req);

    if (!token) return errorResponse(res, 401, 'No token provided');

    // Verify token
    const decoded = verifyToken(token);

    // Get user
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return errorResponse(res, 401, 'User not found');

    if (!user.isActive) {
      return errorResponse(res, 401, 'Account is deactivated');
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id;
    req.userRole = user.role;

    next();

  } catch (error) {
    console.error(error.message);

    if (error.message === 'Invalid or expired token') {
      return errorResponse(res, 401, 'Invalid or expired token');
    }

    return errorResponse(res, 500, 'Authentication failed');
  }
};

/* --------------------- Restrict by Role --------------------- */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return errorResponse(res, 401, 'Login required');

    if (!roles.includes(req.user.role)) {
      return errorResponse(res, 403, `Access denied. Allowed: ${roles.join(', ')}`);
    }

    next();
  };
};

/* --------------------- Ownership Check --------------------- */
export const checkOwnership = (model) => {
  return async (req, res, next) => {
    try {
      if (!req.user) return errorResponse(res, 401, 'Login required');

      // Admin has access to everything
      if (req.user.role === 'admin') return next();

      const resource = await model.findById(req.params.id);
      if (!resource) return errorResponse(res, 404, 'Resource not found');

      // Ownership logic based on model type
      if (model.modelName === 'Crop') {
        if (resource.farmer.toString() !== req.user._id.toString()) {
          return errorResponse(res, 403, 'Not authorized');
        }
      }

      else if (model.modelName === 'Shipment' || model.modelName === 'Transaction') {
        const isFarmer = resource.farmer?.toString() === req.user._id.toString();
        const isDistributor = resource.distributor?.toString() === req.user._id.toString();

        if (!isFarmer && !isDistributor) {
          return errorResponse(res, 403, 'Not authorized');
        }
      }

      else {
        if (resource._id.toString() !== req.user._id.toString()) {
          return errorResponse(res, 403, 'Not authorized');
        }
      }

      next();

    } catch (error) {
      console.error(error);
      return errorResponse(res, 500, 'Authorization failed');
    }
  };
};
