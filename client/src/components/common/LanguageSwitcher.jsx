import { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  setLanguage,
  fetchUIStrings,
  selectCurrentLanguage,
  selectAvailableLanguages,
  selectLanguageLoading,
} from '../../store/slices/languageSlice';

const LanguageSwitcher = ({ variant = 'dropdown', showLabel = true }) => {
  const dispatch = useDispatch();
  const currentLanguage = useSelector(selectCurrentLanguage);
  const availableLanguages = useSelector(selectAvailableLanguages);
  const loading = useSelector(selectLanguageLoading);

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

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

  const handleLanguageChange = async (lang) => {
    dispatch(setLanguage({ code: lang.code, direction: lang.direction }));
    dispatch(fetchUIStrings(lang.code));
    setIsOpen(false);
  };

  const currentLang =
    availableLanguages.find((l) => l.code === currentLanguage) ||
    availableLanguages[0];

  if (!availableLanguages.length) {
    return null;
  }

  // Inline buttons variant
  if (variant === 'buttons') {
    return (
      <div className="flex items-center gap-1">
        {availableLanguages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang)}
            disabled={loading}
            className={`px-2 py-1 text-sm rounded transition-colors ${
              currentLanguage === lang.code
                ? 'bg-sky-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {lang.flag && <span className="mr-1">{lang.flag}</span>}
            {lang.code.toUpperCase()}
          </button>
        ))}
      </div>
    );
  }

  // Select variant
  if (variant === 'select') {
    return (
      <select
        value={currentLanguage}
        onChange={(e) => {
          const lang = availableLanguages.find((l) => l.code === e.target.value);
          if (lang) handleLanguageChange(lang);
        }}
        disabled={loading}
        className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
      >
        {availableLanguages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.nativeName}
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
        {currentLang?.flag && (
          <span className="text-lg">{currentLang.flag}</span>
        )}
        {showLabel && (
          <span className="hidden sm:inline">{currentLang?.nativeName}</span>
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
        <div className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[180px] overflow-hidden">
          {availableLanguages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                currentLanguage === lang.code
                  ? 'bg-sky-50 text-sky-700'
                  : 'text-gray-700'
              }`}
            >
              {lang.flag && <span className="text-lg">{lang.flag}</span>}
              <div className="flex-1 text-left">
                <div className="font-medium">{lang.nativeName}</div>
                {lang.name !== lang.nativeName && (
                  <div className="text-xs text-gray-500">{lang.name}</div>
                )}
              </div>
              {currentLanguage === lang.code && (
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

export default LanguageSwitcher;
