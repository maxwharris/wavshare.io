import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import { API_ENDPOINTS } from '../config/api';

const CreatePost: React.FC = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    postType: 'AUDIO_FILE',
    youtubeUrl: '',
    tags: '',
    bpm: '',
    key: ''
  });
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverArt, setCoverArt] = useState<File | null>(null);
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
      // Validate file size (250MB limit)
      if (file.size > 250 * 1024 * 1024) {
        setErrors(['File size must be less than 250MB']);
        return;
      }
      setAudioFile(file);
      setErrors([]);
    }
  };

  const handleCoverArtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type (images and GIFs)
      if (!file.type.startsWith('image/')) {
        setErrors(['Please select a valid image file (including GIFs)']);
        return;
      }
      // Validate file size (10MB limit for images)
      if (file.size > 10 * 1024 * 1024) {
        setErrors(['Cover art file size must be less than 10MB']);
        return;
      }
      setCoverArt(file);
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

      // Add cover art if provided
      if (coverArt) {
        formDataToSend.append('coverArt', coverArt);
      }

      // Handle tags, BPM, and Key
      const allTags: string[] = [];
      if (formData.tags.trim()) {
        const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        allTags.push(...tagsArray);
      }
      
      // Add BPM as a special tag if provided
      if (formData.bpm.trim()) {
        allTags.push(`bpm:${formData.bpm}`);
      }
      
      // Add Key as a special tag if provided
      if (formData.key.trim()) {
        allTags.push(`key:${formData.key}`);
      }
      
      if (allTags.length > 0) {
        formDataToSend.append('tags', JSON.stringify(allTags));
      }

      const response = await fetch(API_ENDPOINTS.POSTS, {
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
                Supported formats: MP3, WAV, FLAC, etc. Max size: 250MB
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

          {/* Cover Art Upload */}
          <div>
            <label htmlFor="coverArt" className="block text-sm font-medium text-gray-700 mb-1">
              Cover Art (Optional)
            </label>
            <input
              type="file"
              id="coverArt"
              accept="image/*"
              onChange={handleCoverArtChange}
              className="form-input"
              disabled={isLoading}
            />
            <p className="text-sm text-gray-500 mt-1">
              Upload cover art for your post. Supports images and GIFs. Max size: 10MB
            </p>
            {coverArt && (
              <div className="mt-2">
                <p className="text-sm text-green-600">
                  Selected: {coverArt.name} ({(coverArt.size / 1024 / 1024).toFixed(2)} MB)
                </p>
                {coverArt.type.startsWith('image/') && (
                  <img
                    src={URL.createObjectURL(coverArt)}
                    alt="Cover art preview"
                    className="mt-2 w-32 h-32 object-cover rounded-lg border border-gray-300"
                  />
                )}
              </div>
            )}
          </div>

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

          {/* BPM and Key */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* BPM */}
            <div>
              <label htmlFor="bpm" className="block text-sm font-medium text-gray-700 mb-1">
                BPM (Beats Per Minute)
              </label>
              <input
                type="number"
                id="bpm"
                name="bpm"
                value={formData.bpm}
                onChange={handleChange}
                className="form-input"
                placeholder="120"
                min="60"
                max="200"
                disabled={isLoading}
              />
              <p className="text-sm text-gray-500 mt-1">
                Optional: Enter the tempo (60-200 BPM)
              </p>
            </div>

            {/* Key */}
            <div>
              <label htmlFor="key" className="block text-sm font-medium text-gray-700 mb-1">
                Musical Key
              </label>
              <select
                id="key"
                name="key"
                value={formData.key}
                onChange={handleChange}
                className="form-input"
                disabled={isLoading}
              >
                <option value="">Select Key (Optional)</option>
                <option value="C">C Major</option>
                <option value="C#">C# Major</option>
                <option value="Db">Db Major</option>
                <option value="D">D Major</option>
                <option value="D#">D# Major</option>
                <option value="Eb">Eb Major</option>
                <option value="E">E Major</option>
                <option value="F">F Major</option>
                <option value="F#">F# Major</option>
                <option value="Gb">Gb Major</option>
                <option value="G">G Major</option>
                <option value="G#">G# Major</option>
                <option value="Ab">Ab Major</option>
                <option value="A">A Major</option>
                <option value="A#">A# Major</option>
                <option value="Bb">Bb Major</option>
                <option value="B">B Major</option>
                <option value="Cm">C Minor</option>
                <option value="C#m">C# Minor</option>
                <option value="Dm">D Minor</option>
                <option value="D#m">D# Minor</option>
                <option value="Ebm">Eb Minor</option>
                <option value="Em">E Minor</option>
                <option value="Fm">F Minor</option>
                <option value="F#m">F# Minor</option>
                <option value="Gm">G Minor</option>
                <option value="G#m">G# Minor</option>
                <option value="Am">A Minor</option>
                <option value="A#m">A# Minor</option>
                <option value="Bbm">Bb Minor</option>
                <option value="Bm">B Minor</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">
                Optional: Select the musical key
              </p>
            </div>
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
