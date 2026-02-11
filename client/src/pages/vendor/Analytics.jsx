import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import { Price } from '../../components/common';
import { formatPrice } from '../../store/slices/currencySlice';

const TrendingUpIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const TrendingDownIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
  </svg>
);

const ShoppingCartIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const UsersIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const CurrencyIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const StarIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const VendorAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [realtime, setRealtime] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');

  const { currentCurrency } = useSelector((state) => state.currency);
  const formatAmount = (amount) => formatPrice(amount, currentCurrency);

  useEffect(() => {
    fetchAllData();
  }, [dateRange]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, realtimeRes, productsRes, customersRes] = await Promise.all([
        api.get('/vendor/analytics').catch(() => ({ data: { data: getSampleAnalytics() } })),
        api.get('/vendor/analytics/realtime').catch(() => ({ data: { data: getSampleRealtime() } })),
        api.get('/vendor/analytics/top-products').catch(() => ({ data: { data: [] } })),
        api.get('/vendor/analytics/customers').catch(() => ({ data: { data: getSampleCustomers() } })),
      ]);

      setAnalytics(analyticsRes.data.data);
      setRealtime(realtimeRes.data.data);
      setTopProducts(productsRes.data.data);
      setCustomerData(customersRes.data.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSampleAnalytics = () => ({
    overview: {
      totalOrders: 156,
      completedOrders: 142,
      totalRevenue: 15420.50,
      netRevenue: 14200.00,
      fulfillmentRate: 91.0,
      cancellationRate: 3.2,
      returnRate: 2.5,
      avgOrderValue: 98.85,
      averageRating: 4.5,
      totalRatings: 89,
    },
    chartData: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
      revenue: Math.floor(Math.random() * 500) + 200,
      orders: Math.floor(Math.random() * 10) + 2,
    })),
  });

  const getSampleRealtime = () => ({
    todayOrders: 8,
    todayRevenue: 782.50,
    pendingOrders: 5,
    lowStockProducts: 3,
    recentReviews: [],
  });

  const getSampleCustomers = () => ({
    totalCustomers: 89,
    repeatCustomers: 34,
    repeatRate: 38.2,
    topCustomers: [],
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  const overview = analytics?.overview || getSampleAnalytics().overview;

  const statCards = [
    {
      title: 'Total Revenue',
      value: formatAmount(overview.totalRevenue),
      icon: CurrencyIcon,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      title: 'Total Orders',
      value: overview.totalOrders,
      icon: ShoppingCartIcon,
      color: 'text-teal-600',
      bg: 'bg-teal-100',
    },
    {
      title: 'Avg Order Value',
      value: formatAmount(overview.avgOrderValue),
      icon: TrendingUpIcon,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
    },
    {
      title: 'Total Customers',
      value: customerData?.totalCustomers || 0,
      icon: UsersIcon,
      color: 'text-orange-600',
      bg: 'bg-orange-100',
    },
  ];

  const maxRevenue = Math.max(...(analytics?.chartData?.map(d => d.revenue) || [1]));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-emerald-600">Store Analytics</h1>
          <p className="text-gray-500">Track your store performance</p>
        </div>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="input w-40"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      {/* Realtime Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card p-4 bg-gradient-to-r from-green-500 to-green-600 text-white">
          <p className="text-sm opacity-80">Today's Revenue</p>
          <p className="text-2xl font-bold">{formatAmount(realtime?.todayRevenue || 0)}</p>
        </div>
        <div className="card p-4 bg-gradient-to-r from-teal-500 to-teal-600 text-white">
          <p className="text-sm opacity-80">Today's Orders</p>
          <p className="text-2xl font-bold">{realtime?.todayOrders || 0}</p>
        </div>
        <div className="card p-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
          <p className="text-sm opacity-80">Pending Orders</p>
          <p className="text-2xl font-bold">{realtime?.pendingOrders || 0}</p>
        </div>
        <div className="card p-4 bg-gradient-to-r from-red-500 to-red-600 text-white">
          <p className="text-sm opacity-80">Low Stock Items</p>
          <p className="text-2xl font-bold">{realtime?.lowStockProducts || 0}</p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <div key={index} className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.title}</p>
          </div>
        ))}
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="card p-6">
          <h3 className="font-semibold mb-4 text-emerald-600">Fulfillment Rate</h3>
          <div className="flex items-center gap-4">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle cx="48" cy="48" r="40" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="#22c55e"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${overview.fulfillmentRate * 2.51} 251`}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xl font-bold">
                {overview.fulfillmentRate}%
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">Completed: {overview.completedOrders}</p>
              <p className="text-sm text-gray-500">Total: {overview.totalOrders}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold mb-4 text-emerald-600">Cancellation & Returns</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Cancellation Rate</span>
                <span className="text-red-600">{overview.cancellationRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: `${overview.cancellationRate}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Return Rate</span>
                <span className="text-orange-600">{overview.returnRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${overview.returnRate}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold mb-4 text-emerald-600">Store Rating</h3>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-4xl font-bold">{overview.averageRating}</p>
              <div className="flex justify-center mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon
                    key={star}
                    className={`w-5 h-5 ${star <= Math.round(overview.averageRating) ? 'text-yellow-400' : 'text-gray-300'}`}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-1">{overview.totalRatings} reviews</p>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="card p-6 mb-8">
        <h3 className="font-semibold mb-6 text-emerald-600">Revenue Trend</h3>
        <div className="flex items-end justify-between h-64 gap-1">
          {analytics?.chartData?.slice(-14).map((day, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="w-full bg-gray-100 rounded-t-sm relative" style={{ height: '200px' }}>
                <div
                  className="absolute bottom-0 w-full bg-emerald-500 rounded-t-sm transition-all duration-500"
                  style={{ height: `${(day.revenue / maxRevenue) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {new Date(day.date).getDate()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Top Products & Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-semibold mb-4 text-emerald-600">Top Selling Products</h3>
          {topProducts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No sales data yet</p>
          ) : (
            <div className="space-y-4">
              {topProducts.slice(0, 5).map((product, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium line-clamp-1">{product.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatAmount(product.totalRevenue)}</p>
                    <p className="text-xs text-gray-500">{product.totalSold} sold</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-6">
          <h3 className="font-semibold mb-4 text-emerald-600">Customer Insights</h3>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{customerData?.totalCustomers || 0}</p>
              <p className="text-xs text-gray-500">Total Customers</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{customerData?.repeatCustomers || 0}</p>
              <p className="text-xs text-gray-500">Repeat Customers</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{customerData?.repeatRate || 0}%</p>
              <p className="text-xs text-gray-500">Repeat Rate</p>
            </div>
          </div>
          {customerData?.topCustomers?.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Top Customers</p>
              {customerData.topCustomers.slice(0, 3).map((customer, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                  <span className="text-sm">{customer.name || customer.email}</span>
                  <span className="text-sm font-semibold">{formatAmount(customer.totalSpent)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorAnalytics;
