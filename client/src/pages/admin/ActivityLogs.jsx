import { useState, useEffect } from 'react';
import api from '../../services/api';

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 });
  const [filters, setFilters] = useState({
    actorType: '',
    action: '',
    entityType: '',
    severity: '',
    startDate: '',
    endDate: '',
  });
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, [pagination.page, filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
      });

      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await api.get(`/admin/security/activity?${params}`);
      setLogs(response.data.data);
      setPagination(prev => ({
        ...prev,
        ...response.data.pagination,
      }));
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getSeverityBadge = (severity) => {
    const badges = {
      critical: 'badge-danger',
      high: 'badge-warning',
      medium: 'badge-info',
      low: 'badge-success',
    };
    return badges[severity] || 'badge-info';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const exportLogs = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      params.append('limit', 10000);

      const response = await api.get(`/admin/security/activity?${params}`);
      const data = response.data.data;

      // Convert to CSV
      const headers = ['Date', 'Actor Type', 'Action', 'Entity Type', 'Description', 'IP Address', 'Severity'];
      const csv = [
        headers.join(','),
        ...data.map(log => [
          formatDate(log.createdAt),
          log.actorType,
          log.action,
          log.entityType || '',
          `"${log.description?.replace(/"/g, '""') || ''}"`,
          log.ipAddress || '',
          log.severity,
        ].join(',')),
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } catch (error) {
      console.error('Failed to export logs:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Activity Logs</h1>
        <button onClick={exportLogs} className="btn-secondary">
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <label className="label">Actor Type</label>
            <select
              className="input"
              value={filters.actorType}
              onChange={(e) => handleFilterChange('actorType', e.target.value)}
            >
              <option value="">All Types</option>
              <option value="admin">Admin</option>
              <option value="vendor">Vendor</option>
              <option value="customer">Customer</option>
              <option value="system">System</option>
            </select>
          </div>

          <div>
            <label className="label">Entity Type</label>
            <select
              className="input"
              value={filters.entityType}
              onChange={(e) => handleFilterChange('entityType', e.target.value)}
            >
              <option value="">All Entities</option>
              <option value="User">User</option>
              <option value="Product">Product</option>
              <option value="Order">Order</option>
              <option value="Vendor">Vendor</option>
              <option value="Security">Security</option>
            </select>
          </div>

          <div>
            <label className="label">Severity</label>
            <select
              className="input"
              value={filters.severity}
              onChange={(e) => handleFilterChange('severity', e.target.value)}
            >
              <option value="">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <label className="label">Start Date</label>
            <input
              type="date"
              className="input"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>

          <div>
            <label className="label">End Date</label>
            <input
              type="date"
              className="input"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setFilters({
                  actorType: '',
                  action: '',
                  entityType: '',
                  severity: '',
                  startDate: '',
                  endDate: '',
                });
              }}
              className="btn-secondary w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actor</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Action</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Description</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">IP Address</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Severity</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center">
                    <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No activity logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        log.actorType === 'admin' ? 'bg-purple-100 text-purple-800' :
                        log.actorType === 'vendor' ? 'bg-blue-100 text-blue-800' :
                        log.actorType === 'customer' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {log.actorType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {log.action}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                      {log.description}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                      {log.ipAddress || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${getSeverityBadge(log.severity)}`}>
                        {log.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-primary-600 hover:text-primary-700 text-sm"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex justify-between items-center">
            <span className="text-sm text-gray-500">
              Showing {logs.length} of {pagination.total} logs
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="btn-secondary"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-gray-600">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.pages}
                className="btn-secondary"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Activity Log Details</h2>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Date & Time</label>
                  <p className="font-medium">{formatDate(selectedLog.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Actor Type</label>
                  <p className="font-medium">{selectedLog.actorType}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Action</label>
                  <p className="font-medium">{selectedLog.action}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Entity Type</label>
                  <p className="font-medium">{selectedLog.entityType || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">IP Address</label>
                  <p className="font-medium font-mono">{selectedLog.ipAddress || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Severity</label>
                  <span className={`badge ${getSeverityBadge(selectedLog.severity)}`}>
                    {selectedLog.severity}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-500">Description</label>
                <p className="font-medium">{selectedLog.description}</p>
              </div>

              {selectedLog.userAgent && (
                <div>
                  <label className="text-sm text-gray-500">User Agent</label>
                  <p className="text-sm text-gray-600 break-all">{selectedLog.userAgent}</p>
                </div>
              )}

              {selectedLog.oldValues && (
                <div>
                  <label className="text-sm text-gray-500">Previous Values</label>
                  <pre className="mt-1 p-3 bg-red-50 rounded-lg text-sm overflow-x-auto">
                    {JSON.stringify(selectedLog.oldValues, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.newValues && (
                <div>
                  <label className="text-sm text-gray-500">New Values</label>
                  <pre className="mt-1 p-3 bg-green-50 rounded-lg text-sm overflow-x-auto">
                    {JSON.stringify(selectedLog.newValues, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.metadata && (
                <div>
                  <label className="text-sm text-gray-500">Metadata</label>
                  <pre className="mt-1 p-3 bg-gray-50 rounded-lg text-sm overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityLogs;
