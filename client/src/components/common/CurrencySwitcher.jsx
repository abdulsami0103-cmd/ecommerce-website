import { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  setCurrency,
  fetchCurrencies,
  selectCurrentCurrency,
  selectAvailableCurrencies,
  selectCurrencyLoading,
} from '../../store/slices/currencySlice';

const CurrencySwitcher = ({ variant = 'dropdown', showLabel = true }) => {
  const dispatch = useDispatch();
  const currentCurrency = useSelector(selectCurrentCurrency);
  const availableCurrencies = useSelector(selectAvailableCurrencies);
  const loading = useSelector(selectCurrencyLoading);

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch currencies on mount if not loaded
  useEffect(() => {
    if (!availableCurrencies.length) {
      dispatch(fetchCurrencies());
    }
  }, [dispatch, availableCurrencies.length]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCurrencyChange = (currency) => {
    dispatch(setCurrency(currency));
    setIsOpen(false);
  };

  const currentCurr =
    availableCurrencies.find((c) => c.code === currentCurrency) ||
    availableCurrencies[0];

  if (!availableCurrencies.length) {
    return null;
  }

  // Inline buttons variant
  if (variant === 'buttons') {
    return (
      <div className="flex items-center gap-1">
        {availableCurrencies.slice(0, 4).map((currency) => (
          <button
            key={currency.code}
            onClick={() => handleCurrencyChange(currency)}
            disabled={loading}
            className={`px-2 py-1 text-sm rounded transition-colors ${
              currentCurrency === currency.code
                ? 'bg-sky-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {currency.symbol}
          </button>
        ))}
      </div>
    );
  }

  // Select variant
  if (variant === 'select') {
    return (
      <select
        value={currentCurrency}
        onChange={(e) => {
          const currency = availableCurrencies.find(
            (c) => c.code === e.target.value
          );
          if (currency) handleCurrencyChange(currency);
        }}
        disabled={loading}
        className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
      >
        {availableCurrencies.map((currency) => (
          <option key={currency.code} value={currency.code}>
            {currency.code} ({currency.symbol})
          </option>
        ))}
      </select>
    );
  }

  // Default dropdown variant
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors"
      >
        <span className="font-medium">{currentCurr?.symbol}</span>
        {showLabel && (
          <span className="hidden sm:inline">{currentCurr?.code}</span>
        )}
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[200px] max-h-[300px] overflow-y-auto">
          {availableCurrencies.map((currency) => (
            <button
              key={currency.code}
              onClick={() => handleCurrencyChange(currency)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                currentCurrency === currency.code
                  ? 'bg-sky-50 text-sky-700'
                  : 'text-gray-700'
              }`}
            >
              <span className="w-8 font-mono text-base">{currency.symbol}</span>
              <div className="flex-1 text-left">
                <div className="font-medium">{currency.code}</div>
                <div className="text-xs text-gray-500">{currency.name}</div>
              </div>
              {currentCurrency === currency.code && (
                <svg
                  className="w-4 h-4 text-sky-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CurrencySwitcher;
