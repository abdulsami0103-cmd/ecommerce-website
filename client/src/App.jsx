import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { getMe } from './store/slices/authSlice';
import Layout from './components/layout/Layout';
import { AdminLayout } from './components/admin';
import { VendorLayout } from './components/vendor';
import ProtectedRoute from './components/ProtectedRoute';
import { Loading } from './components/common';

// Public Pages
import Home from './pages/public/Home';
import Products from './pages/public/Products';
import ProductDetail from './pages/public/ProductDetail';
import Vendors from './pages/public/Vendors';
import VendorStore from './pages/public/VendorStore';
import ShippingInfo from './pages/public/ShippingInfo';
import FAQ from './pages/public/FAQ';
import Contact from './pages/public/Contact';
import ReturnsRefunds from './pages/public/ReturnsRefunds';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Customer Pages
import Profile from './pages/customer/Profile';
import Orders from './pages/customer/Orders';
import OrderDetail from './pages/customer/OrderDetail';
import Checkout from './pages/customer/Checkout';
import Rewards from './pages/customer/Rewards';
import CustomerTickets from './pages/customer/Tickets';
import CustomerTicketDetail from './pages/customer/TicketDetail';
import CustomerMessages from './pages/customer/Messages';
import CustomerRMARequests from './pages/customer/RMARequests';

// Vendor Pages
import VendorDashboard from './pages/vendor/Dashboard';
import VendorProducts from './pages/vendor/Products';
import VendorProductForm from './pages/vendor/ProductForm';
import BecomeVendor from './pages/vendor/BecomeVendor';
import VendorVerification from './pages/vendor/Verification';
import VendorAnalytics from './pages/vendor/Analytics';
import VendorTeam from './pages/vendor/Team';
import VendorSubscription from './pages/vendor/Subscription';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminVendors from './pages/admin/Vendors';
import AdminOrders from './pages/admin/Orders';
import AdminOrderDetail from './pages/admin/OrderDetail';
import AdminProducts from './pages/admin/Products';
import AdminAnalytics from './pages/admin/Analytics';
import AdminLiveActivity from './pages/admin/LiveActivity';
import AdminVendorVerifications from './pages/admin/VendorVerifications';
import AdminModerationQueue from './pages/admin/ModerationQueue';
import AdminProductReview from './pages/admin/ProductReview';
import AdminLowStockReport from './pages/admin/LowStockReport';
import AdminAttributes from './pages/admin/Attributes';
import AdminCommissionRules from './pages/admin/CommissionRules';
import AdminPayoutRequests from './pages/admin/PayoutRequests';
import AdminTaxConfiguration from './pages/admin/TaxConfiguration';
import AdminFinancialReports from './pages/admin/FinancialReports';
import AdminShipments from './pages/admin/Shipments';
import AdminShipmentDetail from './pages/admin/ShipmentDetail';
import AdminRMAManagement from './pages/admin/RMAManagement';
import AdminCourierSettings from './pages/admin/CourierSettings';
import AdminInvoiceTemplates from './pages/admin/InvoiceTemplates';
import AdminCoupons from './pages/admin/Coupons';
import AdminTickets from './pages/admin/Tickets';
import AdminPromotions from './pages/admin/Promotions';
import AdminCampaigns from './pages/admin/Campaigns';
import AdminSecurityDashboard from './pages/admin/SecurityDashboard';
import AdminActivityLogs from './pages/admin/ActivityLogs';
import AdminSessions from './pages/admin/Sessions';
import AdminSecurityAlerts from './pages/admin/SecurityAlerts';
import AdminLoginAttempts from './pages/admin/LoginAttempts';
import AdminSeoManager from './pages/admin/SeoManager';
import AdminRedirects from './pages/admin/Redirects';
import AdminTranslationManager from './pages/admin/TranslationManager';
import AdminCurrencyManager from './pages/admin/CurrencyManager';
import AdminSettings from './pages/admin/Settings';

// Vendor Pages - Additional
import VendorInventoryAlerts from './pages/vendor/InventoryAlerts';
import VendorWallet from './pages/vendor/Wallet';
import VendorPayoutSettings from './pages/vendor/PayoutSettings';
import VendorPayoutHistory from './pages/vendor/PayoutHistory';
import VendorEarnings from './pages/vendor/Earnings';
import VendorSubOrders from './pages/vendor/SubOrders';
import VendorOrderDetail from './pages/vendor/OrderDetail';
import VendorShipmentManagement from './pages/vendor/ShipmentManagement';
import VendorRMARequests from './pages/vendor/RMARequests';
import VendorInvoices from './pages/vendor/VendorInvoices';
import VendorTaxReports from './pages/vendor/TaxReports';
import VendorReviews from './pages/vendor/Reviews';
import VendorQuestions from './pages/vendor/Questions';
import VendorMessages from './pages/vendor/Messages';
import VendorStorefrontEditor from './pages/vendor/StorefrontEditor';
import VendorReports from './pages/vendor/Reports';
import VendorCoupons from './pages/vendor/Coupons';
import VendorPromotions from './pages/vendor/Promotions';

