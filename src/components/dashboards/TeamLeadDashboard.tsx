import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '../ui';
import { api } from '../../lib/api';
import type { Project, Task, User } from '../../lib/types';
import { useAuth } from '../../context/AuthContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Plus, Users, LayoutList } from 'lucide-react';
import { Link, useNavigate } from 'react-router';

const COLORS = ['#6366f1', '#f59e0b', '#10b981'];

export const TeamLeadDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [teamTasks, setTeamTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    Promise.all([
      api.getProjects(),
      user.teamId ? api.getTeamMembers(user.teamId) : Promise.resolve({ users: [] }),
    ])
      .then(async ([{ projects }, { users }]) => {
        if (cancelled) return;
        setMyProjects(projects);
        setTeamMembers(users);
        const taskLists = await Promise.all(projects.map(p => api.getTasks(p.id).then(r => r.tasks)));
        if (cancelled) return;
        setTeamTasks(taskLists.flat());
      })
      .catch(() => {})
      .finally(() => !cancelled && setIsLoading(false));
    return () => { cancelled = true; };
  }, [user]);

  const todoCount = teamTasks.filter(t => t.status === 'todo').length;
  const inProgressCount = teamTasks.filter(t => t.status === 'in_progress').length;
  const doneCount = teamTasks.filter(t => t.status === 'done').length;

  const pieData = [
    { name: 'To Do', value: todoCount },
    { name: 'In Progress', value: inProgressCount },
    { name: 'Done', value: doneCount },
  ];

  const barData = teamMembers.map(member => ({
    name: member.name.split(' ')[0],
    tasks: teamTasks.filter(t => t.assigneeId === member.id).length
  }));

  if (isLoading) {
    return <div className="text-center py-12 text-slate-500 dark:text-slate-400">Loading dashboard...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Quick Stats & Actions */}
      <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/projects')}>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Projects</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">{myProjects.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
              <LayoutList className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/projects')}>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Team Members</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">{teamMembers.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </CardContent>
        </Card>
        <div className="flex gap-4 items-center">
          <Button className="w-full h-full text-lg shadow-md hover:shadow-lg transition-shadow" asChild>
            <Link to="/projects/create">
              <Plus className="w-5 h-5 mr-2" />
              New Project
            </Link>
          </Button>
        </div>
      </div>

      {/* Charts */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Task Status</CardTitle>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
        <div className="flex justify-center gap-4 pb-6">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-500" /><span className="text-xs">To Do</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500" /><span className="text-xs">In Progress</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /><span className="text-xs">Done</span></div>
        </div>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Task Distribution</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
              <Bar dataKey="tasks" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
