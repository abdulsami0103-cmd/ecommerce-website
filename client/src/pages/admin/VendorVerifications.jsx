import { useState, useEffect } from 'react';
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

const AdminVendorVerifications = () => {
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchVendors();
  }, [statusFilter]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/vendor/verification/admin/pending?status=${statusFilter}`);
      setVendors(response.data.data);
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
      toast.error('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (action) => {
    if (action === 'reject' && !rejectionReason) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setProcessing(true);
    try {
      await api.patch(`/vendor/verification/admin/${selectedVendor._id}/verify`, {
        action,
        notes,
        rejectionReason,
      });
      toast.success(`Vendor ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'requested to resubmit'}`);
      setShowModal(false);
      setSelectedVendor(null);
      setNotes('');
      setRejectionReason('');
      fetchVendors();
    } catch (error) {
      toast.error('Failed to process verification');
    } finally {
      setProcessing(false);
    }
  };

  const handleReviewDocument = async (docId, status) => {
    try {
      await api.patch(`/vendor/verification/admin/document/${docId}/review`, {
        status,
        notes: status === 'rejected' ? 'Document not valid' : '',
      });
      toast.success(`Document ${status}`);
      const updated = vendors.find(v => v._id === selectedVendor._id);
      if (updated) {
        const doc = updated.documents.find(d => d._id === docId);
        if (doc) doc.status = status;
        setSelectedVendor({ ...updated });
      }
    } catch (error) {
      toast.error('Failed to review document');
    }
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      pending: 'bg-amber-100 text-amber-700',
      under_review: 'bg-blue-100 text-blue-700',
      verified: 'bg-emerald-100 text-emerald-700',
      rejected: 'bg-red-100 text-red-700',
      suspended: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getDocStatusBadgeColor = (status) => {
    const colors = {
      pending: 'bg-amber-100 text-amber-700',
      approved: 'bg-emerald-100 text-emerald-700',
      rejected: 'bg-red-100 text-red-700',
      resubmit_required: 'bg-blue-100 text-blue-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getAvatarColor = (index) => {
    const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-violet-500', 'bg-amber-500', 'bg-pink-500', 'bg-cyan-500'];
    return colors[index % colors.length];
  };

  const filteredVendors = vendors.filter(vendor =>
    vendor.storeName?.toLowerCase().includes(search.toLowerCase()) ||
    vendor.user?.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-emerald-600">Vendor Verifications</h1>
          <p className="text-sm text-gray-500 mt-1">{vendors.length} vendors found</p>
        </div>
      </div>

      {/* Verifications Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* Table Header with Filters */}
        <div className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-900">All Verifications</h3>

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

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm text-gray-900"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="under_review">Under Review</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
              </select>
              <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-900 pointer-events-none" />
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
        {filteredVendors.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No vendors found with this status
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="sm:hidden divide-y divide-gray-100">
              {filteredVendors.map((vendor, index) => (
                <div key={vendor._id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${getAvatarColor(index)} flex items-center justify-center flex-shrink-0`}>
                        <span className="text-white text-sm font-medium">{vendor.storeName?.[0]}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{vendor.storeName}</p>
                        <p className="text-xs text-gray-500 truncate">{vendor.user?.email}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${getStatusBadgeColor(vendor.verificationStatus)}`}>
                      {vendor.verificationStatus}
                    </span>
                  </div>
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Business</span>
                      <span className="text-gray-700 truncate ml-2">{vendor.businessDetails?.businessName || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Progress</span>
                      <span className="text-gray-700">Step {vendor.verificationStep} of 5</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Documents</span>
                      <span className="text-gray-700">{vendor.documents?.length || 0} uploaded</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-xs text-gray-400">#{vendor._id.slice(-6)}</span>
                    <button
                      onClick={() => {
                        setSelectedVendor(vendor);
                        setShowModal(true);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <EyeIcon className="w-4 h-4" />
                      Review
                    </button>
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
                    <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Vendor</th>
                    <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Business</th>
                    <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Status</th>
                    <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Step</th>
                    <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Documents</th>
                    <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVendors.map((vendor, index) => (
                    <tr key={vendor._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-500">#{vendor._id.slice(-6)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full ${getAvatarColor(index)} flex items-center justify-center`}>
                            <span className="text-white text-xs font-medium">{vendor.storeName?.[0]}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{vendor.storeName}</p>
                            <p className="text-xs text-gray-500">{vendor.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">{vendor.businessDetails?.businessName || '-'}</p>
                        <p className="text-xs text-gray-500 capitalize">{vendor.businessDetails?.businessType || '-'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(vendor.verificationStatus)}`}>
                          {vendor.verificationStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        Step {vendor.verificationStep} of 5
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {vendor.documents?.length || 0} uploaded
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setSelectedVendor(vendor);
                            setShowModal(true);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <EyeIcon className="w-4 h-4" />
                          Review
                        </button>
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

      {/* Review Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedVendor(null);
        }}
        title={`Review: ${selectedVendor?.storeName}`}
        size="lg"
      >
        {selectedVendor && (
          <div className="space-y-6">
            {/* Business Details */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Business Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Business Name</p>
                  <p className="text-gray-900">{selectedVendor.businessDetails?.businessName || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Business Type</p>
                  <p className="text-gray-900 capitalize">{selectedVendor.businessDetails?.businessType || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Tax ID</p>
                  <p className="text-gray-900">{selectedVendor.businessDetails?.taxId || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Registration Number</p>
                  <p className="text-gray-900">{selectedVendor.businessDetails?.registrationNumber || '-'}</p>
                </div>
              </div>
            </div>

            {/* Address */}
            {selectedVendor.address && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Address</h3>
                <p className="text-sm text-gray-700">
                  {selectedVendor.address.street}, {selectedVendor.address.city}, {selectedVendor.address.state}{' '}
                  {selectedVendor.address.zipCode}, {selectedVendor.address.country}
                </p>
              </div>
            )}

            {/* Bank Details */}
            {selectedVendor.bankDetails && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Bank Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Account Holder</p>
                    <p className="text-gray-900">{selectedVendor.bankDetails.accountHolderName || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Bank Name</p>
                    <p className="text-gray-900">{selectedVendor.bankDetails.bankName || '-'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Documents */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Documents</h3>
              {selectedVendor.documents?.length === 0 ? (
                <p className="text-gray-500 text-sm">No documents uploaded</p>
              ) : (
                <div className="space-y-2">
                  {selectedVendor.documents?.map((doc) => (
                    <div key={doc._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm text-gray-900">{doc.documentName}</p>
                        <p className="text-xs text-gray-500 capitalize">{doc.documentType.replace('_', ' ')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getDocStatusBadgeColor(doc.status)}`}>
                          {doc.status}
                        </span>
                        {doc.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleReviewDocument(doc._id, 'approved')}
                              className="p-1 text-emerald-500 hover:bg-emerald-50 rounded transition-colors"
                            >
                              <CheckIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleReviewDocument(doc._id, 'rejected')}
                              className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                            >
                              <XIcon className="w-5 h-5" />
                            </button>
                          </>
                        )}
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            {selectedVendor.verificationStatus !== 'verified' && (
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Notes (Optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    rows="2"
                    placeholder="Add any notes..."
                  />
                </div>

                {selectedVendor.verificationStatus === 'under_review' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">Rejection Reason (if rejecting)</label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        rows="2"
                        placeholder="Reason for rejection..."
                      />
                    </div>

                    <div className="flex gap-4">
                      <Button
                        onClick={() => handleVerify('approve')}
                        loading={processing}
                        className="bg-emerald-500 hover:bg-emerald-600"
                      >
                        <CheckIcon className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleVerify('request_resubmit')}
                        loading={processing}
                      >
                        Request Resubmit
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleVerify('reject')}
                        loading={processing}
                        className="text-red-500 border-red-500 hover:bg-red-50"
                      >
                        <XIcon className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminVendorVerifications;
