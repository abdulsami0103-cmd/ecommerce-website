import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

import { Loading } from '../../components/common';
import StatusTimeline from '../../components/common/StatusTimeline';
import CreateShipmentModal from '../../components/vendor/CreateShipmentModal';

// Icons
const BackIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

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

const UserIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const LocationIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const PrintIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
  </svg>
);

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-teal-100 text-teal-800',
  processing: 'bg-emerald-100 text-emerald-800',
  shipped: 'bg-purple-100 text-purple-800',
  out_for_delivery: 'bg-teal-100 text-teal-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  returned: 'bg-orange-100 text-orange-800',
};

const itemStatusColors = {
  unfulfilled: 'bg-yellow-100 text-yellow-800',
  partial: 'bg-emerald-100 text-emerald-800',
  fulfilled: 'bg-green-100 text-green-800',
};

const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatCurrency = (amount) => {
  return `PKR ${(amount || 0).toLocaleString()}`;
};

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showShipmentModal, setShowShipmentModal] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Fetch order details
      const orderRes = await fetch(`/api/vendor/suborders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const orderData = await orderRes.json();

      // Handle both response formats: direct object or { success, data }
      const order = orderData.data || orderData;

      if (order && order._id) {
        setOrder(order);

        // Fetch shipments for this order
        const shipmentsRes = await fetch(`/api/vendor/suborders/${id}/shipments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const shipmentsData = await shipmentsRes.json();

        // Handle both response formats
        const shipmentsList = shipmentsData.data || shipmentsData;
        setShipments(Array.isArray(shipmentsList) ? shipmentsList : []);
      } else {
        toast.error('Failed to load order');
        navigate('/vendor/suborders');
      }
    } catch (error) {
      toast.error('Failed to load order details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/vendor/suborders/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Order status updated to ${newStatus}`);
        fetchOrderDetails();
      } else {
        toast.error(data.message || 'Failed to update status');
      }
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handlePrintPackingSlip = () => {
    window.print();
  };

  const handleShipmentCreated = () => {
    fetchOrderDetails();
  };

  const getUnfulfilledCount = () => {
    if (!order?.items) return 0;
    return order.items.reduce((count, item) => {
      const remaining = item.quantity - (item.fulfilledQuantity || 0);
      return count + remaining;
    }, 0);
  };

  if (loading) return <Loading />;

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-500">Order not found</p>
          <Link to="/vendor/suborders" className="text-emerald-600 hover:underline mt-2 inline-block">
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const statusHistory = order.statusHistory || [];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/vendor/suborders')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <BackIcon className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-emerald-600">Order #{order.subOrderNumber}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status]}`}>
                {order.status}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrintPackingSlip}
            className="inline-flex items-center px-4 py-2 border-2 border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 font-medium transition-colors"
          >
            <PrintIcon className="w-4 h-4 mr-2" />
            Print Packing Slip
          </button>

          {getUnfulfilledCount() > 0 && (
            <button
              onClick={() => setShowShipmentModal(true)}
              className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors"
            >
              <TruckIcon className="w-4 h-4 mr-2" />
              Create Shipment
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="card">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <PackageIcon className="w-5 h-5 text-gray-500" />
                Order Items ({order.items?.length || 0})
              </h2>
            </div>
            <div className="divide-y">
              {order.items?.map((item, index) => {
                const fulfilled = item.fulfilledQuantity || 0;
                const remaining = item.quantity - fulfilled;
                const itemStatus = fulfilled === 0 ? 'unfulfilled' :
                  fulfilled < item.quantity ? 'partial' : 'fulfilled';

                return (
                  <div key={item._id || index} className="p-4 flex items-center gap-4">
                    <img
                      src={item.image || '/placeholder-product.png'}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-500">
                        SKU: {item.sku || 'N/A'}
                        {item.variant && ` • ${item.variant}`}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${itemStatusColors[itemStatus]}`}>
                          {fulfilled}/{item.quantity} fulfilled
                        </span>
                        {remaining > 0 && (
                          <span className="text-xs text-orange-600">
                            {remaining} pending
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(item.price)} × {item.quantity}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Totals */}
            <div className="px-6 py-4 bg-gray-50 border-t">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                {order.shippingCost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Shipping</span>
                    <span>{formatCurrency(order.shippingCost)}</span>
                  </div>
                )}
                {order.tax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tax</span>
                    <span>{formatCurrency(order.tax)}</span>
                  </div>
                )}
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold pt-2 border-t">
                  <span>Total</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Shipments */}
          <div className="card">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <TruckIcon className="w-5 h-5 text-gray-500" />
                Shipments ({shipments.length})
              </h2>
            </div>

            {shipments.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <TruckIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No shipments created yet</p>
                {getUnfulfilledCount() > 0 && (
                  <button
                    onClick={() => setShowShipmentModal(true)}
                    className="mt-4 inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors"
                  >
                    Create First Shipment
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y">
                {shipments.map(shipment => (
                  <div key={shipment._id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium">
                          {shipment.courier?.name || 'Manual'}
                        </p>
                        <p className="text-sm text-gray-500">
                          Tracking: {shipment.trackingNumber || shipment.courier?.trackingNumber || 'N/A'}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[shipment.status]}`}>
                        {shipment.status}
                      </span>
                    </div>

                    {/* Shipment items */}
                    <div className="text-sm text-gray-600 mb-2">
                      {shipment.items?.length || 0} item(s) • {shipment.weight}kg
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {shipment.courier?.labelUrl && (
                        <a
                          href={shipment.courier.labelUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-emerald-600 hover:underline"
                        >
                          Download Label
                        </a>
                      )}
                      {shipment.trackingNumber && (
                        <Link
                          to={`/track/${shipment.trackingNumber}`}
                          className="text-xs text-emerald-600 hover:underline"
                        >
                          Track Shipment
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="card p-6">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <UserIcon className="w-5 h-5 text-gray-500" />
              Customer
            </h3>
            <div className="space-y-2 text-sm">
              <p className="font-medium">{order.customer?.name || 'Guest'}</p>
              <p className="text-gray-500">{order.customer?.email}</p>
              <p className="text-gray-500">{order.customer?.phone}</p>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="card p-6">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <LocationIcon className="w-5 h-5 text-gray-500" />
              Shipping Address
            </h3>
            <div className="text-sm text-gray-600">
              <p>{order.shippingAddress?.fullName}</p>
              <p>{order.shippingAddress?.addressLine1}</p>
              {order.shippingAddress?.addressLine2 && (
                <p>{order.shippingAddress.addressLine2}</p>
              )}
              <p>
                {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.postalCode}
              </p>
              <p>{order.shippingAddress?.country}</p>
              {order.shippingAddress?.phone && (
                <p className="mt-2">Phone: {order.shippingAddress.phone}</p>
              )}
            </div>
          </div>

          {/* Status Actions */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Update Status</h3>
            <div className="space-y-2">
              {order.status === 'pending' && (
                <button
                  onClick={() => handleStatusUpdate('confirmed')}
                  disabled={updating}
                  className="w-full px-4 py-2 border-2 border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 font-medium transition-colors disabled:opacity-50"
                >
                  Confirm Order
                </button>
              )}
              {order.status === 'confirmed' && (
                <button
                  onClick={() => handleStatusUpdate('processing')}
                  disabled={updating}
                  className="w-full px-4 py-2 border-2 border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 font-medium transition-colors disabled:opacity-50"
                >
                  Start Processing
                </button>
              )}
              {['pending', 'confirmed', 'processing'].includes(order.status) && (
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to cancel this order?')) {
                      handleStatusUpdate('cancelled');
                    }
                  }}
                  disabled={updating}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50"
                >
                  Cancel Order
                </button>
              )}
            </div>
          </div>

          {/* Status Timeline */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Status History</h3>
            <StatusTimeline
              events={statusHistory.map(h => ({
                status: h.status,
                timestamp: h.timestamp,
                note: h.note,
                createdBy: h.changedBy,
              }))}
              compact
            />
          </div>

          {/* Notes */}
          {(order.vendorNote || order.customerNote) && (
            <div className="card p-6">
              <h3 className="font-semibold mb-4">Notes</h3>
              {order.customerNote && (
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1">Customer Note</p>
                  <p className="text-sm bg-gray-50 p-2 rounded">{order.customerNote}</p>
                </div>
              )}
              {order.vendorNote && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Your Note</p>
                  <p className="text-sm bg-gray-50 p-2 rounded">{order.vendorNote}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Shipment Modal */}
      <CreateShipmentModal
        isOpen={showShipmentModal}
        onClose={() => setShowShipmentModal(false)}
        order={order}
        onShipmentCreated={handleShipmentCreated}
      />
    </div>
  );
};

export default OrderDetail;
