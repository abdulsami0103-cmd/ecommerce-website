import { useState, useEffect } from 'react';
import api from '../../services/api';

const SecurityAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [filters, setFilters] = useState({
    severity: '',
    alertType: '',
    isResolved: '',
  });
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [resolving, setResolving] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');

  useEffect(() => {
    fetchAlerts();
  }, [pagination.page, filters]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
      });

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '') params.append(key, value);
      });

      const response = await api.get(`/admin/security/alerts?${params}`);
      setAlerts(response.data.data);
      setPagination(prev => ({
        ...prev,
        ...response.data.pagination,
      }));
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const resolveAlert = async () => {
    if (!selectedAlert) return;

    try {
      setResolving(true);
      await api.put(`/admin/security/alerts/${selectedAlert._id}/resolve`, {
        resolutionNote,
      });
      setSelectedAlert(null);
      setResolutionNote('');
      fetchAlerts();
    } catch (error) {
      console.error('Failed to resolve alert:', error);
      alert(error.response?.data?.message || 'Failed to resolve alert');
    } finally {
      setResolving(false);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-green-100 text-green-800 border-green-200',
    };
    return colors[severity] || colors.low;
  };

  const getAlertTypeLabel = (type) => {
    const labels = {
      brute_force: 'Brute Force Attack',
      unusual_location: 'Unusual Location',
      bulk_price_change: 'Bulk Price Change',
      suspicious_payout: 'Suspicious Payout',
      permission_escalation: 'Permission Escalation',
      multiple_sessions: 'Multiple Sessions',
      failed_login_spike: 'Failed Login Spike',
    };
    return labels[type] || type;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-8">
      <div className="flex justify-between items-center mb-3 sm:mb-6">
        <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Security Alerts</h1>
        <button onClick={fetchAlerts} className="btn-secondary px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm">
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="card p-2.5 sm:p-4 mb-3 sm:mb-6">
        <div className="grid grid-cols-4 md:grid-cols-4 gap-1.5 sm:gap-4">
          <div>
            <label className="label text-[10px] sm:text-sm mb-0.5 sm:mb-1">Severity</label>
            <select
              className="input px-1.5 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-sm rounded-lg"
              value={filters.severity}
              onChange={(e) => handleFilterChange('severity', e.target.value)}
            >
              <option value="">All</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <label className="label text-[10px] sm:text-sm mb-0.5 sm:mb-1">Type</label>
            <select
              className="input px-1.5 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-sm rounded-lg"
              value={filters.alertType}
              onChange={(e) => handleFilterChange('alertType', e.target.value)}
            >
              <option value="">All</option>
              <option value="brute_force">Brute Force</option>
              <option value="unusual_location">Location</option>
              <option value="bulk_price_change">Price</option>
              <option value="suspicious_payout">Payout</option>
              <option value="permission_escalation">Permission</option>
              <option value="multiple_sessions">Sessions</option>
            </select>
          </div>

          <div>
            <label className="label text-[10px] sm:text-sm mb-0.5 sm:mb-1">Status</label>
            <select
              className="input px-1.5 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-sm rounded-lg"
              value={filters.isResolved}
              onChange={(e) => handleFilterChange('isResolved', e.target.value)}
            >
              <option value="">All</option>
              <option value="false">Open</option>
              <option value="true">Resolved</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setFilters({
                  severity: '',
                  alertType: '',
                  isResolved: '',
                });
              }}
              className="btn-secondary w-full px-1.5 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-sm rounded-lg"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="card overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Title</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Severity</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
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
              ) : alerts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No alerts found
                  </td>
                </tr>
              ) : (
                alerts.map((alert) => (
                  <tr key={alert._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {formatDate(alert.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {getAlertTypeLabel(alert.alertType)}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{alert.title}</p>
                      <p className="text-sm text-gray-500 truncate max-w-xs">
                        {alert.description}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full border ${getSeverityColor(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {alert.isResolved ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                          Resolved
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                          Unresolved
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedAlert(alert)}
                          className="text-primary-600 hover:text-primary-700 text-sm"
                        >
                          View
                        </button>
                        {!alert.isResolved && (
                          <button
                            onClick={() => setSelectedAlert(alert)}
                            className="text-green-600 hover:text-green-700 text-sm"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
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
            <span className="col-span-3 text-[9px] font-semibold text-gray-600 uppercase">Date</span>
            <span className="col-span-3 text-[9px] font-semibold text-gray-600 uppercase">Type</span>
            <span className="col-span-2 text-[9px] font-semibold text-gray-600 uppercase">Severity</span>
            <span className="col-span-2 text-[9px] font-semibold text-gray-600 uppercase">Status</span>
            <span className="col-span-2 text-[9px] font-semibold text-gray-600 uppercase text-right">Action</span>
          </div>
          {loading ? (
            <div className="py-6 text-center">
              <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
            </div>
          ) : alerts.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-xs text-gray-500">No alerts found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {alerts.map((alert) => (
                <div key={alert._id} className="grid grid-cols-12 gap-1 items-center px-3 py-2.5">
                  <div className="col-span-3 min-w-0">
                    <p className="text-[10px] text-gray-700">
                      {new Date(alert.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="col-span-3 min-w-0">
                    <span className="text-[9px] bg-gray-100 px-1 py-0.5 rounded text-gray-700 font-medium">
                      {getAlertTypeLabel(alert.alertType).split(' ')[0]}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className={`px-1 py-0.5 text-[9px] rounded-full border ${getSeverityColor(alert.severity)}`}>
                      {alert.severity}
                    </span>
                  </div>
                  <div className="col-span-2">
                    {alert.isResolved ? (
                      <span className="px-1 py-0.5 text-[9px] rounded-full bg-green-100 text-green-800">
                        Done
                      </span>
                    ) : (
                      <span className="px-1 py-0.5 text-[9px] rounded-full bg-red-100 text-red-800">
                        Open
                      </span>
                    )}
                  </div>
                  <div className="col-span-2 text-right">
                    <button
                      onClick={() => setSelectedAlert(alert)}
                      className="text-primary-600 text-[10px] font-medium"
                    >
                      View
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
              {alerts.length}/{pagination.total}
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

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Alert Details</h2>
              <button
                onClick={() => {
                  setSelectedAlert(null);
                  setResolutionNote('');
                }}
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
                  <p className="font-medium">{formatDate(selectedAlert.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Severity</label>
                  <p>
                    <span className={`px-2 py-1 text-xs rounded-full border ${getSeverityColor(selectedAlert.severity)}`}>
                      {selectedAlert.severity}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Alert Type</label>
                  <p className="font-medium">{getAlertTypeLabel(selectedAlert.alertType)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Status</label>
                  <p>
                    {selectedAlert.isResolved ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                        Resolved
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                        Unresolved
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-500">Title</label>
                <p className="font-medium">{selectedAlert.title}</p>
              </div>

              <div>
                <label className="text-sm text-gray-500">Description</label>
                <p className="text-gray-700">{selectedAlert.description}</p>
              </div>

              {selectedAlert.ipAddress && (
                <div>
                  <label className="text-sm text-gray-500">IP Address</label>
                  <p className="font-mono text-sm">{selectedAlert.ipAddress}</p>
                </div>
              )}

              {selectedAlert.details && Object.keys(selectedAlert.details).length > 0 && (
                <div>
                  <label className="text-sm text-gray-500">Details</label>
                  <pre className="mt-1 p-3 bg-gray-50 rounded-lg text-sm overflow-x-auto">
                    {JSON.stringify(selectedAlert.details, null, 2)}
                  </pre>
                </div>
              )}

              {selectedAlert.isResolved && (
                <>
                  <div className="border-t border-gray-200 pt-4">
                    <label className="text-sm text-gray-500">Resolved By</label>
                    <p className="font-medium">
                      {selectedAlert.resolvedBy?.email || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Resolved At</label>
                    <p className="font-medium">{formatDate(selectedAlert.resolvedAt)}</p>
                  </div>
                  {selectedAlert.resolutionNote && (
                    <div>
                      <label className="text-sm text-gray-500">Resolution Note</label>
                      <p className="text-gray-700">{selectedAlert.resolutionNote}</p>
                    </div>
                  )}
                </>
              )}

              {!selectedAlert.isResolved && (
                <div className="border-t border-gray-200 pt-4">
                  <label className="label">Resolution Note</label>
                  <textarea
                    className="input"
                    rows={3}
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    placeholder="Enter a note about how this was resolved..."
                  />
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={resolveAlert}
                      disabled={resolving}
                      className="btn-primary"
                    >
                      {resolving ? 'Resolving...' : 'Mark as Resolved'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityAlerts;
