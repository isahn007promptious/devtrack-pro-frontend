import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import client from '../api/client';

const Register = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const registerMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await client.post('/api/auth/register', payload);
      return res.data;
    },
    onSuccess: () => {
      setSuccessMsg('Registration successful! Please check your email/terminal console output for the verification link.');
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.message || 'Registration failed. Check inputs.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    registerMutation.mutate({ username, email, password, firstName, lastName });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-panel w-96 max-w-full rounded-2xl p-8 shadow-2xl animate-fade-in">
        {/* Brand */}
        <div className="flex flex-col items-center gap-2 mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-2xl text-white shadow-lg shadow-blue-500/30">
            D
          </div>
          <h2 className="font-bold text-xl text-slate-100">Create Account</h2>
          <p className="text-xs text-slate-400">Get started with DevTrack Pro</p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs text-center font-medium">
            {errorMsg}
          </div>
        )}

        {successMsg ? (
          <div className="text-center flex flex-col gap-4 animate-fade-in">
            <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg text-xs font-medium">
              {successMsg}
            </div>
            <Link to="/login" className="glass-btn-primary w-full text-center">
              Go to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-400 mb-1">First Name</label>
                <input
                  type="text"
                  required
                  placeholder="John"
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
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="glass-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Username</label>
              <input
                type="text"
                required
                placeholder="johndoe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="glass-input"
              />
            </div>

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

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Password</label>
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
              disabled={registerMutation.isPending}
              className="glass-btn-primary w-full mt-2"
            >
              {registerMutation.isPending ? 'Registering...' : 'Register'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <span className="text-xs text-slate-500">Already have an account? </span>
          <Link to="/login" className="text-xs text-blue-400 hover:underline font-medium">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
