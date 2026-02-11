import { useState, useEffect } from 'react';
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

const TrashIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const GlobeIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PercentIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

const TagIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

const ShieldCheckIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const CheckIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const CheckCircleIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ChevronDownIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const FlagIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
  </svg>
);

const TaxConfiguration = () => {
  const [activeTab, setActiveTab] = useState('zones');
  const [zones, setZones] = useState([]);
  const [rates, setRates] = useState([]);
  const [overrides, setOverrides] = useState([]);
  const [exemptions, setExemptions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('zone');
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [zonesRes, ratesRes, overridesRes, exemptionsRes, categoriesRes] = await Promise.all([
        api.get('/tax/zones'),
        api.get('/tax/rates'),
        api.get('/tax/category-overrides'),
        api.get('/tax/exemptions'),
        api.get('/categories'),
      ]);
      setZones(zonesRes.data.data || []);
      setRates(ratesRes.data.data || []);
      setOverrides(overridesRes.data.data || []);
      setExemptions(exemptionsRes.data.data || []);
      setCategories(categoriesRes.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetupPakistan = async () => {
    if (!window.confirm('Setup Pakistan default tax zone and 17% GST rate?')) return;
    try {
      await api.post('/tax/setup-pakistan');
      toast.success('Pakistan defaults configured successfully');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error setting up defaults');
    }
  };

  const openModal = (type, item = null) => {
    setModalType(type);
    if (item) {
      setFormData({ ...item, isEdit: true });
    } else {
      setFormData(getDefaultFormData(type));
    }
    setShowModal(true);
  };

  const getDefaultFormData = (type) => {
    switch (type) {
      case 'zone':
        return {
          name: '',
          countryCode: 'PK',
          stateCode: '',
          city: '',
          zipPatterns: [],
          priority: 0,
          isDefault: false,
          isActive: true,
        };
      case 'rate':
        return {
          name: '',
          zone: '',
          taxType: 'gst',
          rate: 0,
          appliesTo: 'all',
          categories: [],
          isInclusive: false,
          isActive: true,
        };
      case 'override':
        return {
          category: '',
          zone: '',
          overrideType: 'exempt',
          customRate: 0,
          includeSubcategories: false,
        };
      default:
        return {};
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { isEdit, _id, ...data } = formData;
      let endpoint;

      switch (modalType) {
        case 'zone':
          endpoint = '/tax/zones';
          break;
        case 'rate':
          endpoint = '/tax/rates';
          break;
        case 'override':
          endpoint = '/tax/category-overrides';
          break;
        default:
          return;
      }

      if (isEdit) {
        await api.put(`${endpoint}/${_id}`, data);
        toast.success(`${modalType} updated successfully`);
      } else {
        await api.post(endpoint, data);
        toast.success(`${modalType} created successfully`);
      }
      fetchData();
      setShowModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving');
    }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      let endpoint;
      switch (type) {
        case 'zone':
          endpoint = `/tax/zones/${id}`;
          break;
        case 'rate':
          endpoint = `/tax/rates/${id}`;
          break;
        case 'override':
          endpoint = `/tax/category-overrides/${id}`;
          break;
        default:
          return;
      }
      await api.delete(endpoint);
      toast.success('Deleted successfully');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error deleting');
    }
  };

  const handleVerifyExemption = async (id, action) => {
    try {
      await api.put(`/tax/exemptions/${id}/${action}`);
      toast.success(`Exemption ${action}ed successfully`);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || `Error ${action}ing exemption`);
    }
  };

  // Stats
  const stats = {
    zones: zones.length,
    activeZones: zones.filter(z => z.isActive).length,
    rates: rates.length,
    overrides: overrides.length,
    pendingExemptions: exemptions.filter(e => e.status === 'pending_verification').length,
  };

  const tabs = [
    { key: 'zones', label: 'Tax Zones', icon: GlobeIcon },
    { key: 'rates', label: 'Tax Rates', icon: PercentIcon },
    { key: 'overrides', label: 'Category Overrides', icon: TagIcon },
    { key: 'exemptions', label: 'Exemptions', icon: ShieldCheckIcon },
  ];

  // Avatar colors
  const avatarColors = [
    'bg-emerald-500',
    'bg-blue-500',
    'bg-violet-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-cyan-500',
  ];

  const getAvatarColor = (index) => avatarColors[index % avatarColors.length];

  if (loading) return <Loading />;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-emerald-600">Tax Configuration</h1>
          <p className="text-gray-500 text-sm mt-1">Manage tax zones, rates, and exemptions</p>
        </div>
        <button
          onClick={handleSetupPakistan}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
        >
          <FlagIcon className="w-5 h-5" />
          Setup Pakistan Defaults
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <GlobeIcon className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tax Zones</p>
              <p className="text-2xl font-bold text-blue-600">{stats.zones}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Zones</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.activeZones}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
              <PercentIcon className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tax Rates</p>
              <p className="text-2xl font-bold text-violet-600">{stats.rates}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <TagIcon className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Overrides</p>
              <p className="text-2xl font-bold text-amber-600">{stats.overrides}</p>
            </div>
          </div>
        </div>

        <div className={`bg-white rounded-2xl shadow-sm p-4 border ${stats.pendingExemptions > 0 ? 'border-amber-200 bg-amber-50' : 'border-gray-100'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${stats.pendingExemptions > 0 ? 'bg-amber-100' : 'bg-gray-100'} flex items-center justify-center`}>
              <ShieldCheckIcon className={`w-5 h-5 ${stats.pendingExemptions > 0 ? 'text-amber-600' : 'text-gray-500'}`} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending Exemptions</p>
              <p className={`text-2xl font-bold ${stats.pendingExemptions > 0 ? 'text-amber-600' : 'text-gray-600'}`}>{stats.pendingExemptions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`inline-flex items-center gap-1 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-emerald-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <tab.icon className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline sm:inline">{tab.label}</span>
            <span className="xs:hidden sm:hidden">{tab.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {/* Tax Zones */}
      {activeTab === 'zones' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-medium text-gray-900">Tax Zones</h3>
            <button
              onClick={() => openModal('zone')}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm"
            >
              <PlusIcon className="w-4 h-4" />
              Add Zone
            </button>
          </div>
          {/* Mobile Card View */}
          <div className="sm:hidden divide-y divide-gray-100">
            {zones.map((zone, index) => (
              <div key={zone._id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${getAvatarColor(index)} flex items-center justify-center text-white font-medium text-sm`}>
                      {zone.countryCode}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{zone.name}</p>
                      {zone.isDefault && <span className="text-xs text-emerald-600 font-medium">Default</span>}
                    </div>
                  </div>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    zone.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {zone.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
                  <span>{zone.countryCode}{zone.stateCode && ` > ${zone.stateCode}`}{zone.city && ` > ${zone.city}`}</span>
                  <span className="text-gray-400">|</span>
                  <span>Priority: {zone.priority}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openModal('zone', zone)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-sm font-medium transition-colors"
                  >
                    <EditIcon className="w-4 h-4" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete('zone', zone._id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            ))}
            {zones.length === 0 && (
              <div className="p-8 text-center text-gray-500">No tax zones configured</div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-emerald-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Zone</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-emerald-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {zones.map((zone, index) => (
                  <tr key={zone._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full ${getAvatarColor(index)} flex items-center justify-center text-white font-medium text-sm`}>
                          {zone.countryCode}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{zone.name}</p>
                          {zone.isDefault && (
                            <span className="text-xs text-emerald-600 font-medium">Default</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">
                        {zone.countryCode}
                        {zone.stateCode && ` > ${zone.stateCode}`}
                        {zone.city && ` > ${zone.city}`}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-700 text-sm font-medium">
                        {zone.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        zone.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {zone.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openModal('zone', zone)}
                          className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          <EditIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete('zone', zone._id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {zones.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                      No tax zones configured
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tax Rates */}
      {activeTab === 'rates' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-medium text-gray-900">Tax Rates</h3>
            <button
              onClick={() => openModal('rate')}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm"
            >
              <PlusIcon className="w-4 h-4" />
              Add Rate
            </button>
          </div>
          {/* Mobile Card View */}
          <div className="sm:hidden divide-y divide-gray-100">
            {rates.map((rate, index) => (
              <div key={rate._id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${getAvatarColor(index)} flex items-center justify-center text-white font-bold text-sm`}>
                      {rate.rate}%
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{rate.name}</p>
                      <p className="text-xs text-gray-500">{rate.zone?.name || 'All Zones'}</p>
                    </div>
                  </div>
                  <span className="inline-flex px-2 py-1 bg-violet-50 text-violet-700 rounded-full text-xs font-medium uppercase">
                    {rate.taxType}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="inline-flex px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium capitalize">
                    {rate.appliesTo.replace('_', ' ')}
                  </span>
                  {rate.isInclusive && <span className="text-xs text-gray-500">(inclusive)</span>}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openModal('rate', rate)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-sm font-medium transition-colors"
                  >
                    <EditIcon className="w-4 h-4" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete('rate', rate._id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            ))}
            {rates.length === 0 && (
              <div className="p-8 text-center text-gray-500">No tax rates configured</div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-emerald-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Zone</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Rate</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Applies To</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-emerald-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rates.map((rate, index) => (
                  <tr key={rate._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full ${getAvatarColor(index)} flex items-center justify-center text-white font-medium text-sm`}>
                          {rate.rate}%
                        </div>
                        <span className="font-medium text-gray-900">{rate.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">{rate.zone?.name || 'All Zones'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-1 bg-violet-50 text-violet-700 rounded-full text-xs font-medium uppercase">
                        {rate.taxType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{rate.rate}%</span>
                      {rate.isInclusive && (
                        <span className="text-xs text-gray-500 ml-1">(inclusive)</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium capitalize">
                        {rate.appliesTo.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openModal('rate', rate)}
                          className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          <EditIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete('rate', rate._id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rates.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                      No tax rates configured
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Category Overrides */}
      {activeTab === 'overrides' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-medium text-gray-900">Category Overrides</h3>
            <button
              onClick={() => openModal('override')}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm"
            >
              <PlusIcon className="w-4 h-4" />
              Add Override
            </button>
          </div>
          {/* Mobile Card View */}
          <div className="sm:hidden divide-y divide-gray-100">
            {overrides.map((override, index) => (
              <div key={override._id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${getAvatarColor(index)} flex items-center justify-center text-white font-medium`}>
                      {override.category?.name?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{override.category?.name || 'Unknown'}</p>
                      {override.includeSubcategories && <span className="text-xs text-gray-500">+ subcategories</span>}
                    </div>
                  </div>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium capitalize ${
                    override.overrideType === 'exempt' ? 'bg-emerald-50 text-emerald-700' :
                    override.overrideType === 'zero_rated' ? 'bg-blue-50 text-blue-700' :
                    'bg-amber-50 text-amber-700'
                  }`}>
                    {override.overrideType.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-3 text-sm">
                  <span className="text-gray-600">{override.zone?.name || 'All Zones'}</span>
                  <span className="text-gray-400">|</span>
                  <span className="font-medium text-gray-900">
                    {override.customRate !== undefined && override.customRate !== null
                      ? `${override.customRate}%`
                      : (override.overrideType === 'exempt' ? '0% (Exempt)' : '-')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openModal('override', override)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-sm font-medium transition-colors"
                  >
                    <EditIcon className="w-4 h-4" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete('override', override._id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            ))}
            {overrides.length === 0 && (
              <div className="p-8 text-center text-gray-500">No category overrides configured</div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-emerald-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Zone</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Override Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Rate</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-emerald-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {overrides.map((override, index) => (
                  <tr key={override._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full ${getAvatarColor(index)} flex items-center justify-center text-white font-medium text-sm`}>
                          {override.category?.name?.charAt(0) || 'C'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{override.category?.name || 'Unknown'}</p>
                          {override.includeSubcategories && (
                            <span className="text-xs text-gray-500">+ subcategories</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">{override.zone?.name || 'All Zones'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium capitalize ${
                        override.overrideType === 'exempt' ? 'bg-emerald-50 text-emerald-700' :
                        override.overrideType === 'zero_rated' ? 'bg-blue-50 text-blue-700' :
                        'bg-amber-50 text-amber-700'
                      }`}>
                        {override.overrideType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">
                        {override.customRate !== undefined && override.customRate !== null
                          ? `${override.customRate}%`
                          : (override.overrideType === 'exempt' ? '0% (Exempt)' : '-')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openModal('override', override)}
                          className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          <EditIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete('override', override._id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {overrides.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                      No category overrides configured
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Exemptions */}
      {activeTab === 'exemptions' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-medium text-gray-900">Tax Exemptions</h3>
          </div>
          {/* Mobile Card View */}
          <div className="sm:hidden divide-y divide-gray-100">
            {exemptions.map((exemption, index) => (
              <div key={exemption._id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${getAvatarColor(index)} flex items-center justify-center text-white font-medium`}>
                      {(exemption.entityRef?.businessName || exemption.entityRef?.name || 'U').charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 capitalize">{exemption.entityType}</p>
                      <p className="text-xs text-gray-500">{exemption.entityRef?.businessName || exemption.entityRef?.name || 'Unknown'}</p>
                    </div>
                  </div>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    exemption.status === 'verified' ? 'bg-emerald-50 text-emerald-700' :
                    exemption.status === 'pending_verification' ? 'bg-amber-50 text-amber-700' :
                    exemption.status === 'rejected' ? 'bg-red-50 text-red-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {exemption.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 mb-3 text-sm">
                  <span className="inline-flex px-2 py-1 bg-violet-50 text-violet-700 rounded-full text-xs font-medium capitalize">
                    {exemption.exemptionType}{exemption.exemptionType === 'partial' && ` (${exemption.partialRate}%)`}
                  </span>
                  {exemption.certificateNumber && <span className="text-gray-500">Cert: {exemption.certificateNumber}</span>}
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  {exemption.validFrom && new Date(exemption.validFrom).toLocaleDateString()} - {exemption.validUntil && new Date(exemption.validUntil).toLocaleDateString()}
                </p>
                {exemption.status === 'pending_verification' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleVerifyExemption(exemption._id, 'verify')}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-sm font-medium transition-colors"
                    >
                      <CheckIcon className="w-4 h-4" /> Verify
                    </button>
                    <button
                      onClick={() => handleVerifyExemption(exemption._id, 'reject')}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
                    >
                      <XIcon className="w-4 h-4" /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
            {exemptions.length === 0 && (
              <div className="p-8 text-center text-gray-500">No exemption applications</div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-emerald-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Entity</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Certificate</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Validity</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-emerald-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {exemptions.map((exemption, index) => (
                  <tr key={exemption._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full ${getAvatarColor(index)} flex items-center justify-center text-white font-medium text-sm`}>
                          {(exemption.entityRef?.businessName || exemption.entityRef?.name || 'U').charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 capitalize">{exemption.entityType}</p>
                          <p className="text-xs text-gray-500">
                            {exemption.entityRef?.businessName || exemption.entityRef?.name || 'Unknown'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-1 bg-violet-50 text-violet-700 rounded-full text-xs font-medium capitalize">
                        {exemption.exemptionType}
                        {exemption.exemptionType === 'partial' && ` (${exemption.partialRate}%)`}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">{exemption.certificateNumber || '-'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">
                        {exemption.validFrom && new Date(exemption.validFrom).toLocaleDateString()}
                        {' - '}
                        {exemption.validUntil && new Date(exemption.validUntil).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        exemption.status === 'verified'
                          ? 'bg-emerald-50 text-emerald-700'
                          : exemption.status === 'pending_verification'
                          ? 'bg-amber-50 text-amber-700'
                          : exemption.status === 'rejected'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {exemption.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        {exemption.status === 'pending_verification' && (
                          <>
                            <button
                              onClick={() => handleVerifyExemption(exemption._id, 'verify')}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Verify"
                            >
                              <CheckIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleVerifyExemption(exemption._id, 'reject')}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Reject"
                            >
                              <XIcon className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {exemptions.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                      No exemption applications
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 capitalize">
                {formData.isEdit ? 'Edit' : 'Add'} {modalType}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              {/* Zone Form */}
              {modalType === 'zone' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country Code *</label>
                      <input
                        type="text"
                        value={formData.countryCode || ''}
                        onChange={(e) => setFormData({ ...formData, countryCode: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        maxLength="2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State Code</label>
                      <input
                        type="text"
                        value={formData.stateCode || ''}
                        onChange={(e) => setFormData({ ...formData, stateCode: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      value={formData.city || ''}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <input
                      type="number"
                      value={formData.priority || 0}
                      onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isDefault || false}
                        onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                        className="w-4 h-4 text-emerald-500 border-gray-300 rounded focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-700">Default Zone</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isActive !== false}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-4 h-4 text-emerald-500 border-gray-300 rounded focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-700">Active</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Rate Form */}
              {modalType === 'rate' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
                    <div className="relative">
                      <select
                        value={formData.zone?._id || formData.zone || ''}
                        onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                        className="w-full appearance-none px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      >
                        <option value="">All Zones</option>
                        {zones.map((z) => (
                          <option key={z._id} value={z._id}>{z.name}</option>
                        ))}
                      </select>
                      <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tax Type</label>
                      <div className="relative">
                        <select
                          value={formData.taxType || 'gst'}
                          onChange={(e) => setFormData({ ...formData, taxType: e.target.value })}
                          className="w-full appearance-none px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                        >
                          <option value="vat">VAT</option>
                          <option value="gst">GST</option>
                          <option value="sales_tax">Sales Tax</option>
                          <option value="service_tax">Service Tax</option>
                        </select>
                        <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rate (%) *</label>
                      <input
                        type="number"
                        value={formData.rate || ''}
                        onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Applies To</label>
                    <div className="relative">
                      <select
                        value={formData.appliesTo || 'all'}
                        onChange={(e) => setFormData({ ...formData, appliesTo: e.target.value })}
                        className="w-full appearance-none px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      >
                        <option value="all">All</option>
                        <option value="products_only">Products Only</option>
                        <option value="shipping_only">Shipping Only</option>
                        <option value="specific_categories">Specific Categories</option>
                      </select>
                      <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isInclusive || false}
                      onChange={(e) => setFormData({ ...formData, isInclusive: e.target.checked })}
                      className="w-4 h-4 text-emerald-500 border-gray-300 rounded focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-700">Tax Inclusive (price already includes tax)</span>
                  </label>
                </div>
              )}

              {/* Override Form */}
              {modalType === 'override' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <div className="relative">
                      <select
                        value={formData.category?._id || formData.category || ''}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full appearance-none px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                        required
                      >
                        <option value="">Select Category</option>
                        {categories.map((c) => (
                          <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                      </select>
                      <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Zone (optional)</label>
                    <div className="relative">
                      <select
                        value={formData.zone?._id || formData.zone || ''}
                        onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                        className="w-full appearance-none px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      >
                        <option value="">All Zones</option>
                        {zones.map((z) => (
                          <option key={z._id} value={z._id}>{z.name}</option>
                        ))}
                      </select>
                      <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Override Type</label>
                    <div className="relative">
                      <select
                        value={formData.overrideType || 'exempt'}
                        onChange={(e) => setFormData({ ...formData, overrideType: e.target.value })}
                        className="w-full appearance-none px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      >
                        <option value="exempt">Exempt (0% tax)</option>
                        <option value="reduced_rate">Reduced Rate</option>
                        <option value="custom_rate">Custom Rate</option>
                        <option value="zero_rated">Zero Rated</option>
                      </select>
                      <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  {(formData.overrideType === 'custom_rate' || formData.overrideType === 'reduced_rate') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Custom Rate (%)</label>
                      <input
                        type="number"
                        value={formData.customRate || ''}
                        onChange={(e) => setFormData({ ...formData, customRate: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        step="0.01"
                      />
                    </div>
                  )}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.includeSubcategories || false}
                      onChange={(e) => setFormData({ ...formData, includeSubcategories: e.target.checked })}
                      className="w-4 h-4 text-emerald-500 border-gray-300 rounded focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-700">Include Subcategories</span>
                  </label>
                </div>
              )}

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
                  {formData.isEdit ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxConfiguration;
