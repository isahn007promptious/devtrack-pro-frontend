import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMutation } from '@tanstack/react-query';
import client from '../api/client';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loginMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await client.post('/api/auth/login', payload);
      return res.data;
    },
    onSuccess: (data) => {
      login(data);
      navigate('/');
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.message || 'Invalid email credentials or unverified email.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-panel w-96 max-w-full rounded-2xl p-8 shadow-2xl animate-fade-in">
        {/* Brand */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-2xl text-white shadow-lg shadow-blue-500/30">
            D
          </div>
          <h2 className="font-bold text-xl text-slate-100">Welcome Back</h2>
          <p className="text-xs text-slate-400">Sign in to manage your developer workspace</p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs text-center font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
            <input
              type="email"
              required
              placeholder="e.g. john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="glass-input"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-slate-400">Password</label>
              <Link to="/forgot-password" className="text-[10px] text-blue-400 hover:underline">
                Forgot password?
              </Link>
            </div>
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
            disabled={loginMutation.isPending}
            className="glass-btn-primary w-full mt-2"
          >
            {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <span className="text-xs text-slate-500">New to DevTrack? </span>
          <Link to="/register" className="text-xs text-blue-400 hover:underline font-medium">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
