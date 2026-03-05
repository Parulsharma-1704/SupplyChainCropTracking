import { configureStore } from '@reduxjs/toolkit';
import authSlice from '../features/auth/authSlice';
import priceSlice from '../features/prices/priceSlice';
import marketSlice from '../features/market/marketSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    prices: priceSlice,
    market: marketSlice,
  },
});

export default store;
