import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Input } from '../components/ui';
import { MOCK_PROJECTS, MOCK_USERS } from '../lib/mockData';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router';
import { Search, Filter, Plus, Clock, Users } from 'lucide-react';

export const Projects: React.FC = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  // If teacher, see all. If student/lead, see team projects.
  const projects = user?.role === 'teacher' 
    ? MOCK_PROJECTS 
    : MOCK_PROJECTS.filter(p => p.teamId === user?.teamId);

  const filteredProjects = projects.filter(p => {
    if (filter !== 'all' && p.status !== filter) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Projects</h1>
          <p className="text-slate-500 mt-1">Manage and track your academic projects.</p>
        </div>
        {user?.role === 'team_lead' && (
          <Button asChild className="shrink-0">
            <Link to="/projects/create">
              <Plus className="w-5 h-5 mr-2" />
              Create Project
            </Link>
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input 
            placeholder="Search projects..." 
            className="pl-10 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select 
            value={filter} 
            onChange={e => setFilter(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="on_hold">On Hold</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProjects.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 border-dashed">
            No projects found matching your criteria.
          </div>
        ) : (
          filteredProjects.map(project => (
            <Link key={project.id} to={`/projects/${project.id}`}>
              <Card className="h-full hover:shadow-md transition-all hover:border-indigo-200 cursor-pointer group">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <Badge variant={project.status === 'active' ? 'success' : project.status === 'completed' ? 'default' : 'secondary'} className="mb-2">
                      {project.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl group-hover:text-indigo-600 transition-colors">{project.title}</CardTitle>
                  <p className="text-sm text-slate-500 line-clamp-2 mt-2">{project.description}</p>
                </CardHeader>
                <CardContent className="mt-auto pt-4 space-y-4">
                  <div className="flex justify-between items-center text-sm text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span>{project.deadline}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      <span>{MOCK_USERS.filter(u => u.teamId === project.teamId).length} Members</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-700">Progress</span>
                      <span className="text-slate-500">{project.progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-600 rounded-full transition-all duration-500" 
                        style={{ width: `${project.progress}%` }} 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};
