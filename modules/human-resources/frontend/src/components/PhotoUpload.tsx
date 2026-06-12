'use client';

import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface PhotoUploadProps {
  currentPhotoUrl?: string;
  onPhotoChange: (photoUrl: string) => void;
  onPhotoRemove?: () => void;
}

export default function PhotoUpload({ currentPhotoUrl, onPhotoChange, onPhotoRemove }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please upload a JPG, PNG, GIF, or WebP image.');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Maximum size is 5MB.');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload file
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/hr/uploads/photo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Upload failed');
      }

      const data = await response.json();
      // Return full URL for HR module - backend returns /uploaded-files/{filename}
      const photoUrl = data.url.startsWith('http') ? data.url : `http://localhost:8005${data.url}`;

      onPhotoChange(photoUrl);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload photo. Please try again.');
      setPreview(currentPhotoUrl || null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onPhotoRemove) {
      onPhotoRemove();
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">Profile Photo</label>

      <div className="flex items-start gap-4">
        {/* Preview */}
        <div className="flex-shrink-0">
          {preview ? (
            <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-200">
              <img
                src={preview}
                alt="Profile preview"
                className="w-full h-full object-cover"
              />
              {!uploading && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
              <ImageIcon className="w-12 h-12 text-gray-400" />
            </div>
          )}
        </div>

        {/* Upload button */}
        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />

          <button
            type="button"
            onClick={handleClick}
            disabled={uploading}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading...' : preview ? 'Change Photo' : 'Upload Photo'}
          </button>

          <p className="mt-2 text-xs text-gray-500">
            JPG, PNG, GIF or WebP. Max size 5MB.
          </p>

          {error && (
            <p className="mt-2 text-xs text-red-600">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
