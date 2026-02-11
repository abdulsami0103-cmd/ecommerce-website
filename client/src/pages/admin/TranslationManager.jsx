import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

// Icons
const GlobeIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PlusIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const UploadIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);

const DownloadIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
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

const DocumentTextIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const ChartIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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

const ChevronLeftIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const getAvatarColor = (index) => {
  const colors = [
    'bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-pink-500',
    'bg-orange-500', 'bg-teal-500', 'bg-indigo-500', 'bg-rose-500'
  ];
  return colors[index % colors.length];
};

const TranslationManager = () => {
  const [activeTab, setActiveTab] = useState('languages');
  const [languages, setLanguages] = useState([]);
  const [strings, setStrings] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 });
  const [filters, setFilters] = useState({
    languageCode: '',
    namespace: '',
    search: '',
  });
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingString, setEditingString] = useState(null);

  useEffect(() => {
    fetchLanguages();
  }, []);

  useEffect(() => {
    if (activeTab === 'strings') {
      fetchStrings();
    } else if (activeTab === 'stats') {
      fetchStats();
    }
  }, [activeTab, pagination.page, filters]);

  const fetchLanguages = async () => {
    try {
      setLoading(true);
      const response = await api.get('/localization/languages');
      setLanguages(response.data.data);
    } catch (error) {
      console.error('Failed to fetch languages:', error);
      toast.error('Failed to load languages');
    } finally {
      setLoading(false);
    }
  };

  const fetchStrings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
      });

      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await api.get(`/localization/admin/ui-strings?${params}`);
      setStrings(response.data.data);
      setPagination(prev => ({
        ...prev,
        ...response.data.pagination,
      }));
    } catch (error) {
      console.error('Failed to fetch strings:', error);
      toast.error('Failed to load strings');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/localization/admin/ui-strings/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      toast.error('Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  const deleteLanguage = async (id) => {
    if (!confirm('Are you sure you want to delete this language? All translations will be lost.')) return;

    try {
      await api.delete(`/localization/admin/languages/${id}`);
      toast.success('Language deleted');
      fetchLanguages();
    } catch (error) {
      console.error('Failed to delete language:', error);
      toast.error(error.response?.data?.message || 'Failed to delete language');
    }
  };

  const exportStrings = async (languageCode) => {
    try {
      const response = await api.get(`/localization/admin/ui-strings/export?languageCode=${languageCode}`);
      const blob = new Blob([JSON.stringify(response.data.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `translations-${languageCode}.json`;
      a.click();
      toast.success('Translations exported');
    } catch (error) {
      console.error('Failed to export strings:', error);
      toast.error('Failed to export translations');
    }
  };

  const langStats = {
    total: languages.length,
    active: languages.filter(l => l.isActive).length,
    rtl: languages.filter(l => l.direction === 'rtl').length,
    default: languages.find(l => l.isDefault)?.name || 'None'
  };

  const tabs = [
    { id: 'languages', label: 'Languages', icon: GlobeIcon },
    { id: 'strings', label: 'UI Strings', icon: DocumentTextIcon },
    { id: 'stats', label: 'Statistics', icon: ChartIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-3 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-emerald-600">Translation Manager</h1>
            <p className="text-gray-500 text-sm mt-0.5">Manage languages and translations</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm"
            >
              <UploadIcon className="w-4 h-4" />
              Import
            </button>
            <button
              onClick={() => { setSelectedLanguage(null); setShowLanguageModal(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors text-sm"
            >
              <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              Add Language
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-3 sm:p-4 border border-gray-100">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="w-9 h-9 sm:w-12 sm:h-12 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                <GlobeIcon className="w-4 h-4 sm:w-6 sm:h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Languages</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-800">{langStats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-3 sm:p-4 border border-gray-100">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="w-9 h-9 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                <CheckCircleIcon className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Active</p>
                <p className="text-lg sm:text-2xl font-bold text-blue-600">{langStats.active}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-3 sm:p-4 border border-gray-100">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="w-9 h-9 sm:w-12 sm:h-12 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
                <DocumentTextIcon className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500">RTL</p>
                <p className="text-lg sm:text-2xl font-bold text-purple-600">{langStats.rtl}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-3 sm:p-4 border border-gray-100">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="w-9 h-9 sm:w-12 sm:h-12 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                <ChartIcon className="w-4 h-4 sm:w-6 sm:h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Default</p>
                <p className="text-lg sm:text-2xl font-bold text-orange-600 truncate max-w-[80px] sm:max-w-[100px]">{langStats.default}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-3 sm:mb-6">
          <div className="flex border-b border-gray-100">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 sm:flex-none flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 px-3 sm:px-6 py-2.5 sm:py-4 text-xs sm:text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-emerald-600 border-b-2 border-emerald-500 -mb-px'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Languages Tab */}
        {activeTab === 'languages' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="py-8 sm:py-12 text-center">
                <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto"></div>
              </div>
            ) : languages.length === 0 ? (
              <div className="py-8 sm:py-12 text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <GlobeIcon className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm">No languages found</p>
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="sm:hidden divide-y divide-gray-100">
                  {languages.map((lang) => (
                    <div key={lang._id} className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg shrink-0">{lang.flag}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-medium text-gray-800 text-sm truncate">{lang.name}</p>
                            <code className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0">{lang.code}</code>
                            <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ${
                              lang.direction === 'rtl' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                            }`}>{lang.direction.toUpperCase()}</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${lang.translationProgress || 0}%` }} />
                            </div>
                            <span className="text-[10px] text-gray-500">{lang.translationProgress || 0}%</span>
                            {lang.isDefault && (
                              <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700">Default</span>
                            )}
                            <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              lang.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                            }`}>{lang.isActive ? 'Active' : 'Off'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            onClick={() => { setSelectedLanguage(lang); setShowLanguageModal(true); }}
                            className="p-1.5 text-gray-400 hover:text-emerald-600 rounded-lg"
                          >
                            <PencilIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => exportStrings(lang.code)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg"
                          >
                            <DownloadIcon className="w-3.5 h-3.5" />
                          </button>
                          {!lang.isDefault && (
                            <button
                              onClick={() => deleteLanguage(lang._id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"
                            >
                              <TrashIcon className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-emerald-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-emerald-700 uppercase tracking-wider">Language</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-emerald-700 uppercase tracking-wider">Code</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-emerald-700 uppercase tracking-wider">Direction</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-emerald-700 uppercase tracking-wider">Progress</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-emerald-700 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-emerald-700 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {languages.map((lang) => (
                        <tr key={lang._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{lang.flag}</span>
                              <div>
                                <p className="font-medium text-gray-800">{lang.name}</p>
                                <p className="text-sm text-gray-500">{lang.nativeName}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <code className="bg-gray-100 px-2.5 py-1 rounded-lg text-sm font-medium">{lang.code}</code>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${
                              lang.direction === 'rtl' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                            }`}>{lang.direction.toUpperCase()}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-24 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${lang.translationProgress || 0}%` }} />
                              </div>
                              <span className="text-sm font-medium text-gray-600">{lang.translationProgress || 0}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-1">
                              {lang.isDefault && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Default</span>
                              )}
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                lang.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                              }`}>{lang.isActive ? 'Active' : 'Inactive'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => { setSelectedLanguage(lang); setShowLanguageModal(true); }}
                                className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => exportStrings(lang.code)}
                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <DownloadIcon className="w-4 h-4" />
                              </button>
                              {!lang.isDefault && (
                                <button
                                  onClick={() => deleteLanguage(lang._id)}
                                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              )}
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
        )}

        {/* Strings Tab */}
        {activeTab === 'strings' && (
          <div>
            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-sm p-3 sm:p-6 border border-gray-100 mb-3 sm:mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Language</label>
                  <select
                    value={filters.languageCode}
                    onChange={(e) => setFilters(prev => ({ ...prev, languageCode: e.target.value }))}
                    className="w-full px-3 py-1.5 sm:px-4 sm:py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="">All</option>
                    {languages.map((lang) => (
                      <option key={lang.code} value={lang.code}>{lang.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Namespace</label>
                  <select
                    value={filters.namespace}
                    onChange={(e) => setFilters(prev => ({ ...prev, namespace: e.target.value }))}
                    className="w-full px-3 py-1.5 sm:px-4 sm:py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="">All</option>
                    <option value="common">Common</option>
                    <option value="nav">Navigation</option>
                    <option value="product">Product</option>
                    <option value="cart">Cart</option>
                    <option value="checkout">Checkout</option>
                    <option value="auth">Auth</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Search</label>
                  <div className="relative">
                    <SearchIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search key or value..."
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="w-full pl-9 pr-3 py-1.5 sm:pl-10 sm:pr-4 sm:py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>
                <div className="col-span-2 sm:col-span-1 flex items-end">
                  <button
                    onClick={() => setFilters({ languageCode: '', namespace: '', search: '' })}
                    className="w-full px-3 py-1.5 sm:px-4 sm:py-2 text-sm text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

            {/* Strings Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-emerald-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-emerald-700 uppercase tracking-wider">Key</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-emerald-700 uppercase tracking-wider">Value</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-emerald-700 uppercase tracking-wider">Language</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-emerald-700 uppercase tracking-wider">Namespace</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-emerald-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto"></div>
                        </td>
                      </tr>
                    ) : strings.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <DocumentTextIcon className="w-8 h-8 text-gray-400" />
                          </div>
                          <p className="text-gray-500">No strings found</p>
                        </td>
                      </tr>
                    ) : (
                      strings.map((str, index) => (
                        <tr key={str._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <code className="text-sm bg-gray-100 px-2.5 py-1 rounded-lg">{str.key}</code>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-800 max-w-md truncate">
                            {str.value}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700">
                              {str.languageCode}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-600">{str.namespace}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end">
                              <button
                                onClick={() => setEditingString(str)}
                                className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Showing <span className="font-medium">{strings.length}</span> of <span className="font-medium">{pagination.total}</span> strings
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                      className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeftIcon className="w-4 h-4" />
                      Previous
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-600">
                      Page {pagination.page} of {pagination.pages}
                    </span>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.pages}
                      className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                      <ChevronRightIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
            {loading ? (
              <div className="col-span-full flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
              </div>
            ) : stats.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ChartIcon className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm">No translation stats available</p>
              </div>
            ) : (
              stats.map((stat, index) => (
                <div key={stat.languageCode} className="bg-white rounded-2xl shadow-sm p-3 sm:p-6 border border-gray-100">
                  <div className="flex items-center gap-2.5 mb-3 sm:mb-4">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 ${getAvatarColor(index)} rounded-xl flex items-center justify-center text-white font-bold text-xs sm:text-sm`}>
                      {stat.languageCode.toUpperCase().slice(0, 2)}
                    </div>
                    <h3 className="font-semibold text-gray-800 text-sm sm:text-base">{stat.languageCode.toUpperCase()}</h3>
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-500">Total Strings</span>
                      <span className="font-medium text-gray-800">{stat.totalStrings}</span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-500">Auto-translated</span>
                      <span className="font-medium text-orange-600">{stat.totalAutoTranslated}</span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-500">Manual</span>
                      <span className="font-medium text-emerald-600">{stat.manuallyTranslated}</span>
                    </div>
                    <div className="border-t border-gray-100 pt-2 sm:pt-3 mt-2 sm:mt-3">
                      <p className="text-[10px] sm:text-xs font-medium text-gray-500 mb-1.5">By Namespace</p>
                      {stat.namespaces.map((ns) => (
                        <div key={ns.namespace} className="flex justify-between text-[10px] sm:text-xs text-gray-600 mb-0.5">
                          <span>{ns.namespace}</span>
                          <span className="font-medium">{ns.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Language Modal */}
        {showLanguageModal && (
          <LanguageModal
            language={selectedLanguage}
            onClose={() => { setShowLanguageModal(false); setSelectedLanguage(null); }}
            onSave={() => {
              setShowLanguageModal(false);
              setSelectedLanguage(null);
              fetchLanguages();
            }}
          />
        )}

        {/* Import Modal */}
        {showImportModal && (
          <ImportModal
            languages={languages}
            onClose={() => setShowImportModal(false)}
            onSave={() => {
              setShowImportModal(false);
              fetchStrings();
            }}
          />
        )}

        {/* Edit String Modal */}
        {editingString && (
          <EditStringModal
            string={editingString}
            onClose={() => setEditingString(null)}
            onSave={() => {
              setEditingString(null);
              fetchStrings();
            }}
          />
        )}
      </div>
    </div>
  );
};

// Language Modal
const LanguageModal = ({ language, onClose, onSave }) => {
  const [form, setForm] = useState({
    code: language?.code || '',
    name: language?.name || '',
    nativeName: language?.nativeName || '',
    direction: language?.direction || 'ltr',
    flag: language?.flag || '',
    isActive: language?.isActive ?? true,
    isDefault: language?.isDefault ?? false,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      if (language) {
        await api.put(`/localization/admin/languages/${language._id}`, form);
        toast.success('Language updated');
      } else {
        await api.post('/localization/admin/languages', form);
        toast.success('Language created');
      }
      onSave();
    } catch (error) {
      console.error('Failed to save language:', error);
      toast.error(error.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />

        <div className="relative inline-block w-full max-w-md bg-white rounded-2xl shadow-xl text-left overflow-hidden transform transition-all sm:my-8">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800">
              {language ? 'Edit Language' : 'Add Language'}
            </h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                <input
                  type="text"
                  maxLength={5}
                  placeholder="en"
                  value={form.code}
                  onChange={(e) => setForm(prev => ({ ...prev, code: e.target.value.toLowerCase() }))}
                  disabled={!!language}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Flag (emoji)</label>
                <input
                  type="text"
                  maxLength={4}
                  value={form.flag}
                  onChange={(e) => setForm(prev => ({ ...prev, flag: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-center text-xl"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                placeholder="English"
                value={form.name}
                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Native Name *</label>
              <input
                type="text"
                placeholder="English"
                value={form.nativeName}
                onChange={(e) => setForm(prev => ({ ...prev, nativeName: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Direction</label>
              <select
                value={form.direction}
                onChange={(e) => setForm(prev => ({ ...prev, direction: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="ltr">Left to Right (LTR)</option>
                <option value="rtl">Right to Left (RTL)</option>
              </select>
            </div>
            <div className="flex gap-4 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) => setForm(prev => ({ ...prev, isDefault: e.target.checked }))}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700">Default</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 justify-end p-6 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Import Modal
const ImportModal = ({ languages, onClose, onSave }) => {
  const [languageCode, setLanguageCode] = useState('');
  const [jsonData, setJsonData] = useState('');
  const [overwrite, setOverwrite] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleImport = async () => {
    if (!languageCode || !jsonData) {
      toast.error('Language and JSON data are required');
      return;
    }

    try {
      const data = JSON.parse(jsonData);
      setImporting(true);
      const response = await api.post('/localization/admin/ui-strings/import', {
        languageCode,
        data,
        overwrite,
      });
      toast.success(response.data.message);
      onSave();
    } catch (error) {
      console.error('Failed to import:', error);
      toast.error(error.message === 'Unexpected token' ? 'Invalid JSON' : error.response?.data?.message || 'Failed to import');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />

        <div className="relative inline-block w-full max-w-lg bg-white rounded-2xl shadow-xl text-left overflow-hidden transform transition-all sm:my-8">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800">Import Translations</h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
              <select
                value={languageCode}
                onChange={(e) => setLanguageCode(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="">Select language</option>
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>{lang.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">JSON Data</label>
              <textarea
                rows={10}
                placeholder='{"common": {"loading": "Loading..."}}'
                value={jsonData}
                onChange={(e) => setJsonData(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-sm"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={overwrite}
                onChange={(e) => setOverwrite(e.target.checked)}
                className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
              />
              <span className="text-sm text-gray-700">Overwrite existing strings</span>
            </label>
          </div>

          <div className="flex gap-3 justify-end p-6 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={importing}
              className="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {importing && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {importing ? 'Importing...' : 'Import'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Edit String Modal
const EditStringModal = ({ string, onClose, onSave }) => {
  const [value, setValue] = useState(string.value);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/localization/admin/ui-strings', {
        key: string.key,
        languageCode: string.languageCode,
        value,
        namespace: string.namespace,
      });
      toast.success('String updated');
      onSave();
    } catch (error) {
      console.error('Failed to save string:', error);
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />

        <div className="relative inline-block w-full max-w-lg bg-white rounded-2xl shadow-xl text-left overflow-hidden transform transition-all sm:my-8">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800">Edit String</h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Key</label>
              <code className="block bg-gray-100 px-4 py-2 rounded-xl text-sm">{string.key}</code>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100">{string.languageCode}</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
              <textarea
                rows={4}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end p-6 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranslationManager;
