import User from '../models/user.js';
import { successResponse, errorResponse } from '../utils/responseUtils.js';

// Get all users (admin only)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password -resetPasswordToken -resetPasswordExpire');

    return successResponse(res, 200, 'Users retrieved successfully', { users });
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, 'Failed to retrieve users');
  }
};

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -resetPasswordToken -resetPasswordExpire');

    if (!user) return errorResponse(res, 404, 'User not found');

    return successResponse(res, 200, 'User retrieved successfully', { user });
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, 'Failed to retrieve user');
  }
};

// Update user (admin or self)
export const updateUser = async (req, res) => {
  try {
    const { name, phone, address, isActive } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) return errorResponse(res, 404, 'User not found');

    const isAdmin = req.user.role === 'admin';
    const isSelf = req.user._id.toString() === req.params.id;

    if (!isAdmin && !isSelf)
      return errorResponse(res, 403, 'Not authorized to update this user');

    Object.assign(user, {
      ...(name && { name }),
      ...(phone && { phone }),
      ...(address && { address }),
      ...(isAdmin && isActive !== undefined && { isActive })
    });

    await user.save();

    return successResponse(res, 200, 'User updated successfully', {
      user: user.getPublicProfile()
    });
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, 'Failed to update user');
  }
};

// Delete user (soft delete – admin only)
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return errorResponse(res, 404, 'User not found');

    user.isActive = false;
    await user.save();

    return successResponse(res, 200, 'User deleted successfully');
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, 'Failed to delete user');
  }
};

// Get user statistics
export const getUserStats = async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          }
        }
      }
    ]);

    const totalUsers = await User.countDocuments();

    return successResponse(res, 200, 'User statistics retrieved', {
      stats,
      totalUsers,
      timestamp: new Date()
    });
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, 'Failed to get user statistics');
  }
};
