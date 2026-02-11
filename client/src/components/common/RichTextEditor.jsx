import { useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

/**
 * RichTextEditor Component - Wrapper for ReactQuill with custom toolbar
 */
const RichTextEditor = ({
  value = '',
  onChange,
  placeholder = 'Write something...',
  disabled = false,
  minHeight = 200,
  maxLength,
  error,
  label,
  required = false,
  helperText,
}) => {
  // Custom toolbar configuration
  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'indent': '-1' }, { 'indent': '+1' }],
      ['link'],
      [{ 'align': [] }],
      ['clean'],
    ],
    clipboard: {
      matchVisual: false,
    },
  }), []);

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent',
    'link', 'align',
  ];

  const handleChange = (content, delta, source, editor) => {
    // Get text length without HTML
    const textLength = editor.getText().trim().length;

    if (maxLength && textLength > maxLength) {
      return;
    }

    onChange?.(content);
  };

  const getTextLength = () => {
    if (!value) return 0;
    // Create a temporary div to strip HTML
    const div = document.createElement('div');
    div.innerHTML = value;
    return div.textContent?.trim().length || 0;
  };

  const textLength = getTextLength();

  return (
    <div className="rich-text-editor">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div
        className={`
          border rounded-lg overflow-hidden
          ${error ? 'border-red-500' : 'border-gray-300'}
          ${disabled ? 'opacity-50 bg-gray-50' : ''}
        `}
      >
        <ReactQuill
          theme="snow"
          value={value}
          onChange={handleChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          readOnly={disabled}
          style={{ minHeight: `${minHeight}px` }}
        />
      </div>

      <div className="flex justify-between mt-1">
        <div>
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          {helperText && !error && (
            <p className="text-sm text-gray-500">{helperText}</p>
          )}
        </div>
        {maxLength && (
          <p className={`text-sm ${textLength > maxLength * 0.9 ? 'text-orange-500' : 'text-gray-400'}`}>
            {textLength}/{maxLength}
          </p>
        )}
      </div>

      {/* Custom styles */}
      <style>{`
        .rich-text-editor .ql-container {
          min-height: ${minHeight - 42}px;
          font-size: 14px;
          font-family: inherit;
        }
        .rich-text-editor .ql-editor {
          min-height: ${minHeight - 42}px;
        }
        .rich-text-editor .ql-toolbar {
          border: none;
          border-bottom: 1px solid #e5e7eb;
          background-color: #f9fafb;
        }
        .rich-text-editor .ql-container {
          border: none;
        }
        .rich-text-editor .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: normal;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
