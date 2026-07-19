import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';

const CreateProject = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { selectedWsId } = useOutletContext();

  const [name, setName] = useState('');
  const [keyPrefix, setKeyPrefix] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [errorMsg, setErrorMsg] = useState('');

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await client.post(`/api/workspaces/${selectedWsId}/projects`, payload);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['projects', selectedWsId]);
      navigate(`/projects/${data.id}`);
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.message || 'Failed to create project. Ensure key prefix is unique.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (keyPrefix.length > 10) {
      setErrorMsg('Key prefix must be 10 characters or less.');
      return;
    }

    createMutation.mutate({
      name,
      keyPrefix: keyPrefix.toUpperCase(),
      description,
      deadline,
      priority,
    });
  };

  if (!selectedWsId) {
    return (
      <div className="text-center p-8 bg-slate-900/30 border border-slate-800 rounded-xl max-w-xl mx-auto">
        <h3 className="font-semibold text-slate-300">No Active Workspace</h3>
        <p className="text-xs text-slate-500 mt-2">Please select a workspace in the sidebar to initialize project creation.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 mb-1">Create New Project</h1>
        <p className="text-xs text-slate-400">Initialize a new code project with custom keys and deadlines.</p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs font-medium animate-fade-in">
          {errorMsg}
        </div>
      )}

      <div className="glass-panel rounded-2xl p-8 border border-slate-800 bg-slate-900/40">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex gap-4">
            <div className="flex-2">
              <label className="block text-xs font-semibold text-slate-400 mb-1">Project Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Core Engine API"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="glass-input"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-400 mb-1">Key Prefix</label>
              <input
                type="text"
                required
                placeholder="e.g. CORE"
                value={keyPrefix}
                onChange={(e) => setKeyPrefix(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
                className="glass-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Description</label>
            <textarea
              placeholder="Provide a description of the project scope..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="glass-input h-28 resize-none"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-400 mb-1">Project Target Deadline</label>
              <input
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="glass-input"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-400 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="glass-input"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button type="button" onClick={() => navigate('/')} className="glass-btn-secondary">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="glass-btn-primary">
              {createMutation.isPending ? 'Creating...' : 'Initialize Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProject;
