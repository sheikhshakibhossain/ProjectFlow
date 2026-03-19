import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Badge } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { Save, Bell, Shield, User as UserIcon } from 'lucide-react';

export const ProfileSettings: React.FC = () => {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Profile & Settings</h1>
        <p className="text-slate-500 mt-1">Manage your account preferences and personal information.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="relative mb-4">
                <img src={user.avatar} alt={user.name} className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover" />
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white border-2 border-white hover:bg-indigo-700 transition-colors">
                  <UserIcon className="w-4 h-4" />
                </button>
              </div>
              <h3 className="text-lg font-bold text-slate-900">{user.name}</h3>
              <p className="text-slate-500 text-sm mb-3">{user.email}</p>
              <Badge variant="secondary" className="capitalize px-3 py-1 text-sm bg-indigo-50 text-indigo-700 border-indigo-100">
                {user.role.replace('_', ' ')}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <nav className="flex flex-col p-2">
              <button className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-xl transition-colors">
                <UserIcon className="w-5 h-5" />
                Personal Info
              </button>
              <button className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
                <Bell className="w-5 h-5" />
                Notifications
              </button>
              <button className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
                <Shield className="w-5 h-5" />
                Security
              </button>
            </nav>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none text-slate-700">Full Name</label>
                    <Input defaultValue={user.name} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none text-slate-700">Email Address</label>
                    <Input defaultValue={user.email} type="email" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none text-slate-700">Role</label>
                    <Input defaultValue={user.role.replace('_', ' ')} disabled className="capitalize bg-slate-50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none text-slate-700">Team / Department</label>
                    <Input defaultValue={user.teamId ? `Team ${user.teamId.replace('t', '')}` : 'Computer Science Dept'} disabled className="bg-slate-50" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none text-slate-700">Bio</label>
                  <textarea 
                    className="flex w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 min-h-[100px] resize-y"
                    placeholder="Tell us a little bit about yourself..."
                    defaultValue="Computer Science major focusing on software engineering and UI/UX design."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  {saved && <span className="text-sm text-emerald-600 flex items-center mr-auto">Changes saved successfully!</span>}
                  <Button type="submit" className="min-w-[120px]">
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
