import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

/**
 * BulkEditor Modal - Perform bulk operations on selected products
 */
const BulkEditor = ({
  isOpen,
  onClose,
  selectedProducts = [],
  onOperationComplete,
}) => {
  const [operationType, setOperationType] = useState('price');
  const [priceAction, setPriceAction] = useState('set');
  const [priceValue, setPriceValue] = useState('');
  const [stockAction, setStockAction] = useState('set');
  const [stockValue, setStockValue] = useState('');
  const [newStatus, setNewStatus] = useState('active');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setPriceValue('');
      setStockValue('');
      setProgress(null);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (selectedProducts.length === 0) {
      toast.error('No products selected');
      return;
    }

    let operationData = {
      type: operationType,
      productIds: selectedProducts.map(p => p._id || p.id),
    };

    switch (operationType) {
      case 'price':
        if (!priceValue) {
          toast.error('Please enter a price value');
          return;
        }
        operationData.operationData = {
          priceChange: priceAction,
          priceValue: parseFloat(priceValue),
        };
        break;
      case 'inventory':
        if (!stockValue) {
          toast.error('Please enter a stock value');
          return;
        }
        operationData.operationData = {
          inventoryChange: stockAction,
          inventoryValue: parseInt(stockValue),
        };
        break;
      case 'status':
        operationData.operationData = {
          newStatus,
        };
        break;
      case 'delete':
        if (!confirm(`Are you sure you want to delete ${selectedProducts.length} products? This cannot be undone.`)) {
          return;
        }
        break;
    }

    setLoading(true);
    setProgress({ processed: 0, total: selectedProducts.length, percentage: 0 });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/vendors/bulk-operations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(operationData),
      });

      const data = await response.json();

      if (data.success) {
        // Poll for progress if operation is async
        if (data.data?.status === 'processing') {
          pollProgress(data.data._id);
        } else {
          toast.success(data.message || 'Operation completed');
          setProgress({ processed: selectedProducts.length, total: selectedProducts.length, percentage: 100 });
          setTimeout(() => {
            onOperationComplete?.();
            onClose();
          }, 1000);
        }
      } else {
        toast.error(data.message || 'Operation failed');
        setLoading(false);
      }
    } catch (error) {
      toast.error('Failed to start operation');
      setLoading(false);
    }
  };

  const pollProgress = async (operationId) => {
    const token = localStorage.getItem('token');

    const checkProgress = async () => {
      try {
        const response = await fetch(`/api/vendors/bulk-operations/${operationId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();

        if (data.success) {
          const op = data.data;
          setProgress(op.progress);

          if (op.status === 'completed') {
            toast.success(`Updated ${op.progress.succeeded} products`);
            if (op.progress.failed > 0) {
              toast.error(`${op.progress.failed} products failed`);
            }
            setLoading(false);
            onOperationComplete?.();
            setTimeout(() => onClose(), 1500);
          } else if (op.status === 'failed') {
            toast.error('Operation failed');
            setLoading(false);
          } else {
            // Still processing, poll again
            setTimeout(checkProgress, 1000);
          }
        }
      } catch (error) {
        console.error('Failed to check progress:', error);
        setLoading(false);
      }
    };

    checkProgress();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Bulk Edit Products</h2>
          <p className="text-sm text-gray-500 mt-1">
            {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Operation Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Operation Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'price', label: 'Update Price', icon: '💰' },
                { value: 'inventory', label: 'Update Stock', icon: '📦' },
                { value: 'status', label: 'Change Status', icon: '🔄' },
                { value: 'delete', label: 'Delete Products', icon: '🗑️' },
              ].map((op) => (
                <button
                  key={op.value}
                  type="button"
                  onClick={() => setOperationType(op.value)}
                  disabled={loading}
                  className={`
                    p-3 rounded-lg border-2 text-left transition-colors
                    ${operationType === op.value
                      ? op.value === 'delete'
                        ? 'border-red-500 bg-red-50'
                        : 'border-sky-500 bg-sky-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }
                    ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <span className="text-xl">{op.icon}</span>
                  <p className="text-sm font-medium mt-1">{op.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Price Options */}
          {operationType === 'price' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Action
                </label>
                <select
                  value={priceAction}
                  onChange={(e) => setPriceAction(e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="set">Set price to</option>
                  <option value="increase">Increase by amount</option>
                  <option value="decrease">Decrease by amount</option>
                  <option value="percent_increase">Increase by percentage</option>
                  <option value="percent_decrease">Decrease by percentage</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {priceAction.includes('percent') ? 'Percentage' : 'Amount (PKR)'}
                </label>
                <input
                  type="number"
                  value={priceValue}
                  onChange={(e) => setPriceValue(e.target.value)}
                  disabled={loading}
                  min="0"
                  step={priceAction.includes('percent') ? '1' : '0.01'}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder={priceAction.includes('percent') ? 'e.g., 10' : 'e.g., 1000'}
                />
              </div>
            </div>
          )}

          {/* Inventory Options */}
          {operationType === 'inventory' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Action
                </label>
                <select
                  value={stockAction}
                  onChange={(e) => setStockAction(e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="set">Set stock to</option>
                  <option value="adjust">Adjust stock by</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  value={stockValue}
                  onChange={(e) => setStockValue(e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder={stockAction === 'adjust' ? 'e.g., -5 or 10' : 'e.g., 100'}
                />
                {stockAction === 'adjust' && (
                  <p className="text-xs text-gray-500 mt-1">
                    Use negative numbers to decrease stock
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Status Options */}
          {operationType === 'status' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          )}

          {/* Delete Warning */}
          {operationType === 'delete' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-red-800">Warning: This action cannot be undone</h4>
                  <p className="text-sm text-red-700 mt-1">
                    All selected products, their images, variants, and digital assets will be permanently deleted.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Progress */}
          {progress && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{progress.processed} / {progress.total}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-sky-600 h-2 rounded-full transition-all"
                  style={{ width: `${progress.percentage || 0}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className={`
              px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50
              ${operationType === 'delete'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-sky-600 hover:bg-sky-700'
              }
            `}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Processing...
              </span>
            ) : operationType === 'delete' ? (
              `Delete ${selectedProducts.length} Products`
            ) : (
              `Update ${selectedProducts.length} Products`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkEditor;
