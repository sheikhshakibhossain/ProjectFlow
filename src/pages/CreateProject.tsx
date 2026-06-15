import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, Button, Input } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import type { User } from '../lib/types';
import { ArrowLeft } from 'lucide-react';

export const CreateProject: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [supervisors, setSupervisors] = useState<User[]>([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [course, setCourse] = useState('');
  const [deadline, setDeadline] = useState('');
  const [supervisorId, setSupervisorId] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user?.teamId) return;
    api.getTeamMembers(user.teamId).then(({ users }) => setTeamMembers(users)).catch(() => {});
  }, [user]);

  useEffect(() => {
    api.getUsersByRole('teacher').then(({ users }) => setSupervisors(users)).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await api.createProject({ title, description, course, deadline, supervisorId });
      navigate('/projects');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMember = (id: string) => {
    setSelectedMembers(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="-ml-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create New Project</h1>
          <p className="text-slate-500 mt-1">Set up a new academic project and assign your team.</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Project Title</label>
              <Input
                required
                placeholder="e.g. Smart Campus App"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Course Name / Code</label>
              <Input
                required
                placeholder="e.g. CS401 - Software Engineering"
                value={course}
                onChange={e => setCourse(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Description</label>
              <textarea
                className="flex w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 min-h-[100px] resize-y"
                placeholder="Describe the project goals and requirements..."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Deadline</label>
              <Input
                type="date"
                required
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Supervisor</label>
              <select
                required
                value={supervisorId}
                onChange={e => setSupervisorId(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <option value="">Select a supervisor...</option>
                {supervisors.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <p className="text-xs text-slate-400">The project will stay dormant until your supervisor accepts the request.</p>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium leading-none">Team Members</label>
              {teamMembers.length === 0 ? (
                <p className="text-sm text-slate-500">No team members found yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {teamMembers.map(member => (
                    <label
                      key={member.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selectedMembers.includes(member.id) ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 hover:bg-slate-50'}`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={selectedMembers.includes(member.id)}
                        onChange={() => toggleMember(member.id)}
                      />
                      <img src={member.avatar} alt={member.name} className="w-8 h-8 rounded-full" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">{member.name}</p>
                        <p className="text-xs text-slate-500 capitalize">{member.role.replace('_', ' ')}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              <p className="text-xs text-slate-400">All members of your team automatically have access to projects you create.</p>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create Project'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
