import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
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

const SearchIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const ChevronDownIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const PercentIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
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

const LayersIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

const XIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const CommissionRules = () => {
  const { user } = useSelector((state) => state.auth);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterScope, setFilterScope] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    scope: 'platform',
    scopeRef: '',
    type: 'percentage',
    value: '',
    tiers: [],
    tierPeriod: 'monthly',
    isActive: true,
    priority: 0,
  });
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchRules();
    fetchVendors();
    fetchCategories();
  }, []);

  const fetchRules = async () => {
    try {
      const res = await api.get('/commission/rules');
      setRules(res.data.data || []);
    } catch (error) {
      console.error('Error fetching rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const res = await api.get('/vendors');
      setVendors(res.data.data || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async (search = '') => {
    try {
      const res = await api.get(`/products?search=${search}&limit=20`);
      setProducts(res.data.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...formData };
      if (data.scope === 'platform') {
        delete data.scopeRef;
      }
      if (data.type !== 'tiered') {
        delete data.tiers;
        delete data.tierPeriod;
      }

      if (editingRule) {
        await api.put(`/commission/rules/${editingRule._id}`, data);
        toast.success('Rule updated successfully');
      } else {
        await api.post('/commission/rules', data);
        toast.success('Rule created successfully');
      }
      fetchRules();
      resetForm();
    } catch (error) {
      console.error('Error saving rule:', error);
      toast.error(error.response?.data?.message || 'Error saving rule');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this rule?')) return;
    try {
      await api.delete(`/commission/rules/${id}`);
      toast.success('Rule deleted successfully');
      fetchRules();
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast.error('Error deleting rule');
    }
  };

  const handleEdit = (rule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      scope: rule.scope,
      scopeRef: rule.scopeRef?._id || rule.scopeRef || '',
      type: rule.type,
      value: rule.value || '',
      tiers: rule.tiers || [],
      tierPeriod: rule.tierPeriod || 'monthly',
      isActive: rule.isActive,
      priority: rule.priority || 0,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      scope: 'platform',
      scopeRef: '',
      type: 'percentage',
      value: '',
      tiers: [],
      tierPeriod: 'monthly',
      isActive: true,
      priority: 0,
    });
    setEditingRule(null);
    setShowModal(false);
  };

  const addTier = () => {
    setFormData({
      ...formData,
      tiers: [
        ...formData.tiers,
        { minAmount: 0, maxAmount: null, rate: 0 },
      ],
    });
  };

  const updateTier = (index, field, value) => {
    const newTiers = [...formData.tiers];
    newTiers[index][field] = value === '' ? null : parseFloat(value);
    setFormData({ ...formData, tiers: newTiers });
  };

  const removeTier = (index) => {
    setFormData({
      ...formData,
      tiers: formData.tiers.filter((_, i) => i !== index),
    });
  };

  const getScopeLabel = (rule) => {
    switch (rule.scope) {
      case 'platform':
        return 'Platform Default';
      case 'vendor':
        return rule.scopeRef?.businessName || 'Vendor';
      case 'category':
        return rule.scopeRef?.name || 'Category';
      case 'product':
        return rule.scopeRef?.name || 'Product';
      default:
        return rule.scope;
    }
  };

  const scopeColors = {
    platform: 'bg-emerald-50 text-emerald-700',
    vendor: 'bg-blue-50 text-blue-700',
    category: 'bg-violet-50 text-violet-700',
    product: 'bg-amber-50 text-amber-700',
  };

  const typeColors = {
    percentage: 'bg-emerald-50 text-emerald-700',
    fixed: 'bg-blue-50 text-blue-700',
    tiered: 'bg-violet-50 text-violet-700',
  };

  // Stats
  const stats = {
    total: rules.length,
    active: rules.filter(r => r.isActive).length,
    inactive: rules.filter(r => !r.isActive).length,
    tiered: rules.filter(r => r.type === 'tiered').length,
  };

  // Filter rules
  const filteredRules = rules.filter(r => {
    const matchesSearch = r.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesScope = filterScope === 'all' || r.scope === filterScope;
    return matchesSearch && matchesScope;
  });

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
          <h1 className="text-2xl font-bold text-emerald-600">Commission Rules</h1>
          <p className="text-gray-500 text-sm mt-1">Configure commission rates for vendors</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Add Rule
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <PercentIcon className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Rules</p>
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
              <LayersIcon className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tiered Rules</p>
              <p className="text-2xl font-bold text-violet-600">{stats.tiered}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        {/* Filters */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search rules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="relative">
            <select
              value={filterScope}
              onChange={(e) => setFilterScope(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="all">All Scopes</option>
              <option value="platform">Platform</option>
              <option value="vendor">Vendor</option>
              <option value="category">Category</option>
              <option value="product">Product</option>
            </select>
            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="sm:hidden divide-y divide-gray-100">
          {filteredRules.map((rule, index) => (
            <div key={rule._id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${getAvatarColor(index)} flex items-center justify-center text-white font-medium`}>
                    {rule.name?.charAt(0).toUpperCase() || 'R'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{rule.name}</p>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${scopeColors[rule.scope] || 'bg-gray-100 text-gray-700'}`}>
                      {getScopeLabel(rule)}
                    </span>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  rule.isActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {rule.isActive ? (
                    <CheckCircleIcon className="w-3 h-3" />
                  ) : (
                    <XCircleIcon className="w-3 h-3" />
                  )}
                  {rule.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium capitalize ${typeColors[rule.type] || 'bg-gray-100 text-gray-700'}`}>
                  {rule.type}
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {rule.type === 'tiered' ? (
                    <span className="text-violet-600">{rule.tiers?.length || 0} tiers</span>
                  ) : rule.type === 'percentage' ? (
                    `${rule.value}%`
                  ) : (
                    `PKR ${rule.value}`
                  )}
                </span>
                <span className="text-gray-400">|</span>
                <span className="text-sm text-gray-500">Priority: {rule.priority}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(rule)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-sm font-medium transition-colors"
                >
                  <EditIcon className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(rule._id)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
          {filteredRules.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              {searchQuery || filterScope !== 'all' ? 'No rules found matching your criteria.' : 'No commission rules configured.'}
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-emerald-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Rule</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Scope</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Value</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Priority</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Status</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-emerald-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRules.map((rule, index) => (
                <tr key={rule._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full ${getAvatarColor(index)} flex items-center justify-center text-white font-medium text-sm`}>
                        {rule.name?.charAt(0).toUpperCase() || 'R'}
                      </div>
                      <span className="font-medium text-gray-900">{rule.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${scopeColors[rule.scope] || 'bg-gray-100 text-gray-700'}`}>
                      {getScopeLabel(rule)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium capitalize ${typeColors[rule.type] || 'bg-gray-100 text-gray-700'}`}>
                      {rule.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {rule.type === 'tiered' ? (
                      <span className="text-sm text-violet-600 font-medium">{rule.tiers?.length || 0} tiers</span>
                    ) : rule.type === 'percentage' ? (
                      <span className="text-sm font-medium text-gray-900">{rule.value}%</span>
                    ) : (
                      <span className="text-sm font-medium text-gray-900">PKR {rule.value}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-700 text-sm font-medium">
                      {rule.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      rule.isActive
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {rule.isActive ? (
                        <CheckCircleIcon className="w-3 h-3" />
                      ) : (
                        <XCircleIcon className="w-3 h-3" />
                      )}
                      {rule.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEdit(rule)}
                        className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <EditIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(rule._id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRules.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                    {searchQuery || filterScope !== 'all' ? 'No rules found matching your criteria.' : 'No commission rules configured.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {filteredRules.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-emerald-600">
              Showing {filteredRules.length} of {rules.length} rules
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingRule ? 'Edit Commission Rule' : 'Add Commission Rule'}
              </h2>
              <button
                onClick={resetForm}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g., Standard Commission"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scope</label>
                  <div className="relative">
                    <select
                      value={formData.scope}
                      onChange={(e) => setFormData({ ...formData, scope: e.target.value, scopeRef: '' })}
                      className="w-full appearance-none px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      <option value="platform">Platform (Default)</option>
                      <option value="vendor">Vendor-specific</option>
                      <option value="category">Category-specific</option>
                      <option value="product">Product-specific</option>
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {formData.scope !== 'platform' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {formData.scope === 'vendor' && 'Vendor *'}
                      {formData.scope === 'category' && 'Category *'}
                      {formData.scope === 'product' && 'Product *'}
                    </label>
                    <div className="relative">
                      <select
                        value={formData.scopeRef}
                        onChange={(e) => setFormData({ ...formData, scopeRef: e.target.value })}
                        className="w-full appearance-none px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                        required
                      >
                        <option value="">Select...</option>
                        {formData.scope === 'vendor' &&
                          vendors.map((v) => (
                            <option key={v._id} value={v._id}>
                              {v.businessName}
                            </option>
                          ))}
                        {formData.scope === 'category' &&
                          categories.map((c) => (
                            <option key={c._id} value={c._id}>
                              {c.name}
                            </option>
                          ))}
                        {formData.scope === 'product' &&
                          products.map((p) => (
                            <option key={p._id} value={p._id}>
                              {p.name}
                            </option>
                          ))}
                      </select>
                      <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    {formData.scope === 'product' && (
                      <input
                        type="text"
                        placeholder="Search products..."
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 mt-2"
                        onChange={(e) => fetchProducts(e.target.value)}
                      />
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <div className="relative">
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full appearance-none px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed Amount</option>
                      <option value="tiered">Tiered</option>
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {formData.type !== 'tiered' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Value {formData.type === 'percentage' ? '(%)' : '(PKR)'} *
                    </label>
                    <input
                      type="number"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                )}

                {formData.type === 'tiered' && (
                  <div className="col-span-2 border-t border-gray-100 pt-4">
                    <div className="flex justify-between items-center mb-3">
                      <label className="block text-sm font-medium text-gray-700">Tiers</label>
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <select
                            value={formData.tierPeriod}
                            onChange={(e) => setFormData({ ...formData, tierPeriod: e.target.value })}
                            className="appearance-none pl-3 pr-8 py-1 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                          >
                            <option value="per_order">Per Order</option>
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                          </select>
                          <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                        <button
                          type="button"
                          onClick={addTier}
                          className="text-emerald-600 text-sm hover:text-emerald-700 font-medium"
                        >
                          + Add Tier
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {formData.tiers.map((tier, index) => (
                        <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                          <input
                            type="number"
                            placeholder="Min"
                            value={tier.minAmount || ''}
                            onChange={(e) => updateTier(index, 'minAmount', e.target.value)}
                            className="w-24 px-2 py-1.5 border border-gray-200 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                          <span className="text-gray-400">-</span>
                          <input
                            type="number"
                            placeholder="Max (empty=∞)"
                            value={tier.maxAmount || ''}
                            onChange={(e) => updateTier(index, 'maxAmount', e.target.value)}
                            className="w-32 px-2 py-1.5 border border-gray-200 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                          <span className="text-gray-400">@</span>
                          <input
                            type="number"
                            placeholder="Rate"
                            value={tier.rate || ''}
                            onChange={(e) => updateTier(index, 'rate', e.target.value)}
                            className="w-20 px-2 py-1.5 border border-gray-200 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                          <span className="text-sm text-gray-500">%</span>
                          <button
                            type="button"
                            onClick={() => removeTier(index)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          >
                            <XIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {formData.tiers.length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4">No tiers added. Click "+ Add Tier" to add one.</p>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Higher = checked first</p>
                </div>

                <div className="flex items-center">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 text-emerald-500 border-gray-300 rounded focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                >
                  {editingRule ? 'Update Rule' : 'Create Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommissionRules;
