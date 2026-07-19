import React, { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import client from '../api/client';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const resetMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await client.post('/api/auth/reset-password', payload);
      return res.data;
    },
    onSuccess: () => {
      setSuccessMsg('Your password has been reset successfully!');
      setTimeout(() => navigate('/login'), 3000);
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.message || 'Password reset failed. Token might be invalid or expired.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!token) {
      setErrorMsg('Token missing.');
      return;
    }
    resetMutation.mutate({ token, newPassword: password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-panel w-96 max-w-full rounded-2xl p-8 shadow-2xl animate-fade-in">
        <div className="flex flex-col items-center gap-2 mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-2xl text-white shadow-lg">
            D
          </div>
          <h2 className="font-bold text-xl text-slate-100 font-sans">New Password</h2>
          <p className="text-xs text-slate-400">Set your new access credentials</p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs text-center font-medium">
            {errorMsg}
          </div>
        )}

        {successMsg ? (
          <div className="text-center flex flex-col gap-4">
            <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg text-xs font-medium">
              {successMsg}
            </div>
            <Link to="/login" className="glass-btn-primary w-full text-center">
              Go to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">New Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass-input"
              />
            </div>

            <button
              type="submit"
              disabled={resetMutation.isPending}
              className="glass-btn-primary w-full mt-2"
            >
              {resetMutation.isPending ? 'Saving...' : 'Save Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
