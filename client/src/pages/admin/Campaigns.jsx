import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Button, Modal } from '../../components/common';

const PlusIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const ChartIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const CalendarIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const PauseIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const TrashIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const SendIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
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

const CAMPAIGN_TYPES = [
  { value: 'promotional', label: 'Promotional' },
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'abandoned_cart', label: 'Abandoned Cart' },
  { value: 'transactional', label: 'Transactional' },
];

const CHANNELS = [
  { value: 'email', label: 'Email' },
  { value: 'push', label: 'Push Notification' },
  { value: 'sms', label: 'SMS' },
];

const initialFormState = {
  name: '',
  type: 'promotional',
  channel: 'email',
  audience: { targetAll: true, segmentId: '' },
  content: { subject: '', preheader: '', htmlBody: '' },
};

export default function AdminCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [statusFilter, setStatusFilter] = useState('');

  const [createModal, setCreateModal] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [segments, setSegments] = useState([]);

  const [scheduleModal, setScheduleModal] = useState({ open: false, campaign: null });
  const [scheduleDate, setScheduleDate] = useState('');
  const [sendImmediately, setSendImmediately] = useState(false);

  const [statsModal, setStatsModal] = useState({ open: false, stats: null });

  useEffect(() => {
    fetchCampaigns();
    fetchSegments();
  }, [page, statusFilter]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page, limit: 10 });
      if (statusFilter) params.append('status', statusFilter);

      const response = await api.get(`/admin/campaigns?${params}`);
      setCampaigns(response.data.data || []);
      setPagination(response.data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      toast.error('Failed to fetch campaigns');
    } finally {
      setLoading(false);
    }
  };

  const fetchSegments = async () => {
    try {
      const response = await api.get('/admin/segments');
      setSegments(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch segments:', err);
    }
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/campaigns', formData);
      toast.success('Campaign created successfully');
      setCreateModal(false);
      setFormData(initialFormState);
      fetchCampaigns();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create campaign');
    }
  };

  const handleScheduleCampaign = async () => {
    try {
      await api.post(`/admin/campaigns/${scheduleModal.campaign._id}/schedule`, {
        scheduledAt: scheduleDate,
        sendImmediately,
      });
      toast.success(sendImmediately ? 'Campaign is being sent' : 'Campaign scheduled');
      setScheduleModal({ open: false, campaign: null });
      fetchCampaigns();
    } catch (err) {
      toast.error('Failed to schedule campaign');
    }
  };

  const handlePauseCampaign = async (campaignId) => {
    try {
      await api.put(`/admin/campaigns/${campaignId}/pause`);
      toast.success('Campaign paused');
      fetchCampaigns();
    } catch (err) {
      toast.error('Failed to pause campaign');
    }
  };

  const handleCancelCampaign = async (campaignId) => {
    if (!window.confirm('Are you sure you want to cancel this campaign?')) return;
    try {
      await api.delete(`/admin/campaigns/${campaignId}`);
      toast.success('Campaign cancelled');
      fetchCampaigns();
    } catch (err) {
      toast.error('Failed to cancel campaign');
    }
  };

  const handleViewStats = async (campaign) => {
    try {
      const response = await api.get(`/admin/campaigns/${campaign._id}/stats`);
      setStatsModal({ open: true, stats: response.data.data });
    } catch (err) {
      toast.error('Failed to fetch campaign stats');
    }
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-700',
      scheduled: 'bg-blue-100 text-blue-700',
      sending: 'bg-amber-100 text-amber-700',
      sent: 'bg-emerald-100 text-emerald-700',
      paused: 'bg-gray-100 text-gray-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status) => {
    const labels = {
      draft: 'Draft',
      scheduled: 'Scheduled',
      sending: 'Sending',
      sent: 'Sent',
      paused: 'Paused',
      cancelled: 'Cancelled',
    };
    return labels[status] || status;
  };

  const getAvatarColor = (index) => {
    const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-violet-500', 'bg-amber-500', 'bg-pink-500', 'bg-cyan-500'];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-emerald-600">Campaigns</h1>
          <p className="text-sm text-gray-500 mt-1">{pagination.total} total campaigns</p>
        </div>
        <button
          onClick={() => setCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Create Campaign
        </button>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* Table Header with Filters */}
        <div className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-900">All Campaigns</h3>

          <div className="flex items-center gap-3">
            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm text-gray-900"
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="sending">Sending</option>
                <option value="sent">Sent</option>
                <option value="paused">Paused</option>
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
        ) : campaigns.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No campaigns found. Create your first campaign!</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-emerald-50">
                  <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Campaign</th>
                  <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Type</th>
                  <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Channel</th>
                  <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Audience</th>
                  <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Status</th>
                  <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Sent</th>
                  <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Open Rate</th>
                  <th className="text-left text-xs font-semibold text-emerald-700 uppercase px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign, index) => (
                  <tr key={campaign._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${getAvatarColor(index)} flex items-center justify-center`}>
                          <span className="text-white text-xs font-medium">
                            {campaign.name?.[0]?.toUpperCase() || 'C'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{campaign.name}</p>
                          {campaign.content?.subject && (
                            <p className="text-xs text-gray-500 truncate max-w-[150px]">{campaign.content.subject}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-violet-100 text-violet-700">
                        {CAMPAIGN_TYPES.find(t => t.value === campaign.type)?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                        {CHANNELS.find(c => c.value === campaign.channel)?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {campaign.audience?.estimatedReach?.toLocaleString() || 0} recipients
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(campaign.status)}`}>
                        {getStatusLabel(campaign.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {campaign.stats?.sent || 0}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-emerald-600">
                        {campaign.stats?.delivered > 0
                          ? ((campaign.stats.opened / campaign.stats.delivered) * 100).toFixed(1)
                          : 0}%
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        {['sent', 'sending'].includes(campaign.status) && (
                          <button
                            onClick={() => handleViewStats(campaign)}
                            className="p-1 text-violet-500 hover:bg-violet-50 rounded transition-colors"
                            title="View Stats"
                          >
                            <ChartIcon className="w-5 h-5" />
                          </button>
                        )}
                        {campaign.status === 'draft' && (
                          <button
                            onClick={() => {
                              setScheduleModal({ open: true, campaign });
                              setScheduleDate(new Date().toISOString().slice(0, 16));
                            }}
                            className="p-1 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                            title="Schedule"
                          >
                            <CalendarIcon className="w-5 h-5" />
                          </button>
                        )}
                        {['scheduled', 'sending'].includes(campaign.status) && (
                          <button
                            onClick={() => handlePauseCampaign(campaign._id)}
                            className="p-1 text-amber-500 hover:bg-amber-50 rounded transition-colors"
                            title="Pause"
                          >
                            <PauseIcon className="w-5 h-5" />
                          </button>
                        )}
                        {!['sent', 'cancelled'].includes(campaign.status) && (
                          <button
                            onClick={() => handleCancelCampaign(campaign._id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="Cancel"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="px-6 py-4 flex items-center justify-between border-t border-gray-100">
          <p className="text-sm text-emerald-600">
            Showing {campaigns.length} of {pagination.total} Result
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

      {/* Create Campaign Modal */}
      <Modal
        isOpen={createModal}
        onClose={() => setCreateModal(false)}
        title="Create Campaign"
      >
        <form onSubmit={handleCreateCampaign} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
              >
                {CAMPAIGN_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
              <select
                value={formData.channel}
                onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
              >
                {CHANNELS.map((ch) => (
                  <option key={ch.value} value={ch.value}>{ch.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
            <select
              value={formData.audience.targetAll ? 'all' : formData.audience.segmentId}
              onChange={(e) => {
                if (e.target.value === 'all') {
                  setFormData({ ...formData, audience: { targetAll: true, segmentId: '' } });
                } else {
                  setFormData({ ...formData, audience: { targetAll: false, segmentId: e.target.value } });
                }
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
            >
              <option value="all">All Customers</option>
              {segments.map((seg) => (
                <option key={seg._id} value={seg._id}>
                  {seg.name} ({seg.customerCount?.toLocaleString()} customers)
                </option>
              ))}
            </select>
          </div>

          {formData.channel === 'email' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Subject</label>
                <input
                  type="text"
                  value={formData.content.subject}
                  onChange={(e) => setFormData({ ...formData, content: { ...formData.content, subject: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preheader Text</label>
                <input
                  type="text"
                  value={formData.content.preheader}
                  onChange={(e) => setFormData({ ...formData, content: { ...formData.content, preheader: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                  placeholder="Preview text shown in inbox"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Body (HTML)</label>
                <textarea
                  value={formData.content.htmlBody}
                  onChange={(e) => setFormData({ ...formData, content: { ...formData.content, htmlBody: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                  rows="6"
                  placeholder="Use {{customer_name}} for personalization"
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-4 pt-4">
            <Button variant="outline" type="button" onClick={() => setCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Campaign</Button>
          </div>
        </form>
      </Modal>

      {/* Schedule Modal */}
      <Modal
        isOpen={scheduleModal.open}
        onClose={() => setScheduleModal({ open: false, campaign: null })}
        title="Schedule Campaign"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Send Option</label>
            <select
              value={sendImmediately ? 'now' : 'schedule'}
              onChange={(e) => setSendImmediately(e.target.value === 'now')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
            >
              <option value="now">Send Immediately</option>
              <option value="schedule">Schedule for Later</option>
            </select>
          </div>

          {!sendImmediately && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Date & Time</label>
              <input
                type="datetime-local"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
              />
            </div>
          )}

          <div className="flex justify-end gap-4 pt-4">
            <Button variant="outline" onClick={() => setScheduleModal({ open: false, campaign: null })}>
              Cancel
            </Button>
            <button
              onClick={handleScheduleCampaign}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              <SendIcon className="w-4 h-4" />
              {sendImmediately ? 'Send Now' : 'Schedule'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Stats Modal */}
      <Modal
        isOpen={statsModal.open}
        onClose={() => setStatsModal({ open: false, stats: null })}
        title="Campaign Statistics"
      >
        {statsModal.stats && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h4 className="text-lg font-medium text-gray-900">{statsModal.stats.campaign?.name}</h4>
              <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(statsModal.stats.campaign?.status)}`}>
                {getStatusLabel(statsModal.stats.campaign?.status)}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Total Sent</p>
                <p className="text-xl font-bold text-gray-900">{statsModal.stats.stats?.sent || 0}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Delivered</p>
                <p className="text-xl font-bold text-gray-900">{statsModal.stats.stats?.delivered || 0}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Opened</p>
                <p className="text-xl font-bold text-gray-900">{statsModal.stats.stats?.opened || 0}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Open Rate</p>
                <p className="text-xl font-bold text-emerald-600">{statsModal.stats.rates?.openRate || 0}%</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Click Rate</p>
                <p className="text-xl font-bold text-blue-600">{statsModal.stats.rates?.clickRate || 0}%</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Bounce Rate</p>
                <p className="text-xl font-bold text-red-600">{statsModal.stats.rates?.bounceRate || 0}%</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
