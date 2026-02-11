const TaxReport = require('../models/TaxReport');
const Vendor = require('../models/Vendor');

/**
 * @desc    Get vendor's tax reports
 * @route   GET /api/vendor/tax-reports
 * @access  Private (Vendor)
 */
exports.getVendorTaxReports = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    const { year, reportType, page = 1, limit = 20 } = req.query;

    const query = { vendor: vendor._id };
    if (year) query.year = parseInt(year);
    if (reportType) query.reportType = reportType;

    const reports = await TaxReport.find(query)
      .sort({ year: -1, month: -1, quarter: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await TaxReport.countDocuments(query);

    res.json({
      reports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching tax reports:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get single tax report
 * @route   GET /api/vendor/tax-reports/:id
 * @access  Private (Vendor)
 */
exports.getTaxReportDetails = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    const report = await TaxReport.findOne({
      _id: req.params.id,
      vendor: vendor._id,
    });

    if (!report) {
      return res.status(404).json({ message: 'Tax report not found' });
    }

    res.json(report);
  } catch (error) {
    console.error('Error fetching tax report:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Generate tax report
 * @route   POST /api/vendor/tax-reports/generate
 * @access  Private (Vendor)
 */
exports.generateTaxReport = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    const { reportType, year, month, quarter } = req.body;

    // Validate inputs
    if (!reportType || !year) {
      return res.status(400).json({ message: 'Report type and year are required' });
    }

    if (reportType === 'monthly' && !month) {
      return res.status(400).json({ message: 'Month is required for monthly reports' });
    }

    if (reportType === 'quarterly' && !quarter) {
      return res.status(400).json({ message: 'Quarter is required for quarterly reports' });
    }

    // Check if report already exists
    const existingQuery = {
      vendor: vendor._id,
      reportType,
      year,
    };
    if (month) existingQuery.month = month;
    if (quarter) existingQuery.quarter = quarter;

    let report = await TaxReport.findOne(existingQuery);

    if (report) {
      // Regenerate existing report
      await report.regenerate();
    } else {
      // Generate new report
      const reportData = await TaxReport.generateReportData(
        vendor._id,
        reportType,
        year,
        month,
        quarter
      );

      report = new TaxReport({
        vendor: vendor._id,
        reportType,
        year,
        month: reportType === 'monthly' ? month : undefined,
        quarter: reportType === 'quarterly' ? quarter : undefined,
        ...reportData,
        generatedAt: new Date(),
        generatedBy: req.user._id,
        status: 'generated',
      });

      await report.save();
    }

    res.status(201).json({
      message: 'Tax report generated successfully',
      report,
    });
  } catch (error) {
    console.error('Error generating tax report:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Report for this period already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Download tax report
 * @route   GET /api/vendor/tax-reports/:id/download
 * @access  Private (Vendor)
 */
exports.downloadTaxReport = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    const report = await TaxReport.findOne({
      _id: req.params.id,
      vendor: vendor._id,
    }).populate('vendor', 'storeName businessInfo');

    if (!report) {
      return res.status(404).json({ message: 'Tax report not found' });
    }

    // If file exists, redirect to it
    if (report.fileUrl) {
      return res.redirect(report.fileUrl);
    }

    // Generate simple text/JSON report for now
    // In production, use PDF generation (Puppeteer/PDFKit)
    const reportContent = {
      title: `Tax Report - ${report.reportType.toUpperCase()}`,
      vendor: report.vendor?.storeName || 'Vendor',
      period: `${report.period.start.toDateString()} - ${report.period.end.toDateString()}`,
      year: report.year,
      month: report.month,
      quarter: report.quarter,
      summary: {
        grossEarnings: report.grossEarnings,
        totalSales: report.totalSales,
        totalOrders: report.totalOrders,
        totalRefunds: report.totalRefunds,
      },
      deductions: {
        commissionPaid: report.commissionPaid,
        platformFees: report.platformFees,
        processingFees: report.processingFees,
        totalDeductions: report.totalDeductions,
      },
      taxInfo: {
        taxableAmount: report.taxableAmount,
        withholdingTax: report.withholdingTax,
        withholdingTaxRate: report.withholdingTaxRate,
      },
      netEarnings: report.netEarnings,
      withdrawals: {
        total: report.totalWithdrawals,
        count: report.withdrawalCount,
      },
      generatedAt: report.generatedAt,
    };

    res.json(reportContent);
  } catch (error) {
    console.error('Error downloading tax report:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get tax report summary for vendor
 * @route   GET /api/vendor/tax-reports/summary
 * @access  Private (Vendor)
 */
exports.getTaxReportSummary = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    const currentYear = new Date().getFullYear();
    const { year = currentYear } = req.query;

    // Get all reports for the year
    const reports = await TaxReport.find({
      vendor: vendor._id,
      year: parseInt(year),
    }).sort({ month: 1, quarter: 1 });

    // Calculate yearly totals
    const yearlyTotals = reports.reduce(
      (acc, report) => {
        if (report.reportType === 'monthly') {
          acc.grossEarnings += report.grossEarnings;
          acc.totalDeductions += report.totalDeductions;
          acc.netEarnings += report.netEarnings;
          acc.totalWithdrawals += report.totalWithdrawals;
          acc.totalOrders += report.totalOrders;
        }
        return acc;
      },
      {
        grossEarnings: 0,
        totalDeductions: 0,
        netEarnings: 0,
        totalWithdrawals: 0,
        totalOrders: 0,
      }
    );

    // Get available years
    const availableYears = await TaxReport.distinct('year', { vendor: vendor._id });

    res.json({
      year: parseInt(year),
      availableYears: availableYears.sort((a, b) => b - a),
      yearlyTotals,
      reports,
    });
  } catch (error) {
    console.error('Error fetching tax report summary:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Admin: Get all tax reports
 * @route   GET /api/admin/tax-reports
 * @access  Private (Admin)
 */
exports.adminGetAllTaxReports = async (req, res) => {
  try {
    const { vendor, year, reportType, status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (vendor) query.vendor = vendor;
    if (year) query.year = parseInt(year);
    if (reportType) query.reportType = reportType;
    if (status) query.status = status;

    const reports = await TaxReport.find(query)
      .populate('vendor', 'storeName owner')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await TaxReport.countDocuments(query);

    res.json({
      reports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching tax reports:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Admin: Generate reports for all vendors
 * @route   POST /api/admin/tax-reports/batch-generate
 * @access  Private (Admin)
 */
exports.batchGenerateTaxReports = async (req, res) => {
  try {
    const { reportType, year, month, quarter } = req.body;

    // Get all active vendors
    const vendors = await Vendor.find({ status: 'approved' });

    const results = {
      success: 0,
      failed: 0,
      errors: [],
    };

    for (const vendor of vendors) {
      try {
        const existingQuery = {
          vendor: vendor._id,
          reportType,
          year,
        };
        if (month) existingQuery.month = month;
        if (quarter) existingQuery.quarter = quarter;

        let report = await TaxReport.findOne(existingQuery);

        if (report) {
          await report.regenerate();
        } else {
          const reportData = await TaxReport.generateReportData(
            vendor._id,
            reportType,
            year,
            month,
            quarter
          );

          report = new TaxReport({
            vendor: vendor._id,
            reportType,
            year,
            month: reportType === 'monthly' ? month : undefined,
            quarter: reportType === 'quarterly' ? quarter : undefined,
            ...reportData,
            generatedAt: new Date(),
            generatedBy: req.user._id,
            status: 'generated',
          });

          await report.save();
        }

        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push({
          vendor: vendor.storeName,
          error: err.message,
        });
      }
    }

    res.json({
      message: `Generated ${results.success} reports, ${results.failed} failed`,
      results,
    });
  } catch (error) {
    console.error('Error batch generating tax reports:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
