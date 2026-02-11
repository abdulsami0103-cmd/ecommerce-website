import { useState, useCallback, useMemo } from 'react';

const PlusIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const TrashIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

/**
 * OptionBuilder - Component to define variant options (Size, Color, etc.)
 */
const OptionBuilder = ({ options, onChange, maxOptions = 3, disabled }) => {
  const addOption = () => {
    if (options.length < maxOptions) {
      onChange([...options, { name: '', values: [] }]);
    }
  };

  const updateOption = (index, field, value) => {
    const updated = [...options];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const updateOptionValues = (index, valuesString) => {
    const values = valuesString
      .split(',')
      .map(v => v.trim())
      .filter(Boolean);
    updateOption(index, 'values', values);
  };

  const removeOption = (index) => {
    onChange(options.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {options.map((option, index) => (
        <div key={index} className="flex gap-4 items-start p-4 bg-gray-50 rounded-lg">
          <div className="flex-1 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Option Name
              </label>
              <input
                type="text"
                value={option.name}
                onChange={(e) => updateOption(index, 'name', e.target.value)}
                placeholder="e.g., Size, Color, Material"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                disabled={disabled}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Option Values (comma separated)
              </label>
              <input
                type="text"
                value={option.values.join(', ')}
                onChange={(e) => updateOptionValues(index, e.target.value)}
                placeholder="e.g., Small, Medium, Large"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                disabled={disabled}
              />
              {option.values.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {option.values.map((value, vIndex) => (
                    <span
                      key={vIndex}
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-sky-100 text-sky-800"
                    >
                      {value}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => removeOption(index)}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
            disabled={disabled}
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      ))}

      {options.length < maxOptions && (
        <button
          type="button"
          onClick={addOption}
          disabled={disabled}
          className="flex items-center gap-2 px-4 py-2 text-sky-600 hover:bg-sky-50 rounded-lg border border-dashed border-sky-300"
        >
          <PlusIcon className="w-4 h-4" />
          Add Option ({options.length}/{maxOptions})
        </button>
      )}
    </div>
  );
};

/**
 * VariantTable - Editable table for variant details
 */
const VariantTable = ({ variants, onUpdate, basePrice, disabled }) => {
  const [editingCell, setEditingCell] = useState(null);

  const handleCellChange = (variantId, field, value) => {
    onUpdate(variantId, { [field]: value });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (variants.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No variants generated yet. Add options above to create variants.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Variant</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">SKU</th>
            <th className="px-4 py-3 text-right font-medium text-gray-500">Price</th>
            <th className="px-4 py-3 text-right font-medium text-gray-500">Stock</th>
            <th className="px-4 py-3 text-center font-medium text-gray-500">Active</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {variants.map((variant) => (
            <tr key={variant._id || variant.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium">{variant.title}</td>
              <td className="px-4 py-3">
                <input
                  type="text"
                  value={variant.sku || ''}
                  onChange={(e) => handleCellChange(variant._id || variant.id, 'sku', e.target.value)}
                  placeholder="SKU"
                  className="w-full px-2 py-1 border rounded focus:ring-1 focus:ring-sky-500"
                  disabled={disabled}
                />
              </td>
              <td className="px-4 py-3 text-right">
                <input
                  type="number"
                  value={variant.price || basePrice || 0}
                  onChange={(e) => handleCellChange(variant._id || variant.id, 'price', parseFloat(e.target.value) || 0)}
                  className="w-24 px-2 py-1 border rounded text-right focus:ring-1 focus:ring-sky-500"
                  min="0"
                  step="0.01"
                  disabled={disabled}
                />
              </td>
              <td className="px-4 py-3 text-right">
                <input
                  type="number"
                  value={variant.quantity || 0}
                  onChange={(e) => handleCellChange(variant._id || variant.id, 'quantity', parseInt(e.target.value) || 0)}
                  className="w-20 px-2 py-1 border rounded text-right focus:ring-1 focus:ring-sky-500"
                  min="0"
                  disabled={disabled}
                />
              </td>
              <td className="px-4 py-3 text-center">
                <input
                  type="checkbox"
                  checked={variant.isActive !== false}
                  onChange={(e) => handleCellChange(variant._id || variant.id, 'isActive', e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-500"
                  disabled={disabled}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * BulkEditor - Quick actions to update all variants
 */
const BulkEditor = ({ onApply, disabled }) => {
  const [action, setAction] = useState('price');
  const [method, setMethod] = useState('set');
  const [value, setValue] = useState('');

  const handleApply = () => {
    if (value === '') return;
    onApply({ field: action, action: method, value: parseFloat(value) });
    setValue('');
  };

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 rounded-lg">
      <span className="text-sm font-medium text-gray-700">Bulk Update:</span>
      <select
        value={action}
        onChange={(e) => setAction(e.target.value)}
        className="px-3 py-1.5 border rounded-lg text-sm"
        disabled={disabled}
      >
        <option value="price">Price</option>
        <option value="quantity">Stock</option>
      </select>
      <select
        value={method}
        onChange={(e) => setMethod(e.target.value)}
        className="px-3 py-1.5 border rounded-lg text-sm"
        disabled={disabled}
      >
        <option value="set">Set to</option>
        {action === 'price' && (
          <>
            <option value="increase">Increase by</option>
            <option value="decrease">Decrease by</option>
            <option value="percent_increase">Increase by %</option>
            <option value="percent_decrease">Decrease by %</option>
          </>
        )}
        {action === 'quantity' && (
          <option value="adjust">Adjust by</option>
        )}
      </select>
      <input
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Value"
        className="w-24 px-3 py-1.5 border rounded-lg text-sm"
        disabled={disabled}
      />
      <button
        type="button"
        onClick={handleApply}
        disabled={disabled || value === ''}
        className="px-4 py-1.5 bg-sky-600 text-white rounded-lg text-sm hover:bg-sky-700 disabled:opacity-50"
      >
        Apply to All
      </button>
    </div>
  );
};

/**
 * VariantManager - Main component for managing product variants
 */
const VariantManager = ({
  hasVariants,
  onToggleVariants,
  options = [],
  onOptionsChange,
  variants = [],
  onVariantsChange,
  onGenerateVariants,
  onBulkUpdate,
  basePrice = 0,
  disabled = false,
  loading = false,
}) => {
  // Calculate variant count preview
  const previewCount = useMemo(() => {
    if (options.length === 0) return 0;
    return options.reduce((total, opt) => {
      const count = opt.values?.length || 0;
      return total * (count || 1);
    }, 1);
  }, [options]);

  const handleUpdateVariant = (variantId, updates) => {
    const updatedVariants = variants.map(v =>
      (v._id || v.id) === variantId ? { ...v, ...updates } : v
    );
    onVariantsChange?.(updatedVariants);
  };

  return (
    <div className="space-y-6">
      {/* Toggle variants */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <h4 className="font-medium">This product has multiple variants</h4>
          <p className="text-sm text-gray-500">
            Enable this if your product comes in different sizes, colors, etc.
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={hasVariants}
            onChange={(e) => onToggleVariants?.(e.target.checked)}
            className="sr-only peer"
            disabled={disabled}
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
        </label>
      </div>

      {hasVariants && (
        <>
          {/* Option Builder */}
          <div>
            <h4 className="font-medium mb-3">Define Options</h4>
            <OptionBuilder
              options={options}
              onChange={onOptionsChange}
              maxOptions={3}
              disabled={disabled || loading}
            />
          </div>

          {/* Generate button */}
          {options.length > 0 && options.some(o => o.name && o.values.length > 0) && (
            <div className="flex items-center justify-between p-4 bg-sky-50 rounded-lg">
              <div>
                <p className="text-sm text-sky-800">
                  This will generate <strong>{previewCount}</strong> variant{previewCount !== 1 ? 's' : ''}
                </p>
                {variants.length > 0 && (
                  <p className="text-xs text-sky-600">
                    Warning: This will replace existing variants
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onGenerateVariants}
                disabled={disabled || loading}
                className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50"
              >
                {loading ? 'Generating...' : 'Generate Variants'}
              </button>
            </div>
          )}

          {/* Bulk Editor */}
          {variants.length > 0 && (
            <BulkEditor
              onApply={onBulkUpdate}
              disabled={disabled || loading}
            />
          )}

          {/* Variant Table */}
          {variants.length > 0 && (
            <div>
              <h4 className="font-medium mb-3">Variants ({variants.length})</h4>
              <VariantTable
                variants={variants}
                onUpdate={handleUpdateVariant}
                basePrice={basePrice}
                disabled={disabled || loading}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VariantManager;
