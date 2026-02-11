import { useState, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import VendorSidebar from './VendorSidebar';

const SearchIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const ChevronDownIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const MenuIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const BellIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const VendorLayout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const user = useSelector((state) => state.auth.user);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const storeName = useMemo(() =>
    user?.vendor?.storeName || user?.profile?.firstName || 'Vendor'
  , [user?.vendor?.storeName, user?.profile?.firstName]);

  const firstName = useMemo(() =>
    user?.profile?.firstName || user?.email?.split('@')[0] || 'Vendor'
  , [user?.profile?.firstName, user?.email]);

  const handleSidebarToggle = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  const handleMobileMenuOpen = useCallback(() => {
    setMobileMenuOpen(true);
  }, []);

  const handleMobileMenuClose = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <VendorSidebar
          collapsed={sidebarCollapsed}
          onToggle={handleSidebarToggle}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={handleMobileMenuClose}
          />
          <div className="absolute left-0 top-0 h-full">
            <VendorSidebar
              collapsed={false}
              onToggle={handleMobileMenuClose}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white flex items-center justify-between px-4 lg:px-8 shadow-sm">
          {/* Left: Mobile Menu + Greeting */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleMobileMenuOpen}
              className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
            >
              <MenuIcon className="w-6 h-6" />
            </button>
            <div className="hidden sm:block">
              <h1 className="text-xl text-emerald-500">
                {greeting}, <span className="font-bold">{storeName}!</span>
              </h1>
            </div>
          </div>

          {/* Right: Search + Notification + Profile */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="hidden md:flex items-center border border-gray-200 rounded-lg px-3 py-2">
              <SearchIcon className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent border-none outline-none ml-2 text-sm w-40 lg:w-48 placeholder-gray-400 text-gray-900"
              />
            </div>

            {/* Notification Bell */}
            <button className="relative p-2 text-gray-400 hover:bg-gray-100 rounded-lg">
              <BellIcon className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Profile */}
            <Link to="/vendor/storefront" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden">
                <img
                  src={`https://ui-avatars.com/api/?name=${firstName}&background=10b981&color=fff`}
                  alt={firstName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">{firstName}</p>
                <p className="text-xs text-gray-500">Vendor</p>
              </div>
              <ChevronDownIcon className="w-4 h-4 text-gray-400 hidden sm:block" />
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default VendorLayout;
