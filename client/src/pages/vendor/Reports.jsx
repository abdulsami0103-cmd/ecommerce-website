import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Loading, Button } from '../../components/common';

const DocumentIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const DownloadIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const ChartIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const formatCurrency = (amount) => {
  return `Rs. ${(amount || 0).toLocaleString()}`;
};

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const reportTypes = [
  {
    id: 'sales_summary',
    name: 'Sales Summary',
    description: 'Overview of sales, orders, and revenue',
    icon: ChartIcon,
  },
  {
    id: 'product_performance',
    name: 'Product Performance',
    description: 'Sales breakdown by product',
    icon: ChartIcon,
  },
  {
    id: 'order_details',
    name: 'Order Details',
    description: 'Complete list of orders with details',
    icon: DocumentIcon,
  },
  {
    id: 'payout_history',
    name: 'Payout History',
    description: 'Withdrawals and transactions',
    icon: DocumentIcon,
  },
  {
    id: 'inventory_status',
    name: 'Inventory Status',
    description: 'Current stock levels',
    icon: DocumentIcon,
  },
];

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [quickStats, setQuickStats] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(null);

  // Report generation form
  const [reportForm, setReportForm] = useState({
    type: 'sales_summary',
    dateFrom: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    format: 'csv',
  });

  useEffect(() => {
    fetchQuickStats();
  }, []);

  const fetchQuickStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reports/vendor/earnings', {
        params: {
          from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
          to: new Date().toISOString(),
        },
      });
      setQuickStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async (type) => {
    setGeneratingReport(type);
    try {
      // For quick stats reports, just download as CSV
      const params = {
        report_type: type || reportForm.type,
        date_from: reportForm.dateFrom,
        date_to: reportForm.dateTo,
        format: reportForm.format,
      };

      const response = await api.post('/reports/export', params, {
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type || reportForm.type}_${reportForm.dateFrom}_${reportForm.dateTo}.${reportForm.format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      // If export endpoint not available, generate JSON report
      try {
        const response = await api.get('/reports/vendor/earnings', {
          params: {
            from: reportForm.dateFrom,
            to: reportForm.dateTo,
          },
        });

        const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `report_${reportForm.dateFrom}_${reportForm.dateTo}.json`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } catch (e) {
        alert('Failed to generate report');
      }
    } finally {
      setGeneratingReport(null);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-emerald-600">Reports</h1>
        <p className="text-gray-500">Generate and download business reports</p>
      </div>

      {/* Quick Stats */}
      {quickStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card p-4">
            <p className="text-sm text-gray-500">Last 30 Days Sales</p>
            <p className="text-2xl font-bold">{formatCurrency(quickStats.totalSales || quickStats.summary?.totalSales)}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-500">Orders</p>
            <p className="text-2xl font-bold">{quickStats.orderCount || quickStats.summary?.orderCount || 0}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-500">Commission</p>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(quickStats.totalCommission || quickStats.summary?.totalCommission)}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-500">Net Earnings</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(quickStats.netEarnings || quickStats.summary?.netEarnings)}
            </p>
          </div>
        </div>
      )}

      {/* Report Generator */}
      <div className="card p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Generate Report</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <select
              value={reportForm.type}
              onChange={(e) => setReportForm({ ...reportForm, type: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              {reportTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={reportForm.dateFrom}
              onChange={(e) => setReportForm({ ...reportForm, dateFrom: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={reportForm.dateTo}
              onChange={(e) => setReportForm({ ...reportForm, dateTo: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
            <select
              value={reportForm.format}
              onChange={(e) => setReportForm({ ...reportForm, format: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="csv">CSV</option>
              <option value="xlsx">Excel</option>
              <option value="pdf">PDF</option>
            </select>
          </div>
        </div>

        <Button
          onClick={() => handleGenerateReport()}
          disabled={generatingReport}
        >
          {generatingReport ? (
            <>Generating...</>
          ) : (
            <>
              <DownloadIcon className="w-4 h-4 mr-2" />
              Generate & Download
            </>
          )}
        </Button>
      </div>

      {/* Quick Reports */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Reports</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportTypes.map((report) => {
            const IconComponent = report.icon;

            return (
              <div
                key={report.id}
                className="border rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <IconComponent className="w-6 h-6 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{report.name}</h3>
                    <p className="text-sm text-gray-500 mb-3">{report.description}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setReportForm({ ...reportForm, type: report.id });
                        handleGenerateReport(report.id);
                      }}
                      disabled={generatingReport === report.id}
                    >
                      {generatingReport === report.id ? 'Generating...' : 'Download'}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Preset Reports */}
      <div className="card p-6 mt-6">
        <h2 className="text-lg font-semibold mb-4">Preset Reports</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => {
              const today = new Date();
              setReportForm({
                ...reportForm,
                dateFrom: today.toISOString().split('T')[0],
                dateTo: today.toISOString().split('T')[0],
                type: 'sales_summary',
              });
              handleGenerateReport('sales_summary');
            }}
            className="p-4 border rounded-lg hover:bg-gray-50 text-left"
          >
            <p className="font-medium">Today's Report</p>
            <p className="text-sm text-gray-500">Sales summary for today</p>
          </button>

          <button
            onClick={() => {
              const today = new Date();
              const weekAgo = new Date(today.setDate(today.getDate() - 7));
              setReportForm({
                ...reportForm,
                dateFrom: weekAgo.toISOString().split('T')[0],
                dateTo: new Date().toISOString().split('T')[0],
                type: 'sales_summary',
              });
              handleGenerateReport('sales_summary');
            }}
            className="p-4 border rounded-lg hover:bg-gray-50 text-left"
          >
            <p className="font-medium">This Week</p>
            <p className="text-sm text-gray-500">Last 7 days summary</p>
          </button>

          <button
            onClick={() => {
              const today = new Date();
              const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
              setReportForm({
                ...reportForm,
                dateFrom: monthStart.toISOString().split('T')[0],
                dateTo: new Date().toISOString().split('T')[0],
                type: 'sales_summary',
              });
              handleGenerateReport('sales_summary');
            }}
            className="p-4 border rounded-lg hover:bg-gray-50 text-left"
          >
            <p className="font-medium">This Month</p>
            <p className="text-sm text-gray-500">Month to date summary</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reports;
