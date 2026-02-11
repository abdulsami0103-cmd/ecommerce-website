import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

// Icons
const CurrencyIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PlusIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const RefreshIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const PencilIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

const TrashIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const ChartIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const CheckCircleIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const GlobeIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ArrowsIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
);

const getAvatarColor = (index) => {
  const colors = [
    'bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-pink-500',
    'bg-orange-500', 'bg-teal-500', 'bg-indigo-500', 'bg-rose-500'
  ];
  return colors[index % colors.length];
};

const CurrencyManager = () => {
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [rateHistory, setRateHistory] = useState(null);
  const [fetchingRates, setFetchingRates] = useState(false);

  useEffect(() => {
    fetchCurrencies();
  }, []);

  const fetchCurrencies = async () => {
    try {
      setLoading(true);
      const response = await api.get('/localization/currencies');
      setCurrencies(response.data.data);
    } catch (error) {
      console.error('Failed to fetch currencies:', error);
      toast.error('Failed to load currencies');
    } finally {
      setLoading(false);
    }
  };

  const fetchExchangeRates = async () => {
    try {
      setFetchingRates(true);
      const response = await api.post('/localization/admin/currencies/fetch-rates');
      if (response.data.data?.success) {
        toast.success(`Updated ${response.data.data.updated} exchange rates`);
        fetchCurrencies();
      } else {
        toast.error(response.data.data?.error || 'Failed to fetch rates');
      }
    } catch (error) {
      console.error('Failed to fetch rates:', error);
      toast.error('Failed to fetch exchange rates');
    } finally {
      setFetchingRates(false);
    }
  };

  const viewRateHistory = async (currency) => {
    try {
      const response = await api.get(`/localization/admin/currencies/${currency.code}/history?days=30`);
      setRateHistory({
        currency,
        ...response.data.data,
      });
    } catch (error) {
      console.error('Failed to fetch rate history:', error);
      toast.error('Failed to load rate history');
    }
  };

  const deleteCurrency = async (id) => {
    if (!confirm('Are you sure you want to delete this currency?')) return;

    try {
      await api.delete(`/localization/admin/currencies/${id}`);
      toast.success('Currency deleted');
      fetchCurrencies();
    } catch (error) {
      console.error('Failed to delete currency:', error);
      toast.error(error.response?.data?.message || 'Failed to delete currency');
    }
  };

  const stats = {
    total: currencies.length,
    active: currencies.filter(c => c.isActive).length,
    base: currencies.find(c => c.isBaseCurrency)?.code || 'USD',
    default: currencies.find(c => c.isDefault)?.code || 'USD'
  };

  if (loading && currencies.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-3 sm:py-8 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-3 sm:mb-8">
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-emerald-600">Currency Manager</h1>
            <p className="text-xs sm:text-base text-gray-500">Manage currencies & rates</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchExchangeRates}
              disabled={fetchingRates}
              className="flex items-center gap-1 px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshIcon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${fetchingRates ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{fetchingRates ? 'Fetching...' : 'Fetch Rates'}</span>
              <span className="sm:hidden">{fetchingRates ? '...' : 'Rates'}</span>
            </button>
            <button
              onClick={() => { setSelectedCurrency(null); setShowModal(true); }}
              className="flex items-center gap-1 px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
            >
              <PlusIcon className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Add Currency</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-3 sm:mb-8">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-3 sm:p-4 border border-gray-100">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="w-9 h-9 sm:w-12 sm:h-12 bg-emerald-100 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
                <CurrencyIcon className="w-4 h-4 sm:w-6 sm:h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] sm:text-sm text-gray-500">Total</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-800">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-3 sm:p-4 border border-gray-100">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="w-9 h-9 sm:w-12 sm:h-12 bg-blue-100 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
                <CheckCircleIcon className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-[10px] sm:text-sm text-gray-500">Active</p>
                <p className="text-lg sm:text-2xl font-bold text-blue-600">{stats.active}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-3 sm:p-4 border border-gray-100">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="w-9 h-9 sm:w-12 sm:h-12 bg-purple-100 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
                <GlobeIcon className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-[10px] sm:text-sm text-gray-500">Base</p>
                <p className="text-lg sm:text-2xl font-bold text-purple-600">{stats.base}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-3 sm:p-4 border border-gray-100">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="w-9 h-9 sm:w-12 sm:h-12 bg-orange-100 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
                <ChartIcon className="w-4 h-4 sm:w-6 sm:h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-[10px] sm:text-sm text-gray-500">Default</p>
                <p className="text-lg sm:text-2xl font-bold text-orange-600">{stats.default}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Currencies Table */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-3 sm:mb-8">
          <div className="px-3 py-2 sm:p-6 border-b border-gray-100">
            <h2 className="text-sm sm:text-lg font-semibold text-gray-800">All Currencies</h2>
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-emerald-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-emerald-700 uppercase tracking-wider">Currency</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-emerald-700 uppercase tracking-wider">Symbol</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-emerald-700 uppercase tracking-wider">Exchange Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-emerald-700 uppercase tracking-wider">Last Updated</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-emerald-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-emerald-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto"></div>
                    </td>
                  </tr>
                ) : currencies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CurrencyIcon className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500">No currencies found</p>
                    </td>
                  </tr>
                ) : (
                  currencies.map((currency, index) => (
                    <tr key={currency._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 ${getAvatarColor(index)} rounded-full flex items-center justify-center text-white font-bold`}>
                            {currency.code[0]}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{currency.name}</p>
                            <code className="text-sm text-gray-500">{currency.code}</code>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xl font-medium text-gray-800">{currency.symbol}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          ({currency.symbolPosition === 'before' ? 'prefix' : 'suffix'})
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-mono font-medium text-gray-800">
                            {currency.isBaseCurrency ? '1.00 (Base)' : currency.exchangeRate?.toFixed(4)}
                          </p>
                          <p className="text-xs text-gray-500">
                            1 USD = {currency.exchangeRate} {currency.code}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {currency.lastRateUpdate
                          ? new Date(currency.lastRateUpdate).toLocaleString()
                          : 'Never'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {currency.isBaseCurrency && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                              Base
                            </span>
                          )}
                          {currency.isDefault && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                              Default
                            </span>
                          )}
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            currency.isActive
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {currency.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setSelectedCurrency(currency); setShowModal(true); }}
                            className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => viewRateHistory(currency)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <ChartIcon className="w-4 h-4" />
                          </button>
                          {!currency.isBaseCurrency && !currency.isDefault && (
                            <button
                              onClick={() => deleteCurrency(currency._id)}
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="sm:hidden">
            {loading ? (
              <div className="py-8 text-center">
                <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto"></div>
              </div>
            ) : currencies.length === 0 ? (
              <div className="py-6 text-center">
                <CurrencyIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-500">No currencies found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {currencies.map((currency, index) => (
                  <div key={currency._id} className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 ${getAvatarColor(index)} rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                        {currency.code[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-gray-800 truncate">{currency.name}</span>
                          <code className="text-[10px] text-gray-500">{currency.code}</code>
                          <span className="text-sm font-medium text-gray-700">{currency.symbol}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-mono text-gray-600">
                            {currency.isBaseCurrency ? '1.00 (Base)' : `Rate: ${currency.exchangeRate?.toFixed(4)}`}
                          </span>
                          {currency.isBaseCurrency && (
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-purple-100 text-purple-700">Base</span>
                          )}
                          {currency.isDefault && (
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-blue-100 text-blue-700">Default</span>
                          )}
                          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-medium ${
                            currency.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {currency.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => { setSelectedCurrency(currency); setShowModal(true); }}
                          className="p-1.5 text-gray-400 hover:text-emerald-600 rounded-lg"
                        >
                          <PencilIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => viewRateHistory(currency)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg"
                        >
                          <ChartIcon className="w-3.5 h-3.5" />
                        </button>
                        {!currency.isBaseCurrency && !currency.isDefault && (
                          <button
                            onClick={() => deleteCurrency(currency._id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Currency Converter */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-3 sm:p-6 border border-gray-100">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-6">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-100 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
              <ArrowsIcon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
            </div>
            <h2 className="text-sm sm:text-lg font-semibold text-gray-800">Currency Converter</h2>
          </div>
          <CurrencyConverter currencies={currencies} />
        </div>

        {/* Currency Modal */}
        {showModal && (
          <CurrencyModal
            currency={selectedCurrency}
            onClose={() => { setShowModal(false); setSelectedCurrency(null); }}
            onSave={() => {
              setShowModal(false);
              setSelectedCurrency(null);
              fetchCurrencies();
            }}
          />
        )}

        {/* Rate History Modal */}
        {rateHistory && (
          <RateHistoryModal
            data={rateHistory}
            onClose={() => setRateHistory(null)}
          />
        )}
      </div>
    </div>
  );
};

// Currency Converter Component
const CurrencyConverter = ({ currencies }) => {
  const [amount, setAmount] = useState(100);
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('PKR');
  const [result, setResult] = useState(null);

  const convert = async () => {
    try {
      const response = await api.get(
        `/localization/currencies/convert?amount=${amount}&from=${fromCurrency}&to=${toCurrency}`
      );
      setResult(response.data.data);
    } catch (error) {
      console.error('Failed to convert:', error);
      toast.error('Failed to convert currency');
    }
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-end sm:gap-4">
        <div className="sm:w-32">
          <label className="block text-[10px] sm:text-sm font-medium text-gray-700 mb-1">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-2 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
        <div className="sm:w-32">
          <label className="block text-[10px] sm:text-sm font-medium text-gray-700 mb-1">From</label>
          <select
            value={fromCurrency}
            onChange={(e) => setFromCurrency(e.target.value)}
            className="w-full px-2 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            {currencies.map((c) => (
              <option key={c.code} value={c.code}>{c.code}</option>
            ))}
          </select>
        </div>
        <div className="sm:w-32">
          <label className="block text-[10px] sm:text-sm font-medium text-gray-700 mb-1">To</label>
          <select
            value={toCurrency}
            onChange={(e) => setToCurrency(e.target.value)}
            className="w-full px-2 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            {currencies.map((c) => (
              <option key={c.code} value={c.code}>{c.code}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2 sm:mt-3">
        <button
          onClick={convert}
          className="px-4 py-1.5 sm:px-6 sm:py-2 text-xs sm:text-sm bg-emerald-500 text-white rounded-lg sm:rounded-xl hover:bg-emerald-600 transition-colors"
        >
          Convert
        </button>
        {result && (
          <div className="bg-emerald-50 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl border border-emerald-100">
            <span className="text-[10px] sm:text-sm text-gray-600">{result.original} {result.from} = </span>
            <span className="text-sm sm:text-xl font-bold text-emerald-600">{result.formatted}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Currency Modal
const CurrencyModal = ({ currency, onClose, onSave }) => {
  const [form, setForm] = useState({
    code: currency?.code || '',
    name: currency?.name || '',
    symbol: currency?.symbol || '',
    symbolPosition: currency?.symbolPosition || 'before',
    decimalPlaces: currency?.decimalPlaces ?? 2,
    decimalSeparator: currency?.decimalSeparator || '.',
    thousandSeparator: currency?.thousandSeparator || ',',
    exchangeRate: currency?.exchangeRate || 1,
    isActive: currency?.isActive ?? true,
    isDefault: currency?.isDefault ?? false,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      if (currency) {
        await api.put(`/localization/admin/currencies/${currency._id}`, form);
        toast.success('Currency updated');
      } else {
        await api.post('/localization/admin/currencies', form);
        toast.success('Currency created');
      }
      onSave();
    } catch (error) {
      console.error('Failed to save currency:', error);
      toast.error(error.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />

        <div className="relative inline-block w-full max-w-md bg-white rounded-2xl shadow-xl text-left overflow-hidden transform transition-all sm:my-8">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800">
              {currency ? 'Edit Currency' : 'Add Currency'}
            </h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                <input
                  type="text"
                  maxLength={3}
                  placeholder="USD"
                  value={form.code}
                  onChange={(e) => setForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  disabled={!!currency}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Symbol *</label>
                <input
                  type="text"
                  maxLength={5}
                  placeholder="$"
                  value={form.symbol}
                  onChange={(e) => setForm(prev => ({ ...prev, symbol: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                placeholder="US Dollar"
                value={form.name}
                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Symbol Position</label>
                <select
                  value={form.symbolPosition}
                  onChange={(e) => setForm(prev => ({ ...prev, symbolPosition: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="before">Before ($100)</option>
                  <option value="after">After (100$)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Decimal Places</label>
                <input
                  type="number"
                  min={0}
                  max={4}
                  value={form.decimalPlaces}
                  onChange={(e) => setForm(prev => ({ ...prev, decimalPlaces: parseInt(e.target.value) }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Decimal Separator</label>
                <input
                  type="text"
                  maxLength={1}
                  value={form.decimalSeparator}
                  onChange={(e) => setForm(prev => ({ ...prev, decimalSeparator: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thousand Separator</label>
                <input
                  type="text"
                  maxLength={1}
                  value={form.thousandSeparator}
                  onChange={(e) => setForm(prev => ({ ...prev, thousandSeparator: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Exchange Rate (to USD)</label>
              <input
                type="number"
                step="0.0001"
                min={0}
                value={form.exchangeRate}
                onChange={(e) => setForm(prev => ({ ...prev, exchangeRate: parseFloat(e.target.value) }))}
                disabled={currency?.isBaseCurrency}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">1 USD = {form.exchangeRate} {form.code}</p>
            </div>
            <div className="flex gap-4 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) => setForm(prev => ({ ...prev, isDefault: e.target.checked }))}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700">Default</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 justify-end p-6 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Rate History Modal
const RateHistoryModal = ({ data, onClose }) => {
  const { currency, stats, dailyAverages } = data;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />

        <div className="relative inline-block w-full max-w-2xl bg-white rounded-2xl shadow-xl text-left overflow-hidden transform transition-all sm:my-8">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800">{currency.code} Rate History</h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Min Rate</p>
                  <p className="text-lg font-bold text-gray-800">{stats.minRate}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Max Rate</p>
                  <p className="text-lg font-bold text-gray-800">{stats.maxRate}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Avg Rate</p>
                  <p className="text-lg font-bold text-gray-800">{stats.avgRate}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">30-Day Change</p>
                  <p className={`text-lg font-bold ${
                    stats.periodChange >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {stats.periodChange >= 0 ? '+' : ''}{stats.periodChange}%
                  </p>
                </div>
              </div>
            )}

            {/* Daily Averages */}
            {dailyAverages && dailyAverages.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-800 mb-3">Daily Rates (Last 30 Days)</h4>
                <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-100">
                  <table className="w-full text-sm">
                    <thead className="bg-emerald-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-emerald-700">Date</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-700">Avg</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-700">Min</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-emerald-700">Max</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {dailyAverages.map((day) => (
                        <tr key={day.date} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-600">{day.date}</td>
                          <td className="px-4 py-2 text-right font-mono font-medium text-gray-800">{day.avgRate}</td>
                          <td className="px-4 py-2 text-right font-mono text-gray-500">{day.minRate}</td>
                          <td className="px-4 py-2 text-right font-mono text-gray-500">{day.maxRate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {(!dailyAverages || dailyAverages.length === 0) && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ChartIcon className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500">No rate history available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrencyManager;
