import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Button, Modal } from '../../components/common';

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

const EyeIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
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

const MoreIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
  </svg>
);

const AdminVendors = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [actionModal, setActionModal] = useState({ open: false, vendor: null, action: null });

  useEffect(() => {
    fetchVendors();
  }, [filter]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const response = await api.get(`/admin/vendors${params}`);
      setVendors(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
      toast.error('Failed to fetch vendors');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!actionModal.vendor) return;
    try {
      await api.put(`/admin/vendors/${actionModal.vendor._id}/approve`);
      toast.success('Vendor approved successfully');
      setActionModal({ open: false, vendor: null, action: null });
      fetchVendors();
    } catch (error) {
      toast.error('Failed to approve vendor');
    }
  };

  const handleReject = async () => {
    if (!actionModal.vendor) return;
    try {
      await api.put(`/admin/vendors/${actionModal.vendor._id}/reject`);
      toast.success('Vendor rejected');
      setActionModal({ open: false, vendor: null, action: null });
      fetchVendors();
    } catch (error) {
      toast.error('Failed to reject vendor');
    }
  };

  const pendingCount = vendors.filter(v => !v.isApproved).length;
  const approvedCount = vendors.filter(v => v.isApproved).length;

  const getAvatarColor = (index) => {
    const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-violet-500', 'bg-amber-500', 'bg-pink-500', 'bg-cyan-500'];
    return colors[index % colors.length];
  };

  const filteredVendors = vendors.filter(vendor =>
    vendor.storeName?.toLowerCase().includes(search.toLowerCase()) ||
    vendor.contactEmail?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-emerald-600">Vendor Management</h1>
          <p className="text-sm text-gray-500 mt-1">{vendors.length} total vendors</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'all' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          All ({vendors.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'pending' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Pending ({pendingCount})
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'approved' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Approved ({approvedCount})
        </button>
      </div>

      {/* Vendors Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* Table Header with Filters */}
        <div className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-900">All Vendors</h3>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-900" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 w-40 placeholder-gray-900 text-gray-900"
              />
            </div>

            {/* Rows per page */}
            <div className="relative">
              <select className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm text-gray-900">
                <option>10 Row</option>
                <option>20 Row</option>
                <option>50 Row</option>
              </select>
              <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-900 pointer-events-none" />
            </div>

            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <MoreIcon className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto" />
          </div>
        ) : filteredVendors.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No vendors found</div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="sm:hidden divide-y divide-gray-100">
              {filteredVendors.map((vendor, index) => (
                <div key={vendor._id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {vendor.logo ? (
                        <img src={vendor.logo} alt={vendor.storeName} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className={`w-10 h-10 rounded-full ${getAvatarColor(index)} flex items-center justify-center`}>
                          <span className="text-white text-sm font-medium">{vendor.storeName?.[0]}</span>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{vendor.storeName}</p>
                        <p className="text-xs text-gray-500">{vendor.storeSlug}</p>
                      </div>
                    </div>
                    {vendor.isApproved ? (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">Approved</span>
                    ) : (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700">Pending</span>
                    )}
                  </div>
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Owner</span>
                      <span className="text-gray-700">{vendor.user?.profile?.firstName} {vendor.user?.profile?.lastName}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Contact</span>
                      <span className="text-gray-700 truncate ml-2">{vendor.contactEmail}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Products</span>
                      <span className="text-gray-700">{vendor.productCount || 0}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-xs text-gray-400">#{vendor._id.slice(-6)}</span>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/vendor/${vendor.storeSlug}`}
                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </Link>
                      {!vendor.isApproved && (
                        <>
                          <button
                            onClick={() => setActionModal({ open: true, vendor, action: 'approve' })}
                            className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded transition-colors"
                          >
                            <CheckIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setActionModal({ open: true, vendor, action: 'reject' })}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                          >
                            <XIcon className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-emerald-50">
                    <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">ID</th>
                    <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Store</th>
                    <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Owner</th>
                    <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Contact</th>
                    <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Status</th>
                    <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Products</th>
                    <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVendors.map((vendor, index) => (
                    <tr key={vendor._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-500">#{vendor._id.slice(-6)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {vendor.logo ? (
                            <img src={vendor.logo} alt={vendor.storeName} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className={`w-8 h-8 rounded-full ${getAvatarColor(index)} flex items-center justify-center`}>
                              <span className="text-white text-xs font-medium">{vendor.storeName?.[0]}</span>
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900">{vendor.storeName}</p>
                            <p className="text-xs text-gray-500">{vendor.storeSlug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {vendor.user?.profile?.firstName} {vendor.user?.profile?.lastName}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">{vendor.contactEmail}</p>
                        <p className="text-xs text-gray-500">{vendor.contactPhone}</p>
                      </td>
                      <td className="px-6 py-4">
                        {vendor.isApproved ? (
                          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">Approved</span>
                        ) : (
                          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700">Pending</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {vendor.productCount || 0}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <Link
                            to={`/vendor/${vendor.storeSlug}`}
                            className="p-1 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                            title="View Store"
                          >
                            <EyeIcon className="w-5 h-5" />
                          </Link>
                          {!vendor.isApproved && (
                            <>
                              <button
                                onClick={() => setActionModal({ open: true, vendor, action: 'approve' })}
                                className="p-1 text-emerald-500 hover:bg-emerald-50 rounded transition-colors"
                                title="Approve"
                              >
                                <CheckIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => setActionModal({ open: true, vendor, action: 'reject' })}
                                className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                                title="Reject"
                              >
                                <XIcon className="w-5 h-5" />
                              </button>
                            </>
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

        {/* Pagination */}
        <div className="px-6 py-4 flex items-center justify-between border-t border-gray-100">
          <p className="text-sm text-emerald-600">
            Showing {filteredVendors.length} of {vendors.length} Result
          </p>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              Previous
            </button>
            <button className="w-8 h-8 text-sm bg-emerald-500 text-white rounded-lg">
              01
            </button>
            <button className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Action Modal */}
      <Modal
        isOpen={actionModal.open}
        onClose={() => setActionModal({ open: false, vendor: null, action: null })}
        title={actionModal.action === 'approve' ? 'Approve Vendor' : 'Reject Vendor'}
      >
        <p className="text-gray-600 mb-6">
          {actionModal.action === 'approve'
            ? `Are you sure you want to approve "${actionModal.vendor?.storeName}"? They will be able to start selling products.`
            : `Are you sure you want to reject "${actionModal.vendor?.storeName}"? They will need to reapply.`}
        </p>
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => setActionModal({ open: false, vendor: null, action: null })}>
            Cancel
          </Button>
          {actionModal.action === 'approve' ? (
            <Button onClick={handleApprove}>Approve</Button>
          ) : (
            <Button variant="danger" onClick={handleReject}>Reject</Button>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default AdminVendors;
