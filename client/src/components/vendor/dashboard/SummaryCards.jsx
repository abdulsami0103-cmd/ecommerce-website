import { Link } from 'react-router-dom';

// Icons
const CurrencyIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const OrderIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

const ClockIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const WarningIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const EyeIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const WalletIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const TrendUpIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const TrendDownIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
  </svg>
);

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const StatCard = ({ title, value, icon: Icon, trend, trendLabel, iconBg, iconColor, link, alert, borderColor }) => {
  const Card = link ? Link : 'div';
  const cardProps = link ? { to: link } : {};

  return (
    <Card
      {...cardProps}
      className={`bg-white rounded-2xl shadow-sm p-2.5 sm:p-5 hover:shadow-md transition-shadow ${link ? 'cursor-pointer' : ''} ${
        borderColor ? `border-l-4 ${borderColor}` : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-[10px] sm:text-sm text-gray-500 font-medium truncate">{title}</p>
          <p className="text-sm sm:text-2xl font-bold text-gray-900 mt-0.5 sm:mt-1 truncate">{value}</p>
          {trend !== undefined && (
            <div className="flex items-center mt-1 sm:mt-2 gap-1">
              {trend > 0 ? (
                <TrendUpIcon className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500" />
              ) : trend < 0 ? (
                <TrendDownIcon className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
              ) : null}
              <span className={`text-[10px] sm:text-sm font-medium ${
                trend > 0 ? 'text-emerald-600' : trend < 0 ? 'text-red-600' : 'text-gray-500'
              }`}>
                {trend > 0 ? '+' : ''}{trend}%
              </span>
              {trendLabel && <span className="text-[8px] sm:text-xs text-gray-400 hidden sm:inline">{trendLabel}</span>}
            </div>
          )}
        </div>
        <div className={`w-8 h-8 sm:w-12 sm:h-12 ${iconBg} rounded-lg sm:rounded-xl flex items-center justify-center shrink-0`}>
          <Icon className={`w-4 h-4 sm:w-6 sm:h-6 ${iconColor}`} />
        </div>
      </div>
    </Card>
  );
};

const SummaryCards = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="space-y-2 sm:space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm p-2.5 sm:p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-3 sm:h-4 w-16 sm:w-24 bg-gray-200 rounded animate-pulse" />
                  <div className="h-5 sm:h-8 w-20 sm:w-32 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-8 w-8 sm:h-12 sm:w-12 bg-gray-200 rounded-lg sm:rounded-xl animate-pulse" />
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm p-2.5 sm:p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-3 sm:h-4 w-16 sm:w-24 bg-gray-200 rounded animate-pulse" />
                  <div className="h-5 sm:h-8 w-20 sm:w-32 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-8 w-8 sm:h-12 sm:w-12 bg-gray-200 rounded-lg sm:rounded-xl animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 sm:space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <StatCard
          title="Today's Revenue"
          value={formatCurrency(data?.todayRevenue || 0)}
          icon={CurrencyIcon}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
          borderColor="border-emerald-500"
          link="/vendor/analytics"
        />
        <StatCard
          title="Today's Orders"
          value={data?.todayOrders || 0}
          icon={OrderIcon}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          borderColor="border-blue-500"
          link="/vendor/suborders"
        />
        <StatCard
          title="Pending Orders"
          value={data?.pendingOrders || 0}
          icon={ClockIcon}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
          borderColor="border-amber-500"
          link="/vendor/suborders?status=pending"
        />
        <StatCard
          title="Low Stock Items"
          value={data?.lowStockProducts || 0}
          icon={WarningIcon}
          iconBg={data?.lowStockProducts > 0 ? 'bg-red-100' : 'bg-gray-100'}
          iconColor={data?.lowStockProducts > 0 ? 'text-red-600' : 'text-gray-600'}
          borderColor={data?.lowStockProducts > 0 ? 'border-red-500' : 'border-gray-300'}
          link="/vendor/inventory/alerts"
        />
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <StatCard
          title="30-Day Revenue"
          value={formatCurrency(data?.totalRevenue || 0)}
          icon={CurrencyIcon}
          trend={data?.revenueTrend}
          trendLabel="vs last 30d"
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
          link="/vendor/analytics"
        />
        <StatCard
          title="30-Day Orders"
          value={data?.totalOrders || 0}
          icon={OrderIcon}
          trend={data?.ordersTrend}
          trendLabel="vs last 30d"
          iconBg="bg-indigo-100"
          iconColor="text-indigo-600"
          link="/vendor/suborders"
        />
        <StatCard
          title="Unique Visitors"
          value={data?.uniqueVisitors || 0}
          icon={EyeIcon}
          iconBg="bg-cyan-100"
          iconColor="text-cyan-600"
          link="/vendor/analytics"
        />
        <StatCard
          title="Available Balance"
          value={formatCurrency(data?.availableBalance || 0)}
          icon={WalletIcon}
          iconBg="bg-teal-100"
          iconColor="text-teal-600"
          link="/vendor/wallet"
        />
      </div>

      {/* Additional Info Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        <Link to="/vendor/analytics" className="bg-white rounded-2xl shadow-sm p-2.5 sm:p-5 text-center hover:shadow-md transition-shadow cursor-pointer">
          <p className="text-[10px] sm:text-sm text-gray-500 font-medium">Avg Order</p>
          <p className="text-xs sm:text-xl font-bold text-gray-900 mt-0.5 sm:mt-1 truncate">
            {formatCurrency(data?.averageOrderValue || 0)}
          </p>
        </Link>
        <Link to="/vendor/analytics" className="bg-white rounded-2xl shadow-sm p-2.5 sm:p-5 text-center hover:shadow-md transition-shadow cursor-pointer">
          <p className="text-[10px] sm:text-sm text-gray-500 font-medium">Conversion</p>
          <p className="text-xs sm:text-xl font-bold text-gray-900 mt-0.5 sm:mt-1">{data?.conversionRate || 0}%</p>
        </Link>
        <Link to="/vendor/analytics" className="bg-white rounded-2xl shadow-sm p-2.5 sm:p-5 text-center hover:shadow-md transition-shadow cursor-pointer">
          <p className="text-[10px] sm:text-sm text-gray-500 font-medium">Page Views</p>
          <p className="text-xs sm:text-xl font-bold text-gray-900 mt-0.5 sm:mt-1">{(data?.totalPageViews || 0).toLocaleString()}</p>
        </Link>
        <Link to="/vendor/wallet" className="bg-white rounded-2xl shadow-sm p-2.5 sm:p-5 text-center hover:shadow-md transition-shadow cursor-pointer">
          <p className="text-[10px] sm:text-sm text-gray-500 font-medium">Pending Bal.</p>
          <p className="text-xs sm:text-xl font-bold text-amber-600 mt-0.5 sm:mt-1 truncate">
            {formatCurrency(data?.pendingBalance || 0)}
          </p>
        </Link>
      </div>
    </div>
  );
};

export default SummaryCards;
