import express from 'express';
import { 
  getAllUsers, 
  getUserById, 
  updateUser, 
  deleteUser, 
  getUserStats 
} from '../controllers/userController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Admin only routes
router.get('/', restrictTo('admin'), getAllUsers);
router.get('/stats', restrictTo('admin'), getUserStats);
router.delete('/:id', restrictTo('admin'), deleteUser);

// User routes
router.get('/:id', getUserById);
router.put('/:id', updateUser);

export default router;