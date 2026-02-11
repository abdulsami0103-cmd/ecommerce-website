import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const SecurityDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/security/dashboard');
      setDashboardData(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load security dashboard');
      toast.error('Failed to load security dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getAvatarColor = (index) => {
    const colors = [
      'bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-pink-500',
      'bg-orange-500', 'bg-teal-500', 'bg-indigo-500', 'bg-rose-500'
    ];
    return colors[index % colors.length];
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'bg-red-100 text-red-700',
      high: 'bg-orange-100 text-orange-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-green-100 text-green-700',
    };
    return colors[severity] || colors.low;
  };

  const getSeverityDot = (severity) => {
    const colors = {
      critical: 'bg-red-500',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
      low: 'bg-green-500',
    };
    return colors[severity] || colors.low;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  // Icons
  const ShieldAlertIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016zM12 9v2m0 4h.01" />
    </svg>
  );

  const ExclamationIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );

  const UsersIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );

  const ClipboardIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );

  const ActivityIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );

  const ChevronRightIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700">
          {error}
        </div>
      </div>
    );
  }

  const { alertSummary, recentAlerts, recentSessions, totalActiveSessions, loginStats } = dashboardData || {};

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-emerald-600">Security Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Monitor and manage security across your platform</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/admin/security/activity"
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <ActivityIcon />
            Activity Logs
          </Link>
          <Link
            to="/admin/security/sessions"
            className="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <UsersIcon />
            Sessions
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Critical Alerts */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Critical Alerts</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {alertSummary?.bySeverity?.critical || 0}
              </p>
              <p className="text-xs text-red-600 mt-1 font-medium">Requires immediate attention</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
              <ShieldAlertIcon />
            </div>
          </div>
        </div>

        {/* High Priority */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">High Priority</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {alertSummary?.bySeverity?.high || 0}
              </p>
              <p className="text-xs text-orange-600 mt-1 font-medium">Needs review soon</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
              <ExclamationIcon />
            </div>
          </div>
        </div>

        {/* Active Sessions */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border-l-4 border-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Active Sessions</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {totalActiveSessions || 0}
              </p>
              <p className="text-xs text-emerald-600 mt-1 font-medium">Currently online</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
              <UsersIcon />
            </div>
          </div>
        </div>

        {/* Unresolved Alerts */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Unresolved Alerts</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {alertSummary?.unresolvedCount || 0}
              </p>
              <p className="text-xs text-blue-600 mt-1 font-medium">Pending review</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
              <ClipboardIcon />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Recent Security Alerts */}
        <div className="bg-white rounded-2xl shadow-sm">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Recent Security Alerts</h2>
            <Link
              to="/admin/security/alerts"
              className="text-emerald-600 text-sm hover:text-emerald-700 font-medium flex items-center gap-1"
            >
              View All <ChevronRightIcon />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentAlerts && recentAlerts.length > 0 ? (
              recentAlerts.slice(0, 5).map((alert, index) => (
                <div key={alert._id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 ${getAvatarColor(index)} rounded-xl flex items-center justify-center text-white flex-shrink-0`}>
                      <ShieldAlertIcon />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-medium text-gray-900 text-sm">{alert.title}</h3>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{alert.description}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-lg font-medium flex-shrink-0 ${getSeverityColor(alert.severity)}`}>
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{formatTimeAgo(alert.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-emerald-600">
                  <ShieldAlertIcon />
                </div>
                <p className="text-gray-500 font-medium">No recent alerts</p>
                <p className="text-sm text-gray-400 mt-1">Your system is secure</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Active Sessions */}
        <div className="bg-white rounded-2xl shadow-sm">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Recent Active Sessions</h2>
            <Link
              to="/admin/security/sessions"
              className="text-emerald-600 text-sm hover:text-emerald-700 font-medium flex items-center gap-1"
            >
              View All <ChevronRightIcon />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentSessions && recentSessions.length > 0 ? (
              recentSessions.slice(0, 5).map((session, index) => (
                <div key={session._id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${getAvatarColor(index)} rounded-xl flex items-center justify-center text-white font-semibold`}>
                        {(session.userId?.email || 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {session.userId?.email || 'Unknown User'}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {session.browser} on {session.os}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 text-xs rounded-lg font-medium ${
                        session.userType === 'admin' ? 'bg-purple-100 text-purple-700' :
                        session.userType === 'vendor' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {session.userType}
                      </span>
                      <p className="text-xs text-gray-400 mt-1">
                        {session.ipAddress}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-emerald-600">
                  <UsersIcon />
                </div>
                <p className="text-gray-500 font-medium">No active sessions</p>
                <p className="text-sm text-gray-400 mt-1">All users are offline</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alert Types Distribution */}
      {alertSummary?.topTypes && alertSummary.topTypes.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm mb-6">
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Alert Types Distribution</h2>
          </div>
          <div className="p-5">
            <div className="space-y-4">
              {alertSummary.topTypes.map((type, index) => (
                <div key={type._id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{type._id}</span>
                    <span className="text-sm font-semibold text-gray-900">{type.count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getAvatarColor(index)}`}
                      style={{
                        width: `${(type.count / alertSummary.unresolvedCount) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/admin/security/alerts?isResolved=false&severity=critical"
            className="p-4 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-colors group"
          >
            <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform">
              <ShieldAlertIcon />
            </div>
            <h3 className="font-semibold text-red-700">Critical Alerts</h3>
            <p className="text-sm text-red-600 mt-1">
              {alertSummary?.bySeverity?.critical || 0} alerts need attention
            </p>
          </Link>

          <Link
            to="/admin/security/login-attempts?status=failed"
            className="p-4 bg-orange-50 border border-orange-100 rounded-xl hover:bg-orange-100 transition-colors group"
          >
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform">
              <ExclamationIcon />
            </div>
            <h3 className="font-semibold text-orange-700">Failed Logins</h3>
            <p className="text-sm text-orange-600 mt-1">
              View recent failed attempts
            </p>
          </Link>

          <Link
            to="/admin/security/sessions"
            className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl hover:bg-emerald-100 transition-colors group"
          >
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform">
              <UsersIcon />
            </div>
            <h3 className="font-semibold text-emerald-700">Active Sessions</h3>
            <p className="text-sm text-emerald-600 mt-1">
              {totalActiveSessions || 0} users online
            </p>
          </Link>

          <Link
            to="/admin/security/activity"
            className="p-4 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-colors group"
          >
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform">
              <ActivityIcon />
            </div>
            <h3 className="font-semibold text-blue-700">Activity Logs</h3>
            <p className="text-sm text-blue-600 mt-1">
              View all system activity
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SecurityDashboard;
