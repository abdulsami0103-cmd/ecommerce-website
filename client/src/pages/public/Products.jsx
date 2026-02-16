import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import {
  fetchProducts,
  fetchCategories,
  setFilters,
  clearFilters,
  setPage,
} from '../../store/slices/productSlice';
import ProductGrid from '../../components/product/ProductGrid';
import { Button, Select } from '../../components/common';

// Inline SVG Icons
const FilterIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

const XIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const CategoryIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const BoxIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const CurrencyIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const StarIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const ChevronRightIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const Products = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const { products, categories, loading, pagination, filters } = useSelector(
    (state) => state.products
  );

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  // Sync URL category param to Redux filters on initial load
  useEffect(() => {
    const categoryQuery = searchParams.get('category');
    if (categoryQuery && categoryQuery !== filters.category) {
      dispatch(setFilters({ category: categoryQuery }));
    }
  }, []);

  useEffect(() => {
    const searchQuery = searchParams.get('search');
    const params = {
      page: pagination.page,
      limit: pagination.limit,
    };

    if (searchQuery) {
      // When searching, only apply search - ignore other filters
      params.search = searchQuery;
    } else {
      // No search, apply all filters
      Object.assign(params, filters);
    }

    dispatch(fetchProducts(params));
  }, [dispatch, pagination.page, filters, searchParams]);

  const handleFilterChange = (key, value) => {
    dispatch(setFilters({ [key]: value }));
    dispatch(setPage(1));
    if (key === 'category') {
      const newParams = new URLSearchParams(searchParams);
      if (value) {
        newParams.set('category', value);
      } else {
        newParams.delete('category');
      }
      setSearchParams(newParams);
    }
  };

  const handleClearFilters = () => {
    dispatch(clearFilters());
    setSearchParams({});
    dispatch(setPage(1));
  };

  const sortOptions = [
    { value: 'createdAt', label: 'Newest' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'rating', label: 'Top Rated' },
    { value: 'popular', label: 'Most Popular' },
  ];

  const typeOptions = [
    { value: '', label: 'All Types' },
    { value: 'physical', label: 'Physical Products' },
    { value: 'digital', label: 'Digital Products' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('nav.products')}</h1>
            <p className="text-gray-500 mt-1">
              <span className="text-emerald-600 font-semibold">{pagination.total}</span> products found
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl shadow-sm hover:bg-emerald-600 transition-colors"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FilterIcon className="w-5 h-5" />
              {t('common.filter')}
            </button>

            <div className="relative">
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer shadow-sm"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Modern Filter Sidebar */}
          <aside className={`${showFilters ? 'block' : 'hidden'} lg:block w-full lg:w-72 lg:min-w-[288px] lg:max-w-[288px] flex-shrink-0`}>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 sticky top-24 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FilterIcon className="w-5 h-5 text-white" />
                  <h2 className="font-semibold text-white">{t('common.filter')}</h2>
                </div>
                <button
                  onClick={handleClearFilters}
                  className="text-xs text-white/80 hover:text-white bg-white/20 px-3 py-1 rounded-full transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="p-5">
              {/* Categories Section */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <CategoryIcon className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-sm font-semibold text-gray-800">{t('nav.categories')}</h3>
                </div>
                <div className="space-y-1">
                  <label
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                      !filters.category
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="category"
                        checked={!filters.category}
                        onChange={() => handleFilterChange('category', '')}
                        className="w-4 h-4 text-emerald-500 border-gray-300 focus:ring-emerald-500"
                      />
                      <span className="text-sm font-medium">All Categories</span>
                    </div>
                    {!filters.category && <ChevronRightIcon className="w-4 h-4" />}
                  </label>
                  {categories.map((category) => (
                    <label
                      key={category._id}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                        filters.category === category.slug
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="category"
                          checked={filters.category === category.slug}
                          onChange={() => handleFilterChange('category', category.slug)}
                          className="w-4 h-4 text-emerald-500 border-gray-300 focus:ring-emerald-500"
                        />
                        <span className="text-sm font-medium">{category.name}</span>
                      </div>
                      {filters.category === category.slug && <ChevronRightIcon className="w-4 h-4" />}
                    </label>
                  ))}
                </div>
              </div>

              {/* Product Type Section */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <BoxIcon className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-sm font-semibold text-gray-800">Product Type</h3>
                </div>
                <div className="space-y-1">
                  {typeOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                        filters.type === option.value
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="productType"
                          checked={filters.type === option.value}
                          onChange={() => handleFilterChange('type', option.value)}
                          className="w-4 h-4 text-emerald-500 border-gray-300 focus:ring-emerald-500"
                        />
                        <span className="text-sm font-medium">{option.label}</span>
                      </div>
                      {filters.type === option.value && <ChevronRightIcon className="w-4 h-4" />}
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range Section */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <CurrencyIcon className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-sm font-semibold text-gray-800">Price Range</h3>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 mb-1 block">Min</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    />
                  </div>
                  <div className="flex items-end pb-2.5">
                    <span className="text-gray-400">—</span>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 mb-1 block">Max</label>
                    <input
                      type="number"
                      placeholder="∞"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Rating Filter (Optional) */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <StarIcon className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-sm font-semibold text-gray-800">Rating</h3>
                </div>
                <div className="space-y-1">
                  {[4, 3, 2, 1].map((rating) => (
                    <label
                      key={rating}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all ${
                        filters.minRating === rating
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="rating"
                        checked={filters.minRating === rating}
                        onChange={() => handleFilterChange('minRating', rating)}
                        className="w-4 h-4 text-emerald-500 border-gray-300 focus:ring-emerald-500"
                      />
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${i < rating ? 'text-amber-400 fill-current' : 'text-gray-300'}`}
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                        <span className="text-xs text-gray-500 ml-1">& up</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Mobile Apply Button */}
              <button
                className="lg:hidden w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 rounded-xl transition-colors mt-4"
                onClick={() => setShowFilters(false)}
              >
                Apply Filters
              </button>
            </div>
          </div>
          </aside>

          <div className="flex-1 min-w-0">
          {/* Active Filters */}
          {(filters.category || filters.type || filters.minPrice || filters.maxPrice || filters.minRating || searchParams.get('search')) && (
            <div className="flex flex-wrap gap-2 mb-6">
              {searchParams.get('search') && (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium border border-emerald-200">
                  Search: {searchParams.get('search')}
                  <button
                    onClick={() => setSearchParams({})}
                    className="hover:bg-emerald-200 rounded-full p-0.5 transition-colors"
                  >
                    <XIcon className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              {filters.type && (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium border border-emerald-200">
                  {filters.type === 'physical' ? 'Physical Products' : 'Digital Products'}
                  <button
                    onClick={() => handleFilterChange('type', '')}
                    className="hover:bg-emerald-200 rounded-full p-0.5 transition-colors"
                  >
                    <XIcon className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              {filters.minRating && (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-sm font-medium border border-amber-200">
                  {filters.minRating}+ Stars
                  <button
                    onClick={() => handleFilterChange('minRating', '')}
                    className="hover:bg-amber-200 rounded-full p-0.5 transition-colors"
                  >
                    <XIcon className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              {(filters.minPrice || filters.maxPrice) && (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-200">
                  Price: {filters.minPrice || '0'} - {filters.maxPrice || '∞'}
                  <button
                    onClick={() => {
                      handleFilterChange('minPrice', '');
                      handleFilterChange('maxPrice', '');
                    }}
                    className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                  >
                    <XIcon className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
            </div>
          )}

          <ProductGrid products={products} loading={loading} />

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center mt-10 gap-2">
              <button
                disabled={pagination.page === 1}
                onClick={() => dispatch(setPage(pagination.page - 1))}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>

              <div className="flex items-center gap-1 mx-4">
                {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                  let pageNum;
                  if (pagination.pages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.pages - 2) {
                    pageNum = pagination.pages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }
                  return (
                    <button
                      key={i}
                      onClick={() => dispatch(setPage(pageNum))}
                      className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
                        pagination.page === pageNum
                          ? 'bg-emerald-500 text-white shadow-md'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                disabled={pagination.page === pagination.pages}
                onClick={() => dispatch(setPage(pagination.page + 1))}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
              >
                Next
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
