import { useState, useEffect } from 'react';
import api from '../../services/api';

const Redirects = () => {
  const [redirects, setRedirects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [filters, setFilters] = useState({
    isActive: '',
    reason: '',
    search: '',
  });
  const [stats, setStats] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingRedirect, setEditingRedirect] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    fetchRedirects();
    fetchStats();
  }, [pagination.page, filters]);

  const fetchRedirects = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
      });

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '') params.append(key, value);
      });

      const response = await api.get(`/seo/admin/redirects?${params}`);
      setRedirects(response.data.data);
      setPagination(prev => ({
        ...prev,
        ...response.data.pagination,
      }));
    } catch (error) {
      console.error('Failed to fetch redirects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/seo/admin/redirects/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const deleteRedirect = async (id) => {
    if (!confirm('Are you sure you want to delete this redirect?')) return;

    try {
      await api.delete(`/seo/admin/redirects/${id}`);
      fetchRedirects();
      fetchStats();
    } catch (error) {
      console.error('Failed to delete redirect:', error);
      alert('Failed to delete redirect');
    }
  };

  const fixChains = async () => {
    try {
      const response = await api.post('/seo/admin/redirects/fix-chains');
      alert(`Fixed ${response.data.fixed} redirect chains`);
      fetchRedirects();
    } catch (error) {
      console.error('Failed to fix chains:', error);
    }
  };

  const getReasonLabel = (reason) => {
    const labels = {
      slug_change: 'Slug Changed',
      url_restructure: 'URL Restructure',
      manual: 'Manual',
      seo_optimization: 'SEO Optimization',
      deleted_content: 'Deleted Content',
    };
    return labels[reason] || reason;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">URL Redirects</h1>
        <div className="flex gap-2">
          <button onClick={fixChains} className="btn-secondary">
            Fix Chains
          </button>
          <button onClick={() => setShowImportModal(true)} className="btn-secondary">
            Import
          </button>
          <button onClick={() => { setEditingRedirect(null); setShowModal(true); }} className="btn-primary">
            Add Redirect
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="card p-4">
            <p className="text-sm text-gray-500">Total Redirects</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total || 0}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-500">Active</p>
            <p className="text-2xl font-bold text-green-600">{stats.active || 0}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-500">Total Hits</p>
            <p className="text-2xl font-bold text-blue-600">{stats.totalHits?.toLocaleString() || 0}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-500">301 Redirects</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.byType?.find(t => t._id === 301)?.count || 0}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="label">Status</label>
            <select
              className="input"
              value={filters.isActive}
              onChange={(e) => setFilters(prev => ({ ...prev, isActive: e.target.value }))}
            >
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <div>
            <label className="label">Reason</label>
            <select
              className="input"
              value={filters.reason}
              onChange={(e) => setFilters(prev => ({ ...prev, reason: e.target.value }))}
            >
              <option value="">All Reasons</option>
              <option value="slug_change">Slug Changed</option>
              <option value="url_restructure">URL Restructure</option>
              <option value="manual">Manual</option>
              <option value="seo_optimization">SEO Optimization</option>
              <option value="deleted_content">Deleted Content</option>
            </select>
          </div>
          <div>
            <label className="label">Search</label>
            <input
              type="text"
              className="input"
              placeholder="Search URLs..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ isActive: '', reason: '', search: '' })}
              className="btn-secondary w-full"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Redirects Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Old URL</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">New URL</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Reason</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Hits</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center">
                    <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
                  </td>
                </tr>
              ) : redirects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No redirects found
                  </td>
                </tr>
              ) : (
                redirects.map((redirect) => (
                  <tr key={redirect._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded break-all">
                        {redirect.oldUrl}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-sm bg-green-50 text-green-700 px-2 py-1 rounded break-all">
                        {redirect.newUrl}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        {redirect.redirectType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {getReasonLabel(redirect.reason)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {redirect.hitCount?.toLocaleString() || 0}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        redirect.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {redirect.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setEditingRedirect(redirect); setShowModal(true); }}
                          className="text-primary-600 hover:text-primary-700 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteRedirect(redirect._id)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Delete
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
          <div className="px-4 py-3 border-t border-gray-100 flex justify-between items-center">
            <span className="text-sm text-gray-500">
              Showing {redirects.length} of {pagination.total} redirects
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="btn-secondary"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.pages}
                className="btn-secondary"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Top Redirects */}
      {stats?.topRedirects?.length > 0 && (
        <div className="card mt-6">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Top Redirects by Hits</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {stats.topRedirects.slice(0, 5).map((redirect) => (
              <div key={redirect._id} className="p-4 flex items-center justify-between">
                <div>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">{redirect.oldUrl}</code>
                  <span className="mx-2 text-gray-400">→</span>
                  <code className="text-sm bg-green-50 text-green-700 px-2 py-1 rounded">{redirect.newUrl}</code>
                </div>
                <span className="font-medium text-gray-900">{redirect.hitCount?.toLocaleString()} hits</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <RedirectModal
          redirect={editingRedirect}
          onClose={() => { setShowModal(false); setEditingRedirect(null); }}
          onSave={() => {
            setShowModal(false);
            setEditingRedirect(null);
            fetchRedirects();
            fetchStats();
          }}
        />
      )}

      {/* Import Modal */}
      {showImportModal && (
        <ImportModal
          onClose={() => setShowImportModal(false)}
          onSave={() => {
            setShowImportModal(false);
            fetchRedirects();
            fetchStats();
          }}
        />
      )}
    </div>
  );
};

// Redirect Modal Component
const RedirectModal = ({ redirect, onClose, onSave }) => {
  const [form, setForm] = useState({
    oldUrl: redirect?.oldUrl || '',
    newUrl: redirect?.newUrl || '',
    redirectType: redirect?.redirectType || 301,
    reason: redirect?.reason || 'manual',
    description: redirect?.description || '',
    isActive: redirect?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.oldUrl || !form.newUrl) {
      alert('Old URL and New URL are required');
      return;
    }

    try {
      setSaving(true);
      if (redirect) {
        await api.put(`/seo/admin/redirects/${redirect._id}`, form);
      } else {
        await api.post('/seo/admin/redirects', form);
      }
      onSave();
    } catch (error) {
      console.error('Failed to save redirect:', error);
      alert(error.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            {redirect ? 'Edit Redirect' : 'Add Redirect'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="label">Old URL *</label>
            <input
              type="text"
              className="input"
              placeholder="/old-path"
              value={form.oldUrl}
              onChange={(e) => setForm(prev => ({ ...prev, oldUrl: e.target.value }))}
            />
          </div>

          <div>
            <label className="label">New URL *</label>
            <input
              type="text"
              className="input"
              placeholder="/new-path"
              value={form.newUrl}
              onChange={(e) => setForm(prev => ({ ...prev, newUrl: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Redirect Type</label>
              <select
                className="input"
                value={form.redirectType}
                onChange={(e) => setForm(prev => ({ ...prev, redirectType: parseInt(e.target.value) }))}
              >
                <option value={301}>301 (Permanent)</option>
                <option value={302}>302 (Temporary)</option>
                <option value={307}>307 (Temporary)</option>
                <option value={308}>308 (Permanent)</option>
              </select>
            </div>
            <div>
              <label className="label">Reason</label>
              <select
                className="input"
                value={form.reason}
                onChange={(e) => setForm(prev => ({ ...prev, reason: e.target.value }))}
              >
                <option value="manual">Manual</option>
                <option value="slug_change">Slug Changed</option>
                <option value="url_restructure">URL Restructure</option>
                <option value="seo_optimization">SEO Optimization</option>
                <option value="deleted_content">Deleted Content</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Description (optional)</label>
            <textarea
              className="input"
              rows={2}
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm(prev => ({ ...prev, isActive: e.target.checked }))}
              />
              <span className="text-sm text-gray-700">Active</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Import Modal Component
const ImportModal = ({ onClose, onSave }) => {
  const [csvText, setCsvText] = useState('');
  const [importing, setImporting] = useState(false);

  const handleImport = async () => {
    try {
      const lines = csvText.trim().split('\n');
      const redirects = [];

      for (const line of lines) {
        const [oldUrl, newUrl, redirectType] = line.split(',').map(s => s.trim());
        if (oldUrl && newUrl) {
          redirects.push({
            oldUrl,
            newUrl,
            redirectType: parseInt(redirectType) || 301,
          });
        }
      }

      if (redirects.length === 0) {
        alert('No valid redirects found');
        return;
      }

      setImporting(true);
      const response = await api.post('/seo/admin/redirects/import', { redirects });
      alert(`Imported ${response.data.created} redirects`);
      onSave();
    } catch (error) {
      console.error('Failed to import:', error);
      alert(error.response?.data?.message || 'Failed to import');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Import Redirects</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-600">
            Enter redirects in CSV format: oldUrl, newUrl, redirectType (optional)
          </p>
          <div>
            <label className="label">CSV Data</label>
            <textarea
              className="input font-mono text-sm"
              rows={10}
              placeholder="/old-page, /new-page, 301
/another-old, /another-new
/page-3, /page-3-new, 302"
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button onClick={handleImport} disabled={importing} className="btn-primary">
              {importing ? 'Importing...' : 'Import'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Redirects;
