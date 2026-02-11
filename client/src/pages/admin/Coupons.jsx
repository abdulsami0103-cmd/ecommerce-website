import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Button, Modal } from '../../components/common';

const SearchIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const PlusIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const EditIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const CopyIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
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

const TagIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

const COUPON_TYPES = [
  { value: 'percentage', label: 'Percentage' },
  { value: 'fixed', label: 'Fixed Amount' },
  { value: 'free_shipping', label: 'Free Shipping' },
  { value: 'buy_x_get_y', label: 'Buy X Get Y' },
];

const initialFormState = {
  code: '',
  name: '',
  description: '',
  type: 'percentage',
  value: '',
  scope: 'platform',
  minPurchase: '',
  maxDiscount: '',
  startsAt: new Date().toISOString().slice(0, 16),
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  usageLimit: '',
  perUserLimit: 1,
  stackable: false,
  autoApply: false,
  firstOrderOnly: false,
};

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [stats, setStats] = useState(null);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState(initialFormState);

  const [statsModal, setStatsModal] = useState({ open: false, coupon: null, stats: null });

  useEffect(() => {
    fetchCoupons();
    fetchStats();
  }, [page, statusFilter, typeFilter]);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page, limit: 10 });
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('type', typeFilter);

      const response = await api.get(`/admin/coupons?${params}`);
      setCoupons(response.data.data || []);
      setPagination(response.data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      toast.error('Failed to fetch coupons');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/coupons/stats');
      setStats(response.data.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCoupons();
  };

  const handleOpenDialog = (coupon = null) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code,
        name: coupon.name,
        description: coupon.description || '',
        type: coupon.type,
        value: coupon.value,
        scope: coupon.scope,
        minPurchase: coupon.minPurchase || '',
        maxDiscount: coupon.maxDiscount || '',
        startsAt: new Date(coupon.startsAt).toISOString().slice(0, 16),
        expiresAt: new Date(coupon.expiresAt).toISOString().slice(0, 16),
        usageLimit: coupon.usageLimit || '',
        perUserLimit: coupon.perUserLimit || 1,
        stackable: coupon.stackable || false,
        autoApply: coupon.autoApply || false,
        firstOrderOnly: coupon.firstOrderOnly || false,
      });
    } else {
      setEditingCoupon(null);
      setFormData(initialFormState);
    }
    setOpenDialog(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        value: parseFloat(formData.value),
        minPurchase: formData.minPurchase ? parseFloat(formData.minPurchase) : 0,
        maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : undefined,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
        perUserLimit: parseInt(formData.perUserLimit) || 1,
      };

      if (editingCoupon) {
        await api.put(`/admin/coupons/${editingCoupon._id}`, payload);
        toast.success('Coupon updated successfully');
      } else {
        await api.post('/admin/coupons', payload);
        toast.success('Coupon created successfully');
      }

      setOpenDialog(false);
      fetchCoupons();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save coupon');
    }
  };

  const handleDelete = async (couponId) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await api.delete(`/admin/coupons/${couponId}`);
      toast.success('Coupon deleted successfully');
      fetchCoupons();
      fetchStats();
    } catch (err) {
      toast.error('Failed to delete coupon');
    }
  };

  const handleViewStats = async (coupon) => {
    try {
      const response = await api.get(`/admin/coupons/${coupon._id}/stats`);
      setStatsModal({ open: true, coupon, stats: response.data.data });
    } catch (err) {
      toast.error('Failed to fetch coupon statistics');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Coupon code copied!');
  };

  const getStatusBadge = (coupon) => {
    if (!coupon.isActive) return { label: 'Inactive', color: 'bg-gray-100 text-gray-700' };
    if (new Date(coupon.expiresAt) < new Date()) return { label: 'Expired', color: 'bg-red-100 text-red-700' };
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return { label: 'Exhausted', color: 'bg-amber-100 text-amber-700' };
    }
    return { label: 'Active', color: 'bg-emerald-100 text-emerald-700' };
  };

  const getTypeBadgeColor = (type) => {
    const colors = {
      percentage: 'bg-violet-100 text-violet-700',
      fixed: 'bg-blue-100 text-blue-700',
      free_shipping: 'bg-teal-100 text-teal-700',
      buy_x_get_y: 'bg-pink-100 text-pink-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-emerald-600">Coupon Management</h1>
          <p className="text-sm text-gray-500 mt-1">{pagination.total} total coupons</p>
        </div>
        <button
          onClick={() => handleOpenDialog()}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Create Coupon
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Total Coupons</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalCoupons}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Active</p>
            <p className="text-2xl font-bold text-emerald-600">{stats.activeCoupons}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Total Usage</p>
            <p className="text-2xl font-bold text-blue-600">{stats.totalUsage}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Total Discount</p>
            <p className="text-2xl font-bold text-violet-600">Rs. {stats.totalDiscount?.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Revenue</p>
            <p className="text-2xl font-bold text-pink-600">Rs. {stats.totalRevenue?.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Coupons Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* Table Header with Filters */}
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="text-lg font-semibold text-gray-900">All Coupons</h3>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Search */}
              <form onSubmit={handleSearch} className="relative flex-1 sm:flex-none">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-900" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-32 placeholder-gray-900 text-gray-900"
                />
              </form>

              {/* Status Filter */}
              <div className="relative flex-1 sm:flex-none">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm text-gray-900 w-full"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="expired">Expired</option>
                </select>
                <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-900 pointer-events-none" />
              </div>

              {/* Type Filter */}
              <div className="relative flex-1 sm:flex-none">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm text-gray-900 w-full"
                >
                  <option value="">All Types</option>
                  {COUPON_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-900 pointer-events-none" />
              </div>

              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
                <MoreIcon className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto" />
          </div>
        ) : coupons.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No coupons found</div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="sm:hidden divide-y divide-gray-100">
              {coupons.map((coupon) => {
                const status = getStatusBadge(coupon);
                return (
                  <div key={coupon._id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <TagIcon className="w-4 h-4 text-emerald-500" />
                          <span className="text-sm font-bold text-gray-900">{coupon.code}</span>
                          <button
                            onClick={() => copyToClipboard(coupon.code)}
                            className="p-0.5 hover:bg-gray-100 rounded transition-colors"
                          >
                            <CopyIcon className="w-3.5 h-3.5 text-gray-400" />
                          </button>
                        </div>
                        <p className="text-xs text-gray-500">{coupon.name}</p>
                      </div>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <div className="space-y-1.5 mb-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">Type</span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getTypeBadgeColor(coupon.type)}`}>
                          {COUPON_TYPES.find(t => t.value === coupon.type)?.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">Value</span>
                        <span className="text-gray-900 font-medium">
                          {coupon.type === 'percentage' ? `${coupon.value}%` : coupon.type === 'free_shipping' ? 'Free' : `Rs. ${coupon.value}`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">Usage</span>
                        <span className="text-gray-700">{coupon.usedCount}{coupon.usageLimit && ` / ${coupon.usageLimit}`}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">Expires</span>
                        <span className="text-gray-700">{new Date(coupon.expiresAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-1 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => handleViewStats(coupon)}
                        className="p-1.5 text-violet-500 hover:bg-violet-50 rounded transition-colors"
                      >
                        <ChartIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleOpenDialog(coupon)}
                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                      >
                        <EditIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(coupon._id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-emerald-50">
                    <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Code</th>
                    <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Name</th>
                    <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Type</th>
                    <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Value</th>
                    <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Usage</th>
                    <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Expires</th>
                    <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Status</th>
                    <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((coupon) => {
                    const status = getStatusBadge(coupon);
                    return (
                      <tr key={coupon._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <TagIcon className="w-4 h-4 text-emerald-500" />
                            <span className="text-sm font-bold text-gray-900">{coupon.code}</span>
                            <button
                              onClick={() => copyToClipboard(coupon.code)}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                            >
                              <CopyIcon className="w-4 h-4 text-gray-400" />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900">{coupon.name}</p>
                          {coupon.vendor && (
                            <p className="text-xs text-gray-500">Vendor: {coupon.vendor.storeName}</p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getTypeBadgeColor(coupon.type)}`}>
                            {COUPON_TYPES.find(t => t.value === coupon.type)?.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-gray-900">
                            {coupon.type === 'percentage' ? `${coupon.value}%` : coupon.type === 'free_shipping' ? 'Free' : `Rs. ${coupon.value}`}
                          </p>
                          {coupon.maxDiscount && (
                            <p className="text-xs text-gray-500">Max: Rs. {coupon.maxDiscount}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {coupon.usedCount}{coupon.usageLimit && ` / ${coupon.usageLimit}`}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(coupon.expiresAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleViewStats(coupon)}
                              className="p-1 text-violet-500 hover:bg-violet-50 rounded transition-colors"
                              title="View Stats"
                            >
                              <ChartIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleOpenDialog(coupon)}
                              className="p-1 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                              title="Edit"
                            >
                              <EditIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(coupon._id)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                              title="Delete"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination */}
        <div className="px-6 py-4 flex items-center justify-between border-t border-gray-100">
          <p className="text-sm text-emerald-600">
            Showing {coupons.length} of {pagination.total} Result
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

      {/* Create/Edit Modal */}
      <Modal
        isOpen={openDialog}
        onClose={() => setOpenDialog(false)}
        title={editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
              rows="2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
              >
                {COUPON_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formData.type === 'percentage' ? 'Discount %' : 'Discount Amount'}
              </label>
              <input
                type="number"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Purchase (Rs.)</label>
              <input
                type="number"
                value={formData.minPurchase}
                onChange={(e) => setFormData({ ...formData, minPurchase: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount (Rs.)</label>
              <input
                type="number"
                value={formData.maxDiscount}
                onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="datetime-local"
                value={formData.startsAt}
                onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
              <input
                type="datetime-local"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit</label>
              <input
                type="number"
                value={formData.usageLimit}
                onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                placeholder="Unlimited"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Per User Limit</label>
              <input
                type="number"
                value={formData.perUserLimit}
                onChange={(e) => setFormData({ ...formData, perUserLimit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
              />
            </div>
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.stackable}
                onChange={(e) => setFormData({ ...formData, stackable: e.target.checked })}
                className="w-4 h-4 text-emerald-500 border-gray-300 rounded focus:ring-emerald-500"
              />
              <span className="text-sm text-gray-700">Stackable</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.autoApply}
                onChange={(e) => setFormData({ ...formData, autoApply: e.target.checked })}
                className="w-4 h-4 text-emerald-500 border-gray-300 rounded focus:ring-emerald-500"
              />
              <span className="text-sm text-gray-700">Auto-apply</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.firstOrderOnly}
                onChange={(e) => setFormData({ ...formData, firstOrderOnly: e.target.checked })}
                className="w-4 h-4 text-emerald-500 border-gray-300 rounded focus:ring-emerald-500"
              />
              <span className="text-sm text-gray-700">First order only</span>
            </label>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button variant="outline" type="button" onClick={() => setOpenDialog(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingCoupon ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Stats Modal */}
      <Modal
        isOpen={statsModal.open}
        onClose={() => setStatsModal({ open: false, coupon: null, stats: null })}
        title={`Stats: ${statsModal.coupon?.code}`}
      >
        {statsModal.stats ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Total Usage</p>
                <p className="text-xl font-bold text-gray-900">{statsModal.stats.stats?.totalUsage || 0}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Unique Customers</p>
                <p className="text-xl font-bold text-gray-900">{statsModal.stats.stats?.uniqueCustomers || 0}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Total Discount</p>
                <p className="text-xl font-bold text-violet-600">Rs. {statsModal.stats.stats?.totalDiscount?.toLocaleString() || 0}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-xl font-bold text-emerald-600">Rs. {statsModal.stats.stats?.totalRevenue?.toLocaleString() || 0}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Avg. Discount</p>
                <p className="text-xl font-bold text-gray-900">Rs. {statsModal.stats.stats?.avgDiscount?.toLocaleString() || 0}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Avg. Order Value</p>
                <p className="text-xl font-bold text-gray-900">Rs. {statsModal.stats.stats?.avgOrderValue?.toLocaleString() || 0}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto" />
          </div>
        )}
      </Modal>
    </div>
  );
}
