import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Button, Input } from '../../components/common';

const CheckIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const ClockIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const UploadIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);

const VendorVerification = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verification, setVerification] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);

  // Form states
  const [businessProfile, setBusinessProfile] = useState({
    businessName: '',
    businessType: 'individual',
    taxId: '',
    registrationNumber: '',
    yearEstablished: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      zipCode: '',
    },
  });

  const [bankDetails, setBankDetails] = useState({
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    routingNumber: '',
    swiftCode: '',
    iban: '',
  });

  const [documents, setDocuments] = useState([]);

  const steps = [
    { number: 1, name: 'Business Profile', description: 'Basic business information' },
    { number: 2, name: 'Documents', description: 'Upload verification documents' },
    { number: 3, name: 'Bank Details', description: 'Payment information' },
    { number: 4, name: 'Review', description: 'Admin verification' },
    { number: 5, name: 'Approved', description: 'Start selling' },
  ];

  useEffect(() => {
    fetchVerificationStatus();
  }, []);

  const fetchVerificationStatus = async () => {
    try {
      const response = await api.get('/vendor/verification/status');
      setVerification(response.data.data);
      setCurrentStep(response.data.data.currentStep);

      if (response.data.data.businessDetails) {
        setBusinessProfile(prev => ({
          ...prev,
          ...response.data.data.businessDetails,
        }));
      }
      if (response.data.data.documents) {
        setDocuments(response.data.data.documents);
      }
    } catch (error) {
      console.error('Failed to fetch verification status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessProfileSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/vendor/verification/business-profile', businessProfile);
      toast.success('Business profile saved');
      setCurrentStep(2);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDocumentUpload = async (type, file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      // In production, upload to cloud storage
      // For now, use placeholder URL
      const fileUrl = URL.createObjectURL(file);

      await api.post('/vendor/verification/documents', {
        documentType: type,
        documentName: file.name,
        fileUrl: fileUrl,
        fileType: file.type,
        fileSize: file.size,
      });

      toast.success('Document uploaded');
      fetchVerificationStatus();
    } catch (error) {
      toast.error('Failed to upload document');
    }
  };

  const handleCompleteDocuments = async () => {
    setSaving(true);
    try {
      await api.post('/vendor/verification/documents/complete');
      toast.success('Documents submitted');
      setCurrentStep(3);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit documents');
    } finally {
      setSaving(false);
    }
  };

  const handleBankDetailsSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/vendor/verification/bank-details', bankDetails);
      toast.success('Bank details saved. Your application is under review.');
      setCurrentStep(4);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  const getStepStatus = (stepNumber) => {
    if (stepNumber < currentStep) return 'completed';
    if (stepNumber === currentStep) return 'current';
    return 'upcoming';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-emerald-600">Vendor Verification</h1>
        <p className="text-gray-500">Complete the verification process to start selling</p>
      </div>

      {/* Status Banner */}
      {verification?.status === 'verified' && (
        <div className="card p-4 mb-8 bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <CheckIcon className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-medium text-green-800">Verification Complete!</p>
              <p className="text-sm text-green-600">You can now start selling on the platform.</p>
            </div>
            <Button onClick={() => navigate('/vendor/dashboard')} className="ml-auto">
              Go to Dashboard
            </Button>
          </div>
        </div>
      )}

      {verification?.status === 'under_review' && (
        <div className="card p-4 mb-8 bg-yellow-50 border-yellow-200">
          <div className="flex items-center gap-3">
            <ClockIcon className="w-6 h-6 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-800">Under Review</p>
              <p className="text-sm text-yellow-600">Your application is being reviewed by our team. We'll notify you once it's approved.</p>
            </div>
          </div>
        </div>
      )}

      {verification?.status === 'rejected' && (
        <div className="card p-4 mb-8 bg-red-50 border-red-200">
          <div className="flex items-center gap-3">
            <div>
              <p className="font-medium text-red-800">Application Rejected</p>
              <p className="text-sm text-red-600">Reason: {verification.rejectionReason || 'Please contact support for details.'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Progress Steps */}
      <div className="card p-6 mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    getStepStatus(step.number) === 'completed'
                      ? 'bg-green-500 text-white'
                      : getStepStatus(step.number) === 'current'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {getStepStatus(step.number) === 'completed' ? (
                    <CheckIcon className="w-5 h-5" />
                  ) : (
                    step.number
                  )}
                </div>
                <p className="text-xs mt-2 text-center font-medium">{step.name}</p>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-16 h-1 mx-2 ${
                    getStepStatus(step.number) === 'completed' ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      {currentStep === 1 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-6">Business Profile</h2>
          <form onSubmit={handleBusinessProfileSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Business Name"
                value={businessProfile.businessName}
                onChange={(e) => setBusinessProfile({ ...businessProfile, businessName: e.target.value })}
                required
              />
              <div>
                <label className="block text-sm font-medium mb-1">Business Type</label>
                <select
                  value={businessProfile.businessType}
                  onChange={(e) => setBusinessProfile({ ...businessProfile, businessType: e.target.value })}
                  className="input"
                >
                  <option value="individual">Individual</option>
                  <option value="company">Company</option>
                  <option value="partnership">Partnership</option>
                  <option value="llc">LLC</option>
                  <option value="corporation">Corporation</option>
                </select>
              </div>
              <Input
                label="Tax ID / NTN"
                value={businessProfile.taxId}
                onChange={(e) => setBusinessProfile({ ...businessProfile, taxId: e.target.value })}
              />
              <Input
                label="Registration Number"
                value={businessProfile.registrationNumber}
                onChange={(e) => setBusinessProfile({ ...businessProfile, registrationNumber: e.target.value })}
              />
              <Input
                label="Year Established"
                type="number"
                value={businessProfile.yearEstablished}
                onChange={(e) => setBusinessProfile({ ...businessProfile, yearEstablished: e.target.value })}
              />
            </div>

            <h3 className="font-medium mt-6">Business Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Street Address"
                value={businessProfile.address.street}
                onChange={(e) => setBusinessProfile({ ...businessProfile, address: { ...businessProfile.address, street: e.target.value } })}
                required
              />
              <Input
                label="City"
                value={businessProfile.address.city}
                onChange={(e) => setBusinessProfile({ ...businessProfile, address: { ...businessProfile.address, city: e.target.value } })}
                required
              />
              <Input
                label="State/Province"
                value={businessProfile.address.state}
                onChange={(e) => setBusinessProfile({ ...businessProfile, address: { ...businessProfile.address, state: e.target.value } })}
                required
              />
              <Input
                label="Country"
                value={businessProfile.address.country}
                onChange={(e) => setBusinessProfile({ ...businessProfile, address: { ...businessProfile.address, country: e.target.value } })}
                required
              />
              <Input
                label="Zip/Postal Code"
                value={businessProfile.address.zipCode}
                onChange={(e) => setBusinessProfile({ ...businessProfile, address: { ...businessProfile.address, zipCode: e.target.value } })}
                required
              />
            </div>

            <Button type="submit" loading={saving} className="w-full md:w-auto">
              Save & Continue
            </Button>
          </form>
        </div>
      )}

      {currentStep === 2 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-6">Upload Documents</h2>
          <p className="text-gray-500 mb-6">Please upload the following documents for verification:</p>

          <div className="space-y-4">
            {['trade_license', 'national_id', 'tax_certificate'].map((docType) => {
              const doc = documents.find(d => d.documentType === docType);
              const labels = {
                trade_license: 'Trade License / Business Registration',
                national_id: 'National ID / CNIC / Passport',
                tax_certificate: 'Tax Certificate (Optional)',
              };

              return (
                <div key={docType} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{labels[docType]}</p>
                      {doc && (
                        <p className="text-sm text-gray-500">
                          {doc.documentName} -
                          <span className={`ml-2 badge ${doc.status === 'approved' ? 'badge-success' : doc.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
                            {doc.status}
                          </span>
                        </p>
                      )}
                    </div>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => e.target.files[0] && handleDocumentUpload(docType, e.target.files[0])}
                      />
                      <span className="btn-outline flex items-center gap-2">
                        <UploadIcon className="w-4 h-4" />
                        {doc ? 'Replace' : 'Upload'}
                      </span>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-4 mt-6">
            <Button variant="outline" onClick={() => setCurrentStep(1)}>
              Back
            </Button>
            <Button onClick={handleCompleteDocuments} loading={saving}>
              Submit Documents
            </Button>
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-6">Bank Details</h2>
          <p className="text-gray-500 mb-6">Enter your bank account details for receiving payments:</p>

          <form onSubmit={handleBankDetailsSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Account Holder Name"
                value={bankDetails.accountHolderName}
                onChange={(e) => setBankDetails({ ...bankDetails, accountHolderName: e.target.value })}
                required
              />
              <Input
                label="Bank Name"
                value={bankDetails.bankName}
                onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                required
              />
              <Input
                label="Account Number / IBAN"
                value={bankDetails.accountNumber}
                onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                required
              />
              <Input
                label="Routing Number / Sort Code"
                value={bankDetails.routingNumber}
                onChange={(e) => setBankDetails({ ...bankDetails, routingNumber: e.target.value })}
              />
              <Input
                label="SWIFT/BIC Code"
                value={bankDetails.swiftCode}
                onChange={(e) => setBankDetails({ ...bankDetails, swiftCode: e.target.value })}
              />
            </div>

            <div className="flex gap-4 mt-6">
              <Button variant="outline" onClick={() => setCurrentStep(2)}>
                Back
              </Button>
              <Button type="submit" loading={saving}>
                Submit for Review
              </Button>
            </div>
          </form>
        </div>
      )}

      {currentStep >= 4 && verification?.status !== 'verified' && (
        <div className="card p-6 text-center">
          <ClockIcon className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Application Under Review</h2>
          <p className="text-gray-500 max-w-md mx-auto">
            Thank you for submitting your verification documents. Our team is reviewing your application and will get back to you within 1-3 business days.
          </p>
        </div>
      )}
    </div>
  );
};

export default VendorVerification;
