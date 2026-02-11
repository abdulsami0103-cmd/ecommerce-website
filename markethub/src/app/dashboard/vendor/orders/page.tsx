'use client';

import { useState } from 'react';
import { Search, Eye, Truck, Package } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { formatPrice, formatDateTime } from '@/lib/utils';

const orders = [
  {
    id: 'ORD-2501-A1B2C3',
    customer: 'Ahmed Hassan',
    email: 'ahmed@example.com',
    items: [{ name: 'Wireless Headphones', quantity: 1, price: 149 }],
    total: 149,
    status: 'pending',
    paymentStatus: 'paid',
    createdAt: '2025-02-02T10:30:00',
  },
  {
    id: 'ORD-2501-D4E5F6',
    customer: 'Sarah Ali',
    email: 'sarah@example.com',
    items: [
      { name: 'Smart Watch', quantity: 1, price: 299 },
      { name: 'Charging Pad', quantity: 2, price: 39 },
    ],
    total: 377,
    status: 'processing',
    paymentStatus: 'paid',
    createdAt: '2025-02-02T08:15:00',
  },
  {
    id: 'ORD-2501-G7H8I9',
    customer: 'Mohammed Khan',
    email: 'mohammed@example.com',
    items: [{ name: 'Power Bank', quantity: 3, price: 59 }],
    total: 177,
    status: 'shipped',
    paymentStatus: 'paid',
    trackingNumber: 'TRK123456789',
    createdAt: '2025-02-01T14:45:00',
  },
  {
    id: 'ORD-2501-J0K1L2',
    customer: 'Fatima Ahmed',
    email: 'fatima@example.com',
    items: [{ name: 'Earbuds', quantity: 1, price: 129 }],
    total: 129,
    status: 'delivered',
    paymentStatus: 'paid',
    createdAt: '2025-01-30T09:00:00',
  },
];

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
];

export default function VendorOrdersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'warning' | 'info' | 'success'> = {
      pending: 'warning',
      confirmed: 'info',
      processing: 'info',
      shipped: 'info',
      delivered: 'success',
    };
    return variants[status] || 'default';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-600">Manage and fulfill customer orders</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">
              {orders.filter((o) => o.status === 'pending').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Processing</p>
            <p className="text-2xl font-bold text-blue-600">
              {orders.filter((o) => o.status === 'processing').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Shipped</p>
            <p className="text-2xl font-bold text-purple-600">
              {orders.filter((o) => o.status === 'shipped').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Delivered</p>
            <p className="text-2xl font-bold text-green-600">
              {orders.filter((o) => o.status === 'delivered').length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by order ID or customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-200">
            {filteredOrders.map((order) => (
              <div key={order.id} className="p-6 hover:bg-gray-50">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold text-gray-900">{order.id}</span>
                      <Badge variant={getStatusBadge(order.status)}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {order.customer} • {order.email}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDateTime(order.createdAt)}
                    </p>
                    <div className="mt-2">
                      {order.items.map((item, index) => (
                        <span key={index} className="text-sm text-gray-600">
                          {item.name} x{item.quantity}
                          {index < order.items.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">{formatPrice(order.total)}</p>
                      <p className="text-sm text-green-600">{order.paymentStatus}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      {order.status === 'pending' && (
                        <Button size="sm">
                          <Package className="h-4 w-4 mr-1" />
                          Process
                        </Button>
                      )}
                      {order.status === 'processing' && (
                        <Button size="sm">
                          <Truck className="h-4 w-4 mr-1" />
                          Ship
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No orders found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
