import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import { formatPrice } from '../../store/slices/currencySlice';

// Icons
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

const UsersIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const ShoppingCartIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const CurrencyIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ChartIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const CalendarIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const GlobeIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const StoreIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const PackageIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const ActivityIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const getAvatarColor = (index) => {
  const colors = [
    'bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-pink-500',
    'bg-orange-500', 'bg-teal-500', 'bg-indigo-500', 'bg-rose-500'
  ];
  return colors[index % colors.length];
};

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  // Currency state
  const { currentCurrency } = useSelector((state) => state.currency);

  // Helper to format prices in selected currency
  const formatAmount = (amount) => formatPrice(amount, currentCurrency);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/analytics');
      const apiData = response.data?.data;
      if (apiData && apiData.overview) {
        setAnalytics(apiData);
      } else {
        setAnalytics(getSampleAnalytics());
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setAnalytics(getSampleAnalytics());
    } finally {
      setLoading(false);
    }
  };

  const getSampleAnalytics = () => ({
    overview: {
      totalRevenue: 15420.50,
      revenueChange: 12.5,
      totalOrders: 156,
      ordersChange: 8.3,
      totalCustomers: 89,
      customersChange: 15.2,
      avgOrderValue: 98.85,
      avgOrderChange: -2.1,
    },
    revenueByMonth: [
      { month: 'Aug', revenue: 8500 },
      { month: 'Sep', revenue: 9200 },
      { month: 'Oct', revenue: 11500 },
      { month: 'Nov', revenue: 10800 },
      { month: 'Dec', revenue: 14200 },
      { month: 'Jan', revenue: 15420 },
    ],
    ordersByStatus: [
      { status: 'Completed', count: 98, color: 'bg-emerald-500' },
      { status: 'Processing', count: 32, color: 'bg-blue-500' },
      { status: 'Pending', count: 18, color: 'bg-yellow-500' },
      { status: 'Cancelled', count: 8, color: 'bg-red-500' },
    ],
    topProducts: [
      { name: 'Wireless Bluetooth Headphones', sales: 45, revenue: 3599.55 },
      { name: 'Smart Watch Pro', sales: 28, revenue: 5599.72 },
      { name: 'Classic Denim Jacket', sales: 34, revenue: 3059.66 },
      { name: 'LED Desk Lamp', sales: 52, revenue: 1819.48 },
      { name: 'Running Sneakers', sales: 31, revenue: 2479.69 },
    ],
    topVendors: [
      { name: 'TechStore Pro', orders: 67, revenue: 6250.00 },
      { name: 'Fashion Hub', orders: 52, revenue: 4820.50 },
      { name: 'Home Plus', orders: 37, revenue: 4350.00 },
    ],
    trafficSources: [
      { source: 'Direct', visits: 2450, percentage: 35 },
      { source: 'Google Search', visits: 1890, percentage: 27 },
      { source: 'Social Media', visits: 1260, percentage: 18 },
      { source: 'Referral', visits: 980, percentage: 14 },
      { source: 'Email', visits: 420, percentage: 6 },
    ],
    recentActivity: [
      { type: 'order', message: 'New order #ORD-1015 placed', time: '2 min ago' },
      { type: 'user', message: 'New customer registered', time: '5 min ago' },
      { type: 'review', message: 'New 5-star review on Smart Watch Pro', time: '12 min ago' },
      { type: 'order', message: 'Order #ORD-1012 completed', time: '25 min ago' },
      { type: 'vendor', message: 'TechStore Pro added new product', time: '1 hour ago' },
    ],
  });

  const data = (analytics && analytics.overview) ? analytics : getSampleAnalytics();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Revenue',
      value: formatAmount(data.overview.totalRevenue),
      change: data.overview.revenueChange,
      icon: CurrencyIcon,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
    },
    {
      title: 'Total Orders',
      value: data.overview.totalOrders,
      change: data.overview.ordersChange,
      icon: ShoppingCartIcon,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      title: 'Total Customers',
      value: data.overview.totalCustomers,
      change: data.overview.customersChange,
      icon: UsersIcon,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
    },
    {
      title: 'Avg Order Value',
      value: formatAmount(data.overview.avgOrderValue),
      change: data.overview.avgOrderChange,
      icon: ChartIcon,
      color: 'text-orange-600',
      bg: 'bg-orange-100',
    },
  ];

  const maxRevenue = Math.max(...data.revenueByMonth.map(m => m.revenue));

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-3 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-emerald-600">Analytics Dashboard</h1>
            <p className="text-gray-500 text-sm mt-0.5">Platform performance overview</p>
          </div>
          <div className="relative">
            <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="pl-9 sm:pl-10 pr-4 py-1.5 sm:py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white appearance-none cursor-pointer"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-8">
          {statCards.map((stat, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-sm p-3 sm:p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <div className={`w-9 h-9 sm:w-12 sm:h-12 ${stat.bg} rounded-xl flex items-center justify-center shrink-0`}>
                  <stat.icon className={`w-4 h-4 sm:w-6 sm:h-6 ${stat.color}`} />
                </div>
                <div className={`flex items-center gap-0.5 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg text-xs sm:text-sm font-medium ${
                  stat.change >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                }`}>
                  {stat.change >= 0 ? (
                    <TrendingUpIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                  ) : (
                    <TrendingDownIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                  )}
                  {Math.abs(stat.change)}%
                </div>
              </div>
              <p className="text-base sm:text-2xl font-bold text-gray-800">{stat.value}</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{stat.title}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6 mb-4 sm:mb-8">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-3 sm:p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-3 sm:mb-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-800">Revenue Overview</h2>
              <span className="text-xs sm:text-sm text-gray-500">Last 6 months</span>
            </div>
            <div className="flex items-end justify-between gap-1.5 sm:gap-3" style={{ height: '160px' }}>
              {data.revenueByMonth.map((month, index) => (
                <div key={index} className="flex-1 flex flex-col items-center min-w-0">
                  <div className="w-full bg-gray-100 rounded-lg sm:rounded-xl relative" style={{ height: '120px' }}>
                    <div
                      className="absolute bottom-0 w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-lg sm:rounded-xl transition-all duration-500"
                      style={{ height: `${(month.revenue / maxRevenue) * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-1.5 sm:mt-3 font-medium">{month.month}</p>
                  <p className="text-[10px] sm:text-xs text-emerald-600 font-semibold truncate w-full text-center">{formatAmount(month.revenue)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Orders by Status */}
          <div className="bg-white rounded-2xl shadow-sm p-3 sm:p-6 border border-gray-100">
            <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-6">Orders by Status</h2>
            <div className="space-y-2.5 sm:space-y-4">
              {data.ordersByStatus.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between mb-1 sm:mb-2">
                    <span className="text-xs sm:text-sm font-medium text-gray-600">{item.status}</span>
                    <span className="text-xs sm:text-sm font-bold text-gray-800">{item.count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 sm:h-2.5">
                    <div
                      className={`h-2 sm:h-2.5 rounded-full ${item.color}`}
                      style={{ width: `${(item.count / data.overview.totalOrders) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm text-gray-500">Total Orders</span>
                <span className="text-base sm:text-lg font-bold text-gray-800">{data.overview.totalOrders}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6 mb-4 sm:mb-8">
          {/* Top Products */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-3 py-2.5 sm:p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-semibold text-gray-800">Top Selling Products</h2>
                <PackageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {data.topProducts.map((product, index) => (
                <div key={index} className="px-3 py-2 sm:p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs sm:text-sm shrink-0 ${
                        index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-400' : 'bg-gray-300'
                      }`}>
                        {index + 1}
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-gray-800 truncate">{product.name}</span>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="text-xs sm:text-sm font-bold text-emerald-600">{formatAmount(product.revenue)}</p>
                      <p className="text-[10px] sm:text-xs text-gray-500">{product.sales} sales</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Vendors */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-3 py-2.5 sm:p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-semibold text-gray-800">Top Vendors</h2>
                <StoreIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {data.topVendors.map((vendor, index) => (
                <div key={index} className="px-3 py-2 sm:p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 ${getAvatarColor(index)} rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                        {vendor.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{vendor.name}</p>
                        <p className="text-xs text-gray-500">{vendor.orders} orders</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-emerald-600 shrink-0">{formatAmount(vendor.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
          {/* Traffic Sources */}
          <div className="bg-white rounded-2xl shadow-sm p-3 sm:p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-3 sm:mb-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-800">Traffic Sources</h2>
              <GlobeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            </div>
            <div className="space-y-2.5 sm:space-y-4">
              {data.trafficSources.map((source, index) => (
                <div key={index} className="flex items-center gap-2 sm:gap-4">
                  <div className="w-20 sm:w-28 shrink-0">
                    <span className="text-xs sm:text-sm font-medium text-gray-600">{source.source}</span>
                  </div>
                  <div className="flex-1 bg-gray-100 rounded-full h-2 sm:h-3">
                    <div
                      className="h-2 sm:h-3 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                      style={{ width: `${source.percentage}%` }}
                    />
                  </div>
                  <div className="w-14 sm:w-20 text-right shrink-0">
                    <span className="text-xs sm:text-sm font-bold text-gray-800">{source.percentage}%</span>
                    <p className="text-[10px] sm:text-xs text-gray-400">{source.visits.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-3 py-2.5 sm:p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-semibold text-gray-800">Recent Activity</h2>
                <ActivityIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {data.recentActivity.map((activity, index) => (
                <div key={index} className="px-3 py-2 sm:p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 mt-1.5 rounded-full shrink-0 ${
                      activity.type === 'order' ? 'bg-emerald-500' :
                      activity.type === 'user' ? 'bg-blue-500' :
                      activity.type === 'review' ? 'bg-yellow-500' : 'bg-purple-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-800 truncate">{activity.message}</p>
                      <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">{activity.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
