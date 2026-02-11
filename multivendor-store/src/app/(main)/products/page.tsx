'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/products/ProductCard';
import Button from '@/components/ui/Button';
import { Filter, ChevronDown, Grid, List } from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number;
  images: string[];
  rating: number;
  totalReviews: number;
  stock: number;
  vendor: {
    _id: string;
    storeName: string;
  };
}

// Sample products (replace with API call)
const sampleProducts: Product[] = [
  {
    _id: '1',
    name: 'Wireless Bluetooth Headphones Pro',
    slug: 'wireless-bluetooth-headphones-pro',
    price: 149,
    comparePrice: 199,
    images: ['/placeholder.jpg'],
    rating: 4.5,
    totalReviews: 128,
    stock: 50,
    vendor: { _id: 'v1', storeName: 'TechStore' },
  },
  {
    _id: '2',
    name: 'Smart Fitness Watch Series 5',
    slug: 'smart-fitness-watch-series-5',
    price: 299,
    images: ['/placeholder.jpg'],
    rating: 4.8,
    totalReviews: 89,
    stock: 25,
    vendor: { _id: 'v2', storeName: 'GadgetWorld' },
  },
  {
    _id: '3',
    name: 'Premium Leather Wallet',
    slug: 'premium-leather-wallet',
    price: 79,
    comparePrice: 99,
    images: ['/placeholder.jpg'],
    rating: 4.3,
    totalReviews: 56,
    stock: 100,
    vendor: { _id: 'v3', storeName: 'LeatherCraft' },
  },
  {
    _id: '4',
    name: 'Portable Power Bank 20000mAh',
    slug: 'portable-power-bank-20000mah',
    price: 59,
    images: ['/placeholder.jpg'],
    rating: 4.6,
    totalReviews: 234,
    stock: 80,
    vendor: { _id: 'v1', storeName: 'TechStore' },
  },
  {
    _id: '5',
    name: 'Wireless Charging Pad',
    slug: 'wireless-charging-pad',
    price: 39,
    comparePrice: 49,
    images: ['/placeholder.jpg'],
    rating: 4.2,
    totalReviews: 167,
    stock: 150,
    vendor: { _id: 'v2', storeName: 'GadgetWorld' },
  },
  {
    _id: '6',
    name: 'Noise Canceling Earbuds',
    slug: 'noise-canceling-earbuds',
    price: 129,
    images: ['/placeholder.jpg'],
    rating: 4.7,
    totalReviews: 312,
    stock: 45,
    vendor: { _id: 'v1', storeName: 'TechStore' },
  },
];

const categories = [
  { name: 'All Categories', slug: '' },
  { name: 'Electronics', slug: 'electronics' },
  { name: 'Fashion', slug: 'fashion' },
  { name: 'Home & Living', slug: 'home-living' },
  { name: 'Sports', slug: 'sports' },
  { name: 'Beauty', slug: 'beauty' },
];

const sortOptions = [
  { label: 'Newest', value: 'createdAt-desc' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Best Rating', value: 'rating-desc' },
  { label: 'Most Popular', value: 'totalSales-desc' },
];

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>(sampleProducts);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('createdAt-desc');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.set('category', selectedCategory);
      if (priceRange.min) params.set('minPrice', priceRange.min);
      if (priceRange.max) params.set('maxPrice', priceRange.max);
      const [sort, order] = sortBy.split('-');
      params.set('sort', sort);
      params.set('order', order);

      // In production, uncomment this:
      // const response = await fetch(`/api/products?${params}`);
      // const data = await response.json();
      // if (data.success) setProducts(data.data.items);

      // For now, use sample data
      setProducts(sampleProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, sortBy]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">All Products</h1>
            <p className="text-gray-600">Showing {products.length} products</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Sort dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Filter toggle (mobile) */}
            <Button
              variant="outline"
              className="md:hidden"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar filters */}
          <aside
            className={`${
              showFilters ? 'block' : 'hidden'
            } md:block w-full md:w-64 flex-shrink-0`}
          >
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-24">
              {/* Categories */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Categories</h3>
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <label key={cat.slug} className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="category"
                        checked={selectedCategory === cat.slug}
                        onChange={() => setSelectedCategory(cat.slug)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-gray-600">{cat.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price range */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Price Range</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-3"
                  onClick={fetchProducts}
                >
                  Apply
                </Button>
              </div>

              {/* Rating filter */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Rating</h3>
                <div className="space-y-2">
                  {[4, 3, 2, 1].map((rating) => (
                    <label key={rating} className="flex items-center cursor-pointer">
                      <input type="checkbox" className="text-blue-600 focus:ring-blue-500" />
                      <span className="ml-2 text-gray-600 flex items-center">
                        {rating}+ <span className="text-yellow-400 ml-1">★</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Products grid */}
          <main className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
                    <div className="aspect-square bg-gray-200 rounded-lg mb-4" />
                    <div className="h-4 bg-gray-200 rounded mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No products found</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSelectedCategory('');
                    setPriceRange({ min: '', max: '' });
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}

            {/* Pagination */}
            {products.length > 0 && (
              <div className="mt-8 flex justify-center">
                <nav className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" disabled>
                    Previous
                  </Button>
                  <Button size="sm">1</Button>
                  <Button variant="outline" size="sm">2</Button>
                  <Button variant="outline" size="sm">3</Button>
                  <Button variant="outline" size="sm">
                    Next
                  </Button>
                </nav>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
