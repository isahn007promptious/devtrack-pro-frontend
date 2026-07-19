import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import client from '../api/client';

const OrgMembers = () => {
  const { selectedOrgId } = useOutletContext();

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('DEVELOPER');
  const [inviteLink, setInviteLink] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Fetch organization members
  const { data: members = [], isLoading: loadingMembers, refetch: refetchMembers } = useQuery({
    queryKey: ['orgMembers', selectedOrgId],
    queryFn: async () => {
      const res = await client.get(`/api/organizations/${selectedOrgId}/members`);
      return res.data;
    },
    enabled: !!selectedOrgId,
  });

  // 2. Fetch pending invitations
  const { data: invitations = [], refetch: refetchInvites } = useQuery({
    queryKey: ['orgInvitations', selectedOrgId],
    queryFn: async () => {
      const res = await client.get(`/api/organizations/${selectedOrgId}/invitations`);
      return res.data;
    },
    enabled: !!selectedOrgId,
  });

  // Invite member mutation
  const inviteMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await client.post(`/api/organizations/${selectedOrgId}/invitations`, payload);
      return res.data;
    },
    onSuccess: (data) => {
      setSuccessMsg('Invitation created successfully!');
      // Parse token and display join link
      const joinUrl = `${window.location.origin}/join-org?token=${data.token}`;
      setInviteLink(joinUrl);
      setInviteEmail('');
      refetchInvites();
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.message || 'Failed to create organization invite.');
    },
  });

  const handleInvite = (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    setInviteLink('');
    inviteMutation.mutate({ email: inviteEmail, role: inviteRole });
  };

  if (!selectedOrgId) {
    return (
      <div className="text-center p-8 bg-slate-900/30 border border-slate-800 rounded-xl max-w-xl mx-auto">
        <h3 className="font-semibold text-slate-300">No Organization Selected</h3>
        <p className="text-xs text-slate-500 mt-2">Please select or create an organization in the sidebar selector first.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 mb-1">Organization Members</h1>
        <p className="text-xs text-slate-400 font-sans">Invite collaborators and manage access levels.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Members List Table */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col gap-4 shadow-xl">
          <h3 className="font-semibold text-slate-200">Active Collaborators</h3>
          {loadingMembers ? (
            <div className="text-xs text-slate-500 text-center py-8">Loading member roster...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 uppercase font-semibold">
                    <th className="pb-3">User</th>
                    <th className="pb-3">Email</th>
                    <th className="pb-3 text-right">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {members.map((member) => (
                    <tr key={member.id} className="text-slate-300">
                      <td className="py-4 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white uppercase text-[10px]">
                          {member.firstName[0]}{member.lastName[0]}
                        </div>
                        <div>
                          <div className="font-medium text-slate-200">{member.firstName} {member.lastName}</div>
                          <div className="text-[10px] text-slate-500">@{member.username}</div>
                        </div>
                      </td>
                      <td className="py-4">{member.email}</td>
                      <td className="py-4 text-right">
                        <span className="px-2 py-0.5 rounded-full border border-blue-500/20 text-blue-400 bg-blue-500/10 font-bold uppercase tracking-wider text-[9px]">
                          {member.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Invite Member form */}
        <div className="flex flex-col gap-6">
          {/* Invite panel */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col gap-4 shadow-xl">
            <h3 className="font-semibold text-slate-200">Invite New Member</h3>

            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs font-medium">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg text-xs font-medium">
                {successMsg}
              </div>
            )}

            {inviteLink && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex flex-col gap-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Join Invitation Link:</span>
                <input
                  type="text"
                  readOnly
                  value={inviteLink}
                  onClick={(e) => e.target.select()}
                  className="w-full bg-slate-900 border border-slate-850 rounded px-2.5 py-1 text-[11px] text-slate-300 focus:outline-none cursor-pointer select-all font-mono"
                />
                <span className="text-[9px] text-slate-500 italic">Copy this URL link and open in another browser session to join organization.</span>
              </div>
            )}

            <form onSubmit={handleInvite} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="collaborator@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="glass-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Assigned Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="glass-input"
                >
                  <option value="OWNER">Owner</option>
                  <option value="ADMIN">Admin</option>
                  <option value="PROJECT_MANAGER">Project Manager</option>
                  <option value="DEVELOPER">Developer</option>
                  <option value="VIEWER">Viewer</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={inviteMutation.isPending}
                className="glass-btn-primary w-full mt-2"
              >
                {inviteMutation.isPending ? 'Sending Invite...' : 'Generate Invite Link'}
              </button>
            </form>
          </div>

          {/* Pending invites table */}
          {invitations.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col gap-3 shadow-xl">
              <h4 className="font-semibold text-xs text-slate-400 uppercase tracking-wider">Pending Invites</h4>
              <div className="flex flex-col gap-2">
                {invitations.map((inv) => (
                  <div key={inv.id} className="p-2 border border-slate-800/80 bg-slate-950/20 rounded-lg text-xs flex justify-between items-center text-slate-400">
                    <div>
                      <span className="font-medium text-slate-200">{inv.email}</span>
                      <div className="text-[10px] text-slate-500 uppercase">{inv.role}</div>
                    </div>
                    <span className="text-[10px] border border-amber-500/20 text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full font-semibold">
                      Pending
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrgMembers;
