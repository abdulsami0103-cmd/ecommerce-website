import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api';

const SearchIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const EyeIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const ChevronDownIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const MoreIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
  </svg>
);

const TruckIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8m-8 4h5m-9 4h.01M3 21h18M3 10h18M3 7l3-4h12l3 4M4 10h16v11H4V10z" />
  </svg>
);

const AdminShipments = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(searchParams.get('status') || '');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetchShipments();
    fetchStats();
  }, [filter, page]);

  const fetchShipments = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (filter) params.status = filter;
      if (search) params.search = search;

      const response = await api.get('/admin/shipments', { params });
      setShipments(response.data.shipments || []);
      setPagination(response.data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (error) {
      console.error('Error fetching shipments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/shipments/stats');
      setStats(response.data || {});
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPage(1);
    if (newFilter) {
      setSearchParams({ status: newFilter });
    } else {
      setSearchParams({});
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchShipments();
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      pending: 'bg-amber-100 text-amber-700',
      label_created: 'bg-blue-100 text-blue-700',
      ready_for_pickup: 'bg-indigo-100 text-indigo-700',
      picked_up: 'bg-violet-100 text-violet-700',
      in_transit: 'bg-cyan-100 text-cyan-700',
      out_for_delivery: 'bg-teal-100 text-teal-700',
      delivered: 'bg-emerald-100 text-emerald-700',
      returned: 'bg-red-100 text-red-700',
      failed: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getAvatarColor = (index) => {
    const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-violet-500', 'bg-amber-500', 'bg-pink-500', 'bg-cyan-500'];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-emerald-600">Shipment Management</h1>
          <p className="text-sm text-gray-500 mt-1">{pagination.total || shipments.length} total shipments</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-amber-600">{stats.pending || 0}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Picked Up</p>
          <p className="text-2xl font-bold text-violet-600">{stats.picked_up || 0}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-sm text-gray-500">In Transit</p>
          <p className="text-2xl font-bold text-cyan-600">{stats.in_transit || 0}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Out for Delivery</p>
          <p className="text-2xl font-bold text-teal-600">{stats.out_for_delivery || 0}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Delivered</p>
          <p className="text-2xl font-bold text-emerald-600">{stats.delivered || 0}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Failed/Returned</p>
          <p className="text-2xl font-bold text-red-600">{(stats.failed || 0) + (stats.returned || 0)}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { value: '', label: 'All' },
          { value: 'pending', label: 'Pending' },
          { value: 'picked_up', label: 'Picked Up' },
          { value: 'in_transit', label: 'In Transit' },
          { value: 'out_for_delivery', label: 'Out for Delivery' },
          { value: 'delivered', label: 'Delivered' },
          { value: 'returned', label: 'Returned' },
          { value: 'failed', label: 'Failed' },
        ].map((status) => (
          <button
            key={status.value}
            onClick={() => handleFilterChange(status.value)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              filter === status.value
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status.label}
          </button>
        ))}
      </div>

      {/* Shipments Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* Table Header with Filters */}
        <div className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-900">All Shipments</h3>

          <div className="flex items-center gap-3">
            {/* Search */}
            <form onSubmit={handleSearch} className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-900" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 w-40 placeholder-gray-900 text-gray-900"
              />
            </form>

            {/* Rows per page */}
            <div className="relative">
              <select className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm text-gray-900">
                <option>10 Row</option>
                <option>20 Row</option>
                <option>50 Row</option>
              </select>
              <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-900 pointer-events-none" />
            </div>

            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <MoreIcon className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto" />
          </div>
        ) : shipments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No shipments found</div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="sm:hidden divide-y divide-gray-100">
              {shipments.map((shipment, index) => (
                <Link
                  key={shipment._id}
                  to={`/admin/shipments/${shipment._id}`}
                  className="block p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {shipment.courier?.trackingNumber || 'N/A'}
                      </p>
                      <p className="text-xs text-blue-500 mt-0.5">
                        {shipment.subOrder?.subOrderNumber}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadgeColor(shipment.status)}`}>
                      {shipment.status?.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Vendor</span>
                      <span className="text-gray-700">{shipment.vendor?.storeName}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Courier</span>
                      <span className="text-gray-700">{shipment.courier?.name || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Destination</span>
                      <span className="text-gray-700">{shipment.destination?.city || '-'}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-xs text-gray-400">
                      {new Date(shipment.createdAt).toLocaleDateString()}
                    </span>
                    <span className="text-xs text-blue-500">View Details →</span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-emerald-50">
                    <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Tracking</th>
                    <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Order</th>
                    <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Vendor</th>
                    <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Courier</th>
                    <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Destination</th>
                    <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Status</th>
                    <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Date</th>
                    <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {shipments.map((shipment, index) => (
                    <tr key={shipment._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">
                          {shipment.courier?.trackingNumber || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          to={`/admin/orders/${shipment.subOrder?.parentOrder}`}
                          className="text-sm text-blue-500 hover:underline"
                        >
                          {shipment.subOrder?.subOrderNumber}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full ${getAvatarColor(index)} flex items-center justify-center`}>
                            <span className="text-white text-xs font-medium">
                              {shipment.vendor?.storeName?.[0] || 'V'}
                            </span>
                          </div>
                          <span className="text-sm text-gray-900">{shipment.vendor?.storeName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {shipment.courier?.name}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">{shipment.destination?.name}</p>
                        <p className="text-xs text-gray-500">{shipment.destination?.city}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(shipment.status)}`}>
                          {shipment.status?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(shipment.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          to={`/admin/shipments/${shipment._id}`}
                          className="p-1 text-blue-500 hover:bg-blue-50 rounded transition-colors inline-block"
                          title="View Details"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination */}
        <div className="px-6 py-4 flex items-center justify-between border-t border-gray-100">
          <p className="text-sm text-emerald-600">
            Showing {shipments.length} of {pagination.total || shipments.length} Result
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button className="w-8 h-8 text-sm bg-emerald-500 text-white rounded-lg">
              {String(page).padStart(2, '0')}
            </button>
            <button
              disabled={page === pagination.pages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminShipments;
