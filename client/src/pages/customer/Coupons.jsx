import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Loading } from '../../components/common';

const Coupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const { data } = await api.get('/coupons/available');
      if (data.success) {
        setCoupons(data.data);
      }
    } catch (error) {
      toast.error('Failed to load coupons');
    }
    setLoading(false);
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Code "${code}" copied!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const formatDiscount = (coupon) => {
    if (coupon.type === 'percentage') return `${coupon.value}% OFF`;
    if (coupon.type === 'fixed') return `Rs. ${coupon.value} OFF`;
    if (coupon.type === 'free_shipping') return 'FREE SHIPPING';
    if (coupon.type === 'buy_x_get_y') return 'BUY X GET Y';
    return `${coupon.value} OFF`;
  };

  const getDaysLeft = (expiresAt) => {
    const diff = new Date(expiresAt) - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days <= 0) return 'Expired';
    if (days === 1) return '1 day left';
    return `${days} days left`;
  };

  if (loading) return <Loading />;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <svg className="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <h1 className="text-2xl font-bold">Available Coupons</h1>
        </div>

        {coupons.length === 0 ? (
          <div className="card p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-500 mb-1">No coupons available</h3>
            <p className="text-gray-400">Check back later for new deals and discounts!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {coupons.map((coupon) => (
              <div
                key={coupon._id}
                className="card flex flex-col sm:flex-row overflow-hidden"
              >
                {/* Left - Discount Badge */}
                <div className="bg-primary-600 text-white px-6 py-4 sm:py-0 flex items-center justify-center sm:min-w-[140px]">
                  <span className="text-lg font-bold text-center">{formatDiscount(coupon)}</span>
                </div>

                {/* Right - Details */}
                <div className="flex-1 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{coupon.name}</h3>
                    {coupon.description && (
                      <p className="text-sm text-gray-500 mt-1">{coupon.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {coupon.minPurchase > 0 && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          Min. Rs. {coupon.minPurchase}
                        </span>
                      )}
                      {coupon.maxDiscount && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          Max Rs. {coupon.maxDiscount} off
                        </span>
                      )}
                      {coupon.firstOrderOnly && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                          First order only
                        </span>
                      )}
                      {coupon.vendor && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {coupon.vendor.storeName}
                        </span>
                      )}
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                        {getDaysLeft(coupon.expiresAt)}
                      </span>
                    </div>
                  </div>

                  {/* Copy Button */}
                  {!coupon.autoApply && (
                    <button
                      onClick={() => copyCode(coupon.code)}
                      className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-primary-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                    >
                      <span className="font-mono font-bold text-primary-600">{coupon.code}</span>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={copiedCode === coupon.code ? "M5 13l4 4L19 7" : "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"} />
                      </svg>
                    </button>
                  )}
                  {coupon.autoApply && (
                    <span className="text-xs font-medium bg-green-100 text-green-700 px-3 py-1.5 rounded-lg">
                      Auto-applied at checkout
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Coupons;
