import { useDispatch, useSelector } from 'react-redux';
import { incrementPredictionCount, resetPredictionCount } from '../features/auth/authSlice';

const PREDICTION_LIMIT = 3;

/**
 * Custom hook for managing AI prediction limits
 * - Not logged in: 3 free predictions
 * - Logged in: Unlimited predictions
 */
export const usePredictionLimit = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, predictionCount } = useSelector((state) => state.auth);

  const canMakePrediction = () => {
    if (isAuthenticated) return true;
    return predictionCount < PREDICTION_LIMIT;
  };

  const usePrediction = () => {
    if (!isAuthenticated) {
      dispatch(incrementPredictionCount());
    }
  };

  const getRemainingPredictions = () => {
    if (isAuthenticated) return 'Unlimited';
    return PREDICTION_LIMIT - predictionCount;
  };

  return {
    canMakePrediction: canMakePrediction(),
    usedPredictions: predictionCount,
    remainingPredictions: getRemainingPredictions(),
    isPredictionLimitReached: !isAuthenticated && predictionCount >= PREDICTION_LIMIT,
    usePrediction,
    resetPredictionCount,
  };
};
