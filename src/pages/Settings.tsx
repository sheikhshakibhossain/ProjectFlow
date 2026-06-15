import React, { useRef, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Badge } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Save, Bell, Shield, User as UserIcon, Camera } from 'lucide-react';

const MAX_AVATAR_DIMENSION = 512;

function resizeImageToDataUrl(file: File, maxDimension: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image'));
      img.onload = () => {
        const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas not supported'));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export const ProfileSettings: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);
    try {
      await api.updateProfile({ name, email, bio });
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAvatarError('Please select an image file');
      return;
    }

    setAvatarError('');
    setIsUploadingAvatar(true);
    try {
      const dataUrl = await resizeImageToDataUrl(file, MAX_AVATAR_DIMENSION);
      await api.uploadAvatar(dataUrl);
      await refreshUser();
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : 'Failed to update photo');
    } finally {
      setIsUploadingAvatar(false);
    }
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
                <img src={user.avatar} alt={user.name} className={`w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover ${isUploadingAvatar ? 'opacity-50' : ''}`} />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  title="Change profile photo"
                  className="absolute bottom-0 right-0 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white border-2 border-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
              <h3 className="text-lg font-bold text-slate-900">{user.name}</h3>
              <p className="text-slate-500 text-sm mb-3">{user.email}</p>
              <Badge variant="secondary" className="capitalize px-3 py-1 text-sm bg-indigo-50 text-indigo-700 border-indigo-100">
                {user.role.replace('_', ' ')}
              </Badge>
              {avatarError && <p className="text-xs text-red-600 mt-3">{avatarError}</p>}
              {isUploadingAvatar && <p className="text-xs text-slate-500 mt-3">Uploading photo...</p>}
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
                    <Input value={name} onChange={e => setName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none text-slate-700">Email Address</label>
                    <Input value={email} onChange={e => setEmail(e.target.value)} type="email" />
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
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                  />
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  {saved && <span className="text-sm text-emerald-600 flex items-center mr-auto">Changes saved successfully!</span>}
                  <Button type="submit" className="min-w-[120px]" disabled={isSaving}>
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
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
