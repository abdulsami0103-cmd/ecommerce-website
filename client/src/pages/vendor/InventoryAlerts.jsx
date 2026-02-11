import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Button } from '../../components/common';

const WarningIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const CheckIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const VendorInventoryAlerts = () => {
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState({ status: 'active', type: '' });
  const [pagination, setPagination] = useState({ total: 0, pages: 1, page: 1 });

  useEffect(() => {
    fetchAlerts();
    fetchUnreadCount();
  }, [filter, pagination.page]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        status: filter.status,
        page: pagination.page,
        limit: 20,
      });
      if (filter.type) params.append('type', filter.type);

      const response = await api.get(`/vendors/inventory/alerts?${params}`);
      setAlerts(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      toast.error('Failed to load inventory alerts');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/vendors/inventory/alerts/count');
      setUnreadCount(response.data.data.count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const handleAcknowledge = async (alertId) => {
    try {
      await api.patch(`/vendors/inventory/alerts/${alertId}/acknowledge`);
      toast.success('Alert acknowledged');
      fetchAlerts();
      fetchUnreadCount();
    } catch (error) {
      toast.error('Failed to acknowledge alert');
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'out_of_stock':
        return <WarningIcon className="w-6 h-6 text-red-600" />;
      case 'low_stock':
        return <WarningIcon className="w-6 h-6 text-yellow-600" />;
      case 'back_in_stock':
        return <CheckIcon className="w-6 h-6 text-green-600" />;
      default:
        return <WarningIcon className="w-6 h-6 text-gray-600" />;
    }
  };

  const getAlertBadge = (type) => {
    switch (type) {
      case 'out_of_stock':
        return 'badge-danger';
      case 'low_stock':
        return 'badge-warning';
      case 'back_in_stock':
        return 'badge-success';
      default:
        return 'badge-secondary';
    }
  };

  const formatType = (type) => {
    return type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
  };

  if (loading && alerts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-emerald-600">Inventory Alerts</h1>
          <p className="text-gray-500">
            {unreadCount > 0 ? `${unreadCount} unread alerts` : 'No unread alerts'}
          </p>
        </div>
        <Link to="/vendor/inventory/low-stock">
          <Button variant="outline">View Low Stock</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="input w-40"
          >
            <option value="active">Active</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="all">All</option>
          </select>
          <select
            value={filter.type}
            onChange={(e) => setFilter({ ...filter, type: e.target.value })}
            className="input w-40"
          >
            <option value="">All Types</option>
            <option value="out_of_stock">Out of Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="back_in_stock">Back in Stock</option>
          </select>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {alerts.length === 0 ? (
          <div className="card p-8 text-center text-gray-500">
            No inventory alerts found
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert._id}
              className={`card p-4 ${alert.status === 'active' ? 'border-l-4 border-l-yellow-500' : ''}`}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  {getAlertIcon(alert.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`badge ${getAlertBadge(alert.type)}`}>
                          {formatType(alert.type)}
                        </span>
                        {alert.status === 'acknowledged' && (
                          <span className="badge badge-secondary">Acknowledged</span>
                        )}
                      </div>
                      <h3 className="font-medium mt-1">{alert.product?.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Current stock: <span className="font-medium">{alert.currentQuantity}</span>
                        {alert.type === 'low_stock' && (
                          <span> (Threshold: {alert.threshold})</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(alert.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {alert.status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAcknowledge(alert._id)}
                        >
                          Acknowledge
                        </Button>
                      )}
                      <Link to={`/vendor/products/${alert.product?._id}/edit`}>
                        <Button size="sm">Edit Product</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {alerts.length} of {pagination.total} alerts
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              disabled={pagination.page >= pagination.pages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorInventoryAlerts;
