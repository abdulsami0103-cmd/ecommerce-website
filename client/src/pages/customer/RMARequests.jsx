import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Loading, Button } from '../../components/common';

const PackageIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const ClockIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CheckIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const statusConfig = {
  requested: { label: 'Requested', color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon },
  vendor_review: { label: 'Under Review', color: 'bg-blue-100 text-blue-800', icon: ClockIcon },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-800', icon: CheckIcon },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XIcon },
  return_shipped: { label: 'Return Shipped', color: 'bg-purple-100 text-purple-800', icon: PackageIcon },
  return_received: { label: 'Item Received', color: 'bg-indigo-100 text-indigo-800', icon: PackageIcon },
  inspection: { label: 'Inspecting', color: 'bg-blue-100 text-blue-800', icon: ClockIcon },
  refund_processing: { label: 'Refund Processing', color: 'bg-orange-100 text-orange-800', icon: ClockIcon },
  exchange_shipped: { label: 'Exchange Shipped', color: 'bg-purple-100 text-purple-800', icon: PackageIcon },
  resolved: { label: 'Resolved', color: 'bg-green-100 text-green-800', icon: CheckIcon },
  escalated: { label: 'Escalated', color: 'bg-red-100 text-red-800', icon: ClockIcon },
  closed: { label: 'Closed', color: 'bg-gray-100 text-gray-800', icon: CheckIcon },
};

const typeLabels = {
  return: 'Return',
  refund_only: 'Refund Only',
  exchange: 'Exchange',
};

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatCurrency = (amount) => {
  return `Rs. ${(amount || 0).toLocaleString()}`;
};

