import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '../components/ui';
import { api } from '../lib/api';
import type { Project, Task, TaskStatus, User } from '../lib/types';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Plus, Clock, AlertCircle, Trash2, UserPlus, X } from 'lucide-react';

const ItemTypes = {
  TASK: 'task'
};

const TaskCard: React.FC<{ task: Task, assignee?: User, isOwnTask: boolean }> = ({ task, assignee, isOwnTask }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.TASK,
    item: { id: task.id },
    canDrag: isOwnTask,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [isOwnTask]);

  return (
    <div
      ref={drag}
      title={isOwnTask ? undefined : 'Only the assignee can change this task\'s status'}
      className={`p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-colors ${isOwnTask ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'} ${isDragging ? 'opacity-50' : 'opacity-100'}`}
    >
      <div className="flex justify-between items-start mb-2">
        <Badge variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'warning' : 'secondary'}>
          {task.priority}
        </Badge>
      </div>
      <h4 className="font-medium text-slate-900 dark:text-slate-100 text-sm mb-1">{task.title}</h4>
      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">{task.description}</p>

      <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          {new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </div>
        {assignee && (
          <img src={assignee.avatar} alt={assignee.name} className="w-6 h-6 rounded-full border border-white shadow-sm" title={assignee.name} />
        )}
      </div>
    </div>
  );
};

const Column: React.FC<{ status: TaskStatus, title: string, tasks: Task[], members: User[], currentUserId?: string, moveTask: (taskId: string, targetStatus: TaskStatus) => void }> = ({ status, title, tasks, members, currentUserId, moveTask }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.TASK,
    drop: (item: { id: string }) => moveTask(item.id, status),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <div className="flex flex-col flex-1 min-w-[300px] max-w-sm bg-slate-100/50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="font-semibold text-slate-700 dark:text-slate-300">{title}</h3>
        <Badge variant="secondary" className="bg-white dark:bg-slate-900">{tasks.length}</Badge>
      </div>
      <div
        ref={drop}
        className={`flex-1 flex flex-col gap-3 min-h-[200px] rounded-xl transition-colors ${isOver ? 'bg-indigo-50/50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 border-dashed' : ''}`}
      >
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} assignee={members.find(m => m.id === task.assigneeId)} isOwnTask={!!currentUserId && task.assigneeId === currentUserId} />
        ))}
      </div>
    </div>
  );
};

