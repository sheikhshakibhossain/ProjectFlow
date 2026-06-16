import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input } from '../components/ui';
import { api } from '../lib/api';
import type { Project, Task, TaskStatus, User, TaskComment } from '../lib/types';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Plus, Clock, AlertCircle, Trash2, UserPlus, X, Send, AlertTriangle } from 'lucide-react';

const ItemTypes = { TASK: 'task' };

function isOverdue(deadline: string) {
  return new Date(deadline) < new Date(new Date().toDateString());
}

// ── Task Modal ──────────────────────────────────────────────────────────────
const TaskModal: React.FC<{
  task: Task;
  members: User[];
  onClose: () => void;
}> = ({ task, members, onClose }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [posting, setPosting] = useState(false);
  const assignee = members.find(m => m.id === task.assigneeId);
  const overdue = task.status !== 'done' && isOverdue(task.deadline);

  useEffect(() => {
    api.getTaskComments(task.id).then(({ comments }) => setComments(comments)).catch(() => {});
  }, [task.id]);

  const handlePost = async () => {
    if (!commentText.trim()) return;
    setPosting(true);
    try {
      const { comment } = await api.addTaskComment(task.id, commentText.trim());
      setComments(prev => [...prev, comment]);
      setCommentText('');
    } catch {
      // silent
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      <div className="fixed inset-0 bg-black/30 dark:bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'warning' : 'secondary'}>
                {task.priority}
              </Badge>
              <Badge variant={task.status === 'done' ? 'success' : task.status === 'in_progress' ? 'default' : 'secondary'}>
                {task.status.replace('_', ' ')}
              </Badge>
              {overdue && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> overdue
                </Badge>
              )}
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{task.title}</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Details */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 shrink-0 space-y-3">
          {task.description && <p className="text-sm text-slate-600 dark:text-slate-400">{task.description}</p>}
          <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span className={overdue ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                {new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            {assignee && (
              <div className="flex items-center gap-1.5">
                <img src={assignee.avatar} alt={assignee.name} className="w-5 h-5 rounded-full" />
                <span>{assignee.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Comments */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Comments ({comments.length})
          </p>
          {comments.length === 0 && (
            <p className="text-sm text-slate-400 dark:text-slate-500">No comments yet. Be the first!</p>
          )}
          {comments.map(c => (
            <div key={c.id} className="flex gap-3">
              <img src={c.user.avatar} alt={c.user.name} className="w-7 h-7 rounded-full shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{c.user.name}</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {new Date(c.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 break-words">{c.content}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Comment input */}
        {user && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0 flex gap-2 items-end">
            <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full shrink-0 mb-0.5" />
            <div className="flex-1 relative">
              <textarea
                rows={2}
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePost(); } }}
                placeholder="Write a comment… (Enter to send)"
                className="w-full resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={handlePost}
              disabled={!commentText.trim() || posting}
              className="p-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 shrink-0 mb-0.5"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Task Card ───────────────────────────────────────────────────────────────
const TaskCard: React.FC<{ task: Task; assignee?: User; isOwnTask: boolean; onClick: () => void }> = ({ task, assignee, isOwnTask, onClick }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.TASK,
    item: { id: task.id },
    canDrag: isOwnTask,
    collect: monitor => ({ isDragging: !!monitor.isDragging() }),
  }), [isOwnTask]);

  const overdue = task.status !== 'done' && isOverdue(task.deadline);

  return (
    <div
      ref={drag}
      onClick={onClick}
      title={isOwnTask ? 'Click to view details / drag to move' : 'Click to view details'}
      className={`p-4 bg-white dark:bg-slate-900 rounded-xl border transition-colors cursor-pointer shadow-sm
        ${overdue ? 'border-red-200 dark:border-red-500/40 hover:border-red-400' : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500/40'}
        ${isOwnTask ? 'active:cursor-grabbing' : ''}
        ${isDragging ? 'opacity-50' : 'opacity-100'}`}
    >
      <div className="flex justify-between items-start mb-2 gap-2">
        <Badge variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'warning' : 'secondary'}>
          {task.priority}
        </Badge>
        {overdue && (
          <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 font-medium shrink-0">
            <AlertTriangle className="w-3 h-3" /> overdue
          </span>
        )}
      </div>
      <h4 className="font-medium text-slate-900 dark:text-slate-100 text-sm mb-1">{task.title}</h4>
      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">{task.description}</p>
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className={`flex items-center gap-1.5 text-xs ${overdue ? 'text-red-500 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
          <Clock className="w-3.5 h-3.5" />
          {new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </div>
        {assignee && <img src={assignee.avatar} alt={assignee.name} className="w-6 h-6 rounded-full border border-white shadow-sm" title={assignee.name} />}
      </div>
    </div>
  );
};

// ── Column ──────────────────────────────────────────────────────────────────
const Column: React.FC<{
  status: TaskStatus; title: string; tasks: Task[]; members: User[];
  currentUserId?: string;
  moveTask: (taskId: string, targetStatus: TaskStatus) => void;
  onTaskClick: (task: Task) => void;
}> = ({ status, title, tasks, members, currentUserId, moveTask, onTaskClick }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.TASK,
    drop: (item: { id: string }) => moveTask(item.id, status),
    collect: monitor => ({ isOver: !!monitor.isOver() }),
  }));

  return (
    <div className="flex flex-col flex-1 min-w-[300px] max-w-sm bg-slate-100/50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="font-semibold text-slate-700 dark:text-slate-300">{title}</h3>
        <Badge variant="secondary" className="bg-white dark:bg-slate-900">{tasks.length}</Badge>
      </div>
      <div ref={drop} className={`flex-1 flex flex-col gap-3 min-h-[200px] rounded-xl transition-colors ${isOver ? 'bg-indigo-50/50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 border-dashed' : ''}`}>
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            assignee={members.find(m => m.id === task.assigneeId)}
            isOwnTask={!!currentUserId && task.assigneeId === currentUserId}
            onClick={() => onTaskClick(task)}
          />
        ))}
      </div>
    </div>
  );
};

// ── Manage Members ──────────────────────────────────────────────────────────
const ManageMembers: React.FC<{ project: Project; members: User[]; onMembersChange: (members: User[]) => void }> = ({ project, members, onMembersChange }) => {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.teamId) api.getTeamMembers(user.teamId).then(({ users }) => setTeamMembers(users)).catch(() => {});
  }, [user]);

  const addable = teamMembers.filter(tm => !members.some(m => m.id === tm.id));

  const handleAdd = async (userId: string) => {
    setError(''); setActioningId(userId);
    try { const { members: u } = await api.addProjectMember(project.id, userId); onMembersChange(u); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to add member'); }
    finally { setActioningId(null); }
  };
  const handleRemove = async (userId: string) => {
    setError(''); setActioningId(userId);
    try { const { members: u } = await api.removeProjectMember(project.id, userId); onMembersChange(u); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to remove member'); }
    finally { setActioningId(null); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><UserPlus className="w-5 h-5" />Manage Members</CardTitle>
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
                  <button onClick={() => handleRemove(m.id)} disabled={actioningId === m.id} className="p-1 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-40" title="Remove member">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
        {addable.length > 0 && (
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Add from Team</p>
            <div className="space-y-2">
              {addable.map(m => (
                <div key={m.id} className="flex items-center justify-between p-2 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <img src={m.avatar} alt={m.name} className="w-7 h-7 rounded-full opacity-60" />
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{m.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{m.role.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleAdd(m.id)} disabled={actioningId === m.id}>Add</Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ── Resubmit Form ───────────────────────────────────────────────────────────
const ResubmitForm: React.FC<{ project: Project; onDone: (p: Project) => void; onCancel: () => void }> = ({ project, onDone, onCancel }) => {
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description);
  const [course, setCourse] = useState(project.course);
  const [deadline, setDeadline] = useState(project.deadline);
  const [supervisors, setSupervisors] = useState<User[]>([]);
  const [supervisorId, setSupervisorId] = useState(project.supervisorId || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { api.getUsersByRole('teacher').then(({ users }) => setSupervisors(users)).catch(() => {}); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const { project: updated } = await api.resubmitProject(project.id, { title, description, course, deadline, supervisorId });
      onDone(updated);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to resubmit'); }
    finally { setLoading(false); }
  };

  return (
    <Card className="border-amber-200 dark:border-amber-500/30">
      <CardHeader><CardTitle>Edit & Resubmit</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5"><label className="text-sm font-medium text-slate-700 dark:text-slate-300">Title</label><Input value={title} onChange={e => setTitle(e.target.value)} required /></div>
          <div className="space-y-1.5"><label className="text-sm font-medium text-slate-700 dark:text-slate-300">Course</label><Input value={course} onChange={e => setCourse(e.target.value)} required /></div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
            <textarea className="flex w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 min-h-[80px] resize-y" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div className="space-y-1.5"><label className="text-sm font-medium text-slate-700 dark:text-slate-300">Deadline</label><Input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} required /></div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Supervisor</label>
            <select value={supervisorId} onChange={e => setSupervisorId(e.target.value)} required className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Select supervisor…</option>
              {supervisors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={loading}>{loading ? 'Resubmitting…' : 'Resubmit Project'}</Button>
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

// ── Main Page ───────────────────────────────────────────────────────────────
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
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Team lead delete request
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Teacher direct delete
  const [teacherDeleteStep, setTeacherDeleteStep] = useState<0 | 1 | 2>(0);
  const [teacherDeleteInput, setTeacherDeleteInput] = useState('');
  const [teacherDeleteLoading, setTeacherDeleteLoading] = useState(false);
  const [teacherDeleteError, setTeacherDeleteError] = useState('');

  // Resubmit form
  const [showResubmit, setShowResubmit] = useState(false);

  // Submit for review
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

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

  useEffect(() => { load(); }, [load]);

  const moveTask = (taskId: string, targetStatus: TaskStatus) => {
    setTaskError(null);
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: targetStatus } : t));
    api.updateTask(taskId, { status: targetStatus })
      .then(() => id && api.getProject(id).then(({ project }) => setProject(project)))
      .catch(err => { setTaskError(err instanceof Error ? err.message : 'Failed to update task status'); load(); });
  };

  const handleRequestDelete = async () => {
    if (!project) return;
    setDeleteError(''); setDeleteLoading(true);
    try { const { project: updated } = await api.requestProjectDeletion(project.id); setProject(updated); setDeleteConfirm(false); }
    catch (err) { setDeleteError(err instanceof Error ? err.message : 'Failed to send deletion request'); }
    finally { setDeleteLoading(false); }
  };

  const handleTeacherDelete = async () => {
    if (!project) return;
    setTeacherDeleteError(''); setTeacherDeleteLoading(true);
    try { await api.deleteProject(project.id); navigate('/projects'); }
    catch (err) { setTeacherDeleteError(err instanceof Error ? err.message : 'Failed to delete project'); setTeacherDeleteLoading(false); }
  };

  const handleSubmitForReview = async () => {
    if (!project) return;
    setSubmitError(''); setSubmitLoading(true);
    try { const { project: updated } = await api.submitProject(project.id); setProject(updated); }
    catch (err) { setSubmitError(err instanceof Error ? err.message : 'Failed to submit'); }
    finally { setSubmitLoading(false); }
  };

  const isCreator = user?.role === 'team_lead' && project?.createdBy === user?.id;
  const isTeacherSupervisor = user?.role === 'teacher' && project?.supervisorId === user?.id;

  if (isLoading) return <div className="flex items-center justify-center h-full pt-12 text-slate-500 dark:text-slate-400">Loading project…</div>;

  if (notFound || !project) return (
    <div className="flex flex-col items-center justify-center h-full pt-12">
      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-slate-400 dark:text-slate-500" />
      </div>
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Project Not Found</h2>
      <p className="text-slate-500 dark:text-slate-400 mb-6">The project you're looking for doesn't exist or you don't have access.</p>
      <Button asChild><Link to="/projects">Return to Projects</Link></Button>
    </div>
  );

  const projectOverdue = !['completed', 'rejected', 'deletion_requested'].includes(project.status) && isOverdue(project.deadline);
  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const doneTasks = tasks.filter(t => t.status === 'done');

  const statusVariant = (s: string) => s === 'active' ? 'success' : s === 'completed' ? 'default' : s === 'dormant' ? 'warning' : s === 'rejected' ? 'destructive' : s === 'deletion_requested' ? 'destructive' : s === 'under_review' ? 'warning' : 'secondary';
  const statusLabel = (s: string) => s === 'deletion_requested' ? 'deletion pending' : s === 'under_review' ? 'under review' : s.replace('_', ' ');

  return (
    <DndProvider backend={HTML5Backend}>
      {selectedTask && <TaskModal task={selectedTask} members={members} onClose={() => setSelectedTask(null)} />}

      <div className="space-y-6 flex flex-col h-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/projects')} className="mt-1 -ml-2 shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{project.title}</h1>
                <Badge variant={statusVariant(project.status)}>{statusLabel(project.status)}</Badge>
                {projectOverdue && <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" />overdue</Badge>}
              </div>
              <p className="text-slate-500 dark:text-slate-400">{project.course}</p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0 flex-wrap">
            {user?.role === 'teacher' && <Button asChild variant="outline"><Link to="/feedback">Add Feedback</Link></Button>}
            {user?.role !== 'student' && (
              <Button asChild><Link to={`/projects/${project.id}/add-task`}><Plus className="w-4 h-4 mr-2" />Add Task</Link></Button>
            )}
            {isCreator && project.status === 'active' && (
              <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/30 dark:text-emerald-400 dark:hover:bg-emerald-500/10" onClick={handleSubmitForReview} disabled={submitLoading}>
                {submitLoading ? 'Submitting…' : 'Submit for Review'}
              </Button>
            )}
            {isCreator && project.status !== 'deletion_requested' && project.status !== 'rejected' && (
              <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10" onClick={() => setDeleteConfirm(true)}>
                <Trash2 className="w-4 h-4 mr-2" />Delete
              </Button>
            )}
            {isTeacherSupervisor && teacherDeleteStep === 0 && (
              <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10" onClick={() => setTeacherDeleteStep(1)}>
                <Trash2 className="w-4 h-4 mr-2" />Delete
              </Button>
            )}
          </div>
        </div>

        {/* Submit error */}
        {submitError && (
          <div className="shrink-0 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-800 dark:text-red-400">{submitError}</div>
        )}

        {/* Team lead delete confirmation */}
        {deleteConfirm && (
          <div className="shrink-0 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-4">
            <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">Request project deletion?</p>
            <p className="text-sm text-red-700 dark:text-red-400 mb-3">This will send a request to your supervisor. The project will only be deleted if they approve.</p>
            {deleteError && <p className="text-sm text-red-600 dark:text-red-400 mb-2">{deleteError}</p>}
            <div className="flex gap-2">
              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={handleRequestDelete} disabled={deleteLoading}>
                {deleteLoading ? 'Sending…' : 'Yes, send request'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setDeleteConfirm(false); setDeleteError(''); }}>Cancel</Button>
            </div>
          </div>
        )}

        {/* Teacher multi-step delete */}
        {teacherDeleteStep === 1 && (
          <div className="shrink-0 rounded-xl border border-red-300 dark:border-red-500/40 bg-red-50 dark:bg-red-500/10 px-4 py-4 space-y-3">
            <p className="text-sm font-semibold text-red-800 dark:text-red-300">Are you sure you want to delete this project?</p>
            <p className="text-sm text-red-700 dark:text-red-400">This permanently deletes all tasks, feedback, and data for <strong>{project.title}</strong>. All members will be notified. This cannot be undone.</p>
            <div className="flex gap-2">
              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={() => setTeacherDeleteStep(2)}>Yes, I understand — continue</Button>
              <Button size="sm" variant="outline" onClick={() => setTeacherDeleteStep(0)}>Cancel</Button>
            </div>
          </div>
        )}
        {teacherDeleteStep === 2 && (
          <div className="shrink-0 rounded-xl border border-red-300 dark:border-red-500/40 bg-red-50 dark:bg-red-500/10 px-4 py-4 space-y-3">
            <p className="text-sm font-semibold text-red-800 dark:text-red-300">Type the project name to confirm deletion</p>
            <p className="text-xs text-red-600 dark:text-red-400">Type <strong>{project.title}</strong> exactly.</p>
            <input type="text" value={teacherDeleteInput} onChange={e => setTeacherDeleteInput(e.target.value)} placeholder={project.title} className="w-full rounded-lg border border-red-300 dark:border-red-500/40 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
            {teacherDeleteError && <p className="text-sm text-red-600 dark:text-red-400">{teacherDeleteError}</p>}
            <div className="flex gap-2">
              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={handleTeacherDelete} disabled={teacherDeleteInput !== project.title || teacherDeleteLoading}>
                {teacherDeleteLoading ? 'Deleting…' : 'Permanently Delete'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setTeacherDeleteStep(0); setTeacherDeleteInput(''); setTeacherDeleteError(''); }}>Cancel</Button>
            </div>
          </div>
        )}

        {/* Status banners */}
        {project.status === 'dormant' && (
          <div className="shrink-0 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-400">
            This project is awaiting approval from its supervisor before work can begin.
          </div>
        )}
        {project.status === 'rejected' && !showResubmit && (
          <div className="shrink-0 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-800 dark:text-red-400 flex items-center justify-between gap-4">
            <span>This project's supervision request was declined by the supervisor.</span>
            {isCreator && <Button size="sm" variant="outline" onClick={() => setShowResubmit(true)}>Edit & Resubmit</Button>}
          </div>
        )}
        {project.status === 'deletion_requested' && (
          <div className="shrink-0 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-800 dark:text-red-400">
            Deletion has been requested for this project and is awaiting supervisor approval.
          </div>
        )}
        {project.status === 'under_review' && (
          <div className="shrink-0 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-400">
            This project has been submitted for completion review. Awaiting supervisor decision.
          </div>
        )}
        {project.status === 'completed' && (
          <div className="shrink-0 rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-400">
            This project has been marked as completed by the supervisor.
          </div>
        )}

        {/* Resubmit form */}
        {showResubmit && project.status === 'rejected' && (
          <div className="shrink-0">
            <ResubmitForm
              project={project}
              onDone={updated => { setProject(updated); setShowResubmit(false); }}
              onCancel={() => setShowResubmit(false)}
            />
          </div>
        )}

        {/* Project meta */}
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

        {/* Manage members (team lead only) */}
        {isCreator && (
          <div className="shrink-0">
            <ManageMembers project={project} members={members} onMembersChange={setMembers} />
          </div>
        )}

        {/* Task error */}
        {taskError && (
          <div className="shrink-0 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-800 dark:text-red-400 flex items-center justify-between">
            {taskError}
            <button onClick={() => setTaskError(null)} className="text-red-600 font-medium">Dismiss</button>
          </div>
        )}

        {/* Kanban */}
        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex gap-6 min-w-max h-full items-start">
            <Column status="todo" title="To Do" tasks={todoTasks} members={members} currentUserId={user?.id} moveTask={moveTask} onTaskClick={setSelectedTask} />
            <Column status="in_progress" title="In Progress" tasks={inProgressTasks} members={members} currentUserId={user?.id} moveTask={moveTask} onTaskClick={setSelectedTask} />
            <Column status="done" title="Done" tasks={doneTasks} members={members} currentUserId={user?.id} moveTask={moveTask} onTaskClick={setSelectedTask} />
          </div>
        </div>
      </div>
    </DndProvider>
  );
};
