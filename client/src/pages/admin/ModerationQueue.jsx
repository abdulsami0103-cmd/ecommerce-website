import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Button, Modal } from '../../components/common';

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

const SearchIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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

const AdminModerationQueue = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({});
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    status: 'pending_review',
    vendor: '',
    category: '',
    page: 1,
  });
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchStats();
  }, [filters]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        status: filters.status,
        page: filters.page,
        limit: 20,
      });
      if (filters.vendor) params.append('vendor', filters.vendor);
      if (filters.category) params.append('category', filters.category);

      const response = await api.get(`/admin/products/moderation-queue?${params}`);
      setProducts(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast.error('Failed to load moderation queue');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/products/moderation-queue/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleModerate = async () => {
    if (!selectedProduct || !actionType) return;

    if ((actionType === 'reject' || actionType === 'request_changes') && !reason) {
      toast.error('Please provide a reason');
      return;
    }

    setProcessing(true);
    try {
      await api.patch(`/admin/products/${selectedProduct._id}/moderate`, {
        action: actionType,
        reason,
      });
      toast.success(`Product ${actionType === 'approve' ? 'approved' : actionType === 'reject' ? 'rejected' : 'changes requested'}`);
      setShowModal(false);
      setSelectedProduct(null);
      setActionType(null);
      setReason('');
      fetchProducts();
      fetchStats();
    } catch (error) {
      toast.error('Failed to process moderation');
    } finally {
      setProcessing(false);
    }
  };

  const openActionModal = (product, action) => {
    setSelectedProduct(product);
    setActionType(action);
    setReason('');
    setShowModal(true);
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-700',
      pending_review: 'bg-amber-100 text-amber-700',
      approved: 'bg-blue-100 text-blue-700',
      published: 'bg-emerald-100 text-emerald-700',
      rejected: 'bg-red-100 text-red-700',
      changes_requested: 'bg-orange-100 text-orange-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const formatStatus = (status) => {
    return status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
  };

  const filteredProducts = products.filter(product =>
    product.name?.toLowerCase().includes(search.toLowerCase()) ||
    product.vendor?.storeName?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-emerald-600">Product Moderation Queue</h1>
        <p className="text-sm text-gray-500 mt-1">Review and approve vendor products</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Pending Review', value: stats.pending_review || 0, bgColor: 'bg-amber-100', textColor: 'text-amber-700' },
          { label: 'Approved', value: stats.approved || 0, bgColor: 'bg-blue-100', textColor: 'text-blue-700' },
          { label: 'Published', value: stats.published || 0, bgColor: 'bg-emerald-100', textColor: 'text-emerald-700' },
          { label: 'Rejected', value: stats.rejected || 0, bgColor: 'bg-red-100', textColor: 'text-red-700' },
          { label: 'Changes Requested', value: stats.changes_requested || 0, bgColor: 'bg-orange-100', textColor: 'text-orange-700' },
          { label: 'Drafts', value: stats.draft || 0, bgColor: 'bg-gray-100', textColor: 'text-gray-700' },
        ].map((stat, index) => (
          <div key={index} className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.bgColor} ${stat.textColor} px-3 py-1 rounded-lg inline-block mt-2`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* Table Header with Filters */}
        <div className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-900">Moderation Queue</h3>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-900" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 w-40 placeholder-gray-900 text-gray-900"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm text-gray-900"
              >
                <option value="all">All Status</option>
                <option value="pending_review">Pending Review</option>
                <option value="approved">Approved</option>
                <option value="published">Published</option>
                <option value="rejected">Rejected</option>
                <option value="changes_requested">Changes Requested</option>
                <option value="draft">Draft</option>
              </select>
              <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-900 pointer-events-none" />
            </div>

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
        {filteredProducts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No products found in moderation queue
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="sm:hidden divide-y divide-gray-100">
              {filteredProducts.map((product) => (
                <div key={product._id} className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <img
                      src={product.images?.[0] || '/placeholder-product.png'}
                      alt={product.name}
                      className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                      <p className="text-xs text-gray-500">PKR {product.price?.amount}</p>
                      <p className="text-xs text-emerald-600 mt-1">{product.vendor?.storeName || '-'}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${getStatusBadgeColor(product.moderation?.status)}`}>
                      {formatStatus(product.moderation?.status)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>#{product._id.slice(-6)}</span>
                      <span>•</span>
                      <span>{product.category?.name || '-'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Link
                        to={`/admin/products/${product._id}/review`}
                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </Link>
                      {product.moderation?.status === 'pending_review' && (
                        <>
                          <button
                            onClick={() => openActionModal(product, 'approve')}
                            className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded transition-colors"
                          >
                            <CheckIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => openActionModal(product, 'reject')}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                          >
                            <XIcon className="w-5 h-5" />
                          </button>
                        </>
                      )}
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
                    <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">ID</th>
                    <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Product</th>
                    <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Vendor</th>
                    <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Category</th>
                    <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Status</th>
                    <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Submitted</th>
                    <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-500">#{product._id.slice(-6)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.images?.[0] || '/placeholder-product.png'}
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded-lg"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{product.name}</p>
                            <p className="text-xs text-gray-500">PKR {product.price?.amount}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">{product.vendor?.storeName || '-'}</p>
                        {product.vendor?.trustedVendor?.isTrusted && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">Trusted</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {product.category?.name || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(product.moderation?.status)}`}>
                          {formatStatus(product.moderation?.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {product.moderation?.submittedAt
                          ? new Date(product.moderation.submittedAt).toLocaleDateString()
                          : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <Link
                            to={`/admin/products/${product._id}/review`}
                            className="p-1 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                            title="View Details"
                          >
                            <EyeIcon className="w-5 h-5" />
                          </Link>
                          {product.moderation?.status === 'pending_review' && (
                            <>
                              <button
                                onClick={() => openActionModal(product, 'approve')}
                                className="p-1 text-emerald-500 hover:bg-emerald-50 rounded transition-colors"
                                title="Approve"
                              >
                                <CheckIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => openActionModal(product, 'reject')}
                                className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                                title="Reject"
                              >
                                <XIcon className="w-5 h-5" />
                              </button>
                            </>
                          )}
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
            Showing {filteredProducts.length} of {pagination.total} Result
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
              disabled={filters.page === 1}
              className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button className="w-8 h-8 text-sm bg-emerald-500 text-white rounded-lg">
              {String(filters.page).padStart(2, '0')}
            </button>
            <button
              onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
              disabled={filters.page >= pagination.pages}
              className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Action Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedProduct(null);
          setActionType(null);
          setReason('');
        }}
        title={
          actionType === 'approve'
            ? 'Approve Product'
            : actionType === 'reject'
            ? 'Reject Product'
            : 'Request Changes'
        }
      >
        <div className="space-y-4">
          {selectedProduct && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <img
                src={selectedProduct.images?.[0] || '/placeholder-product.png'}
                alt={selectedProduct.name}
                className="w-16 h-16 object-cover rounded-lg"
              />
              <div>
                <p className="font-medium text-gray-900">{selectedProduct.name}</p>
                <p className="text-sm text-gray-500">{selectedProduct.vendor?.storeName}</p>
              </div>
            </div>
          )}

          {actionType === 'approve' ? (
            <p className="text-gray-600">Are you sure you want to approve this product?</p>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                {actionType === 'reject' ? 'Rejection Reason' : 'Changes Requested'} *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                rows="3"
                placeholder={
                  actionType === 'reject'
                    ? 'Why is this product being rejected?'
                    : 'What changes need to be made?'
                }
              />
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowModal(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleModerate}
              loading={processing}
              className={
                actionType === 'approve'
                  ? 'bg-emerald-500 hover:bg-emerald-600'
                  : actionType === 'reject'
                  ? 'bg-red-500 hover:bg-red-600'
                  : ''
              }
            >
              {actionType === 'approve'
                ? 'Approve'
                : actionType === 'reject'
                ? 'Reject'
                : 'Request Changes'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminModerationQueue;
