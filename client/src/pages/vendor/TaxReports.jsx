import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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

const RefreshIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const CalendarIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const formatCurrency = (amount) => {
  return `Rs. ${(amount || 0).toLocaleString()}`;
};

const StatusBadge = ({ status }) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    generated: 'bg-blue-100 text-blue-800',
    sent: 'bg-purple-100 text-purple-800',
    acknowledged: 'bg-green-100 text-green-800',
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status] || 'bg-gray-100'}`}>
      {status?.toUpperCase()}
    </span>
  );
};

const TaxReports = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [generating, setGenerating] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    reportType: 'monthly',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    quarter: Math.ceil((new Date().getMonth() + 1) / 3),
  });

  useEffect(() => {
    fetchSummary();
  }, [selectedYear]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const response = await api.get('/vendor/tax-reports/summary', {
        params: { year: selectedYear },
      });
      setSummary(response.data);
    } catch (error) {
      console.error('Error fetching tax reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      await api.post('/vendor/tax-reports/generate', generateForm);
      setShowGenerateModal(false);
      fetchSummary();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (reportId) => {
    try {
      const response = await api.get(`/vendor/tax-reports/${reportId}/download`);
      // For now, show the data in a new tab
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      alert('Failed to download report');
    }
  };

  const getReportPeriodLabel = (report) => {
    if (report.reportType === 'monthly') {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${monthNames[report.month - 1]} ${report.year}`;
    } else if (report.reportType === 'quarterly') {
      return `Q${report.quarter} ${report.year}`;
    }
    return `Year ${report.year}`;
  };

  if (loading) return <Loading />;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-emerald-600">Tax Reports</h1>
          <p className="text-gray-500">View and generate tax reports for your earnings</p>
        </div>
        <Button onClick={() => setShowGenerateModal(true)}>
          <DocumentIcon className="w-4 h-4 mr-2" />
          Generate Report
        </Button>
      </div>

      {/* Year Selector */}
      <div className="mb-6 flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Year:</label>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          {(summary?.availableYears || [new Date().getFullYear()]).map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      {/* Yearly Summary */}
      {summary?.yearlyTotals && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="card p-4">
            <p className="text-sm text-gray-500">Gross Earnings</p>
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency(summary.yearlyTotals.grossEarnings)}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-500">Total Deductions</p>
            <p className="text-xl font-bold text-red-600">
              {formatCurrency(summary.yearlyTotals.totalDeductions)}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-500">Net Earnings</p>
            <p className="text-xl font-bold text-green-600">
              {formatCurrency(summary.yearlyTotals.netEarnings)}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-500">Total Withdrawals</p>
            <p className="text-xl font-bold text-blue-600">
              {formatCurrency(summary.yearlyTotals.totalWithdrawals)}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-500">Total Orders</p>
            <p className="text-xl font-bold">{summary.yearlyTotals.totalOrders}</p>
          </div>
        </div>
      )}

      {/* Reports Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Generated Reports</h2>
        </div>

        {summary?.reports?.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <DocumentIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No tax reports generated for {selectedYear}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setShowGenerateModal(true)}
            >
              Generate Your First Report
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Gross</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Deductions</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {summary?.reports?.map((report) => (
                  <tr key={report._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-gray-400" />
                        <span className="font-medium">{getReportPeriodLabel(report)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="capitalize">{report.reportType}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {formatCurrency(report.grossEarnings)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-red-600">
                      -{formatCurrency(report.totalDeductions)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-green-600">
                      {formatCurrency(report.netEarnings)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <StatusBadge status={report.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(report._id)}
                        >
                          <DownloadIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setGenerateForm({
                              reportType: report.reportType,
                              year: report.year,
                              month: report.month,
                              quarter: report.quarter,
                            });
                            setShowGenerateModal(true);
                          }}
                        >
                          <RefreshIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Generate Tax Report</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
                <select
                  value={generateForm.reportType}
                  onChange={(e) => setGenerateForm({ ...generateForm, reportType: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <select
                  value={generateForm.year}
                  onChange={(e) => setGenerateForm({ ...generateForm, year: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  {[...Array(5)].map((_, i) => {
                    const year = new Date().getFullYear() - i;
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  })}
                </select>
              </div>

              {generateForm.reportType === 'monthly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                  <select
                    value={generateForm.month}
                    onChange={(e) => setGenerateForm({ ...generateForm, month: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((month, i) => (
                      <option key={i + 1} value={i + 1}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {generateForm.reportType === 'quarterly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quarter</label>
                  <select
                    value={generateForm.quarter}
                    onChange={(e) => setGenerateForm({ ...generateForm, quarter: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value={1}>Q1 (Jan-Mar)</option>
                    <option value={2}>Q2 (Apr-Jun)</option>
                    <option value={3}>Q3 (Jul-Sep)</option>
                    <option value={4}>Q4 (Oct-Dec)</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowGenerateModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? 'Generating...' : 'Generate'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxReports;
