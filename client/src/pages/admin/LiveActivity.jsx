import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

// Icons
const UserIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const GlobeIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ShoppingCartIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const EyeIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const HeartIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const CreditCardIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const LoginIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
  </svg>
);

const ActivityIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const UsersIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const getAvatarColor = (index) => {
  const colors = [
    'bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-pink-500',
    'bg-orange-500', 'bg-teal-500', 'bg-indigo-500', 'bg-rose-500'
  ];
  return colors[index % colors.length];
};

const LiveActivity = () => {
  const [activities, setActivities] = useState([]);
  const [liveUsers, setLiveUsers] = useState([]);
  const [stats, setStats] = useState({
    activeUsers: 0,
    todayVisits: 0,
    todayOrders: 0,
    todayRevenue: 0,
  });
  const [isConnected, setIsConnected] = useState(false);
  const activityRef = useRef(null);

  // Simulated live data for demo
  useEffect(() => {
    // Generate initial sample data
    const sampleActivities = generateSampleActivities(10);
    setActivities(sampleActivities);
    setLiveUsers(generateSampleUsers(8));
    setStats({
      activeUsers: Math.floor(Math.random() * 20) + 10,
      todayVisits: Math.floor(Math.random() * 500) + 200,
      todayOrders: Math.floor(Math.random() * 30) + 10,
      todayRevenue: Math.floor(Math.random() * 5000) + 1000,
    });
    setIsConnected(true);

    // Simulate real-time updates
    const interval = setInterval(() => {
      // Add new activity
      const newActivity = generateSampleActivities(1)[0];
      setActivities(prev => [newActivity, ...prev.slice(0, 49)]);

      // Update stats randomly
      setStats(prev => ({
        activeUsers: Math.max(5, prev.activeUsers + Math.floor(Math.random() * 5) - 2),
        todayVisits: prev.todayVisits + Math.floor(Math.random() * 3),
        todayOrders: prev.todayOrders + (Math.random() > 0.8 ? 1 : 0),
        todayRevenue: prev.todayRevenue + (Math.random() > 0.8 ? Math.floor(Math.random() * 200) : 0),
      }));

      // Update live users
      if (Math.random() > 0.7) {
        setLiveUsers(prev => {
          const updated = [...prev];
          if (Math.random() > 0.5 && updated.length < 15) {
            updated.unshift(generateSampleUsers(1)[0]);
          } else if (updated.length > 3) {
            updated.pop();
          }
          return updated;
        });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const generateSampleActivities = (count) => {
    const types = [
      { type: 'page_view', icon: EyeIcon, color: 'bg-blue-500', messages: ['Viewing product: {product}', 'Browsing {page} page', 'Searching for "{query}"'] },
      { type: 'add_to_cart', icon: ShoppingCartIcon, color: 'bg-emerald-500', messages: ['Added {product} to cart', 'Updated cart quantity'] },
      { type: 'purchase', icon: CreditCardIcon, color: 'bg-purple-500', messages: ['Completed purchase - ${amount}', 'Order placed successfully'] },
      { type: 'login', icon: LoginIcon, color: 'bg-yellow-500', messages: ['User logged in', 'New session started'] },
      { type: 'wishlist', icon: HeartIcon, color: 'bg-pink-500', messages: ['Added {product} to wishlist'] },
    ];

    const products = ['Wireless Headphones', 'Smart Watch Pro', 'Denim Jacket', 'LED Desk Lamp', 'Running Sneakers'];
    const pages = ['Home', 'Products', 'Vendors', 'Electronics', 'Fashion'];
    const queries = ['headphones', 'watch', 'jacket', 'lamp', 'shoes'];
    const locations = ['New York, US', 'London, UK', 'Tokyo, JP', 'Sydney, AU', 'Toronto, CA', 'Berlin, DE', 'Paris, FR'];

    return Array.from({ length: count }, (_, i) => {
      const typeData = types[Math.floor(Math.random() * types.length)];
      let message = typeData.messages[Math.floor(Math.random() * typeData.messages.length)];

      message = message
        .replace('{product}', products[Math.floor(Math.random() * products.length)])
        .replace('{page}', pages[Math.floor(Math.random() * pages.length)])
        .replace('{query}', queries[Math.floor(Math.random() * queries.length)])
        .replace('{amount}', (Math.floor(Math.random() * 300) + 20).toFixed(2));

      return {
        id: Date.now() + i + Math.random(),
        ...typeData,
        message,
        user: `User ${Math.floor(Math.random() * 1000)}`,
        location: locations[Math.floor(Math.random() * locations.length)],
        timestamp: new Date(Date.now() - Math.random() * 300000),
      };
    });
  };

  const generateSampleUsers = (count) => {
    const pages = ['/products', '/products/wireless-headphones', '/checkout', '/vendors', '/', '/cart'];
    const devices = ['Desktop', 'Mobile', 'Tablet'];
    const browsers = ['Chrome', 'Safari', 'Firefox', 'Edge'];

    return Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i + Math.random(),
      sessionId: Math.random().toString(36).substr(2, 8),
      currentPage: pages[Math.floor(Math.random() * pages.length)],
      device: devices[Math.floor(Math.random() * devices.length)],
      browser: browsers[Math.floor(Math.random() * browsers.length)],
      duration: Math.floor(Math.random() * 600) + 30,
      pageViews: Math.floor(Math.random() * 10) + 1,
    }));
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return date.toLocaleTimeString();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-emerald-600">Live Activity</h1>
            <p className="text-gray-500 mt-1">Real-time user activity tracking</p>
          </div>
          <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-2 border border-gray-100 shadow-sm">
            <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-sm font-medium text-gray-600">{isConnected ? 'Live Connected' : 'Disconnected'}</span>
          </div>
        </div>

        {/* Live Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100 border-l-4 border-l-emerald-500">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <UsersIcon className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.activeUsers}</p>
                <p className="text-sm text-gray-500">Active Users</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100 border-l-4 border-l-blue-500">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <EyeIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.todayVisits.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Today's Visits</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100 border-l-4 border-l-purple-500">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <ShoppingCartIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.todayOrders}</p>
                <p className="text-sm text-gray-500">Today's Orders</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100 border-l-4 border-l-orange-500">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <CreditCardIcon className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">${stats.todayRevenue.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Today's Revenue</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Live Activity Feed */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">Live Activity Feed</h2>
                <div className="flex items-center gap-2">
                  <ActivityIcon className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm text-gray-500">{activities.length} events</span>
                </div>
              </div>
            </div>
            <div className="h-[500px] overflow-y-auto" ref={activityRef}>
              <div className="divide-y divide-gray-100">
                {activities.map((activity, index) => (
                  <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors animate-fadeIn">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 ${activity.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <activity.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">{activity.message}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-400">{activity.user}</span>
                          <span className="w-1 h-1 bg-gray-300 rounded-full" />
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <GlobeIcon className="w-3 h-3" />
                            {activity.location}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap bg-gray-100 px-2 py-1 rounded-lg">
                        {formatTime(activity.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Active Users */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">Active Users</h2>
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-100 text-emerald-700">
                  {liveUsers.length} online
                </span>
              </div>
            </div>
            <div className="h-[500px] overflow-y-auto">
              <div className="divide-y divide-gray-100">
                {liveUsers.map((user, index) => (
                  <div key={user.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-10 h-10 ${getAvatarColor(index)} rounded-full flex items-center justify-center`}>
                        <UserIcon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-800 truncate">{user.sessionId}</p>
                          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        </div>
                        <p className="text-xs text-gray-400">{user.device} • {user.browser}</p>
                      </div>
                    </div>
                    <div className="ml-13 pl-13">
                      <div className="bg-gray-50 rounded-lg px-3 py-2 ml-12">
                        <p className="text-xs text-gray-600 truncate">
                          <span className="font-medium">Page:</span> {user.currentPage}
                        </p>
                        <div className="flex gap-4 mt-1">
                          <span className="text-xs text-gray-500">
                            <span className="font-medium text-emerald-600">{user.pageViews}</span> pages
                          </span>
                          <span className="text-xs text-gray-500">
                            <span className="font-medium text-blue-600">{formatDuration(user.duration)}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Activity Legend */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-wrap items-center gap-6">
            <span className="text-sm font-medium text-gray-600">Activity Types:</span>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <span className="text-sm text-gray-500">Page View</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full" />
              <span className="text-sm text-gray-500">Add to Cart</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full" />
              <span className="text-sm text-gray-500">Purchase</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full" />
              <span className="text-sm text-gray-500">Login</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-pink-500 rounded-full" />
              <span className="text-sm text-gray-500">Wishlist</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default LiveActivity;
