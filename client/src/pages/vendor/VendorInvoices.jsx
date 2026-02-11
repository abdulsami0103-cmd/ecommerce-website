import { useEffect, useState } from 'react';
import api from '../../services/api';
import { Loading } from '../../components/common';

const TypeBadge = ({ type }) => {
  const colors = {
    customer_invoice: 'bg-teal-100 text-teal-800',
    vendor_statement: 'bg-emerald-100 text-emerald-800',
    commission_invoice: 'bg-green-100 text-green-800',
    credit_note: 'bg-red-100 text-red-800',
    payout_receipt: 'bg-yellow-100 text-yellow-800',
  };

  const labels = {
    customer_invoice: 'Customer Invoice',
    vendor_statement: 'Statement',
    commission_invoice: 'Commission',
    credit_note: 'Credit Note',
    payout_receipt: 'Payout Receipt',
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[type] || 'bg-gray-100'}`}>
      {labels[type] || type}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const colors = {
    draft: 'bg-gray-100 text-gray-800',
    generated: 'bg-teal-100 text-teal-800',
    sent: 'bg-emerald-100 text-emerald-800',
    paid: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status] || 'bg-gray-100'}`}>
      {status?.toUpperCase()}
    </span>
  );
};

const VendorInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchInvoices();
  }, [filter, page]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 20 };
      if (filter) params.type = filter;

      const response = await api.get('/vendor/invoices', { params });
      setInvoices(response.data.invoices || []);
      setPagination(response.data.pagination || {});
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = async (invoiceId) => {
    try {
      const response = await api.get(`/invoices/${invoiceId}/pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${invoiceId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to download invoice');
    }
  };

  if (loading && invoices.length === 0) return <Loading />;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-emerald-600">Invoices & Statements</h1>
        <p className="text-gray-500">View and download your invoices and statements</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['', 'vendor_statement', 'commission_invoice', 'payout_receipt', 'credit_note'].map((type) => (
          <button
            key={type}
            onClick={() => { setFilter(type); setPage(1); }}
            className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition-colors ${
              filter === type
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {type === '' ? 'All' : type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Invoices Table */}
      <div className="card overflow-hidden">
        {invoices.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No invoices found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-emerald-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Invoice #</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-emerald-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoices.map((invoice) => (
                  <tr key={invoice._id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <p className="font-medium">{invoice.invoiceNumber}</p>
                      {invoice.order?.orderNumber && (
                        <p className="text-xs text-gray-400">Order: {invoice.order.orderNumber}</p>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <TypeBadge type={invoice.type} />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <StatusBadge status={invoice.status} />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap font-medium">
                      Rs. {invoice.grandTotal?.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-gray-500 text-sm">
                      {new Date(invoice.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <div className="flex gap-2 justify-end">
                        {invoice.pdfUrl && (
                          <button
                            onClick={() => downloadInvoice(invoice._id)}
                            className="px-3 py-1.5 text-sm border-2 border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 font-medium transition-colors"
                          >
                            Download
                          </button>
                        )}
                        <button className="px-3 py-1.5 text-sm border-2 border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 font-medium transition-colors">
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-4 py-3 border-t flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {page} of {pagination.pages}
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
    </div>
  );
};

export default VendorInvoices;
