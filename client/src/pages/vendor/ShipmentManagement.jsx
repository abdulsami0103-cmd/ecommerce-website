import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { Loading } from '../../components/common';

const StatusBadge = ({ status }) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    label_created: 'bg-emerald-100 text-emerald-800',
    ready_for_pickup: 'bg-teal-100 text-teal-800',
    picked_up: 'bg-purple-100 text-purple-800',
    in_transit: 'bg-cyan-100 text-cyan-800',
    out_for_delivery: 'bg-teal-100 text-teal-800',
    delivered: 'bg-green-100 text-green-800',
    returned: 'bg-red-100 text-red-800',
    failed: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`px-1.5 py-0.5 sm:px-2 sm:py-1 text-[8px] sm:text-xs font-medium rounded-full ${colors[status] || 'bg-gray-100'}`}>
      {status?.replace(/_/g, ' ').toUpperCase()}
    </span>
  );
};

const ShipmentManagement = () => {
  const [searchParams] = useSearchParams();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSubOrder, setSelectedSubOrder] = useState(null);
  const [pendingSubOrders, setPendingSubOrders] = useState([]);
  const [filter, setFilter] = useState('');
  const [couriers, setCouriers] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  // Form state for creating shipment
  const [formData, setFormData] = useState({
    subOrderId: '',
    courierCode: 'manual',
    weight: 0.5,
    isCOD: false,
    codAmount: 0,
    specialInstructions: '',
  });

  useEffect(() => {
    fetchShipments();
    fetchPendingSubOrders();
    fetchCouriers();

    // Check if creating for specific sub-order
    const subOrderId = searchParams.get('subOrder');
    if (subOrderId) {
      setFormData(prev => ({ ...prev, subOrderId }));
      setShowCreateModal(true);
    }
  }, [filter, page]);

  const fetchShipments = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 20 };
      if (filter) params.status = filter;

      const response = await api.get('/vendor/shipments', { params });
      setShipments(response.data.shipments);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching shipments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingSubOrders = async () => {
    try {
      const response = await api.get('/vendor/suborders', {
        params: { status: 'processing' },
      });
      setPendingSubOrders(response.data.subOrders.filter(so => !so.shipment));
    } catch (error) {
      console.error('Error fetching pending sub-orders:', error);
    }
  };

  const fetchCouriers = async () => {
    try {
      const response = await api.get('/admin/couriers');
      setCouriers(response.data.filter(c => c.isActive));
    } catch (error) {
      // Use default couriers
      setCouriers([
        { code: 'manual', name: 'Manual / Self Delivery' },
        { code: 'tcs', name: 'TCS Express' },
        { code: 'leopards', name: 'Leopards Courier' },
        { code: 'postex', name: 'PostEx' },
      ]);
    }
  };

  const handleCreateShipment = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/shipments', {
        subOrderId: formData.subOrderId,
        courierCode: formData.courierCode,
        package: {
          weight: parseFloat(formData.weight),
          description: 'Order items',
        },
        isCOD: formData.isCOD,
        codAmount: formData.isCOD ? parseFloat(formData.codAmount) : 0,
        specialInstructions: formData.specialInstructions,
      });

      alert(`Shipment created! Tracking: ${response.data.trackingNumber || 'N/A'}`);
      setShowCreateModal(false);
      setFormData({
        subOrderId: '',
        courierCode: 'manual',
        weight: 0.5,
        isCOD: false,
        codAmount: 0,
        specialInstructions: '',
      });
      fetchShipments();
      fetchPendingSubOrders();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create shipment');
    }
  };

  const handleStatusUpdate = async (shipmentId, newStatus) => {
    try {
      await api.put(`/shipments/${shipmentId}/status`, { status: newStatus });
      fetchShipments();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update status');
    }
  };

  if (loading && shipments.length === 0) return <Loading />;

  return (
    <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-8">
      <div className="flex justify-between items-center mb-3 sm:mb-8">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-emerald-600">Shipments</h1>
          <p className="text-[10px] sm:text-base text-gray-500">Manage & track deliveries</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-2.5 py-1.5 sm:px-4 sm:py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors text-[10px] sm:text-sm"
        >
          + Create
        </button>
      </div>

      {/* Pending Orders Alert */}
      {pendingSubOrders.length > 0 && (
        <div className="card p-2 sm:p-4 mb-2 sm:mb-6 bg-yellow-50 border-yellow-200">
          <p className="text-[10px] sm:text-base text-yellow-800">
            <strong>{pendingSubOrders.length}</strong> order(s) ready to ship
          </p>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-1 sm:gap-2 mb-3 sm:mb-6 overflow-x-auto pb-1 sm:pb-2">
        {['', 'pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered'].map((status) => (
          <button
            key={status}
            onClick={() => { setFilter(status); setPage(1); }}
            className={`px-2 py-1 sm:px-4 sm:py-2 rounded-lg whitespace-nowrap font-medium transition-colors text-[10px] sm:text-sm ${
              filter === status
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status?.replace(/_/g, ' ') || 'All'}
          </button>
        ))}
      </div>

      {/* Shipments Table */}
      <div className="card overflow-hidden">
        {shipments.length === 0 ? (
          <div className="p-4 sm:p-8 text-center text-xs sm:text-base text-gray-500">
            No shipments found
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-emerald-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Tracking</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Order</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Courier</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Destination</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Created</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-emerald-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {shipments.map((shipment) => (
                    <tr key={shipment._id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <p className="font-medium">{shipment.courier?.trackingNumber || 'N/A'}</p>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <Link to={`/vendor/suborders/${shipment.subOrder?._id}`} className="text-emerald-600 hover:underline font-medium">
                          {shipment.subOrder?.subOrderNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {shipment.courier?.name}
                      </td>
                      <td className="px-4 py-4">
                        <p>{shipment.destination?.name}</p>
                        <p className="text-xs text-gray-400">{shipment.destination?.city}</p>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <StatusBadge status={shipment.status} />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-gray-500 text-sm">
                        {new Date(shipment.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right">
                        <div className="flex gap-2 justify-end">
                          {shipment.status === 'pending' && (
                            <button
                              onClick={() => handleStatusUpdate(shipment._id, 'picked_up')}
                              className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors"
                            >
                              Mark Picked
                            </button>
                          )}
                          {shipment.status === 'in_transit' && (
                            <button
                              onClick={() => handleStatusUpdate(shipment._id, 'delivered')}
                              className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors"
                            >
                              Mark Delivered
                            </button>
                          )}
                          <Link to={`/vendor/shipments/${shipment._id}`}>
                            <button className="px-3 py-1.5 text-sm border-2 border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 font-medium transition-colors">
                              View
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="sm:hidden">
              <div className="grid grid-cols-12 gap-1 bg-emerald-50 px-2.5 py-1.5 items-center">
                <span className="col-span-3 text-[9px] font-semibold text-emerald-700 uppercase">Tracking</span>
                <span className="col-span-3 text-[9px] font-semibold text-emerald-700 uppercase">Order</span>
                <span className="col-span-3 text-[9px] font-semibold text-emerald-700 uppercase">Status</span>
                <span className="col-span-3 text-[9px] font-semibold text-emerald-700 uppercase text-right">Action</span>
              </div>
              <div className="divide-y divide-gray-100">
                {shipments.map((shipment) => (
                  <div key={shipment._id} className="grid grid-cols-12 gap-1 items-center px-2.5 py-2">
                    <div className="col-span-3 min-w-0">
                      <p className="text-[9px] font-medium text-gray-900 truncate">
                        {shipment.courier?.trackingNumber ? shipment.courier.trackingNumber.slice(-8) : 'N/A'}
                      </p>
                      <p className="text-[8px] text-gray-400 truncate">{shipment.courier?.name}</p>
                    </div>
                    <div className="col-span-3 min-w-0">
                      <Link to={`/vendor/suborders/${shipment.subOrder?._id}`} className="text-[10px] font-medium text-emerald-600 truncate block">
                        {shipment.subOrder?.subOrderNumber?.split('-').slice(-2).join('-')}
                      </Link>
                      <p className="text-[8px] text-gray-400 truncate">{shipment.destination?.city}</p>
                    </div>
                    <div className="col-span-3">
                      <StatusBadge status={shipment.status} />
                    </div>
                    <div className="col-span-3 flex items-center justify-end gap-1">
                      {shipment.status === 'pending' && (
                        <button
                          onClick={() => handleStatusUpdate(shipment._id, 'picked_up')}
                          className="px-1.5 py-0.5 text-[8px] bg-emerald-600 text-white rounded font-medium"
                        >
                          Picked
                        </button>
                      )}
                      {shipment.status === 'in_transit' && (
                        <button
                          onClick={() => handleStatusUpdate(shipment._id, 'delivered')}
                          className="px-1.5 py-0.5 text-[8px] bg-emerald-600 text-white rounded font-medium"
                        >
                          Deliver
                        </button>
                      )}
                      <Link to={`/vendor/shipments/${shipment._id}`} className="px-1.5 py-0.5 text-[8px] border border-emerald-600 text-emerald-600 rounded font-medium">
                        View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-2.5 py-2 sm:px-4 sm:py-3 border-t flex items-center justify-between">
            <p className="text-[10px] sm:text-sm text-gray-500">
              {page}/{pagination.pages}
            </p>
            <div className="flex gap-1 sm:gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-sm border border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Prev
              </button>
              <button
                disabled={page === pagination.pages}
                onClick={() => setPage(page + 1)}
                className="px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-sm border border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Shipment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">Create Shipment</h2>
            <form onSubmit={handleCreateShipment}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Sub-Order *</label>
                  <select
                    value={formData.subOrderId}
                    onChange={(e) => setFormData({ ...formData, subOrderId: e.target.value })}
                    className="input w-full"
                    required
                  >
                    <option value="">Select sub-order</option>
                    {pendingSubOrders.map((so) => (
                      <option key={so._id} value={so._id}>
                        {so.subOrderNumber} - Rs. {so.total?.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Courier *</label>
                  <select
                    value={formData.courierCode}
                    onChange={(e) => setFormData({ ...formData, courierCode: e.target.value })}
                    className="input w-full"
                    required
                  >
                    {couriers.map((c) => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Package Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className="input w-full"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isCOD"
                    checked={formData.isCOD}
                    onChange={(e) => setFormData({ ...formData, isCOD: e.target.checked })}
                  />
                  <label htmlFor="isCOD" className="text-sm">Cash on Delivery (COD)</label>
                </div>

                {formData.isCOD && (
                  <div>
                    <label className="block text-sm font-medium mb-1">COD Amount (PKR)</label>
                    <input
                      type="number"
                      value={formData.codAmount}
                      onChange={(e) => setFormData({ ...formData, codAmount: e.target.value })}
                      className="input w-full"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">Special Instructions</label>
                  <textarea
                    value={formData.specialInstructions}
                    onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
                    className="input w-full"
                    rows="2"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border-2 border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors"
                >
                  Create Shipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShipmentManagement;
