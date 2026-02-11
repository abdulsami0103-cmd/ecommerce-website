import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { Loading } from '../../components/common';

const StatusBadge = ({ status }) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-teal-100 text-teal-800',
    processing: 'bg-emerald-100 text-emerald-800',
    shipped: 'bg-purple-100 text-purple-800',
    out_for_delivery: 'bg-teal-100 text-teal-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    returned: 'bg-gray-100 text-gray-800',
  };

  return (
    <span className={`px-1.5 py-0.5 sm:px-2 sm:py-1 text-[8px] sm:text-xs font-medium rounded-full ${colors[status] || 'bg-gray-100'}`}>
      {status?.replace(/_/g, ' ').toUpperCase()}
    </span>
  );
};

const SearchIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const FilterIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

const DownloadIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const SubOrders = () => {
  const { t } = useTranslation();
  const [subOrders, setSubOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  // Enhanced filters
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Bulk selection
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    fetchSubOrders();
    fetchStats();
  }, [filter, page, dateFrom, dateTo]);

  const fetchSubOrders = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 20 };
      if (filter) params.status = filter;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      if (searchQuery) params.search = searchQuery;

      const response = await api.get('/vendor/suborders', { params });
      setSubOrders(response.data.subOrders);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching sub-orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/vendor/suborders/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchSubOrders();
  };

  const handleStatusUpdate = async (subOrderId, newStatus) => {
    try {
      await api.put(`/vendor/suborders/${subOrderId}/status`, { status: newStatus });
      fetchSubOrders();
      fetchStats();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update status');
    }
  };

  // Bulk actions
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedOrders(subOrders.map(o => o._id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectOrder = (orderId) => {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleBulkAction = async (action) => {
    if (selectedOrders.length === 0) {
      alert('Please select at least one order');
      return;
    }

    const statusMap = {
      confirm: 'confirmed',
      process: 'processing',
    };

    if (!statusMap[action]) return;

    setBulkLoading(true);
    try {
      await Promise.all(
        selectedOrders.map(orderId =>
          api.put(`/vendor/suborders/${orderId}/status`, { status: statusMap[action] })
        )
      );
      setSelectedOrders([]);
      fetchSubOrders();
      fetchStats();
    } catch (error) {
      alert('Some updates failed. Please try again.');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Order Number', 'Customer', 'Email', 'Items', 'Total', 'Status', 'Date'];
    const rows = subOrders.map(order => [
      order.subOrderNumber,
      `${order.customer?.profile?.firstName || ''} ${order.customer?.profile?.lastName || ''}`,
      order.customer?.email || '',
      order.items?.length || 0,
      order.total || 0,
      order.status,
      new Date(order.createdAt).toLocaleDateString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
    setFilter('');
    setPage(1);
  };

  const statCards = [
    { label: 'Pending', value: stats.byStatus?.pending?.count || 0, status: 'pending', color: 'bg-yellow-500' },
    { label: 'Processing', value: stats.byStatus?.processing?.count || 0, status: 'processing', color: 'bg-emerald-500' },
    { label: 'Shipped', value: stats.byStatus?.shipped?.count || 0, status: 'shipped', color: 'bg-purple-500' },
    { label: 'Delivered', value: stats.byStatus?.delivered?.count || 0, status: 'delivered', color: 'bg-green-500' },
  ];

  const hasActiveFilters = searchQuery || dateFrom || dateTo || filter;

  if (loading && subOrders.length === 0) return <Loading />;

  return (
    <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-8">
      <div className="mb-3 sm:mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-emerald-600">Sub-Orders</h1>
          <p className="text-[10px] sm:text-base text-gray-500">Manage orders from your customers</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center px-2 py-1.5 sm:px-4 sm:py-2 border-2 border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 font-medium transition-colors text-xs sm:text-sm"
        >
          <DownloadIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
          <span className="hidden sm:inline">Export CSV</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-4 mb-3 sm:mb-8">
        {statCards.map((stat) => (
          <button
            key={stat.status}
            onClick={() => { setFilter(filter === stat.status ? '' : stat.status); setPage(1); }}
            className={`bg-white rounded-xl sm:rounded-2xl shadow-sm p-2 sm:p-4 text-left hover:shadow-md transition ${
              filter === stat.status ? 'ring-2 ring-emerald-500' : ''
            }`}
          >
            <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${stat.color} mb-1 sm:mb-2`} />
            <p className="text-[9px] sm:text-sm text-gray-500">{stat.label}</p>
            <p className="text-sm sm:text-2xl font-bold">{stat.value}</p>
          </button>
        ))}
      </div>

      {/* Today's Summary */}
      {stats.today && (
        <div className="rounded-xl sm:rounded-2xl shadow-sm p-2.5 sm:p-4 mb-3 sm:mb-8 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
          <h3 className="text-xs sm:text-lg font-semibold mb-1 sm:mb-2">Today's Summary</h3>
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <div>
              <p className="text-[10px] sm:text-sm opacity-80">Orders</p>
              <p className="text-sm sm:text-2xl font-bold">{stats.today.orders}</p>
            </div>
            <div>
              <p className="text-[10px] sm:text-sm opacity-80">Revenue</p>
              <p className="text-sm sm:text-2xl font-bold">Rs. {stats.today.revenue?.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-2.5 sm:p-4 mb-3 sm:mb-6">
        <form onSubmit={handleSearch} className="flex gap-1.5 sm:gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <svg className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search orders..."
              className="w-full pl-7 sm:pl-10 pr-2 sm:pr-4 py-1.5 sm:py-2 border rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            className="px-2 py-1.5 sm:px-4 sm:py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors text-[10px] sm:text-sm"
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-1 px-2 py-1.5 sm:px-4 sm:py-2 border border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 font-medium transition-colors text-[10px] sm:text-sm"
          >
            <FilterIcon className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && (
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full" />
            )}
          </button>
        </form>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-2 sm:mt-4 pt-2 sm:pt-4 border-t grid grid-cols-3 gap-1.5 sm:gap-4">
            <div>
              <label className="block text-[9px] sm:text-sm font-medium text-gray-700 mb-0.5 sm:mb-1">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-1.5 py-1 sm:px-3 sm:py-2 border rounded-lg text-[10px] sm:text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[9px] sm:text-sm font-medium text-gray-700 mb-0.5 sm:mb-1">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-1.5 py-1 sm:px-3 sm:py-2 border rounded-lg text-[10px] sm:text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={clearFilters}
                className="text-[10px] sm:text-sm text-emerald-600 hover:text-emerald-700"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 sm:gap-2 mb-3 sm:mb-6 overflow-x-auto pb-1 sm:pb-2">
        {['', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => { setFilter(status); setPage(1); }}
            className={`px-2 py-1 sm:px-4 sm:py-2 rounded-lg whitespace-nowrap font-medium transition-colors text-[10px] sm:text-sm ${
              filter === status
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status || 'All'}
          </button>
        ))}
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedOrders.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl sm:rounded-2xl p-2 sm:p-4 mb-2 sm:mb-4 flex items-center justify-between">
          <span className="text-[10px] sm:text-sm font-medium text-emerald-700">
            {selectedOrders.length} selected
          </span>
          <div className="flex gap-1 sm:gap-2">
            <button
              onClick={() => handleBulkAction('confirm')}
              disabled={bulkLoading}
              className="px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors disabled:opacity-50"
            >
              Confirm
            </button>
            <button
              onClick={() => handleBulkAction('process')}
              disabled={bulkLoading}
              className="px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-sm border border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 font-medium transition-colors disabled:opacity-50"
            >
              Process
            </button>
            <button
              onClick={() => setSelectedOrders([])}
              className="px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-sm text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm overflow-hidden">
        {subOrders.length === 0 ? (
          <div className="p-4 sm:p-8 text-center text-xs sm:text-base text-gray-500">
            No sub-orders found
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-emerald-50">
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedOrders.length === subOrders.length && subOrders.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Order</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Items</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Date</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-emerald-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {subOrders.map((order) => (
                    <tr key={order._id} className={`hover:bg-gray-50 ${selectedOrders.includes(order._id) ? 'bg-emerald-50' : ''}`}>
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(order._id)}
                          onChange={() => handleSelectOrder(order._id)}
                          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <Link to={`/vendor/orders/${order._id}`} className="font-medium text-emerald-600 hover:underline">
                          {order.subOrderNumber}
                        </Link>
                        <p className="text-xs text-gray-400">{order.parentOrder?.orderNumber}</p>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <p>{order.customer?.profile?.firstName} {order.customer?.profile?.lastName}</p>
                        <p className="text-xs text-gray-400">{order.customer?.email}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p>{order.items?.length} item(s)</p>
                        <p className="text-xs text-gray-400 truncate max-w-[150px]">
                          {order.items?.map(i => i.name).join(', ')}
                        </p>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap font-medium">
                        Rs. {order.total?.toLocaleString()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-gray-500 text-sm">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right">
                        <div className="flex gap-2 justify-end">
                          {order.status === 'pending' && (
                            <button
                              onClick={() => handleStatusUpdate(order._id, 'confirmed')}
                              className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors"
                            >
                              Confirm
                            </button>
                          )}
                          {order.status === 'confirmed' && (
                            <button
                              onClick={() => handleStatusUpdate(order._id, 'processing')}
                              className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors"
                            >
                              Process
                            </button>
                          )}
                          {order.status === 'processing' && (
                            <Link to={`/vendor/orders/${order._id}`}>
                              <button className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors">
                                Ship
                              </button>
                            </Link>
                          )}
                          <Link to={`/vendor/orders/${order._id}`}>
                            <button className="px-3 py-1.5 text-sm border-2 border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 font-medium transition-colors">
                              View
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="sm:hidden">
              {/* Mobile Header */}
              <div className="grid grid-cols-12 gap-1.5 bg-emerald-50 px-2.5 py-1.5 items-center">
                <div className="col-span-1">
                  <input
                    type="checkbox"
                    checked={selectedOrders.length === subOrders.length && subOrders.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-3 h-3"
                  />
                </div>
                <span className="col-span-3 text-[9px] font-semibold text-emerald-700 uppercase">Order</span>
                <span className="col-span-2 text-[9px] font-semibold text-emerald-700 uppercase">Customer</span>
                <span className="col-span-3 text-[9px] font-semibold text-emerald-700 uppercase text-right">Total</span>
                <span className="col-span-3 text-[9px] font-semibold text-emerald-700 uppercase text-right">Action</span>
              </div>
              {/* Mobile Rows */}
              <div className="divide-y divide-gray-100">
                {subOrders.map((order) => (
                  <div key={order._id} className={`grid grid-cols-12 gap-1.5 items-center px-2.5 py-2 ${selectedOrders.includes(order._id) ? 'bg-emerald-50' : ''}`}>
                    <div className="col-span-1">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order._id)}
                        onChange={() => handleSelectOrder(order._id)}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-3 h-3"
                      />
                    </div>
                    <div className="col-span-3 min-w-0">
                      <Link to={`/vendor/orders/${order._id}`} className="text-[10px] font-medium text-emerald-600 truncate block">
                        {order.subOrderNumber?.split('-').slice(-2).join('-')}
                      </Link>
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="col-span-2 min-w-0">
                      <p className="text-[10px] text-gray-900 truncate">{order.customer?.profile?.firstName} {order.customer?.profile?.lastName?.[0]}.</p>
                      <p className="text-[8px] text-gray-400">{order.items?.length} item(s)</p>
                    </div>
                    <div className="col-span-3 text-right pr-1">
                      <span className="text-[10px] font-semibold text-gray-900">
                        {order.total >= 1000000
                          ? `Rs.${(order.total / 1000000).toFixed(1)}M`
                          : order.total >= 1000
                          ? `Rs.${(order.total / 1000).toFixed(0)}K`
                          : `Rs.${order.total}`}
                      </span>
                    </div>
                    <div className="col-span-3 flex items-center justify-end gap-1">
                      {order.status === 'pending' && (
                        <button
                          onClick={() => handleStatusUpdate(order._id, 'confirmed')}
                          className="px-1.5 py-0.5 text-[8px] bg-emerald-600 text-white rounded font-medium"
                        >
                          Confirm
                        </button>
                      )}
                      {order.status === 'confirmed' && (
                        <button
                          onClick={() => handleStatusUpdate(order._id, 'processing')}
                          className="px-1.5 py-0.5 text-[8px] bg-emerald-600 text-white rounded font-medium"
                        >
                          Process
                        </button>
                      )}
                      {order.status === 'processing' && (
                        <Link to={`/vendor/orders/${order._id}`} className="px-1.5 py-0.5 text-[8px] bg-emerald-600 text-white rounded font-medium">
                          Ship
                        </Link>
                      )}
                      <Link to={`/vendor/orders/${order._id}`} className="px-1.5 py-0.5 text-[8px] border border-emerald-600 text-emerald-600 rounded font-medium">
                        View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-2.5 py-2 sm:px-4 sm:py-3 border-t flex items-center justify-between">
            <p className="text-[10px] sm:text-sm text-gray-500">
              {page}/{pagination.pages}
            </p>
            <div className="flex gap-1 sm:gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-sm border border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Prev
              </button>
              <button
                disabled={page === pagination.pages}
                onClick={() => setPage(page + 1)}
                className="px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-sm border border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

export default SubOrders;
