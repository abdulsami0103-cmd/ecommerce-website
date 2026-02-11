import { useState, useCallback } from 'react';

const KeyIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
);

const CheckIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const TrashIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

/**
 * LicenseKeyManager Component - Upload and manage license keys for digital products
 */
const LicenseKeyManager = ({
  licenseKeys = [],
  onUploadKeys,
  onDeleteKey,
  onDeleteAllKeys,
  disabled = false,
  loading = false,
}) => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [keysInput, setKeysInput] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [filter, setFilter] = useState('all'); // all, available, used

  // Parse keys from textarea
  const parseKeys = (input) => {
    return input
      .split(/[\n,]/)
      .map(key => key.trim())
      .filter(key => key.length > 0);
  };

  const handleUpload = () => {
    const keys = parseKeys(keysInput);

    if (keys.length === 0) {
      setUploadError('Please enter at least one license key');
      return;
    }

    // Check for duplicates in input
    const uniqueKeys = [...new Set(keys)];
    if (uniqueKeys.length !== keys.length) {
      setUploadError(`Found ${keys.length - uniqueKeys.length} duplicate keys in your input`);
      return;
    }

    // Check for keys that already exist
    const existingKeys = licenseKeys.map(k => k.key);
    const duplicatesWithExisting = uniqueKeys.filter(k => existingKeys.includes(k));
    if (duplicatesWithExisting.length > 0) {
      setUploadError(`${duplicatesWithExisting.length} keys already exist in the system`);
      return;
    }

    onUploadKeys?.(uniqueKeys);
    setKeysInput('');
    setUploadError('');
    setShowUploadModal(false);
  };

  // Filter keys
  const filteredKeys = licenseKeys.filter(key => {
    if (filter === 'available') return !key.isUsed;
    if (filter === 'used') return key.isUsed;
    return true;
  });

  // Stats
  const stats = {
    total: licenseKeys.length,
    available: licenseKeys.filter(k => !k.isUsed).length,
    used: licenseKeys.filter(k => k.isUsed).length,
  };

  const previewCount = parseKeys(keysInput).length;

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex gap-3">
          <KeyIcon className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-purple-800">License Keys</h4>
            <p className="text-sm text-purple-700 mt-1">
              Upload unique license keys that will be automatically assigned to customers upon purchase.
              Each key can only be used once.
            </p>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-gray-900">{stats.total}</span>
          <span className="text-sm text-gray-500">Total Keys</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-green-600">{stats.available}</span>
          <span className="text-sm text-gray-500">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-gray-400">{stats.used}</span>
          <span className="text-sm text-gray-500">Used</span>
        </div>

        <div className="flex-1" />

        {/* Actions */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            disabled={disabled}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Keys
          </button>

          {stats.total > 0 && (
            <button
              type="button"
              onClick={() => {
                if (confirm('Are you sure you want to delete all unused keys?')) {
                  onDeleteAllKeys?.();
                }
              }}
              disabled={disabled || stats.available === 0}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
            >
              Clear Unused
            </button>
          )}
        </div>
      </div>

      {/* Low stock warning */}
      {stats.available < 5 && stats.available > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
          <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-amber-800">Low on License Keys</h4>
            <p className="text-sm text-amber-700">
              Only {stats.available} keys remaining. Consider adding more to avoid running out.
            </p>
          </div>
        </div>
      )}

      {stats.available === 0 && stats.total > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-red-800">No Keys Available</h4>
            <p className="text-sm text-red-700">
              All license keys have been used. Add more keys to continue selling.
            </p>
          </div>
        </div>
      )}

      {/* Keys list */}
      {licenseKeys.length > 0 && (
        <div>
          {/* Filter tabs */}
          <div className="flex gap-1 mb-4 border-b">
            {[
              { value: 'all', label: `All (${stats.total})` },
              { value: 'available', label: `Available (${stats.available})` },
              { value: 'used', label: `Used (${stats.used})` },
            ].map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setFilter(tab.value)}
                className={`
                  px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors
                  ${filter === tab.value
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Keys table */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Key</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Used At</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredKeys.slice(0, 50).map((key, index) => (
                  <tr key={key.key || index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-gray-900">
                      {key.isUsed ? (
                        <span className="text-gray-400">{key.key}</span>
                      ) : (
                        key.key
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {key.isUsed ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                          <CheckIcon className="w-3 h-3" />
                          Used
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                          Available
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {key.usedAt ? new Date(key.usedAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!key.isUsed && (
                        <button
                          type="button"
                          onClick={() => onDeleteKey?.(key.key)}
                          disabled={disabled}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                          title="Delete key"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredKeys.length > 50 && (
              <div className="px-4 py-3 bg-gray-50 text-sm text-gray-500 text-center">
                Showing 50 of {filteredKeys.length} keys
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {licenseKeys.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <KeyIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No License Keys</h3>
          <p className="text-sm text-gray-500 mb-4">
            Add license keys that will be assigned to customers upon purchase.
          </p>
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            disabled={disabled}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            Add License Keys
          </button>
        </div>
      )}

      {/* Upload modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4">Add License Keys</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enter Keys (one per line or comma-separated)
                </label>
                <textarea
                  value={keysInput}
                  onChange={(e) => {
                    setKeysInput(e.target.value);
                    setUploadError('');
                  }}
                  placeholder="ABCD-1234-EFGH-5678&#10;IJKL-9012-MNOP-3456&#10;..."
                  rows={10}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono text-sm resize-none"
                />
                <div className="flex justify-between mt-1">
                  <p className="text-xs text-gray-500">
                    One key per line or separated by commas
                  </p>
                  {previewCount > 0 && (
                    <p className="text-xs text-purple-600">
                      {previewCount} keys detected
                    </p>
                  )}
                </div>
              </div>

              {uploadError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {uploadError}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowUploadModal(false);
                  setKeysInput('');
                  setUploadError('');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={loading || previewCount === 0}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Uploading...
                  </>
                ) : (
                  `Add ${previewCount} Keys`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LicenseKeyManager;
