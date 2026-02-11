import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Button, Modal } from '../../components/common';

const SearchIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const EyeIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
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

const ExclamationIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const SendIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

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

const TICKET_CATEGORIES = [
  { value: 'order_issue', label: 'Order Issue' },
  { value: 'product_inquiry', label: 'Product Inquiry' },
  { value: 'payment', label: 'Payment' },
  { value: 'shipping', label: 'Shipping' },
  { value: 'refund', label: 'Refund' },
  { value: 'general', label: 'General' },
  { value: 'vendor_complaint', label: 'Vendor Complaint' },
  { value: 'technical', label: 'Technical' },
];

const TEAMS = [
  { value: 'support', label: 'Support' },
  { value: 'finance', label: 'Finance' },
  { value: 'operations', label: 'Operations' },
  { value: 'technical', label: 'Technical' },
];

export default function AdminTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [stats, setStats] = useState(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketMessages, setTicketMessages] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sending, setSending] = useState(false);

  const [assignModal, setAssignModal] = useState(false);
  const [resolveModal, setResolveModal] = useState(false);
  const [assignTeam, setAssignTeam] = useState('');
  const [resolution, setResolution] = useState('');

  useEffect(() => {
    fetchTickets();
  }, [page, statusFilter, categoryFilter, priorityFilter]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page, limit: 10 });
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (categoryFilter) params.append('category', categoryFilter);
      if (priorityFilter) params.append('priority', priorityFilter);

      const response = await api.get(`/admin/tickets?${params}`);
      setTickets(response.data.data || []);
      setPagination(response.data.pagination || { page: 1, pages: 1, total: 0 });
      setStats(response.data.stats);
    } catch (err) {
      toast.error('Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTickets();
  };

  const handleViewTicket = async (ticket) => {
    try {
      setDetailLoading(true);
      setSelectedTicket(ticket);
      const response = await api.get(`/tickets/${ticket._id}`);
      setTicketMessages(response.data.data.messages || []);
      setSelectedTicket(response.data.data.ticket);
    } catch (err) {
      toast.error('Failed to fetch ticket details');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedTicket(null);
    setTicketMessages([]);
    setReplyMessage('');
    setIsInternalNote(false);
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim()) return;
    try {
      setSending(true);
      await api.post(`/tickets/${selectedTicket._id}/messages`, {
        message: replyMessage,
        isInternalNote,
      });
      setReplyMessage('');
      setIsInternalNote(false);
      toast.success('Reply sent successfully');
      handleViewTicket(selectedTicket);
      fetchTickets();
    } catch (err) {
      toast.error('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const handleAssign = async () => {
    try {
      await api.put(`/admin/tickets/${selectedTicket._id}/assign`, { assignedTeam: assignTeam });
      toast.success('Ticket assigned successfully');
      setAssignModal(false);
      setAssignTeam('');
      handleViewTicket(selectedTicket);
      fetchTickets();
    } catch (err) {
      toast.error('Failed to assign ticket');
    }
  };

  const handleResolve = async () => {
    try {
      await api.put(`/admin/tickets/${selectedTicket._id}/resolve`, { resolution });
      toast.success('Ticket resolved successfully');
      setResolveModal(false);
      setResolution('');
      handleCloseDetail();
      fetchTickets();
    } catch (err) {
      toast.error('Failed to resolve ticket');
    }
  };

  const handleClose = async () => {
    if (!window.confirm('Are you sure you want to close this ticket?')) return;
    try {
      await api.put(`/admin/tickets/${selectedTicket._id}/close`);
      toast.success('Ticket closed');
      handleCloseDetail();
      fetchTickets();
    } catch (err) {
      toast.error('Failed to close ticket');
    }
  };

  const handleEscalate = async () => {
    const reason = window.prompt('Enter escalation reason:');
    if (!reason) return;
    try {
      await api.put(`/admin/tickets/${selectedTicket._id}/escalate`, { reason });
      toast.success('Ticket escalated');
      handleViewTicket(selectedTicket);
      fetchTickets();
    } catch (err) {
      toast.error('Failed to escalate ticket');
    }
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      open: 'bg-blue-100 text-blue-700',
      assigned: 'bg-violet-100 text-violet-700',
      in_progress: 'bg-amber-100 text-amber-700',
      waiting_customer: 'bg-amber-100 text-amber-700',
      waiting_vendor: 'bg-gray-100 text-gray-700',
      escalated: 'bg-red-100 text-red-700',
      resolved: 'bg-emerald-100 text-emerald-700',
      closed: 'bg-gray-100 text-gray-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getPriorityBadgeColor = (priority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-700',
      medium: 'bg-blue-100 text-blue-700',
      high: 'bg-amber-100 text-amber-700',
      urgent: 'bg-red-100 text-red-700',
    };
    return colors[priority] || 'bg-gray-100 text-gray-700';
  };

  const getAvatarColor = (index) => {
    const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-violet-500', 'bg-amber-500', 'bg-pink-500', 'bg-cyan-500'];
    return colors[index % colors.length];
  };

  const getInitials = (ticket) => {
    if (ticket.customer?.profile?.firstName) {
      return `${ticket.customer.profile.firstName[0]}${ticket.customer.profile.lastName?.[0] || ''}`.toUpperCase();
    }
    return ticket.customer?.email?.[0]?.toUpperCase() || 'C';
  };

  const getStatusLabel = (status) => {
    const labels = {
      open: 'Open',
      assigned: 'Assigned',
      in_progress: 'In Progress',
      waiting_customer: 'Waiting Customer',
      waiting_vendor: 'Waiting Vendor',
      escalated: 'Escalated',
      resolved: 'Resolved',
      closed: 'Closed',
    };
    return labels[status] || status;
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleString('en-PK', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-emerald-600">Support Tickets</h1>
          <p className="text-sm text-gray-500 mt-1">{pagination.total} total tickets</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Open</p>
            <p className="text-2xl font-bold text-blue-600">{stats.open || 0}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-sm text-gray-500">In Progress</p>
            <p className="text-2xl font-bold text-amber-600">
              {(stats.in_progress || 0) + (stats.waiting_customer || 0) + (stats.waiting_vendor || 0)}
            </p>
          </div>
          <div className={`rounded-2xl shadow-sm p-4 ${stats.escalated > 0 ? 'bg-red-50' : 'bg-white'}`}>
            <p className="text-sm text-gray-500">Escalated</p>
            <p className="text-2xl font-bold text-red-600">{stats.escalated || 0}</p>
          </div>
          <div className={`rounded-2xl shadow-sm p-4 ${stats.slaBreached > 0 ? 'bg-amber-50' : 'bg-white'}`}>
            <p className="text-sm text-gray-500">SLA Breached</p>
            <p className="text-2xl font-bold text-orange-600">{stats.slaBreached || 0}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Resolved</p>
            <p className="text-2xl font-bold text-emerald-600">{stats.resolved || 0}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total || 0}</p>
          </div>
        </div>
      )}

      {/* Tickets Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* Table Header with Filters */}
        <div className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-900">All Tickets</h3>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <form onSubmit={handleSearch} className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-900" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 w-40 placeholder-gray-900 text-gray-900"
              />
            </form>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm text-gray-900"
              >
                <option value="">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="waiting_customer">Waiting Customer</option>
                <option value="escalated">Escalated</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-900 pointer-events-none" />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm text-gray-900"
              >
                <option value="">All Categories</option>
                {TICKET_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
              <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-900 pointer-events-none" />
            </div>

            {/* Priority Filter */}
            <div className="relative">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm text-gray-900"
              >
                <option value="">All Priority</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
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
        ) : tickets.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No tickets found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-emerald-50">
                  <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Ticket #</th>
                  <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Subject</th>
                  <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Customer</th>
                  <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Category</th>
                  <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Priority</th>
                  <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Status</th>
                  <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Created</th>
                  <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket, index) => {
                  const isSLABreached = ticket.slaDeadline && new Date(ticket.slaDeadline) < new Date() &&
                    !['resolved', 'closed'].includes(ticket.status);
                  return (
                    <tr
                      key={ticket._id}
                      className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${isSLABreached ? 'bg-red-50' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {isSLABreached && <ExclamationIcon className="w-4 h-4 text-red-500" />}
                          <span className="text-sm font-bold text-gray-900">{ticket.ticketNumber}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900 truncate max-w-[200px]">{ticket.subject}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full ${getAvatarColor(index)} flex items-center justify-center`}>
                            <span className="text-white text-xs font-medium">{getInitials(ticket)}</span>
                          </div>
                          <span className="text-sm text-gray-500">{ticket.customer?.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                          {TICKET_CATEGORIES.find(c => c.value === ticket.category)?.label || ticket.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full capitalize ${getPriorityBadgeColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(ticket.status)}`}>
                          {getStatusLabel(ticket.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatTime(ticket.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleViewTicket(ticket)}
                          className="p-1 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                          title="View Details"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="px-6 py-4 flex items-center justify-between border-t border-gray-100">
          <p className="text-sm text-emerald-600">
            Showing {tickets.length} of {pagination.total} Result
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button className="w-8 h-8 text-sm bg-emerald-500 text-white rounded-lg">
              {String(page).padStart(2, '0')}
            </button>
            <button
              disabled={page === pagination.pages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Ticket Detail Modal */}
      <Modal
        isOpen={!!selectedTicket}
        onClose={handleCloseDetail}
        title={selectedTicket?.ticketNumber}
      >
        {detailLoading ? (
          <div className="p-8 text-center">
            <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto" />
          </div>
        ) : selectedTicket && (
          <div className="space-y-4">
            {/* Ticket Info */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">{selectedTicket.subject}</h3>
              <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(selectedTicket.status)}`}>
                {getStatusLabel(selectedTicket.status)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg text-sm">
              <div>
                <p className="text-gray-500">Customer</p>
                <p className="font-medium text-gray-900">{selectedTicket.customer?.email}</p>
              </div>
              <div>
                <p className="text-gray-500">Category</p>
                <p className="font-medium text-gray-900">
                  {TICKET_CATEGORIES.find(c => c.value === selectedTicket.category)?.label}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Priority</p>
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full capitalize ${getPriorityBadgeColor(selectedTicket.priority)}`}>
                  {selectedTicket.priority}
                </span>
              </div>
              <div>
                <p className="text-gray-500">Team</p>
                <p className="font-medium text-gray-900">{selectedTicket.assignedTeam || 'Unassigned'}</p>
              </div>
            </div>

            {/* Action Buttons */}
            {!['closed'].includes(selectedTicket.status) && (
              <div className="flex gap-2">
                <button
                  onClick={() => setAssignModal(true)}
                  disabled={['resolved', 'closed'].includes(selectedTicket.status)}
                  className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50"
                >
                  Assign
                </button>
                <button
                  onClick={handleEscalate}
                  disabled={['resolved', 'closed', 'escalated'].includes(selectedTicket.status)}
                  className="px-3 py-1.5 text-sm bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 disabled:opacity-50"
                >
                  Escalate
                </button>
                <button
                  onClick={() => setResolveModal(true)}
                  disabled={['resolved', 'closed'].includes(selectedTicket.status)}
                  className="px-3 py-1.5 text-sm bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 disabled:opacity-50"
                >
                  Resolve
                </button>
                <button
                  onClick={handleClose}
                  disabled={selectedTicket.status === 'closed'}
                  className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50"
                >
                  Close
                </button>
              </div>
            )}

            {/* Messages */}
            <div className="max-h-60 overflow-y-auto space-y-3">
              {ticketMessages.map((msg, index) => (
                <div
                  key={msg._id || index}
                  className={`p-3 rounded-lg ${msg.isInternalNote ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full ${getAvatarColor(index)} flex items-center justify-center`}>
                        <span className="text-white text-xs">{msg.sender?.type?.[0]?.toUpperCase() || 'U'}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{msg.sender?.name}</span>
                      {msg.isInternalNote && (
                        <span className="px-1.5 py-0.5 text-xs bg-amber-200 text-amber-800 rounded">Internal</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">{formatTime(msg.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.message}</p>
                </div>
              ))}
            </div>

            {/* Reply Form */}
            {!['closed'].includes(selectedTicket.status) && (
              <div className="space-y-2">
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your reply..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                  rows="3"
                />
                <div className="flex justify-between items-center">
                  <select
                    value={isInternalNote ? 'internal' : 'reply'}
                    onChange={(e) => setIsInternalNote(e.target.value === 'internal')}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-900"
                  >
                    <option value="reply">Reply to Customer</option>
                    <option value="internal">Internal Note</option>
                  </select>
                  <button
                    onClick={handleSendReply}
                    disabled={!replyMessage.trim() || sending}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                  >
                    {sending ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <SendIcon className="w-4 h-4" />
                    )}
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Assign Modal */}
      <Modal
        isOpen={assignModal}
        onClose={() => setAssignModal(false)}
        title="Assign Ticket"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
            <select
              value={assignTeam}
              onChange={(e) => setAssignTeam(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
            >
              <option value="">Select Team</option>
              {TEAMS.map((team) => (
                <option key={team.value} value={team.value}>{team.label}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => setAssignModal(false)}>Cancel</Button>
            <Button onClick={handleAssign} disabled={!assignTeam}>Assign</Button>
          </div>
        </div>
      </Modal>

      {/* Resolve Modal */}
      <Modal
        isOpen={resolveModal}
        onClose={() => setResolveModal(false)}
        title="Resolve Ticket"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Resolution Message</label>
            <textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="Describe how the issue was resolved..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
              rows="4"
            />
          </div>
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => setResolveModal(false)}>Cancel</Button>
            <Button onClick={handleResolve}>Resolve Ticket</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
