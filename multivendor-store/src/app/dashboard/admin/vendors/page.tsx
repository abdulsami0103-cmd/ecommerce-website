'use client';

import { useState } from 'react';
import { Search, Eye, Check, X, Ban, MoreVertical } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { formatPrice, formatDate } from '@/lib/utils';

const vendors = [
  {
    id: '1',
    storeName: 'TechStore',
    owner: 'Ahmed Hassan',
    email: 'ahmed@techstore.com',
    status: 'approved',
    products: 45,
    totalSales: 45600,
    commission: 4560,
    rating: 4.8,
    joinedAt: '2024-10-15',
  },
  {
    id: '2',
    storeName: 'FashionHub',
    owner: 'Sarah Ali',
    email: 'sarah@fashionhub.com',
    status: 'approved',
    products: 120,
    totalSales: 38900,
    commission: 3890,
    rating: 4.6,
    joinedAt: '2024-11-20',
  },
  {
    id: '3',
    storeName: 'HomeDecor Pro',
    owner: 'Mohammed Khan',
    email: 'mohammed@homedecor.com',
    status: 'pending',
    products: 0,
    totalSales: 0,
    commission: 0,
    rating: 0,
    joinedAt: '2025-02-01',
  },
  {
    id: '4',
    storeName: 'ElectroMart',
    owner: 'Fatima Ahmed',
    email: 'fatima@electromart.com',
    status: 'suspended',
    products: 78,
    totalSales: 32100,
    commission: 3210,
    rating: 3.9,
    joinedAt: '2024-09-05',
  },
];

export default function AdminVendorsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch =
      vendor.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.owner.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || vendor.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: 'success' | 'warning' | 'danger' | 'default'; label: string }> = {
      approved: { variant: 'success', label: 'Approved' },
      pending: { variant: 'warning', label: 'Pending' },
      rejected: { variant: 'danger', label: 'Rejected' },
      suspended: { variant: 'danger', label: 'Suspended' },
    };
    return config[status] || { variant: 'default', label: status };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
        <p className="text-gray-600">Manage vendor accounts and approvals</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Total Vendors</p>
            <p className="text-2xl font-bold text-gray-900">{vendors.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Pending Approval</p>
            <p className="text-2xl font-bold text-yellow-600">
              {vendors.filter((v) => v.status === 'pending').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Active Vendors</p>
            <p className="text-2xl font-bold text-green-600">
              {vendors.filter((v) => v.status === 'approved').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Total Commission</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatPrice(vendors.reduce((sum, v) => sum + v.commission, 0))}
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
                placeholder="Search vendors..."
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
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-y">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Vendor
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Products
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Total Sales
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Commission
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Rating
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredVendors.map((vendor) => {
                  const statusConfig = getStatusBadge(vendor.status);
                  return (
                    <tr key={vendor.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{vendor.storeName}</p>
                          <p className="text-sm text-gray-500">{vendor.owner}</p>
                          <p className="text-xs text-gray-400">{vendor.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{vendor.products}</td>
                      <td className="px-6 py-4 font-medium">{formatPrice(vendor.totalSales)}</td>
                      <td className="px-6 py-4 text-green-600">{formatPrice(vendor.commission)}</td>
                      <td className="px-6 py-4">
                        {vendor.rating > 0 ? (
                          <span className="flex items-center">
                            <span className="text-yellow-400 mr-1">★</span>
                            {vendor.rating}
                          </span>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end space-x-2">
                          <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                            <Eye className="h-4 w-4" />
                          </button>
                          {vendor.status === 'pending' && (
                            <>
                              <button className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg">
                                <Check className="h-4 w-4" />
                              </button>
                              <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {vendor.status === 'approved' && (
                            <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg">
                              <Ban className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
