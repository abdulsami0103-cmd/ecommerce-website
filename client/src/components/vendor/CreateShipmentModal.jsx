import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

/**
 * CreateShipmentModal - Create partial or full shipment for an order
 */

const PackageIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const TruckIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
  </svg>
);

const couriers = [
  { code: 'manual', name: 'Manual Entry', logo: null },
  { code: 'tcs', name: 'TCS Express', logo: '/couriers/tcs.png' },
  { code: 'leopards', name: 'Leopards Courier', logo: '/couriers/leopards.png' },
  { code: 'postex', name: 'PostEx', logo: '/couriers/postex.png' },
  { code: 'blueex', name: 'BlueEx', logo: '/couriers/blueex.png' },
  { code: 'trax', name: 'Trax', logo: '/couriers/trax.png' },
];

const CreateShipmentModal = ({
  isOpen,
  onClose,
  order,
  onShipmentCreated,
}) => {
  const [selectedItems, setSelectedItems] = useState({});
  const [courierCode, setCourierCode] = useState('manual');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [weight, setWeight] = useState('');
  const [dimensions, setDimensions] = useState({ length: '', width: '', height: '' });
  const [isCOD, setIsCOD] = useState(false);
  const [codAmount, setCodAmount] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [generateLabel, setGenerateLabel] = useState(true);
  const [loading, setLoading] = useState(false);
  const [rates, setRates] = useState([]);
  const [loadingRates, setLoadingRates] = useState(false);

  // Initialize selected items with unfulfilled quantities
  useEffect(() => {
    if (order?.items) {
      const initial = {};
      order.items.forEach(item => {
        const remaining = item.quantity - (item.fulfilledQuantity || 0);
        if (remaining > 0) {
          initial[item._id] = remaining;
        }
      });
      setSelectedItems(initial);
    }
  }, [order]);

  // Fetch shipping rates when courier changes (if not manual)
  useEffect(() => {
    if (courierCode !== 'manual' && order?.shippingAddress?.city) {
      fetchRates();
    }
  }, [courierCode, weight]);

  const fetchRates = async () => {
    if (!weight || parseFloat(weight) <= 0) return;

    setLoadingRates(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/shipments/rates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          origin: order.vendor?.city || 'Karachi',
          destination: order.shippingAddress?.city,
          weight: parseFloat(weight),
          isCOD,
          codAmount: isCOD ? parseFloat(codAmount) : 0,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setRates(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch rates:', error);
    } finally {
      setLoadingRates(false);
    }
  };

  const handleItemQuantityChange = (itemId, value) => {
    const item = order.items.find(i => i._id === itemId);
    const maxQty = item.quantity - (item.fulfilledQuantity || 0);
    const qty = Math.min(Math.max(0, parseInt(value) || 0), maxQty);

    setSelectedItems(prev => ({
      ...prev,
      [itemId]: qty,
    }));
  };

  const handleSelectAll = () => {
    const allItems = {};
    order.items.forEach(item => {
      const remaining = item.quantity - (item.fulfilledQuantity || 0);
      if (remaining > 0) {
        allItems[item._id] = remaining;
      }
    });
    setSelectedItems(allItems);
  };

  const handleClearAll = () => {
    setSelectedItems({});
  };

  const getSelectedItemsCount = () => {
    return Object.values(selectedItems).reduce((sum, qty) => sum + qty, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const itemsToShip = Object.entries(selectedItems)
      .filter(([_, qty]) => qty > 0)
      .map(([itemId, quantity]) => ({ itemId, quantity }));

    if (itemsToShip.length === 0) {
      toast.error('Please select at least one item to ship');
      return;
    }

    if (courierCode === 'manual' && !trackingNumber) {
      toast.error('Please enter a tracking number for manual shipment');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/vendor/suborders/${order._id}/shipments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: itemsToShip,
          courierCode,
          trackingNumber: courierCode === 'manual' ? trackingNumber : undefined,
          weight: parseFloat(weight) || 0,
          dimensions: {
            length: parseFloat(dimensions.length) || 0,
            width: parseFloat(dimensions.width) || 0,
            height: parseFloat(dimensions.height) || 0,
          },
          isCOD,
          codAmount: isCOD ? parseFloat(codAmount) : 0,
          specialInstructions,
          generateLabel: courierCode !== 'manual' && generateLabel,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Shipment created successfully');
        const shipment = data.shipment || data.data || data;
        if (shipment?.trackingNumber) {
          toast.success(`Tracking: ${shipment.trackingNumber}`);
        }
        onShipmentCreated?.(shipment);
        onClose();
      } else {
        toast.error(data.message || 'Failed to create shipment');
      }
    } catch (error) {
      toast.error('Failed to create shipment');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !order) return null;

  const unfulfilledItems = order.items?.filter(
    item => (item.quantity - (item.fulfilledQuantity || 0)) > 0
  ) || [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-100 rounded-lg">
              <PackageIcon className="w-6 h-6 text-sky-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Create Shipment</h2>
              <p className="text-sm text-gray-500">Order #{order.subOrderNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Items Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Select Items to Ship
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-xs text-sky-600 hover:text-sky-700"
                  >
                    Select All
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {unfulfilledItems.length === 0 ? (
                <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                  All items have been fulfilled
                </div>
              ) : (
                <div className="border rounded-lg divide-y">
                  {unfulfilledItems.map(item => {
                    const remaining = item.quantity - (item.fulfilledQuantity || 0);
                    return (
                      <div key={item._id} className="p-3 flex items-center gap-4">
                        <img
                          src={item.image || '/placeholder-product.png'}
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.name}</p>
                          <p className="text-xs text-gray-500">
                            SKU: {item.sku || 'N/A'} • {remaining} available
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleItemQuantityChange(item._id, (selectedItems[item._id] || 0) - 1)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          </button>
                          <input
                            type="number"
                            value={selectedItems[item._id] || 0}
                            onChange={(e) => handleItemQuantityChange(item._id, e.target.value)}
                            min="0"
                            max={remaining}
                            className="w-16 px-2 py-1 border rounded text-center text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => handleItemQuantityChange(item._id, (selectedItems[item._id] || 0) + 1)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <p className="text-sm text-gray-500 mt-2">
                {getSelectedItemsCount()} item(s) selected for shipment
              </p>
            </div>

            {/* Courier Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Courier
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {couriers.map(courier => (
                  <button
                    key={courier.code}
                    type="button"
                    onClick={() => setCourierCode(courier.code)}
                    className={`
                      p-3 border rounded-lg text-left transition-colors
                      ${courierCode === courier.code
                        ? 'border-sky-500 bg-sky-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <p className="font-medium text-sm">{courier.name}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Manual Tracking Number */}
            {courierCode === 'manual' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tracking Number *
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter tracking number"
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500"
                />
              </div>
            )}

            {/* Package Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="0.5"
                  min="0"
                  step="0.1"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dimensions (cm)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={dimensions.length}
                    onChange={(e) => setDimensions({ ...dimensions, length: e.target.value })}
                    placeholder="L"
                    min="0"
                    className="w-full px-2 py-2 border rounded-lg text-sm"
                  />
                  <input
                    type="number"
                    value={dimensions.width}
                    onChange={(e) => setDimensions({ ...dimensions, width: e.target.value })}
                    placeholder="W"
                    min="0"
                    className="w-full px-2 py-2 border rounded-lg text-sm"
                  />
                  <input
                    type="number"
                    value={dimensions.height}
                    onChange={(e) => setDimensions({ ...dimensions, height: e.target.value })}
                    placeholder="H"
                    min="0"
                    className="w-full px-2 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>

            {/* COD Option */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isCOD}
                  onChange={(e) => setIsCOD(e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
                <span className="text-sm font-medium text-gray-700">Cash on Delivery (COD)</span>
              </label>
              {isCOD && (
                <input
                  type="number"
                  value={codAmount}
                  onChange={(e) => setCodAmount(e.target.value)}
                  placeholder="Amount"
                  min="0"
                  className="w-32 px-3 py-1 border rounded-lg text-sm"
                />
              )}
            </div>

            {/* Special Instructions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Special Instructions (Optional)
              </label>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                rows={2}
                placeholder="Fragile, handle with care..."
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 resize-none"
              />
            </div>

            {/* Generate Label Option */}
            {courierCode !== 'manual' && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={generateLabel}
                  onChange={(e) => setGenerateLabel(e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Generate shipping label automatically
                </span>
              </label>
            )}

            {/* Shipping Rates */}
            {rates.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Shipping Rates</h4>
                <div className="space-y-2">
                  {rates.map((rate, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{rate.courierName} - {rate.serviceType}</span>
                      <span className="font-medium">PKR {rate.rate?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || getSelectedItemsCount() === 0}
            className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating...
              </>
            ) : (
              <>
                <TruckIcon className="w-4 h-4" />
                Create Shipment
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateShipmentModal;
