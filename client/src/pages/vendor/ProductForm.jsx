import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

import { Tabs, TabPanel } from '../../components/common/Tabs';
import { Button, Loading } from '../../components/common';
import ImageUploader from '../../components/product/ImageUploader';
import VariantManager from '../../components/product/VariantManager';
import RichTextEditor from '../../components/common/RichTextEditor';
import SeoPreview from '../../components/product/SeoPreview';
import DigitalFileUpload from '../../components/product/DigitalFileUpload';
import LicenseKeyManager from '../../components/product/LicenseKeyManager';
import productService from '../../services/productService';

// Icons
const SaveIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
  </svg>
);

const BackIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

// API base URL
const API_BASE = '/api/products';

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isEditing = !!id;

  // Form state
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  // Product data
  const [product, setProduct] = useState({
    name: '',
    description: '',
    shortDescription: '',
    type: 'physical',
    category: '',
    status: 'draft',
    tags: [],
    price: { amount: 0, compareAt: null, currency: 'PKR' },
    inventory: {
      sku: '',
      quantity: 0,
      trackInventory: true,
      lowStockThreshold: 10,
    },
    seo: { metaTitle: '', metaDescription: '', urlHandle: '' },
    hasVariants: false,
    options: [],
  });

  // Images state
  const [images, setImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Variants state
  const [variants, setVariants] = useState([]);
  const [generatingVariants, setGeneratingVariants] = useState(false);

  // Digital assets state
  const [digitalAssets, setDigitalAssets] = useState([]);
  const [uploadingAsset, setUploadingAsset] = useState(false);
  const [licenseKeys, setLicenseKeys] = useState([]);

  // Categories state
  const [categories, setCategories] = useState([]);

  // Fetch product data if editing
  useEffect(() => {
    if (isEditing) {
      fetchProduct();
    }
    fetchCategories();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const data = await productService.getProduct(id);
      setProduct({
        name: data.name || '',
        description: data.description || '',
        shortDescription: data.shortDescription || '',
        type: data.type || 'physical',
        category: data.category?._id || data.category || '',
        status: data.status || 'draft',
        tags: data.tags || [],
        price: data.price || { amount: 0, compareAt: null, currency: 'PKR' },
        inventory: data.inventory || {
          sku: '',
          quantity: 0,
          trackInventory: true,
          lowStockThreshold: 10,
        },
        seo: data.seo || { metaTitle: '', metaDescription: '', urlHandle: '' },
        hasVariants: data.hasVariants || false,
        options: data.options || [],
      });

      // Fetch images
      await fetchImages();

      // Fetch variants if has variants
      if (data.hasVariants) {
        await fetchVariants();
      }

      // Fetch digital assets if digital product
      if (data.type === 'digital') {
        await fetchDigitalAssets();
      }
    } catch (error) {
      toast.error('Failed to load product');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await productService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const fetchImages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/${id}/images`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setImages(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load images:', error);
    }
  };

  const fetchVariants = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/${id}/variants`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setVariants(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load variants:', error);
    }
  };

  // Form handlers
  const handleChange = (field, value) => {
    setProduct(prev => {
      const keys = field.split('.');
      if (keys.length === 1) {
        return { ...prev, [field]: value };
      }
      // Handle nested fields like price.amount
      const updated = { ...prev };
      let current = updated;
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return updated;
    });
  };

  const handleTagsChange = (e) => {
    const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
    handleChange('tags', tags);
  };

  // Image handlers
  const handleImageUpload = async (files) => {
    if (!id) {
      toast.error('Please save the product first before uploading images');
      return;
    }

    setUploadingImages(true);
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/${id}/images`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        await fetchImages();
      } else {
        toast.error(data.message || 'Upload failed');
      }
    } catch (error) {
      toast.error('Failed to upload images');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleImageDelete = async (imageId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/${id}/images/${imageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Image deleted');
        await fetchImages();
      }
    } catch (error) {
      toast.error('Failed to delete image');
    }
  };

  const handleImageReorder = async (imageIds) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/${id}/images/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ imageIds }),
      });
    } catch (error) {
      console.error('Failed to reorder images:', error);
    }
  };

  const handleSetPrimary = async (imageId) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/${id}/images/${imageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isPrimary: true }),
      });
      await fetchImages();
      toast.success('Primary image updated');
    } catch (error) {
      toast.error('Failed to update primary image');
    }
  };

  // Variant handlers
  const handleGenerateVariants = async () => {
    if (!id) {
      toast.error('Please save the product first before generating variants');
      return;
    }

    setGeneratingVariants(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/${id}/variants/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          options: product.options,
          basePrice: product.price.amount,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        setVariants(data.data.variants || []);
      } else {
        toast.error(data.message || 'Failed to generate variants');
      }
    } catch (error) {
      toast.error('Failed to generate variants');
    } finally {
      setGeneratingVariants(false);
    }
  };

  const handleBulkUpdateVariants = async ({ field, action, value }) => {
    if (!id) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/${id}/variants/bulk`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ field, action, value }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Variants updated');
        setVariants(data.data || []);
      }
    } catch (error) {
      toast.error('Failed to update variants');
    }
  };

  // Digital asset handlers
  const fetchDigitalAssets = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/${id}/digital-assets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setDigitalAssets(data.data || []);
        // Collect all license keys from assets
        const allKeys = (data.data || []).flatMap(a => a.licenseKeys || []);
        setLicenseKeys(allKeys);
      }
    } catch (error) {
      console.error('Failed to load digital assets:', error);
    }
  };

  const handleDigitalUpload = async (files) => {
    if (!id) {
      toast.error('Please save the product first');
      return;
    }

    setUploadingAsset(true);
    const formData = new FormData();
    files.forEach(file => formData.append('file', file));

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/${id}/digital-assets`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        toast.success('File uploaded');
        await fetchDigitalAssets();
      } else {
        toast.error(data.message || 'Upload failed');
      }
    } catch (error) {
      toast.error('Failed to upload file');
    } finally {
      setUploadingAsset(false);
    }
  };

  const handleDeleteAsset = async (assetId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/${id}/digital-assets/${assetId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        toast.success('File deleted');
        await fetchDigitalAssets();
      }
    } catch (error) {
      toast.error('Failed to delete file');
    }
  };

  const handleUpdateAssetSettings = async (assetId, settings) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/${id}/digital-assets/${assetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Settings updated');
        await fetchDigitalAssets();
      }
    } catch (error) {
      toast.error('Failed to update settings');
    }
  };

  const handleUploadLicenseKeys = async (keys) => {
    if (digitalAssets.length === 0) {
      toast.error('Please upload a digital file first');
      return;
    }

    const assetId = digitalAssets[0]._id;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/${id}/digital-assets/${assetId}/license-keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ keys }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`${keys.length} license keys added`);
        await fetchDigitalAssets();
      } else {
        toast.error(data.message || 'Failed to add keys');
      }
    } catch (error) {
      toast.error('Failed to add license keys');
    }
  };

  // Save product
  const handleSave = async (e) => {
    e?.preventDefault();
    setSaving(true);

    try {
      const productData = {
        ...product,
        price: {
          ...product.price,
          amount: parseFloat(product.price.amount) || 0,
        },
      };

      let savedProduct;
      if (isEditing) {
        savedProduct = await productService.updateProduct(id, productData);
        toast.success('Product updated');
      } else {
        savedProduct = await productService.createProduct(productData);
        toast.success('Product created');
        navigate(`/vendor/products/${savedProduct._id}/edit`);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  // Tab definitions
  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'media', label: 'Media', badge: images.length || null },
    { id: 'pricing', label: 'Pricing & Variants' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'seo', label: 'SEO' },
    ...(product.type === 'digital' ? [{ id: 'digital', label: 'Digital Files' }] : []),
  ];

  if (loading) return <Loading />;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/vendor/products')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <BackIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-emerald-600">
              {isEditing ? 'Edit Product' : 'New Product'}
            </h1>
            {isEditing && (
              <p className="text-sm text-gray-500">
                Status: <span className={`font-medium ${product.status === 'active' ? 'text-green-600' : 'text-gray-600'}`}>
                  {product.status}
                </span>
              </p>
            )}
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2"
        >
          <SaveIcon className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Product'}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <form onSubmit={handleSave} className="mt-6">
        {/* General Tab */}
        <TabPanel value="general" activeTab={activeTab}>
          <div className="card p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                value={product.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                placeholder="Enter product name"
              />
            </div>

            <div>
              <RichTextEditor
                label="Description"
                required
                value={product.description}
                onChange={(value) => handleChange('description', value)}
                placeholder="Describe your product in detail..."
                minHeight={250}
                helperText="Use formatting to highlight key features and benefits"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Short Description
              </label>
              <textarea
                value={product.shortDescription}
                onChange={(e) => handleChange('shortDescription', e.target.value)}
                rows={2}
                maxLength={500}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                placeholder="Brief summary for listings..."
              />
              <p className="text-xs text-gray-400 mt-1">
                {product.shortDescription.length}/500 characters
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Type
                </label>
                <select
                  value={product.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                >
                  <option value="physical">Physical Product</option>
                  <option value="digital">Digital Product</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={product.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                >
                  <option value="">Select category...</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={product.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={product.tags.join(', ')}
                onChange={handleTagsChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                placeholder="e.g., bestseller, new arrival, sale"
              />
            </div>
          </div>
        </TabPanel>

        {/* Media Tab */}
        <TabPanel value="media" activeTab={activeTab}>
          <div className="card p-6">
            <h3 className="text-lg font-medium mb-4">Product Images</h3>
            {!id ? (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                <p>Save the product first to upload images</p>
              </div>
            ) : (
              <ImageUploader
                images={images}
                onUpload={handleImageUpload}
                onDelete={handleImageDelete}
                onReorder={handleImageReorder}
                onSetPrimary={handleSetPrimary}
                maxImages={10}
                uploading={uploadingImages}
              />
            )}
          </div>
        </TabPanel>

        {/* Pricing & Variants Tab */}
        <TabPanel value="pricing" activeTab={activeTab}>
          <div className="card p-6 space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Pricing</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (PKR) *
                  </label>
                  <input
                    type="number"
                    value={product.price.amount}
                    onChange={(e) => handleChange('price.amount', e.target.value)}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Compare at Price (Original)
                  </label>
                  <input
                    type="number"
                    value={product.price.compareAt || ''}
                    onChange={(e) => handleChange('price.compareAt', e.target.value || null)}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    placeholder="Original price for sale display"
                  />
                </div>
              </div>
            </div>

            <hr />

            <div>
              <h3 className="text-lg font-medium mb-4">Variants</h3>
              <VariantManager
                hasVariants={product.hasVariants}
                onToggleVariants={(value) => handleChange('hasVariants', value)}
                options={product.options}
                onOptionsChange={(opts) => handleChange('options', opts)}
                variants={variants}
                onVariantsChange={setVariants}
                onGenerateVariants={handleGenerateVariants}
                onBulkUpdate={handleBulkUpdateVariants}
                basePrice={product.price.amount}
                loading={generatingVariants}
                disabled={!id}
              />
              {!id && product.hasVariants && (
                <p className="text-sm text-amber-600 mt-2">
                  Save the product first to generate variants
                </p>
              )}
            </div>
          </div>
        </TabPanel>

        {/* Inventory Tab */}
        <TabPanel value="inventory" activeTab={activeTab}>
          <div className="card p-6 space-y-6">
            <h3 className="text-lg font-medium mb-4">Inventory Management</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SKU (Stock Keeping Unit)
                </label>
                <input
                  type="text"
                  value={product.inventory.sku}
                  onChange={(e) => handleChange('inventory.sku', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  placeholder="Unique product identifier"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Quantity
                </label>
                <input
                  type="number"
                  value={product.inventory.quantity}
                  onChange={(e) => handleChange('inventory.quantity', parseInt(e.target.value) || 0)}
                  min="0"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  disabled={product.hasVariants}
                />
                {product.hasVariants && (
                  <p className="text-xs text-gray-500 mt-1">
                    Inventory is tracked per variant
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Low Stock Threshold
                </label>
                <input
                  type="number"
                  value={product.inventory.lowStockThreshold}
                  onChange={(e) => handleChange('inventory.lowStockThreshold', parseInt(e.target.value) || 10)}
                  min="0"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Get alerted when stock falls below this level
                </p>
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={product.inventory.trackInventory}
                    onChange={(e) => handleChange('inventory.trackInventory', e.target.checked)}
                    className="rounded text-sky-600 focus:ring-sky-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Track inventory for this product
                  </span>
                </label>
              </div>
            </div>
          </div>
        </TabPanel>

        {/* SEO Tab */}
        <TabPanel value="seo" activeTab={activeTab}>
          <div className="card p-6">
            <h3 className="text-lg font-medium mb-4">Search Engine Optimization</h3>
            <SeoPreview
              title={product.seo.metaTitle}
              description={product.seo.metaDescription}
              urlHandle={product.seo.urlHandle || ''}
              productName={product.name}
              baseUrl="yourstore.com"
              onTitleChange={(value) => handleChange('seo.metaTitle', value)}
              onDescriptionChange={(value) => handleChange('seo.metaDescription', value)}
              onUrlHandleChange={(value) => handleChange('seo.urlHandle', value)}
            />
          </div>
        </TabPanel>

        {/* Digital Files Tab */}
        {product.type === 'digital' && (
          <TabPanel value="digital" activeTab={activeTab}>
            <div className="space-y-6">
              {/* Digital File Upload */}
              <div className="card p-6">
                <h3 className="text-lg font-medium mb-4">Digital Files</h3>
                {!id ? (
                  <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                    <p>Save the product first to upload digital files</p>
                  </div>
                ) : (
                  <DigitalFileUpload
                    assets={digitalAssets}
                    onUpload={handleDigitalUpload}
                    onDelete={handleDeleteAsset}
                    onUpdateSettings={handleUpdateAssetSettings}
                    uploading={uploadingAsset}
                    maxFiles={5}
                  />
                )}
              </div>

              {/* License Key Manager */}
              <div className="card p-6">
                <h3 className="text-lg font-medium mb-4">License Keys</h3>
                {!id ? (
                  <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                    <p>Save the product first to manage license keys</p>
                  </div>
                ) : digitalAssets.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                    <p>Upload a digital file first to add license keys</p>
                  </div>
                ) : (
                  <LicenseKeyManager
                    licenseKeys={licenseKeys}
                    onUploadKeys={handleUploadLicenseKeys}
                    onDeleteKey={(key) => {
                      // Handle individual key deletion if needed
                      toast.info('Key deletion not yet implemented');
                    }}
                    onDeleteAllKeys={() => {
                      toast.info('Bulk key deletion not yet implemented');
                    }}
                  />
                )}
              </div>
            </div>
          </TabPanel>
        )}
      </form>
    </div>
  );
};

export default ProductForm;
