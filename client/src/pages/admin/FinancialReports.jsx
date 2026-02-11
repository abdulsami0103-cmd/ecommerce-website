import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Loading } from '../../components/common';
import toast from 'react-hot-toast';

const ChartIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const CashIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const TrendingUpIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const ShoppingCartIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const ReceiptIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
  </svg>
);

const UsersIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const ClockIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const DownloadIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const CalendarIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ChevronDownIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const CubeIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const FinancialReports = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [vendorData, setVendorData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [periodData, setPeriodData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [period, setPeriod] = useState('daily');

  useEffect(() => {
    fetchData();
  }, [dateRange, period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = { ...dateRange, period };

      const [overviewRes, vendorRes, categoryRes, periodRes, productsRes] = await Promise.all([
        api.get('/reports/admin/overview', { params }),
        api.get('/reports/admin/by-vendor', { params }),
        api.get('/reports/admin/by-category', { params }),
        api.get('/reports/admin/by-period', { params }),
        api.get('/reports/admin/top-products', { params: { ...dateRange, limit: 10 } }),
      ]);

      setOverview(overviewRes.data.data);
      setVendorData(vendorRes.data.data || []);
      setCategoryData(categoryRes.data.data || []);
      setPeriodData(periodRes.data.data || []);
      setTopProducts(productsRes.data.data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const handleExport = async (reportType) => {
    try {
      const res = await api.post('/reports/export', {
        reportType,
        format: 'csv',
        ...dateRange,
      });

      const blob = new Blob([res.data.data.csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.data.data.filename;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Report exported successfully');
    } catch (error) {
      toast.error('Error exporting report');
    }
  };

  const tabs = [
    { key: 'overview', label: 'Overview', icon: ChartIcon },
    { key: 'by-vendor', label: 'By Vendor', icon: UsersIcon },
    { key: 'by-category', label: 'By Category', icon: CubeIcon },
    { key: 'top-products', label: 'Top Products', icon: ShoppingCartIcon },
  ];

  // Avatar colors
  const avatarColors = [
    'bg-emerald-500',
    'bg-blue-500',
    'bg-violet-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-cyan-500',
    'bg-pink-500',
  ];

  const getAvatarColor = (index) => avatarColors[index % avatarColors.length];

  if (loading) return <Loading />;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-emerald-600">Financial Reports</h1>
          <p className="text-gray-500 text-sm mt-1">View revenue, commissions, and performance metrics</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-3 py-2">
            <CalendarIcon className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="text-sm text-gray-900 border-none focus:outline-none bg-transparent"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="text-sm text-gray-900 border-none focus:outline-none bg-transparent"
            />
          </div>
          <div className="relative">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Overview Stats Cards */}
      {overview && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-white rounded-2xl shadow-sm p-3 sm:p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                <TrendingUpIcon className="w-4 h-4 sm:w-5 sm:h-5 text-violet-500" />
              </div>
              <p className="text-xs sm:text-sm text-gray-500 leading-tight">Gross Merchandise Value</p>
            </div>
            <p className="text-base sm:text-xl font-bold text-violet-600">{formatCurrency(overview.totals?.totalGMV)}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-3 sm:p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <CashIcon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
              </div>
              <p className="text-xs sm:text-sm text-gray-500 leading-tight">Total Commission</p>
            </div>
            <p className="text-base sm:text-xl font-bold text-emerald-600">{formatCurrency(overview.totals?.totalCommission)}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-3 sm:p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <UsersIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
              </div>
              <p className="text-xs sm:text-sm text-gray-500 leading-tight">Vendor Earnings</p>
            </div>
            <p className="text-base sm:text-xl font-bold text-blue-600">{formatCurrency(overview.totals?.totalVendorEarnings)}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-3 sm:p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <ReceiptIcon className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
              </div>
              <p className="text-xs sm:text-sm text-gray-500 leading-tight">Tax Collected</p>
            </div>
            <p className="text-base sm:text-xl font-bold text-amber-600">{formatCurrency(overview.totals?.totalTaxCollected)}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-3 sm:p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                <ShoppingCartIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              </div>
              <p className="text-xs sm:text-sm text-gray-500 leading-tight">Total Orders</p>
            </div>
            <p className="text-base sm:text-xl font-bold text-gray-900">{overview.totals?.totalOrders || 0}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-3 sm:p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                <CashIcon className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500" />
              </div>
              <p className="text-xs sm:text-sm text-gray-500 leading-tight">Payouts Processed</p>
            </div>
            <p className="text-base sm:text-xl font-bold text-rose-600">{formatCurrency(overview.totals?.totalPayoutsProcessed)}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-3 sm:p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <ClockIcon className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
              </div>
              <p className="text-xs sm:text-sm text-gray-500 leading-tight">Pending Payouts</p>
            </div>
            <p className="text-base sm:text-xl font-bold text-amber-600">{formatCurrency(overview.pendingPayouts)}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-3 sm:p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <TrendingUpIcon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
              </div>
              <p className="text-xs sm:text-sm text-gray-500 leading-tight">Net Revenue</p>
            </div>
            <p className="text-base sm:text-xl font-bold text-emerald-600">{formatCurrency(overview.totals?.netRevenue)}</p>
          </div>
        </div>
      )}

      {/* Vendor Balances */}
      {overview?.vendorBalances && (
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 mb-6">
          <h3 className="font-medium text-gray-900 mb-4">Vendor Balances (Owed)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-50 rounded-xl">
              <p className="text-sm text-gray-600">Available (withdrawable)</p>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(overview.vendorBalances.totalAvailable)}</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-xl">
              <p className="text-sm text-gray-600">Pending (holding period)</p>
              <p className="text-2xl font-bold text-amber-600">{formatCurrency(overview.vendorBalances.totalPending)}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl">
              <p className="text-sm text-gray-600">Reserved (payout in progress)</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(overview.vendorBalances.totalReserved)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`inline-flex items-center gap-1 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-emerald-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <tab.icon className="w-3 h-3 sm:w-4 sm:h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Revenue Over Time */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-medium text-gray-900">Revenue Over Time</h3>
            <button
              onClick={() => handleExport('revenue-summary')}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors text-sm font-medium"
            >
              <DownloadIcon className="w-4 h-4" />
              Export CSV
            </button>
          </div>
          {/* Mobile Card View */}
          <div className="sm:hidden divide-y divide-gray-100">
            {periodData.map((row, i) => (
              <div key={i} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{row.period || row.periodStart?.split('T')[0]}</span>
                  <span className="inline-flex px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                    {row.totalOrders} orders
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-xs text-gray-500">GMV</p>
                    <p className="font-medium text-gray-900 text-xs">{formatCurrency(row.grossMerchandiseValue)}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-2">
                    <p className="text-xs text-gray-500">Commission</p>
                    <p className="font-medium text-emerald-600 text-xs">{formatCurrency(row.totalCommission)}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-2">
                    <p className="text-xs text-gray-500">Earnings</p>
                    <p className="font-medium text-blue-600 text-xs">{formatCurrency(row.totalVendorEarnings)}</p>
                  </div>
                </div>
              </div>
            ))}
            {periodData.length === 0 && (
              <div className="p-8 text-center text-gray-500">No data available for the selected period</div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-emerald-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Period</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-emerald-700 uppercase">GMV</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-emerald-700 uppercase">Orders</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-emerald-700 uppercase">Commission</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-emerald-700 uppercase">Vendor Earnings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {periodData.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{row.period || row.periodStart?.split('T')[0]}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-gray-900">{formatCurrency(row.grossMerchandiseValue)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                        {row.totalOrders}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-emerald-600 font-medium">{formatCurrency(row.totalCommission)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-gray-900">{formatCurrency(row.totalVendorEarnings)}</span>
                    </td>
                  </tr>
                ))}
                {periodData.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                      No data available for the selected period
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* By Vendor */}
      {activeTab === 'by-vendor' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-medium text-gray-900">Revenue by Vendor</h3>
            <button
              onClick={() => handleExport('vendor-earnings')}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors text-sm font-medium"
            >
              <DownloadIcon className="w-4 h-4" />
              Export CSV
            </button>
          </div>
          {/* Mobile Card View */}
          <div className="sm:hidden divide-y divide-gray-100">
            {vendorData.map((row, index) => (
              <div key={row.vendorId} className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-full ${getAvatarColor(index)} flex items-center justify-center text-white font-medium`}>
                    {row.vendorName?.charAt(0).toUpperCase() || 'V'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{row.vendorName}</p>
                    <p className="text-xs text-gray-500 truncate">{row.vendorEmail}</p>
                  </div>
                  <span className="inline-flex px-2 py-1 bg-violet-50 text-violet-700 rounded-full text-xs font-medium">
                    {row.avgCommissionRate}%
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-xs text-gray-500">Sales</p>
                    <p className="font-medium text-gray-900 text-xs">{formatCurrency(row.totalSales)}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-2">
                    <p className="text-xs text-gray-500">Commission</p>
                    <p className="font-medium text-emerald-600 text-xs">{formatCurrency(row.totalCommission)}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-2">
                    <p className="text-xs text-gray-500">Orders</p>
                    <p className="font-medium text-blue-600 text-xs">{row.orderCount}</p>
                  </div>
                </div>
              </div>
            ))}
            {vendorData.length === 0 && (
              <div className="p-8 text-center text-gray-500">No vendor data available</div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-emerald-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Vendor</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-emerald-700 uppercase">Total Sales</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-emerald-700 uppercase">Commission</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-emerald-700 uppercase">Earnings</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-emerald-700 uppercase">Orders</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-emerald-700 uppercase">Avg Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vendorData.map((row, index) => (
                  <tr key={row.vendorId} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full ${getAvatarColor(index)} flex items-center justify-center text-white font-medium text-sm`}>
                          {row.vendorName?.charAt(0).toUpperCase() || 'V'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{row.vendorName}</p>
                          <p className="text-xs text-gray-500">{row.vendorEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-medium text-gray-900">{formatCurrency(row.totalSales)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-emerald-600 font-medium">{formatCurrency(row.totalCommission)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-blue-600 font-medium">{formatCurrency(row.totalEarnings)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                        {row.orderCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex px-2 py-1 bg-violet-50 text-violet-700 rounded-full text-xs font-medium">
                        {row.avgCommissionRate}%
                      </span>
                    </td>
                  </tr>
                ))}
                {vendorData.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                      No vendor data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {vendorData.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-100">
              <p className="text-sm text-emerald-600">Showing {vendorData.length} vendors</p>
            </div>
          )}
        </div>
      )}

      {/* By Category */}
      {activeTab === 'by-category' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-medium text-gray-900">Revenue by Category</h3>
          </div>
          {/* Mobile Card View */}
          <div className="sm:hidden divide-y divide-gray-100">
            {categoryData.map((row, index) => (
              <div key={row.categoryId} className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-full ${getAvatarColor(index)} flex items-center justify-center text-white font-medium`}>
                    {row.categoryName?.charAt(0).toUpperCase() || 'C'}
                  </div>
                  <span className="font-medium text-gray-900 flex-1">{row.categoryName}</span>
                  <span className="inline-flex px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                    {row.totalOrders || row.orderCount} orders
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-xs text-gray-500">Sales</p>
                    <p className="font-medium text-gray-900">{formatCurrency(row.totalSales)}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-2">
                    <p className="text-xs text-gray-500">Commission</p>
                    <p className="font-medium text-emerald-600">{formatCurrency(row.totalCommission)}</p>
                  </div>
                </div>
              </div>
            ))}
            {categoryData.length === 0 && (
              <div className="p-8 text-center text-gray-500">No category data available</div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-emerald-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Category</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-emerald-700 uppercase">Total Sales</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-emerald-700 uppercase">Commission</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-emerald-700 uppercase">Orders</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categoryData.map((row, index) => (
                  <tr key={row.categoryId} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full ${getAvatarColor(index)} flex items-center justify-center text-white font-medium text-sm`}>
                          {row.categoryName?.charAt(0).toUpperCase() || 'C'}
                        </div>
                        <span className="font-medium text-gray-900">{row.categoryName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-medium text-gray-900">{formatCurrency(row.totalSales)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-emerald-600 font-medium">{formatCurrency(row.totalCommission)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                        {row.totalOrders || row.orderCount}
                      </span>
                    </td>
                  </tr>
                ))}
                {categoryData.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                      No category data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {categoryData.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-100">
              <p className="text-sm text-emerald-600">Showing {categoryData.length} categories</p>
            </div>
          )}
        </div>
      )}

      {/* Top Products */}
      {activeTab === 'top-products' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-medium text-gray-900">Top Performing Products</h3>
          </div>
          {/* Mobile Card View */}
          <div className="sm:hidden divide-y divide-gray-100">
            {topProducts.map((row, i) => (
              <div key={row.productId} className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                    i === 0 ? 'bg-amber-100 text-amber-700' :
                    i === 1 ? 'bg-gray-200 text-gray-700' :
                    i === 2 ? 'bg-amber-50 text-amber-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{row.productName}</p>
                    <p className="text-xs text-gray-500">{row.productSku}</p>
                  </div>
                  <span className="inline-flex px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                    {row.unitsSold} units
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-xs text-gray-500">Sales</p>
                    <p className="font-medium text-gray-900">{formatCurrency(row.totalSales)}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-2">
                    <p className="text-xs text-gray-500">Commission</p>
                    <p className="font-medium text-emerald-600">{formatCurrency(row.totalCommission)}</p>
                  </div>
                </div>
              </div>
            ))}
            {topProducts.length === 0 && (
              <div className="p-8 text-center text-gray-500">No product data available</div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-emerald-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Product</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-emerald-700 uppercase">Total Sales</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-emerald-700 uppercase">Commission</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-emerald-700 uppercase">Units Sold</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topProducts.map((row, i) => (
                  <tr key={row.productId} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${
                        i === 0 ? 'bg-amber-100 text-amber-700' :
                        i === 1 ? 'bg-gray-200 text-gray-700' :
                        i === 2 ? 'bg-amber-50 text-amber-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full ${getAvatarColor(i)} flex items-center justify-center text-white font-medium text-sm`}>
                          {row.productName?.charAt(0).toUpperCase() || 'P'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{row.productName}</p>
                          <p className="text-xs text-gray-500">{row.productSku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-medium text-gray-900">{formatCurrency(row.totalSales)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-emerald-600 font-medium">{formatCurrency(row.totalCommission)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                        {row.unitsSold} units
                      </span>
                    </td>
                  </tr>
                ))}
                {topProducts.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                      No product data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {topProducts.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-100">
              <p className="text-sm text-emerald-600">Showing top {topProducts.length} products</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FinancialReports;
