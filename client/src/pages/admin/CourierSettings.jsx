import { useEffect, useState } from 'react';
import api from '../../services/api';
import { Loading } from '../../components/common';
import toast from 'react-hot-toast';

const PlusIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const EditIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TruckIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
  </svg>
);

const CheckCircleIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XCircleIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const KeyIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
);

const GlobeIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const RefreshIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const SearchIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const CourierSettings = () => {
  const [couriers, setCouriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    isActive: true,
    apiCredentials: {
      apiKey: '',
      apiSecret: '',
      accountNumber: '',
      baseUrl: '',
    },
    settings: {
      autoFetchTracking: true,
      trackingFetchInterval: 60,
    },
  });

  useEffect(() => {
    fetchCouriers();
  }, []);

  const fetchCouriers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/couriers');
      setCouriers(response.data || []);
    } catch (error) {
      console.error('Error fetching couriers:', error);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (courier) => {
    setSelectedCourier(courier);
    setFormData({
      name: courier.name || '',
      code: courier.code || '',
      isActive: courier.isActive !== false,
      apiCredentials: {
        apiKey: courier.apiCredentials?.apiKey || '',
        apiSecret: courier.apiCredentials?.apiSecret || '',
        accountNumber: courier.apiCredentials?.accountNumber || '',
        baseUrl: courier.apiCredentials?.baseUrl || '',
      },
      settings: {
        autoFetchTracking: courier.settings?.autoFetchTracking !== false,
        trackingFetchInterval: courier.settings?.trackingFetchInterval || 60,
      },
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setSelectedCourier(null);
    setFormData({
      name: '',
      code: '',
      isActive: true,
      apiCredentials: {
        apiKey: '',
        apiSecret: '',
        accountNumber: '',
        baseUrl: '',
      },
      settings: {
        autoFetchTracking: true,
        trackingFetchInterval: 60,
      },
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedCourier) {
        await api.put(`/admin/couriers/${selectedCourier._id}`, formData);
        toast.success('Courier updated successfully');
      } else {
        await api.post('/admin/couriers', formData);
        toast.success('Courier created successfully');
      }
      setShowModal(false);
      fetchCouriers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save courier');
    }
  };

  const toggleCourierStatus = async (courier) => {
    try {
      await api.put(`/admin/couriers/${courier._id}`, {
        isActive: !courier.isActive,
      });
      toast.success(`Courier ${courier.isActive ? 'disabled' : 'enabled'} successfully`);
      fetchCouriers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  // Stats
  const stats = {
    total: couriers.length,
    active: couriers.filter(c => c.isActive).length,
    inactive: couriers.filter(c => !c.isActive).length,
    configured: couriers.filter(c => c.apiCredentials?.apiKey).length,
  };

  // Filter couriers
  const filteredCouriers = couriers.filter(c =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Courier avatar colors
  const avatarColors = [
    'bg-emerald-500',
    'bg-blue-500',
    'bg-violet-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-cyan-500',
    'bg-pink-500',
  ];

  const getAvatarColor = (index) => avatarColors[index % avatarColors.length];

  if (loading) return <Loading />;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-emerald-600">Courier Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Configure courier integrations for shipment tracking</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Add Courier
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <TruckIcon className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Couriers</p>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <XCircleIcon className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Inactive</p>
              <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
              <KeyIcon className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">API Configured</p>
              <p className="text-2xl font-bold text-violet-600">{stats.configured}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        {/* Search */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search couriers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="sm:hidden divide-y divide-gray-100">
          {filteredCouriers.map((courier, index) => (
            <div key={courier._id} className={`p-4 ${!courier.isActive ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${getAvatarColor(index)} flex items-center justify-center text-white font-medium`}>
                    {courier.name?.charAt(0).toUpperCase() || 'C'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{courier.name}</p>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-mono">
                      {courier.code}
                    </span>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  courier.isActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {courier.isActive ? (
                    <CheckCircleIcon className="w-3 h-3" />
                  ) : (
                    <XCircleIcon className="w-3 h-3" />
                  )}
                  {courier.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  courier.apiCredentials?.apiKey
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-red-50 text-red-700'
                }`}>
                  <KeyIcon className="w-3 h-3" />
                  API: {courier.apiCredentials?.apiKey ? 'Configured' : 'Not Set'}
                </span>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  courier.settings?.autoFetchTracking
                    ? 'bg-blue-50 text-blue-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  <RefreshIcon className="w-3 h-3" />
                  Tracking: {courier.settings?.autoFetchTracking ? 'On' : 'Off'}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-violet-50 text-violet-700 rounded-full text-xs font-medium">
                  <GlobeIcon className="w-3 h-3" />
                  {courier.supportedCities?.length || 0} cities
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(courier)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-sm font-medium transition-colors"
                >
                  <EditIcon className="w-4 h-4" />
                  Configure
                </button>
                <button
                  onClick={() => toggleCourierStatus(courier)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    courier.isActive
                      ? 'text-red-600 bg-red-50 hover:bg-red-100'
                      : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                  }`}
                >
                  {courier.isActive ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>
          ))}
          {filteredCouriers.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              {searchQuery ? 'No couriers found matching your search.' : 'No couriers configured. Add your first courier to enable shipment tracking.'}
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-emerald-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Courier</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Code</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">API</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Auto Tracking</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Cities</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-emerald-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCouriers.map((courier, index) => (
                <tr key={courier._id} className={`hover:bg-gray-50 ${!courier.isActive ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full ${getAvatarColor(index)} flex items-center justify-center text-white font-medium text-sm`}>
                        {courier.name?.charAt(0).toUpperCase() || 'C'}
                      </div>
                      <span className="font-medium text-gray-900">{courier.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-mono">
                      {courier.code}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      courier.isActive
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {courier.isActive ? (
                        <CheckCircleIcon className="w-3 h-3" />
                      ) : (
                        <XCircleIcon className="w-3 h-3" />
                      )}
                      {courier.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      courier.apiCredentials?.apiKey
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-red-50 text-red-700'
                    }`}>
                      <KeyIcon className="w-3 h-3" />
                      {courier.apiCredentials?.apiKey ? 'Configured' : 'Not Set'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      courier.settings?.autoFetchTracking
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      <RefreshIcon className="w-3 h-3" />
                      {courier.settings?.autoFetchTracking ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-violet-50 text-violet-700 rounded-full text-xs font-medium">
                      <GlobeIcon className="w-3 h-3" />
                      {courier.supportedCities?.length || 0} cities
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEditModal(courier)}
                        className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Configure"
                      >
                        <EditIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleCourierStatus(courier)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                          courier.isActive
                            ? 'text-red-600 bg-red-50 hover:bg-red-100'
                            : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                        }`}
                      >
                        {courier.isActive ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCouriers.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                    {searchQuery ? 'No couriers found matching your search.' : 'No couriers configured. Add your first courier to enable shipment tracking.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {filteredCouriers.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-emerald-600">
              Showing {filteredCouriers.length} of {couriers.length} couriers
            </p>
          </div>
        )}
      </div>

      {/* Edit/Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedCourier ? `Configure ${selectedCourier.name}` : 'Add New Courier'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Courier Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="e.g., TCS Express"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase() })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-50"
                      placeholder="e.g., tcs"
                      required
                      disabled={!!selectedCourier}
                    />
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <KeyIcon className="w-4 h-4 text-emerald-500" />
                    API Credentials
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                      <input
                        type="password"
                        value={formData.apiCredentials.apiKey}
                        onChange={(e) => setFormData({
                          ...formData,
                          apiCredentials: { ...formData.apiCredentials, apiKey: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="Enter API key"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">API Secret</label>
                      <input
                        type="password"
                        value={formData.apiCredentials.apiSecret}
                        onChange={(e) => setFormData({
                          ...formData,
                          apiCredentials: { ...formData.apiCredentials, apiSecret: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="Enter API secret"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                      <input
                        type="text"
                        value={formData.apiCredentials.accountNumber}
                        onChange={(e) => setFormData({
                          ...formData,
                          apiCredentials: { ...formData.apiCredentials, accountNumber: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="Enter account number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Base URL</label>
                      <input
                        type="url"
                        value={formData.apiCredentials.baseUrl}
                        onChange={(e) => setFormData({
                          ...formData,
                          apiCredentials: { ...formData.apiCredentials, baseUrl: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="https://api.courier.com"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <RefreshIcon className="w-4 h-4 text-emerald-500" />
                    Settings
                  </h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.settings.autoFetchTracking}
                        onChange={(e) => setFormData({
                          ...formData,
                          settings: { ...formData.settings, autoFetchTracking: e.target.checked }
                        })}
                        className="w-4 h-4 text-emerald-500 border-gray-300 rounded focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-700">Auto-fetch tracking updates</span>
                    </label>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Fetch Interval (minutes)</label>
                      <input
                        type="number"
                        value={formData.settings.trackingFetchInterval}
                        onChange={(e) => setFormData({
                          ...formData,
                          settings: { ...formData.settings, trackingFetchInterval: parseInt(e.target.value) }
                        })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        min="15"
                        max="1440"
                      />
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-4 h-4 text-emerald-500 border-gray-300 rounded focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-700">Courier is active</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                >
                  {selectedCourier ? 'Update Courier' : 'Add Courier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourierSettings;
