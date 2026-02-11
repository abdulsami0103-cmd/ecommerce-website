'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  Users,
  Store,
  Package,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';

const stats = [
  { name: 'Total Revenue', value: formatPrice(124500), icon: DollarSign, change: '+12.5%', up: true },
  { name: 'Total Orders', value: '1,234', icon: ShoppingBag, change: '+8.2%', up: true },
  { name: 'Active Vendors', value: '48', icon: Store, change: '+3 new', up: true },
  { name: 'Total Customers', value: '2,890', icon: Users, change: '+156 this month', up: true },
];

const recentVendors = [
  { id: 1, name: 'TechStore', owner: 'Ahmed Hassan', status: 'pending', products: 0, joined: '2 hours ago' },
  { id: 2, name: 'FashionHub', owner: 'Sarah Ali', status: 'approved', products: 24, joined: '1 day ago' },
  { id: 3, name: 'HomeDecor', owner: 'Mohammed Khan', status: 'approved', products: 56, joined: '3 days ago' },
];

const topVendors = [
  { name: 'GadgetWorld', sales: 45600, orders: 234, commission: 4560 },
  { name: 'FashionHub', sales: 38900, orders: 189, commission: 3890 },
  { name: 'ElectroMart', sales: 32100, orders: 156, commission: 3210 },
];

const recentOrders = [
  { id: 'ORD-2501-A1B2C3', customer: 'Ahmed Hassan', vendor: 'TechStore', total: 299, status: 'pending' },
  { id: 'ORD-2501-D4E5F6', customer: 'Sarah Ali', vendor: 'FashionHub', total: 149, status: 'processing' },
  { id: 'ORD-2501-G7H8I9', customer: 'Mohammed Khan', vendor: 'HomeDecor', total: 459, status: 'shipped' },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Overview of your marketplace</p>
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
                  <p
                    className={`text-sm mt-1 flex items-center ${
                      stat.up ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {stat.up ? (
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 mr-1" />
                    )}
                    {stat.change}
                  </p>
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
        {/* Pending Vendor Approvals */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Vendor Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentVendors
                .filter((v) => v.status === 'pending')
                .map((vendor) => (
                  <div
                    key={vendor.id}
                    className="flex items-center justify-between py-3 border-b last:border-0"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{vendor.name}</p>
                      <p className="text-sm text-gray-500">{vendor.owner}</p>
                      <p className="text-xs text-gray-400">{vendor.joined}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200">
                        Approve
                      </button>
                      <button className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200">
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              {recentVendors.filter((v) => v.status === 'pending').length === 0 && (
                <p className="text-gray-500 text-center py-4">No pending approvals</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Vendors */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Vendors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topVendors.map((vendor, index) => (
                <div key={vendor.name} className="flex items-center space-x-4 py-3 border-b last:border-0">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{vendor.name}</p>
                    <p className="text-sm text-gray-500">{vendor.orders} orders</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatPrice(vendor.sales)}</p>
                    <p className="text-sm text-green-600">
                      Commission: {formatPrice(vendor.commission)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-y">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Order ID
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Customer
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Vendor
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Total
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{order.id}</td>
                    <td className="px-6 py-4 text-gray-600">{order.customer}</td>
                    <td className="px-6 py-4 text-gray-600">{order.vendor}</td>
                    <td className="px-6 py-4 font-medium">{formatPrice(order.total)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          order.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : order.status === 'processing'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
