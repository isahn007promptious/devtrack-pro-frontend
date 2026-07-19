import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import client from '../api/client';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const forgotMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await client.post('/api/auth/forgot-password', payload);
      return res.data;
    },
    onSuccess: () => {
      setSuccessMsg('Reset instructions sent! Please check your email or backend console log.');
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.message || 'Failed to send reset email.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    forgotMutation.mutate({ email });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-panel w-96 max-w-full rounded-2xl p-8 shadow-2xl animate-fade-in">
        <div className="flex flex-col items-center gap-2 mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-2xl text-white shadow-lg">
            D
          </div>
          <h2 className="font-bold text-xl text-slate-100">Reset Password</h2>
          <p className="text-xs text-slate-400">Enter your email to receive recovery link</p>
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
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
              <input
                type="email"
                required
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-input"
              />
            </div>

            <button
              type="submit"
              disabled={forgotMutation.isPending}
              className="glass-btn-primary w-full mt-2"
            >
              {forgotMutation.isPending ? 'Sending...' : 'Send Recovery Link'}
            </button>
          </form>
        )}

        {!successMsg && (
          <div className="mt-6 text-center">
            <Link to="/login" className="text-xs text-blue-400 hover:underline font-medium">
              Back to Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
