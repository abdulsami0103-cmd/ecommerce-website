import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Input, Modal } from '../../components/common';

const UserPlusIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
  </svg>
);

const TrashIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const EditIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const VendorTeam = () => {
  const [loading, setLoading] = useState(true);
  const [teamData, setTeamData] = useState({ owner: null, members: [] });
  const [roles, setRoles] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('');
  const [saving, setSaving] = useState(false);

  const [activeTab, setActiveTab] = useState('members');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [teamRes, rolesRes, logsRes] = await Promise.all([
        api.get('/vendor/team'),
        api.get('/vendor/team/roles'),
        api.get('/vendor/team/audit-logs?limit=20'),
      ]);
      setTeamData(teamRes.data.data);
      setRoles(rolesRes.data.data);
      setAuditLogs(logsRes.data.data);
    } catch (error) {
      console.error('Failed to fetch team data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail || !inviteRole) {
      toast.error('Please fill all fields');
      return;
    }

    setSaving(true);
    try {
      await api.post('/vendor/team/invite', { email: inviteEmail, roleId: inviteRole });
      toast.success('Invitation sent successfully');
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send invitation');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this team member?')) return;

    try {
      await api.delete(`/vendor/team/${memberId}`);
      toast.success('Team member removed');
      fetchData();
    } catch (error) {
      toast.error('Failed to remove member');
    }
  };

  const handleRoleChange = async (memberId, roleId) => {
    try {
      await api.put(`/vendor/team/${memberId}/role`, { roleId });
      toast.success('Role updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-warning',
      active: 'badge-success',
      suspended: 'badge-danger',
      removed: 'badge-info',
    };
    return badges[status] || 'badge-info';
  };

  const getActionIcon = (action) => {
    if (action.includes('product')) return '📦';
    if (action.includes('order')) return '🛒';
    if (action.includes('team')) return '👥';
    if (action.includes('subscription')) return '💳';
    if (action.includes('payout')) return '💰';
    return '📝';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-8">
      <div className="flex items-center justify-between mb-3 sm:mb-8">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-emerald-600">Team</h1>
          <p className="text-[10px] sm:text-base text-gray-500">Manage members & roles</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="px-2.5 py-1.5 sm:px-4 sm:py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors flex items-center text-[10px] sm:text-sm"
        >
          <UserPlusIcon className="w-3.5 h-3.5 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
          Invite
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 sm:gap-4 mb-3 sm:mb-6 border-b">
        {['members', 'roles', 'activity'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 sm:pb-3 px-1 font-medium capitalize transition-colors text-xs sm:text-base ${
              activeTab === tab
                ? 'text-emerald-600 border-b-2 border-emerald-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'activity' ? 'Audit Logs' : tab}
          </button>
        ))}
      </div>

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="card overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden sm:block">
            <table className="w-full">
              <thead className="bg-emerald-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Member</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-emerald-700 uppercase">Joined</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-emerald-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {teamData.owner && (
                  <tr className="bg-emerald-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">
                          {teamData.owner.user?.profile?.firstName} {teamData.owner.user?.profile?.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{teamData.owner.user?.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4"><span className="badge badge-primary">Owner</span></td>
                    <td className="px-6 py-4"><span className="badge badge-success">Active</span></td>
                    <td className="px-6 py-4 text-gray-500">-</td>
                    <td className="px-6 py-4 text-right text-gray-400">-</td>
                  </tr>
                )}
                {teamData.members.map((member) => (
                  <tr key={member._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{member.user?.profile?.firstName} {member.user?.profile?.lastName}</p>
                        <p className="text-sm text-gray-500">{member.user?.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select value={member.role?._id} onChange={(e) => handleRoleChange(member._id, e.target.value)} className="input input-sm">
                        {roles.filter(r => r.name !== 'Owner').map((role) => (
                          <option key={role._id} value={role._id}>{role.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4"><span className={`badge ${getStatusBadge(member.status)}`}>{member.status}</span></td>
                    <td className="px-6 py-4 text-gray-500">{member.acceptedAt ? new Date(member.acceptedAt).toLocaleDateString() : 'Pending'}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleRemoveMember(member._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><TrashIcon className="w-5 h-5" /></button>
                    </td>
                  </tr>
                ))}
                {teamData.members.length === 0 && (
                  <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No team members yet. Invite someone to get started.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="sm:hidden">
            <div className="grid grid-cols-12 gap-1 bg-emerald-50 px-2.5 py-1.5 items-center">
              <span className="col-span-5 text-[9px] font-semibold text-emerald-700 uppercase">Member</span>
              <span className="col-span-3 text-[9px] font-semibold text-emerald-700 uppercase">Role</span>
              <span className="col-span-2 text-[9px] font-semibold text-emerald-700 uppercase">Status</span>
              <span className="col-span-2 text-[9px] font-semibold text-emerald-700 uppercase text-right">Action</span>
            </div>
            <div className="divide-y divide-gray-100">
              {/* Owner */}
              {teamData.owner && (
                <div className="grid grid-cols-12 gap-1 items-center px-2.5 py-2 bg-emerald-50/50">
                  <div className="col-span-5 min-w-0">
                    <p className="text-[10px] font-medium text-gray-900 truncate">
                      {teamData.owner.user?.profile?.firstName} {teamData.owner.user?.profile?.lastName}
                    </p>
                    <p className="text-[8px] text-gray-500 truncate">{teamData.owner.user?.email}</p>
                  </div>
                  <div className="col-span-3">
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">Owner</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">Active</span>
                  </div>
                  <div className="col-span-2 text-right text-[9px] text-gray-400">-</div>
                </div>
              )}

              {/* Members */}
              {teamData.members.map((member) => (
                <div key={member._id} className="grid grid-cols-12 gap-1 items-center px-2.5 py-2">
                  <div className="col-span-5 min-w-0">
                    <p className="text-[10px] font-medium text-gray-900 truncate">
                      {member.user?.profile?.firstName} {member.user?.profile?.lastName}
                    </p>
                    <p className="text-[8px] text-gray-500 truncate">{member.user?.email}</p>
                  </div>
                  <div className="col-span-3">
                    <select
                      value={member.role?._id}
                      onChange={(e) => handleRoleChange(member._id, e.target.value)}
                      className="w-full px-1 py-0.5 border rounded text-[9px]"
                    >
                      {roles.filter(r => r.name !== 'Owner').map((role) => (
                        <option key={role._id} value={role._id}>{role.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${
                      member.status === 'active' ? 'bg-green-100 text-green-700' :
                      member.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>{member.status}</span>
                  </div>
                  <div className="col-span-2 text-right">
                    <button onClick={() => handleRemoveMember(member._id)} className="p-1 text-red-500">
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {teamData.members.length === 0 && (
                <div className="px-3 py-4 text-center text-[10px] text-gray-500">
                  No team members yet. Invite someone to get started.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Roles Tab */}
      {activeTab === 'roles' && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
          {roles.map((role) => (
            <div key={role._id} className="card p-2.5 sm:p-6">
              <div className="flex items-center justify-between mb-1.5 sm:mb-4">
                <h3 className="font-semibold text-emerald-600 text-xs sm:text-base">{role.name}</h3>
                {role.isDefault ? (
                  <span className="text-[8px] sm:text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">Default</span>
                ) : (
                  <button className="p-1 hover:bg-gray-100 rounded-lg">
                    <EditIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                )}
              </div>
              <p className="text-[9px] sm:text-sm text-gray-500 mb-1.5 sm:mb-4 line-clamp-2">{role.description}</p>
              <div className="space-y-0.5 sm:space-y-1">
                {Object.entries(role.permissions || {}).map(([key, value]) => {
                  if (!value) return null;
                  const label = key.replace(/_/g, ' ').replace('can ', '');
                  return (
                    <p key={key} className="text-[8px] sm:text-xs text-gray-600 flex items-center gap-0.5 sm:gap-1">
                      <span className="text-green-500">✓</span> {label}
                    </p>
                  );
                }).filter(Boolean).slice(0, 5)}
                {Object.values(role.permissions || {}).filter(Boolean).length > 5 && (
                  <p className="text-[8px] sm:text-xs text-emerald-600">
                    +{Object.values(role.permissions).filter(Boolean).length - 5} more
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Audit Logs Tab */}
      {activeTab === 'activity' && (
        <div className="card overflow-hidden">
          <div className="divide-y">
            {auditLogs.map((log) => (
              <div key={log._id} className="px-2.5 py-2 sm:px-6 sm:py-4 flex items-start gap-2 sm:gap-4">
                <span className="text-sm sm:text-2xl shrink-0">{getActionIcon(log.action)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-base font-medium truncate">{log.description}</p>
                  <p className="text-[9px] sm:text-sm text-gray-500">
                    {log.user?.profile?.firstName || log.user?.email} • {new Date(log.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className={`text-[8px] sm:text-xs px-1.5 py-0.5 rounded-full shrink-0 ${
                  log.severity === 'high' ? 'bg-red-100 text-red-700' :
                  log.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {log.action.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
            {auditLogs.length === 0 && (
              <div className="px-3 py-4 sm:px-6 sm:py-8 text-center text-xs sm:text-base text-gray-500">
                No activity logs yet
              </div>
            )}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Invite Team Member"
      >
        <form onSubmit={handleInvite} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="member@example.com"
            required
          />
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="input"
              required
            >
              <option value="">Select a role</option>
              {roles.filter(r => r.name !== 'Owner').map((role) => (
                <option key={role._id} value={role._id}>{role.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => setShowInviteModal(false)}
              className="px-4 py-2 border-2 border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default VendorTeam;
