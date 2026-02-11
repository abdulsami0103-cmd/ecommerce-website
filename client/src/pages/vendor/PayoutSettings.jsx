import { useState, useEffect } from 'react';
import api from '../../services/api';

const PayoutSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddMethod, setShowAddMethod] = useState(false);
  const [methodForm, setMethodForm] = useState({
    type: 'bank_transfer',
    details: {},
    isDefault: false,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/payouts/settings');
      setSettings(res.data.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async (updates) => {
    try {
      await api.put('/payouts/settings', updates);
      fetchSettings();
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating settings');
    }
  };

  const handleAddMethod = async (e) => {
    e.preventDefault();
    try {
      await api.post('/payouts/settings/methods', methodForm);
      setShowAddMethod(false);
      setMethodForm({ type: 'bank_transfer', details: {}, isDefault: false });
      fetchSettings();
    } catch (error) {
      alert(error.response?.data?.message || 'Error adding payment method');
    }
  };

  const handleRemoveMethod = async (methodId) => {
    if (!window.confirm('Remove this payment method?')) return;
    try {
      await api.delete(`/payouts/settings/methods/${methodId}`);
      fetchSettings();
    } catch (error) {
      alert(error.response?.data?.message || 'Error removing payment method');
    }
  };

  const handleSetDefault = async (methodId) => {
    try {
      await api.put(`/payouts/settings/methods/${methodId}`, { isDefault: true });
      fetchSettings();
    } catch (error) {
      alert(error.response?.data?.message || 'Error setting default');
    }
  };

  const getMethodFields = (type) => {
    switch (type) {
      case 'bank_transfer':
        return [
          { name: 'bankName', label: 'Bank Name', type: 'text', required: true },
          { name: 'accountTitle', label: 'Account Title', type: 'text', required: true },
          { name: 'accountNumber', label: 'Account Number', type: 'text', required: true },
          { name: 'branchCode', label: 'Branch Code', type: 'text' },
          { name: 'iban', label: 'IBAN', type: 'text' },
        ];
      case 'easypaisa':
      case 'jazzcash':
        return [
          { name: 'mobileNumber', label: 'Mobile Number', type: 'tel', required: true },
          { name: 'accountTitle', label: 'Account Title', type: 'text', required: true },
        ];
      case 'paypal':
        return [
          { name: 'email', label: 'PayPal Email', type: 'email', required: true },
        ];
      case 'stripe':
        return [
          { name: 'stripeAccountId', label: 'Stripe Account ID', type: 'text', required: true },
        ];
      default:
        return [];
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-emerald-600 mb-6">Payout Settings</h1>

      {/* General Settings */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="font-medium mb-4">General Settings</h3>
        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Withdrawal Amount (PKR)
            </label>
            <input
              type="number"
              value={settings?.minimumWithdrawal || 1000}
              onChange={(e) =>
                handleUpdateSettings({ minimumWithdrawal: parseInt(e.target.value) })
              }
              className="w-48 border rounded-lg px-3 py-2"
              min="1000"
              step="500"
            />
            <p className="text-sm text-gray-500 mt-1">Minimum: PKR 1,000</p>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings?.autoWithdraw || false}
                onChange={(e) => handleUpdateSettings({ autoWithdraw: e.target.checked })}
                className="rounded"
              />
              <span className="font-medium">Enable Auto-Withdrawal</span>
            </label>
            <p className="text-sm text-gray-500 ml-6">
              Automatically request withdrawal when balance exceeds threshold
            </p>
          </div>

          {settings?.autoWithdraw && (
            <div className="ml-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Auto-Withdrawal Threshold (PKR)
              </label>
              <input
                type="number"
                value={settings?.autoWithdrawThreshold || 10000}
                onChange={(e) =>
                  handleUpdateSettings({ autoWithdrawThreshold: parseInt(e.target.value) })
                }
                className="w-48 border rounded-lg px-3 py-2"
                min="5000"
                step="1000"
              />
            </div>
          )}
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium">Payment Methods</h3>
          <button
            onClick={() => setShowAddMethod(true)}
            className="bg-emerald-500 text-white px-4 py-2 rounded-xl hover:bg-emerald-600 transition-colors"
          >
            Add Method
          </button>
        </div>

        <div className="space-y-4">
          {settings?.paymentMethods?.length === 0 && (
            <p className="text-gray-500 text-center py-8">
              No payment methods configured. Add one to receive payouts.
            </p>
          )}

          {settings?.paymentMethods?.map((method) => (
            <div
              key={method._id}
              className={`border rounded-lg p-4 ${method.isDefault ? 'border-indigo-500' : ''}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium capitalize">
                      {method.type.replace('_', ' ')}
                    </span>
                    {method.isDefault && (
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                        Default
                      </span>
                    )}
                    {method.isVerified ? (
                      <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                        Verified
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                        Pending Verification
                      </span>
                    )}
                  </div>

                  <div className="text-sm text-gray-600 space-y-1">
                    {method.type === 'bank_transfer' && (
                      <>
                        <p>Bank: {method.details?.bankName}</p>
                        <p>Account: {method.details?.accountTitle}</p>
                        <p>
                          Number: ****
                          {method.details?.accountNumber?.slice(-4)}
                        </p>
                      </>
                    )}
                    {(method.type === 'easypaisa' || method.type === 'jazzcash') && (
                      <>
                        <p>Mobile: {method.details?.mobileNumber}</p>
                        <p>Title: {method.details?.accountTitle}</p>
                      </>
                    )}
                    {method.type === 'paypal' && (
                      <p>Email: {method.details?.email}</p>
                    )}
                    {method.type === 'stripe' && (
                      <p>Account: {method.details?.stripeAccountId}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  {!method.isDefault && (
                    <button
                      onClick={() => handleSetDefault(method._id)}
                      className="text-indigo-600 hover:underline text-sm"
                    >
                      Set Default
                    </button>
                  )}
                  <button
                    onClick={() => handleRemoveMethod(method._id)}
                    className="text-red-600 hover:underline text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Method Modal */}
      {showAddMethod && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Add Payment Method</h2>
            <form onSubmit={handleAddMethod}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Method Type
                  </label>
                  <select
                    value={methodForm.type}
                    onChange={(e) =>
                      setMethodForm({ ...methodForm, type: e.target.value, details: {} })
                    }
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="easypaisa">Easypaisa</option>
                    <option value="jazzcash">JazzCash</option>
                    <option value="paypal">PayPal</option>
                    <option value="stripe">Stripe</option>
                  </select>
                </div>

                {getMethodFields(methodForm.type).map((field) => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                      {field.required && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type={field.type}
                      value={methodForm.details[field.name] || ''}
                      onChange={(e) =>
                        setMethodForm({
                          ...methodForm,
                          details: { ...methodForm.details, [field.name]: e.target.value },
                        })
                      }
                      className="w-full border rounded-lg px-3 py-2"
                      required={field.required}
                    />
                  </div>
                ))}

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={methodForm.isDefault}
                    onChange={(e) =>
                      setMethodForm({ ...methodForm, isDefault: e.target.checked })
                    }
                    className="rounded"
                  />
                  Set as default payment method
                </label>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddMethod(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Add Method
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayoutSettings;
