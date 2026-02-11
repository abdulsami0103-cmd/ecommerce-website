import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Fallback currency data (used if API is unavailable)
const fallbackCurrencies = [
  { code: 'USD', name: 'US Dollar', symbol: '$', exchangeRate: 1, decimalPlaces: 2, symbolPosition: 'before' },
  { code: 'EUR', name: 'Euro', symbol: '€', exchangeRate: 0.92, decimalPlaces: 2, symbolPosition: 'before' },
  { code: 'GBP', name: 'British Pound', symbol: '£', exchangeRate: 0.79, decimalPlaces: 2, symbolPosition: 'before' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: 'Rs.', exchangeRate: 278.5, decimalPlaces: 0, symbolPosition: 'before' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', exchangeRate: 83.12, decimalPlaces: 2, symbolPosition: 'before' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', exchangeRate: 3.67, decimalPlaces: 2, symbolPosition: 'after' },
];

// Async thunks
export const fetchCurrencies = createAsyncThunk(
  'currency/fetchCurrencies',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/localization/currencies');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch currencies'
      );
    }
  }
);

export const convertCurrency = createAsyncThunk(
  'currency/convert',
  async ({ amount, from, to }, { rejectWithValue }) => {
    try {
      const response = await api.get('/localization/currencies/convert', {
        params: { amount, from, to },
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to convert currency'
      );
    }
  }
);

export const detectCurrency = createAsyncThunk(
  'currency/detect',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/localization/currencies/detect');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to detect currency'
      );
    }
  }
);

// Get saved currency from localStorage (default to PKR)
const getSavedCurrency = () => {
  return localStorage.getItem('currency') || 'PKR';
};

// Default PKR currency for fallback
const defaultPKRCurrency = {
  code: 'PKR',
  name: 'Pakistani Rupee',
  symbol: 'Rs.',
  exchangeRate: 1,
  decimalPlaces: 2,
  symbolPosition: 'before',
};

const initialState = {
  current: getSavedCurrency(),
  currentCurrency: defaultPKRCurrency, // Default to PKR instead of null
  available: fallbackCurrencies,
  loading: false,
  error: null,
  conversionResult: null,
  conversionLoading: false,
};

const currencySlice = createSlice({
  name: 'currency',
  initialState,
  reducers: {
    setCurrency: (state, action) => {
      const currency =
        typeof action.payload === 'string'
          ? state.available.find((c) => c.code === action.payload)
          : action.payload;

      if (currency) {
        state.current = currency.code;
        state.currentCurrency = currency;
        localStorage.setItem('currency', currency.code);
      }
    },

    clearConversionResult: (state) => {
      state.conversionResult = null;
    },

    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch currencies
      .addCase(fetchCurrencies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrencies.fulfilled, (state, action) => {
        state.loading = false;

        // Use fallback if API returns empty array
        const currencies = action.payload?.length > 0 ? action.payload : fallbackCurrencies;
        state.available = currencies;

        // Set current currency details
        const current = currencies.find((c) => c.code === state.current);
        if (current) {
          state.currentCurrency = current;
        } else {
          // Default to PKR or first available
          const defaultCurrency =
            currencies.find((c) => c.code === 'PKR') || currencies[0];
          state.current = defaultCurrency.code;
          state.currentCurrency = defaultCurrency;
        }
      })
      .addCase(fetchCurrencies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // Use fallback currencies
        state.available = fallbackCurrencies;
        const current = fallbackCurrencies.find((c) => c.code === state.current);
        if (current) {
          state.currentCurrency = current;
        }
      })

      // Convert currency
      .addCase(convertCurrency.pending, (state) => {
        state.conversionLoading = true;
      })
      .addCase(convertCurrency.fulfilled, (state, action) => {
        state.conversionLoading = false;
        state.conversionResult = action.payload;
      })
      .addCase(convertCurrency.rejected, (state, action) => {
        state.conversionLoading = false;
        state.error = action.payload;
      })

      // Detect currency
      .addCase(detectCurrency.fulfilled, (state, action) => {
        if (action.payload && !localStorage.getItem('currency')) {
          state.current = action.payload.code;
          state.currentCurrency = action.payload;
          localStorage.setItem('currency', action.payload.code);
        }
      });
  },
});

export const { setCurrency, clearConversionResult, clearError } =
  currencySlice.actions;

// Selectors
export const selectCurrentCurrency = (state) => state.currency.current;
export const selectCurrentCurrencyDetails = (state) =>
  state.currency.currentCurrency;
export const selectAvailableCurrencies = (state) => state.currency.available;
export const selectCurrencyLoading = (state) => state.currency.loading;
export const selectConversionResult = (state) => state.currency.conversionResult;

// Helper selector to get currency by code
export const selectCurrencyByCode = (state, code) =>
  state.currency.available.find((c) => c.code === code);

// Price conversion helper (client-side)
export const convertPrice = (priceInUSD, targetCurrency, currencies) => {
  const currency = currencies.find((c) => c.code === targetCurrency);
  if (!currency) return priceInUSD;
  return (priceInUSD * currency.exchangeRate).toFixed(2);
};

// Price formatting helper
export const formatPrice = (amount, currency) => {
  const numAmount = Number(amount) || 0;

  // Default fallback to PKR when currency is not loaded
  if (!currency) {
    return `Rs. ${numAmount.toLocaleString()}`;
  }

  const formatted = numAmount.toLocaleString(undefined, {
    minimumFractionDigits: currency.decimalPlaces || 2,
    maximumFractionDigits: currency.decimalPlaces || 2,
  });

  const symbol = currency.symbol || 'Rs.';
  const { symbolPosition } = currency;

  if (symbolPosition === 'after') {
    return `${formatted} ${symbol}`;
  }

  // Handle currencies with space after symbol
  if (['PKR', 'INR'].includes(currency.code)) {
    return `${symbol} ${formatted}`;
  }

  return `${symbol}${formatted}`;
};

export default currencySlice.reducer;
