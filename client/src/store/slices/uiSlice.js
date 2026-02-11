import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  sidebarOpen: false,
  cartOpen: false,
  searchOpen: false,
  language: localStorage.getItem('language') || 'en',
  currency: localStorage.getItem('currency') || 'USD',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    toggleCart: (state) => {
      state.cartOpen = !state.cartOpen;
    },
    setCartOpen: (state, action) => {
      state.cartOpen = action.payload;
    },
    toggleSearch: (state) => {
      state.searchOpen = !state.searchOpen;
    },
    setLanguage: (state, action) => {
      state.language = action.payload;
      localStorage.setItem('language', action.payload);
    },
    setCurrency: (state, action) => {
      state.currency = action.payload;
      localStorage.setItem('currency', action.payload);
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  toggleCart,
  setCartOpen,
  toggleSearch,
  setLanguage,
  setCurrency,
} = uiSlice.actions;

export default uiSlice.reducer;
