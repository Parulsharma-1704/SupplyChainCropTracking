import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  predictionCount: parseInt(localStorage.getItem('predictionCount') || '0'),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    setToken: (state, action) => {
      state.token = action.payload;
      localStorage.setItem('token', action.payload);
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
    },
    incrementPredictionCount: (state) => {
      if (!state.isAuthenticated) {
        state.predictionCount += 1;
        localStorage.setItem('predictionCount', state.predictionCount);
      }
    },
    resetPredictionCount: (state) => {
      state.predictionCount = 0;
      localStorage.removeItem('predictionCount');
    },
  },
});

export const { setUser, setToken, logout, incrementPredictionCount, resetPredictionCount } = authSlice.actions;
export default authSlice.reducer;
