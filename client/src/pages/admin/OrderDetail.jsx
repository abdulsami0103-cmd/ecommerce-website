import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Button } from '../../components/common';
import { formatPrice } from '../../store/slices/currencySlice';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const { currentCurrency } = useSelector((state) => state.currency);
  const formatAmount = (amount) => formatPrice(amount, currentCurrency);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/orders/${id}`);
      setOrder(res.data.data);
    } catch (error) {
      console.error('Failed to fetch order:', error);
      toast.error('Failed to load order');
      navigate('/admin/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    setUpdating(true);
    try {
      await api.put(`/orders/${id}/status`, { status: newStatus });
      toast.success('Order status updated');
      fetchOrder();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-gray-500">Order not found</p>
      </div>
    );
  }

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    processing: 'bg-purple-100 text-purple-800',
    shipped: 'bg-indigo-100 text-indigo-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800',
  };

  const paymentStatusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => navigate('/admin/orders')}
            className="text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Orders
          </button>
          <h1 className="text-2xl font-bold">Order #{order.orderNumber}</h1>
          <p className="text-gray-500">
            Placed on {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status]}`}>
            {order.status}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${paymentStatusColors[order.paymentStatus]}`}>
            Payment: {order.paymentStatus}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="card p-6">
            <h2 className="font-semibold mb-4">Order Items</h2>
            <div className="divide-y">
              {order.items?.map((item, idx) => (
                <div key={idx} className="py-4 flex gap-4">
                  <img
                    src={item.image || 'https://placehold.co/80'}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium">{item.name}</h3>
                    {item.variant && (
                      <p className="text-sm text-gray-500">{item.variant}</p>
                    )}
                    <p className="text-sm text-gray-500">SKU: {item.sku || 'N/A'}</p>
                    <p className="text-sm text-gray-500">Vendor: {item.vendor?.storeName || 'Unknown'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatAmount(item.price)}</p>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    <p className="font-bold">{formatAmount(item.price * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SubOrders by Vendor */}
          {order.subOrders?.length > 0 && (
            <div className="card p-6">
              <h2 className="font-semibold mb-4">Vendor Sub-Orders</h2>
              <div className="space-y-4">
                {order.subOrders.map((subOrder, idx) => (
                  <div key={idx} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <p className="font-medium">{subOrder.vendor?.storeName || 'Vendor'}</p>
                        <p className="text-sm text-gray-500">#{subOrder.subOrderNumber}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[subOrder.status]}`}>
                        {subOrder.status}
                      </span>
                    </div>
                    <p className="text-sm">Items: {subOrder.items?.length || 0}</p>
                    <p className="font-medium">Total: {formatAmount(subOrder.totals?.subtotal)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Shipping Address */}
          <div className="card p-6">
            <h2 className="font-semibold mb-4">Shipping Address</h2>
            {order.shippingAddress ? (
              <div>
                <p className="font-medium">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.addressLine1}</p>
                {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                </p>
                <p>{order.shippingAddress.country}</p>
                <p className="mt-2">Phone: {order.shippingAddress.phone}</p>
              </div>
            ) : (
              <p className="text-gray-500">No shipping address</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="card p-6">
            <h2 className="font-semibold mb-4">Order Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>{formatAmount(order.totals?.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Shipping</span>
                <span>{formatAmount(order.totals?.shipping || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tax</span>
                <span>{formatAmount(order.totals?.tax || 0)}</span>
              </div>
              {order.totals?.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatAmount(order.totals.discount)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatAmount(order.totals?.total)}</span>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="card p-6">
            <h2 className="font-semibold mb-4">Customer</h2>
            <div>
              <p className="font-medium">{order.user?.name || 'Guest'}</p>
              <p className="text-sm text-gray-500">{order.user?.email}</p>
              {order.user?.phone && <p className="text-sm text-gray-500">{order.user.phone}</p>}
            </div>
          </div>

          {/* Payment Info */}
          <div className="card p-6">
            <h2 className="font-semibold mb-4">Payment</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Method</span>
                <span className="capitalize">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className={`px-2 py-1 rounded text-xs ${paymentStatusColors[order.paymentStatus]}`}>
                  {order.paymentStatus}
                </span>
              </div>
              {order.paymentDetails?.transactionId && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Transaction ID</span>
                  <span className="text-sm">{order.paymentDetails.transactionId}</span>
                </div>
              )}
            </div>
          </div>

          {/* Update Status */}
          <div className="card p-6">
            <h2 className="font-semibold mb-4">Update Status</h2>
            <div className="space-y-2">
              {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusUpdate(status)}
                  disabled={updating || order.status === status}
                  className={`w-full py-2 px-4 rounded text-sm capitalize transition-colors ${
                    order.status === status
                      ? 'bg-primary-100 text-primary-700 font-medium'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  } disabled:opacity-50`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
