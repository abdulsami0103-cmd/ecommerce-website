import { useState, useCallback } from 'react';
import FileDropzone from '../common/FileDropzone';

const FileIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const DownloadIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const TrashIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (mimeType) => {
  if (mimeType?.includes('pdf')) return '📄';
  if (mimeType?.includes('zip') || mimeType?.includes('rar')) return '📦';
  if (mimeType?.includes('video')) return '🎬';
  if (mimeType?.includes('audio')) return '🎵';
  if (mimeType?.includes('image')) return '🖼️';
  return '📁';
};

/**
 * DigitalFileUpload Component - Upload and manage digital product files
 */
const DigitalFileUpload = ({
  assets = [],
  onUpload,
  onDelete,
  onUpdateSettings,
  uploading = false,
  disabled = false,
  maxFiles = 5,
  maxSize = 500 * 1024 * 1024, // 500MB default
}) => {
  const [editingAsset, setEditingAsset] = useState(null);
  const [settings, setSettings] = useState({
    downloadLimit: 0,
    expiryHours: 0,
  });

  const handleDrop = useCallback((files) => {
    if (onUpload && files.length > 0) {
      onUpload(files);
    }
  }, [onUpload]);

  const handleEditSettings = (asset) => {
    setEditingAsset(asset._id || asset.id);
    setSettings({
      downloadLimit: asset.downloadLimit || 0,
      expiryHours: asset.expiryHours || 0,
    });
  };

  const handleSaveSettings = () => {
    if (editingAsset) {
      onUpdateSettings?.(editingAsset, settings);
      setEditingAsset(null);
    }
  };

  const remainingSlots = maxFiles - assets.length;

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-amber-800">Digital Product Files</h4>
            <p className="text-sm text-amber-700 mt-1">
              Upload files that customers will receive after purchase. Files are stored securely and delivered via time-limited download links.
            </p>
          </div>
        </div>
      </div>

      {/* Upload area */}
      {remainingSlots > 0 && (
        <FileDropzone
          onDrop={handleDrop}
          accept={{
            'application/pdf': ['.pdf'],
            'application/zip': ['.zip'],
            'application/x-rar-compressed': ['.rar'],
            'video/*': ['.mp4', '.mov', '.avi'],
            'audio/*': ['.mp3', '.wav', '.flac'],
            'image/*': ['.png', '.jpg', '.jpeg', '.psd', '.ai'],
          }}
          maxFiles={remainingSlots}
          maxSize={maxSize}
          multiple={remainingSlots > 1}
          disabled={disabled || uploading}
        >
          <div className="space-y-2 py-4">
            <div className="flex justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-sm text-gray-600">
              {uploading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Uploading...
                </span>
              ) : (
                <>
                  <span className="text-sky-600 font-medium">Click to upload</span> or drag and drop
                </>
              )}
            </p>
            <p className="text-xs text-gray-500">
              PDF, ZIP, Video, Audio up to {formatFileSize(maxSize)} ({remainingSlots} of {maxFiles} remaining)
            </p>
          </div>
        </FileDropzone>
      )}

      {/* Uploaded files list */}
      {assets.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Uploaded Files ({assets.length})</h4>

          {assets.map((asset) => (
            <div
              key={asset._id || asset.id}
              className="border rounded-lg p-4 bg-white"
            >
              <div className="flex items-start gap-4">
                {/* File icon */}
                <div className="text-3xl">
                  {getFileIcon(asset.mimeType)}
                </div>

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <h5 className="font-medium text-gray-900 truncate">
                    {asset.originalName || asset.filename}
                  </h5>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(asset.size)} • {asset.mimeType}
                  </p>

                  {/* Settings summary */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
                      Downloads: {asset.downloadLimit || 'Unlimited'}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
                      Expires: {asset.expiryHours ? `${asset.expiryHours}h` : 'Never'}
                    </span>
                    {asset.version && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
                        v{asset.version}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleEditSettings(asset)}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                    title="Settings"
                    disabled={disabled}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete?.(asset._id || asset.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    title="Delete"
                    disabled={disabled}
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Settings modal */}
      {editingAsset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Download Settings</h3>

            <div className="space-y-4">
              {/* Download limit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Download Limit
                </label>
                <input
                  type="number"
                  value={settings.downloadLimit}
                  onChange={(e) => setSettings({ ...settings, downloadLimit: parseInt(e.target.value) || 0 })}
                  min="0"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Set to 0 for unlimited downloads
                </p>
              </div>

              {/* Expiry hours */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link Expiry (hours)
                </label>
                <input
                  type="number"
                  value={settings.expiryHours}
                  onChange={(e) => setSettings({ ...settings, expiryHours: parseInt(e.target.value) || 0 })}
                  min="0"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Set to 0 for links that never expire
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setEditingAsset(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSettings}
                className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {assets.length === 0 && !uploading && (
        <p className="text-sm text-gray-500 text-center py-4">
          No files uploaded yet. Upload files that customers will receive after purchase.
        </p>
      )}
    </div>
  );
};

export default DigitalFileUpload;
