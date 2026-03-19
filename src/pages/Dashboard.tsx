import React from 'react';
import { useAuth } from '../context/AuthContext';
import { StudentDashboard } from '../components/dashboards/StudentDashboard';
import { TeamLeadDashboard } from '../components/dashboards/TeamLeadDashboard';
import { TeacherDashboard } from '../components/dashboards/TeacherDashboard';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back, {user.name.split(' ')[0]}! 👋</h1>
          <p className="text-slate-500 mt-1">Here's what's happening with your projects today.</p>
        </div>
      </div>

      {user.role === 'student' && <StudentDashboard />}
      {user.role === 'team_lead' && <TeamLeadDashboard />}
      {user.role === 'teacher' && <TeacherDashboard />}
    </div>
  );
};
