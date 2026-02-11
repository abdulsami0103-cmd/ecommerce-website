const ImportJob = require('../models/ImportJob');
const ExportJob = require('../models/ExportJob');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Vendor = require('../models/Vendor');
const InventoryLog = require('../models/InventoryLog');

// @desc    Download import template
// @route   GET /api/vendors/import/template
// @access  Private (Vendor)
exports.downloadTemplate = async (req, res) => {
  try {
    const { format = 'csv' } = req.query;

    // Get categories for reference
    const categories = await Category.find({ isActive: true })
      .select('_id name slug')
      .lean();

    if (format === 'csv') {
      const headers = [
        'sku',
        'name',
        'description',
        'short_description',
        'price',
        'compare_at_price',
        'category_id',
        'stock_quantity',
        'track_inventory',
        'type',
        'tags',
        'images',
        'attributes',
      ];

      const sampleRow = [
        'SKU001',
        'Sample Product Name',
        'Full product description goes here',
        'Short description',
        '99.99',
        '129.99',
        categories[0]?._id || 'category_id_here',
        '100',
        'true',
        'physical',
        'tag1,tag2,tag3',
        'https://example.com/img1.jpg,https://example.com/img2.jpg',
        '{"color":"red","size":"M"}',
      ];

      const csvContent = [
        headers.join(','),
        sampleRow.map(v => `"${v}"`).join(','),
      ].join('\n');

      // Add categories reference as comment
      const categoriesRef = '\n\n# Available Categories:\n' +
        categories.map(c => `# ${c._id} - ${c.name} (${c.slug})`).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="product_import_template.csv"');
      res.send(csvContent + categoriesRef);
    } else if (format === 'xml') {
      const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<products>
  <!-- Sample product entry -->
  <product>
    <sku>SKU001</sku>
    <name>Sample Product Name</name>
    <description>Full product description goes here</description>
    <short_description>Short description</short_description>
    <price>99.99</price>
    <compare_at_price>129.99</compare_at_price>
    <category_id>${categories[0]?._id || 'category_id_here'}</category_id>
    <stock_quantity>100</stock_quantity>
    <track_inventory>true</track_inventory>
    <type>physical</type>
    <tags>
      <tag>tag1</tag>
      <tag>tag2</tag>
    </tags>
    <images>
      <image>https://example.com/img1.jpg</image>
      <image>https://example.com/img2.jpg</image>
    </images>
    <attributes>
      <attribute name="color">red</attribute>
      <attribute name="size">M</attribute>
    </attributes>
  </product>
</products>

<!--
Available Categories:
${categories.map(c => `${c._id} - ${c.name} (${c.slug})`).join('\n')}
-->`;

      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Content-Disposition', 'attachment; filename="product_import_template.xml"');
      res.send(xmlContent);
    } else {
      return res.status(400).json({ success: false, message: 'Invalid format. Use csv or xml' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload file for validation
// @route   POST /api/vendors/import/upload
// @access  Private (Vendor)
exports.uploadImportFile = async (req, res) => {
  try {
    const { fileUrl, fileName, fileSize, type = 'csv' } = req.body;

    const vendor = await Vendor.findOne({ user: req.user._id }).populate('currentPlan');
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    // Check subscription limits
    const plan = vendor.currentPlan;
    const planLimits = {
      basic: 0,
      pro: 500,
      enterprise: 10000,
    };

    const maxRows = planLimits[plan?.slug] || 0;
    if (maxRows === 0) {
      return res.status(403).json({
        success: false,
        message: 'Bulk import is not available on your plan. Please upgrade.',
      });
    }

    // Create import job
    const importJob = await ImportJob.create({
      vendor: vendor._id,
      type,
      status: 'pending',
      file: {
        originalName: fileName,
        url: fileUrl,
        size: fileSize,
      },
    });

    // TODO: Queue validation job
    // For now, we'll do simple validation

    res.status(201).json({
      success: true,
      message: 'File uploaded. Validation will begin shortly.',
      data: importJob,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get import job status
// @route   GET /api/vendors/import/:jobId
// @access  Private (Vendor)
exports.getImportJobStatus = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const job = await ImportJob.findOne({
      _id: req.params.jobId,
      vendor: vendor._id,
    });

    if (!job) {
      return res.status(404).json({ success: false, message: 'Import job not found' });
    }

    res.json({
      success: true,
      data: job,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Confirm and start import
// @route   POST /api/vendors/import/:jobId/confirm
// @access  Private (Vendor)
exports.confirmImport = async (req, res) => {
  try {
    const { updateExisting, skipDuplicates, sendToModeration } = req.body;

    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const job = await ImportJob.findOne({
      _id: req.params.jobId,
      vendor: vendor._id,
    });

    if (!job) {
      return res.status(404).json({ success: false, message: 'Import job not found' });
    }

    if (job.status !== 'validated') {
      return res.status(400).json({
        success: false,
        message: 'Job must be validated before confirming',
      });
    }

    if (job.stats.validRows === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid rows to import',
      });
    }

    // Update job options and status
    job.options = {
      updateExisting: updateExisting || false,
      skipDuplicates: skipDuplicates !== false,
      sendToModeration: sendToModeration !== false,
    };
    job.status = 'processing';
    job.startedAt = new Date();
    await job.save();

    // TODO: Queue processing job

    res.json({
      success: true,
      message: 'Import started',
      data: job,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel import job
// @route   DELETE /api/vendors/import/:jobId
// @access  Private (Vendor)
exports.cancelImport = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const job = await ImportJob.findOne({
      _id: req.params.jobId,
      vendor: vendor._id,
    });

    if (!job) {
      return res.status(404).json({ success: false, message: 'Import job not found' });
    }

    if (['completed', 'failed'].includes(job.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed or failed jobs',
      });
    }

    job.status = 'cancelled';
    await job.save();

    res.json({
      success: true,
      message: 'Import cancelled',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get import history
// @route   GET /api/vendors/import/history
// @access  Private (Vendor)
exports.getImportHistory = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const { status, page = 1, limit = 20 } = req.query;

    const jobs = await ImportJob.getVendorHistory(vendor._id, {
      status,
      limit: parseInt(limit),
      skip: (page - 1) * limit,
    });

    const total = await ImportJob.countDocuments({
      vendor: vendor._id,
      ...(status && { status }),
    });

    res.json({
      success: true,
      data: jobs,
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

// @desc    Request product export
// @route   POST /api/vendors/export
// @access  Private (Vendor)
exports.requestExport = async (req, res) => {
  try {
    const { type = 'csv', filters = {} } = req.body;

    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const exportJob = await ExportJob.create({
      vendor: vendor._id,
      requestedBy: req.user._id,
      type,
      scope: 'vendor',
      filters,
    });

    // TODO: Queue export job

    res.status(201).json({
      success: true,
      message: 'Export requested. You will be notified when ready.',
      data: exportJob,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get export job status
// @route   GET /api/vendors/export/:jobId
// @access  Private (Vendor)
exports.getExportJobStatus = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const job = await ExportJob.findOne({
      _id: req.params.jobId,
      vendor: vendor._id,
    });

    if (!job) {
      return res.status(404).json({ success: false, message: 'Export job not found' });
    }

    res.json({
      success: true,
      data: {
        ...job.toObject(),
        isFileValid: job.isFileValid(),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get export history
// @route   GET /api/vendors/export/history
// @access  Private (Vendor)
exports.getExportHistory = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const { status, page = 1, limit = 20 } = req.query;

    const jobs = await ExportJob.getVendorHistory(vendor._id, {
      status,
      limit: parseInt(limit),
      skip: (page - 1) * limit,
    });

    const total = await ExportJob.countDocuments({
      vendor: vendor._id,
      ...(status && { status }),
    });

    res.json({
      success: true,
      data: jobs,
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

// @desc    Admin: Request platform-wide export
// @route   POST /api/admin/products/export
// @access  Private (Admin)
exports.adminRequestExport = async (req, res) => {
  try {
    const { type = 'csv', filters = {} } = req.body;

    const exportJob = await ExportJob.create({
      requestedBy: req.user._id,
      type,
      scope: 'admin',
      filters,
    });

    // TODO: Queue export job

    res.status(201).json({
      success: true,
      message: 'Export requested',
      data: exportJob,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin: Get export status
// @route   GET /api/admin/products/export/:jobId
// @access  Private (Admin)
exports.adminGetExportStatus = async (req, res) => {
  try {
    const job = await ExportJob.findById(req.params.jobId);

    if (!job) {
      return res.status(404).json({ success: false, message: 'Export job not found' });
    }

    res.json({
      success: true,
      data: {
        ...job.toObject(),
        isFileValid: job.isFileValid(),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
