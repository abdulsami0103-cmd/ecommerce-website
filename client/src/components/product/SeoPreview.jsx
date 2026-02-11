import { useState, useEffect } from 'react';

/**
 * SeoPreview Component - Google SERP preview with SEO fields
 */
const SeoPreview = ({
  title = '',
  description = '',
  urlHandle = '',
  baseUrl = 'www.example.com',
  productName = '',
  onTitleChange,
  onDescriptionChange,
  onUrlHandleChange,
  disabled = false,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Auto-generate URL handle from product name
  const generateUrlHandle = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // Auto-suggest title if empty
  const displayTitle = title || productName || 'Product Title';
  const displayDescription = description || 'Add a meta description to improve your search engine visibility...';
  const displayUrl = urlHandle || generateUrlHandle(productName) || 'product-url';

  const titleLength = title.length;
  const descriptionLength = description.length;

  const getTitleStatus = () => {
    if (titleLength === 0) return { color: 'gray', text: 'Not set' };
    if (titleLength < 30) return { color: 'orange', text: 'Too short' };
    if (titleLength > 60) return { color: 'red', text: 'Too long' };
    return { color: 'green', text: 'Good' };
  };

  const getDescriptionStatus = () => {
    if (descriptionLength === 0) return { color: 'gray', text: 'Not set' };
    if (descriptionLength < 70) return { color: 'orange', text: 'Too short' };
    if (descriptionLength > 160) return { color: 'red', text: 'Too long' };
    return { color: 'green', text: 'Good' };
  };

  const titleStatus = getTitleStatus();
  const descriptionStatus = getDescriptionStatus();

  const statusColors = {
    gray: 'text-gray-500',
    orange: 'text-orange-500',
    red: 'text-red-500',
    green: 'text-green-500',
  };

  return (
    <div className="space-y-6">
      {/* Google SERP Preview */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Search Engine Preview</h4>
        <div className="border rounded-lg p-4 bg-white">
          <div className="max-w-2xl">
            {/* URL */}
            <div className="text-sm text-green-700 mb-1">
              {baseUrl} › products › {displayUrl}
            </div>

            {/* Title */}
            <h3 className="text-xl text-blue-800 hover:underline cursor-pointer mb-1 line-clamp-1">
              {displayTitle.slice(0, 60)}{displayTitle.length > 60 ? '...' : ''}
            </h3>

            {/* Description */}
            <p className="text-sm text-gray-600 line-clamp-2">
              {displayDescription.slice(0, 160)}{displayDescription.length > 160 ? '...' : ''}
            </p>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          This is a preview of how your product might appear in search results
        </p>
      </div>

      {/* SEO Fields */}
      <div className="space-y-4">
        {/* Meta Title */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-gray-700">
              Meta Title
            </label>
            <span className={`text-xs ${statusColors[titleStatus.color]}`}>
              {titleLength}/60 • {titleStatus.text}
            </span>
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange?.(e.target.value)}
            placeholder={productName || 'Enter meta title...'}
            maxLength={70}
            disabled={disabled}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Recommended: 50-60 characters. Shown as the clickable headline in search results.
          </p>
        </div>

        {/* Meta Description */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-gray-700">
              Meta Description
            </label>
            <span className={`text-xs ${statusColors[descriptionStatus.color]}`}>
              {descriptionLength}/160 • {descriptionStatus.text}
            </span>
          </div>
          <textarea
            value={description}
            onChange={(e) => onDescriptionChange?.(e.target.value)}
            placeholder="Enter a compelling description for search engines..."
            rows={3}
            maxLength={160}
            disabled={disabled}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            Recommended: 120-160 characters. Describe your product to attract clicks.
          </p>
        </div>

        {/* URL Handle */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-sky-600 hover:text-sky-700 flex items-center gap-1"
          >
            <svg
              className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Advanced SEO Settings
          </button>

          {showAdvanced && (
            <div className="mt-3 p-4 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL Handle
              </label>
              <div className="flex items-center">
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-2 border border-r-0 rounded-l-lg">
                  /products/
                </span>
                <input
                  type="text"
                  value={urlHandle}
                  onChange={(e) => {
                    const value = e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, '-')
                      .replace(/-+/g, '-');
                    onUrlHandleChange?.(value);
                  }}
                  placeholder={generateUrlHandle(productName) || 'product-url-handle'}
                  disabled={disabled}
                  className="flex-1 px-3 py-2 border rounded-r-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Customize the URL for this product. Use lowercase letters, numbers, and hyphens only.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* SEO Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h5 className="text-sm font-medium text-blue-800 mb-2">SEO Tips</h5>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Include your main keyword in the meta title</li>
          <li>• Write unique descriptions for each product</li>
          <li>• Use action words like "Buy", "Shop", "Get" in descriptions</li>
          <li>• Keep URLs short and descriptive</li>
        </ul>
      </div>
    </div>
  );
};

export default SeoPreview;
