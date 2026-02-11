import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Price } from '../../components/common';
import {
  BikoStatCard,
  RevenueReportChart,
  RecentActivityPanel,
  BestSellingProductsTable,
  PopularClientsTable,
  OrderOverviewChart
} from '../../components/admin';

// Icons for stat cards
const UsersIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const TwoUsersIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const ThreeUsersIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const StoreIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const ShoppingBagIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
  </svg>
);

const CurrencyIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ClipboardIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

const WalletIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const RefreshIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const ShieldCheckIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const TruckIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
  </svg>
);

const CouponIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
  </svg>
);

const SupportIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const PromotionIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
  </svg>
);

const CampaignIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const CogIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const DocumentIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const PercentIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

const TaxIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
  </svg>
);

const ReportIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const ExclamationIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const TagIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

const ChartIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const ActivityIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const GlobeIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
  </svg>
);

const LockIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const SearchIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVendors: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingVendors: 0,
    pendingShipments: 0,
    escalatedRMAs: 0,
    pendingPayouts: 0,
    openTickets: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [usersRes, vendorsRes, productsRes, ordersRes, shipmentsRes, rmaRes, payoutsRes, ticketsRes] = await Promise.all([
        api.get('/admin/users?limit=1').catch(() => ({ data: { pagination: { total: 0 } } })),
        api.get('/admin/vendors').catch(() => ({ data: { data: [] } })),
        api.get('/products?limit=1').catch(() => ({ data: { pagination: { total: 0 } } })),
        api.get('/admin/orders?limit=10').catch(() => ({ data: { data: [], pagination: { total: 0 } } })),
        api.get('/admin/shipments?status=pending&limit=1').catch(() => ({ data: { pagination: { total: 0 } } })),
        api.get('/admin/rma?status=escalated&limit=1').catch(() => ({ data: { pagination: { total: 0 } } })),
        api.get('/payouts/admin?status=pending&limit=1').catch(() => ({ data: { pagination: { total: 0 } } })),
        api.get('/admin/tickets?status=open&limit=1').catch(() => ({ data: { stats: { open: 0 } } })),
      ]);

      const vendors = vendorsRes.data?.data || [];
      const pendingVendors = vendors.filter(v => !v.isApproved).length;
      const orders = ordersRes.data?.data || [];

      // Calculate total revenue from orders
      const totalRevenue = orders.reduce((sum, order) => sum + (order.totals?.total || 0), 0);

      setStats({
        totalUsers: usersRes.data?.pagination?.total || 0,
        totalVendors: vendors.length,
        totalProducts: productsRes.data?.pagination?.total || 0,
        totalOrders: ordersRes.data?.pagination?.total || 0,
        totalRevenue,
        pendingVendors,
        pendingShipments: shipmentsRes.data?.pagination?.total || 0,
        escalatedRMAs: rmaRes.data?.pagination?.total || 0,
        pendingPayouts: payoutsRes.data?.pagination?.total || 0,
        openTickets: ticketsRes.data?.stats?.open || 0,
      });

      setRecentOrders(orders.slice(0, 5));

      // Transform recent orders to activity format
      const activities = orders.slice(0, 6).map(order => ({
        id: order._id,
        user: order.customer?.profile?.firstName
          ? `${order.customer.profile.firstName} ${order.customer.profile.lastName || ''}`
          : order.customer?.email?.split('@')[0] || 'Customer',
        action: 'placed an order',
        target: `#${order.orderNumber}`,
        time: getTimeAgo(order.createdAt),
        type: 'order'
      }));
      setRecentActivity(activities);

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  // Quick Links with all features
  const quickLinks = [
    { title: 'Manage Users', description: 'View and manage all users', icon: UsersIcon, link: '/admin/users' },
    { title: 'Manage Vendors', description: 'Approve or reject vendors', icon: StoreIcon, link: '/admin/vendors', badge: stats.pendingVendors > 0 ? stats.pendingVendors : null },
    { title: 'Product Moderation', description: 'Review & approve products', icon: ShieldCheckIcon, link: '/admin/moderation' },
    { title: 'Vendor Verifications', description: 'Review vendor documents', icon: ClipboardIcon, link: '/admin/vendor-verifications' },
    { title: 'Manage Orders', description: 'View all platform orders', icon: ClipboardIcon, link: '/admin/orders' },
    { title: 'Shipments', description: 'Track all shipments', icon: TruckIcon, link: '/admin/shipments', badge: stats.pendingShipments > 0 ? stats.pendingShipments : null },
    { title: 'RMA Management', description: 'Returns & refunds', icon: RefreshIcon, link: '/admin/rma', badge: stats.escalatedRMAs > 0 ? stats.escalatedRMAs : null },
    { title: 'Coupons', description: 'Manage discounts & codes', icon: CouponIcon, link: '/admin/coupons' },
    { title: 'Support Tickets', description: 'Customer support tickets', icon: SupportIcon, link: '/admin/tickets', badge: stats.openTickets > 0 ? stats.openTickets : null },
    { title: 'Promotions', description: 'Featured products & vendors', icon: PromotionIcon, link: '/admin/promotions' },
    { title: 'Campaigns', description: 'Email & push marketing', icon: CampaignIcon, link: '/admin/campaigns' },
    { title: 'Courier Settings', description: 'Configure couriers', icon: CogIcon, link: '/admin/couriers' },
    { title: 'Invoice Templates', description: 'Manage invoice designs', icon: DocumentIcon, link: '/admin/invoice-templates' },
    { title: 'Commission Rules', description: 'Set commission rates', icon: PercentIcon, link: '/admin/commission-rules' },
    { title: 'Payout Requests', description: 'Manage vendor payouts', icon: WalletIcon, link: '/admin/payouts', badge: stats.pendingPayouts > 0 ? stats.pendingPayouts : null },
    { title: 'Tax Configuration', description: 'Tax zones & rates', icon: TaxIcon, link: '/admin/tax' },
    { title: 'Financial Reports', description: 'Revenue & analytics', icon: ReportIcon, link: '/admin/financial-reports' },
    { title: 'Low Stock Report', description: 'Inventory alerts', icon: ExclamationIcon, link: '/admin/low-stock' },
    { title: 'Attributes', description: 'Product attributes', icon: TagIcon, link: '/admin/attributes' },
    { title: 'Analytics', description: 'Platform statistics & charts', icon: ChartIcon, link: '/admin/analytics' },
    { title: 'Live Activity', description: 'Real-time user tracking', icon: ActivityIcon, link: '/admin/live' },
    { title: 'Translations', description: 'Languages & UI strings', icon: GlobeIcon, link: '/admin/translations' },
    { title: 'Currencies', description: 'Currency & exchange rates', icon: CurrencyIcon, link: '/admin/currencies' },
    { title: 'Security', description: 'Logs, sessions & alerts', icon: LockIcon, link: '/admin/security' },
    { title: 'SEO Manager', description: 'Meta tags & sitemaps', icon: SearchIcon, link: '/admin/seo' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert Cards */}
      {(stats.pendingVendors > 0 || stats.escalatedRMAs > 0 || stats.pendingPayouts > 0) && (
        <div className="space-y-3">
          {stats.pendingVendors > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <StoreIcon className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-amber-800">
                    {stats.pendingVendors} Pending Vendor Approval{stats.pendingVendors > 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-amber-600">Review and approve vendor applications</p>
                </div>
              </div>
              <Link
                to="/admin/vendors"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Review Now
              </Link>
            </div>
          )}

          {stats.escalatedRMAs > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <RefreshIcon className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-red-800">
                    {stats.escalatedRMAs} Escalated RMA Request{stats.escalatedRMAs > 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-red-600">Customer disputes requiring admin intervention</p>
                </div>
              </div>
              <Link
                to="/admin/rma?status=escalated"
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Review Now
              </Link>
            </div>
          )}

          {stats.pendingPayouts > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <WalletIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-blue-800">
                    {stats.pendingPayouts} Pending Payout Request{stats.pendingPayouts > 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-blue-600">Vendor payout requests awaiting approval</p>
                </div>
              </div>
              <Link
                to="/admin/payouts?status=pending"
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Review Now
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Link to="/admin/users">
          <BikoStatCard
            title="Total Users"
            value={stats.totalUsers}
            change={12.5}
            icon={TwoUsersIcon}
            iconBgColor="bg-emerald-100"
            iconColor="text-emerald-500"
          />
        </Link>
        <Link to="/admin/orders">
          <BikoStatCard
            title="Total Orders"
            value={stats.totalOrders}
            change={8.2}
            icon={ClipboardIcon}
            iconBgColor="bg-violet-100"
            iconColor="text-violet-500"
          />
        </Link>
        <Link to="/admin/vendors">
          <BikoStatCard
            title="Total Vendors"
            value={stats.totalVendors}
            change={-2.4}
            icon={ThreeUsersIcon}
            iconBgColor="bg-orange-100"
            iconColor="text-orange-500"
          />
        </Link>
        <Link to="/admin/orders">
          <BikoStatCard
            title="Total Earnings"
            value={stats.totalRevenue}
            change={15.3}
            icon={CurrencyIcon}
            iconBgColor="bg-pink-100"
            iconColor="text-pink-500"
          />
        </Link>
      </div>

      {/* Revenue Chart + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueReportChart title="Revenue Report" />
        </div>
        <div className="lg:col-span-1">
          <RecentActivityPanel activities={recentActivity} />
        </div>
      </div>

      {/* Best Selling Products Table */}
      <BestSellingProductsTable />

      {/* Popular Clients + Order Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PopularClientsTable />
        <OrderOverviewChart title="Order Overview" />
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
            <Link to="/admin/orders" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
              View All
            </Link>
          </div>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No orders yet</div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="sm:hidden divide-y divide-gray-100">
              {recentOrders.map((order) => (
                <Link
                  key={order._id}
                  to={`/admin/orders/${order._id}`}
                  className="block p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="font-semibold text-emerald-600">#{order.orderNumber}</span>
                      <p className="text-sm text-gray-900 mt-0.5">
                        {order.customer?.profile?.firstName} {order.customer?.profile?.lastName}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900">
                      <Price amount={order.totals?.total || 0} />
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-semibold text-gray-900 uppercase tracking-wider px-6 py-4">Order</th>
                    <th className="text-left text-xs font-semibold text-gray-900 uppercase tracking-wider px-6 py-4">Customer</th>
                    <th className="text-left text-xs font-semibold text-gray-900 uppercase tracking-wider px-6 py-4">Status</th>
                    <th className="text-left text-xs font-semibold text-gray-900 uppercase tracking-wider px-6 py-4">Total</th>
                    <th className="text-left text-xs font-semibold text-gray-900 uppercase tracking-wider px-6 py-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link to={`/admin/orders/${order._id}`} className="font-medium text-emerald-600 hover:text-emerald-700">
                          #{order.orderNumber}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.customer?.profile?.firstName} {order.customer?.profile?.lastName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                          order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                          order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <Price amount={order.totals?.total || 0} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Quick Links Section - All Features */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {quickLinks.map((link, index) => (
            <Link
              key={index}
              to={link.link}
              className="relative p-4 bg-gray-50 hover:bg-emerald-50 rounded-xl transition-colors group"
            >
              <link.icon className="w-8 h-8 text-emerald-600 mb-3" />
              <h4 className="font-semibold text-gray-900 group-hover:text-emerald-700">{link.title}</h4>
              <p className="text-sm text-gray-500 mt-1">{link.description}</p>
              {link.badge && (
                <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {link.badge}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
