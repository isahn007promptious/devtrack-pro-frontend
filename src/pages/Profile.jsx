import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useQuery, useMutation } from '@tanstack/react-query';
import client from '../api/client';

const Profile = () => {
  const { updateProfile } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [skillsText, setSkillsText] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch current user details
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await client.get('/api/users/me');
      return res.data;
    },
  });

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName || '');
      setLastName(profile.lastName || '');
      setAvatarUrl(profile.avatarUrl || '');
      setSkillsText(profile.skills ? profile.skills.join(', ') : '');
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await client.put('/api/users/me', payload);
      return res.data;
    },
    onSuccess: (data) => {
      updateProfile(data);
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.message || 'Failed to update profile.');
      setTimeout(() => setErrorMsg(''), 4000);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    // Parse comma-separated skills
    const skills = skillsText
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    updateMutation.mutate({ firstName, lastName, avatarUrl, skills });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <div className="w-8 h-8 rounded-full border-4 border-slate-700 border-t-blue-500 animate-spin"></div>
        <p className="text-slate-400 text-sm">Loading user profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 mb-1">Account Profile</h1>
        <p className="text-xs text-slate-400">View and update your personal developer account details.</p>
      </div>

      {successMsg && (
        <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg text-xs text-center font-medium animate-fade-in">
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs text-center font-medium animate-fade-in">
          {errorMsg}
        </div>
      )}

      <div className="glass-panel rounded-2xl p-8 border border-slate-800 bg-slate-900/40">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Metadata Display */}
          <div className="flex items-center gap-4 border-b border-slate-800/80 pb-5 mb-2">
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-2xl text-white font-bold border border-blue-500/50 shadow-lg">
              {profile?.username?.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="font-semibold text-slate-200">{profile?.firstName} {profile?.lastName}</h3>
              <p className="text-xs text-slate-500">@{profile?.username} · {profile?.email}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                  {profile?.emailVerified ? 'Verified Email' : 'Unverified'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-400 mb-1">First Name</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="glass-input"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-400 mb-1">Last Name</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="glass-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Avatar Image URL (Optional)</label>
            <input
              type="url"
              placeholder="e.g. https://images.unsplash.com/photo-..."
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="glass-input"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Developer Skills (Comma-separated)</label>
            <input
              type="text"
              placeholder="e.g. Java, Spring Boot, React, MapStruct, JPA"
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
              className="glass-input"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">Separate skill tags with commas. They will be displayed as badge tags.</span>
          </div>

          {/* Render Skills badges preview */}
          {skillsText.trim().length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Skills Preview</label>
              <div className="flex flex-wrap gap-1.5 p-3 bg-slate-950/30 border border-slate-800/80 rounded-xl">
                {skillsText
                  .split(',')
                  .map((s) => s.trim())
                  .filter((s) => s.length > 0)
                  .map((skill, index) => (
                    <span key={index} className="text-xs px-2.5 py-0.5 rounded-full border border-blue-500/20 text-blue-400 bg-blue-500/10 font-medium">
                      {skill}
                    </span>
                  ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="glass-btn-primary self-end px-6 mt-4"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
