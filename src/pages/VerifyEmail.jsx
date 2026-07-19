import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import client from '../api/client';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMsg('Invalid verification token.');
      return;
    }

    client
      .get(`/api/auth/verify?token=${token}`)
      .then(() => {
        setStatus('success');
        setMsg('Your email has been verified successfully!');
      })
      .catch((err) => {
        setStatus('error');
        setMsg(err.response?.data?.message || 'Verification token is invalid or expired.');
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-panel w-96 max-w-full rounded-2xl p-8 shadow-2xl text-center animate-fade-in">
        <div className="flex flex-col items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-2xl text-white shadow-lg">
            D
          </div>
          <h2 className="font-bold text-xl text-slate-100 font-sans">Email Verification</h2>
        </div>

        {status === 'verifying' && (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-4 border-slate-700 border-t-blue-500 animate-spin"></div>
            <p className="text-slate-400 text-sm">Verifying your email address...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col gap-4">
            <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg text-sm font-medium">
              {msg}
            </div>
            <Link to="/login" className="glass-btn-primary w-full text-center">
              Go to Login
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col gap-4">
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm font-medium">
              {msg}
            </div>
            <Link to="/login" className="glass-btn-secondary w-full text-center">
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
