import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import api from '../services/api';
import { Loading, Button } from '../components/common';

const StatusIcon = ({ status, isActive, isCompleted }) => {
  const icons = {
    pending: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    picked_up: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
      </svg>
    ),
    in_transit: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
      </svg>
    ),
    out_for_delivery: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    delivered: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
  };

  const bgColor = isCompleted
    ? 'bg-green-500 text-white'
    : isActive
    ? 'bg-primary-500 text-white'
    : 'bg-gray-200 text-gray-500';

  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${bgColor}`}>
      {icons[status] || icons.pending}
    </div>
  );
};

const TrackOrder = () => {
  const { trackingNumber: paramTracking } = useParams();
  const [searchParams] = useSearchParams();
  const [trackingNumber, setTrackingNumber] = useState(paramTracking || searchParams.get('t') || '');
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (paramTracking) {
      handleTrack();
    }
  }, [paramTracking]);

  const handleTrack = async (e) => {
    e?.preventDefault();
    if (!trackingNumber.trim()) return;

    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/track/${trackingNumber.trim()}`);
      setTracking(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Tracking number not found');
      setTracking(null);
    } finally {
      setLoading(false);
    }
  };

  const statusOrder = ['pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered'];
  const currentStatusIndex = tracking?.shipment?.status
    ? statusOrder.indexOf(tracking.shipment.status)
    : -1;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Track Your Order</h1>
            <p className="text-gray-500">Enter your tracking number to see delivery status</p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleTrack} className="card p-6 mb-8">
            <div className="flex gap-3">
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter tracking number..."
                className="input flex-1"
              />
              <Button type="submit" disabled={loading}>
                {loading ? 'Tracking...' : 'Track'}
              </Button>
            </div>
          </form>

          {/* Error */}
          {error && (
            <div className="card p-4 mb-6 bg-red-50 border-red-200 text-red-700">
              {error}
            </div>
          )}

          {/* Loading */}
          {loading && <Loading />}

          {/* Tracking Results */}
          {tracking && tracking.found && (
            <div className="card p-6">
              {/* Shipment Info */}
              <div className="flex items-center justify-between mb-6 pb-6 border-b">
                <div>
                  <p className="text-sm text-gray-500">Tracking Number</p>
                  <p className="text-lg font-bold">{tracking.shipment.trackingNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Courier</p>
                  <p className="font-medium">{tracking.shipment.courier}</p>
                </div>
              </div>

              {/* Status Progress */}
              <div className="mb-8">
                <div className="flex justify-between relative">
                  {/* Progress Line */}
                  <div className="absolute top-5 left-5 right-5 h-1 bg-gray-200">
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{
                        width: `${Math.max(0, (currentStatusIndex / (statusOrder.length - 1)) * 100)}%`,
                      }}
                    />
                  </div>

                  {/* Status Steps */}
                  {statusOrder.map((status, index) => (
                    <div key={status} className="flex flex-col items-center relative z-10">
                      <StatusIcon
                        status={status}
                        isActive={index === currentStatusIndex}
                        isCompleted={index < currentStatusIndex}
                      />
                      <p className={`text-xs mt-2 text-center ${
                        index <= currentStatusIndex ? 'text-gray-900 font-medium' : 'text-gray-400'
                      }`}>
                        {status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Current Status */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-500 mb-1">Current Status</p>
                <p className="text-xl font-bold text-primary-600">
                  {tracking.shipment.status?.replace(/_/g, ' ').toUpperCase()}
                </p>
                {tracking.shipment.estimatedDelivery && tracking.shipment.status !== 'delivered' && (
                  <p className="text-sm text-gray-500 mt-1">
                    Estimated delivery: {new Date(tracking.shipment.estimatedDelivery).toLocaleDateString()}
                  </p>
                )}
                {tracking.shipment.actualDelivery && (
                  <p className="text-sm text-green-600 mt-1">
                    Delivered on: {new Date(tracking.shipment.actualDelivery).toLocaleString()}
                  </p>
                )}
              </div>

              {/* Destination */}
              {tracking.shipment.destination && (
                <div className="mb-6">
                  <p className="text-sm text-gray-500 mb-1">Delivering to</p>
                  <p className="font-medium">{tracking.shipment.destination.city}</p>
                </div>
              )}

              {/* Tracking Timeline */}
              {tracking.events && tracking.events.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-4">Tracking History</h3>
                  <div className="space-y-4">
                    {tracking.events.slice().reverse().map((event, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-primary-500' : 'bg-gray-300'}`} />
                          {index < tracking.events.length - 1 && (
                            <div className="w-0.5 h-full bg-gray-200" />
                          )}
                        </div>
                        <div className="pb-4">
                          <p className="font-medium">
                            {event.status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </p>
                          <p className="text-sm text-gray-600">{event.description}</p>
                          {event.location?.city && (
                            <p className="text-sm text-gray-400">{event.location.city}</p>
                          )}
                          <p className="text-xs text-gray-400">
                            {new Date(event.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Order Reference */}
              {tracking.shipment.orderNumber && (
                <div className="mt-6 pt-6 border-t text-center">
                  <p className="text-sm text-gray-500">Order Reference</p>
                  <p className="font-medium">{tracking.shipment.orderNumber}</p>
                </div>
              )}
            </div>
          )}

          {/* Not Found */}
          {tracking && !tracking.found && (
            <div className="card p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Tracking Not Found</h3>
              <p className="text-gray-500">
                We couldn't find any information for this tracking number.
                Please check and try again.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackOrder;
