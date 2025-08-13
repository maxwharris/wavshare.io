import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';

const CreatePost: React.FC = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    postType: 'AUDIO_FILE',
    youtubeUrl: '',
    tags: ''
  });
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { user, token } = useAuth();
  const navigate = useNavigate();

  // Redirect if not logged in
  React.useEffect(() => {
    if (!user || !token) {
      navigate('/login');
    }
  }, [user, token, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('audio/')) {
        setErrors(['Please select a valid audio file']);
        return;
      }
      // Validate file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        setErrors(['File size must be less than 50MB']);
        return;
      }
      setAudioFile(file);
      setErrors([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    // Client-side validation
    const newErrors: string[] = [];

    if (!formData.title.trim()) {
      newErrors.push('Title is required');
    }

    if (formData.postType === 'AUDIO_FILE' && !audioFile) {
      newErrors.push('Please select an audio file');
    }

    if (formData.postType === 'YOUTUBE_LINK' && !formData.youtubeUrl.trim()) {
      newErrors.push('YouTube URL is required');
    }

    if (formData.postType === 'YOUTUBE_LINK' && formData.youtubeUrl.trim()) {
      // Basic YouTube URL validation
      const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
      if (!youtubeRegex.test(formData.youtubeUrl.trim())) {
        newErrors.push('Please enter a valid YouTube URL');
      }
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('postType', formData.postType);

      if (formData.postType === 'YOUTUBE_LINK') {
        formDataToSend.append('youtubeUrl', formData.youtubeUrl);
      }

      if (formData.postType === 'AUDIO_FILE' && audioFile) {
        formDataToSend.append('audioFile', audioFile);
      }

      // Handle tags
      if (formData.tags.trim()) {
        const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        formDataToSend.append('tags', JSON.stringify(tagsArray));
      }

      const response = await fetch('http://localhost:5000/api/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          setErrors(data.errors.map((err: any) => err.msg || err.message));
        } else {
          setErrors([data.message || 'Failed to create post']);
        }
        return;
      }

      // Success - redirect to the new post
      navigate(`/post/${data.id}`);
    } catch (error) {
      console.error('Create post error:', error);
      setErrors(['Network error. Please try again.']);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || !token) {
    return null; // Will redirect
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <h2 className="text-2xl font-bold mb-6 text-center">Create New Post</h2>
        
        {errors.length > 0 && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <ul className="list-disc list-inside">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter post title"
              disabled={isLoading}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="form-input resize-none"
              placeholder="Describe your post (optional)"
              disabled={isLoading}
            />
          </div>

          {/* Post Type */}
          <div>
            <label htmlFor="postType" className="block text-sm font-medium text-gray-700 mb-1">
              Post Type *
            </label>
            <select
              id="postType"
              name="postType"
              value={formData.postType}
              onChange={handleChange}
              className="form-input"
              disabled={isLoading}
            >
              <option value="AUDIO_FILE">Upload Audio File</option>
              <option value="YOUTUBE_LINK">YouTube Link</option>
            </select>
          </div>

          {/* Audio File Upload */}
          {formData.postType === 'AUDIO_FILE' && (
            <div>
              <label htmlFor="audioFile" className="block text-sm font-medium text-gray-700 mb-1">
                Audio File *
              </label>
              <input
                type="file"
                id="audioFile"
                accept="audio/*"
                onChange={handleFileChange}
                className="form-input"
                disabled={isLoading}
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Supported formats: MP3, WAV, FLAC, etc. Max size: 50MB
              </p>
              {audioFile && (
                <p className="text-sm text-green-600 mt-1">
                  Selected: {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
          )}

          {/* YouTube URL */}
          {formData.postType === 'YOUTUBE_LINK' && (
            <div>
              <label htmlFor="youtubeUrl" className="block text-sm font-medium text-gray-700 mb-1">
                YouTube URL *
              </label>
              <input
                type="url"
                id="youtubeUrl"
                name="youtubeUrl"
                value={formData.youtubeUrl}
                onChange={handleChange}
                className="form-input"
                placeholder="https://www.youtube.com/watch?v=..."
                disabled={isLoading}
                required
              />
            </div>
          )}

          {/* Tags */}
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              className="form-input"
              placeholder="hip-hop, remix, electronic (separate with commas)"
              disabled={isLoading}
            />
            <p className="text-sm text-gray-500 mt-1">
              Add tags to help others discover your post. Separate multiple tags with commas.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full btn-primary ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Creating Post...' : 'Create Post'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;