// Public Pages - Track Order
import TrackOrder from './pages/TrackOrder';

function App() {
  const dispatch = useDispatch();
  const { token, loading } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token) {
      dispatch(getMe());
    }
  }, [dispatch, token]);

  if (loading && token) {
    return <Loading fullScreen />;
  }

  return (
    <Routes>
      {/* Auth Routes (no layout) */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Public Routes */}
      <Route
        path="/"
        element={
          <Layout>
            <Home />
          </Layout>
        }
      />
      <Route
        path="/products"
        element={
          <Layout>
            <Products />
          </Layout>
        }
      />
      <Route
        path="/products/:slug"
        element={
          <Layout>
            <ProductDetail />
          </Layout>
        }
      />
      <Route
        path="/become-vendor"
        element={
          <Layout>
            <BecomeVendor />
          </Layout>
        }
      />
      <Route
        path="/vendors"
        element={
          <Layout>
            <Vendors />
          </Layout>
        }
      />
      <Route
        path="/vendor/:slug"
        element={
          <Layout>
            <VendorStore />
          </Layout>
        }
      />
      <Route
        path="/shipping"
        element={
          <Layout>
            <ShippingInfo />
          </Layout>
        }
      />
      <Route
        path="/faq"
        element={
          <Layout>
            <FAQ />
          </Layout>
        }
      />
      <Route
        path="/contact"
        element={
          <Layout>
            <Contact />
          </Layout>
        }
      />
      <Route
        path="/returns-refunds"
        element={
          <Layout>
            <ReturnsRefunds />
          </Layout>
        }
      />

      {/* Protected Customer Routes */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Layout>
              <Profile />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <Layout>
              <Orders />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <OrderDetail />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/checkout"
        element={
          <ProtectedRoute>
            <Layout>
              <Checkout />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/rewards"
        element={
          <ProtectedRoute>
            <Layout>
              <Rewards />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tickets"
        element={
          <ProtectedRoute>
            <Layout>
              <CustomerTickets />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tickets/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <CustomerTicketDetail />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/messages"
        element={
          <ProtectedRoute>
            <Layout>
              <CustomerMessages />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/returns"
        element={
          <ProtectedRoute>
            <Layout>
              <CustomerRMARequests />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Protected Vendor Routes */}
      <Route
        path="/vendor/dashboard"
        element={
          <ProtectedRoute roles={['vendor']}>
            <VendorLayout>
              <VendorDashboard />
            </VendorLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/products"
        element={
          <ProtectedRoute roles={['vendor']}>
            <VendorLayout>
              <VendorProducts />
            </VendorLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/products/new"
        element={
          <ProtectedRoute roles={['vendor']}>
            <VendorLayout>
              <VendorProductForm />
            </VendorLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/products/:id/edit"
        element={
          <ProtectedRoute roles={['vendor']}>
            <VendorLayout>
              <VendorProductForm />
            </VendorLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/verification"
        element={
          <ProtectedRoute roles={['vendor']}>
            <VendorLayout>
              <VendorVerification />
            </VendorLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/analytics"
        element={
          <ProtectedRoute roles={['vendor']}>
            <VendorLayout>
              <VendorAnalytics />
            </VendorLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/team"
        element={
          <ProtectedRoute roles={['vendor']}>
            <VendorLayout>
              <VendorTeam />
            </VendorLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/subscription"
        element={
          <ProtectedRoute roles={['vendor']}>
            <VendorLayout>
              <VendorSubscription />
            </VendorLayout>
          </ProtectedRoute>
        }
      />

      {/* Protected Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminLayout>
              <AdminUsers />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/vendors"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminLayout>
              <AdminVendors />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminLayout>
              <AdminOrders />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/orders/:id"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminLayout>
              <AdminOrderDetail />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/products"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminLayout>
              <AdminProducts />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminLayout>
              <AdminAnalytics />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/live"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminLayout>
              <AdminLiveActivity />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/vendor-verifications"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminLayout>
              <AdminVendorVerifications />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/moderation"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminLayout>
              <AdminModerationQueue />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/products/:id/review"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminLayout>
              <AdminProductReview />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/low-stock"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminLayout>
              <AdminLowStockReport />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/attributes"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminLayout>
              <AdminAttributes />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/commission-rules"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminLayout>
              <AdminCommissionRules />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/payouts"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminLayout>
              <AdminPayoutRequests />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/tax"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminLayout>
              <AdminTaxConfiguration />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/financial-reports"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminLayout>
              <AdminFinancialReports />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/shipments"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminLayout>
              <AdminShipments />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/shipments/:id"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminLayout>
              <AdminShipmentDetail />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/rma"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminLayout>
              <AdminRMAManagement />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/couriers"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminLayout>
              <AdminCourierSettings />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/invoice-templates"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminLayout>
              <AdminInvoiceTemplates />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/coupons"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminLayout>
              <AdminCoupons />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/tickets"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminLayout>
              <AdminTickets />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/promotions"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminLayout>
              <AdminPromotions />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/campaigns"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminLayout>
              <AdminCampaigns />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/security"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminLayout>
              <AdminSecurityDashboard />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/security/activity"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminLayout>
              <AdminActivityLogs />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/security/sessions"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminLayout>
              <AdminSessions />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/security/alerts"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminLayout>
              <AdminSecurityAlerts />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/security/login-attempts"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminLayout>
              <AdminLoginAttempts />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/seo"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminLayout>
              <AdminSeoManager />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/seo/redirects"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminLayout>
              <AdminRedirects />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/translations"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminLayout>
              <AdminTranslationManager />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/currencies"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminLayout>
              <AdminCurrencyManager />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminLayout>
              <AdminSettings />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* Vendor Inventory Routes */}
      <Route
        path="/vendor/inventory/alerts"
        element={
          <ProtectedRoute roles={['vendor']}>
            <VendorLayout>
              <VendorInventoryAlerts />
            </VendorLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/wallet"
        element={
          <ProtectedRoute roles={['vendor']}>
            <VendorLayout>
              <VendorWallet />
            </VendorLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/payouts/settings"
        element={
          <ProtectedRoute roles={['vendor']}>
            <VendorLayout>
              <VendorPayoutSettings />
            </VendorLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/payouts/history"
        element={
          <ProtectedRoute roles={['vendor']}>
            <VendorLayout>
              <VendorPayoutHistory />
            </VendorLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/payouts/request"
        element={
          <ProtectedRoute roles={['vendor']}>
            <VendorLayout>
              <VendorPayoutHistory />
            </VendorLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/earnings"
        element={
          <ProtectedRoute roles={['vendor']}>
            <VendorLayout>
              <VendorEarnings />
            </VendorLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/suborders"
        element={
          <ProtectedRoute roles={['vendor']}>
            <VendorLayout>
              <VendorSubOrders />
            </VendorLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/orders/:id"
        element={
          <ProtectedRoute roles={['vendor']}>
            <VendorLayout>
              <VendorOrderDetail />
            </VendorLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/shipments"
        element={
          <ProtectedRoute roles={['vendor']}>
            <VendorLayout>
              <VendorShipmentManagement />
            </VendorLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/shipments/:id"
        element={
          <ProtectedRoute roles={['vendor']}>
            <VendorLayout>
              <VendorShipmentManagement />
            </VendorLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/rma"
        element={
          <ProtectedRoute roles={['vendor']}>
            <VendorLayout>
              <VendorRMARequests />
            </VendorLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/invoices"
        element={
          <ProtectedRoute roles={['vendor']}>
            <VendorLayout>
              <VendorInvoices />
            </VendorLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/tax-reports"
        element={
          <ProtectedRoute roles={['vendor']}>
            <VendorLayout>
              <VendorTaxReports />
            </VendorLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/reviews"
        element={
          <ProtectedRoute roles={['vendor']}>
            <VendorLayout>
              <VendorReviews />
            </VendorLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/questions"
        element={
          <ProtectedRoute roles={['vendor']}>
            <VendorLayout>
              <VendorQuestions />
            </VendorLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/messages"
        element={
          <ProtectedRoute roles={['vendor']}>
            <VendorLayout>
              <VendorMessages />
            </VendorLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/storefront"
        element={
          <ProtectedRoute roles={['vendor']}>
            <VendorLayout>
              <VendorStorefrontEditor />
            </VendorLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/settings"
        element={
          <ProtectedRoute roles={['vendor']}>
            <VendorLayout>
              <VendorStorefrontEditor />
            </VendorLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/reports"
        element={
          <ProtectedRoute roles={['vendor']}>
            <VendorLayout>
              <VendorReports />
            </VendorLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/coupons"
        element={
          <ProtectedRoute roles={['vendor']}>
            <VendorLayout>
              <VendorCoupons />
            </VendorLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/promotions"
        element={
          <ProtectedRoute roles={['vendor']}>
            <VendorLayout>
              <VendorPromotions />
            </VendorLayout>
          </ProtectedRoute>
        }
      />

      {/* Public Track Order */}
      <Route
        path="/track"
        element={
          <Layout>
            <TrackOrder />
          </Layout>
        }
      />
      <Route
        path="/track/:trackingNumber"
        element={
          <Layout>
            <TrackOrder />
          </Layout>
        }
      />

      {/* 404 */}
      <Route
        path="*"
        element={
          <Layout>
            <div className="container mx-auto px-4 py-16 text-center">
              <h1 className="text-4xl font-bold mb-4">404</h1>
              <p className="text-gray-500">Page not found</p>
            </div>
          </Layout>
        }
      />
    </Routes>
  );
}

export default App;
