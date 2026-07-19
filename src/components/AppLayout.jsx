import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';

const AppLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Active boundaries
  const [selectedOrgId, setSelectedOrgId] = useState(() => {
    return localStorage.getItem('selectedOrgId') ? Number(localStorage.getItem('selectedOrgId')) : null;
  });
  const [selectedWsId, setSelectedWsId] = useState(() => {
    return localStorage.getItem('selectedWsId') ? Number(localStorage.getItem('selectedWsId')) : null;
  });

  useEffect(() => {
    if (selectedOrgId) {
      localStorage.setItem('selectedOrgId', selectedOrgId.toString());
    } else {
      localStorage.removeItem('selectedOrgId');
    }
  }, [selectedOrgId]);

  useEffect(() => {
    if (selectedWsId) {
      localStorage.setItem('selectedWsId', selectedWsId.toString());
    } else {
      localStorage.removeItem('selectedWsId');
    }
  }, [selectedWsId]);

  // Dropdowns state
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Modals state
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgSlug, setNewOrgSlug] = useState('');

  const [showWsModal, setShowWsModal] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [newWsSlug, setNewWsSlug] = useState('');
  const [newWsDesc, setNewWsDesc] = useState('');

  // Refs for closing dropdowns on click outside
  const userMenuRef = useRef();
  const notificationRef = useRef();
  const searchRef = useRef();

  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
      if (notificationRef.current && !notificationRef.current.contains(e.target)) setShowNotifications(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearchDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 1. Fetch Organizations
  const { data: orgs = [], refetch: refetchOrgs } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const res = await client.get('/api/organizations');
      return res.data;
    },
  });

  // Automatically select first organization if none is active
  useEffect(() => {
    if (orgs.length > 0 && !selectedOrgId) {
      setSelectedOrgId(orgs[0].id);
    }
  }, [orgs, selectedOrgId]);

  // 2. Fetch Workspaces of active Organization
  const { data: workspaces = [] } = useQuery({
    queryKey: ['workspaces', selectedOrgId],
    queryFn: async () => {
      const res = await client.get(`/api/organizations/${selectedOrgId}/workspaces`);
      return res.data;
    },
    enabled: !!selectedOrgId,
  });

  // Automatically select first workspace
  useEffect(() => {
    if (workspaces.length > 0) {
      // If old workspace is not in the list, reset or select first
      const exists = workspaces.some((w) => w.id === selectedWsId);
      if (!exists) {
        setSelectedWsId(workspaces[0].id);
      }
    } else {
      setSelectedWsId(null);
    }
  }, [workspaces, selectedOrgId]);

  // 3. Fetch Projects of active Workspace
  const { data: projects = [] } = useQuery({
    queryKey: ['projects', selectedWsId],
    queryFn: async () => {
      const res = await client.get(`/api/workspaces/${selectedWsId}/projects`);
      return res.data;
    },
    enabled: !!selectedWsId,
  });

  // 4. Fetch Notifications (Page 0, Size 20)
  const { data: notificationsPage, refetch: refetchNotifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await client.get('/api/notifications?page=0&size=20');
      return res.data;
    },
    refetchInterval: 30000, // Poll every 30 seconds
  });

  const notificationsList = notificationsPage?.content || [];
  const unreadCount = notificationsList.filter((n) => !n.isRead).length;

  // 5. Fetch Global Search Results
  const { data: searchResults, isFetching: isSearching } = useQuery({
    queryKey: ['globalSearch', debouncedQuery],
    queryFn: async () => {
      const res = await client.get(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
      return res.data;
    },
    enabled: debouncedQuery.trim().length > 1,
  });

  // Mutations
  const createOrgMutation = useMutation({
    mutationFn: async (payload) => {
      return client.post('/api/organizations', payload);
    },
    onSuccess: (res) => {
      refetchOrgs();
      setSelectedOrgId(res.data.id);
      setShowOrgModal(false);
      setNewOrgName('');
      setNewOrgSlug('');
    },
  });

  const createWsMutation = useMutation({
    mutationFn: async (payload) => {
      return client.post(`/api/organizations/${selectedOrgId}/workspaces`, payload);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries(['workspaces', selectedOrgId]);
      setSelectedWsId(res.data.id);
      setShowWsModal(false);
      setNewWsName('');
      setNewWsSlug('');
      setNewWsDesc('');
    },
  });

  const markNotificationReadMutation = useMutation({
    mutationFn: async (id) => {
      return client.patch(`/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      refetchNotifications();
    },
  });

  const markAllNotificationsReadMutation = useMutation({
    mutationFn: async () => {
      return client.patch('/api/notifications/read-all');
    },
    onSuccess: () => {
      refetchNotifications();
    },
  });

  const handleCreateOrg = (e) => {
    e.preventDefault();
    createOrgMutation.mutate({ name: newOrgName, slug: newOrgSlug });
  };

  const handleCreateWs = (e) => {
    e.preventDefault();
    createWsMutation.mutate({ name: newWsName, slug: newWsSlug, description: newWsDesc });
  };

  const handleOrgChange = (e) => {
    const orgId = Number(e.target.value);
    setSelectedOrgId(orgId);
    setSelectedWsId(null);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full z-20">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800 shrink-0">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-blue-500/25">
              D
            </div>
            <span className="font-semibold text-lg text-slate-100 tracking-tight">DevTrack Pro</span>
          </Link>
        </div>

        {/* Boundary Selectors */}
        <div className="p-4 flex flex-col gap-3 border-b border-slate-800 shrink-0">
          {/* Organization Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Organization</label>
            <div className="flex gap-2 items-center">
              <select
                value={selectedOrgId || ''}
                onChange={handleOrgChange}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="" disabled>Select Organization</option>
                {orgs.map((org) => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
              <button
                onClick={() => setShowOrgModal(true)}
                className="w-8 h-8 rounded-lg border border-slate-800 flex items-center justify-center bg-slate-950 text-slate-400 hover:text-slate-200 hover:border-slate-700 cursor-pointer"
                title="Create Organization"
              >
                +
              </button>
            </div>
          </div>

          {/* Workspace Select */}
          {selectedOrgId && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Workspace</label>
              <div className="flex gap-2 items-center">
                <select
                  value={selectedWsId || ''}
                  onChange={(e) => setSelectedWsId(Number(e.target.value))}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="" disabled>Select Workspace</option>
                  {workspaces.map((ws) => (
                    <option key={ws.id} value={ws.id}>{ws.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => setShowWsModal(true)}
                  className="w-8 h-8 rounded-lg border border-slate-800 flex items-center justify-center bg-slate-950 text-slate-400 hover:text-slate-200 hover:border-slate-700 cursor-pointer"
                  title="Create Workspace"
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Project Lists and Nav Links */}
        <nav className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
          {/* Main Links */}
          <div className="flex flex-col gap-1">
            <Link
              to="/"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                location.pathname === '/'
                  ? 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-500 font-medium'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              Dashboard
            </Link>

            {selectedOrgId && (
              <Link
                to={`/organizations/${selectedOrgId}`}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                  location.pathname === `/organizations/${selectedOrgId}`
                    ? 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-500 font-medium'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                Members & Invites
              </Link>
            )}
          </div>

          {/* Active Workspace Projects */}
          {selectedWsId && (
            <div>
              <div className="flex justify-between items-center px-3 mb-2 shrink-0">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Projects</span>
                <Link to={`/workspaces/${selectedWsId}/create-project`} className="text-slate-500 hover:text-slate-200 text-sm font-bold">
                  +
                </Link>
              </div>
              <div className="flex flex-col gap-1">
                {projects.map((proj) => (
                  <Link
                    key={proj.id}
                    to={`/projects/${proj.id}`}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${
                      location.pathname.startsWith(`/projects/${proj.id}`)
                        ? 'bg-slate-800 text-slate-100 font-medium border-r-2 border-blue-500'
                        : 'text-slate-400 hover:bg-slate-800/30 hover:text-slate-200'
                    }`}
                  >
                    <span>{proj.name}</span>
                    <span className="text-[10px] bg-slate-950 text-slate-500 px-1.5 py-0.5 rounded uppercase font-bold tracking-wide">
                      {proj.keyPrefix}
                    </span>
                  </Link>
                ))}
                {projects.length === 0 && (
                  <div className="text-xs text-slate-600 italic px-3 py-1">No active projects</div>
                )}
              </div>
            </div>
          )}
        </nav>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* TOPBAR */}
        <header className="h-16 bg-slate-900 border-b border-slate-800 px-8 flex items-center justify-between shrink-0 z-10">
          {/* Global Search Bar */}
          <div className="w-96 relative" ref={searchRef}>
            <div className="relative">
              <input
                type="text"
                placeholder="Search projects, tasks, users..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchDropdown(true);
                }}
                onFocus={() => setShowSearchDropdown(true)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              />
              <span className="absolute left-3.5 top-2.5 text-slate-500 text-xs">🔍</span>
            </div>

            {/* Global Search Results Dropdown */}
            {showSearchDropdown && (searchQuery.trim().length > 1 || isSearching) && (
              <div className="absolute top-12 left-0 right-0 max-h-96 overflow-y-auto bg-slate-900 border border-slate-800 rounded-lg shadow-xl p-2 flex flex-col gap-3 z-50">
                {isSearching ? (
                  <div className="text-xs text-slate-500 p-2 text-center">Searching...</div>
                ) : (
                  <>
                    {/* Projects */}
                    {searchResults?.projects?.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 mb-1">Projects</div>
                        {searchResults.projects.map((p) => (
                          <Link
                            key={p.id}
                            to={`/projects/${p.id}`}
                            onClick={() => setShowSearchDropdown(false)}
                            className="block px-2 py-1.5 rounded hover:bg-slate-800 text-xs text-slate-200"
                          >
                            {p.name} <span className="text-slate-500 text-[10px]">({p.keyPrefix})</span>
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Tasks */}
                    {searchResults?.tasks?.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 mb-1">Tasks</div>
                        {searchResults.tasks.map((t) => (
                          <Link
                            key={t.id}
                            to={`/projects/${t.projectId}?taskId=${t.id}`}
                            onClick={() => setShowSearchDropdown(false)}
                            className="block px-2 py-1.5 rounded hover:bg-slate-800 text-xs text-slate-200"
                          >
                            <span className="text-blue-400 mr-1">[{t.taskKey}]</span> {t.title}
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Users */}
                    {searchResults?.users?.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 mb-1">Users</div>
                        {searchResults.users.map((u) => (
                          <div key={u.id} className="flex items-center gap-2 px-2 py-1.5 text-xs text-slate-300">
                            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[10px] text-white">
                              {u.firstName[0]}
                            </div>
                            <span>{u.firstName} {u.lastName} ({u.username})</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Labels */}
                    {searchResults?.labels?.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 mb-1">Labels</div>
                        <div className="flex flex-wrap gap-1 px-2 py-1">
                          {searchResults.labels.map((l) => (
                            <span key={l.id} className="text-[10px] px-2 py-0.5 rounded-full border border-blue-500/50 text-blue-400 bg-blue-500/10">
                              {l.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Empty State */}
                    {(!searchResults?.projects?.length && 
                      !searchResults?.tasks?.length && 
                      !searchResults?.users?.length && 
                      !searchResults?.labels?.length) && (
                      <div className="text-xs text-slate-500 p-2 text-center">No results found</div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right Section: Notifications and User Profile */}
          <div className="flex items-center gap-4">
            {/* Notifications Dropdown */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-10 h-10 rounded-lg border border-slate-800 flex items-center justify-center bg-slate-950 text-slate-400 hover:text-slate-200 hover:border-slate-700 cursor-pointer relative"
              >
                <span>🔔</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white font-semibold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-12 w-80 bg-slate-900 border border-slate-800 rounded-lg shadow-xl p-3 flex flex-col gap-2 z-50">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-1 shrink-0">
                    <span className="font-semibold text-sm text-slate-200">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => markAllNotificationsReadMutation.mutate()}
                        className="text-xs text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto flex flex-col gap-2">
                    {notificationsList.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-2 rounded-lg text-xs flex justify-between gap-2 border transition-all ${
                          notif.isRead
                            ? 'bg-slate-900 border-slate-800/40 text-slate-400'
                            : 'bg-blue-600/5 border-blue-500/20 text-slate-200'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="font-semibold">{notif.title}</div>
                          <div>{notif.message}</div>
                        </div>
                        {!notif.isRead && (
                          <button
                            onClick={() => markNotificationReadMutation.mutate(notif.id)}
                            className="text-[10px] text-blue-400 hover:underline cursor-pointer align-top self-start"
                          >
                            Read
                          </button>
                        )}
                      </div>
                    ))}
                    {notificationsList.length === 0 && (
                      <div className="text-xs text-slate-500 text-center py-4">No notifications</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Avatar & Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg cursor-pointer border border-blue-500/50"
              >
                {user?.username?.substring(0, 2).toUpperCase()}
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-12 w-48 bg-slate-900 border border-slate-800 rounded-lg shadow-xl p-1.5 flex flex-col gap-1 z-50">
                  <div className="px-3 py-2 border-b border-slate-800/60 shrink-0">
                    <div className="font-semibold text-xs text-slate-400">Signed in as</div>
                    <div className="font-medium text-sm text-slate-200 truncate">{user?.email}</div>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setShowUserMenu(false)}
                    className="px-3 py-2 rounded hover:bg-slate-800 text-sm text-slate-300 transition-colors"
                  >
                    My Profile
                  </Link>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-2 rounded hover:bg-red-500/10 hover:text-red-400 text-sm text-slate-300 transition-colors cursor-pointer"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* VIEW AREA */}
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet context={{ selectedOrgId, selectedWsId, projects }} />
        </main>
      </div>

      {/* CREATE ORG MODAL */}
      {showOrgModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-96 max-w-full">
            <h3 className="font-bold text-lg text-slate-100 mb-4">Create Organization</h3>
            <form onSubmit={handleCreateOrg} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Organization Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corp"
                  value={newOrgName}
                  onChange={(e) => {
                    setNewOrgName(e.target.value);
                    setNewOrgSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
                  }}
                  className="glass-input"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">URL Slug</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. acme-corp"
                  value={newOrgSlug}
                  onChange={(e) => setNewOrgSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  className="glass-input"
                />
              </div>
              <div className="flex justify-end gap-3 mt-2">
                <button type="button" onClick={() => setShowOrgModal(false)} className="glass-btn-secondary">Cancel</button>
                <button type="submit" disabled={createOrgMutation.isPending} className="glass-btn-primary">
                  {createOrgMutation.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE WORKSPACE MODAL */}
      {showWsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-96 max-w-full">
            <h3 className="font-bold text-lg text-slate-100 mb-4">Create Workspace</h3>
            <form onSubmit={handleCreateWs} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Workspace Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Development"
                  value={newWsName}
                  onChange={(e) => {
                    setNewWsName(e.target.value);
                    setNewWsSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
                  }}
                  className="glass-input"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">URL Slug</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. development"
                  value={newWsSlug}
                  onChange={(e) => setNewWsSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  className="glass-input"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Description</label>
                <textarea
                  placeholder="Workspace details..."
                  value={newWsDesc}
                  onChange={(e) => setNewWsDesc(e.target.value)}
                  className="glass-input h-20 resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 mt-2">
                <button type="button" onClick={() => setShowWsModal(false)} className="glass-btn-secondary">Cancel</button>
                <button type="submit" disabled={createWsMutation.isPending} className="glass-btn-primary">
                  {createWsMutation.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppLayout;
