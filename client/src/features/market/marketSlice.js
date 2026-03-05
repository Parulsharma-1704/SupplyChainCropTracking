import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  selectedRegion: 'all',
  searchTerm: '',
  filteredData: [],
};

const marketSlice = createSlice({
  name: 'market',
  initialState,
  reducers: {
    setSelectedRegion: (state, action) => {
      state.selectedRegion = action.payload;
    },
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
    },
    setFilteredData: (state, action) => {
      state.filteredData = action.payload;
    },
  },
});

export const { setSelectedRegion, setSearchTerm, setFilteredData } = marketSlice.actions;
export default marketSlice.reducer;
