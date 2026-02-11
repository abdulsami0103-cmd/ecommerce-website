import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

const UploadIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const FileIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const ImageIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

/**
 * FileDropzone Component - Reusable drag-drop file upload area
 *
 * Usage:
 * <FileDropzone
 *   onDrop={handleFiles}
 *   accept={{ 'image/*': ['.png', '.jpg', '.jpeg'] }}
 *   maxFiles={10}
 *   maxSize={10 * 1024 * 1024}
 *   multiple={true}
 * />
 */
const FileDropzone = ({
  onDrop,
  accept,
  maxFiles = 1,
  maxSize = 10 * 1024 * 1024, // 10MB default
  multiple = false,
  disabled = false,
  className = '',
  children,
  showPreview = false,
  previewType = 'image', // 'image' or 'file'
}) => {
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState([]);

  const handleDrop = useCallback((acceptedFiles, rejectedFiles) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const errorMessages = rejectedFiles.map(({ file, errors }) => ({
        name: file.name,
        errors: errors.map(e => e.message),
      }));
      setErrors(errorMessages);
    } else {
      setErrors([]);
    }

    // Handle accepted files
    if (acceptedFiles.length > 0) {
      const newFiles = acceptedFiles.map(file => ({
        file,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      }));

      if (showPreview) {
        setFiles(prev => (multiple ? [...prev, ...newFiles].slice(0, maxFiles) : newFiles));
      }

      onDrop?.(acceptedFiles);
    }
  }, [onDrop, multiple, maxFiles, showPreview]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop: handleDrop,
    accept,
    maxFiles: multiple ? maxFiles : 1,
    maxSize,
    multiple,
    disabled,
  });

  const removeFile = (index) => {
    setFiles(prev => {
      const newFiles = [...prev];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={className}>
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-colors duration-200
          ${isDragActive && !isDragReject ? 'border-sky-500 bg-sky-50' : ''}
          ${isDragReject ? 'border-red-500 bg-red-50' : ''}
          ${!isDragActive && !disabled ? 'border-gray-300 hover:border-gray-400' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}
        `}
      >
        <input {...getInputProps()} />

        {children || (
          <div className="space-y-2">
            <div className="flex justify-center">
              {previewType === 'image' ? (
                <ImageIcon className="w-12 h-12 text-gray-400" />
              ) : (
                <UploadIcon className="w-12 h-12 text-gray-400" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">
                {isDragActive ? (
                  isDragReject ? 'Some files will be rejected' : 'Drop files here'
                ) : (
                  <>
                    <span className="text-sky-600">Click to upload</span> or drag and drop
                  </>
                )}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {accept
                  ? Object.values(accept).flat().join(', ')
                  : 'All files accepted'}
                {maxSize && ` (max ${formatFileSize(maxSize)})`}
                {multiple && maxFiles > 1 && ` - up to ${maxFiles} files`}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error messages */}
      {errors.length > 0 && (
        <div className="mt-2 space-y-1">
          {errors.map((error, index) => (
            <p key={index} className="text-sm text-red-600">
              {error.name}: {error.errors.join(', ')}
            </p>
          ))}
        </div>
      )}

      {/* File previews */}
      {showPreview && files.length > 0 && (
        <div className={`mt-4 ${previewType === 'image' ? 'grid grid-cols-4 gap-4' : 'space-y-2'}`}>
          {files.map((item, index) => (
            <div
              key={index}
              className={`
                relative group
                ${previewType === 'image' ? 'aspect-square' : 'flex items-center p-3 bg-gray-50 rounded-lg'}
              `}
            >
              {previewType === 'image' && item.preview ? (
                <img
                  src={item.preview}
                  alt={item.file.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <>
                  <FileIcon className="w-8 h-8 text-gray-400 flex-shrink-0" />
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(item.file.size)}
                    </p>
                  </div>
                </>
              )}

              {/* Remove button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                className={`
                  absolute top-1 right-1 p-1 rounded-full
                  bg-red-500 text-white opacity-0 group-hover:opacity-100
                  transition-opacity duration-200
                  ${previewType === 'image' ? '' : 'relative opacity-100'}
                `}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileDropzone;
