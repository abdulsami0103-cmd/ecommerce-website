import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks
export const fetchLanguages = createAsyncThunk(
  'language/fetchLanguages',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/localization/languages');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch languages'
      );
    }
  }
);

export const fetchUIStrings = createAsyncThunk(
  'language/fetchUIStrings',
  async (languageCode, { rejectWithValue }) => {
    try {
      const response = await api.get(`/localization/strings/${languageCode}`);
      return { languageCode, strings: response.data.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch UI strings'
      );
    }
  }
);

export const fetchLocalizationInit = createAsyncThunk(
  'language/fetchLocalizationInit',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/localization/init');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch localization data'
      );
    }
  }
);

// Helper to detect language from browser
const detectBrowserLanguage = () => {
  const browserLang = navigator.language || navigator.userLanguage;
  const langCode = browserLang.split('-')[0];
  return langCode;
};

// Get saved language from localStorage
const getSavedLanguage = () => {
  return localStorage.getItem('language') || detectBrowserLanguage() || 'en';
};

// Get saved direction from localStorage
const getSavedDirection = () => {
  return localStorage.getItem('languageDirection') || 'ltr';
};

const initialState = {
  current: getSavedLanguage(),
  direction: getSavedDirection(),
  available: [],
  strings: {},
  loading: false,
  stringsLoading: false,
  error: null,
  initialized: false,
};

const languageSlice = createSlice({
  name: 'language',
  initialState,
  reducers: {
    setLanguage: (state, action) => {
      const { code, direction } = action.payload;
      state.current = code;
      state.direction = direction || 'ltr';

      // Save to localStorage
      localStorage.setItem('language', code);
      localStorage.setItem('languageDirection', direction || 'ltr');

      // Update document direction
      document.documentElement.dir = direction || 'ltr';
      document.documentElement.lang = code;
    },

    setDirection: (state, action) => {
      state.direction = action.payload;
      localStorage.setItem('languageDirection', action.payload);
      document.documentElement.dir = action.payload;
    },

    setStrings: (state, action) => {
      const { languageCode, strings } = action.payload;
      state.strings[languageCode] = strings;
    },

    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch languages
      .addCase(fetchLanguages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLanguages.fulfilled, (state, action) => {
        state.loading = false;
        state.available = action.payload;

        // Set direction based on current language
        const currentLang = action.payload.find(
          (lang) => lang.code === state.current
        );
        if (currentLang) {
          state.direction = currentLang.direction;
          document.documentElement.dir = currentLang.direction;
          document.documentElement.lang = currentLang.code;
        }
      })
      .addCase(fetchLanguages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch UI strings
      .addCase(fetchUIStrings.pending, (state) => {
        state.stringsLoading = true;
      })
      .addCase(fetchUIStrings.fulfilled, (state, action) => {
        state.stringsLoading = false;
        const { languageCode, strings } = action.payload;
        state.strings[languageCode] = strings;
      })
      .addCase(fetchUIStrings.rejected, (state, action) => {
        state.stringsLoading = false;
        state.error = action.payload;
      })

      // Fetch localization init
      .addCase(fetchLocalizationInit.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLocalizationInit.fulfilled, (state, action) => {
        state.loading = false;
        state.initialized = true;

        if (action.payload.languages) {
          state.available = action.payload.languages;
        }

        if (action.payload.currentLanguage) {
          state.current = action.payload.currentLanguage.code;
          state.direction = action.payload.currentLanguage.direction;
          document.documentElement.dir = action.payload.currentLanguage.direction;
          document.documentElement.lang = action.payload.currentLanguage.code;
        }

        if (action.payload.strings) {
          state.strings[state.current] = action.payload.strings;
        }
      })
      .addCase(fetchLocalizationInit.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.initialized = true; // Mark as initialized even on error
      });
  },
});

export const { setLanguage, setDirection, setStrings, clearError } =
  languageSlice.actions;

// Selectors
export const selectCurrentLanguage = (state) => state.language.current;
export const selectDirection = (state) => state.language.direction;
export const selectAvailableLanguages = (state) => state.language.available;
export const selectUIStrings = (state, langCode) =>
  state.language.strings[langCode || state.language.current] || {};
export const selectLanguageLoading = (state) => state.language.loading;
export const selectLanguageInitialized = (state) => state.language.initialized;

// Selector for getting a specific translation string
export const selectTranslation = (state, key, fallback = '') => {
  const currentLang = state.language.current;
  const strings = state.language.strings[currentLang] || {};

  // Support nested keys like 'common.loading'
  const keys = key.split('.');
  let value = strings;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return fallback || key;
    }
  }

  return typeof value === 'string' ? value : fallback || key;
};

export default languageSlice.reducer;
