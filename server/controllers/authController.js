import User from '../models/user.js';
import { generateToken } from '../utils/jwtUtils.js';
import { successResponse, errorResponse } from '../utils/responseUtils.js';

/* ----------------------- Register User ----------------------- */
export const register = async (req, res) => {
  try {
    const {
      name, email, password, phone, role,
      address, farmDetails, businessDetails
    } = req.body;

    // Check duplicate user
    const userExists = await User.findOne({ email });
    if (userExists) {
      return errorResponse(res, 400, 'User already exists');
    }

    // Role-based required details
    if (role === 'farmer' && !farmDetails) {
      return errorResponse(res, 400, 'Farm details required for farmers');
    }

    if (role === 'distributor' && !businessDetails) {
      return errorResponse(res, 400, 'Business details required for distributors');
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: role || 'farmer',
      address,
      farmDetails: role === 'farmer' ? farmDetails : undefined,
      businessDetails: role === 'distributor' ? businessDetails : undefined,
    });

    // Token
    const token = generateToken(user._id, user.role);

    return successResponse(res, 201, 'User registered', {
      user: user.getPublicProfile(),
      token,
    });

  } catch (error) {
    console.error(error);
    return errorResponse(res, 500, 'Registration failed', error.message);
  }
};

/* ----------------------- Login User ----------------------- */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user with password
    const user = await User.findOne({ email }).select('+password');
    if (!user) return errorResponse(res, 401, 'Invalid credentials');

    // Check if account is active
    if (!user.isActive) {
      return errorResponse(res, 401, 'Account is deactivated');
    }

    // Validate password
    const passwordMatch = await user.comparePassword(password);
    if (!passwordMatch) return errorResponse(res, 401, 'Invalid credentials');

    // Update login time
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id, user.role);

    return successResponse(res, 200, 'Login successful', {
      user: user.getPublicProfile(),
      token,
    });

  } catch (error) {
    console.error(error);
    return errorResponse(res, 500, 'Login failed');
  }
};

/* ----------------------- Get Profile ----------------------- */
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) return errorResponse(res, 404, 'User not found');

    return successResponse(res, 200, 'Profile loaded', {
      user: user.getPublicProfile(),
    });

  } catch (error) {
    console.error(error);
    return errorResponse(res, 500, 'Profile fetch failed');
  }
};

/* ----------------------- Update Profile ----------------------- */
export const updateProfile = async (req, res) => {
  try {
    const { name, phone, address, farmDetails, businessDetails } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return errorResponse(res, 404, 'User not found');

    // Update basic fields
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) user.address = address;

    // Update role-specific fields
    if (user.role === 'farmer' && farmDetails) {
      user.farmDetails = { ...user.farmDetails, ...farmDetails };
    }

    if (user.role === 'distributor' && businessDetails) {
      user.businessDetails = { ...user.businessDetails, ...businessDetails };
    }

    await user.save();

    return successResponse(res, 200, 'Profile updated', {
      user: user.getPublicProfile(),
    });

  } catch (error) {
    console.error(error);
    return errorResponse(res, 500, 'Profile update failed');
  }
};

/* ----------------------- Change Password ----------------------- */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    // Validate old password
    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      return errorResponse(res, 400, 'Incorrect current password');
    }

    // Save new password
    user.password = newPassword;
    await user.save();

    return successResponse(res, 200, 'Password updated');

  } catch (error) {
    console.error(error);
    return errorResponse(res, 500, 'Failed to change password');
  }
};
