import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '../ui';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import type { Feedback, Project, User } from '../../lib/types';
import { MessageSquarePlus, GraduationCap, Clock, Inbox, Check, X, Trash2, CheckCircle, RotateCcw } from 'lucide-react';
import { Link } from 'react-router';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [supervisedProjects, setSupervisedProjects] = useState<Project[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [requesters, setRequesters] = useState<Record<string, User>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [requestError, setRequestError] = useState('');
  const [deletionActioningId, setDeletionActioningId] = useState<string | null>(null);
  const [deletionError, setDeletionError] = useState('');
  const [reviewActioningId, setReviewActioningId] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    Promise.all([api.getProjects(), api.getFeedback(), api.getUsersByRole('team_lead')])
      .then(([{ projects }, { feedback }, { users }]) => {
        setSupervisedProjects(projects);
        setFeedback(feedback);
        setRequesters(Object.fromEntries(users.map(u => [u.id, u])));
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <div className="text-center py-12 text-slate-500 dark:text-slate-400">Loading dashboard...</div>;
  }

  const projectRequests = supervisedProjects.filter(p => p.status === 'dormant' && p.supervisorId === user?.id);
  const deletionRequests = supervisedProjects.filter(p => p.status === 'deletion_requested');
  const reviewRequests = supervisedProjects.filter(p => p.status === 'under_review');

  const handleReview = async (id: string, action: 'complete' | 'send_back') => {
    setReviewError('');
    setReviewActioningId(id);
    try {
      const { project } = await api.completeProject(id, action);
      setSupervisedProjects(prev => prev.map(p => p.id === id ? project : p));
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Failed to respond');
    } finally {
      setReviewActioningId(null);
    }
  };

  const handleRespondDeletion = async (id: string, action: 'accept' | 'reject') => {
    setDeletionError('');
    setDeletionActioningId(id);
    try {
      const result = await api.respondProjectDeletion(id, action);
      if (result.deleted) {
        setSupervisedProjects(prev => prev.filter(p => p.id !== id));
      } else if (result.project) {
        setSupervisedProjects(prev => prev.map(p => p.id === id ? result.project! : p));
      }
    } catch (err) {
      setDeletionError(err instanceof Error ? err.message : 'Failed to respond');
    } finally {
      setDeletionActioningId(null);
    }
  };

  const handleRespond = async (id: string, action: 'accept' | 'reject') => {
    setRequestError('');
    setActioningId(id);
    try {
      const { project } = await api.respondToProject(id, action);
      setSupervisedProjects(prev => prev.map(p => p.id === id ? project : p));
    } catch (err) {
      setRequestError(err instanceof Error ? err.message : 'Failed to respond to project request');
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Supervised Projects</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{supervisedProjects.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
              <Inbox className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Pending Requests</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{projectRequests.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
              <MessageSquarePlus className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Feedback Given</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{feedback.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {reviewRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-amber-500 dark:text-amber-400" />
              Under Review
              <Badge variant="warning">{reviewRequests.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reviewError && <div className="p-3 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 rounded-xl text-sm">{reviewError}</div>}
            {reviewRequests.map((project) => (
              <div key={project.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-amber-100 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/5">
                <div className="min-w-0">
                  <Link to={`/projects/${project.id}`} className="font-medium text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400">{project.title}</Link>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    {project.course}
                    {requesters[project.createdBy || ''] && ` · Submitted by ${requesters[project.createdBy || ''].name}`}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleReview(project.id, 'complete')} disabled={reviewActioningId === project.id}>
                    <CheckCircle className="w-4 h-4 mr-1.5" />Mark Complete
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleReview(project.id, 'send_back')} disabled={reviewActioningId === project.id}>
                    <RotateCcw className="w-4 h-4 mr-1.5" />Send Back
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {deletionRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500 dark:text-red-400" />
              Deletion Requests
              <Badge variant="destructive">{deletionRequests.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {deletionError && <div className="p-3 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 rounded-xl text-sm">{deletionError}</div>}
            {deletionRequests.map((project) => (
              <div key={project.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-red-100 dark:border-red-500/20 bg-red-50/50 dark:bg-red-500/5">
                <div className="min-w-0">
                  <Link to={`/projects/${project.id}`} className="font-medium text-slate-900 dark:text-slate-100 hover:text-red-600 dark:hover:text-red-400">
                    {project.title}
                  </Link>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    {project.course}
                    {requesters[project.createdBy || ''] && ` · Requested by ${requesters[project.createdBy || ''].name}`}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => handleRespondDeletion(project.id, 'accept')}
                    disabled={deletionActioningId === project.id}
                  >
                    <Trash2 className="w-4 h-4 mr-1.5" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRespondDeletion(project.id, 'reject')}
                    disabled={deletionActioningId === project.id}
                  >
                    <X className="w-4 h-4 mr-1.5" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Project Requests
            {projectRequests.length > 0 && <Badge variant="warning">{projectRequests.length}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {requestError && <div className="p-3 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 rounded-xl text-sm">{requestError}</div>}
          {projectRequests.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-2">No pending project requests.</p>
          ) : (
            projectRequests.map((project) => (
              <div key={project.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="min-w-0">
                  <Link to={`/projects/${project.id}`} className="font-medium text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400">
                    {project.title}
                  </Link>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    {project.course}
                    {requesters[project.createdBy || ''] && ` · Requested by ${requesters[project.createdBy || ''].name}`}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <Clock className="w-3.5 h-3.5" />
                    {project.deadline}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    onClick={() => handleRespond(project.id, 'accept')}
                    disabled={actioningId === project.id}
                  >
                    <Check className="w-4 h-4 mr-1.5" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRespond(project.id, 'reject')}
                    disabled={actioningId === project.id}
                  >
                    <X className="w-4 h-4 mr-1.5" />
                    Reject
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Supervised Projects</CardTitle>
          <Button variant="outline" asChild>
            <Link to="/feedback">Give Feedback</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="px-6 py-3 rounded-tl-xl rounded-bl-xl">Project Name</th>
                  <th className="px-6 py-3">Course</th>
                  <th className="px-6 py-3">Deadline</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 rounded-tr-xl rounded-br-xl">Progress</th>
                </tr>
              </thead>
              <tbody>
                {supervisedProjects.map((project) => (
                  <tr key={project.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                      <Link to={`/projects/${project.id}`} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                        {project.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{project.course}</td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {project.deadline}
                    </td>
                    <td className="px-6 py-4">
                      {project.status === 'active' ? (
                        <Badge variant="success">Active</Badge>
                      ) : project.status === 'completed' ? (
                        <Badge variant="default">Completed</Badge>
                      ) : project.status === 'dormant' ? (
                        <Badge variant="warning">Dormant</Badge>
                      ) : project.status === 'rejected' ? (
                        <Badge variant="destructive">Rejected</Badge>
                      ) : (
                        <Badge variant="secondary">On Hold</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 max-w-[100px]">
                          <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${project.progress}%` }}></div>
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{project.progress}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
