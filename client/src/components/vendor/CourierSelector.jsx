import { useState, useEffect } from 'react';
import orderService from '../../services/orderService';

/**
 * CourierSelector - Compare and select shipping couriers
 */

const TruckIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
  </svg>
);

const CheckIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
  </div>
);

const courierLogos = {
  tcs: '/images/couriers/tcs.png',
  leopards: '/images/couriers/leopards.png',
  postex: '/images/couriers/postex.png',
  manual: null,
};

const CourierSelector = ({
  subOrderId,
  weight = 0.5,
  dimensions = { length: 20, width: 15, height: 10 },
  selectedCourier,
  onSelect,
  showRates = true,
}) => {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (showRates && subOrderId) {
      fetchRates();
    }
  }, [subOrderId, weight, dimensions, showRates]);

  const fetchRates = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await orderService.getSubOrderShippingRates(subOrderId, {
        weight,
        dimensions,
      });
      setRates(response);
    } catch (err) {
      console.error('Error fetching rates:', err);
      setError('Failed to fetch shipping rates');
      // Set default options if rate fetch fails
      setRates([
        { courier: 'tcs', courierName: 'TCS Courier', rate: null, estimatedDays: '2-3' },
        { courier: 'leopards', courierName: 'Leopards Courier', rate: null, estimatedDays: '2-4' },
        { courier: 'postex', courierName: 'PostEx', rate: null, estimatedDays: '3-5' },
        { courier: 'manual', courierName: 'Manual Shipping', rate: 0, estimatedDays: null },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return 'N/A';
    return `PKR ${amount.toLocaleString()}`;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
          {error}. Showing available couriers.
        </div>
      )}

      {rates.length === 0 ? (
        <div className="text-center py-4 text-gray-500">
          No shipping options available
        </div>
      ) : (
        <div className="grid gap-3">
          {rates.map((option) => {
            const isSelected = selectedCourier === option.courier;

            return (
              <button
                key={option.courier}
                type="button"
                onClick={() => onSelect(option)}
                className={`
                  relative flex items-center gap-4 p-4 rounded-lg border-2 transition-all text-left
                  ${isSelected
                    ? 'border-sky-500 bg-sky-50 ring-2 ring-sky-200'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                  }
                `}
              >
                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-sky-500 rounded-full flex items-center justify-center">
                    <CheckIcon className="w-4 h-4 text-white" />
                  </div>
                )}

                {/* Logo */}
                <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                  {option.logo || courierLogos[option.courier] ? (
                    <img
                      src={option.logo || courierLogos[option.courier]}
                      alt={option.courierName}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <TruckIcon className={`w-6 h-6 text-gray-400 ${option.logo || courierLogos[option.courier] ? 'hidden' : ''}`} />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className={`font-medium ${isSelected ? 'text-sky-700' : 'text-gray-900'}`}>
                      {option.courierName}
                    </h4>
                    {option.serviceType && option.serviceType !== 'Manual entry' && (
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                        {option.serviceType}
                      </span>
                    )}
                  </div>
                  {option.estimatedDays && (
                    <p className="text-sm text-gray-500 mt-0.5">
                      Delivery in {option.estimatedDays} days
                    </p>
                  )}
                  {option.courier === 'manual' && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Enter tracking details manually
                    </p>
                  )}
                </div>

                {/* Price */}
                <div className="text-right flex-shrink-0">
                  {option.courier === 'manual' ? (
                    <span className="text-sm text-gray-500">Free</span>
                  ) : (
                    <span className={`font-semibold ${isSelected ? 'text-sky-700' : 'text-gray-900'}`}>
                      {formatCurrency(option.rate)}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Refresh button */}
      {showRates && (
        <button
          type="button"
          onClick={fetchRates}
          disabled={loading}
          className="text-sm text-sky-600 hover:text-sky-700 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh rates
        </button>
      )}
    </div>
  );
};

export default CourierSelector;
