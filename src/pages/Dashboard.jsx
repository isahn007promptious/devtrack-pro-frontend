import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import client from '../api/client';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await client.get('/api/dashboard');
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <div className="w-8 h-8 rounded-full border-4 border-slate-700 border-t-blue-500 animate-spin"></div>
        <p className="text-slate-400 text-sm">Loading dashboard analytics...</p>
      </div>
    );
  }

  const stats = [
    { title: 'Total Projects', value: dashboard?.totalProjects || 0, icon: '📁', color: 'from-blue-600/20 to-blue-600/5 text-blue-400' },
    { title: 'Total Tasks', value: dashboard?.totalTasks || 0, icon: '📋', color: 'from-purple-600/20 to-purple-600/5 text-purple-400' },
    { title: 'Completed Tasks', value: dashboard?.completedTasks || 0, icon: '✅', color: 'from-green-600/20 to-green-600/5 text-green-400' },
    { title: 'Pending Tasks', value: dashboard?.pendingTasks || 0, icon: '⏳', color: 'from-amber-600/20 to-amber-600/5 text-amber-400' },
    { title: 'Overdue Tasks', value: dashboard?.overdueTasks || 0, icon: '⚠️', color: 'from-red-600/20 to-red-600/5 text-red-400' },
  ];

  // Productivity max value for charting scale
  const maxProductivity = Math.max(...(dashboard?.productivity?.map((p) => p.completedCount) || [1]), 5);

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900/30 via-slate-900 to-slate-900 border border-slate-800 p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-blue-500/5 blur-3xl"></div>
        <div>
          <h1 className="text-2xl font-bold text-slate-100 mb-1">Hello, {user?.username}!</h1>
          <p className="text-sm text-slate-400">Track and manage your enterprise code sprints and developer backlogs.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/profile" className="glass-btn-secondary">My Profile</Link>
        </div>
      </div>

      {/* Grid Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className={`p-6 rounded-xl border border-slate-800 bg-gradient-to-b ${stat.color} flex flex-col gap-3 shadow-lg shadow-black/10 hover:border-slate-700 transition-all`}>
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold uppercase tracking-wider opacity-85">{stat.title}</span>
              <span className="text-xl">{stat.icon}</span>
            </div>
            <span className="text-3xl font-bold text-slate-100 tracking-tight">{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Productivity Chart Card */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col gap-6 shadow-xl">
          <div>
            <h3 className="font-semibold text-slate-200">Velocity & Productivity</h3>
            <p className="text-xs text-slate-400">Completed tasks count per week over the last 4 weeks</p>
          </div>

          <div className="flex-1 flex items-end justify-between h-64 px-4 pb-4 pt-8 bg-slate-950/40 border border-slate-800/60 rounded-xl relative">
            {/* Grid background lines */}
            <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none opacity-10">
              <div className="border-b border-slate-100 w-full"></div>
              <div className="border-b border-slate-100 w-full"></div>
              <div className="border-b border-slate-100 w-full"></div>
              <div className="w-full"></div>
            </div>

            {/* Custom Interactive CSS bar chart */}
            {dashboard?.productivity?.map((week, index) => {
              const heightPercentage = `${(week.completedCount / maxProductivity) * 100}%`;
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-3 group z-10">
                  <div className="relative w-12 flex justify-center">
                    {/* Tooltip on hover */}
                    <div className="absolute -top-10 scale-0 group-hover:scale-100 bg-blue-600 text-white font-semibold text-xs px-2 py-1 rounded transition-all shadow-lg z-20">
                      {week.completedCount} tasks
                    </div>
                    {/* Bar */}
                    <div
                      style={{ height: heightPercentage }}
                      className="w-8 rounded-t bg-gradient-to-t from-blue-600 to-indigo-500 group-hover:from-blue-500 group-hover:to-indigo-400 transition-all duration-500 shadow-lg shadow-blue-500/20 min-h-[4px]"
                    ></div>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">{week.weekLabel}</span>
                </div>
              );
            })}

            {(!dashboard?.productivity || dashboard.productivity.length === 0) && (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500 italic">
                No recent activity log logs to plot
              </div>
            )}
          </div>
        </div>

        {/* Quick Tips Box */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col gap-6 shadow-xl justify-between">
          <div className="flex flex-col gap-4">
            <h3 className="font-semibold text-slate-200">DevTrack Pro Help</h3>
            <div className="flex flex-col gap-3 text-xs text-slate-400 leading-relaxed">
              <div className="flex gap-2">
                <span className="text-blue-500 font-bold">1.</span>
                <span>Select or create an <strong>Organization</strong> inside the sidebar select boundaries to initialize permissions.</span>
              </div>
              <div className="flex gap-2">
                <span className="text-blue-500 font-bold">2.</span>
                <span>Configure a <strong>Workspace</strong> under your organization, representing teams or products.</span>
              </div>
              <div className="flex gap-2">
                <span className="text-blue-500 font-bold">3.</span>
                <span>Spin up active <strong>Projects</strong> to map backlogs, trigger sprints, and assign tasks.</span>
              </div>
            </div>
          </div>
          <div className="p-4 bg-blue-900/10 border border-blue-800/30 rounded-lg text-xs text-blue-400 flex items-start gap-2">
            <span className="mt-0.5">ℹ️</span>
            <span>Assigning tasks to members generates automatic alerts. Try adding due dates to track approaching sprint deadlines.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
