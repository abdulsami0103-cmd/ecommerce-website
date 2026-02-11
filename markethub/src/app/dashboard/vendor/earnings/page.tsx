'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

const earnings = {
  totalEarnings: 12450,
  availableBalance: 3250,
  pendingBalance: 890,
  lastPayout: 2500,
  commissionRate: 10,
};

const transactions = [
  { id: 1, type: 'earning', order: 'ORD-2501-A1B2C3', amount: 134.1, date: '2025-02-02' },
  { id: 2, type: 'earning', order: 'ORD-2501-D4E5F6', amount: 339.3, date: '2025-02-02' },
  { id: 3, type: 'payout', method: 'Bank Transfer', amount: -2500, date: '2025-01-28' },
  { id: 4, type: 'earning', order: 'ORD-2501-G7H8I9', amount: 159.3, date: '2025-01-27' },
  { id: 5, type: 'earning', order: 'ORD-2501-J0K1L2', amount: 116.1, date: '2025-01-25' },
];

const monthlyData = [
  { month: 'Sep', earnings: 2100 },
  { month: 'Oct', earnings: 2800 },
  { month: 'Nov', earnings: 3200 },
  { month: 'Dec', earnings: 3500 },
  { month: 'Jan', earnings: 4100 },
  { month: 'Feb', earnings: 1250 },
];

export default function VendorEarningsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>
          <p className="text-gray-600">Track your earnings and request payouts</p>
        </div>
        <Button>
          <Wallet className="h-4 w-4 mr-2" />
          Request Payout
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatPrice(earnings.totalEarnings)}
                </p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  +12.5% from last month
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available Balance</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatPrice(earnings.availableBalance)}
                </p>
                <p className="text-sm text-gray-500 mt-1">Ready for withdrawal</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Wallet className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Balance</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatPrice(earnings.pendingBalance)}
                </p>
                <p className="text-sm text-gray-500 mt-1">Processing orders</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <DollarSign className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Commission Rate</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{earnings.commissionRate}%</p>
                <p className="text-sm text-gray-500 mt-1">Platform fee</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Earnings Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between gap-2">
              {monthlyData.map((data) => (
                <div key={data.month} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-blue-500 rounded-t-lg transition-all hover:bg-blue-600"
                    style={{ height: `${(data.earnings / 4500) * 100}%` }}
                  />
                  <span className="text-xs text-gray-500 mt-2">{data.month}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded-full ${
                        tx.type === 'earning' ? 'bg-green-50' : 'bg-red-50'
                      }`}
                    >
                      {tx.type === 'earning' ? (
                        <ArrowUpRight className="h-4 w-4 text-green-600" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {tx.type === 'earning' ? `Order ${tx.order}` : tx.method}
                      </p>
                      <p className="text-sm text-gray-500">{tx.date}</p>
                    </div>
                  </div>
                  <span
                    className={`font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {tx.amount > 0 ? '+' : ''}
                    {formatPrice(Math.abs(tx.amount))}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payout Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Payout Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Bank Account</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-600">Bank: Emirates NBD</p>
                <p className="text-gray-600">Account: **** **** 1234</p>
                <p className="text-gray-600">IBAN: AE** **** **** **** **89</p>
              </div>
              <Button variant="outline" size="sm" className="mt-3">
                Update Bank Details
              </Button>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Payout Schedule</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-600">Minimum payout: {formatPrice(100)}</p>
                <p className="text-gray-600">Payout cycle: Weekly (Every Friday)</p>
                <p className="text-gray-600">Processing time: 2-3 business days</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
