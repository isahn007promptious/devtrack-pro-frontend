import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const JoinOrg = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { user } = useAuth();

  const [status, setStatus] = useState('joining'); // joining, success, error
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!user) {
      // Must be logged in to accept invites
      setStatus('error');
      setMsg('You must be logged in to accept organization invitations.');
      return;
    }

    if (!token) {
      setStatus('error');
      setMsg('Invalid invitation token link.');
      return;
    }

    client
      .post(`/api/organizations/invitations/accept?token=${token}`)
      .then((res) => {
        setStatus('success');
        setMsg('Successfully joined the organization!');
        setTimeout(() => navigate('/'), 2500);
      })
      .catch((err) => {
        setStatus('error');
        setMsg(err.response?.data?.message || 'Failed to join organization. The token might have expired.');
      });
  }, [token, user]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-panel w-96 max-w-full rounded-2xl p-8 shadow-2xl text-center animate-fade-in">
        <div className="flex flex-col items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-2xl text-white shadow-lg">
            D
          </div>
          <h2 className="font-bold text-xl text-slate-100">Join Organization</h2>
        </div>

        {status === 'joining' && (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-4 border-slate-700 border-t-blue-500 animate-spin"></div>
            <p className="text-slate-400 text-sm">Joining organization group...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col gap-4">
            <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg text-sm font-medium">
              {msg}
            </div>
            <p className="text-xs text-slate-500">Redirecting you to dashboard...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col gap-4">
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm font-medium">
              {msg}
            </div>
            {!user ? (
              <Link to="/login" className="glass-btn-primary w-full text-center">
                Log In First
              </Link>
            ) : (
              <Link to="/" className="glass-btn-secondary w-full text-center">
                Go to Dashboard
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default JoinOrg;