const RMARequests = () => {
  const [loading, setLoading] = useState(true);
  const [rmas, setRmas] = useState([]);
  const [selectedRma, setSelectedRma] = useState(null);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  // Return shipping modal
  const [shippingModal, setShippingModal] = useState({ open: false, rma: null });
  const [shippingForm, setShippingForm] = useState({
    trackingNumber: '',
    courier: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRMAs();
  }, [filter, page]);

  const fetchRMAs = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (filter) params.status = filter;

      const response = await api.get('/rma', { params });
      setRmas(response.data.data || response.data.rmas || []);
      setPagination(response.data.pagination || {});
    } catch (error) {
      console.error('Error fetching RMAs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRMADetails = async (rmaId) => {
    try {
      const response = await api.get(`/rma/${rmaId}`);
      setSelectedRma(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching RMA details:', error);
    }
  };

  const handleMarkShipped = async () => {
    if (!shippingForm.trackingNumber || !shippingForm.courier) {
      alert('Please enter tracking number and courier');
      return;
    }

    setSubmitting(true);
    try {
      await api.put(`/rma/${shippingModal.rma._id}/return-shipped`, shippingForm);
      setShippingModal({ open: false, rma: null });
      setShippingForm({ trackingNumber: '', courier: '' });
      fetchRMAs();
      if (selectedRma?._id === shippingModal.rma._id) {
        fetchRMADetails(selectedRma._id);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEscalate = async (rmaId) => {
    if (!confirm('Are you sure you want to escalate this to admin?')) return;

    try {
      await api.put(`/rma/${rmaId}/escalate`);
      fetchRMAs();
      if (selectedRma?._id === rmaId) {
        fetchRMADetails(rmaId);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to escalate');
    }
  };

  if (loading && rmas.length === 0) return <Loading />;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">My Returns & Refunds</h1>
        <p className="text-gray-500">Track your return and refund requests</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { value: '', label: 'All' },
          { value: 'requested', label: 'Requested' },
          { value: 'approved', label: 'Approved' },
          { value: 'return_shipped', label: 'Shipped' },
          { value: 'resolved', label: 'Resolved' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setFilter(tab.value); setPage(1); }}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
              filter === tab.value
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* RMA List */}
        <div className="md:col-span-1 space-y-4">
          {rmas.length === 0 ? (
            <div className="card p-8 text-center text-gray-500">
              <PackageIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No return requests found</p>
              <Link to="/orders" className="text-primary-600 hover:underline mt-2 block">
                View Orders
              </Link>
            </div>
          ) : (
            rmas.map((rma) => {
              const status = statusConfig[rma.status] || statusConfig.requested;
              const isSelected = selectedRma?._id === rma._id;

              return (
                <button
                  key={rma._id}
                  onClick={() => fetchRMADetails(rma._id)}
                  className={`card p-4 w-full text-left hover:shadow-md transition ${
                    isSelected ? 'ring-2 ring-primary-500' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-primary-600">{rma.rmaNumber}</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    {typeLabels[rma.type] || rma.type}
                  </p>
                  <p className="text-xs text-gray-400">{formatDate(rma.createdAt)}</p>
                </button>
              );
            })
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-between mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page === pagination.pages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>

        {/* RMA Details */}
        <div className="md:col-span-2">
          {selectedRma ? (
            <div className="card p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold">{selectedRma.rmaNumber}</h2>
                  <p className="text-gray-500">
                    {typeLabels[selectedRma.type]} Request
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    statusConfig[selectedRma.status]?.color || 'bg-gray-100'
                  }`}
                >
                  {statusConfig[selectedRma.status]?.label || selectedRma.status}
                </span>
              </div>

              {/* Items */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Items</h3>
                <div className="space-y-3">
                  {selectedRma.items?.map((item, i) => (
                    <div key={i} className="flex gap-4 p-3 bg-gray-50 rounded-lg">
                      {item.product?.images?.[0] && (
                        <img
                          src={item.product.images[0]}
                          alt=""
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{item.product?.name || 'Product'}</p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                        <p className="text-sm text-gray-500">
                          Reason: {item.reason || selectedRma.reason}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reason Details */}
              {selectedRma.reasonDetails && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Details</h3>
                  <p className="text-gray-600">{selectedRma.reasonDetails}</p>
                </div>
              )}

              {/* Proof Images */}
              {selectedRma.proofImages?.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Proof Images</h3>
                  <div className="flex gap-2 flex-wrap">
                    {selectedRma.proofImages.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt="Proof"
                        className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-80"
                        onClick={() => window.open(img, '_blank')}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Refund Info */}
              {selectedRma.refund?.amount > 0 && (
                <div className="mb-6 p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Refund Details</h3>
                  <p className="text-green-700">
                    Amount: {formatCurrency(selectedRma.refund.amount)}
                  </p>
                  {selectedRma.refund.transactionId && (
                    <p className="text-sm text-green-600">
                      Transaction: {selectedRma.refund.transactionId}
                    </p>
                  )}
                </div>
              )}

              {/* Return Shipment */}
              {selectedRma.returnShipment?.trackingNumber && (
                <div className="mb-6 p-4 bg-purple-50 rounded-lg">
                  <h3 className="font-semibold text-purple-800 mb-2">Return Shipment</h3>
                  <p className="text-purple-700">
                    Tracking: {selectedRma.returnShipment.trackingNumber}
                  </p>
                  <p className="text-sm text-purple-600">
                    Courier: {selectedRma.returnShipment.courier}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 mt-6 pt-6 border-t">
                {selectedRma.status === 'approved' && (
                  <Button
                    onClick={() => setShippingModal({ open: true, rma: selectedRma })}
                  >
                    Mark as Shipped
                  </Button>
                )}
                {['requested', 'vendor_review'].includes(selectedRma.status) && (
                  <Button
                    variant="outline"
                    onClick={() => handleEscalate(selectedRma._id)}
                  >
                    Escalate to Admin
                  </Button>
                )}
                <Link to={`/orders`}>
                  <Button variant="outline">View Order</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="card p-8 text-center text-gray-500">
              <PackageIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Select a return request to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Shipping Modal */}
      {shippingModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Mark Return as Shipped</h2>
            <p className="text-gray-500 mb-4">
              Enter the tracking details for your return shipment
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Courier
                </label>
                <select
                  value={shippingForm.courier}
                  onChange={(e) => setShippingForm({ ...shippingForm, courier: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select Courier</option>
                  <option value="TCS">TCS</option>
                  <option value="Leopards">Leopards</option>
                  <option value="PostEx">PostEx</option>
                  <option value="Pakistan Post">Pakistan Post</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tracking Number
                </label>
                <input
                  type="text"
                  value={shippingForm.trackingNumber}
                  onChange={(e) => setShippingForm({ ...shippingForm, trackingNumber: e.target.value })}
                  placeholder="Enter tracking number"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShippingModal({ open: false, rma: null })}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleMarkShipped}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Confirm'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RMARequests;
