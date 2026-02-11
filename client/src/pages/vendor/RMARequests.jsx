import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Loading } from '../../components/common';

const StatusBadge = ({ status }) => {
  const colors = {
    requested: 'bg-yellow-100 text-yellow-800',
    vendor_review: 'bg-emerald-100 text-emerald-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    return_shipped: 'bg-purple-100 text-purple-800',
    return_received: 'bg-teal-100 text-teal-800',
    refund_processing: 'bg-emerald-100 text-emerald-800',
    resolved: 'bg-green-100 text-green-800',
    escalated: 'bg-red-100 text-red-800',
    closed: 'bg-gray-100 text-gray-800',
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status] || 'bg-gray-100'}`}>
      {status?.replace(/_/g, ' ').toUpperCase()}
    </span>
  );
};

const TypeBadge = ({ type }) => {
  const colors = {
    return: 'bg-purple-100 text-purple-800',
    refund_only: 'bg-emerald-100 text-emerald-800',
    exchange: 'bg-teal-100 text-teal-800',
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[type] || 'bg-gray-100'}`}>
      {type?.replace(/_/g, ' ').toUpperCase()}
    </span>
  );
};

const RMARequests = () => {
  const [rmas, setRmas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedRMA, setSelectedRMA] = useState(null);
  const [responseData, setResponseData] = useState({
    accepted: true,
    note: '',
    restockingFee: 0,
  });

  useEffect(() => {
    fetchRMAs();
  }, [filter, page]);

  const fetchRMAs = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 20 };
      if (filter) params.status = filter;

      const response = await api.get('/vendor/rma', { params });
      setRmas(response.data.rmas);
      setStats(response.data.stats);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching RMAs:', error);
    } finally {
      setLoading(false);
    }
  };

  const openResponseModal = (rma) => {
    setSelectedRMA(rma);
    setResponseData({
      accepted: true,
      note: '',
      restockingFee: 0,
    });
    setShowResponseModal(true);
  };

  const handleRespond = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/vendor/rma/${selectedRMA._id}/respond`, responseData);
      alert(responseData.accepted ? 'RMA approved' : 'RMA rejected');
      setShowResponseModal(false);
      fetchRMAs();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to respond');
    }
  };

  const handleMarkReceived = async (rmaId) => {
    try {
      await api.put(`/vendor/rma/${rmaId}/received`, {
        condition: 'good',
        processRefund: true,
      });
      alert('Return marked as received, refund processing');
      fetchRMAs();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update');
    }
  };

  const pendingCount = stats?.requested?.count || 0;

  if (loading && rmas.length === 0) return <Loading />;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-emerald-600">RMA Requests</h1>
        <p className="text-gray-500">Manage return and refund requests</p>
      </div>

      {/* Pending Alert */}
      {pendingCount > 0 && (
        <div className="card p-4 mb-6 bg-yellow-50 border-yellow-200">
          <p className="text-yellow-800">
            <strong>{pendingCount}</strong> request(s) awaiting your response
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card p-4">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold">{stats?.requested?.count || 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Approved</p>
          <p className="text-2xl font-bold text-green-600">{stats?.approved?.count || 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Rejected</p>
          <p className="text-2xl font-bold text-red-600">{stats?.rejected?.count || 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Escalated</p>
          <p className="text-2xl font-bold text-orange-600">{stats?.escalated?.count || 0}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['', 'requested', 'approved', 'return_shipped', 'return_received', 'resolved', 'rejected', 'escalated'].map((status) => (
          <button
            key={status}
            onClick={() => { setFilter(status); setPage(1); }}
            className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition-colors ${
              filter === status
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status?.replace(/_/g, ' ') || 'All'}
          </button>
        ))}
      </div>

      {/* RMA Table */}
      <div className="card overflow-hidden">
        {rmas.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No RMA requests found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-emerald-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">RMA #</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Items</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Value</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Deadline</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-emerald-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rmas.map((rma) => (
                  <tr key={rma._id} className={`hover:bg-gray-50 ${rma.isEscalated ? 'bg-red-50' : ''}`}>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <p className="font-medium">{rma.rmaNumber}</p>
                      <p className="text-xs text-gray-400">{rma.order?.orderNumber}</p>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <p>{rma.customer?.profile?.firstName} {rma.customer?.profile?.lastName}</p>
                      <p className="text-xs text-gray-400">{rma.customer?.email}</p>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <TypeBadge type={rma.type} />
                    </td>
                    <td className="px-4 py-4">
                      <p>{rma.items?.length} item(s)</p>
                      <p className="text-xs text-gray-400">{rma.items?.[0]?.reason}</p>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap font-medium">
                      Rs. {rma.totalItemValue?.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <StatusBadge status={rma.status} />
                      {rma.isEscalated && (
                        <span className="ml-1 text-xs text-red-600">(Escalated)</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      {rma.vendorResponseDeadline && (
                        <span className={new Date(rma.vendorResponseDeadline) < new Date() ? 'text-red-600' : 'text-gray-500'}>
                          {new Date(rma.vendorResponseDeadline).toLocaleDateString()}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <div className="flex gap-2 justify-end">
                        {rma.status === 'requested' && (
                          <button
                            onClick={() => openResponseModal(rma)}
                            className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors"
                          >
                            Respond
                          </button>
                        )}
                        {rma.status === 'return_shipped' && (
                          <button
                            onClick={() => handleMarkReceived(rma._id)}
                            className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors"
                          >
                            Mark Received
                          </button>
                        )}
                        <Link to={`/vendor/rma/${rma._id}`}>
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
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-4 py-3 border-t flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {page} of {pagination.pages}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 text-sm border-2 border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                disabled={page === pagination.pages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 text-sm border-2 border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Response Modal */}
      {showResponseModal && selectedRMA && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">Respond to RMA {selectedRMA.rmaNumber}</h2>
            <form onSubmit={handleRespond}>
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm"><strong>Type:</strong> {selectedRMA.type}</p>
                  <p className="text-sm"><strong>Reason:</strong> {selectedRMA.items?.[0]?.reason}</p>
                  <p className="text-sm"><strong>Value:</strong> Rs. {selectedRMA.totalItemValue?.toLocaleString()}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Decision</label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="accepted"
                        checked={responseData.accepted}
                        onChange={() => setResponseData({ ...responseData, accepted: true })}
                        className="mr-2"
                      />
                      Approve
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="accepted"
                        checked={!responseData.accepted}
                        onChange={() => setResponseData({ ...responseData, accepted: false })}
                        className="mr-2"
                      />
                      Reject
                    </label>
                  </div>
                </div>

                {responseData.accepted && selectedRMA.type === 'return' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Restocking Fee (PKR)</label>
                    <input
                      type="number"
                      value={responseData.restockingFee}
                      onChange={(e) => setResponseData({ ...responseData, restockingFee: e.target.value })}
                      className="input w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Refund amount: Rs. {(selectedRMA.totalItemValue - responseData.restockingFee).toLocaleString()}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">Note to Customer</label>
                  <textarea
                    value={responseData.note}
                    onChange={(e) => setResponseData({ ...responseData, note: e.target.value })}
                    className="input w-full"
                    rows="3"
                    placeholder={responseData.accepted ? 'Instructions for return...' : 'Reason for rejection...'}
                    required={!responseData.accepted}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowResponseModal(false)}
                  className="px-4 py-2 border-2 border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white rounded-lg font-medium transition-colors ${
                    !responseData.accepted
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {responseData.accepted ? 'Approve RMA' : 'Reject RMA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RMARequests;
