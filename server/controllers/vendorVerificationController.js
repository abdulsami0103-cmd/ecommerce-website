const Vendor = require('../models/Vendor');
const VendorDocument = require('../models/VendorDocument');
const VerificationStep = require('../models/VerificationStep');
const VendorRole = require('../models/VendorRole');
const VendorPlan = require('../models/VendorPlan');
const VendorSubscription = require('../models/VendorSubscription');

// @desc    Get verification status
// @route   GET /api/vendor/verification/status
// @access  Private (Vendor)
exports.getVerificationStatus = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const steps = await VerificationStep.find({ vendor: vendor._id }).sort('stepNumber');
    const documents = await VendorDocument.find({ vendor: vendor._id });

    res.json({
      success: true,
      data: {
        status: vendor.verificationStatus,
        currentStep: vendor.verificationStep,
        steps,
        documents,
        businessDetails: vendor.businessDetails,
        bankDetails: {
          ...vendor.bankDetails,
          accountNumber: vendor.bankDetails?.accountNumber
            ? '****' + vendor.bankDetails.accountNumber.slice(-4)
            : null,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update business profile (Step 1)
// @route   PUT /api/vendor/verification/business-profile
// @access  Private (Vendor)
exports.updateBusinessProfile = async (req, res) => {
  try {
    const { businessName, businessType, taxId, registrationNumber, yearEstablished, address } = req.body;

    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    vendor.businessDetails = {
      businessName,
      businessType,
      taxId,
      registrationNumber,
      yearEstablished,
    };

    if (address) {
      vendor.address = address;
    }

    // Update verification step
    if (vendor.verificationStep === 1) {
      vendor.verificationStep = 2;
    }

    await vendor.save();

    // Update or create verification step record
    await VerificationStep.findOneAndUpdate(
      { vendor: vendor._id, stepNumber: 1 },
      {
        stepName: 'business_profile',
        status: 'completed',
        completedAt: new Date(),
        data: vendor.businessDetails,
      },
      { upsert: true }
    );

    res.json({
      success: true,
      message: 'Business profile updated successfully',
      data: { currentStep: vendor.verificationStep },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload verification document
// @route   POST /api/vendor/verification/documents
// @access  Private (Vendor)
exports.uploadDocument = async (req, res) => {
  try {
    const { documentType, documentName, fileUrl, fileType, fileSize } = req.body;

    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    // Check if document of this type already exists
    let document = await VendorDocument.findOne({ vendor: vendor._id, documentType });

    if (document) {
      // Update existing document
      document.documentName = documentName;
      document.fileUrl = fileUrl;
      document.fileType = fileType;
      document.fileSize = fileSize;
      document.status = 'pending';
      document.reviewedBy = undefined;
      document.reviewedAt = undefined;
      document.rejectionReason = undefined;
      await document.save();
    } else {
      // Create new document
      document = await VendorDocument.create({
        vendor: vendor._id,
        documentType,
        documentName,
        fileUrl,
        fileType,
        fileSize,
      });
    }

    res.json({
      success: true,
      message: 'Document uploaded successfully',
      data: document,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Complete documents step
// @route   POST /api/vendor/verification/documents/complete
// @access  Private (Vendor)
exports.completeDocumentsStep = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    // Check if required documents are uploaded
    const documents = await VendorDocument.find({ vendor: vendor._id });
    const requiredTypes = ['trade_license', 'national_id'];
    const uploadedTypes = documents.map(d => d.documentType);

    const missingDocs = requiredTypes.filter(type => !uploadedTypes.includes(type));
    if (missingDocs.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required documents: ${missingDocs.join(', ')}`,
      });
    }

    if (vendor.verificationStep === 2) {
      vendor.verificationStep = 3;
      await vendor.save();
    }

    await VerificationStep.findOneAndUpdate(
      { vendor: vendor._id, stepNumber: 2 },
      {
        stepName: 'documents_upload',
        status: 'completed',
        completedAt: new Date(),
      },
      { upsert: true }
    );

    res.json({
      success: true,
      message: 'Documents step completed',
      data: { currentStep: vendor.verificationStep },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update bank details (Step 3)
// @route   PUT /api/vendor/verification/bank-details
// @access  Private (Vendor)
exports.updateBankDetails = async (req, res) => {
  try {
    const { accountHolderName, bankName, accountNumber, routingNumber, swiftCode, iban } = req.body;

    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    vendor.bankDetails = {
      accountHolderName,
      bankName,
      accountNumber,
      routingNumber,
      swiftCode,
      iban,
      isVerified: false,
    };

    if (vendor.verificationStep === 3) {
      vendor.verificationStep = 4;
      vendor.verificationStatus = 'under_review';
    }

    await vendor.save();

    await VerificationStep.findOneAndUpdate(
      { vendor: vendor._id, stepNumber: 3 },
      {
        stepName: 'bank_details',
        status: 'completed',
        completedAt: new Date(),
      },
      { upsert: true }
    );

    // Create admin review step
    await VerificationStep.findOneAndUpdate(
      { vendor: vendor._id, stepNumber: 4 },
      {
        stepName: 'admin_review',
        status: 'in_progress',
      },
      { upsert: true }
    );

    res.json({
      success: true,
      message: 'Bank details updated. Your application is now under review.',
      data: { currentStep: vendor.verificationStep, status: vendor.verificationStatus },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin: Get all pending verifications
// @route   GET /api/admin/vendor/verifications
// @access  Private (Admin)
exports.getPendingVerifications = async (req, res) => {
  try {
    const { status = 'under_review', page = 1, limit = 10 } = req.query;

    const query = {};
    if (status !== 'all') {
      query.verificationStatus = status;
    }

    const vendors = await Vendor.find(query)
      .populate('user', 'email profile')
      .sort('-updatedAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Vendor.countDocuments(query);

    // Get documents for each vendor
    const vendorsWithDocs = await Promise.all(
      vendors.map(async (vendor) => {
        const documents = await VendorDocument.find({ vendor: vendor._id });
        const steps = await VerificationStep.find({ vendor: vendor._id }).sort('stepNumber');
        return {
          ...vendor.toObject(),
          documents,
          steps,
        };
      })
    );

    res.json({
      success: true,
      data: vendorsWithDocs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin: Verify vendor
// @route   PATCH /api/admin/vendor/:id/verify
// @access  Private (Admin)
exports.verifyVendor = async (req, res) => {
  try {
    const { action, notes, rejectionReason } = req.body;
    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    if (action === 'approve') {
      vendor.verificationStatus = 'verified';
      vendor.isApproved = true;
      vendor.verifiedAt = new Date();
      vendor.verificationNotes = notes;
      vendor.verificationStep = 5;

      // Create default roles for the vendor
      await VendorRole.createDefaultRoles(vendor._id);

      // Assign basic plan if not already subscribed
      if (!vendor.currentPlan) {
        const basicPlan = await VendorPlan.findOne({ slug: 'basic' });
        if (basicPlan) {
          vendor.currentPlan = basicPlan._id;
          vendor.subscriptionStatus = 'active';

          await VendorSubscription.create({
            vendor: vendor._id,
            plan: basicPlan._id,
            billingCycle: 'monthly',
            status: 'active',
            startDate: new Date(),
          });
        }
      }

      // Update verification steps
      await VerificationStep.findOneAndUpdate(
        { vendor: vendor._id, stepNumber: 4 },
        { status: 'completed', completedAt: new Date() }
      );

      await VerificationStep.findOneAndUpdate(
        { vendor: vendor._id, stepNumber: 5 },
        {
          stepName: 'final_approval',
          status: 'completed',
          completedAt: new Date(),
        },
        { upsert: true }
      );

      // TODO: Send approval email

    } else if (action === 'reject') {
      vendor.verificationStatus = 'rejected';
      vendor.rejectedAt = new Date();
      vendor.rejectionReason = rejectionReason;
      vendor.verificationNotes = notes;

      await VerificationStep.findOneAndUpdate(
        { vendor: vendor._id, stepNumber: 4 },
        { status: 'rejected', notes: rejectionReason }
      );

      // TODO: Send rejection email

    } else if (action === 'request_resubmit') {
      vendor.verificationStatus = 'pending';
      vendor.verificationStep = 2; // Back to documents
      vendor.verificationNotes = notes;

      // Mark documents as needing resubmission
      await VendorDocument.updateMany(
        { vendor: vendor._id },
        { status: 'resubmit_required', notes }
      );

      // TODO: Send resubmission request email
    }

    await vendor.save();

    res.json({
      success: true,
      message: `Vendor ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'requested to resubmit'}`,
      data: vendor,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin: Review document
// @route   PATCH /api/admin/vendor/document/:id/review
// @access  Private (Admin)
exports.reviewDocument = async (req, res) => {
  try {
    const { status, notes } = req.body;

    const document = await VendorDocument.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    document.status = status;
    document.reviewedBy = req.user._id;
    document.reviewedAt = new Date();
    if (notes) document.notes = notes;
    if (status === 'rejected') document.rejectionReason = notes;

    await document.save();

    res.json({
      success: true,
      message: `Document ${status}`,
      data: document,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
