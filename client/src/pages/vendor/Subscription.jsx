import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Button } from '../../components/common';
import { formatPrice } from '../../store/slices/currencySlice';

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

const StarIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const VendorSubscription = () => {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [limits, setLimits] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [subscribing, setSubscribing] = useState(false);

  const { currentCurrency } = useSelector((state) => state.currency);
  const formatAmount = (amount) => formatPrice(amount, currentCurrency);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansRes, subRes, limitsRes] = await Promise.all([
        api.get('/vendor/subscription/plans'),
        api.get('/vendor/subscription'),
        api.get('/vendor/subscription/limits'),
      ]);
      setPlans(plansRes.data.data);
      setCurrentSubscription(subRes.data.data);
      setLimits(limitsRes.data.data);
    } catch (error) {
      console.error('Failed to fetch subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId) => {
    setSubscribing(true);
    try {
      await api.post('/vendor/subscription/subscribe', { planId, billingCycle });
      toast.success('Subscription successful!');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to subscribe');
    } finally {
      setSubscribing(false);
    }
  };

  const handleChangePlan = async (planId) => {
    setSubscribing(true);
    try {
      await api.post('/vendor/subscription/change', { planId, billingCycle });
      toast.success('Plan changed successfully!');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change plan');
    } finally {
      setSubscribing(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription? You will lose access to premium features.')) {
      return;
    }

    try {
      await api.post('/vendor/subscription/cancel', { reason: 'User requested' });
      toast.success('Subscription cancelled');
      fetchData();
    } catch (error) {
      toast.error('Failed to cancel subscription');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  const currentPlan = currentSubscription?.plan || currentSubscription?.subscription?.plan;
  const currentPlanSlug = currentPlan?.slug;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-emerald-600">Subscription Plans</h1>
        <p className="text-gray-500">Choose the right plan for your business</p>
      </div>

      {/* Current Usage */}
      {limits && (
        <div className="card p-6 mb-8">
          <h2 className="font-semibold mb-4">Current Usage</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Products</p>
              <p className="text-lg font-bold">
                {limits.products.current} / {limits.products.isUnlimited ? '∞' : limits.products.max}
              </p>
              {!limits.products.isUnlimited && (
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    className="bg-primary-500 h-2 rounded-full"
                    style={{ width: `${Math.min((limits.products.current / limits.products.max) * 100, 100)}%` }}
                  />
                </div>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Team Members</p>
              <p className="text-lg font-bold">
                {limits.subAccounts.current} / {limits.subAccounts.isUnlimited ? '∞' : limits.subAccounts.max}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Commission Rate</p>
              <p className="text-lg font-bold">{limits.commissionRate}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Current Plan</p>
              <p className="text-lg font-bold">{currentPlan?.name || 'Basic'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Billing Cycle Toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 p-1 rounded-lg inline-flex">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2 rounded-md transition-colors ${
              billingCycle === 'monthly' ? 'bg-white shadow-sm' : 'text-gray-600'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-6 py-2 rounded-md transition-colors ${
              billingCycle === 'yearly' ? 'bg-white shadow-sm' : 'text-gray-600'
            }`}
          >
            Yearly <span className="text-green-600 text-sm ml-1">Save 20%</span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {plans.map((plan) => {
          const isCurrentPlan = currentPlanSlug === plan.slug;
          const price = plan.price[billingCycle];

          return (
            <div
              key={plan._id}
              className={`card p-6 relative ${plan.isPopular ? 'border-2 border-primary-500' : ''} ${
                isCurrentPlan ? 'bg-primary-50' : ''
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary-500 text-white text-sm px-4 py-1 rounded-full flex items-center gap-1">
                    <StarIcon className="w-4 h-4" /> Most Popular
                  </span>
                </div>
              )}

              {isCurrentPlan && (
                <div className="absolute top-4 right-4">
                  <span className="badge badge-success">Current Plan</span>
                </div>
              )}

              <h3 className="text-xl font-bold mt-2">{plan.name}</h3>
              <p className="text-gray-500 text-sm mb-4">{plan.description}</p>

              <div className="mb-6">
                <span className="text-4xl font-bold">{formatAmount(price)}</span>
                <span className="text-gray-500">/{billingCycle === 'yearly' ? 'year' : 'month'}</span>
              </div>

              {/* Limits */}
              <div className="space-y-2 mb-6">
                <p className="text-sm flex items-center gap-2">
                  <CheckIcon className="w-5 h-5 text-green-500" />
                  {plan.limits.maxProducts === -1 ? 'Unlimited' : plan.limits.maxProducts} products
                </p>
                <p className="text-sm flex items-center gap-2">
                  <CheckIcon className="w-5 h-5 text-green-500" />
                  {plan.limits.maxSubAccounts === -1 ? 'Unlimited' : plan.limits.maxSubAccounts} team members
                </p>
                <p className="text-sm flex items-center gap-2">
                  <CheckIcon className="w-5 h-5 text-green-500" />
                  {plan.commissionRate}% commission rate
                </p>
              </div>

              {/* Features */}
              <div className="space-y-2 mb-6">
                {Object.entries(plan.features).map(([key, value]) => (
                  <p key={key} className="text-sm flex items-center gap-2">
                    {value ? (
                      <CheckIcon className="w-5 h-5 text-green-500" />
                    ) : (
                      <XIcon className="w-5 h-5 text-gray-300" />
                    )}
                    <span className={value ? '' : 'text-gray-400'}>
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </span>
                  </p>
                ))}
              </div>

              {isCurrentPlan ? (
                <Button variant="outline" className="w-full" disabled>
                  Current Plan
                </Button>
              ) : currentPlanSlug ? (
                <Button
                  onClick={() => handleChangePlan(plan._id)}
                  className="w-full"
                  loading={subscribing}
                  variant={plan.isPopular ? 'primary' : 'outline'}
                >
                  {plans.findIndex(p => p.slug === currentPlanSlug) < plans.findIndex(p => p.slug === plan.slug)
                    ? 'Upgrade'
                    : 'Downgrade'}
                </Button>
              ) : (
                <Button
                  onClick={() => handleSubscribe(plan._id)}
                  className="w-full"
                  loading={subscribing}
                  variant={plan.isPopular ? 'primary' : 'outline'}
                >
                  {price === 0 ? 'Get Started' : 'Subscribe'}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Current Subscription Details */}
      {currentSubscription?.subscription && (
        <div className="card p-6">
          <h2 className="font-semibold mb-4">Subscription Details</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <span className={`badge ${
                currentSubscription.subscription.status === 'active' ? 'badge-success' :
                currentSubscription.subscription.status === 'past_due' ? 'badge-warning' : 'badge-danger'
              }`}>
                {currentSubscription.subscription.status}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Billing Cycle</p>
              <p className="font-medium capitalize">{currentSubscription.subscription.billingCycle}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Next Payment</p>
              <p className="font-medium">
                {currentSubscription.subscription.nextPaymentDate
                  ? new Date(currentSubscription.subscription.nextPaymentDate).toLocaleDateString()
                  : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Auto Renew</p>
              <p className="font-medium">{currentSubscription.subscription.autoRenew ? 'Yes' : 'No'}</p>
            </div>
          </div>

          {currentSubscription.subscription.status === 'active' && currentPlan?.price?.monthly > 0 && (
            <Button variant="outline" onClick={handleCancelSubscription} className="text-red-600">
              Cancel Subscription
            </Button>
          )}
        </div>
      )}

      {/* FAQ */}
      <div className="mt-12">
        <h2 className="text-xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="font-semibold mb-2">Can I change plans anytime?</h3>
            <p className="text-gray-600 text-sm">
              Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
            </p>
          </div>
          <div className="card p-6">
            <h3 className="font-semibold mb-2">What happens if I exceed my limits?</h3>
            <p className="text-gray-600 text-sm">
              You'll need to upgrade to a higher plan to add more products or team members beyond your limit.
            </p>
          </div>
          <div className="card p-6">
            <h3 className="font-semibold mb-2">Is there a free trial?</h3>
            <p className="text-gray-600 text-sm">
              The Basic plan is free forever. You can upgrade to paid plans when you need more features.
            </p>
          </div>
          <div className="card p-6">
            <h3 className="font-semibold mb-2">How is commission calculated?</h3>
            <p className="text-gray-600 text-sm">
              Commission is deducted from each sale based on your plan's rate. Lower rates mean more profit for you.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorSubscription;
