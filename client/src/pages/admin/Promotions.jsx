import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
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

const XIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ChartIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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

export default function AdminPromotions() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [stats, setStats] = useState({});
  const [statusFilter, setStatusFilter] = useState('');

  const [reviewModal, setReviewModal] = useState({ open: false, promotion: null });
  const [reviewNote, setReviewNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const [statsModal, setStatsModal] = useState({ open: false, stats: null });

  useEffect(() => {
    fetchPromotions();
  }, [page, statusFilter]);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page, limit: 10 });
      if (statusFilter) params.append('status', statusFilter);

      const response = await api.get(`/admin/promotions?${params}`);
      setPromotions(response.data.data || []);
      setPagination(response.data.pagination || { page: 1, pages: 1, total: 0 });
      setStats(response.data.stats || {});
    } catch (err) {
      toast.error('Failed to fetch promotions');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (action) => {
    try {
      await api.put(`/admin/promotions/${reviewModal.promotion._id}/review`, {
        action,
        note: reviewNote,
        rejectionReason: action === 'reject' ? rejectionReason : undefined,
      });
      toast.success(`Promotion ${action}d successfully`);
      setReviewModal({ open: false, promotion: null });
      setReviewNote('');
      setRejectionReason('');
      fetchPromotions();
    } catch (err) {
      toast.error(`Failed to ${action} promotion`);
    }
  };

  const handleViewStats = async (promotion) => {
    try {
      const response = await api.get(`/admin/promotions/${promotion._id}/stats`);
      setStatsModal({ open: true, stats: response.data.data });
    } catch (err) {
      toast.error('Failed to fetch promotion stats');
    }
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-700',
      pending_review: 'bg-amber-100 text-amber-700',
      approved: 'bg-blue-100 text-blue-700',
      rejected: 'bg-red-100 text-red-700',
      active: 'bg-emerald-100 text-emerald-700',
      paused: 'bg-gray-100 text-gray-700',
      completed: 'bg-violet-100 text-violet-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status) => {
    const labels = {
      draft: 'Draft',
      pending_review: 'Pending Review',
      approved: 'Approved',
      rejected: 'Rejected',
      active: 'Active',
      paused: 'Paused',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    return labels[status] || status;
  };

  const getAvatarColor = (index) => {
    const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-violet-500', 'bg-amber-500', 'bg-pink-500', 'bg-cyan-500'];
    return colors[index % colors.length];
  };

  const formatCurrency = (amount) => `Rs. ${amount?.toLocaleString() || 0}`;

  const pendingCount = stats.pending_review || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-emerald-600">Promotions</h1>
          <p className="text-sm text-gray-500 mt-1">{pagination.total} total promotions</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className={`rounded-2xl shadow-sm p-4 ${pendingCount > 0 ? 'bg-amber-50' : 'bg-white'}`}>
          <p className="text-sm text-gray-500">Pending Review</p>
          <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-emerald-600">{stats.active || 0}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Approved</p>
          <p className="text-2xl font-bold text-blue-600">{stats.approved || 0}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Rejected</p>
          <p className="text-2xl font-bold text-red-600">{stats.rejected || 0}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-2xl font-bold text-violet-600">{stats.completed || 0}</p>
        </div>
      </div>

      {/* Promotions Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* Table Header with Filters */}
        <div className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-900">All Promotions</h3>

          <div className="flex items-center gap-3">
            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm text-gray-900"
              >
                <option value="">All Status</option>
                <option value="pending_review">Pending Review</option>
                <option value="approved">Approved</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
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
        ) : promotions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No promotions found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-emerald-50">
                  <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Title</th>
                  <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Vendor</th>
                  <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Placement</th>
                  <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Period</th>
                  <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Budget</th>
                  <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Status</th>
                  <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Stats</th>
                  <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {promotions.map((promo, index) => (
                  <tr key={promo._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {promo.creative?.imageUrl ? (
                          <img
                            src={promo.creative.imageUrl}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className={`w-10 h-10 rounded-lg ${getAvatarColor(index)} flex items-center justify-center`}>
                            <span className="text-white text-xs font-medium">
                              {promo.creative?.title?.[0] || 'P'}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{promo.creative?.title}</p>
                          <p className="text-xs text-gray-500">{promo.entityType}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {promo.vendor?.storeName}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                        {promo.slot?.placement?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">
                        {new Date(promo.scheduling?.startsAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(promo.scheduling?.expiresAt).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(promo.budget?.amount)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Spent: {formatCurrency(promo.budget?.spent)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(promo.status)}`}>
                        {getStatusLabel(promo.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-gray-500">{promo.stats?.impressions || 0} imp</p>
                      <p className="text-xs text-gray-500">{promo.stats?.clicks || 0} clicks</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleViewStats(promo)}
                          className="p-1 text-violet-500 hover:bg-violet-50 rounded transition-colors"
                          title="View Stats"
                        >
                          <ChartIcon className="w-5 h-5" />
                        </button>
                        {promo.status === 'pending_review' && (
                          <button
                            onClick={() => setReviewModal({ open: true, promotion: promo })}
                            className="p-1 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                            title="Review"
                          >
                            <EyeIcon className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="px-6 py-4 flex items-center justify-between border-t border-gray-100">
          <p className="text-sm text-emerald-600">
            Showing {promotions.length} of {pagination.total} Result
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

      {/* Review Modal */}
      <Modal
        isOpen={reviewModal.open}
        onClose={() => setReviewModal({ open: false, promotion: null })}
        title="Review Promotion"
      >
        {reviewModal.promotion && (
          <div className="space-y-4">
            {/* Creative Preview */}
            <div className="p-4 bg-gray-50 rounded-lg">
              {reviewModal.promotion.creative?.imageUrl && (
                <img
                  src={reviewModal.promotion.creative.imageUrl}
                  alt="Creative"
                  className="w-full max-h-48 object-contain rounded-lg mb-3"
                />
              )}
              <h4 className="text-lg font-medium text-gray-900">{reviewModal.promotion.creative?.title}</h4>
              <p className="text-sm text-gray-500">{reviewModal.promotion.creative?.description}</p>
              <span className="inline-block mt-2 px-3 py-1 text-sm bg-emerald-500 text-white rounded">
                {reviewModal.promotion.creative?.callToAction}
              </span>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Vendor</p>
                <p className="font-medium text-gray-900">{reviewModal.promotion.vendor?.storeName}</p>
              </div>
              <div>
                <p className="text-gray-500">Placement</p>
                <p className="font-medium text-gray-900">{reviewModal.promotion.slot?.name}</p>
              </div>
              <div>
                <p className="text-gray-500">Period</p>
                <p className="font-medium text-gray-900">
                  {new Date(reviewModal.promotion.scheduling?.startsAt).toLocaleDateString()} - {new Date(reviewModal.promotion.scheduling?.expiresAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Budget</p>
                <p className="font-medium text-gray-900">{formatCurrency(reviewModal.promotion.budget?.amount)}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Review Note (optional)</label>
              <textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                rows="2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason (if rejecting)</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                rows="2"
              />
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button variant="outline" onClick={() => setReviewModal({ open: false, promotion: null })}>
                Cancel
              </Button>
              <button
                onClick={() => handleReview('reject')}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <XIcon className="w-4 h-4" />
                Reject
              </button>
              <button
                onClick={() => handleReview('approve')}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
              >
                <CheckIcon className="w-4 h-4" />
                Approve
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Stats Modal */}
      <Modal
        isOpen={statsModal.open}
        onClose={() => setStatsModal({ open: false, stats: null })}
        title="Promotion Statistics"
      >
        {statsModal.stats && (
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Impressions</p>
              <p className="text-xl font-bold text-gray-900">{statsModal.stats.stats?.impressions || 0}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Clicks</p>
              <p className="text-xl font-bold text-gray-900">{statsModal.stats.stats?.clicks || 0}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">CTR</p>
              <p className="text-xl font-bold text-blue-600">{statsModal.stats.performance?.ctr || 0}%</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Unique Clicks</p>
              <p className="text-xl font-bold text-gray-900">{statsModal.stats.stats?.uniqueClicks || 0}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Conversions</p>
              <p className="text-xl font-bold text-emerald-600">{statsModal.stats.stats?.conversions || 0}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Revenue</p>
              <p className="text-xl font-bold text-emerald-600">{formatCurrency(statsModal.stats.stats?.revenue)}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Cost per Click</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(statsModal.stats.performance?.costPerClick)}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">ROAS</p>
              <p className="text-xl font-bold text-violet-600">{statsModal.stats.performance?.roas || 0}x</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
