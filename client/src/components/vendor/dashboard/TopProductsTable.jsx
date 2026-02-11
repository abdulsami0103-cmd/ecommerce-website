import { useState } from 'react';
import { Link } from 'react-router-dom';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const StockBadge = ({ status, level }) => {
  const config = {
    in_stock: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'In Stock' },
    low_stock: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Low Stock' },
    out_of_stock: { bg: 'bg-red-100', text: 'text-red-700', label: 'Out of Stock' },
  };

  const { bg, text, label } = config[status] || config.in_stock;

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
      {label} ({level})
    </span>
  );
};

const TopProductsTable = ({ products, loading, sortBy, onSortChange }) => {
  const [hoveredRow, setHoveredRow] = useState(null);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="divide-y divide-gray-100">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse" />
              <div className="flex-1">
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 sm:p-6 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm sm:text-lg font-semibold text-gray-900">Top Selling Products</h3>
          <p className="text-[10px] sm:text-sm text-gray-500">Best performers in last 30 days</p>
        </div>
        <div className="flex gap-1 sm:gap-2">
          <button
            onClick={() => onSortChange?.('revenue')}
            className={`px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-sm rounded-md sm:rounded-lg transition-colors ${
              sortBy === 'revenue'
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Revenue
          </button>
          <button
            onClick={() => onSortChange?.('quantity')}
            className={`px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-sm rounded-md sm:rounded-lg transition-colors ${
              sortBy === 'quantity'
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Units
          </button>
        </div>
      </div>

      {/* Table */}
      {products?.length === 0 ? (
        <div className="p-4 sm:p-8 text-center text-xs sm:text-base text-gray-500">
          No product sales data available
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-emerald-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-emerald-700 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-emerald-700 uppercase tracking-wider">Units Sold</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-emerald-700 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-emerald-700 uppercase tracking-wider">Stock Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {products?.map((product, index) => (
                  <tr
                    key={product.id}
                    className={`transition-colors ${hoveredRow === index ? 'bg-gray-50' : ''}`}
                    onMouseEnter={() => setHoveredRow(index)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-400 w-6">#{index + 1}</span>
                        <div className="flex-shrink-0 h-12 w-12">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="h-12 w-12 rounded-xl object-cover" />
                          ) : (
                            <div className="h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center">
                              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div>
                          <Link to={`/vendor/products/${product.id}`} className="text-sm font-medium text-gray-900 hover:text-emerald-600">{product.name}</Link>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right"><span className="text-sm font-semibold text-gray-900">{product.unitsSold}</span></td>
                    <td className="px-6 py-4 whitespace-nowrap text-right"><span className="text-sm font-semibold text-emerald-600">{formatCurrency(product.revenue)}</span></td>
                    <td className="px-6 py-4 whitespace-nowrap text-center"><StockBadge status={product.stockStatus} level={product.stockLevel} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="sm:hidden">
            <div className="grid grid-cols-12 gap-1 bg-emerald-50 px-3 py-1.5">
              <span className="col-span-5 text-[9px] font-semibold text-emerald-700 uppercase">Product</span>
              <span className="col-span-2 text-[9px] font-semibold text-emerald-700 uppercase text-right">Sold</span>
              <span className="col-span-3 text-[9px] font-semibold text-emerald-700 uppercase text-right">Revenue</span>
              <span className="col-span-2 text-[9px] font-semibold text-emerald-700 uppercase text-right">Stock</span>
            </div>
            <div className="divide-y divide-gray-100">
              {products?.map((product, index) => (
                <div key={product.id} className="grid grid-cols-12 gap-1 items-center px-3 py-2">
                  <div className="col-span-5 flex items-center gap-1.5 min-w-0">
                    <span className="text-[9px] text-gray-400 shrink-0">#{index + 1}</span>
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-6 h-6 rounded object-cover shrink-0" />
                    ) : (
                      <div className="w-6 h-6 rounded bg-gray-100 shrink-0" />
                    )}
                    <Link to={`/vendor/products/${product.id}`} className="text-[10px] font-medium text-gray-900 truncate">{product.name}</Link>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="text-[10px] font-semibold text-gray-900">{product.unitsSold}</span>
                  </div>
                  <div className="col-span-3 text-right">
                    <span className="text-[10px] font-semibold text-emerald-600">{formatCurrency(product.revenue)}</span>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className={`text-[8px] px-1 py-0.5 rounded-full ${
                      product.stockStatus === 'in_stock' ? 'bg-emerald-100 text-emerald-700' :
                      product.stockStatus === 'low_stock' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {product.stockLevel}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Footer */}
      <div className="px-3 py-2 sm:p-4 border-t border-gray-100 bg-gray-50">
        <Link to="/vendor/products" className="text-[10px] sm:text-sm text-emerald-600 hover:text-emerald-700 font-medium">
          View all products →
        </Link>
      </div>
    </div>
  );
};

export default TopProductsTable;
