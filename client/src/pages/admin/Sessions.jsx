import { useState, useEffect } from 'react';
import api from '../../services/api';

const Sessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 });
  const [filters, setFilters] = useState({ userType: '' });
  const [terminatingId, setTerminatingId] = useState(null);

  useEffect(() => {
    fetchSessions();
  }, [pagination.page, filters]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
      });

      if (filters.userType) params.append('userType', filters.userType);

      const response = await api.get(`/admin/security/sessions?${params}`);
      setSessions(response.data.data);
      setPagination(prev => ({
        ...prev,
        ...response.data.pagination,
      }));
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const terminateSession = async (sessionId) => {
    if (!confirm('Are you sure you want to terminate this session?')) return;

    try {
      setTerminatingId(sessionId);
      await api.delete(`/admin/security/sessions/${sessionId}`);
      fetchSessions();
    } catch (error) {
      console.error('Failed to terminate session:', error);
      alert(error.response?.data?.message || 'Failed to terminate session');
    } finally {
      setTerminatingId(null);
    }
  };

  const getDeviceIcon = (deviceType) => {
    switch (deviceType) {
      case 'mobile':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      case 'tablet':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const getTimeSince = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-8">
      <div className="flex justify-between items-center mb-3 sm:mb-6">
        <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Active Sessions</h1>
        <div className="flex items-center gap-2">
          <select
            className="input px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm border border-gray-200 rounded-lg"
            value={filters.userType}
            onChange={(e) => {
              setFilters({ userType: e.target.value });
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
          >
            <option value="">All Types</option>
            <option value="admin">Admin</option>
            <option value="vendor">Vendor</option>
            <option value="customer">Customer</option>
          </select>
          <button onClick={fetchSessions} className="btn-secondary px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm">
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-3 sm:mb-6">
        <div className="card p-3 sm:p-4">
          <p className="text-[10px] sm:text-sm text-gray-500">Total Active</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900">{pagination.total}</p>
        </div>
        <div className="card p-3 sm:p-4">
          <p className="text-[10px] sm:text-sm text-gray-500">Admin</p>
          <p className="text-lg sm:text-2xl font-bold text-purple-600">
            {sessions.filter(s => s.userType === 'admin').length}
          </p>
        </div>
        <div className="card p-3 sm:p-4">
          <p className="text-[10px] sm:text-sm text-gray-500">Vendor</p>
          <p className="text-lg sm:text-2xl font-bold text-blue-600">
            {sessions.filter(s => s.userType === 'vendor').length}
          </p>
        </div>
      </div>

      {/* Sessions List */}
      <div className="card overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">User</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Device</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Location</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Started</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Last Active</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center">
                    <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No active sessions found
                  </td>
                </tr>
              ) : (
                sessions.map((session) => (
                  <tr key={session._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {session.userId?.email || 'Unknown'}
                          </p>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            session.userType === 'admin' ? 'bg-purple-100 text-purple-800' :
                            session.userType === 'vendor' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {session.userType}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">
                          {getDeviceIcon(session.deviceType)}
                        </span>
                        <div>
                          <p className="text-sm text-gray-900">{session.browser || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">{session.os || 'Unknown OS'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm text-gray-900 font-mono">{session.ipAddress}</p>
                        {session.location?.country && (
                          <p className="text-xs text-gray-500">
                            {session.location.city && `${session.location.city}, `}
                            {session.location.country}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(session.startedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span className="text-sm text-gray-600">
                          {getTimeSince(session.lastActiveAt)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => terminateSession(session._id)}
                        disabled={terminatingId === session._id}
                        className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
                      >
                        {terminatingId === session._id ? 'Terminating...' : 'Terminate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="sm:hidden">
          {/* Mobile Header */}
          <div className="grid grid-cols-12 gap-1 bg-gray-50 px-3 py-2">
            <span className="col-span-4 text-[9px] font-semibold text-gray-600 uppercase">User</span>
            <span className="col-span-3 text-[9px] font-semibold text-gray-600 uppercase">Device</span>
            <span className="col-span-3 text-[9px] font-semibold text-gray-600 uppercase">Location</span>
            <span className="col-span-2 text-[9px] font-semibold text-gray-600 uppercase text-right">Action</span>
          </div>
          {loading ? (
            <div className="py-6 text-center">
              <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-xs text-gray-500">No active sessions found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {sessions.map((session) => (
                <div key={session._id} className="grid grid-cols-12 gap-1 items-center px-3 py-2.5">
                  <div className="col-span-4 min-w-0">
                    <p className="text-[10px] font-medium text-gray-900 truncate">
                      {session.userId?.email || 'Unknown'}
                    </p>
                    <span className={`px-1 py-0.5 text-[8px] rounded-full ${
                      session.userType === 'admin' ? 'bg-purple-100 text-purple-800' :
                      session.userType === 'vendor' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {session.userType}
                    </span>
                  </div>
                  <div className="col-span-3 min-w-0">
                    <p className="text-[10px] text-gray-900 truncate">{session.browser || 'Unknown'}</p>
                    <p className="text-[9px] text-gray-500 truncate">{session.os || 'Unknown'}</p>
                  </div>
                  <div className="col-span-3 min-w-0">
                    <p className="text-[10px] text-gray-900 font-mono truncate">{session.ipAddress}</p>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full shrink-0"></span>
                      <span className="text-[9px] text-gray-500">{getTimeSince(session.lastActiveAt)}</span>
                    </div>
                  </div>
                  <div className="col-span-2 text-right">
                    <button
                      onClick={() => terminateSession(session._id)}
                      disabled={terminatingId === session._id}
                      className="text-red-600 text-[10px] font-medium disabled:opacity-50"
                    >
                      {terminatingId === session._id ? '...' : 'End'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-3 py-2 sm:px-4 sm:py-3 border-t border-gray-100 flex justify-between items-center">
            <span className="text-[10px] sm:text-sm text-gray-500">
              {sessions.length}/{pagination.total}
            </span>
            <div className="flex gap-1 sm:gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="btn-secondary px-2 py-1 sm:px-4 sm:py-2 text-[10px] sm:text-sm"
              >
                Prev
              </button>
              <span className="px-2 py-1 sm:px-4 sm:py-2 text-[10px] sm:text-sm text-gray-600">
                {pagination.page}/{pagination.pages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.pages}
                className="btn-secondary px-2 py-1 sm:px-4 sm:py-2 text-[10px] sm:text-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sessions;