const ManageMembers: React.FC<{ project: Project, members: User[], onMembersChange: (members: User[]) => void }> = ({ project, members, onMembersChange }) => {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.teamId) {
      api.getTeamMembers(user.teamId).then(({ users }) => setTeamMembers(users)).catch(() => {});
    }
  }, [user]);

  const addableMemebers = teamMembers.filter(tm => !members.some(m => m.id === tm.id));

  const handleAdd = async (userId: string) => {
    setError('');
    setActioningId(userId);
    try {
      const { members: updated } = await api.addProjectMember(project.id, userId);
      onMembersChange(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add member');
    } finally {
      setActioningId(null);
    }
  };

  const handleRemove = async (userId: string) => {
    setError('');
    setActioningId(userId);
    try {
      const { members: updated } = await api.removeProjectMember(project.id, userId);
      onMembersChange(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    } finally {
      setActioningId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          Manage Members
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Current Members</p>
          <div className="space-y-2">
            {members.map(m => (
              <div key={m.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                <div className="flex items-center gap-2">
                  <img src={m.avatar} alt={m.name} className="w-7 h-7 rounded-full" />
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{m.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{m.role.replace('_', ' ')}</p>
                  </div>
                </div>
                {m.id !== project.createdBy && (
                  <button
                    onClick={() => handleRemove(m.id)}
                    disabled={actioningId === m.id}
                    className="p-1 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-40"
                    title="Remove member"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {addableMemebers.length > 0 && (
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Add from Team</p>
            <div className="space-y-2">
              {addableMemebers.map(m => (
                <div key={m.id} className="flex items-center justify-between p-2 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <img src={m.avatar} alt={m.name} className="w-7 h-7 rounded-full opacity-60" />
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{m.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{m.role.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAdd(m.id)}
                    disabled={actioningId === m.id}
                  >
                    Add
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const ProjectDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  // Teacher direct-delete: 3-step confirmation
  const [teacherDeleteStep, setTeacherDeleteStep] = useState<0 | 1 | 2 | 3>(0);
  const [teacherDeleteInput, setTeacherDeleteInput] = useState('');
  const [teacherDeleteLoading, setTeacherDeleteLoading] = useState(false);
  const [teacherDeleteError, setTeacherDeleteError] = useState('');

  const load = useCallback(() => {
    if (!id) return;
    setIsLoading(true);
    Promise.all([api.getProject(id), api.getTasks(id)])
      .then(([projectRes, tasksRes]) => {
        setProject(projectRes.project);
        setMembers(projectRes.members);
        setTasks(tasksRes.tasks);
      })
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const moveTask = (taskId: string, targetStatus: TaskStatus) => {
    setTaskError(null);
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: targetStatus } : t));
    api.updateTask(taskId, { status: targetStatus })
      .then(() => id && api.getProject(id).then(({ project }) => setProject(project)))
      .catch((err) => {
        setTaskError(err instanceof Error ? err.message : 'Failed to update task status');
        load();
      });
  };

  const handleRequestDelete = async () => {
    if (!project) return;
    setDeleteError('');
    setDeleteLoading(true);
    try {
      const { project: updated } = await api.requestProjectDeletion(project.id);
      setProject(updated);
      setDeleteConfirm(false);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to send deletion request');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleTeacherDelete = async () => {
    if (!project) return;
    setTeacherDeleteError('');
    setTeacherDeleteLoading(true);
    try {
      await api.deleteProject(project.id);
      navigate('/projects');
    } catch (err) {
      setTeacherDeleteError(err instanceof Error ? err.message : 'Failed to delete project');
      setTeacherDeleteLoading(false);
    }
  };

  const isCreator = user?.role === 'team_lead' && project?.createdBy === user?.id;
  const isTeacherSupervisor = user?.role === 'teacher' && project?.supervisorId === user?.id;

  if (isLoading) {
    return <div className="flex items-center justify-center h-full pt-12 text-slate-500 dark:text-slate-400">Loading project...</div>;
  }

  if (notFound || !project) return (
    <div className="flex flex-col items-center justify-center h-full pt-12">
      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-slate-400 dark:text-slate-500" />
      </div>
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Project Not Found</h2>
      <p className="text-slate-500 dark:text-slate-400 mb-6">The project you're looking for doesn't exist or you don't have access.</p>
      <Button asChild>
        <Link to="/projects">Return to Projects</Link>
      </Button>
    </div>
  );

  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const doneTasks = tasks.filter(t => t.status === 'done');

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6 flex flex-col h-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/projects')} className="mt-1 -ml-2 shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{project.title}</h1>
                <Badge
                  variant={
                    project.status === 'active' ? 'success'
                    : project.status === 'completed' ? 'default'
                    : project.status === 'dormant' ? 'warning'
                    : project.status === 'rejected' ? 'destructive'
                    : project.status === 'deletion_requested' ? 'destructive'
                    : 'secondary'
                  }
                >
                  {project.status === 'deletion_requested' ? 'deletion pending' : project.status.replace('_', ' ')}
                </Badge>
              </div>
              <p className="text-slate-500 dark:text-slate-400">{project.course}</p>
            </div>
          </div>
          <div className="flex gap-3 shrink-0 flex-wrap">
            {user?.role === 'teacher' && (
              <Button asChild variant="outline">
                <Link to="/feedback">Add Feedback</Link>
              </Button>
            )}
            {user?.role !== 'student' && (
              <Button asChild>
                <Link to={`/projects/${project.id}/add-task`}>
                  <Plus className="w-4 h-4 mr-2" /> Add Task
                </Link>
              </Button>
            )}
            {isCreator && project.status !== 'deletion_requested' && (
              <Button
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
                onClick={() => setDeleteConfirm(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete Project
              </Button>
            )}
            {isTeacherSupervisor && teacherDeleteStep === 0 && (
              <Button
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
                onClick={() => setTeacherDeleteStep(1)}
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete Project
              </Button>
            )}
          </div>
        </div>

        {/* Delete confirmation inline */}
        {deleteConfirm && (
          <div className="shrink-0 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-4">
            <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">Request project deletion?</p>
            <p className="text-sm text-red-700 dark:text-red-400 mb-3">This will send a request to your supervisor. The project will be deleted only if they approve it.</p>
            {deleteError && <p className="text-sm text-red-600 dark:text-red-400 mb-2">{deleteError}</p>}
            <div className="flex gap-2">
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleRequestDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Sending...' : 'Yes, send request'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setDeleteConfirm(false); setDeleteError(''); }}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Teacher multi-step delete confirmation */}
        {teacherDeleteStep === 1 && (
          <div className="shrink-0 rounded-xl border border-red-300 dark:border-red-500/40 bg-red-50 dark:bg-red-500/10 px-4 py-4 space-y-3">
            <p className="text-sm font-semibold text-red-800 dark:text-red-300">Are you sure you want to delete this project?</p>
            <p className="text-sm text-red-700 dark:text-red-400">This will permanently delete all tasks, feedback, and data for <strong>{project.title}</strong>. All members will be notified. This cannot be undone.</p>
            <div className="flex gap-2">
              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={() => setTeacherDeleteStep(2)}>
                Yes, I understand — continue
              </Button>
              <Button size="sm" variant="outline" onClick={() => setTeacherDeleteStep(0)}>Cancel</Button>
            </div>
          </div>
        )}
        {teacherDeleteStep === 2 && (
          <div className="shrink-0 rounded-xl border border-red-300 dark:border-red-500/40 bg-red-50 dark:bg-red-500/10 px-4 py-4 space-y-3">
            <p className="text-sm font-semibold text-red-800 dark:text-red-300">Final confirmation — type the project name to proceed</p>
            <p className="text-xs text-red-600 dark:text-red-400">Type <strong>{project.title}</strong> exactly to confirm deletion.</p>
            <input
              type="text"
              value={teacherDeleteInput}
              onChange={e => setTeacherDeleteInput(e.target.value)}
              placeholder={project.title}
              className="w-full rounded-lg border border-red-300 dark:border-red-500/40 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            {teacherDeleteError && <p className="text-sm text-red-600 dark:text-red-400">{teacherDeleteError}</p>}
            <div className="flex gap-2">
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleTeacherDelete}
                disabled={teacherDeleteInput !== project.title || teacherDeleteLoading}
              >
                {teacherDeleteLoading ? 'Deleting...' : 'Permanently Delete'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setTeacherDeleteStep(0); setTeacherDeleteInput(''); setTeacherDeleteError(''); }}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Status banners */}
        {project.status === 'dormant' && (
          <div className="shrink-0 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-400">
            This project is awaiting approval from its supervisor before work can begin.
          </div>
        )}
        {project.status === 'rejected' && (
          <div className="shrink-0 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-800 dark:text-red-400">
            This project's supervision request was declined by the supervisor.
          </div>
        )}
        {project.status === 'deletion_requested' && (
          <div className="shrink-0 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-800 dark:text-red-400">
            Deletion has been requested for this project and is awaiting supervisor approval.
          </div>
        )}

        {/* Project Meta */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
          <Card className="md:col-span-3 bg-white dark:bg-slate-900">
            <CardContent className="p-4 sm:p-6">
              <p className="text-slate-600 dark:text-slate-400 text-sm">{project.description}</p>
            </CardContent>
          </Card>
          <Card className="bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20">
            <CardContent className="p-4 sm:p-6 flex flex-col justify-center h-full">
              <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300 mb-2">Overall Progress</p>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 leading-none">{project.progress}%</span>
              </div>
              <div className="h-2 w-full bg-indigo-200/50 dark:bg-indigo-500/30 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${project.progress}%` }} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Manage Members — team lead only */}
        {isCreator && (
          <div className="shrink-0">
            <ManageMembers project={project} members={members} onMembersChange={setMembers} />
          </div>
        )}

        {/* Task error banner */}
        {taskError && (
          <div className="shrink-0 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-800 dark:text-red-400 flex items-center justify-between">
            {taskError}
            <button onClick={() => setTaskError(null)} className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-400 font-medium">Dismiss</button>
          </div>
        )}

        {/* Kanban Board */}
        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex gap-6 min-w-max h-full items-start">
            <Column status="todo" title="To Do" tasks={todoTasks} members={members} currentUserId={user?.id} moveTask={moveTask} />
            <Column status="in_progress" title="In Progress" tasks={inProgressTasks} members={members} currentUserId={user?.id} moveTask={moveTask} />
            <Column status="done" title="Done" tasks={doneTasks} members={members} currentUserId={user?.id} moveTask={moveTask} />
          </div>
        </div>
      </div>
    </DndProvider>
  );
};
