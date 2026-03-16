'use client';

import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import { resolveBackendAssetUrl } from '@/lib/asset-url';
import { useRef, useState } from 'react';
import { Camera } from 'lucide-react';

export function AvatarUpload() {
  const { user, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    setUploading(true);
    setError('');
    try {
      await api.post('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await refreshUser();
    } catch {
      setError('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const avatarUrl = resolveBackendAssetUrl(user?.avatar);

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="group relative h-16 w-16 overflow-hidden rounded-full border-2 border-border bg-muted transition-colors hover:border-accent"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={user?.name || 'Avatar'}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-xl font-semibold text-muted-foreground">
            {user?.name?.charAt(0).toUpperCase() || '?'}
          </span>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <Camera className="h-5 w-5 text-white" />
        </div>
      </button>
      <div>
        <p className="text-sm font-medium">{user?.name}</p>
        <p className="text-xs text-muted-foreground">
          {uploading ? 'Uploading...' : 'Click to change avatar'}
        </p>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
