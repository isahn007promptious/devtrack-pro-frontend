import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const ProjectDetail = () => {
  const { id: projectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  // Active Sprint selection state
  const [selectedSprintId, setSelectedSprintId] = useState(null);

  // Modals state
  const [showSprintModal, setShowSprintModal] = useState(false);
  const [newSprintName, setNewSprintName] = useState('');
  const [newSprintGoal, setNewSprintGoal] = useState('');
  const [newSprintStart, setNewSprintStart] = useState('');
  const [newSprintEnd, setNewSprintEnd] = useState('');

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskDue, setTaskDue] = useState('');
  const [taskSP, setTaskSP] = useState(1);
  const [taskHours, setTaskHours] = useState(1);
  const [taskPriority, setTaskPriority] = useState('MEDIUM');
  const [taskType, setTaskType] = useState('TASK');
  const [taskStatus, setTaskStatus] = useState('TODO');
  const [taskLabelsInput, setTaskLabelsInput] = useState('');

  // Comment Thread state
  const [commentContent, setCommentContent] = useState('');
  const [replyingToCommentId, setReplyingToCommentId] = useState(null);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);

  // 1. Fetch Project Details
  const { data: project, isLoading: loadingProject } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const res = await client.get(`/api/projects/${projectId}`);
      return res.data;
    },
  });

  // 2. Fetch Project Sprints
  const { data: sprints = [], refetch: refetchSprints } = useQuery({
    queryKey: ['sprints', projectId],
    queryFn: async () => {
      const res = await client.get(`/api/projects/${projectId}/sprints`);
      return res.data;
    },
  });

  // Automatically select first/active sprint
  useEffect(() => {
    if (sprints.length > 0 && !selectedSprintId) {
      // Prefer active sprint, else first planned
      const active = sprints.find((s) => s.status === 'ACTIVE') || sprints[0];
      setSelectedSprintId(active.id);
    }
  }, [sprints, selectedSprintId]);

  // 3. Fetch Kanban Board
  const { data: board, refetch: refetchBoard } = useQuery({
    queryKey: ['board', projectId],
    queryFn: async () => {
      const res = await client.get(`/api/projects/${projectId}/board`);
      return res.data;
    },
  });

  // 4. Fetch Project Activity (Page 0, Size 30)
  const { data: activityPage, refetch: refetchActivity } = useQuery({
    queryKey: ['activity', projectId],
    queryFn: async () => {
      const res = await client.get(`/api/projects/${projectId}/activity?page=0&size=30`);
      return res.data;
    },
  });
  const activities = activityPage?.content || [];

  // 5. Fetch Single Task Detail
  const { data: taskDetail, refetch: refetchTaskDetail } = useQuery({
    queryKey: ['taskDetail', selectedTaskId],
    queryFn: async () => {
      const res = await client.get(`/api/tasks/${selectedTaskId}`);
      return res.data;
    },
    enabled: !!selectedTaskId,
  });

  // 6. Fetch Task Comments
  const { data: comments = [], refetch: refetchComments } = useQuery({
    queryKey: ['comments', selectedTaskId],
    queryFn: async () => {
      const res = await client.get(`/api/tasks/${selectedTaskId}/comments`);
      return res.data;
    },
    enabled: !!selectedTaskId,
  });

  // Handle URL query parameters for direct modal deep links
  useEffect(() => {
    const taskIdParam = searchParams.get('taskId');
    if (taskIdParam) {
      setSelectedTaskId(Number(taskIdParam));
      setShowTaskModal(true);
    }
  }, [searchParams]);

  // Mutations
  const createSprintMutation = useMutation({
    mutationFn: async (payload) => {
      return client.post(`/api/projects/${projectId}/sprints`, payload);
    },
    onSuccess: (res) => {
      refetchSprints();
      setSelectedSprintId(res.data.id);
      setShowSprintModal(false);
      setNewSprintName('');
      setNewSprintGoal('');
      setNewSprintStart('');
      setNewSprintEnd('');
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (payload) => {
      return client.post(`/api/sprints/${selectedSprintId}/tasks`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['board', projectId]);
      refetchBoard();
      refetchActivity();
      setShowCreateTaskModal(false);
      setTaskTitle('');
      setTaskDesc('');
      setTaskAssignee('');
      setTaskDue('');
      setTaskSP(1);
      setTaskHours(1);
      setTaskPriority('MEDIUM');
      setTaskType('TASK');
      setTaskStatus('TODO');
      setTaskLabelsInput('');
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      return client.put(`/api/tasks/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['board', projectId]);
      refetchBoard();
      refetchTaskDetail();
      refetchActivity();
    },
  });

  const patchStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      return client.patch(`/api/tasks/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['board', projectId]);
      refetchBoard();
      refetchActivity();
      if (selectedTaskId) refetchTaskDetail();
    },
  });

  const patchAssigneeMutation = useMutation({
    mutationFn: async ({ id, assigneeId }) => {
      return client.patch(`/api/tasks/${id}/assign`, { assigneeId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['board', projectId]);
      refetchBoard();
      refetchActivity();
      if (selectedTaskId) refetchTaskDetail();
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async (payload) => {
      return client.post(`/api/tasks/${selectedTaskId}/comments`, payload);
    },
    onSuccess: () => {
      setCommentContent('');
      setReplyingToCommentId(null);
      refetchComments();
    },
  });

  const archiveProjectMutation = useMutation({
    mutationFn: async () => {
      return client.post(`/api/projects/${projectId}/archive`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['project', projectId]);
    },
  });

  const restoreProjectMutation = useMutation({
    mutationFn: async () => {
      return client.post(`/api/projects/${projectId}/restore`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['project', projectId]);
    },
  });

  // HTML5 Drag & Drop handlers
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId.toString());
  };

  const handleDrop = (e, columnStatus) => {
    e.preventDefault();
    const taskId = Number(e.dataTransfer.getData('text/plain'));
    patchStatusMutation.mutate({ id: taskId, status: columnStatus });
  };

  // Create new sprint helper
  const handleCreateSprint = (e) => {
    e.preventDefault();
    createSprintMutation.mutate({
      name: newSprintName,
      goal: newSprintGoal,
      startDate: newSprintStart || null,
      endDate: newSprintEnd || null,
      status: 'PLANNED',
    });
  };

  // Create new task helper
  const handleCreateTask = (e) => {
    e.preventDefault();
    const labels = taskLabelsInput
      .split(',')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    createTaskMutation.mutate({
      title: taskTitle,
      description: taskDesc,
      assigneeId: taskAssignee ? Number(taskAssignee) : null,
      dueDate: taskDue || null,
      storyPoints: taskSP,
      estimatedHours: taskHours,
      priority: taskPriority,
      type: taskType,
      status: taskStatus,
      labels,
    });
  };

  // Add comment helper
  const handlePostComment = (e) => {
    e.preventDefault();
    if (!commentContent.trim()) return;
    addCommentMutation.mutate({
      content: commentContent,
      parentCommentId: replyingToCommentId,
    });
  };

  // Mention parsing & typing autocomplete logic
  const handleCommentChange = (e) => {
    const text = e.target.value;
    const pos = e.target.selectionStart;
    setCommentContent(text);
    setCursorPosition(pos);

    // Look back to see if typing @mention
    const textBeforeCursor = text.substring(0, pos);
    const atIndex = textBeforeCursor.lastIndexOf('@');
    if (atIndex !== -1 && atIndex >= textBeforeCursor.lastIndexOf(' ')) {
      const query = textBeforeCursor.substring(atIndex + 1);
      setMentionQuery(query);
      setShowMentionSuggestions(true);
    } else {
      setShowMentionSuggestions(false);
    }
  };

  const handleSelectMention = (username) => {
    const text = commentContent;
    const pos = cursorPosition;
    const textBeforeCursor = text.substring(0, pos);
    const atIndex = textBeforeCursor.lastIndexOf('@');

    const updatedText =
      text.substring(0, atIndex) + `@${username} ` + text.substring(pos);

    setCommentContent(updatedText);
    setShowMentionSuggestions(false);
  };

  // Render comments recursively
  const renderCommentNode = (c) => {
    return (
      <div key={c.id} className="pl-4 border-l border-slate-800/80 flex flex-col gap-2 mt-3 relative">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white uppercase text-[8px]">
              {c.author.username.substring(0, 2)}
            </div>
            <span className="text-xs font-semibold text-slate-300">
              {c.author.firstName} {c.author.lastName}
            </span>
            <span className="text-[10px] text-slate-500">
              {new Date(c.createdAt).toLocaleDateString()}
            </span>
          </div>
          <button
            onClick={() => setReplyingToCommentId(c.id)}
            className="text-[10px] text-blue-400 hover:underline cursor-pointer"
          >
            Reply
          </button>
        </div>
        <p className="text-xs text-slate-400 font-sans leading-relaxed whitespace-pre-wrap">
          {c.content}
        </p>

        {/* Child comments/replies recursively rendered */}
        {c.replies?.map((child) => renderCommentNode(child))}
      </div>
    );
  };

  if (loadingProject) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <div className="w-8 h-8 rounded-full border-4 border-slate-700 border-t-blue-500 animate-spin"></div>
        <p className="text-slate-400 text-sm">Loading project board...</p>
      </div>
    );
  }

  const projectMembersList = project?.members || [];

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-8.5rem)] overflow-hidden">
      {/* LEFT AREA: PROJECT METADATA & SPRINTS PANEL */}
      <aside className="w-full lg:w-80 flex flex-col gap-6 overflow-y-auto shrink-0 pr-2">
        {/* Project Meta Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col gap-4 shadow-xl">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="font-bold text-lg text-slate-100">{project?.name}</h2>
              <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">{project?.keyPrefix} Project</span>
            </div>
            {project?.isArchived ? (
              <button
                onClick={() => restoreProjectMutation.mutate()}
                className="text-[10px] px-2.5 py-0.5 rounded-full border border-green-500/20 text-green-400 bg-green-500/10 cursor-pointer"
              >
                Restore
              </button>
            ) : (
              <button
                onClick={() => archiveProjectMutation.mutate()}
                className="text-[10px] px-2.5 py-0.5 rounded-full border border-red-500/20 text-red-400 bg-red-500/10 cursor-pointer"
              >
                Archive
              </button>
            )}
          </div>

          <p className="text-xs text-slate-400 font-sans leading-relaxed">{project?.description || 'No description provided.'}</p>

          {/* Progress Bar */}
          <div className="flex flex-col gap-1.5 mt-2">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-slate-500 uppercase tracking-wider">Progress</span>
              <span className="text-slate-300">{Math.round(project?.progress || 0)}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
              <div
                style={{ width: `${project?.progress || 0}%` }}
                className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 shadow-md shadow-blue-500/20 transition-all duration-500"
              ></div>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs border-t border-slate-800/80 pt-3 mt-1">
            <span className="text-slate-500">Deadline:</span>
            <span className="font-semibold text-slate-300">{project?.deadline}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">Priority:</span>
            <span className="px-2 py-0.5 rounded border border-indigo-500/20 text-indigo-400 bg-indigo-500/10 font-bold uppercase tracking-wider text-[9px]">
              {project?.priority}
            </span>
          </div>
        </div>

        {/* Sprints Panel */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col gap-4 shadow-xl">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-slate-200">Sprints</h3>
            <button
              onClick={() => setShowSprintModal(true)}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
            >
              + Create Sprint
            </button>
          </div>

          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
            {sprints.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSprintId(s.id)}
                className={`w-full text-left p-3 rounded-lg text-xs flex justify-between items-center border transition-all cursor-pointer ${
                  selectedSprintId === s.id
                    ? 'bg-blue-600/10 border-blue-500/30 text-blue-400 font-medium'
                    : 'bg-slate-950/20 border-slate-800/40 text-slate-400 hover:border-slate-800'
                }`}
              >
                <span>{s.name}</span>
                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-950 font-bold tracking-wide">
                  {s.status}
                </span>
              </button>
            ))}
            {sprints.length === 0 && (
              <div className="text-xs text-slate-600 italic py-2">No sprints mapped. Create one above to spin up tasks.</div>
            )}
          </div>
        </div>

        {/* Project Roster Members */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col gap-4 shadow-xl">
          <h3 className="font-semibold text-slate-200">Project Members</h3>
          <div className="flex flex-col gap-3">
            {projectMembersList.map((m) => (
              <div key={m.id} className="flex items-center gap-2 text-xs">
                <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white text-[9px] uppercase">
                  {m.firstName[0]}{m.lastName[0]}
                </div>
                <div>
                  <div className="font-medium text-slate-300">{m.firstName} {m.lastName}</div>
                  <div className="text-[9px] text-slate-500">@{m.username}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* CENTER AREA: KANBAN BOARD & ACTIVITY FEED */}
      <section className="flex-1 flex flex-col gap-6 h-full overflow-hidden">
        {/* Sprint Header / Task Trigger */}
        <div className="flex justify-between items-center bg-slate-900/20 border border-slate-800 rounded-xl px-6 py-4 shrink-0 shadow-lg">
          <div>
            <h3 className="font-semibold text-slate-200">
              {sprints.find((s) => s.id === selectedSprintId)?.name || 'Backlog Board'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {sprints.find((s) => s.id === selectedSprintId)?.goal || 'No goal set for this sprint.'}
            </p>
          </div>
          {selectedSprintId && (
            <button
              onClick={() => setShowCreateTaskModal(true)}
              className="glass-btn-primary py-1.5 px-4 text-xs font-semibold cursor-pointer"
            >
              + Add Task
            </button>
          )}
        </div>

        {/* Kanban Columns */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 overflow-x-auto min-h-0 pb-2">
          {['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'].map((col) => {
            // Filter tasks for this lane. Grouping tasks mapped from project board.
            // In our Tasks controller, board returns lanes: {todo: [...], inProgress: [...], review: [...], done: [...]}
            // Let's filter client-side matching the selected Sprint ID, or pull from board lanes.
            // If selectedSprintId is active, let's filter:
            const list = board ? board[col.toLowerCase().replace(/_([a-z])/g, (g) => g[1].toUpperCase())] || [] : [];
            const filteredList = list.filter((t) => t.sprintId === selectedSprintId);

            return (
              <div
                key={col}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, col)}
                className="flex flex-col bg-slate-950/40 border border-slate-800/80 rounded-xl overflow-hidden shadow-inner h-full min-w-56"
              >
                {/* Column Title */}
                <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex justify-between items-center shrink-0">
                  <span className="font-bold text-xs text-slate-400 uppercase tracking-wider">
                    {col.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] bg-slate-950 px-2 py-0.5 rounded-full font-bold text-slate-500">
                    {filteredList.length}
                  </span>
                </div>

                {/* Card Container */}
                <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
                  {filteredList.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onClick={() => {
                        setSelectedTaskId(task.id);
                        setShowTaskModal(true);
                      }}
                      className="p-4 rounded-lg bg-slate-900/60 border border-slate-800/85 hover:border-slate-700 cursor-pointer shadow-lg hover:shadow-black/25 active:scale-95 transition-all flex flex-col gap-3 relative"
                    >
                      {/* Card Type Tag */}
                      <div className="flex justify-between items-center text-[9px] uppercase font-bold tracking-wider">
                        <span className="text-slate-500 font-mono">{task.taskKey}</span>
                        <span className={`px-1.5 py-0.2 rounded border ${
                          task.type === 'BUG'
                            ? 'border-red-500/20 text-red-400 bg-red-500/10'
                            : 'border-blue-500/20 text-blue-400 bg-blue-500/10'
                        }`}>
                          {task.type}
                        </span>
                      </div>

                      {/* Card Title */}
                      <h4 className="font-medium text-xs text-slate-200 line-clamp-2 leading-relaxed">
                        {task.title}
                      </h4>

                      {/* Card Meta */}
                      <div className="flex justify-between items-center border-t border-slate-800/80 pt-3 mt-1 text-[10px]">
                        {/* Assignee initials badge */}
                        {task.assignee ? (
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-[8px] uppercase">
                              {task.assignee.firstName[0]}{task.assignee.lastName[0]}
                            </div>
                            <span className="text-[9px] truncate max-w-16">{task.assignee.firstName}</span>
                          </div>
                        ) : (
                          <span className="text-slate-600 italic">Unassigned</span>
                        )}

                        <div className="flex items-center gap-2 text-slate-500">
                          {task.storyPoints && (
                            <span className="bg-slate-950 px-1.5 py-0.5 rounded text-[8px] font-bold">
                              {task.storyPoints} SP
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredList.length === 0 && (
                    <div className="text-[10px] text-slate-600 italic text-center py-8">Drop tasks here</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* BOTTOM SECTION: PROJECT ACTIVITY FEED */}
        <div className="h-44 border border-slate-850 rounded-xl bg-slate-900/20 p-4 shadow-lg flex flex-col gap-3 shrink-0">
          <div className="flex justify-between items-center border-b border-slate-800/80 pb-2 shrink-0">
            <h4 className="font-semibold text-xs text-slate-300 uppercase tracking-wider">Project Activity</h4>
            <button onClick={() => refetchActivity()} className="text-[10px] text-blue-400 hover:underline">
              Refresh
            </button>
          </div>
          <div className="flex-1 overflow-y-auto flex flex-col gap-2.5">
            {activities.map((act) => (
              <div key={act.id} className="text-[11px] flex justify-between gap-4 text-slate-400 leading-normal border-b border-slate-850/40 pb-1.5 last:border-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-300">👤 {act.userFullname}:</span>
                  <span>{act.details}</span>
                </div>
                <span className="text-slate-600 shrink-0">
                  {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            {activities.length === 0 && (
              <div className="text-xs text-slate-600 italic py-2">No activity logs recorded.</div>
            )}
          </div>
        </div>
      </section>

      {/* TASK DETAILS MODAL */}
      {showTaskModal && taskDetail && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-[48rem] max-w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-950/60 border-b border-slate-800 flex justify-between items-center shrink-0">
              <div>
                <span className="text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase">
                  {taskDetail.taskKey} Detail Modal
                </span>
                <h3 className="font-bold text-md text-slate-200">{taskDetail.title}</h3>
              </div>
              <button
                onClick={() => {
                  setShowTaskModal(false);
                  setSelectedTaskId(null);
                  setSearchParams({}); // Clear query parameters
                }}
                className="text-slate-500 hover:text-slate-300 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body Scroll */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6">
              {/* Left pane: Description & Threaded Comments */}
              <div className="flex-3 flex flex-col gap-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</h4>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-wrap p-4 bg-slate-950/30 border border-slate-800/80 rounded-xl min-h-[4rem]">
                    {taskDetail.description || 'No description provided.'}
                  </p>
                </div>

                {/* Commenting section */}
                <div className="flex flex-col gap-4 border-t border-slate-850 pt-5">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Comments Thread</h4>

                  {/* Form */}
                  <form onSubmit={handlePostComment} className="flex flex-col gap-3 relative">
                    {replyingToCommentId && (
                      <div className="text-[10px] bg-blue-600/10 border border-blue-500/25 text-blue-400 px-3 py-1 rounded-lg flex justify-between items-center">
                        <span>Replying to comment #{replyingToCommentId}</span>
                        <button type="button" onClick={() => setReplyingToCommentId(null)} className="text-slate-500 hover:text-slate-200">
                          Clear
                        </button>
                      </div>
                    )}

                    <div className="relative">
                      <textarea
                        required
                        rows={2}
                        placeholder="Add a comment... (Type @ to mention team members)"
                        value={commentContent}
                        onChange={handleCommentChange}
                        className="glass-input resize-none text-xs"
                      />

                      {/* Mentions Suggestion box */}
                      {showMentionSuggestions && (
                        <div className="absolute left-0 right-0 bottom-full bg-slate-950 border border-slate-800 rounded-lg shadow-xl max-h-32 overflow-y-auto z-50 p-1 flex flex-col gap-0.5">
                          {projectMembersList
                            .filter((m) =>
                              m.username.toLowerCase().includes(mentionQuery.toLowerCase())
                            )
                            .map((m) => (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => handleSelectMention(m.username)}
                                className="w-full text-left px-2 py-1 text-[11px] text-slate-300 hover:bg-blue-600 rounded"
                              >
                                {m.firstName} {m.lastName} (@{m.username})
                              </button>
                            ))}
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={addCommentMutation.isPending}
                      className="glass-btn-primary py-1 px-4 self-end text-xs cursor-pointer"
                    >
                      {addCommentMutation.isPending ? 'Posting...' : 'Post Comment'}
                    </button>
                  </form>

                  {/* Comments List */}
                  <div className="flex flex-col gap-3">
                    {comments.map((rootComment) => renderCommentNode(rootComment))}
                    {comments.length === 0 && (
                      <div className="text-xs text-slate-600 italic py-4 text-center">No comments yet.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right pane: Metadata edit/view controls */}
              <div className="flex-2 rounded-xl border border-slate-800/80 bg-slate-950/20 p-5 flex flex-col gap-4 self-start">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Properties</h4>

                {/* Assignee */}
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Assignee</label>
                  <select
                    value={taskDetail.assignee?.id || ''}
                    onChange={(e) =>
                      patchAssigneeMutation.mutate({
                        id: taskDetail.id,
                        assigneeId: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className="glass-input text-xs"
                  >
                    <option value="">Unassigned</option>
                    {projectMembersList.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.firstName} {m.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Status</label>
                  <select
                    value={taskDetail.status}
                    onChange={(e) =>
                      patchStatusMutation.mutate({ id: taskDetail.id, status: e.target.value })
                    }
                    className="glass-input text-xs"
                  >
                    <option value="TODO">Todo</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="REVIEW">Review</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>

                {/* Estimation and Story points */}
                <div className="flex gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1">Story Points</label>
                    <input
                      type="number"
                      value={taskDetail.storyPoints || ''}
                      onChange={(e) =>
                        updateTaskMutation.mutate({
                          id: taskDetail.id,
                          payload: {
                            ...taskDetail,
                            assigneeId: taskDetail.assignee?.id,
                            storyPoints: Number(e.target.value),
                            labels: taskDetail.labels.map((l) => l.name),
                          },
                        })
                      }
                      className="glass-input text-xs w-20"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1">Hours Est.</label>
                    <input
                      type="number"
                      value={taskDetail.estimatedHours || ''}
                      onChange={(e) =>
                        updateTaskMutation.mutate({
                          id: taskDetail.id,
                          payload: {
                            ...taskDetail,
                            assigneeId: taskDetail.assignee?.id,
                            estimatedHours: Number(e.target.value),
                            labels: taskDetail.labels.map((l) => l.name),
                          },
                        })
                      }
                      className="glass-input text-xs w-20"
                    />
                  </div>
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={taskDetail.dueDate || ''}
                    onChange={(e) =>
                      updateTaskMutation.mutate({
                        id: taskDetail.id,
                        payload: {
                          ...taskDetail,
                          assigneeId: taskDetail.assignee?.id,
                          dueDate: e.target.value,
                          labels: taskDetail.labels.map((l) => l.name),
                        },
                      })
                    }
                    className="glass-input text-xs"
                  />
                </div>

                {/* Labels Display */}
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-2">Labels</label>
                  <div className="flex flex-wrap gap-1">
                    {taskDetail.labels.map((l) => (
                      <span key={l.id} className="text-[9px] px-2 py-0.5 rounded-full border border-blue-500/20 text-blue-450 bg-blue-500/10">
                        {l.name}
                      </span>
                    ))}
                    {taskDetail.labels.length === 0 && <span className="text-[10px] text-slate-600 italic">No labels</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE SPRINT MODAL */}
      {showSprintModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-96 max-w-full">
            <h3 className="font-bold text-lg text-slate-100 mb-4">Create Sprint</h3>
            <form onSubmit={handleCreateSprint} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Sprint Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sprint 1 - Core Setup"
                  value={newSprintName}
                  onChange={(e) => setNewSprintName(e.target.value)}
                  className="glass-input"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Sprint Goal</label>
                <input
                  type="text"
                  placeholder="Goal details..."
                  value={newSprintGoal}
                  onChange={(e) => setNewSprintGoal(e.target.value)}
                  className="glass-input"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newSprintStart}
                    onChange={(e) => setNewSprintStart(e.target.value)}
                    className="glass-input text-xs"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-400 mb-1">End Date</label>
                  <input
                    type="date"
                    value={newSprintEnd}
                    onChange={(e) => setNewSprintEnd(e.target.value)}
                    className="glass-input text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-2">
                <button type="button" onClick={() => setShowSprintModal(false)} className="glass-btn-secondary">Cancel</button>
                <button type="submit" disabled={createSprintMutation.isPending} className="glass-btn-primary">
                  {createSprintMutation.isPending ? 'Creating...' : 'Create Sprint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE TASK MODAL */}
      {showCreateTaskModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-[36rem] max-w-full max-h-[85vh] overflow-y-auto">
            <h3 className="font-bold text-lg text-slate-100 mb-4">Create New Task</h3>
            <form onSubmit={handleCreateTask} className="flex flex-col gap-4">
              <div className="flex gap-4">
                <div className="flex-2">
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Task Title</label>
                  <input
                    type="text"
                    required
                    placeholder="Provide a short description..."
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="glass-input"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Type</label>
                  <select
                    value={taskType}
                    onChange={(e) => setTaskType(e.target.value)}
                    className="glass-input"
                  >
                    <option value="STORY">Story</option>
                    <option value="TASK">Task</option>
                    <option value="BUG">Bug</option>
                    <option value="EPIC">Epic</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Description</label>
                <textarea
                  placeholder="Task details..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  className="glass-input h-20 resize-none text-xs"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Assignee</label>
                  <select
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="glass-input text-xs"
                  >
                    <option value="">Unassigned</option>
                    {projectMembersList.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.firstName} {m.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={taskDue}
                    onChange={(e) => setTaskDue(e.target.value)}
                    className="glass-input text-xs"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Story Points</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={taskSP}
                    onChange={(e) => setTaskSP(Number(e.target.value))}
                    className="glass-input text-xs"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Estimated Hours</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={taskHours}
                    onChange={(e) => setTaskHours(Number(e.target.value))}
                    className="glass-input text-xs"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="glass-input"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Initial Status</label>
                  <select
                    value={taskStatus}
                    onChange={(e) => setTaskStatus(e.target.value)}
                    className="glass-input"
                  >
                    <option value="TODO">Todo</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="REVIEW">Review</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Labels (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. backend, bugfix, docs"
                  value={taskLabelsInput}
                  onChange={(e) => setTaskLabelsInput(e.target.value)}
                  className="glass-input text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <button type="button" onClick={() => setShowCreateTaskModal(false)} className="glass-btn-secondary">Cancel</button>
                <button type="submit" disabled={createTaskMutation.isPending} className="glass-btn-primary">
                  {createTaskMutation.isPending ? 'Adding...' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
