import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import { Loading } from '../../components/common';

const ImageIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const LinkIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);

const EyeIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const StorefrontEditor = () => {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vendor, setVendor] = useState(null);
  const [formData, setFormData] = useState({
    storeName: '',
    description: '',
    tagline: '',
    logo: '',
    banner: '',
    contactEmail: '',
    contactPhone: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: 'Pakistan',
      zipCode: '',
    },
    socialLinks: {
      facebook: '',
      instagram: '',
      twitter: '',
      whatsapp: '',
      youtube: '',
    },
    policies: {
      shipping: '',
      returns: '',
      privacy: '',
    },
  });

  const [activeTab, setActiveTab] = useState('basic');
  const [uploading, setUploading] = useState({ logo: false, banner: false });

  useEffect(() => {
    fetchVendorProfile();
  }, []);

  const fetchVendorProfile = async () => {
    try {
      const response = await api.get('/vendors/me/profile');
      const vendorData = response.data.data || response.data;
      setVendor(vendorData);
      setFormData({
        storeName: vendorData.storeName || '',
        description: vendorData.description || '',
        tagline: vendorData.tagline || '',
        logo: vendorData.logo || '',
        banner: vendorData.banner || '',
        contactEmail: vendorData.contactEmail || '',
        contactPhone: vendorData.contactPhone || '',
        address: {
          street: vendorData.address?.street || '',
          city: vendorData.address?.city || '',
          state: vendorData.address?.state || '',
          country: vendorData.address?.country || 'Pakistan',
          zipCode: vendorData.address?.zipCode || '',
        },
        socialLinks: {
          facebook: vendorData.socialLinks?.facebook || '',
          instagram: vendorData.socialLinks?.instagram || '',
          twitter: vendorData.socialLinks?.twitter || '',
          whatsapp: vendorData.socialLinks?.whatsapp || '',
          youtube: vendorData.socialLinks?.youtube || '',
        },
        policies: {
          shipping: vendorData.policies?.shipping || '',
          returns: vendorData.policies?.returns || '',
          privacy: vendorData.policies?.privacy || '',
        },
      });
    } catch (error) {
      console.error('Error fetching vendor profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    setUploading((prev) => ({ ...prev, [type]: true }));

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('image', file);

      const response = await api.post('/upload/image', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setFormData((prev) => ({
        ...prev,
        [type]: response.data.url,
      }));
    } catch (error) {
      alert('Failed to upload image');
    } finally {
      setUploading((prev) => ({ ...prev, [type]: false }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await api.put('/vendors/profile', formData);
      alert('Storefront updated successfully!');
      fetchVendorProfile();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update storefront');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'branding', label: 'Branding' },
    { id: 'contact', label: 'Contact' },
    { id: 'social', label: 'Social Links' },
    { id: 'policies', label: 'Policies' },
  ];

  if (loading) return <Loading />;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-emerald-600">Storefront Editor</h1>
          <p className="text-gray-500">Customize your store appearance</p>
        </div>
        <a
          href={`/vendor/${vendor?.storeSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-emerald-600 hover:underline"
        >
          <EyeIcon className="w-5 h-5" />
          Preview Store
        </a>
      </div>

      {/* Preview Banner */}
      <div className="card overflow-hidden mb-8">
        <div
          className="h-48 bg-cover bg-center relative"
          style={{
            backgroundImage: formData.banner
              ? `url(${formData.banner})`
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          }}
        >
          <div className="absolute inset-0 bg-black/30 flex items-end">
            <div className="p-6 flex items-center gap-4">
              {formData.logo ? (
                <img
                  src={formData.logo}
                  alt="Logo"
                  className="w-20 h-20 rounded-full border-4 border-white object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full border-4 border-white bg-gray-200 flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <div className="text-white">
                <h2 className="text-2xl font-bold">{formData.storeName || 'Your Store Name'}</h2>
                <p className="text-white/80">{formData.tagline || 'Your tagline here'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="card p-6">
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Store Name *
                </label>
                <input
                  type="text"
                  name="storeName"
                  value={formData.storeName}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tagline
                </label>
                <input
                  type="text"
                  name="tagline"
                  value={formData.tagline}
                  onChange={handleChange}
                  maxLength={100}
                  placeholder="A short description of your store"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {formData.tagline.length}/100 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={5}
                  maxLength={2000}
                  placeholder="Tell customers about your store, products, and what makes you special..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {formData.description.length}/2000 characters
                </p>
              </div>
            </div>
          )}

          {/* Branding Tab */}
          {activeTab === 'branding' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Store Logo
                </label>
                <div className="flex items-center gap-4">
                  {formData.logo ? (
                    <img
                      src={formData.logo}
                      alt="Logo"
                      className="w-24 h-24 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'logo')}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="cursor-pointer inline-flex items-center px-4 py-2 border-2 border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 font-medium transition-colors"
                    >
                      {uploading.logo ? 'Uploading...' : 'Upload Logo'}
                    </label>
                    <p className="text-xs text-gray-400 mt-1">
                      Recommended: 200x200px, Max 5MB
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Store Banner
                </label>
                <div className="space-y-4">
                  {formData.banner ? (
                    <img
                      src={formData.banner}
                      alt="Banner"
                      className="w-full h-40 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-full h-40 rounded-lg bg-gray-100 flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'banner')}
                    className="hidden"
                    id="banner-upload"
                  />
                  <label
                    htmlFor="banner-upload"
                    className="cursor-pointer inline-flex items-center px-4 py-2 border-2 border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 font-medium transition-colors"
                  >
                    {uploading.banner ? 'Uploading...' : 'Upload Banner'}
                  </label>
                  <p className="text-xs text-gray-400">
                    Recommended: 1200x300px, Max 5MB
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Contact Tab */}
          {activeTab === 'contact' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3 text-emerald-600">Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Street Address
                    </label>
                    <input
                      type="text"
                      name="address.street"
                      value={formData.address.street}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State/Province
                    </label>
                    <input
                      type="text"
                      name="address.state"
                      value={formData.address.state}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      name="address.country"
                      value={formData.address.country}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Zip Code
                    </label>
                    <input
                      type="text"
                      name="address.zipCode"
                      value={formData.address.zipCode}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Social Links Tab */}
          {activeTab === 'social' && (
            <div className="space-y-4">
              {[
                { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/yourpage' },
                { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourpage' },
                { key: 'twitter', label: 'Twitter/X', placeholder: 'https://twitter.com/yourhandle' },
                { key: 'whatsapp', label: 'WhatsApp', placeholder: '+923001234567' },
                { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/yourchannel' },
              ].map((social) => (
                <div key={social.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {social.label}
                  </label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name={`socialLinks.${social.key}`}
                      value={formData.socialLinks[social.key]}
                      onChange={handleChange}
                      placeholder={social.placeholder}
                      className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Policies Tab */}
          {activeTab === 'policies' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shipping Policy
                </label>
                <textarea
                  name="policies.shipping"
                  value={formData.policies.shipping}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Describe your shipping methods, delivery times, and any fees..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Returns & Refunds Policy
                </label>
                <textarea
                  name="policies.returns"
                  value={formData.policies.returns}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Explain your return policy, refund process, and conditions..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Privacy Policy
                </label>
                <textarea
                  name="policies.privacy"
                  value={formData.policies.privacy}
                  onChange={handleChange}
                  rows={4}
                  placeholder="How do you handle customer data and privacy..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StorefrontEditor;
