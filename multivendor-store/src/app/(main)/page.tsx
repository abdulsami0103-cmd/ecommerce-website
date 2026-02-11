import Link from 'next/link';
import { ArrowRight, Truck, Shield, CreditCard, Headphones } from 'lucide-react';
import Button from '@/components/ui/Button';

// Sample featured products (replace with actual API call)
const featuredProducts = [
  {
    _id: '1',
    name: 'Wireless Bluetooth Headphones',
    slug: 'wireless-bluetooth-headphones',
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
    name: 'Smart Fitness Watch',
    slug: 'smart-fitness-watch',
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
];

const categories = [
  { name: 'Electronics', slug: 'electronics', image: '/placeholder.jpg', count: 150 },
  { name: 'Fashion', slug: 'fashion', image: '/placeholder.jpg', count: 320 },
  { name: 'Home & Living', slug: 'home-living', image: '/placeholder.jpg', count: 180 },
  { name: 'Sports', slug: 'sports', image: '/placeholder.jpg', count: 95 },
  { name: 'Beauty', slug: 'beauty', image: '/placeholder.jpg', count: 210 },
  { name: 'Books', slug: 'books', image: '/placeholder.jpg', count: 450 },
];

const features = [
  { icon: Truck, title: 'Free Shipping', description: 'On orders over AED 200' },
  { icon: Shield, title: 'Secure Shopping', description: '100% secure payment' },
  { icon: CreditCard, title: 'Easy Returns', description: '30-day return policy' },
  { icon: Headphones, title: '24/7 Support', description: 'Dedicated support team' },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Discover Amazing Products from Trusted Sellers
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Shop from thousands of verified vendors with secure payments and fast delivery.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/products">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                  Shop Now <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/vendor/register">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  Become a Seller
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="flex items-center space-x-3">
                <feature.icon className="h-10 w-10 text-blue-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                  <p className="text-sm text-gray-500">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Shop by Category</h2>
            <Link href="/products?view=categories" className="text-blue-600 hover:text-blue-700 font-medium">
              View All <ArrowRight className="inline h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/products?category=${category.slug}`}
                className="group bg-white rounded-lg p-6 text-center hover:shadow-lg transition-shadow"
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-blue-50">
                  <span className="text-2xl">📦</span>
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">{category.name}</h3>
                <p className="text-sm text-gray-500">{category.count} products</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
            <Link href="/products?featured=true" className="text-blue-600 hover:text-blue-700 font-medium">
              View All <ArrowRight className="inline h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <Link key={product._id} href={`/products/${product.slug}`} className="group">
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-square bg-gray-100 relative">
                    <div className="absolute inset-0 flex items-center justify-center text-4xl">📦</div>
                    {product.comparePrice && (
                      <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                        -{Math.round((1 - product.price / product.comparePrice) * 100)}%
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-gray-500 mb-1">{product.vendor.storeName}</p>
                    <h3 className="font-medium text-gray-900 line-clamp-2 mb-2 group-hover:text-blue-600">
                      {product.name}
                    </h3>
                    <div className="flex items-center space-x-1 mb-2">
                      <span className="text-yellow-400">★</span>
                      <span className="text-sm text-gray-600">
                        {product.rating} ({product.totalReviews})
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-gray-900">AED {product.price}</span>
                      {product.comparePrice && (
                        <span className="text-sm text-gray-400 line-through">AED {product.comparePrice}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Become a Seller CTA */}
      <section className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Start Selling on MarketHub</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of successful sellers and reach millions of customers. Low commission rates and easy-to-use vendor dashboard.
          </p>
          <Link href="/vendor/register">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              Register as a Seller <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
