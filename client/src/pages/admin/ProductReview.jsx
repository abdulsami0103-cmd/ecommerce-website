import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Button } from '../../components/common';
import { formatPrice } from '../../store/slices/currencySlice';

const ProductReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const { currentCurrency } = useSelector((state) => state.currency);
  const formatAmount = (amount) => formatPrice(amount, currentCurrency);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/products/${id}`);
      setProduct(res.data.data);
    } catch (error) {
      console.error('Failed to fetch product:', error);
      toast.error('Product not found');
      navigate('/admin/moderation');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await api.patch(`/admin/products/${id}/moderate`, {
        action: 'approve'
      });
      toast.success('Product approved successfully');
      navigate('/admin/moderation');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve product');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    setActionLoading(true);
    try {
      await api.patch(`/admin/products/${id}/moderate`, {
        action: 'reject',
        reason: rejectionReason
      });
      toast.success('Product rejected');
      setShowRejectModal(false);
      navigate('/admin/moderation');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject product');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-gray-500">Product not found</p>
      </div>
    );
  }

  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    pending_review: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    published: 'bg-blue-100 text-blue-800',
    rejected: 'bg-red-100 text-red-800',
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => navigate('/admin/moderation')}
            className="text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Moderation Queue
          </button>
          <h1 className="text-2xl font-bold">Product Review</h1>
        </div>

        {product.moderation?.status === 'pending_review' && (
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowRejectModal(true)}
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              Reject
            </Button>
            <Button
              onClick={handleApprove}
              loading={actionLoading}
            >
              Approve
            </Button>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info Card */}
          <div className="card p-6">
            <div className="flex items-start gap-4">
              {product.images?.[0] ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-32 h-32 object-cover rounded-lg"
                />
              ) : (
                <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400">No Image</span>
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-xl font-bold">{product.name}</h2>
                <p className="text-gray-500 text-sm">SKU: {product.inventory?.sku || 'N/A'}</p>
                <p className="text-gray-500 text-sm">Vendor: {product.vendor?.storeName || 'Unknown'}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[product.moderation?.status] || 'bg-gray-100'}`}>
                    {product.moderation?.status?.replace('_', ' ') || 'Unknown'}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {product.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="card p-6">
            <h3 className="font-semibold mb-3">Description</h3>
            <p className="text-gray-600 whitespace-pre-wrap">{product.description || 'No description provided'}</p>

            {product.shortDescription && (
              <div className="mt-4">
                <h4 className="font-medium text-sm text-gray-500 mb-1">Short Description</h4>
                <p className="text-gray-600">{product.shortDescription}</p>
              </div>
            )}
          </div>

          {/* Variants */}
          {product.hasVariants && product.options?.length > 0 && (
            <div className="card p-6">
              <h3 className="font-semibold mb-3">Variants</h3>
              <div className="space-y-3">
                {product.options.map((option, idx) => (
                  <div key={idx}>
                    <p className="text-sm font-medium text-gray-700">{option.name}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {option.values?.map((value, vidx) => (
                        <span key={vidx} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                          {value}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {product.tags?.length > 0 && (
            <div className="card p-6">
              <h3 className="font-semibold mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag, idx) => (
                  <span key={idx} className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pricing */}
          <div className="card p-6">
            <h3 className="font-semibold mb-3">Pricing</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Price</span>
                <span className="font-bold text-lg">{formatAmount(product.price?.amount)}</span>
              </div>
              {product.price?.compareAt > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Compare at</span>
                  <span className="text-gray-400 line-through">{formatAmount(product.price.compareAt)}</span>
                </div>
              )}
              {product.price?.cost > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Cost</span>
                  <span>{formatAmount(product.price.cost)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Inventory */}
          <div className="card p-6">
            <h3 className="font-semibold mb-3">Inventory</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">SKU</span>
                <span>{product.inventory?.sku || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Quantity</span>
                <span>{product.inventory?.quantity || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Track Inventory</span>
                <span>{product.inventory?.trackQuantity ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>

          {/* Category */}
          <div className="card p-6">
            <h3 className="font-semibold mb-3">Category</h3>
            <p>{product.category?.name || 'Uncategorized'}</p>
          </div>

          {/* Submission Info */}
          <div className="card p-6">
            <h3 className="font-semibold mb-3">Submission Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Submitted</span>
                <span>{product.moderation?.submittedAt ? new Date(product.moderation.submittedAt).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Created</span>
                <span>{new Date(product.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Reject Product</h3>
            <p className="text-gray-600 mb-4">Please provide a reason for rejection:</p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full border rounded-lg p-3 mb-4"
              rows={4}
              placeholder="Enter rejection reason..."
            />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowRejectModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleReject}
                loading={actionLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                Reject
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductReview;
