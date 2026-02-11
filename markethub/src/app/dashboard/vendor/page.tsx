'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Package, ShoppingBag, DollarSign, TrendingUp, Eye, Star } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

const stats = [
  { name: 'Total Products', value: '24', icon: Package, change: '+3 this month' },
  { name: 'Total Orders', value: '156', icon: ShoppingBag, change: '+12 this week' },
  { name: 'Total Earnings', value: formatPrice(12450), icon: DollarSign, change: '+8.2%' },
  { name: 'Available Balance', value: formatPrice(3250), icon: TrendingUp, change: 'Withdraw available' },
];

const recentOrders = [
  { id: 'ORD-2501-A1B2C3', customer: 'Ahmed Hassan', total: 299, status: 'pending', date: '2 hours ago' },
  { id: 'ORD-2501-D4E5F6', customer: 'Sarah Ali', total: 149, status: 'processing', date: '5 hours ago' },
  { id: 'ORD-2501-G7H8I9', customer: 'Mohammed Khan', total: 459, status: 'shipped', date: '1 day ago' },
  { id: 'ORD-2501-J0K1L2', customer: 'Fatima Ahmed', total: 89, status: 'delivered', date: '2 days ago' },
];

const topProducts = [
  { name: 'Wireless Bluetooth Headphones', sales: 45, views: 1234, rating: 4.8 },
  { name: 'Smart Fitness Watch', sales: 32, views: 890, rating: 4.6 },
  { name: 'Portable Power Bank', sales: 28, views: 756, rating: 4.5 },
];

export default function VendorDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's your store overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className="text-sm text-green-600 mt-1">{stat.change}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <stat.icon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{order.id}</p>
                    <p className="text-sm text-gray-500">{order.customer}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatPrice(order.total)}</p>
                    <span
                      className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        order.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : order.status === 'processing'
                          ? 'bg-blue-100 text-blue-800'
                          : order.status === 'shipped'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center space-x-4 py-3 border-b last:border-0">
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-600">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{product.name}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <ShoppingBag className="h-4 w-4 mr-1" />
                        {product.sales} sales
                      </span>
                      <span className="flex items-center">
                        <Eye className="h-4 w-4 mr-1" />
                        {product.views} views
                      </span>
                      <span className="flex items-center">
                        <Star className="h-4 w-4 mr-1 text-yellow-400" />
                        {product.rating}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
