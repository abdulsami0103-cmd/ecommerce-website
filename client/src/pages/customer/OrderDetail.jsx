import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

import orderService from '../../services/orderService';
import productService from '../../services/productService';
import { Loading, Price, Button } from '../../components/common';

const OrderDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
    cardName: '',
    phoneNumber: '',
  });

  // Review states
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewItem, setReviewItem] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewedProducts, setReviewedProducts] = useState([]);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const data = await orderService.getOrder(id);
      setOrder(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-indigo-100 text-indigo-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const canPayOnline = () => {
    return order?.payment?.status === 'pending' &&
           ['stripe', 'card', 'jazzcash', 'easypaisa'].includes(order?.payment?.method);
  };

  const handlePaymentFormChange = (e) => {
    const { name, value } = e.target;
    setPaymentForm(prev => ({ ...prev, [name]: value }));
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  const validatePayment = () => {
    if (selectedPaymentMethod === 'card') {
      if (!paymentForm.cardNumber || paymentForm.cardNumber.replace(/\s/g, '').length < 16) {
        toast.error('Please enter a valid card number');
        return false;
      }
      if (!paymentForm.cardExpiry || !/^\d{2}\/\d{2}$/.test(paymentForm.cardExpiry)) {
        toast.error('Please enter valid expiry date (MM/YY)');
        return false;
      }
      if (!paymentForm.cardCvv || paymentForm.cardCvv.length < 3) {
        toast.error('Please enter valid CVV');
        return false;
      }
      if (!paymentForm.cardName) {
        toast.error('Please enter cardholder name');
        return false;
      }
    } else if (['jazzcash', 'easypaisa'].includes(selectedPaymentMethod)) {
      if (!paymentForm.phoneNumber || !/^03\d{9}$/.test(paymentForm.phoneNumber)) {
        toast.error('Please enter valid phone number (03XXXXXXXXX)');
        return false;
      }
    }
    return true;
  };

  const handlePayNow = async () => {
    if (!validatePayment()) return;

    setProcessingPayment(true);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // In real implementation, this would:
      // - Card: Send to Stripe API
      // - JazzCash: Redirect to JazzCash gateway
      // - EasyPaisa: Redirect to EasyPaisa gateway

      // Update payment status via API
      await orderService.updatePaymentStatus(id, {
        status: 'paid',
        transactionId: 'TXN' + Date.now(),
        paidAt: new Date().toISOString()
      });

      toast.success('Payment successful!');
      setShowPaymentModal(false);
      setSelectedPaymentMethod(null);
      setPaymentForm({ cardNumber: '', cardExpiry: '', cardCvv: '', cardName: '', phoneNumber: '' });
      fetchOrder();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const openReviewModal = (item) => {
    setReviewItem(item);
    setReviewRating(0);
    setReviewHover(0);
    setReviewTitle('');
    setReviewComment('');
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (reviewRating === 0) {
      toast.error('Please select a rating');
      return;
    }
    if (!reviewComment.trim()) {
      toast.error('Please write a review');
      return;
    }

    setSubmittingReview(true);
    try {
      await productService.addReview(reviewItem.product?._id || reviewItem.product, {
        rating: reviewRating,
        title: reviewTitle,
        comment: reviewComment,
        order: order._id,
      });
      toast.success('Review submitted successfully!');
      setReviewedProducts(prev => [...prev, reviewItem.product?._id || reviewItem.product]);
      setShowReviewModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const isProductReviewed = (item) => {
    const productId = item.product?._id || item.product;
    return reviewedProducts.includes(productId);
  };

  if (loading) return <Loading fullScreen />;

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p className="text-gray-500 mb-4">{error}</p>
        <Link to="/orders" className="text-primary-600 hover:underline">
          Back to Orders
        </Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
        <Link to="/orders" className="text-primary-600 hover:underline">
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Order #{order.orderNumber}</h1>
          <p className="text-gray-500">
            Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <span className={`mt-2 sm:mt-0 px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Items */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.items?.map((item, index) => (
                <div key={index} className="flex gap-4 pb-4 border-b last:border-0">
                  <img
                    src={item.image || 'https://placehold.co/80'}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium">{item.name}</h3>
                    {item.variant && (
                      <p className="text-sm text-gray-500">Variant: {item.variant}</p>
                    )}
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    <Price amount={item.price} className="text-primary-600" />
                  </div>
                  <div className="text-right">
                    <Price amount={item.price * item.quantity} className="font-semibold" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="card p-6 mt-6">
            <h2 className="text-lg font-semibold mb-4">Shipping Address</h2>
            <div className="text-gray-600">
              <p className="font-medium text-gray-900">
                {order.shippingAddress?.firstName} {order.shippingAddress?.lastName}
              </p>
              <p>{order.shippingAddress?.street}</p>
              <p>
                {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zipCode}
              </p>
              <p>{order.shippingAddress?.country}</p>
              {order.shippingAddress?.phone && <p>Phone: {order.shippingAddress?.phone}</p>}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <Price amount={order.totals?.subtotal || 0} />
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                {order.totals?.shipping === 0 ? (
                  <span className="text-green-600">Free</span>
                ) : (
                  <Price amount={order.totals?.shipping || 0} />
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <Price amount={order.totals?.tax || 0} />
              </div>
              {order.totals?.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-<Price amount={order.totals?.discount} /></span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-lg pt-3 border-t">
                <span>Total</span>
                <Price amount={order.totals?.total || 0} />
              </div>
            </div>

            {/* Payment Info */}
            <div className="mt-6 pt-4 border-t">
              <h3 className="font-medium mb-2">Payment</h3>
              <p className="text-sm text-gray-600">
                Method: {order.payment?.method || 'N/A'}
              </p>
              <p className="text-sm text-gray-600">
                Status: <span className="capitalize">{order.payment?.status || 'N/A'}</span>
              </p>
            </div>

            {/* Actions */}
            <div className="mt-6 space-y-3">
              {canPayOnline() && (
                <Button
                  onClick={() => setShowPaymentModal(true)}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  💳 Pay Now - <Price amount={order.totals?.total || 0} />
                </Button>
              )}
              <Link
                to="/orders"
                className="block w-full text-center py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Back to Orders
              </Link>
              {order.status === 'delivered' && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Rate your products:</p>
                  {order.items?.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => openReviewModal(item)}
                      disabled={isProductReviewed(item)}
                      className={`w-full py-2 text-sm rounded-lg flex items-center justify-center gap-2 ${
                        isProductReviewed(item)
                          ? 'bg-green-100 text-green-700 cursor-default'
                          : 'bg-primary-600 text-white hover:bg-primary-700'
                      }`}
                    >
                      {isProductReviewed(item) ? (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Reviewed: {item.name?.substring(0, 25)}{item.name?.length > 25 ? '...' : ''}
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                          Review: {item.name?.substring(0, 25)}{item.name?.length > 25 ? '...' : ''}
                        </>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && reviewItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-lg font-bold mb-1">Write a Review</h2>
            <p className="text-sm text-gray-500 mb-4">{reviewItem.name}</p>

            {/* Star Rating */}
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Your Rating</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewRating(star)}
                    onMouseEnter={() => setReviewHover(star)}
                    onMouseLeave={() => setReviewHover(0)}
                    className="focus:outline-none"
                  >
                    <svg
                      className={`w-8 h-8 transition-colors ${
                        star <= (reviewHover || reviewRating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300 fill-gray-300'
                      }`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                ))}
                <span className="ml-2 text-sm text-gray-500 self-center">
                  {reviewRating > 0 && ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][reviewRating]}
                </span>
              </div>
            </div>

            {/* Review Title */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Title (optional)</label>
              <input
                type="text"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                placeholder="Summarize your experience"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Review Comment */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Review</label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share your experience with this product..."
                rows={4}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowReviewModal(false)}
                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <Button
                onClick={handleSubmitReview}
                loading={submittingReview}
                className="flex-1"
              >
                Submit Review
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Complete Payment</h2>

            <div className="mb-6">
              <p className="text-gray-600 mb-2">Order Total:</p>
              <p className="text-2xl font-bold text-primary-600">
                <Price amount={order.totals?.total || 0} />
              </p>
            </div>

            {!selectedPaymentMethod ? (
              // Payment Method Selection
              <div className="space-y-3 mb-6">
                <p className="text-sm font-medium text-gray-700">Select Payment Method:</p>

                <button
                  onClick={() => setSelectedPaymentMethod('card')}
                  className="w-full p-4 border rounded-lg hover:border-primary-500 hover:bg-primary-50 flex items-center gap-3"
                >
                  <span className="text-2xl">💳</span>
                  <div className="text-left">
                    <p className="font-medium">Credit/Debit Card</p>
                    <p className="text-sm text-gray-500">Visa, Mastercard, etc.</p>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedPaymentMethod('jazzcash')}
                  className="w-full p-4 border rounded-lg hover:border-primary-500 hover:bg-primary-50 flex items-center gap-3"
                >
                  <span className="text-2xl">📱</span>
                  <div className="text-left">
                    <p className="font-medium">JazzCash</p>
                    <p className="text-sm text-gray-500">Pay with mobile wallet</p>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedPaymentMethod('easypaisa')}
                  className="w-full p-4 border rounded-lg hover:border-primary-500 hover:bg-primary-50 flex items-center gap-3"
                >
                  <span className="text-2xl">📱</span>
                  <div className="text-left">
                    <p className="font-medium">EasyPaisa</p>
                    <p className="text-sm text-gray-500">Pay with mobile wallet</p>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedPaymentMethod('bank')}
                  className="w-full p-4 border rounded-lg hover:border-primary-500 hover:bg-primary-50 flex items-center gap-3"
                >
                  <span className="text-2xl">🏦</span>
                  <div className="text-left">
                    <p className="font-medium">Bank Transfer</p>
                    <p className="text-sm text-gray-500">Direct bank payment</p>
                  </div>
                </button>
              </div>
            ) : (
              // Payment Forms
              <div className="space-y-4 mb-6">
                <button
                  onClick={() => setSelectedPaymentMethod(null)}
                  className="text-primary-600 text-sm flex items-center gap-1 hover:underline"
                >
                  ← Back to payment methods
                </button>

                {/* Card Payment Form */}
                {selectedPaymentMethod === 'card' && (
                  <div className="space-y-4">
                    <h3 className="font-medium flex items-center gap-2">💳 Card Details</h3>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Card Number</label>
                      <input
                        type="text"
                        name="cardNumber"
                        value={paymentForm.cardNumber}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, cardNumber: formatCardNumber(e.target.value) }))}
                        placeholder="1234 5678 9012 3456"
                        maxLength="19"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Expiry Date</label>
                        <input
                          type="text"
                          name="cardExpiry"
                          value={paymentForm.cardExpiry}
                          onChange={handlePaymentFormChange}
                          placeholder="MM/YY"
                          maxLength="5"
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">CVV</label>
                        <input
                          type="password"
                          name="cardCvv"
                          value={paymentForm.cardCvv}
                          onChange={handlePaymentFormChange}
                          placeholder="123"
                          maxLength="4"
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Cardholder Name</label>
                      <input
                        type="text"
                        name="cardName"
                        value={paymentForm.cardName}
                        onChange={handlePaymentFormChange}
                        placeholder="JOHN SMITH"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>
                )}

                {/* JazzCash / EasyPaisa Form */}
                {['jazzcash', 'easypaisa'].includes(selectedPaymentMethod) && (
                  <div className="space-y-4">
                    <h3 className="font-medium flex items-center gap-2">
                      📱 {selectedPaymentMethod === 'jazzcash' ? 'JazzCash' : 'EasyPaisa'} Payment
                    </h3>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Mobile Number</label>
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={paymentForm.phoneNumber}
                        onChange={handlePaymentFormChange}
                        placeholder="03001234567"
                        maxLength="11"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter your {selectedPaymentMethod === 'jazzcash' ? 'JazzCash' : 'EasyPaisa'} registered number
                      </p>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg text-sm text-yellow-800">
                      <p>📌 You will receive a payment request on your mobile. Please approve it to complete the payment.</p>
                    </div>
                  </div>
                )}

                {/* Bank Transfer Details */}
                {selectedPaymentMethod === 'bank' && (
                  <div className="space-y-4">
                    <h3 className="font-medium flex items-center gap-2">🏦 Bank Transfer Details</h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                      <p><strong>Bank:</strong> HBL (Habib Bank Limited)</p>
                      <p><strong>Account Title:</strong> MarketPlace Pvt Ltd</p>
                      <p><strong>Account Number:</strong> 1234-5678-9012-3456</p>
                      <p><strong>IBAN:</strong> PK36HABB0001234567890123</p>
                      <p><strong>Branch Code:</strong> 0123</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
                      <p>📌 After transferring, click "I've Made the Transfer" below. We'll verify and confirm your payment within 24 hours.</p>
                    </div>
                  </div>
                )}

                {/* Pay Button */}
                <Button
                  onClick={handlePayNow}
                  loading={processingPayment}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {selectedPaymentMethod === 'bank' ? "I've Made the Transfer" : `Pay Rs. ${(order.totals?.total || 0).toLocaleString()}`}
                </Button>
              </div>
            )}

            {processingPayment && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg flex items-center gap-3">
                <div className="animate-spin h-5 w-5 border-2 border-primary-600 border-t-transparent rounded-full"></div>
                <p className="text-primary-600">Processing payment...</p>
              </div>
            )}

            <button
              onClick={() => { setShowPaymentModal(false); setSelectedPaymentMethod(null); }}
              disabled={processingPayment}
              className="w-full py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;
