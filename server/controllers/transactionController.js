import Transaction from '../models/transaction.js';
import Crop from '../models/crop.js';
import { successResponse, errorResponse } from '../utils/responseUtils.js';

// Create transaction
export const createTransaction = async (req, res) => {
    try {
        const {
            cropId,
            distributorId,
            quantity,
            pricePerUnit,
            paymentMethod
        } = req.body;

        const crop = await Crop.findById(cropId);
        if (!crop) return errorResponse(res, 404, 'Crop not found');

        if (crop.status !== 'ready_for_sale')
            return errorResponse(res, 400, 'Crop is not available for sale');

        if (quantity > crop.quantity)
            return errorResponse(
                res,
                400,
                'Requested quantity exceeds available quantity'
            );

        const transactionId = `TXN${Date.now()}${Math.random()
            .toString(36)
            .substr(2, 5)
            .toUpperCase()}`;

        const totalAmount = quantity * pricePerUnit;

        const transaction = await Transaction.create({
            transactionId,
            crop: cropId,
            farmer: crop.farmer,
            distributor: distributorId,
            quantity,
            pricePerUnit,
            totalAmount,
            paymentMethod,
            status: 'initiated'
        });

        crop.quantity -= quantity;
        if (crop.quantity === 0) crop.status = 'sold';
        await crop.save();

        return successResponse(res, 201, 'Transaction created successfully', {
            transaction
        });
    } catch (err) {
        console.error(err);
        return errorResponse(res, 500, 'Failed to create transaction');
    }
};

// Get all transactions
export const getAllTransactions = async (req, res) => {
    try {
        const { status, farmerId, distributorId } = req.query;

        const query = {
            ...(status && { status }),
            ...(farmerId && { farmer: farmerId }),
            ...(distributorId && { distributor: distributorId })
        };

        if (req.user.role !== 'admin') {
            query.$or = [
                { farmer: req.user._id },
                { distributor: req.user._id }
            ];
        }

        const transactions = await Transaction.find(query)
            .populate('crop', 'cropType variety')
            .populate('farmer', 'name')
            .populate('distributor', 'name')
            .sort({ createdAt: -1 });

        return successResponse(res, 200, 'Transactions retrieved successfully', {
            transactions
        });
    } catch (err) {
        console.error(err);
        return errorResponse(res, 500, 'Failed to retrieve transactions');
    }
};

// Get transaction by ID
export const getTransactionById = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id)
            .populate('crop')
            .populate('farmer')
            .populate('distributor');

        if (!transaction)
            return errorResponse(res, 404, 'Transaction not found');

        const isFarmer =
            transaction.farmer._id.toString() === req.user._id.toString();
        const isDistributor =
            transaction.distributor._id.toString() === req.user._id.toString();

        if (req.user.role !== 'admin' && !isFarmer && !isDistributor)
            return errorResponse(res, 403, 'Not authorized to view this transaction');

        return successResponse(res, 200, 'Transaction retrieved successfully', {
            transaction
        });
    } catch (err) {
        console.error(err);
        return errorResponse(res, 500, 'Failed to retrieve transaction');
    }
};

// Update payment status
export const updatePaymentStatus = async (req, res) => {
    try {
        const { paymentStatus, transactionReference } = req.body;
        const transaction = await Transaction.findById(req.params.id);

        if (!transaction)
            return errorResponse(res, 404, 'Transaction not found');

        transaction.paymentStatus = paymentStatus;

        if (paymentStatus === 'paid') {
            transaction.status = 'completed';
            if (transactionReference) {
                transaction.paymentDetails = {
                    transactionReference,
                    paymentDate: new Date()
                };
            }
        }

        await transaction.save();

        return successResponse(res, 200, 'Payment status updated successfully', {
            transaction
        });
    } catch (err) {
        console.error(err);
        return errorResponse(res, 500, 'Failed to update payment status');
    }
};

// Get user's transaction summary
export const getTransactionSummary = async (req, res) => {
    try {
        const userId = req.user._id;

        const summary = await Transaction.aggregate([
            {
                $match: {
                    $or: [{ farmer: userId }, { distributor: userId }]
                }
            },
            {
                $group: {
                    _id: '$paymentStatus',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$totalAmount' }
                }
            }
        ]);

        const totalTransactions = await Transaction.countDocuments({
            $or: [{ farmer: userId }, { distributor: userId }]
        });

        return successResponse(res, 200, 'Transaction summary retrieved', {
            summary,
            totalTransactions,
            userId
        });
    } catch (err) {
        console.error(err);
        return errorResponse(res, 500, 'Failed to get transaction summary');
    }
};
