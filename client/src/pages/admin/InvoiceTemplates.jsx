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

const DocumentIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const StarIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const CheckCircleIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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

const EyeIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const InvoiceTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    type: 'customer_invoice',
    isDefault: false,
    headerLogo: '',
    footerText: '',
    styles: '',
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/invoice-templates');
      setTemplates(response.data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (template) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name || '',
      type: template.type || 'customer_invoice',
      isDefault: template.isDefault || false,
      headerLogo: template.headerLogo || '',
      footerText: template.footerText || '',
      styles: template.styles || '',
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setSelectedTemplate(null);
    setFormData({
      name: '',
      type: 'customer_invoice',
      isDefault: false,
      headerLogo: '',
      footerText: '',
      styles: '',
    });
    setShowModal(true);
  };

  const openPreviewModal = (template) => {
    setSelectedTemplate(template);
    setShowPreviewModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedTemplate) {
        await api.put(`/admin/invoice-templates/${selectedTemplate._id}`, formData);
        toast.success('Template updated successfully');
      } else {
        await api.post('/admin/invoice-templates', formData);
        toast.success('Template created successfully');
      }
      setShowModal(false);
      fetchTemplates();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save template');
    }
  };

  const setAsDefault = async (templateId) => {
    try {
      await api.put(`/admin/invoice-templates/${templateId}/default`);
      toast.success('Template set as default');
      fetchTemplates();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to set default');
    }
  };

  const typeLabels = {
    customer_invoice: 'Customer Invoice',
    vendor_statement: 'Vendor Statement',
    commission_invoice: 'Commission Invoice',
    credit_note: 'Credit Note',
    payout_receipt: 'Payout Receipt',
  };

  const typeColors = {
    customer_invoice: 'bg-blue-50 text-blue-700',
    vendor_statement: 'bg-violet-50 text-violet-700',
    commission_invoice: 'bg-emerald-50 text-emerald-700',
    credit_note: 'bg-red-50 text-red-700',
    payout_receipt: 'bg-amber-50 text-amber-700',
  };

  const typeIcons = {
    customer_invoice: 'bg-blue-500',
    vendor_statement: 'bg-violet-500',
    commission_invoice: 'bg-emerald-500',
    credit_note: 'bg-red-500',
    payout_receipt: 'bg-amber-500',
  };

  // Stats
  const stats = {
    total: templates.length,
    defaults: templates.filter(t => t.isDefault).length,
    byType: Object.keys(typeLabels).reduce((acc, type) => {
      acc[type] = templates.filter(t => t.type === type).length;
      return acc;
    }, {}),
  };

  // Filter templates
  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || t.type === filterType;
    return matchesSearch && matchesType;
  });

  if (loading) return <Loading />;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-emerald-600">Invoice Templates</h1>
          <p className="text-gray-500 text-sm mt-1">Manage invoice and receipt templates</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Add Template
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <DocumentIcon className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Templates</p>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <StarIcon className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Default Templates</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.defaults}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
              <DocumentIcon className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Invoice Types</p>
              <p className="text-2xl font-bold text-violet-600">{stats.byType.customer_invoice || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <DocumentIcon className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Payout Receipts</p>
              <p className="text-2xl font-bold text-amber-600">{stats.byType.payout_receipt || 0}</p>
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
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="all">All Types</option>
              {Object.entries(typeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="sm:hidden divide-y divide-gray-100">
          {filteredTemplates.map((template) => (
            <div key={template._id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${typeIcons[template.type] || 'bg-gray-500'} flex items-center justify-center text-white`}>
                    <DocumentIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{template.name}</p>
                    {template.headerLogo && (
                      <p className="text-xs text-gray-500">Has logo</p>
                    )}
                  </div>
                </div>
                {template.isDefault ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                    <StarIcon className="w-3 h-3" />
                    Default
                  </span>
                ) : (
                  <span className="inline-flex px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                    Standard
                  </span>
                )}
              </div>

              <div className="mb-3">
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${typeColors[template.type] || 'bg-gray-100 text-gray-700'}`}>
                  {typeLabels[template.type] || template.type}
                </span>
              </div>

              {template.footerText && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {template.footerText}
                </p>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openPreviewModal(template)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors"
                >
                  <EyeIcon className="w-4 h-4" />
                  Preview
                </button>
                <button
                  onClick={() => openEditModal(template)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-sm font-medium transition-colors"
                >
                  <EditIcon className="w-4 h-4" />
                  Edit
                </button>
                {!template.isDefault && (
                  <button
                    onClick={() => setAsDefault(template._id)}
                    className="flex-1 px-3 py-2 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg text-sm font-medium transition-colors"
                  >
                    Set Default
                  </button>
                )}
              </div>
            </div>
          ))}
          {filteredTemplates.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              {searchQuery || filterType !== 'all' ? 'No templates found matching your criteria.' : 'No templates configured. Add your first template.'}
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-emerald-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Template</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Footer</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-emerald-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTemplates.map((template) => (
                <tr key={template._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full ${typeIcons[template.type] || 'bg-gray-500'} flex items-center justify-center text-white`}>
                        <DocumentIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{template.name}</p>
                        {template.headerLogo && (
                          <p className="text-xs text-gray-500">Has logo</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${typeColors[template.type] || 'bg-gray-100 text-gray-700'}`}>
                      {typeLabels[template.type] || template.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {template.isDefault ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                        <StarIcon className="w-3 h-3" />
                        Default
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                        Standard
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-600 truncate max-w-xs">
                      {template.footerText || <span className="italic text-gray-400">No footer text</span>}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openPreviewModal(template)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Preview"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(template)}
                        className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <EditIcon className="w-4 h-4" />
                      </button>
                      {!template.isDefault && (
                        <button
                          onClick={() => setAsDefault(template._id)}
                          className="px-3 py-1 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-xs font-medium transition-colors"
                        >
                          Set Default
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTemplates.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                    {searchQuery || filterType !== 'all' ? 'No templates found matching your criteria.' : 'No templates configured. Add your first template.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {filteredTemplates.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-emerald-600">
              Showing {filteredTemplates.length} of {templates.length} templates
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
                {selectedTemplate ? 'Edit Template' : 'Add New Template'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Template Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g., Standard Invoice"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <div className="relative">
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full appearance-none px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white disabled:bg-gray-50"
                      required
                      disabled={!!selectedTemplate}
                    >
                      {Object.entries(typeLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Header Logo URL</label>
                  <input
                    type="url"
                    value={formData.headerLogo}
                    onChange={(e) => setFormData({ ...formData, headerLogo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="https://example.com/logo.png"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Footer Text</label>
                  <textarea
                    value={formData.footerText}
                    onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    rows="3"
                    placeholder="Thank you for your business!"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Custom Styles (CSS)</label>
                  <textarea
                    value={formData.styles}
                    onChange={(e) => setFormData({ ...formData, styles: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    rows="4"
                    placeholder=".invoice-header { color: #333; }"
                  />
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="w-4 h-4 text-emerald-500 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700">Set as default template for this type</span>
                </label>
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
                  {selectedTemplate ? 'Update Template' : 'Add Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Template Preview</h2>
                <p className="text-sm text-gray-500">{selectedTemplate.name}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${typeColors[selectedTemplate.type]}`}>
                {typeLabels[selectedTemplate.type]}
              </span>
            </div>
            <div className="p-6">
              {/* Preview Content */}
              <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                {/* Header */}
                <div className="text-center mb-6 pb-4 border-b border-gray-200">
                  {selectedTemplate.headerLogo ? (
                    <img
                      src={selectedTemplate.headerLogo}
                      alt="Logo"
                      className="h-12 mx-auto mb-2"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  ) : (
                    <div className="w-24 h-12 bg-gray-200 rounded mx-auto mb-2 flex items-center justify-center text-gray-400 text-xs">
                      Logo
                    </div>
                  )}
                  <h3 className="text-lg font-bold text-gray-800">{typeLabels[selectedTemplate.type]}</h3>
                </div>

                {/* Sample Content */}
                <div className="space-y-4 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Invoice #:</span>
                    <span className="font-medium text-gray-800">INV-2024-001</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span className="font-medium text-gray-800">{new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="flex justify-between font-medium">
                      <span>Total:</span>
                      <span className="text-gray-800">Rs. 1,500.00</span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                {selectedTemplate.footerText && (
                  <div className="mt-6 pt-4 border-t border-gray-200 text-center text-sm text-gray-500">
                    {selectedTemplate.footerText}
                  </div>
                )}
              </div>

              {/* Custom Styles */}
              {selectedTemplate.styles && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Custom Styles:</p>
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto">
                    {selectedTemplate.styles}
                  </pre>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  openEditModal(selectedTemplate);
                }}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
              >
                Edit Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceTemplates;
