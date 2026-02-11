import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const Wallet = () => {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [expectedEarnings, setExpectedEarnings] = useState(null);
  const [showExpectedBreakdown, setShowExpectedBreakdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });

  useEffect(() => {
    fetchWallet();
    fetchTransactions();
    fetchExpectedEarnings();
  }, [filter, pagination.page]);

  const fetchWallet = async () => {
    try {
      const res = await api.get('/payouts/wallet');
      setWallet(res.data.data);
    } catch (error) {
      console.error('Error fetching wallet:', error);
    }
  };

  const fetchExpectedEarnings = async () => {
    try {
      const res = await api.get('/payouts/wallet/expected');
      setExpectedEarnings(res.data.data);
    } catch (error) {
      console.error('Error fetching expected earnings:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = { page: pagination.page, limit: 20 };
      if (filter !== 'all') params.type = filter;

      const res = await api.get('/payouts/wallet/transactions', { params });
      setTransactions(res.data.data || []);
      setPagination(res.data.pagination || { page: 1, pages: 1 });
    } catch (error) {
      console.error('Error fetching transactions:', error);
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

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'credit':
        return '↓';
      case 'debit':
        return '↑';
      case 'hold':
        return '⏳';
      case 'release':
        return '✓';
      case 'refund':
        return '↩';
      default:
        return '•';
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'credit':
      case 'release':
        return 'text-green-600';
      case 'debit':
      case 'refund':
        return 'text-red-600';
      case 'hold':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading && !wallet) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-8">
      <div className="flex justify-between items-center mb-3 sm:mb-6">
        <h1 className="text-lg sm:text-2xl font-bold text-emerald-600">My Wallet</h1>
        <Link
          to="/vendor/payouts/request"
          className="bg-emerald-500 text-white px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl hover:bg-emerald-600 transition-colors text-[10px] sm:text-sm font-medium"
        >
          Request Payout
        </Link>
      </div>

      {/* Balance Cards */}
      {wallet && (
        <div className="grid grid-cols-3 gap-2 sm:gap-6 mb-3 sm:mb-8">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-2.5 sm:p-6">
            <div className="flex justify-between items-start">
              <div className="min-w-0">
                <p className="text-[9px] sm:text-sm text-gray-500 mb-0.5 sm:mb-1">Available</p>
                <p className="text-xs sm:text-3xl font-bold text-emerald-600 truncate">
                  {formatCurrency(wallet.availableBalance)}
                </p>
                <p className="text-[8px] sm:text-sm text-gray-400 mt-0.5 sm:mt-1 hidden sm:block">Ready to withdraw</p>
              </div>
              <div className="bg-emerald-100 p-1.5 sm:p-3 rounded-lg sm:rounded-xl shrink-0 hidden sm:block">
                <svg className="w-4 h-4 sm:w-6 sm:h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-2.5 sm:p-6">
            <div className="flex justify-between items-start">
              <div className="min-w-0">
                <p className="text-[9px] sm:text-sm text-gray-500 mb-0.5 sm:mb-1">Pending</p>
                <p className="text-xs sm:text-3xl font-bold text-amber-600 truncate">
                  {formatCurrency(wallet.pendingBalance)}
                </p>
                <p className="text-[8px] sm:text-sm text-gray-400 mt-0.5 sm:mt-1 hidden sm:block">Holding (7 days)</p>
              </div>
              <div className="bg-amber-100 p-1.5 sm:p-3 rounded-lg sm:rounded-xl shrink-0 hidden sm:block">
                <svg className="w-4 h-4 sm:w-6 sm:h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-2.5 sm:p-6">
            <div className="flex justify-between items-start">
              <div className="min-w-0">
                <p className="text-[9px] sm:text-sm text-gray-500 mb-0.5 sm:mb-1">Reserved</p>
                <p className="text-xs sm:text-3xl font-bold text-blue-600 truncate">
                  {formatCurrency(wallet.reservedBalance)}
                </p>
                <p className="text-[8px] sm:text-sm text-gray-400 mt-0.5 sm:mt-1 hidden sm:block">Payout requests</p>
              </div>
              <div className="bg-blue-100 p-1.5 sm:p-3 rounded-lg sm:rounded-xl shrink-0 hidden sm:block">
                <svg className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expected Earnings Card */}
      {expectedEarnings && expectedEarnings.totalExpected > 0 && (
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-6 mb-3 sm:mb-8 text-white">
          <div className="flex justify-between items-start mb-2 sm:mb-4">
            <div>
              <p className="text-[10px] sm:text-sm text-emerald-100 mb-0.5">Expected Earnings</p>
              <p className="text-lg sm:text-4xl font-bold">
                {formatCurrency(expectedEarnings.totalExpected)}
              </p>
              <p className="text-[9px] sm:text-sm text-emerald-200 mt-0.5">
                {expectedEarnings.orderCount} pending order(s)
              </p>
            </div>
            <div className="bg-white/20 p-2 sm:p-3 rounded-full hidden sm:block">
              <svg className="w-5 h-5 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-2 sm:mb-4">
            <div className="bg-white/10 rounded-lg sm:rounded-xl p-2 sm:p-3">
              <p className="text-[9px] sm:text-sm text-emerald-200">Paid Orders</p>
              <p className="text-xs sm:text-xl font-bold">{formatCurrency(expectedEarnings.paidOrdersExpected)}</p>
            </div>
            <div className="bg-white/10 rounded-lg sm:rounded-xl p-2 sm:p-3">
              <p className="text-[9px] sm:text-sm text-emerald-200">COD/Unpaid</p>
              <p className="text-xs sm:text-xl font-bold">{formatCurrency(expectedEarnings.unpaidOrdersExpected)}</p>
            </div>
          </div>

          <button
            onClick={() => setShowExpectedBreakdown(!showExpectedBreakdown)}
            className="text-[10px] sm:text-sm text-emerald-200 hover:text-white flex items-center gap-1"
          >
            {showExpectedBreakdown ? 'Hide' : 'Show'} Details
            <svg className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform ${showExpectedBreakdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showExpectedBreakdown && (
            <div className="mt-2 sm:mt-4 bg-white/10 rounded-lg sm:rounded-xl overflow-hidden">
              <table className="w-full text-[10px] sm:text-sm">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left p-1.5 sm:p-3">Order</th>
                    <th className="text-left p-1.5 sm:p-3">Status</th>
                    <th className="text-left p-1.5 sm:p-3">Pay</th>
                    <th className="text-right p-1.5 sm:p-3">Earning</th>
                  </tr>
                </thead>
                <tbody>
                  {expectedEarnings.breakdown?.map((order) => (
                    <tr key={order.subOrderId} className="border-b border-white/10">
                      <td className="p-1.5 sm:p-3">
                        <p className="font-medium truncate max-w-[80px] sm:max-w-none">{order.subOrderNumber}</p>
                      </td>
                      <td className="p-1.5 sm:p-3">
                        <span className={`px-1.5 py-0.5 rounded-full text-[8px] sm:text-xs ${
                          order.status === 'shipped' ? 'bg-blue-500/30' :
                          order.status === 'processing' ? 'bg-yellow-500/30' :
                          order.status === 'confirmed' ? 'bg-green-500/30' :
                          'bg-gray-500/30'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="p-1.5 sm:p-3">
                        <span className={`px-1.5 py-0.5 rounded-full text-[8px] sm:text-xs ${
                          order.paymentStatus === 'paid' ? 'bg-green-500/30' : 'bg-orange-500/30'
                        }`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="p-1.5 sm:p-3 text-right font-medium">
                        {formatCurrency(order.vendorEarning)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Lifetime Stats */}
      {wallet && (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-3 sm:p-6 mb-3 sm:mb-8">
          <h3 className="font-semibold text-gray-900 mb-2 sm:mb-4 text-xs sm:text-base">Lifetime Statistics</h3>
          <div className="grid grid-cols-4 gap-1.5 sm:gap-4">
            <div className="bg-gray-50 rounded-lg sm:rounded-xl p-2 sm:p-4">
              <p className="text-[9px] sm:text-sm text-gray-500">Earned</p>
              <p className="text-[11px] sm:text-xl font-bold text-gray-900 truncate">{formatCurrency(wallet.totalEarned)}</p>
            </div>
            <div className="bg-red-50 rounded-lg sm:rounded-xl p-2 sm:p-4">
              <p className="text-[9px] sm:text-sm text-gray-500">Commission</p>
              <p className="text-[11px] sm:text-xl font-bold text-red-600 truncate">{formatCurrency(wallet.totalCommissionPaid)}</p>
            </div>
            <div className="bg-blue-50 rounded-lg sm:rounded-xl p-2 sm:p-4">
              <p className="text-[9px] sm:text-sm text-gray-500">Withdrawn</p>
              <p className="text-[11px] sm:text-xl font-bold text-blue-600 truncate">{formatCurrency(wallet.totalWithdrawn)}</p>
            </div>
            <div className="bg-emerald-50 rounded-lg sm:rounded-xl p-2 sm:p-4">
              <p className="text-[9px] sm:text-sm text-gray-500">Net</p>
              <p className="text-[11px] sm:text-xl font-bold text-emerald-600 truncate">
                {formatCurrency(wallet.totalEarned - wallet.totalCommissionPaid)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Transactions */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm">
        <div className="p-2.5 sm:p-4 border-b">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-900 text-xs sm:text-base">Transactions</h3>
            <div className="flex gap-1 sm:gap-2">
              {['all', 'credit', 'debit', 'hold', 'release'].map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setFilter(type);
                    setPagination({ ...pagination, page: 1 });
                  }}
                  className={`px-1.5 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg text-[9px] sm:text-sm transition-colors ${
                    filter === type
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="divide-y">
          {loading ? (
            <div className="p-4 sm:p-8 text-center">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-indigo-600 mx-auto"></div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-4 sm:p-8 text-center text-xs sm:text-base text-gray-500">No transactions found</div>
          ) : (
            transactions.map((tx) => (
              <div key={tx._id} className="px-2.5 py-2 sm:p-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                  <div className={`text-base sm:text-2xl shrink-0 ${getTransactionColor(tx.type)}`}>
                    {getTransactionIcon(tx.type)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-base font-medium capitalize truncate">
                      {tx.category?.replace('_', ' ')} - {tx.type}
                    </p>
                    <p className="text-[9px] sm:text-sm text-gray-500">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </p>
                    {tx.description && (
                      <p className="text-[9px] sm:text-sm text-gray-400 truncate">{tx.description}</p>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-[11px] sm:text-base font-bold ${getTransactionColor(tx.type)}`}>
                    {tx.type === 'debit' || tx.type === 'refund' ? '-' : '+'}
                    {formatCurrency(tx.amount)}
                  </p>
                  {tx.balanceAfter && (
                    <p className="text-[9px] sm:text-sm text-gray-400">
                      {tx.type === 'credit' && tx.category === 'sale' ? (
                        <>Pend: {formatCurrency(tx.balanceAfter.pending)}</>
                      ) : tx.type === 'release' ? (
                        <>Avail: {formatCurrency(tx.balanceAfter.available)}</>
                      ) : tx.type === 'hold' ? (
                        <>Resv: {formatCurrency(tx.balanceAfter.reserved)}</>
                      ) : (
                        <>Bal: {formatCurrency(tx.balanceAfter.available)}</>
                      )}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="p-2.5 sm:p-4 border-t flex justify-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              disabled={pagination.page === 1}
              className="px-2 py-1 sm:px-3 sm:py-1 border rounded text-[10px] sm:text-sm disabled:opacity-50"
            >
              Prev
            </button>
            <span className="px-2 py-1 text-[10px] sm:text-sm">
              {pagination.page}/{pagination.pages}
            </span>
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              disabled={pagination.page === pagination.pages}
              className="px-2 py-1 sm:px-3 sm:py-1 border rounded text-[10px] sm:text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wallet;
