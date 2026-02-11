import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

// Icons
const WarningIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const PackageIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const XCircleIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const StoreIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const SearchIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const RefreshIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const ChevronLeftIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const DownloadIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const getAvatarColor = (index) => {
  const colors = [
    'bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-pink-500',
    'bg-orange-500', 'bg-teal-500', 'bg-indigo-500', 'bg-rose-500'
  ];
  return colors[index % colors.length];
};

const AdminLowStockReport = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    summary: { totalLowStock: 0, totalOutOfStock: 0 },
    byVendor: [],
    products: [],
  });
  const [pagination, setPagination] = useState({ total: 0, pages: 1, page: 1 });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchReport();
  }, [pagination.page]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/inventory/low-stock-report?page=${pagination.page}&limit=50`);
      setData(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch report:', error);
      toast.error('Failed to load low stock report');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    const headers = ['Product', 'SKU', 'Vendor', 'Category', 'Stock', 'Threshold', 'Status'];
    const rows = filteredProducts.map(p => [
      p.name,
      p.inventory?.sku || '-',
      p.vendor?.storeName || '-',
      p.category?.name || '-',
      p.inventory?.quantity || 0,
      p.inventory?.lowStockThreshold || 10,
      p.inventory?.quantity <= 0 ? 'Out of Stock' : 'Low Stock'
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `low-stock-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Report exported successfully');
  };

  const filteredProducts = data.products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.inventory?.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.vendor?.storeName?.toLowerCase().includes(searchTerm.toLowerCase());

    const isOutOfStock = product.inventory?.quantity <= 0;
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'out' && isOutOfStock) ||
      (statusFilter === 'low' && !isOutOfStock);

    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalLowStock: data.summary.totalLowStock,
    totalOutOfStock: data.summary.totalOutOfStock,
    totalProducts: data.summary.totalLowStock + data.summary.totalOutOfStock,
    vendorsAffected: data.byVendor.length
  };

  if (loading && data.products.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-3 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-emerald-600">Low Stock Report</h1>
            <p className="text-gray-500 text-sm mt-0.5">Platform-wide inventory monitoring</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={fetchReport}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm"
            >
              <RefreshIcon className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={exportReport}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors text-sm"
            >
              <DownloadIcon className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-3 sm:p-4 border border-gray-100">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="w-9 h-9 sm:w-12 sm:h-12 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                <PackageIcon className="w-4 h-4 sm:w-6 sm:h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Total Products</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-800">{stats.totalProducts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-3 sm:p-4 border border-gray-100">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="w-9 h-9 sm:w-12 sm:h-12 bg-yellow-100 rounded-xl flex items-center justify-center shrink-0">
                <WarningIcon className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Low Stock</p>
                <p className="text-lg sm:text-2xl font-bold text-yellow-600">{stats.totalLowStock}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-3 sm:p-4 border border-gray-100">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="w-9 h-9 sm:w-12 sm:h-12 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                <XCircleIcon className="w-4 h-4 sm:w-6 sm:h-6 text-red-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Out of Stock</p>
                <p className="text-lg sm:text-2xl font-bold text-red-600">{stats.totalOutOfStock}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-3 sm:p-4 border border-gray-100">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="w-9 h-9 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                <StoreIcon className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Vendors Affected</p>
                <p className="text-lg sm:text-2xl font-bold text-blue-600">{stats.vendorsAffected}</p>
              </div>
            </div>
          </div>
        </div>

        {/* By Vendor Section */}
        {data.byVendor.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-4 sm:mb-8">
            <div className="p-3 sm:p-6 border-b border-gray-100">
              <h2 className="text-base sm:text-lg font-semibold text-gray-800">Stock Issues by Vendor</h2>
            </div>
            {/* Mobile Card View */}
            <div className="sm:hidden divide-y divide-gray-100">
              {data.byVendor.map((item, index) => (
                <div key={index} className="px-3 py-2.5 flex items-center gap-2.5">
                  <div className={`w-8 h-8 ${getAvatarColor(index)} rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0`}>
                    {(item.vendor?.storeName || 'U')[0].toUpperCase()}
                  </div>
                  <p className="font-medium text-gray-800 text-sm flex-1 truncate">{item.vendor?.storeName || 'Unknown'}</p>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                      {item.lowStock}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                      {item.outOfStock}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-emerald-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-emerald-700 uppercase tracking-wider">Vendor</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-emerald-700 uppercase tracking-wider">Low Stock</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-emerald-700 uppercase tracking-wider">Out of Stock</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-emerald-700 uppercase tracking-wider">Total Issues</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.byVendor.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 ${getAvatarColor(index)} rounded-full flex items-center justify-center text-white font-semibold`}>
                            {(item.vendor?.storeName || 'U')[0].toUpperCase()}
                          </div>
                          <p className="font-medium text-gray-800">{item.vendor?.storeName || 'Unknown Vendor'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700">
                          {item.lowStock}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
                          {item.outOfStock}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-semibold text-gray-800">{item.lowStock + item.outOfStock}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Products List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-3 sm:p-6 border-b border-gray-100">
            <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-0">All Low Stock Products</h2>
            <div className="flex items-center gap-2 sm:gap-3 sm:mt-3">
              <div className="relative flex-1">
                <SearchIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-64 pl-9 sm:pl-10 pr-3 py-1.5 sm:py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 sm:px-4 sm:py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shrink-0"
              >
                <option value="all">All Status</option>
                <option value="low">Low Stock</option>
                <option value="out">Out of Stock</option>
              </select>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <PackageIcon className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
              </div>
              <h3 className="text-base sm:text-lg font-medium text-gray-800 mb-1">No products found</h3>
              <p className="text-gray-500 text-sm">No low stock products match your search criteria</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="sm:hidden divide-y divide-gray-100">
                {filteredProducts.map((product, index) => (
                  <div key={product._id} className="px-3 py-2.5 flex items-center gap-2.5">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-9 h-9 object-cover rounded-lg shrink-0"
                      />
                    ) : (
                      <div className={`w-9 h-9 ${getAvatarColor(index)} rounded-lg flex items-center justify-center shrink-0`}>
                        <PackageIcon className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 text-sm truncate">{product.name}</p>
                      <p className="text-xs text-gray-500 truncate">{product.vendor?.storeName || '-'} &middot; {product.category?.name || '-'}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-sm font-bold ${product.inventory?.quantity <= 0 ? 'text-red-600' : 'text-yellow-600'}`}>
                        {product.inventory?.quantity || 0}
                      </span>
                      {product.inventory?.quantity <= 0 ? (
                        <XCircleIcon className="w-4 h-4 text-red-500" />
                      ) : (
                        <WarningIcon className="w-4 h-4 text-yellow-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-emerald-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-emerald-700 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-emerald-700 uppercase tracking-wider">Vendor</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-emerald-700 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-emerald-700 uppercase tracking-wider">Stock</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-emerald-700 uppercase tracking-wider">Threshold</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-emerald-700 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredProducts.map((product, index) => (
                      <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {product.images?.[0] ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-12 h-12 object-cover rounded-xl"
                              />
                            ) : (
                              <div className={`w-12 h-12 ${getAvatarColor(index)} rounded-xl flex items-center justify-center`}>
                                <PackageIcon className="w-6 h-6 text-white" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-800">{product.name}</p>
                              <p className="text-sm text-gray-500">SKU: {product.inventory?.sku || '-'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-600">{product.vendor?.storeName || '-'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700">
                            {product.category?.name || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-lg font-bold ${product.inventory?.quantity <= 0 ? 'text-red-600' : 'text-yellow-600'}`}>
                            {product.inventory?.quantity || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-gray-500">{product.inventory?.lowStockThreshold || 10}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {product.inventory?.quantity <= 0 ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                              Out of Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                              Low Stock
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing <span className="font-medium">{filteredProducts.length}</span> of <span className="font-medium">{pagination.total}</span> products
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                  Previous
                </button>
                <span className="px-4 py-2 text-sm text-gray-600">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page >= pagination.pages}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminLowStockReport;
