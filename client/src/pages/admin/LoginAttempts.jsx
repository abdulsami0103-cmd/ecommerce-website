import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

import { Loading, Button } from '../../components/common';

// Icons
const BackIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const CheckCircleIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XCircleIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const RefreshIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const statusConfig = {
  success: {
    label: 'Success',
    className: 'bg-green-100 text-green-800',
    icon: CheckCircleIcon,
  },
  failed: {
    label: 'Failed',
    className: 'bg-red-100 text-red-800',
    icon: XCircleIcon,
  },
  blocked: {
    label: 'Blocked',
    className: 'bg-orange-100 text-orange-800',
    icon: XCircleIcon,
  },
};

const LoginAttempts = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [stats, setStats] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    email: searchParams.get('email') || '',
    ipAddress: searchParams.get('ip') || '',
  });

  useEffect(() => {
    fetchAttempts();
    fetchStats();
  }, [searchParams]);

  const fetchAttempts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();

      const status = searchParams.get('status');
      const email = searchParams.get('email');
      const ip = searchParams.get('ip');
      const page = searchParams.get('page') || '1';

      if (status) params.append('status', status);
      if (email) params.append('email', email);
      if (ip) params.append('ipAddress', ip);
      params.append('page', page);
      params.append('limit', '20');

      const response = await fetch(`/api/admin/security/login-attempts?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        setAttempts(data.data || []);
        setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
      } else {
        toast.error(data.message || 'Failed to fetch login attempts');
      }
    } catch (error) {
      toast.error('Failed to fetch login attempts');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/security/login-attempts/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.email) params.set('email', filters.email);
    if (filters.ipAddress) params.set('ip', filters.ipAddress);
    setSearchParams(params);
  };

  const clearFilters = () => {
    setFilters({ status: '', email: '', ipAddress: '' });
    setSearchParams({});
  };

  const goToPage = (page) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    setSearchParams(params);
  };

  if (loading && attempts.length === 0) return <Loading />;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to="/admin/security" className="p-2 hover:bg-gray-100 rounded-lg">
            <BackIcon className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Login Attempts</h1>
            <p className="text-gray-600">Monitor authentication activity</p>
          </div>
        </div>
        <Button variant="outline" onClick={fetchAttempts}>
          <RefreshIcon className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="card p-4">
            <div className="text-2xl font-bold">{stats.totalAttempts || 0}</div>
            <div className="text-sm text-gray-600">Total Attempts (30 days)</div>
          </div>
          <div className="card p-4">
            <div className="text-2xl font-bold text-green-600">{stats.successfulAttempts || 0}</div>
            <div className="text-sm text-gray-600">Successful</div>
          </div>
          <div className="card p-4">
            <div className="text-2xl font-bold text-red-600">{stats.failedAttempts || 0}</div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>
          <div className="card p-4">
            <div className="text-2xl font-bold text-orange-600">{stats.blockedAttempts || 0}</div>
            <div className="text-sm text-gray-600">Blocked</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="text"
              value={filters.email}
              onChange={(e) => handleFilterChange('email', e.target.value)}
              placeholder="Filter by email..."
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">IP Address</label>
            <input
              type="text"
              value={filters.ipAddress}
              onChange={(e) => handleFilterChange('ipAddress', e.target.value)}
              placeholder="Filter by IP..."
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={applyFilters}>Apply</Button>
            <Button variant="outline" onClick={clearFilters}>Clear</Button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Time</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Email</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">IP Address</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Reason</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">User Agent</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {attempts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                    No login attempts found
                  </td>
                </tr>
              ) : (
                attempts.map((attempt) => {
                  const config = statusConfig[attempt.status] || statusConfig.failed;
                  const StatusIcon = config.icon;
                  return (
                    <tr key={attempt._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        {formatDate(attempt.attemptedAt || attempt.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {attempt.email || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono">
                        {attempt.ipAddress || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
                          <StatusIcon className="w-3 h-3" />
                          {config.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {attempt.failureReason || attempt.reason || '-'}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">
                        {attempt.userAgent || '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-4 py-3 border-t flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing page {pagination.page} of {pagination.pages} ({pagination.total} total)
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginAttempts;
