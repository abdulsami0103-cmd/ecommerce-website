import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const PayoutHistory = () => {
  const [requests, setRequests] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState({
    amount: '',
    paymentMethodId: '',
    notes: '',
  });
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [requestsRes, walletRes, settingsRes] = await Promise.all([
        api.get('/payouts/requests'),
        api.get('/payouts/wallet'),
        api.get('/payouts/settings'),
      ]);
      setRequests(requestsRes.data.data || []);
      setWallet(walletRes.data.data);
      setSettings(settingsRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPayout = async (e) => {
    e.preventDefault();
    try {
      await api.post('/payouts/request', {
        amount: parseFloat(requestForm.amount),
        paymentMethodId: requestForm.paymentMethodId,
        notes: requestForm.notes,
      });
      setShowRequestModal(false);
      setRequestForm({ amount: '', paymentMethodId: '', notes: '' });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error requesting payout');
    }
  };

  const handleCancelRequest = async (id) => {
    if (!window.confirm('Cancel this payout request?')) return;
    try {
      await api.delete(`/payouts/requests/${id}`);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error cancelling request');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'requested':
        return 'bg-yellow-100 text-yellow-800';
      case 'under_review':
        return 'bg-blue-100 text-blue-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-200 text-green-900';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const canRequestPayout =
    wallet &&
    wallet.availableBalance >= (settings?.minimumWithdrawal || 1000) &&
    settings?.paymentMethods?.some((m) => m.isVerified);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-emerald-600">Payout History</h1>
        <button
          onClick={() => setShowRequestModal(true)}
          disabled={!canRequestPayout}
          className={`px-4 py-2 rounded-xl transition-colors ${
            canRequestPayout
              ? 'bg-emerald-500 text-white hover:bg-emerald-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Request Payout
        </button>
      </div>

      {/* Balance Summary */}
      {wallet && (
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Available Balance</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(wallet.availableBalance)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {formatCurrency(wallet.pendingBalance)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Reserved</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(wallet.reservedBalance)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Withdrawn</p>
              <p className="text-2xl font-bold">{formatCurrency(wallet.totalWithdrawn)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Requirements Notice */}
      {!canRequestPayout && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800">
            To request a payout, you need:
            <ul className="list-disc ml-6 mt-2">
              <li>
                Minimum available balance of{' '}
                {formatCurrency(settings?.minimumWithdrawal || 1000)}
                {wallet && wallet.availableBalance < (settings?.minimumWithdrawal || 1000) && (
                  <span className="text-red-600"> (current: {formatCurrency(wallet.availableBalance)})</span>
                )}
              </li>
              <li>
                At least one verified payment method
                {!settings?.paymentMethods?.some((m) => m.isVerified) && (
                  <span className="text-red-600">
                    {' '}
                    (<Link to="/vendor/payouts/settings" className="underline">add one</Link>)
                  </span>
                )}
              </li>
            </ul>
          </p>
        </div>
      )}

      {/* Payout Requests */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Net Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Method
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {requests.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                  No payout requests yet
                </td>
              </tr>
            ) : (
              requests.map((request) => (
                <tr key={request._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatCurrency(request.requestedAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>{formatCurrency(request.netAmount)}</div>
                    <div className="text-xs text-gray-400">
                      Fees: {formatCurrency(request.fees?.totalFees || 0)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap capitalize">
                    {request.paymentMethod?.type?.replace('_', ' ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${getStatusColor(request.status)}`}
                    >
                      {request.status.replace('_', ' ')}
                    </span>
                    {request.status === 'rejected' && request.rejectionReason && (
                      <p className="text-xs text-red-600 mt-1">{request.rejectionReason}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {request.status === 'requested' && (
                      <button
                        onClick={() => handleCancelRequest(request._id)}
                        className="text-red-600 hover:text-red-900 text-sm"
                      >
                        Cancel
                      </button>
                    )}
                    {request.status === 'completed' && request.transactionReference && (
                      <span className="text-xs text-gray-500">
                        Ref: {request.transactionReference}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Request Payout Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Request Payout</h2>
            <form onSubmit={handleRequestPayout}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (PKR)
                  </label>
                  <input
                    type="number"
                    value={requestForm.amount}
                    onChange={(e) =>
                      setRequestForm({ ...requestForm, amount: e.target.value })
                    }
                    className="w-full border rounded-lg px-3 py-2"
                    min={settings?.minimumWithdrawal || 1000}
                    max={wallet?.availableBalance || 0}
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Available: {formatCurrency(wallet?.availableBalance || 0)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={requestForm.paymentMethodId}
                    onChange={(e) =>
                      setRequestForm({ ...requestForm, paymentMethodId: e.target.value })
                    }
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  >
                    <option value="">Select payment method</option>
                    {settings?.paymentMethods
                      ?.filter((m) => m.isVerified)
                      .map((method) => (
                        <option key={method._id} value={method._id}>
                          {method.type.replace('_', ' ')} -{' '}
                          {method.type === 'bank_transfer'
                            ? method.details?.bankName
                            : method.type === 'paypal'
                            ? method.details?.email
                            : method.details?.mobileNumber}
                          {method.isDefault && ' (Default)'}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (optional)
                  </label>
                  <textarea
                    value={requestForm.notes}
                    onChange={(e) =>
                      setRequestForm({ ...requestForm, notes: e.target.value })
                    }
                    className="w-full border rounded-lg px-3 py-2"
                    rows="2"
                  />
                </div>

                {requestForm.amount && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Estimated fees:</span>{' '}
                      ~{formatCurrency(parseFloat(requestForm.amount) * 0.02 + 50)}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">You will receive:</span>{' '}
                      ~{formatCurrency(parseFloat(requestForm.amount) * 0.98 - 50)}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
                >
                  Request Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayoutHistory;
