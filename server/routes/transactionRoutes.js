import express from 'express';
import { 
  createTransaction, 
  getAllTransactions, 
  getTransactionById, 
  updatePaymentStatus,
  getTransactionSummary 
} from '../controllers/transactionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Transaction routes
router.post('/', createTransaction);
router.get('/', getAllTransactions);
router.get('/summary', getTransactionSummary);
router.get('/:id', getTransactionById);
router.put('/:id/payment', updatePaymentStatus);

export default router;