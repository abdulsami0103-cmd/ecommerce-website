import { useState, useCallback } from 'react';
import FileDropzone from '../common/FileDropzone';

const TrashIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const StarIcon = ({ className, filled }) => (
  <svg className={className} fill={filled ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const DragIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
  </svg>
);

/**
 * ImageUploader Component - Product image upload with preview grid
 */
const ImageUploader = ({
  images = [],
  onUpload,
  onDelete,
  onReorder,
  onSetPrimary,
  onUpdateAlt,
  maxImages = 10,
  uploading = false,
  disabled = false,
}) => {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [editingAlt, setEditingAlt] = useState(null);
  const [altText, setAltText] = useState('');

  const handleDrop = useCallback((files) => {
    if (onUpload && files.length > 0) {
      onUpload(files);
    }
  }, [onUpload]);

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...images];
    const [removed] = newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, removed);

    onReorder?.(newImages.map(img => img._id || img.id));
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleEditAlt = (image) => {
    setEditingAlt(image._id || image.id);
    setAltText(image.altText || '');
  };

  const handleSaveAlt = (imageId) => {
    onUpdateAlt?.(imageId, altText);
    setEditingAlt(null);
    setAltText('');
  };

  const remainingSlots = maxImages - images.length;

  return (
    <div className="space-y-4">
      {/* Upload area */}
      {remainingSlots > 0 && (
        <FileDropzone
          onDrop={handleDrop}
          accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif'] }}
          maxFiles={remainingSlots}
          multiple={true}
          disabled={disabled || uploading}
          previewType="image"
        >
          <div className="space-y-2 py-4">
            <div className="flex justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
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
              PNG, JPG, WEBP up to 10MB ({remainingSlots} of {maxImages} remaining)
            </p>
          </div>
        </FileDropzone>
      )}

      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {images.map((image, index) => (
            <div
              key={image._id || image.id || index}
              draggable={!disabled}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`
                relative aspect-square rounded-lg overflow-hidden border-2 group
                ${image.isPrimary ? 'border-sky-500' : 'border-gray-200'}
                ${draggedIndex === index ? 'opacity-50' : ''}
                ${!disabled ? 'cursor-move' : ''}
              `}
            >
              {/* Image */}
              <img
                src={image.thumbnails?.medium || image.url}
                alt={image.altText || 'Product image'}
                className="w-full h-full object-cover"
              />

              {/* Primary badge */}
              {image.isPrimary && (
                <div className="absolute top-2 left-2 bg-sky-500 text-white text-xs px-2 py-0.5 rounded-full">
                  Primary
                </div>
              )}

              {/* Drag handle */}
              {!disabled && (
                <div className="absolute top-2 right-2 p-1 bg-black/50 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  <DragIcon className="w-4 h-4 text-white" />
                </div>
              )}

              {/* Actions overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {/* Set as primary */}
                {!image.isPrimary && onSetPrimary && (
                  <button
                    type="button"
                    onClick={() => onSetPrimary(image._id || image.id)}
                    className="p-2 bg-white rounded-full hover:bg-gray-100"
                    title="Set as primary"
                  >
                    <StarIcon className="w-4 h-4 text-yellow-500" filled={false} />
                  </button>
                )}

                {/* Edit alt text */}
                {onUpdateAlt && (
                  <button
                    type="button"
                    onClick={() => handleEditAlt(image)}
                    className="p-2 bg-white rounded-full hover:bg-gray-100"
                    title="Edit alt text"
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                )}

                {/* Delete */}
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(image._id || image.id)}
                    className="p-2 bg-white rounded-full hover:bg-red-50"
                    title="Delete"
                  >
                    <TrashIcon className="w-4 h-4 text-red-500" />
                  </button>
                )}
              </div>

              {/* Alt text indicator */}
              {image.altText && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1 truncate">
                  {image.altText}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Alt text edit modal */}
      {editingAlt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Edit Alt Text</h3>
            <p className="text-sm text-gray-500 mb-4">
              Alt text helps with accessibility and SEO. Describe the image content.
            </p>
            <input
              type="text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Describe this image..."
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              maxLength={255}
            />
            <p className="text-xs text-gray-400 mt-1">{altText.length}/255 characters</p>
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setEditingAlt(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveAlt(editingAlt)}
                className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image count info */}
      <p className="text-sm text-gray-500">
        {images.length} of {maxImages} images uploaded
        {images.length > 0 && ' • Drag to reorder • First image is primary'}
      </p>
    </div>
  );
};

export default ImageUploader;
