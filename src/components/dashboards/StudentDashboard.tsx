import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '../ui';
import { MOCK_TASKS, MOCK_PROJECTS } from '../../lib/mockData';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle2, Clock, PlayCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  
  const myTasks = MOCK_TASKS.filter(t => t.assigneeId === user?.id);
  const myProjects = MOCK_PROJECTS.filter(p => p.teamId === user?.teamId);

  const todoTasks = myTasks.filter(t => t.status === 'todo');
  const inProgressTasks = myTasks.filter(t => t.status === 'in_progress');
  const doneTasks = myTasks.filter(t => t.status === 'done');

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'done': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'in_progress': return <PlayCircle className="w-5 h-5 text-amber-500" />;
      default: return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch(priority) {
      case 'high': return <Badge variant="destructive">High</Badge>;
      case 'medium': return <Badge variant="warning">Medium</Badge>;
      default: return <Badge variant="secondary">Low</Badge>;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Task Summary */}
      <div className="lg:col-span-2 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500">To Do</p>
                  <p className="text-3xl font-bold text-slate-900">{todoTasks.length}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-slate-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-amber-600">In Progress</p>
                  <p className="text-3xl font-bold text-amber-600">{inProgressTasks.length}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                  <PlayCircle className="w-5 h-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-emerald-600">Done</p>
                  <p className="text-3xl font-bold text-emerald-600">{doneTasks.length}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>My Tasks</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/projects">View Projects</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {myTasks.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No tasks assigned to you.</div>
              ) : (
                myTasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100/50 transition-colors">
                    <div className="flex items-center gap-4">
                      {getStatusIcon(task.status)}
                      <div>
                        <p className="font-medium text-slate-900">{task.title}</p>
                        <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Due: {task.deadline}
                        </p>
                      </div>
                    </div>
                    <div>
                      {getPriorityBadge(task.priority)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar / Progress */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Active Projects</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {myProjects.map(project => (
              <div key={project.id} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-slate-900">{project.title}</span>
                  <span className="text-slate-500">{project.progress}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 rounded-full transition-all duration-500" 
                    style={{ width: `${project.progress}%` }} 
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
