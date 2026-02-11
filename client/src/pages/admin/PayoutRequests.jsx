import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Loading } from '../../components/common';
import toast from 'react-hot-toast';

const SearchIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const ClockIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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

const XIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const CashIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const CheckCircleIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ExclamationIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const BankIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const PayoutRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchRequests();
    fetchStats();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const res = await api.get('/payouts/admin', { params });
      setRequests(res.data.data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/reports/admin/payouts');
      setStats(res.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleStartReview = async (id) => {
    try {
      await api.put(`/payouts/admin/${id}/review`);
      toast.success('Review started');
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error starting review');
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/payouts/admin/${id}/approve`);
      toast.success('Payout approved');
      fetchRequests();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error approving request');
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    try {
      await api.put(`/payouts/admin/${selectedRequest._id}/reject`, {
        rejectionReason,
      });
      toast.success('Payout rejected');
      setShowRejectModal(false);
      setSelectedRequest(null);
      setRejectionReason('');
      fetchRequests();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error rejecting request');
    }
  };

  const handleProcess = async (id) => {
    if (!window.confirm('Mark this payout as processed? This indicates funds have been transferred.')) {
      return;
    }
    try {
      await api.put(`/payouts/admin/${id}/process`, {
        transactionReference: `TXN-${Date.now()}`,
      });
      toast.success('Payout processed successfully');
      fetchRequests();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error processing payout');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'requested':
        return 'bg-amber-50 text-amber-700';
      case 'under_review':
        return 'bg-blue-50 text-blue-700';
      case 'approved':
        return 'bg-emerald-50 text-emerald-700';
      case 'processing':
        return 'bg-violet-50 text-violet-700';
      case 'completed':
        return 'bg-emerald-100 text-emerald-800';
      case 'rejected':
        return 'bg-red-50 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filterTabs = [
    { key: 'all', label: 'All' },
    { key: 'requested', label: 'Pending' },
    { key: 'under_review', label: 'Under Review' },
    { key: 'approved', label: 'Approved' },
    { key: 'processing', label: 'Processing' },
    { key: 'completed', label: 'Completed' },
    { key: 'rejected', label: 'Rejected' },
  ];

  // Filter requests by search
  const filteredRequests = requests.filter(r =>
    r.vendor?.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.vendor?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Avatar colors
  const avatarColors = [
    'bg-emerald-500',
    'bg-blue-500',
    'bg-violet-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-cyan-500',
    'bg-pink-500',
  ];

  const getAvatarColor = (name) => {
    const index = name?.charCodeAt(0) % avatarColors.length || 0;
    return avatarColors[index];
  };

  if (loading && !stats) return <Loading />;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-emerald-600">Payout Requests</h1>
        <p className="text-gray-500 text-sm mt-1">Manage vendor payout requests</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-3 sm:p-4 border border-gray-100">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-amber-50 flex items-center justify-center">
              <ClockIcon className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Pending</p>
              <p className="text-lg sm:text-2xl font-bold text-amber-600">{stats?.byStatus?.requested?.count || 0}</p>
              <p className="text-[10px] sm:text-xs text-gray-400">{formatCurrency(stats?.byStatus?.requested?.totalAmount || 0)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-3 sm:p-4 border border-gray-100">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-50 flex items-center justify-center">
              <EyeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Review</p>
              <p className="text-lg sm:text-2xl font-bold text-blue-600">{stats?.byStatus?.under_review?.count || 0}</p>
              <p className="text-[10px] sm:text-xs text-gray-400">{formatCurrency(stats?.byStatus?.under_review?.totalAmount || 0)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-3 sm:p-4 border border-gray-100">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Approved</p>
              <p className="text-lg sm:text-2xl font-bold text-emerald-600">{stats?.byStatus?.approved?.count || 0}</p>
              <p className="text-[10px] sm:text-xs text-gray-400">{formatCurrency(stats?.byStatus?.approved?.totalAmount || 0)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-3 sm:p-4 border border-gray-100">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-violet-50 flex items-center justify-center">
              <CashIcon className="w-4 h-4 sm:w-5 sm:h-5 text-violet-500" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Completed</p>
              <p className="text-lg sm:text-2xl font-bold text-violet-600">{stats?.byStatus?.completed?.count || 0}</p>
              <p className="text-[10px] sm:text-xs text-gray-400">{formatCurrency(stats?.byStatus?.completed?.totalAmount || 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              filter === tab.key
                ? 'bg-emerald-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        {/* Search */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by vendor name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="sm:hidden divide-y divide-gray-100">
          {loading ? (
            <div className="p-8 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No payout requests found
            </div>
          ) : (
            filteredRequests.map((request) => (
              <div key={request._id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${getAvatarColor(request.vendor?.businessName)} flex items-center justify-center text-white font-medium`}>
                      {request.vendor?.businessName?.charAt(0).toUpperCase() || 'V'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{request.vendor?.businessName}</p>
                      <p className="text-xs text-gray-500">{request.vendor?.email}</p>
                    </div>
                  </div>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(request.status)}`}>
                    {request.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-500">Amount</span>
                    <span className="font-medium text-gray-900">{formatCurrency(request.requestedAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-500">Fees</span>
                    <span className="text-sm text-red-500">-{formatCurrency(request.fees?.totalFees || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-gray-200">
                    <span className="text-sm font-medium text-gray-700">Net Amount</span>
                    <span className="font-bold text-emerald-600">{formatCurrency(request.netAmount)}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="inline-flex px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium capitalize">
                    {request.paymentMethod?.type?.replace('_', ' ')}
                  </span>
                  {request.paymentMethod?.type === 'bank_transfer' && (
                    <span className="text-xs text-gray-500">
                      {request.paymentMethod?.details?.bankName}
                    </span>
                  )}
                  <span className="text-gray-400">|</span>
                  <span className="text-xs text-gray-500">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedRequest(request);
                      setShowDetailModal(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors"
                  >
                    <EyeIcon className="w-4 h-4" />
                    Details
                  </button>
                  {request.status === 'requested' && (
                    <button
                      onClick={() => handleStartReview(request._id)}
                      className="flex-1 px-3 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors"
                    >
                      Review
                    </button>
                  )}
                  {request.status === 'under_review' && (
                    <>
                      <button
                        onClick={() => handleApprove(request._id)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-sm font-medium transition-colors"
                      >
                        <CheckIcon className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowRejectModal(true);
                        }}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
                      >
                        <XIcon className="w-4 h-4" />
                        Reject
                      </button>
                    </>
                  )}
                  {request.status === 'approved' && (
                    <button
                      onClick={() => handleProcess(request._id)}
                      className="flex-1 px-3 py-2 text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-lg text-sm font-medium transition-colors"
                    >
                      Process
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-emerald-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Vendor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Net Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Method</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Date</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-emerald-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                    No payout requests found
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => (
                  <tr key={request._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full ${getAvatarColor(request.vendor?.businessName)} flex items-center justify-center text-white font-medium text-sm`}>
                          {request.vendor?.businessName?.charAt(0).toUpperCase() || 'V'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{request.vendor?.businessName}</p>
                          <p className="text-xs text-gray-500">{request.vendor?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{formatCurrency(request.requestedAmount)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-medium text-gray-900">{formatCurrency(request.netAmount)}</span>
                        <p className="text-xs text-gray-400">
                          Fees: {formatCurrency(request.fees?.totalFees || 0)}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium capitalize">
                          {request.paymentMethod?.type?.replace('_', ' ')}
                        </span>
                        {request.paymentMethod?.type === 'bank_transfer' && (
                          <span className="text-xs text-gray-400">
                            {request.paymentMethod?.details?.bankName}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(request.status)}`}>
                        {request.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowDetailModal(true);
                          }}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        {request.status === 'requested' && (
                          <button
                            onClick={() => handleStartReview(request._id)}
                            className="px-3 py-1 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg text-xs font-medium transition-colors"
                          >
                            Review
                          </button>
                        )}
                        {request.status === 'under_review' && (
                          <>
                            <button
                              onClick={() => handleApprove(request._id)}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Approve"
                            >
                              <CheckIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowRejectModal(true);
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Reject"
                            >
                              <XIcon className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {request.status === 'approved' && (
                          <button
                            onClick={() => handleProcess(request._id)}
                            className="px-3 py-1 text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-lg text-xs font-medium transition-colors"
                          >
                            Process
                          </button>
                        )}
                        {request.status === 'rejected' && request.rejectionReason && (
                          <button
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowDetailModal(true);
                            }}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            title="View Reason"
                          >
                            <ExclamationIcon className="w-4 h-4" />
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

        {/* Footer */}
        {filteredRequests.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-emerald-600">
              Showing {filteredRequests.length} of {requests.length} requests
            </p>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Reject Payout Request</h2>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl mb-4">
                <div className={`w-10 h-10 rounded-full ${getAvatarColor(selectedRequest?.vendor?.businessName)} flex items-center justify-center text-white font-medium text-sm`}>
                  {selectedRequest?.vendor?.businessName?.charAt(0).toUpperCase() || 'V'}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{selectedRequest?.vendor?.businessName}</p>
                  <p className="text-sm text-red-600">{formatCurrency(selectedRequest?.requestedAmount)}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason *</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejection..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  rows="4"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedRequest(null);
                  setRejectionReason('');
                }}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Reject Payout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Payout Details</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(selectedRequest.status)}`}>
                {selectedRequest.status.replace('_', ' ')}
              </span>
            </div>
            <div className="p-6">
              {/* Vendor Info */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl mb-6">
                <div className={`w-12 h-12 rounded-full ${getAvatarColor(selectedRequest.vendor?.businessName)} flex items-center justify-center text-white font-bold text-lg`}>
                  {selectedRequest.vendor?.businessName?.charAt(0).toUpperCase() || 'V'}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{selectedRequest.vendor?.businessName}</p>
                  <p className="text-sm text-gray-500">{selectedRequest.vendor?.email}</p>
                </div>
              </div>

              {/* Amount Details */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500">Requested Amount</span>
                  <span className="font-medium text-gray-900">{formatCurrency(selectedRequest.requestedAmount)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500">Processing Fees</span>
                  <span className="font-medium text-red-600">-{formatCurrency(selectedRequest.fees?.totalFees || 0)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="font-medium text-gray-900">Net Amount</span>
                  <span className="font-bold text-emerald-600 text-lg">{formatCurrency(selectedRequest.netAmount)}</span>
                </div>
              </div>

              {/* Payment Method */}
              <div className="p-4 bg-blue-50 rounded-xl mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <BankIcon className="w-5 h-5 text-blue-500" />
                  <span className="font-medium text-gray-900 capitalize">{selectedRequest.paymentMethod?.type?.replace('_', ' ')}</span>
                </div>
                {selectedRequest.paymentMethod?.type === 'bank_transfer' && (
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Bank: {selectedRequest.paymentMethod?.details?.bankName}</p>
                    <p>Account: {selectedRequest.paymentMethod?.details?.accountNumber}</p>
                    <p>IBAN: {selectedRequest.paymentMethod?.details?.iban}</p>
                  </div>
                )}
              </div>

              {/* Rejection Reason */}
              {selectedRequest.status === 'rejected' && selectedRequest.rejectionReason && (
                <div className="p-4 bg-red-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <ExclamationIcon className="w-5 h-5 text-red-500" />
                    <span className="font-medium text-red-700">Rejection Reason</span>
                  </div>
                  <p className="text-sm text-red-600">{selectedRequest.rejectionReason}</p>
                </div>
              )}

              {/* Date */}
              <div className="mt-6 text-sm text-gray-500 text-center">
                Requested on {new Date(selectedRequest.createdAt).toLocaleDateString()} at {new Date(selectedRequest.createdAt).toLocaleTimeString()}
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedRequest(null);
                }}
                className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayoutRequests;
