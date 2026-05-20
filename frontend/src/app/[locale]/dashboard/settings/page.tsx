'use client';

import { DashboardHeader } from '@/components/dashboard/header';
import { AvatarUpload } from '@/components/avatar-upload';
import { useAuth } from '@/lib/auth';
import { useState } from 'react';
import api from '@/lib/api';
import { extractApiErrorMessage } from '@/lib/api-error';
import { User, Lock } from 'lucide-react';
import { MotionPreferences } from '@/components/settings/motion-preferences';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [profile, setProfile] = useState({
    name: user?.name ?? '',
    phone: user?.phone ?? '',
  });

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await api.patch('/users/me', { name: profile.name, phone: profile.phone });
      await refreshUser();
      setMessage('Profile updated successfully');
    } catch (err) {
      setMessage(extractApiErrorMessage(err, 'Error updating profile'));
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage('New passwords do not match');
      return;
    }
    if (passwords.newPassword.length < 6) {
      setMessage('Password must be at least 6 characters');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      await api.patch('/users/me/password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setMessage('Password changed successfully');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setMessage(extractApiErrorMessage(err, 'Error changing password'));
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { key: 'profile' as const, label: 'Profile', icon: User },
    { key: 'password' as const, label: 'Password', icon: Lock },
  ];

  return (
    <>
      <DashboardHeader title="Settings" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="tts-workspace-surface mx-auto max-w-2xl p-4 sm:p-6">
          {/* Tabs */}
          <div className="flex gap-1 rounded-lg border border-border bg-muted/30 p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setMessage(''); }}
                className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {message && (
            <div className={`mt-4 rounded-lg px-4 py-2 text-sm ${message.includes('Error') || message.includes('do not') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
              {message}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="mt-6 space-y-6">
              <AvatarUpload />
              <form onSubmit={handleProfileSave} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Full Name</label>
                  <input
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="tts-form-field w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Email</label>
                  <input
                    type="email"
                    value={user?.email ?? ''}
                    disabled
                    className="tts-form-field w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Phone Number</label>
                  <input
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="tts-form-field w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Role</label>
                  <input
                    value={user?.role ?? ''}
                    disabled
                    className="tts-form-field w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground"
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'password' && (
            <form onSubmit={handlePasswordChange} className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Current Password</label>
                <input
                  type="password"
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                  className="tts-form-field w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">New Password</label>
                <input
                  type="password"
                  required
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                  className="tts-form-field w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Confirm new password</label>
                <input
                  type="password"
                  required
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                  className="tts-form-field w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? 'Changing...' : 'Change password'}
              </button>
            </form>
          )}

          <div className="mt-8">
            <MotionPreferences />
          </div>
        </div>
      </main>
    </>
  );
}
