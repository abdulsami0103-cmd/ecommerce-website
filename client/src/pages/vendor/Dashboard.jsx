import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import vendorService from '../../services/vendorService';
import { Loading } from '../../components/common';
import SummaryCards from '../../components/vendor/dashboard/SummaryCards';
import SalesChart from '../../components/vendor/dashboard/SalesChart';
import TopProductsTable from '../../components/vendor/dashboard/TopProductsTable';
import DemographicsCharts from '../../components/vendor/dashboard/DemographicsCharts';

// Icons
const ClipboardIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

const ShoppingBagIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
  </svg>
);

const ClockIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const WalletIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const ChartIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const CouponIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
  </svg>
);

const PromotionIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
  </svg>
);

const UsersIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const CogIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const RefreshIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const API_BASE = '/api/vendor/dashboard';

const Dashboard = () => {
  const { t } = useTranslation();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Dashboard data states
  const [summaryData, setSummaryData] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const [salesData, setSalesData] = useState(null);
  const [salesTotals, setSalesTotals] = useState(null);
  const [salesLoading, setSalesLoading] = useState(true);
  const [salesDateRange, setSalesDateRange] = useState('30d');

  const [topProducts, setTopProducts] = useState([]);
  const [topProductsLoading, setTopProductsLoading] = useState(true);
  const [topProductsSortBy, setTopProductsSortBy] = useState('revenue');

  const [demographicsData, setDemographicsData] = useState(null);
  const [demographicsLoading, setDemographicsLoading] = useState(true);

  // Fetch vendor info
  useEffect(() => {
    const fetchVendor = async () => {
      try {
        const response = await vendorService.getDashboard();
        setVendor(response.vendor);
      } catch (error) {
        console.error('Failed to fetch vendor:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchVendor();
  }, []);

  // Fetch summary data
  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setSummaryData(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  // Fetch sales data
  const fetchSales = useCallback(async (range = salesDateRange) => {
    setSalesLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/sales?range=${range}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setSalesData(data.data.chartData);
        setSalesTotals(data.data.totals);
      }
    } catch (error) {
      console.error('Failed to fetch sales:', error);
    } finally {
      setSalesLoading(false);
    }
  }, [salesDateRange]);

  // Fetch top products
  const fetchTopProducts = useCallback(async (sortBy = topProductsSortBy) => {
    setTopProductsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/top-products?sortBy=${sortBy}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setTopProducts(data.data.products);
      }
    } catch (error) {
      console.error('Failed to fetch top products:', error);
    } finally {
      setTopProductsLoading(false);
    }
  }, [topProductsSortBy]);

  // Fetch demographics
  const fetchDemographics = useCallback(async () => {
    setDemographicsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/demographics?range=30d`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setDemographicsData(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch demographics:', error);
    } finally {
      setDemographicsLoading(false);
    }
  }, []);

  // Initial data fetch - only run once on mount
  useEffect(() => {
    fetchSummary();
    fetchSales();
    fetchTopProducts();
    fetchDemographics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle date range change
  const handleDateRangeChange = (range) => {
    setSalesDateRange(range);
    fetchSales(range);
  };

  // Handle top products sort change
  const handleTopProductsSortChange = (sortBy) => {
    setTopProductsSortBy(sortBy);
    fetchTopProducts(sortBy);
  };

  // Handle export
  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/export?range=${salesDateRange}&format=csv`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sales-report-${salesDateRange}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to export:', error);
    }
  };

  // Refresh all data
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchSummary(),
      fetchSales(),
      fetchTopProducts(),
      fetchDemographics(),
    ]);
    setRefreshing(false);
  };

  if (loading) return <Loading />;

  if (!vendor) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-600">
            <ShoppingBagIcon className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Vendor Profile Not Found</h2>
          <p className="text-gray-500 mb-6">Start your selling journey today</p>
          <Link
            to="/become-vendor"
            className="inline-block px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors font-medium"
          >
            Become a Vendor
          </Link>
        </div>
      </div>
    );
  }

  const quickLinks = [
    { to: '/vendor/suborders', icon: ClipboardIcon, title: 'Sub-Orders', desc: 'Manage orders', bgColor: 'bg-blue-500' },
    { to: '/vendor/shipments', icon: ShoppingBagIcon, title: 'Shipments', desc: 'Track deliveries', bgColor: 'bg-indigo-500' },
    { to: '/vendor/rma', icon: ClockIcon, title: 'RMA Requests', desc: 'Returns & refunds', bgColor: 'bg-orange-500' },
    { to: '/vendor/wallet', icon: WalletIcon, title: 'My Wallet', desc: 'Balance & transactions', bgColor: 'bg-emerald-500' },
    { to: '/vendor/invoices', icon: ChartIcon, title: 'Invoices', desc: 'Statements & receipts', bgColor: 'bg-purple-500' },
    { to: '/vendor/analytics', icon: ChartIcon, title: 'Analytics', desc: 'Store performance', bgColor: 'bg-cyan-500' },
    { to: '/vendor/team', icon: UsersIcon, title: 'Team', desc: 'Manage staff', bgColor: 'bg-teal-500' },
    { to: '/vendor/coupons', icon: CouponIcon, title: 'Coupons', desc: 'Manage discounts', bgColor: 'bg-pink-500' },
    { to: '/vendor/promotions', icon: PromotionIcon, title: 'Promotions', desc: 'Featured placements', bgColor: 'bg-amber-500' },
    { to: '/vendor/settings', icon: CogIcon, title: 'Settings', desc: 'Store settings', bgColor: 'bg-gray-500' },
  ];

  return (
    <div className="space-y-3 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-emerald-600">{t('vendor.dashboard')}</h1>
          <p className="text-gray-500 text-[10px] sm:text-sm mt-0.5 sm:mt-1">Welcome back, {vendor.storeName}!</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-4 sm:py-2 bg-white border border-gray-200 text-gray-700 rounded-lg sm:rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 text-xs sm:text-sm font-medium"
        >
          <RefreshIcon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Summary Cards */}
      <SummaryCards data={summaryData} loading={summaryLoading} />

      {/* Sales Chart & Top Products */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 sm:gap-6">
        <div className="xl:col-span-2">
          <SalesChart
            data={salesData}
            totals={salesTotals}
            loading={salesLoading}
            dateRange={salesDateRange}
            onDateRangeChange={handleDateRangeChange}
            onExport={handleExport}
          />
        </div>
        <div className="xl:col-span-1">
          <TopProductsTable
            products={topProducts}
            loading={topProductsLoading}
            sortBy={topProductsSortBy}
            onSortChange={handleTopProductsSortChange}
          />
        </div>
      </div>

      {/* Demographics */}
      <DemographicsCharts data={demographicsData} loading={demographicsLoading} />

      {/* Quick Links */}
      <div className="bg-white rounded-2xl shadow-sm p-3 sm:p-6">
        <h2 className="text-sm sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-4">Quick Links</h2>
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
          {quickLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="p-2 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl hover:bg-gray-100 transition-colors group"
            >
              <div className={`w-7 h-7 sm:w-10 sm:h-10 ${link.bgColor} rounded-lg sm:rounded-xl flex items-center justify-center mb-1.5 sm:mb-3 group-hover:scale-110 transition-transform`}>
                <link.icon className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
              </div>
              <h3 className="font-semibold text-[10px] sm:text-sm text-gray-900">{link.title}</h3>
              <p className="text-[8px] sm:text-xs text-gray-500 mt-0.5 hidden sm:block">{link.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
