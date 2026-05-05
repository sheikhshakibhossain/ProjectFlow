import React, { useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router';
import { Card, CardContent, Button, Input, Badge } from '../components/ui';
import { MOCK_PROJECTS, MOCK_USERS } from '../lib/mockData';
import { ArrowLeft } from 'lucide-react';

export const AddTask: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const project = useMemo(() => MOCK_PROJECTS.find(p => p.id === id), [id]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const teamMembers = useMemo(() => {
    if (!project?.teamId) return [];
    return MOCK_USERS.filter(u => u.teamId === project.teamId);
  }, [project]);

  if (!project) return (
    <div className="flex flex-col items-center justify-center h-full pt-12">
      <h2 className="text-xl font-semibold text-slate-900 mb-2">Project Not Found</h2>
      <p className="text-slate-500 mb-6">The project you're looking for doesn't exist.</p>
      <Button asChild>
        <Link to="/projects">Return to Projects</Link>
      </Button>
    </div>
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Dummy submit logic
    navigate(`/projects/${project.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="-ml-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Add Task</h1>
            <Badge variant={project.status === 'active' ? 'success' : 'default'}>{project.status}</Badge>
          </div>
          <p className="text-slate-500">{project.title}</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Task Title</label>
              <Input
                required
                placeholder="e.g. Implement API endpoints"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Description</label>
              <textarea
                className="flex w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 min-h-[100px] resize-y"
                placeholder="Describe the task scope and expected output..."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Assignee</label>
                <select
                  className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  value={assigneeId}
                  onChange={e => setAssigneeId(e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {teamMembers.map(member => (
                    <option key={member.id} value={member.id}>{member.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Priority</label>
                <select
                  className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  value={priority}
                  onChange={e => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
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

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
              <Button type="submit">Create Task</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
