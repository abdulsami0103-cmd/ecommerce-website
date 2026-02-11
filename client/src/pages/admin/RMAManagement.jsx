import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { Button, Modal } from '../../components/common';

const SearchIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const EyeIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const CheckIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const ChevronDownIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const MoreIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
  </svg>
);

const ExclamationIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const AdminRMAManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [rmas, setRmas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [filter, setFilter] = useState(searchParams.get('status') || '');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedRMA, setSelectedRMA] = useState(null);
  const [resolutionData, setResolutionData] = useState({
    resolution: 'full_refund',
    amount: 0,
    note: '',
  });

  useEffect(() => {
    fetchRMAs();
  }, [filter, page]);

  const fetchRMAs = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (filter) params.status = filter;
      if (search) params.search = search;

      const response = await api.get('/admin/rma', { params });
      setRmas(response.data.rmas || []);
      setStats(response.data.stats || {});
      setPagination(response.data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (error) {
      console.error('Error fetching RMAs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPage(1);
    if (newFilter) {
      setSearchParams({ status: newFilter });
    } else {
      setSearchParams({});
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchRMAs();
  };

  const openResolveModal = (rma) => {
    setSelectedRMA(rma);
    setResolutionData({
      resolution: 'full_refund',
      amount: rma.totalItemValue || 0,
      note: '',
    });
    setShowResolveModal(true);
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/rma/${selectedRMA._id}/resolve`, resolutionData);
      setShowResolveModal(false);
      fetchRMAs();
    } catch (error) {
      console.error('Failed to resolve RMA:', error);
    }
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      requested: 'bg-amber-100 text-amber-700',
      vendor_review: 'bg-blue-100 text-blue-700',
      approved: 'bg-emerald-100 text-emerald-700',
      rejected: 'bg-red-100 text-red-700',
      return_shipped: 'bg-violet-100 text-violet-700',
      return_received: 'bg-indigo-100 text-indigo-700',
      refund_processing: 'bg-cyan-100 text-cyan-700',
      resolved: 'bg-emerald-100 text-emerald-700',
      escalated: 'bg-red-100 text-red-700',
      closed: 'bg-gray-100 text-gray-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getTypeBadgeColor = (type) => {
    const colors = {
      return: 'bg-violet-100 text-violet-700',
      refund_only: 'bg-blue-100 text-blue-700',
      exchange: 'bg-teal-100 text-teal-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const getAvatarColor = (index) => {
    const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-violet-500', 'bg-amber-500', 'bg-pink-500', 'bg-cyan-500'];
    return colors[index % colors.length];
  };

  const getInitials = (rma) => {
    if (rma.customer?.profile?.firstName) {
      return `${rma.customer.profile.firstName[0]}${rma.customer.profile.lastName?.[0] || ''}`.toUpperCase();
    }
    return rma.customer?.email?.[0]?.toUpperCase() || 'C';
  };

  const escalatedCount = stats?.escalated?.count || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-emerald-600">RMA Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage return and refund requests</p>
        </div>
      </div>

      {/* Escalated Alert */}
      {escalatedCount > 0 && (
        <div className="bg-red-50 rounded-2xl shadow-sm p-4 border border-red-200 flex items-center gap-3">
          <ExclamationIcon className="w-6 h-6 text-red-500" />
          <p className="text-red-800">
            <strong>{escalatedCount}</strong> escalated request(s) requiring admin intervention
          </p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-amber-600">{stats?.requested?.count || 0}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Approved</p>
          <p className="text-2xl font-bold text-emerald-600">{stats?.approved?.count || 0}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Rejected</p>
          <p className="text-2xl font-bold text-red-600">{stats?.rejected?.count || 0}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Escalated</p>
          <p className="text-2xl font-bold text-orange-600">{stats?.escalated?.count || 0}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Resolved</p>
          <p className="text-2xl font-bold text-blue-600">{stats?.resolved?.count || 0}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { value: '', label: 'All' },
          { value: 'requested', label: 'Requested' },
          { value: 'approved', label: 'Approved' },
          { value: 'return_shipped', label: 'Return Shipped' },
          { value: 'return_received', label: 'Return Received' },
          { value: 'resolved', label: 'Resolved' },
          { value: 'rejected', label: 'Rejected' },
          { value: 'escalated', label: 'Escalated' },
        ].map((status) => (
          <button
            key={status.value}
            onClick={() => handleFilterChange(status.value)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              filter === status.value
                ? status.value === 'escalated' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status.label}
          </button>
        ))}
      </div>

      {/* RMA Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* Table Header with Filters */}
        <div className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-900">All RMA Requests</h3>

          <div className="flex items-center gap-3">
            {/* Search */}
            <form onSubmit={handleSearch} className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-900" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 w-40 placeholder-gray-900 text-gray-900"
              />
            </form>

            {/* Rows per page */}
            <div className="relative">
              <select className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm text-gray-900">
                <option>10 Row</option>
                <option>20 Row</option>
                <option>50 Row</option>
              </select>
              <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-900 pointer-events-none" />
            </div>

            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <MoreIcon className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto" />
          </div>
        ) : rmas.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No RMA requests found</div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="sm:hidden divide-y divide-gray-100">
              {rmas.map((rma, index) => (
                <div
                  key={rma._id}
                  className={`p-4 ${rma.isEscalated ? 'bg-red-50' : ''}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${getAvatarColor(index)} flex items-center justify-center flex-shrink-0`}>
                        <span className="text-white text-sm font-medium">
                          {getInitials(rma)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {rma.customer?.profile?.firstName} {rma.customer?.profile?.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{rma.rmaNumber}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadgeColor(rma.status)}`}>
                        {rma.status?.replace(/_/g, ' ')}
                      </span>
                      {rma.isEscalated && (
                        <span className="text-xs text-red-600 font-medium">Escalated</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Vendor</span>
                      <span className="text-gray-700">{rma.vendor?.storeName}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Type</span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getTypeBadgeColor(rma.type)}`}>
                        {rma.type?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Value</span>
                      <span className="text-gray-900 font-medium">Rs. {rma.totalItemValue?.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-xs text-gray-400">
                      {new Date(rma.createdAt).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-1">
                      {rma.isEscalated && (
                        <button
                          onClick={() => openResolveModal(rma)}
                          className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded transition-colors"
                        >
                          <CheckIcon className="w-5 h-5" />
                        </button>
                      )}
                      <Link
                        to={`/admin/rma/${rma._id}`}
                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-emerald-50">
                    <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">RMA #</th>
                    <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Customer</th>
                    <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Vendor</th>
                    <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Type</th>
                    <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Value</th>
                    <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Status</th>
                    <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Date</th>
                    <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rmas.map((rma, index) => (
                    <tr
                      key={rma._id}
                      className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${rma.isEscalated ? 'bg-red-50' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{rma.rmaNumber}</p>
                        <p className="text-xs text-gray-500">{rma.order?.orderNumber}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full ${getAvatarColor(index)} flex items-center justify-center`}>
                            <span className="text-white text-xs font-medium">
                              {getInitials(rma)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {rma.customer?.profile?.firstName} {rma.customer?.profile?.lastName}
                            </p>
                            <p className="text-xs text-gray-500">{rma.customer?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {rma.vendor?.storeName}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getTypeBadgeColor(rma.type)}`}>
                          {rma.type?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        Rs. {rma.totalItemValue?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(rma.status)}`}>
                            {rma.status?.replace(/_/g, ' ')}
                          </span>
                          {rma.isEscalated && (
                            <span className="text-xs text-red-600 font-medium">(Escalated)</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(rma.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          {rma.isEscalated && (
                            <button
                              onClick={() => openResolveModal(rma)}
                              className="p-1 text-emerald-500 hover:bg-emerald-50 rounded transition-colors"
                              title="Resolve"
                            >
                              <CheckIcon className="w-5 h-5" />
                            </button>
                          )}
                          <Link
                            to={`/admin/rma/${rma._id}`}
                            className="p-1 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                            title="View Details"
                          >
                            <EyeIcon className="w-5 h-5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination */}
        <div className="px-6 py-4 flex items-center justify-between border-t border-gray-100">
          <p className="text-sm text-emerald-600">
            Showing {rmas.length} of {pagination.total || rmas.length} Result
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button className="w-8 h-8 text-sm bg-emerald-500 text-white rounded-lg">
              {String(page).padStart(2, '0')}
            </button>
            <button
              disabled={page === pagination.pages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Resolve Modal */}
      <Modal
        isOpen={showResolveModal}
        onClose={() => setShowResolveModal(false)}
        title={`Resolve RMA ${selectedRMA?.rmaNumber}`}
      >
        <form onSubmit={handleResolve}>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600"><strong>Type:</strong> {selectedRMA?.type?.replace(/_/g, ' ')}</p>
              <p className="text-sm text-gray-600"><strong>Reason:</strong> {selectedRMA?.items?.[0]?.reason}</p>
              <p className="text-sm text-gray-600"><strong>Value:</strong> Rs. {selectedRMA?.totalItemValue?.toLocaleString()}</p>
              {selectedRMA?.escalatedReason && (
                <p className="text-sm text-red-600 mt-2"><strong>Escalation Reason:</strong> {selectedRMA.escalatedReason}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Resolution</label>
              <select
                value={resolutionData.resolution}
                onChange={(e) => setResolutionData({ ...resolutionData, resolution: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                required
              >
                <option value="full_refund">Full Refund</option>
                <option value="partial_refund">Partial Refund</option>
                <option value="store_credit">Store Credit</option>
                <option value="exchange">Exchange</option>
                <option value="rejected">Reject (No Refund)</option>
              </select>
            </div>

            {(resolutionData.resolution === 'partial_refund' || resolutionData.resolution === 'store_credit') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Refund Amount (PKR)</label>
                <input
                  type="number"
                  value={resolutionData.amount}
                  onChange={(e) => setResolutionData({ ...resolutionData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                  max={selectedRMA?.totalItemValue}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Admin Note</label>
              <textarea
                value={resolutionData.note}
                onChange={(e) => setResolutionData({ ...resolutionData, note: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                rows="3"
                placeholder="Resolution details and reasoning..."
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <Button variant="outline" type="button" onClick={() => setShowResolveModal(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Resolve RMA
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminRMAManagement;
