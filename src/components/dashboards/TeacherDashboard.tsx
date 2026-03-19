import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '../ui';
import { MOCK_PROJECTS, MOCK_FEEDBACK } from '../../lib/mockData';
import { MessageSquarePlus, GraduationCap, Clock } from 'lucide-react';
import { Link } from 'react-router';

export const TeacherDashboard: React.FC = () => {
  const supervisedProjects = MOCK_PROJECTS; // Assume teacher supervises all in mock
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Supervised Projects</p>
              <p className="text-2xl font-bold text-slate-900">{supervisedProjects.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
              <MessageSquarePlus className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Feedback Given</p>
              <p className="text-2xl font-bold text-slate-900">{MOCK_FEEDBACK.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

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
              <thead className="text-xs text-slate-500 uppercase bg-slate-50">
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
                  <tr key={project.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      <Link to={`/projects/${project.id}`} className="hover:text-indigo-600">
                        {project.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{project.course}</td>
                    <td className="px-6 py-4 text-slate-500 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {project.deadline}
                    </td>
                    <td className="px-6 py-4">
                      {project.status === 'active' ? (
                        <Badge variant="success">Active</Badge>
                      ) : project.status === 'completed' ? (
                        <Badge variant="default">Completed</Badge>
                      ) : (
                        <Badge variant="secondary">On Hold</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-slate-200 rounded-full h-2 max-w-[100px]">
                          <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${project.progress}%` }}></div>
                        </div>
                        <span className="text-xs text-slate-500">{project.progress}%</span>
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
