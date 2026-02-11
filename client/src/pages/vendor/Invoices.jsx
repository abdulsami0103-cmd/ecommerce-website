import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Loading } from '../../components/common';

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

const EyeIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const formatCurrency = (amount) => {
  return `Rs. ${(amount || 0).toLocaleString()}`;
};

const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const invoiceTypeConfig = {
  vendor_statement: { label: 'Earnings Statement', color: 'bg-emerald-100 text-emerald-800' },
  commission_invoice: { label: 'Commission Invoice', color: 'bg-teal-100 text-teal-800' },
  payout_receipt: { label: 'Payout Receipt', color: 'bg-green-100 text-green-800' },
  credit_note: { label: 'Credit Note', color: 'bg-orange-100 text-orange-800' },
  tax_invoice: { label: 'Tax Invoice', color: 'bg-red-100 text-red-800' },
};

const StatusBadge = ({ status }) => {
  const colors = {
    draft: 'bg-gray-100 text-gray-800',
    issued: 'bg-teal-100 text-teal-800',
    sent: 'bg-emerald-100 text-emerald-800',
    paid: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-600',
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status] || 'bg-gray-100'}`}>
      {status?.toUpperCase()}
    </span>
  );
};

const Invoices = () => {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState({
    type: '',
    year: '',
  });
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    fetchInvoices();
  }, [page, filter]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 20 };
      if (filter.type) params.type = filter.type;
      if (filter.year) params.year = filter.year;

      const response = await api.get('/vendor/invoices', { params });
      setInvoices(response.data.invoices || response.data);
      setPagination(response.data.pagination || {});
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (invoiceId) => {
    try {
      const response = await api.get(`/invoices/${invoiceId}/download`, {
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${invoiceId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      // If PDF not available, try to get JSON
      try {
        const response = await api.get(`/invoices/${invoiceId}`);
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      } catch (e) {
        alert('Failed to download invoice');
      }
    }
  };

  const handleViewInvoice = async (invoiceId) => {
    try {
      const response = await api.get(`/invoices/${invoiceId}`);
      setSelectedInvoice(response.data);
    } catch (error) {
      alert('Failed to load invoice details');
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  if (loading && invoices.length === 0) return <Loading />;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-emerald-600">Invoices & Statements</h1>
        <p className="text-gray-500">View and download your invoices and earnings statements</p>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6 flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            value={filter.type}
            onChange={(e) => { setFilter({ ...filter, type: e.target.value }); setPage(1); }}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">All Types</option>
            <option value="vendor_statement">Earnings Statement</option>
            <option value="commission_invoice">Commission Invoice</option>
            <option value="payout_receipt">Payout Receipt</option>
            <option value="credit_note">Credit Note</option>
            <option value="tax_invoice">Tax Invoice</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
          <select
            value={filter.year}
            onChange={(e) => { setFilter({ ...filter, year: e.target.value }); setPage(1); }}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">All Years</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="card overflow-hidden">
        {invoices.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <DocumentIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No invoices found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-emerald-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Invoice #</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Period</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-emerald-700 uppercase">Amount</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-emerald-700 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-emerald-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoices.map((invoice) => {
                  const typeConfig = invoiceTypeConfig[invoice.type] || { label: invoice.type, color: 'bg-gray-100' };

                  return (
                    <tr key={invoice._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium text-emerald-600">
                          {invoice.invoiceNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeConfig.color}`}>
                          {typeConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {invoice.periodStart && invoice.periodEnd ? (
                          <>
                            {formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}
                          </>
                        ) : (
                          formatDate(invoice.issueDate)
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                        {formatCurrency(invoice.totals?.grandTotal || invoice.totalAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <StatusBadge status={invoice.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(invoice.issueDate || invoice.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleViewInvoice(invoice._id)}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownload(invoice._id)}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <DownloadIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-4 py-3 border-t flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * pagination.limit + 1} to{' '}
              {Math.min(page * pagination.limit, pagination.total)} of {pagination.total}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 text-sm border-2 border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                disabled={page === pagination.pages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 text-sm border-2 border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-emerald-600">Invoice Details</h2>
                <p className="text-gray-500">{selectedInvoice.invoiceNumber}</p>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Invoice Header */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="font-medium capitalize">{selectedInvoice.type?.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <StatusBadge status={selectedInvoice.status} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Issue Date</p>
                  <p className="font-medium">{formatDate(selectedInvoice.issueDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Due Date</p>
                  <p className="font-medium">{formatDate(selectedInvoice.dueDate) || '-'}</p>
                </div>
              </div>

              {/* Items */}
              {selectedInvoice.items?.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 text-emerald-600">Items</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-emerald-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-emerald-700">Description</th>
                          <th className="px-4 py-2 text-right text-emerald-700">Qty</th>
                          <th className="px-4 py-2 text-right text-emerald-700">Rate</th>
                          <th className="px-4 py-2 text-right text-emerald-700">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {selectedInvoice.items.map((item, i) => (
                          <tr key={i}>
                            <td className="px-4 py-2">{item.description}</td>
                            <td className="px-4 py-2 text-right">{item.quantity}</td>
                            <td className="px-4 py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                            <td className="px-4 py-2 text-right">{formatCurrency(item.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Totals */}
              <div className="border-t pt-4 space-y-2">
                {selectedInvoice.totals?.subtotal && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal</span>
                    <span>{formatCurrency(selectedInvoice.totals.subtotal)}</span>
                  </div>
                )}
                {selectedInvoice.totals?.taxTotal > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tax</span>
                    <span>{formatCurrency(selectedInvoice.totals.taxTotal)}</span>
                  </div>
                )}
                {selectedInvoice.totals?.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Discount</span>
                    <span className="text-green-600">-{formatCurrency(selectedInvoice.totals.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span>{formatCurrency(selectedInvoice.totals?.grandTotal || selectedInvoice.totalAmount)}</span>
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex gap-3 justify-end">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 border-2 border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 font-medium transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => handleDownload(selectedInvoice._id)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors flex items-center"
              >
                <DownloadIcon className="w-4 h-4 mr-2" />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
