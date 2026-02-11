import { createSlice } from '@reduxjs/toolkit';

// Get cart from localStorage
const cartItems = JSON.parse(localStorage.getItem('cart')) || [];

const calculateTotals = (items) => {
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  return {
    subtotal,
    shipping: subtotal > 100 ? 0 : 10,
    tax: subtotal * 0.1,
    total: subtotal + (subtotal > 100 ? 0 : 10) + subtotal * 0.1,
  };
};

const initialState = {
  items: cartItems,
  ...calculateTotals(cartItems),
  coupon: null,
  discount: 0,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const { product, quantity = 1, variant } = action.payload;
      const existingIndex = state.items.findIndex(
        (item) =>
          item.product === product._id &&
          item.variant === variant
      );

      if (existingIndex >= 0) {
        state.items[existingIndex].quantity += quantity;
      } else {
        state.items.push({
          product: product._id,
          name: product.name,
          image: product.images?.[0] || '',
          price: product.price.amount,
          quantity,
          variant,
          vendor: product.vendor?._id || product.vendor,
          vendorName: product.vendor?.storeName || '',
          maxQuantity: product.inventory?.quantity || 999,
        });
      }

      const totals = calculateTotals(state.items);
      Object.assign(state, totals);
      localStorage.setItem('cart', JSON.stringify(state.items));
    },

    removeFromCart: (state, action) => {
      const { productId, variant } = action.payload;
      state.items = state.items.filter(
        (item) =>
          !(item.product === productId && item.variant === variant)
      );

      const totals = calculateTotals(state.items);
      Object.assign(state, totals);
      localStorage.setItem('cart', JSON.stringify(state.items));
    },

    updateQuantity: (state, action) => {
      const { productId, variant, quantity } = action.payload;
      const item = state.items.find(
        (item) =>
          item.product === productId && item.variant === variant
      );

      if (item) {
        item.quantity = Math.max(1, Math.min(quantity, item.maxQuantity));
      }

      const totals = calculateTotals(state.items);
      Object.assign(state, totals);
      localStorage.setItem('cart', JSON.stringify(state.items));
    },

    applyCoupon: (state, action) => {
      state.coupon = action.payload.code;
      state.discount = action.payload.discount;
      state.total = state.subtotal + state.shipping + state.tax - state.discount;
    },

    removeCoupon: (state) => {
      state.coupon = null;
      state.discount = 0;
      state.total = state.subtotal + state.shipping + state.tax;
    },

    clearCart: (state) => {
      state.items = [];
      state.subtotal = 0;
      state.shipping = 0;
      state.tax = 0;
      state.total = 0;
      state.coupon = null;
      state.discount = 0;
      localStorage.removeItem('cart');
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  applyCoupon,
  removeCoupon,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;
