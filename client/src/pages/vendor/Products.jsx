import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

import productService from '../../services/productService';
import { Loading, Button, Modal } from '../../components/common';
import BulkEditor from './BulkEditor';

// Inline SVG Icons
const PlusIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);
const EyeIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);
const PencilIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);
const TrashIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);
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

const VendorProducts = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [deleteModal, setDeleteModal] = useState({ open: false, product: null });

  // Selection state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkEditorOpen, setBulkEditorOpen] = useState(false);

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    type: '',
    category: '',
    lowStock: false,
  });
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [pagination.page, filters]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        ...(filters.search && { search: filters.search }),
        ...(filters.status && { status: filters.status }),
        ...(filters.type && { type: filters.type }),
        ...(filters.category && { category: filters.category }),
        ...(filters.lowStock && { lowStock: true }),
      };
      const response = await productService.getMyProducts(params);
      setProducts(response.data);
      setPagination(response.pagination);
    } catch (error) {
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await productService.getCategories();
      setCategories(data || []);
    } catch (error) {
      console.error('Failed to fetch categories');
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.product) return;
    try {
      await productService.deleteProduct(deleteModal.product._id);
      toast.success('Product deleted');
      setDeleteModal({ open: false, product: null });
      fetchProducts();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const getStatusBadge = (status) => {
    const badges = { draft: 'badge-warning', active: 'badge-success', inactive: 'badge-danger' };
    return badges[status] || 'badge-info';
  };

  // Selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(new Set(products.map(p => p._id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (productId) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const isAllSelected = products.length > 0 && selectedIds.size === products.length;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < products.length;

  const selectedProducts = useMemo(() => {
    return products.filter(p => selectedIds.has(p._id));
  }, [products, selectedIds]);

  // Filter handlers
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      type: '',
      category: '',
      lowStock: false,
    });
  };

  const activeFilterCount = [
    filters.search,
    filters.status,
    filters.type,
    filters.category,
    filters.lowStock,
  ].filter(Boolean).length;

  // Export CSV
  const handleExportCSV = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/vendors/products/export', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Export started');
    } catch (error) {
      toast.error('Export failed');
    }
  };

  if (loading && products.length === 0) return <Loading />;

  return (
    <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-6">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-emerald-600">{t('vendor.products')}</h1>
          <p className="text-[10px] sm:text-sm text-gray-500">
            {pagination.total || products.length} product{(pagination.total || products.length) !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-3">
          <button onClick={handleExportCSV} className="flex items-center gap-1 px-2 py-1.5 sm:px-3 sm:py-2 border border-gray-300 rounded-lg text-[10px] sm:text-sm text-gray-700 hover:bg-gray-50">
            <DownloadIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <Link to="/vendor/products/new" className="flex items-center gap-1 px-2 py-1.5 sm:px-3 sm:py-2 bg-emerald-500 text-white rounded-lg text-[10px] sm:text-sm hover:bg-emerald-600">
            <PlusIcon className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            <span className="sm:hidden">Add</span>
            <span className="hidden sm:inline">{t('vendor.addProduct')}</span>
          </Link>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="bg-white rounded-2xl shadow-sm p-2.5 sm:p-4 mb-3 sm:mb-6">
        <div className="flex gap-2 sm:gap-4 items-center">
          {/* Search */}
          <div className="relative flex-1">
            <svg className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search products..."
              className="w-full pl-8 sm:pl-10 pr-3 py-1.5 sm:py-2 border rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Filter toggle */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1 sm:gap-2 px-2 py-1.5 sm:px-4 sm:py-2 border rounded-lg transition-colors text-xs sm:text-sm ${showFilters || activeFilterCount > 0 ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'hover:bg-gray-50'}`}
          >
            <FilterIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="bg-emerald-500 text-white text-[9px] sm:text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-2 sm:mt-4 pt-2 sm:pt-4 border-t grid grid-cols-4 gap-1.5 sm:gap-4">
            <div>
              <label className="block text-[9px] sm:text-sm font-medium text-gray-700 mb-0.5 sm:mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-1.5 py-1 sm:px-3 sm:py-2 border rounded-lg text-[10px] sm:text-sm"
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-[9px] sm:text-sm font-medium text-gray-700 mb-0.5 sm:mb-1">Type</label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-1.5 py-1 sm:px-3 sm:py-2 border rounded-lg text-[10px] sm:text-sm"
              >
                <option value="">All</option>
                <option value="physical">Physical</option>
                <option value="digital">Digital</option>
              </select>
            </div>

            <div>
              <label className="block text-[9px] sm:text-sm font-medium text-gray-700 mb-0.5 sm:mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-1.5 py-1 sm:px-3 sm:py-2 border rounded-lg text-[10px] sm:text-sm"
              >
                <option value="">All</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label className="block text-[9px] sm:text-sm font-medium text-gray-700 mb-0.5 sm:mb-1">Stock</label>
              <label className="flex items-center gap-1 sm:gap-2 cursor-pointer mt-auto">
                <input
                  type="checkbox"
                  checked={filters.lowStock}
                  onChange={(e) => handleFilterChange('lowStock', e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-3 h-3 sm:w-4 sm:h-4"
                />
                <span className="text-[9px] sm:text-sm">Low</span>
              </label>
            </div>

            {activeFilterCount > 0 && (
              <div className="col-span-full">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-[10px] sm:text-sm text-emerald-600 hover:text-emerald-700"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedIds.size > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-2.5 sm:p-4 mb-3 sm:mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-[10px] sm:text-sm font-medium text-emerald-800">
              {selectedIds.size} selected
            </span>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-[10px] sm:text-sm text-emerald-600 hover:text-emerald-700"
            >
              Clear
            </button>
          </div>
          <button
            type="button"
            onClick={() => setBulkEditorOpen(true)}
            className="px-2 py-1 sm:px-3 sm:py-1.5 border border-gray-300 rounded-lg text-[10px] sm:text-sm hover:bg-gray-50"
          >
            Bulk Edit
          </button>
        </div>
      )}

      {products.length === 0 && !loading ? (
        <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-8 text-center">
          <p className="text-xs sm:text-base text-gray-500 mb-4">
            {activeFilterCount > 0
              ? 'No products match your filters.'
              : "You don't have any products yet."
            }
          </p>
          {activeFilterCount > 0 ? (
            <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
          ) : (
            <Link to="/vendor/products/new"><Button>{t('vendor.addProduct')}</Button></Link>
          )}
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-emerald-50">
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        ref={el => {
                          if (el) el.indeterminate = isSomeSelected;
                        }}
                        onChange={handleSelectAll}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-emerald-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {products.map((product) => {
                    const isLowStock = product.type !== 'digital' &&
                      product.inventory?.quantity <= (product.inventory?.lowStockThreshold || 10);

                    return (
                      <tr key={product._id} className={`hover:bg-gray-50 ${selectedIds.has(product._id) ? 'bg-emerald-50' : ''}`}>
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(product._id)}
                            onChange={() => handleSelectOne(product._id)}
                            className="rounded text-emerald-600 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <img
                              src={product.images?.[0]?.url || product.images?.[0] || 'https://placehold.co/50'}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                            <div>
                              <p className="font-medium line-clamp-1">{product.name}</p>
                              <p className="text-sm text-gray-500">SKU: {product.inventory?.sku || 'N/A'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="capitalize">{product.type}</span>
                          {product.hasVariants && (
                            <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                              Variants
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">PKR {product.price.amount.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          {product.type === 'digital' ? (
                            <span className="text-gray-400">N/A</span>
                          ) : (
                            <span className={isLowStock ? 'text-red-600 font-medium' : ''}>
                              {product.inventory?.quantity || 0}
                              {isLowStock && (
                                <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">
                                  Low
                                </span>
                              )}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`badge ${getStatusBadge(product.status)}`}>{product.status}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link to={`/products/${product.slug}`} className="p-2 text-gray-500 hover:text-gray-700" title="View">
                              <EyeIcon className="w-5 h-5" />
                            </Link>
                            <Link to={`/vendor/products/${product._id}/edit`} className="p-2 text-primary-600 hover:text-primary-700" title="Edit">
                              <PencilIcon className="w-5 h-5" />
                            </Link>
                            <button onClick={() => setDeleteModal({ open: true, product })} className="p-2 text-red-600 hover:text-red-700" title="Delete">
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="sm:hidden">
              {/* Mobile Header */}
              <div className="grid grid-cols-12 gap-1 bg-emerald-50 px-2.5 py-1.5 items-center">
                <div className="col-span-1">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={el => {
                      if (el) el.indeterminate = isSomeSelected;
                    }}
                    onChange={handleSelectAll}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-3 h-3"
                  />
                </div>
                <span className="col-span-4 text-[9px] font-semibold text-emerald-700 uppercase">Product</span>
                <span className="col-span-2 text-[9px] font-semibold text-emerald-700 uppercase text-right">Price</span>
                <span className="col-span-2 text-[9px] font-semibold text-emerald-700 uppercase text-right">Stock</span>
                <span className="col-span-3 text-[9px] font-semibold text-emerald-700 uppercase text-right">Actions</span>
              </div>
              {/* Mobile Rows */}
              <div className="divide-y divide-gray-100">
                {products.map((product) => {
                  const isLowStock = product.type !== 'digital' &&
                    product.inventory?.quantity <= (product.inventory?.lowStockThreshold || 10);

                  return (
                    <div key={product._id} className={`grid grid-cols-12 gap-1 items-center px-2.5 py-2 ${selectedIds.has(product._id) ? 'bg-emerald-50' : ''}`}>
                      <div className="col-span-1">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(product._id)}
                          onChange={() => handleSelectOne(product._id)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 w-3 h-3"
                        />
                      </div>
                      <div className="col-span-4 flex items-center gap-1.5 min-w-0">
                        <img
                          src={product.images?.[0]?.url || product.images?.[0] || 'https://placehold.co/50'}
                          alt={product.name}
                          className="w-7 h-7 object-cover rounded shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-[10px] font-medium text-gray-900 truncate">{product.name}</p>
                          <div className="flex items-center gap-1">
                            <span className={`text-[8px] px-1 py-0.5 rounded capitalize ${
                              product.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                              product.status === 'draft' ? 'bg-amber-100 text-amber-700' :
                              'bg-red-100 text-red-700'
                            }`}>{product.status}</span>
                            <span className="text-[8px] text-gray-400 capitalize">{product.type}</span>
                          </div>
                        </div>
                      </div>
                      <div className="col-span-2 text-right">
                        <span className="text-[10px] font-semibold text-gray-900">Rs {product.price.amount.toLocaleString()}</span>
                      </div>
                      <div className="col-span-2 text-right">
                        {product.type === 'digital' ? (
                          <span className="text-[10px] text-gray-400">N/A</span>
                        ) : (
                          <span className={`text-[10px] font-semibold ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                            {product.inventory?.quantity || 0}
                          </span>
                        )}
                      </div>
                      <div className="col-span-3 flex items-center justify-end gap-0.5">
                        <Link to={`/products/${product.slug}`} className="p-1 text-gray-400">
                          <EyeIcon className="w-3.5 h-3.5" />
                        </Link>
                        <Link to={`/vendor/products/${product._id}/edit`} className="p-1 text-emerald-600">
                          <PencilIcon className="w-3.5 h-3.5" />
                        </Link>
                        <button onClick={() => setDeleteModal({ open: true, product })} className="p-1 text-red-500">
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {pagination.pages > 1 && (
            <div className="flex justify-center mt-4 sm:mt-8 gap-1.5 sm:gap-2">
              <button
                disabled={pagination.page === 1}
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                className="px-2 py-1 sm:px-3 sm:py-1.5 border rounded-lg text-[10px] sm:text-sm disabled:opacity-50"
              >
                Prev
              </button>
              <span className="flex items-center px-2 sm:px-4 text-[10px] sm:text-sm">
                {pagination.page}/{pagination.pages}
              </span>
              <button
                disabled={pagination.page === pagination.pages}
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                className="px-2 py-1 sm:px-3 sm:py-1.5 border rounded-lg text-[10px] sm:text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, product: null })}
        title="Delete Product"
      >
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete "{deleteModal.product?.name}"? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => setDeleteModal({ open: false, product: null })}>
            {t('common.cancel')}
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            {t('common.delete')}
          </Button>
        </div>
      </Modal>

      {/* Bulk Editor Modal */}
      <BulkEditor
        isOpen={bulkEditorOpen}
        onClose={() => setBulkEditorOpen(false)}
        selectedProducts={selectedProducts}
        onOperationComplete={() => {
          setSelectedIds(new Set());
          fetchProducts();
        }}
      />
    </div>
  );
};

export default VendorProducts;
