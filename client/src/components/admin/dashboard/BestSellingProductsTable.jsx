import { useState } from 'react';

const SearchIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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

const BestSellingProductsTable = ({ products = [] }) => {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Default demo data matching Biko design
  const productData = products.length > 0 ? products : [
    { id: '#1', name: 'DJI Mavic Pro 2', category: 'Tech gadget', brand: 'Apple', price: 990.00, stock: 20, rating: 4.8, order: 540, sales: '34k' },
    { id: '#1', name: 'iPad Pro 2017 Model', category: 'Tech gadget', brand: 'LG', price: 230.00, stock: 20, rating: 4.8, order: 540, sales: '34k' },
    { id: '#1', name: 'Lego Star War edition', category: 'Tech gadget', brand: 'Karbonn', price: 140.00, stock: 20, rating: 4.8, order: 540, sales: '34k' },
    { id: '#1', name: 'Dell Computer Monitor', category: 'Tech gadget', brand: 'Lenovo', price: 220.00, stock: 20, rating: 4.8, order: 540, sales: '34k' },
  ];

  const filteredProducts = productData.filter(product =>
    product.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const totalResults = filteredProducts.length;

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Best Selling Product</h3>

          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-2 sm:pb-0">
            {/* Search */}
            <div className="relative flex-shrink-0">
              <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 sm:py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 w-28 sm:w-36"
              />
            </div>

            {/* Filter - Hidden on mobile */}
            <div className="relative hidden sm:block">
              <select className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm text-gray-600">
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
              <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            <button className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
              <MoreIcon className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden divide-y divide-gray-100">
        {filteredProducts.map((product, index) => (
          <div key={index} className="p-4 hover:bg-gray-50">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 truncate">{product.name}</h4>
                <p className="text-xs text-gray-500 mt-0.5">{product.category} • {product.brand}</p>
              </div>
              <button className="p-1 hover:bg-gray-100 rounded ml-2">
                <MoreIcon className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xs text-gray-400">Price</p>
                  <p className="text-sm font-semibold text-gray-900">${product.price.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Sales</p>
                  <p className="text-sm font-semibold text-emerald-600">${product.sales}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Stock</p>
                  <p className="text-sm text-gray-600">{product.stock}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4 text-amber-400 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-xs text-gray-600">{product.rating}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-emerald-50">
              <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-4 lg:px-6 py-3">Product</th>
              <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-4 lg:px-6 py-3">Category</th>
              <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-4 lg:px-6 py-3 hidden lg:table-cell">Brand</th>
              <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-4 lg:px-6 py-3">Price</th>
              <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-4 lg:px-6 py-3 hidden md:table-cell">Stock</th>
              <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-4 lg:px-6 py-3">Sales</th>
              <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-4 lg:px-6 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product, index) => (
              <tr key={index} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-4 lg:px-6 py-3 text-sm font-medium text-gray-900">{product.name}</td>
                <td className="px-4 lg:px-6 py-3 text-sm text-gray-500">{product.category}</td>
                <td className="px-4 lg:px-6 py-3 text-sm text-gray-500 hidden lg:table-cell">{product.brand}</td>
                <td className="px-4 lg:px-6 py-3 text-sm text-gray-900">${product.price.toFixed(2)}</td>
                <td className="px-4 lg:px-6 py-3 text-sm text-gray-500 hidden md:table-cell">{product.stock}</td>
                <td className="px-4 lg:px-6 py-3 text-sm font-medium text-emerald-600">${product.sales}</td>
                <td className="px-4 lg:px-6 py-3">
                  <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                    <MoreIcon className="w-5 h-5 text-gray-400" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-t border-gray-100">
        <p className="text-xs sm:text-sm text-emerald-600">
          {totalResults} items
        </p>
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            disabled={currentPage === 1}
            className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Prev
          </button>
          <button className="w-7 h-7 sm:w-8 sm:h-8 text-xs sm:text-sm bg-emerald-500 text-white rounded-lg">
            1
          </button>
          <button
            disabled={currentPage === totalPages}
            className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default BestSellingProductsTable;
