import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

// Icons
const PlusIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const PencilIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
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

const TagIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

const FilterIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

const CheckCircleIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ListIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
);

const ATTRIBUTE_TYPES = [
  { value: 'text', label: 'Text', color: 'bg-blue-100 text-blue-700' },
  { value: 'number', label: 'Number', color: 'bg-purple-100 text-purple-700' },
  { value: 'select', label: 'Single Select', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'multi_select', label: 'Multi Select', color: 'bg-teal-100 text-teal-700' },
  { value: 'boolean', label: 'Yes/No', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'color', label: 'Color', color: 'bg-pink-100 text-pink-700' },
  { value: 'date', label: 'Date', color: 'bg-orange-100 text-orange-700' },
];

const getAvatarColor = (index) => {
  const colors = [
    'bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-pink-500',
    'bg-orange-500', 'bg-teal-500', 'bg-indigo-500', 'bg-rose-500'
  ];
  return colors[index % colors.length];
};

const AdminAttributes = () => {
  const [loading, setLoading] = useState(true);
  const [attributes, setAttributes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    type: 'text',
    description: '',
    isFilterable: false,
    isSearchable: false,
    isRequired: false,
    options: [],
  });
  const [newOption, setNewOption] = useState({ value: '', label: '', colorHex: '' });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchAttributes();
  }, []);

  const fetchAttributes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/attributes');
      setAttributes(response.data.data);
    } catch (error) {
      console.error('Failed to fetch attributes:', error);
      toast.error('Failed to load attributes');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'text',
      description: '',
      isFilterable: false,
      isSearchable: false,
      isRequired: false,
      options: [],
    });
    setNewOption({ value: '', label: '', colorHex: '' });
    setEditingAttribute(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (attribute) => {
    setEditingAttribute(attribute);
    setFormData({
      name: attribute.name,
      type: attribute.type,
      description: attribute.description || '',
      isFilterable: attribute.isFilterable,
      isSearchable: attribute.isSearchable,
      isRequired: attribute.isRequired,
      options: attribute.options || [],
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.type) {
      toast.error('Name and type are required');
      return;
    }

    if (['select', 'multi_select', 'color'].includes(formData.type) && formData.options.length === 0) {
      toast.error('Please add at least one option');
      return;
    }

    setProcessing(true);
    try {
      if (editingAttribute) {
        await api.put(`/attributes/${editingAttribute._id}`, formData);
        toast.success('Attribute updated');
      } else {
        await api.post('/attributes', formData);
        toast.success('Attribute created');
      }
      setShowModal(false);
      resetForm();
      fetchAttributes();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save attribute');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this attribute?')) return;

    try {
      await api.delete(`/attributes/${id}`);
      toast.success('Attribute deleted');
      fetchAttributes();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete attribute');
    }
  };

  const addOption = () => {
    if (!newOption.value || !newOption.label) {
      toast.error('Option value and label are required');
      return;
    }
    setFormData({
      ...formData,
      options: [...formData.options, { ...newOption, sortOrder: formData.options.length }],
    });
    setNewOption({ value: '', label: '', colorHex: '' });
  };

  const removeOption = (index) => {
    setFormData({
      ...formData,
      options: formData.options.filter((_, i) => i !== index),
    });
  };

  const getTypeBadge = (type) => {
    const typeInfo = ATTRIBUTE_TYPES.find(t => t.value === type);
    return typeInfo?.color || 'bg-gray-100 text-gray-700';
  };

  const filteredAttributes = attributes.filter(attr => {
    const matchesSearch = attr.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attr.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || attr.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const stats = {
    total: attributes.length,
    filterable: attributes.filter(a => a.isFilterable).length,
    required: attributes.filter(a => a.isRequired).length,
    withOptions: attributes.filter(a => a.options?.length > 0).length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-3 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-emerald-600">Product Attributes</h1>
            <p className="text-gray-500 text-sm mt-0.5">Manage attributes for product specifications</p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors text-sm"
          >
            <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            Add Attribute
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-3 sm:p-4 border border-gray-100">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="w-9 h-9 sm:w-12 sm:h-12 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                <TagIcon className="w-4 h-4 sm:w-6 sm:h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Total</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-800">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-3 sm:p-4 border border-gray-100">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="w-9 h-9 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                <FilterIcon className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Filterable</p>
                <p className="text-lg sm:text-2xl font-bold text-blue-600">{stats.filterable}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-3 sm:p-4 border border-gray-100">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="w-9 h-9 sm:w-12 sm:h-12 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
                <CheckCircleIcon className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Required</p>
                <p className="text-lg sm:text-2xl font-bold text-purple-600">{stats.required}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-3 sm:p-4 border border-gray-100">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="w-9 h-9 sm:w-12 sm:h-12 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                <ListIcon className="w-4 h-4 sm:w-6 sm:h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500">With Options</p>
                <p className="text-lg sm:text-2xl font-bold text-orange-600">{stats.withOptions}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Attributes Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-3 sm:p-6 border-b border-gray-100">
            <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-0">All Attributes</h2>
            <div className="flex items-center gap-2 sm:gap-3 sm:mt-3">
              <div className="relative flex-1">
                <SearchIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search attributes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-64 pl-9 sm:pl-10 pr-3 py-1.5 sm:py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-1.5 sm:px-4 sm:py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shrink-0"
              >
                <option value="all">All Types</option>
                {ATTRIBUTE_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>

          {filteredAttributes.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <TagIcon className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
              </div>
              <h3 className="text-base sm:text-lg font-medium text-gray-800 mb-1">No attributes found</h3>
              <p className="text-gray-500 text-sm mb-4">
                {searchTerm || typeFilter !== 'all' ? 'Try adjusting your search or filter' : 'Get started by creating your first attribute'}
              </p>
              {!searchTerm && typeFilter === 'all' && (
                <button
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors text-sm"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add Attribute
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="sm:hidden divide-y divide-gray-100">
                {filteredAttributes.map((attr, index) => (
                  <div key={attr._id} className="px-3 py-2.5 flex items-center gap-2.5">
                    <div className={`w-8 h-8 ${getAvatarColor(index)} rounded-lg flex items-center justify-center text-white text-xs font-semibold shrink-0`}>
                      {attr.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium text-gray-800 text-sm truncate">{attr.name}</p>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ${getTypeBadge(attr.type)}`}>
                          {ATTRIBUTE_TYPES.find(t => t.value === attr.type)?.label || attr.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {attr.description && (
                          <p className="text-xs text-gray-500 truncate">{attr.description}</p>
                        )}
                        {!attr.description && attr.options?.length > 0 && (
                          <p className="text-xs text-gray-400">{attr.options.length} options</p>
                        )}
                        {attr.isFilterable && (
                          <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700 shrink-0">Filter</span>
                        )}
                        {attr.isRequired && (
                          <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700 shrink-0">Req</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEditModal(attr)}
                        className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      >
                        <PencilIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(attr._id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-emerald-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-emerald-700 uppercase tracking-wider">Attribute</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-emerald-700 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-emerald-700 uppercase tracking-wider">Options</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-emerald-700 uppercase tracking-wider">Filterable</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-emerald-700 uppercase tracking-wider">Required</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-emerald-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredAttributes.map((attr, index) => (
                      <tr key={attr._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 ${getAvatarColor(index)} rounded-xl flex items-center justify-center text-white font-semibold`}>
                              {attr.name[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{attr.name}</p>
                              {attr.description && (
                                <p className="text-sm text-gray-500 truncate max-w-xs">{attr.description}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${getTypeBadge(attr.type)}`}>
                            {ATTRIBUTE_TYPES.find(t => t.value === attr.type)?.label || attr.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {attr.options?.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {attr.options.slice(0, 3).map((opt, i) => (
                                <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-gray-100 text-gray-700">
                                  {attr.type === 'color' && opt.colorHex && (
                                    <span
                                      className="w-3 h-3 rounded-full mr-1 border border-gray-200"
                                      style={{ backgroundColor: opt.colorHex }}
                                    />
                                  )}
                                  {opt.label}
                                </span>
                              ))}
                              {attr.options.length > 3 && (
                                <span className="text-xs text-gray-500 px-2 py-0.5">+{attr.options.length - 3} more</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {attr.isFilterable ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                              Yes
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                              No
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {attr.isRequired ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                              Yes
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                              No
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(attr)}
                              className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(attr._id)}
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
              <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={() => setShowModal(false)} />

              <div className="relative inline-block w-full max-w-lg bg-white rounded-2xl shadow-xl text-left overflow-hidden transform transition-all sm:my-8">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {editingAttribute ? 'Edit Attribute' : 'Create Attribute'}
                  </h3>
                  <button
                    onClick={() => { setShowModal(false); resetForm(); }}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XIcon className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Color, Size, Material"
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        disabled={editingAttribute}
                      >
                        {ATTRIBUTE_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows="2"
                      placeholder="Optional description"
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  {/* Options for select types */}
                  {['select', 'multi_select', 'color'].includes(formData.type) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
                      <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                        {formData.options.map((opt, index) => (
                          <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                            {formData.type === 'color' && opt.colorHex && (
                              <div
                                className="w-6 h-6 rounded-lg border border-gray-200"
                                style={{ backgroundColor: opt.colorHex }}
                              />
                            )}
                            <span className="flex-1 text-sm text-gray-700">{opt.label} <span className="text-gray-400">({opt.value})</span></span>
                            <button
                              type="button"
                              onClick={() => removeOption(index)}
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newOption.value}
                          onChange={(e) => setNewOption({ ...newOption, value: e.target.value })}
                          placeholder="Value"
                          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                        <input
                          type="text"
                          value={newOption.label}
                          onChange={(e) => setNewOption({ ...newOption, label: e.target.value })}
                          placeholder="Label"
                          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                        {formData.type === 'color' && (
                          <input
                            type="color"
                            value={newOption.colorHex || '#000000'}
                            onChange={(e) => setNewOption({ ...newOption, colorHex: e.target.value })}
                            className="w-12 h-10 rounded-xl cursor-pointer border border-gray-200"
                          />
                        )}
                        <button
                          type="button"
                          onClick={addOption}
                          className="px-4 py-2 text-sm text-emerald-600 border border-emerald-200 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isFilterable}
                        onChange={(e) => setFormData({ ...formData, isFilterable: e.target.checked })}
                        className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-700">Filterable (show in product filters)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isSearchable}
                        onChange={(e) => setFormData({ ...formData, isSearchable: e.target.checked })}
                        className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-700">Searchable</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isRequired}
                        onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                        className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-700">Required by default</span>
                    </label>
                  </div>

                  <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => { setShowModal(false); resetForm(); }}
                      className="px-4 py-2 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={processing}
                      className="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {processing && (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      )}
                      {editingAttribute ? 'Update' : 'Create'} Attribute
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAttributes;
