import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import cartReducer from './slices/cartSlice';
import productReducer from './slices/productSlice';
import uiReducer from './slices/uiSlice';
import currencyReducer from './slices/currencySlice';
import languageReducer from './slices/languageSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    products: productReducer,
    ui: uiReducer,
    currency: currencyReducer,
    language: languageReducer,
  },
  devTools: import.meta.env.DEV,
});

export default store;
