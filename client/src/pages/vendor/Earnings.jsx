import { useState, useEffect } from 'react';
import api from '../../services/api';

const Earnings = () => {
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [groupBy, setGroupBy] = useState('day');

  useEffect(() => {
    fetchEarnings();
  }, [dateRange, groupBy]);

  const fetchEarnings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/vendor/earnings', {
        params: { ...dateRange, groupBy },
      });
      setEarnings(res.data.data);
    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  if (loading && !earnings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-emerald-600">My Earnings</h1>
        <div className="flex gap-4 items-center">
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            className="border rounded-lg px-3 py-2"
          />
          <span>to</span>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            className="border rounded-lg px-3 py-2"
          />
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      {earnings?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500 mb-1">Total Sales</p>
            <p className="text-2xl font-bold text-indigo-600">
              {formatCurrency(earnings.summary.totalSales)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500 mb-1">Commission Paid</p>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(earnings.summary.totalCommission)}
            </p>
            <p className="text-xs text-gray-400">
              Avg rate: {(earnings.summary.avgCommissionRate || 0).toFixed(1)}%
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500 mb-1">Net Earnings</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(earnings.summary.totalEarnings)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500 mb-1">Orders</p>
            <p className="text-2xl font-bold">{earnings.summary.orderCount}</p>
          </div>
        </div>
      )}

      {/* Wallet Balance */}
      {earnings?.wallet && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="font-medium mb-4">Current Wallet Balance</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Available</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(earnings.wallet.availableBalance)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-xl font-bold text-yellow-600">
                {formatCurrency(earnings.wallet.pendingBalance)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Withdrawn</p>
              <p className="text-xl font-bold">{formatCurrency(earnings.wallet.totalWithdrawn)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Commission Breakdown */}
      {earnings?.commissionByType && Object.keys(earnings.commissionByType).length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="font-medium mb-4">Commission by Type</h3>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(earnings.commissionByType).map(([type, data]) => (
              <div key={type} className="border rounded-lg p-4">
                <p className="text-sm text-gray-500 capitalize">{type}</p>
                <p className="text-xl font-bold">{formatCurrency(data.amount)}</p>
                <p className="text-xs text-gray-400">{data.count} orders</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Earnings Over Time */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-medium mb-4">Earnings Over Time</h3>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : earnings?.earningsOverTime?.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No data for the selected period</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Period</th>
                  <th className="text-right py-2">Sales</th>
                  <th className="text-right py-2">Commission</th>
                  <th className="text-right py-2">Earnings</th>
                  <th className="text-right py-2">Orders</th>
                </tr>
              </thead>
              <tbody>
                {earnings?.earningsOverTime?.map((row) => (
                  <tr key={row._id} className="border-b">
                    <td className="py-3">{row._id}</td>
                    <td className="text-right">{formatCurrency(row.sales)}</td>
                    <td className="text-right text-red-600">{formatCurrency(row.commission)}</td>
                    <td className="text-right text-green-600">{formatCurrency(row.earnings)}</td>
                    <td className="text-right">{row.orders}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 font-medium">
                <tr>
                  <td className="py-3">Total</td>
                  <td className="text-right">{formatCurrency(earnings?.summary?.totalSales)}</td>
                  <td className="text-right text-red-600">
                    {formatCurrency(earnings?.summary?.totalCommission)}
                  </td>
                  <td className="text-right text-green-600">
                    {formatCurrency(earnings?.summary?.totalEarnings)}
                  </td>
                  <td className="text-right">{earnings?.summary?.orderCount}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Simple Bar Chart */}
      {earnings?.earningsOverTime?.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h3 className="font-medium mb-4">Earnings Trend</h3>
          <div className="flex items-end gap-2 h-48">
            {earnings.earningsOverTime.map((row) => {
              const maxEarnings = Math.max(...earnings.earningsOverTime.map((r) => r.earnings));
              const height = maxEarnings > 0 ? (row.earnings / maxEarnings) * 100 : 0;
              return (
                <div
                  key={row._id}
                  className="flex-1 flex flex-col items-center justify-end"
                >
                  <div
                    className="w-full bg-green-500 rounded-t transition-all duration-300"
                    style={{ height: `${height}%`, minHeight: row.earnings > 0 ? '4px' : '0' }}
                    title={`${row._id}: ${formatCurrency(row.earnings)}`}
                  />
                  <p className="text-xs text-gray-400 mt-2 truncate w-full text-center">
                    {row._id.split('-').slice(-1)[0]}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Earnings;
