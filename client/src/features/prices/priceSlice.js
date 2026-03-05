import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { axiosInstance } from '../../services/axiosInstance';

export const fetchPrices = createAsyncThunk(
  'prices/fetchPrices',
  async (params = {}, { rejectWithValue }) => {
    try {
      const queryStr = new URLSearchParams(params).toString();
      const response = await axiosInstance.get(`/prices?${queryStr}`);
      return response.data.data?.prices || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch prices');
    }
  }
);

const initialState = {
  data: [],
  loading: false,
  error: null,
};

const priceSlice = createSlice({
  name: 'prices',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPrices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPrices.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchPrices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = priceSlice.actions;
export default priceSlice.reducer;
