import { useDispatch, useSelector } from 'react-redux';
import { fetchPrices } from '../features/prices/priceSlice';

/**
 * Custom hook for managing price data
 */
export const usePriceData = () => {
  const dispatch = useDispatch();
  const { data, loading, error } = useSelector((state) => state.prices);

  const loadPrices = (params) => {
    dispatch(fetchPrices(params));
  };

  return {
    prices: data,
    loading,
    error,
    loadPrices,
  };
};
