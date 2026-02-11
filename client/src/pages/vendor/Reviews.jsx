import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Loading, Button } from '../../components/common';

const StarIcon = ({ filled, className }) => (
  <svg
    className={className}
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
    />
  </svg>
);

const MessageIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const StarRating = ({ rating, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon
          key={star}
          filled={star <= rating}
          className={`${sizeClasses[size]} ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );
};

const RatingBar = ({ rating, count, total }) => {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600 w-8">{rating} star</span>
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-yellow-400 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm text-gray-500 w-10 text-right">{count}</span>
    </div>
  );
};

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const Reviews = () => {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    rating: '',
    hasReply: '',
  });

  // Reply modal state
  const [replyModal, setReplyModal] = useState({ open: false, review: null });
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [page, filters]);

  const fetchStats = async () => {
    try {
      const response = await api.get('/vendor/reviews/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (filters.rating) params.rating = filters.rating;
      if (filters.hasReply) params.hasReply = filters.hasReply;

      const response = await api.get('/vendor/reviews', { params });
      setReviews(response.data.reviews);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const openReplyModal = (review) => {
    setReplyModal({ open: true, review });
    setReplyContent(review.reply?.content || '');
  };

  const closeReplyModal = () => {
    setReplyModal({ open: false, review: null });
    setReplyContent('');
  };

  const handleSubmitReply = async () => {
    if (!replyContent.trim()) return;

    setSubmitting(true);
    try {
      const endpoint = `/vendor/reviews/${replyModal.review._id}/reply`;
      const method = replyModal.review.reply ? 'put' : 'post';

      await api[method](endpoint, { content: replyContent });
      closeReplyModal();
      fetchReviews();
      fetchStats();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to submit reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReply = async (reviewId) => {
    if (!confirm('Are you sure you want to delete this reply?')) return;

    try {
      await api.delete(`/vendor/reviews/${reviewId}/reply`);
      fetchReviews();
      fetchStats();
    } catch (error) {
      alert('Failed to delete reply');
    }
  };

  if (loading && reviews.length === 0) return <Loading />;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-emerald-600">Reviews</h1>
        <p className="text-gray-500">Manage customer reviews and respond to feedback</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card p-4">
            <p className="text-sm text-gray-500">Average Rating</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-bold">{stats.averageRating}</span>
              <StarRating rating={Math.round(stats.averageRating)} size="sm" />
            </div>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-500">Total Reviews</p>
            <p className="text-2xl font-bold">{stats.totalReviews}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-500">Response Rate</p>
            <p className="text-2xl font-bold">{stats.responseRate}%</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-500">Last 30 Days</p>
            <p className="text-2xl font-bold">{stats.last30Days?.count || 0}</p>
          </div>
        </div>
      )}

      {/* Rating Distribution */}
      {stats && (
        <div className="card p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Rating Distribution</h2>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => (
              <RatingBar
                key={rating}
                rating={rating}
                count={stats.ratingDistribution[rating] || 0}
                total={stats.totalReviews}
              />
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4 mb-6 flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
          <select
            value={filters.rating}
            onChange={(e) => {
              setFilters({ ...filters, rating: e.target.value });
              setPage(1);
            }}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Ratings</option>
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>
                {r} Stars
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reply Status</label>
          <select
            value={filters.hasReply}
            onChange={(e) => {
              setFilters({ ...filters, hasReply: e.target.value });
              setPage(1);
            }}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All</option>
            <option value="true">With Reply</option>
            <option value="false">Needs Reply</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="card p-8 text-center text-gray-500">
            <StarIcon filled={false} className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No reviews found</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review._id} className="card p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <StarRating rating={review.rating} />
                    {review.isVerifiedPurchase && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                        Verified Purchase
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold">{review.title}</h3>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">{formatDate(review.createdAt)}</p>
                  <Link
                    to={`/products/${review.product?.slug}`}
                    className="text-sm text-primary-600 hover:underline"
                  >
                    {review.product?.name}
                  </Link>
                </div>
              </div>

              <p className="text-gray-700 mb-4">{review.comment}</p>

              {/* Images */}
              {review.images?.length > 0 && (
                <div className="flex gap-2 mb-4">
                  {review.images.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt="Review"
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  ))}
                </div>
              )}

              {/* Customer info */}
              <p className="text-sm text-gray-500 mb-4">
                By{' '}
                {review.user?.profile?.firstName
                  ? `${review.user.profile.firstName} ${review.user.profile.lastName}`
                  : 'Anonymous'}
              </p>

              {/* Reply section */}
              {review.reply ? (
                <div className="bg-gray-50 rounded-lg p-4 mt-4">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm font-medium text-gray-700">Your Reply</p>
                    <div className="flex gap-2">
                      {review.reply.canEdit !== false && (
                        <button
                          onClick={() => openReplyModal(review)}
                          className="text-sm text-primary-600 hover:underline"
                        >
                          Edit
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteReply(review._id)}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-600">{review.reply.content}</p>
                  {review.reply.isEdited && (
                    <p className="text-xs text-gray-400 mt-2">Edited</p>
                  )}
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openReplyModal(review)}
                  className="mt-2"
                >
                  <MessageIcon className="w-4 h-4 mr-2" />
                  Reply
                </Button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span className="px-4 py-2 text-gray-600">
            Page {page} of {pagination.pages}
          </span>
          <Button
            variant="outline"
            disabled={page === pagination.pages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Reply Modal */}
      {replyModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">
                {replyModal.review.reply ? 'Edit Reply' : 'Reply to Review'}
              </h2>
            </div>

            <div className="p-6">
              {/* Original review */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <StarRating rating={replyModal.review.rating} size="sm" />
                  <span className="text-sm text-gray-500">
                    {replyModal.review.user?.profile?.firstName || 'Customer'}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{replyModal.review.comment}</p>
              </div>

              {/* Reply input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Reply
                </label>
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={4}
                  maxLength={1000}
                  placeholder="Write a professional and helpful reply..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-400 mt-1 text-right">
                  {replyContent.length}/1000 characters
                </p>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex gap-3 justify-end">
              <Button variant="outline" onClick={closeReplyModal}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmitReply}
                disabled={submitting || !replyContent.trim()}
              >
                {submitting ? 'Submitting...' : 'Submit Reply'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reviews;
