import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useAudio } from '../contexts/AudioContext.tsx';

interface UserProfile {
  id: string;
  username: string;
  profilePhoto?: string;
  description?: string;
  createdAt: string;
  posts: Array<{
    id: string;
    title: string;
    description?: string;
    postType: 'AUDIO_FILE' | 'YOUTUBE_LINK';
    filePath?: string;
    youtubeUrl?: string;
    createdAt: string;
    tags: Array<{
      id: string;
      name: string;
    }>;
    _count: {
      votes: number;
      comments: number;
      originalRemixes: number;
    };
  }>;
  comments: Array<{
    id: string;
    content: string;
    isRemix: boolean;
    createdAt: string;
    post: {
      id: string;
      title: string;
      user: {
        id: string;
        username: string;
      };
    };
  }>;
  remixes: Array<{
    id: string;
    createdAt: string;
    originalPost: {
      id: string;
      title: string;
      user: {
        id: string;
        username: string;
      };
    };
    remixPost: {
      id: string;
      title: string;
      filePath?: string;
    };
  }>;
  stats: {
    posts: number;
    comments: number;
    remixes: number;
    votes: number;
    totalUpvotes: number;
    totalDownvotes: number;
    totalCommentVotes: number;
    remixedFromUser: number;
    karmaScore: number;
  };
}

const Profile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'remixes' | 'comments'>('posts');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    description: ''
  });
  const [updating, setUpdating] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [sortBy, setSortBy] = useState('most_remixed');
  const [sortedPosts, setSortedPosts] = useState<UserProfile['posts']>([]);

  const { user, token } = useAuth();
  const { playTrack } = useAudio();

  const isOwnProfile = user && userId === user.id;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) {
        setError('No user ID provided');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:5000/api/users/profile/${userId}`);
        const data = await response.json();

        if (response.ok) {
          setProfile(data);
          setSortedPosts(data.posts);
          setEditForm({
            username: data.username,
            description: data.description || ''
          });
        } else {
          setError(data.message || 'Failed to fetch profile');
        }
      } catch (error) {
        console.error('Fetch profile error:', error);
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  // Sort posts when sortBy changes
  useEffect(() => {
    if (!profile?.posts) return;

    const sorted = [...profile.posts].sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'most_voted':
          return b._count.votes - a._count.votes;
        case 'most_commented':
          return b._count.comments - a._count.comments;
        case 'most_remixed':
          return b._count.originalRemixes - a._count.originalRemixes;
        case 'title_asc':
          return a.title.localeCompare(b.title);
        case 'title_desc':
          return b.title.localeCompare(a.title);
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    setSortedPosts(sorted);
  }, [profile?.posts, sortBy]);

  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !token) return;

    setUpdating(true);

    try {
      const response = await fetch('http://localhost:5000/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });

      const data = await response.json();

      if (response.ok) {
        setProfile(prev => prev ? {
          ...prev,
          username: data.username,
          description: data.description
        } : null);
        setIsEditing(false);
      } else {
        alert(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      alert('Network error. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handlePlayAudio = (post: any) => {
    if (post.postType === 'AUDIO_FILE' && post.filePath) {
      const audioUrl = `http://localhost:5000/${post.filePath}`;
      playTrack({
        id: post.id,
        title: post.title,
        artist: profile?.username || 'Unknown',
        url: audioUrl,
        postId: post.id
      });
    }
  };

  const handlePlayRemix = (remix: any) => {
    if (remix.remixPost.filePath) {
      const audioUrl = `http://localhost:5000/${remix.remixPost.filePath}`;
      playTrack({
        id: remix.remixPost.id,
        title: remix.remixPost.title,
        artist: profile?.username || 'Unknown',
        url: audioUrl,
        postId: remix.remixPost.id
      });
    }
  };

  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !token) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    setUploadingPhoto(true);

    try {
      const formData = new FormData();
      formData.append('profilePhoto', file);

      const response = await fetch('http://localhost:5000/api/users/profile/photo', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setProfile(prev => prev ? {
          ...prev,
          profilePhoto: data.user.profilePhoto
        } : null);
      } else {
        alert(data.message || 'Failed to upload profile photo');
      }
    } catch (error) {
      console.error('Upload profile photo error:', error);
      alert('Network error. Please try again.');
    } finally {
      setUploadingPhoto(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const handleDeleteProfilePhoto = async () => {
    if (!user || !token) return;

    if (!window.confirm('Are you sure you want to delete your profile photo?')) return;

    try {
      const response = await fetch('http://localhost:5000/api/users/profile/photo', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setProfile(prev => prev ? {
          ...prev,
          profilePhoto: undefined
        } : null);
      } else {
        alert(data.message || 'Failed to delete profile photo');
      }
    } catch (error) {
      console.error('Delete profile photo error:', error);
      alert('Network error. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card text-center">
          <div className="spinner h-12 w-12 mx-auto"></div>
          <p className="text-secondary mt-4">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card text-center">
          <p className="text-red-400">{error || 'Profile not found'}</p>
          <Link to="/" className="btn-secondary mt-4 inline-block">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="card">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              {profile.profilePhoto ? (
                <img
                  src={`http://localhost:5000/${profile.profilePhoto}`}
                  alt={`${profile.username}'s profile`}
                  className="w-20 h-20 rounded-full object-cover border-2 border-slate-600"
                />
              ) : (
                <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-2xl border-2 border-slate-600">
                  {profile.username.charAt(0).toUpperCase()}
                </div>
              )}
              {isOwnProfile && (
                <div className="absolute -bottom-1 -right-1">
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePhotoUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={uploadingPhoto}
                    />
                    <button
                      className="w-8 h-8 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center text-white text-sm transition-colors disabled:opacity-50"
                      disabled={uploadingPhoto}
                      title="Upload profile photo"
                    >
                      {uploadingPhoto ? '⏳' : '📷'}
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-primary">{profile.username}</h1>
              <p className="text-secondary">Member since {formatDate(profile.createdAt)}</p>
              {profile.description && !isEditing && (
                <p className="text-secondary mt-2 max-w-md">{profile.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isOwnProfile && profile.profilePhoto && (
              <button
                onClick={handleDeleteProfilePhoto}
                className="btn-ghost text-red-400 hover:text-red-300 text-sm"
                title="Delete profile photo"
              >
                🗑️
              </button>
            )}
            {isOwnProfile && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="btn-secondary"
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            )}
          </div>
        </div>

        {/* Edit Form */}
        {isEditing && (
          <form onSubmit={handleUpdateProfile} className="mb-6 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
            <div className="space-y-4">
              <div>
                <label className="form-label">
                  Username
                </label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                  className="form-input"
                  maxLength={30}
                  required
                />
              </div>
              <div>
                <label className="form-label">
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  className="form-textarea"
                  rows={3}
                  maxLength={500}
                  placeholder="Tell us about yourself..."
                />
                <p className="text-sm text-muted mt-1">{editForm.description.length}/500 characters</p>
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={updating}
                  className="btn-primary disabled:opacity-50"
                >
                  {updating ? 'Updating...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-700/30 rounded-lg border border-slate-600">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{profile.stats.posts}</div>
            <div className="text-sm text-secondary">Posts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">{profile.stats.remixes}</div>
            <div className="text-sm text-secondary">Remixes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{profile.stats.karmaScore}</div>
            <div className="text-sm text-secondary">Karma</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-400">{profile.stats.remixedFromUser}</div>
            <div className="text-sm text-secondary">Times Remixed</div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="card">
        <div className="flex border-b border-slate-600 mb-6">
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'posts'
                ? 'border-blue-500 text-accent'
                : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            Posts ({profile.stats.posts})
          </button>
          <button
            onClick={() => setActiveTab('remixes')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'remixes'
                ? 'border-blue-500 text-accent'
                : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            Remixes ({profile.stats.remixes})
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'comments'
                ? 'border-blue-500 text-accent'
                : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            Recent Comments ({profile.comments.length})
          </button>
        </div>

        {/* Posts Tab */}
        {activeTab === 'posts' && (
          <div className="space-y-4">
            {profile.posts.length > 0 && (
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-secondary">
                  {sortedPosts.length} post{sortedPosts.length !== 1 ? 's' : ''}
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-secondary">Sort by:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="most_voted">Most Voted</option>
                    <option value="most_commented">Most Commented</option>
                    <option value="most_remixed">Most Remixed</option>
                    <option value="title_asc">Title A-Z</option>
                    <option value="title_desc">Title Z-A</option>
                  </select>
                </div>
              </div>
            )}
            {sortedPosts.length === 0 ? (
              <p className="text-muted text-center py-8">No posts yet.</p>
            ) : (
              sortedPosts.map((post) => (
                <div key={post.id} className="post-card p-6 hover-lift">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {profile?.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-primary">
                          {profile?.username}
                        </div>
                        <p className="text-sm text-muted">{formatDate(post.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted">
                      <span>💬 {post._count.comments}</span>
                      <span>👍 {post._count.votes}</span>
                      <span>🎵 {post._count.originalRemixes}</span>
                    </div>
                  </div>

                  <Link to={`/post/${post.id}`} className="block mb-4">
                    <h3 className="text-xl font-semibold text-primary hover:text-accent mb-2 transition-colors">
                      {post.title}
                    </h3>
                    {post.description && (
                      <p className="text-secondary mb-3">{post.description}</p>
                    )}
                  </Link>

                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags.map((tag) => (
                        <span 
                          key={tag.id}
                          className="tag"
                        >
                          #{tag.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {post.postType === 'AUDIO_FILE' && post.filePath && (
                        <>
                          <button
                            onClick={() => handlePlayAudio(post)}
                            className="btn-primary hover-glow flex items-center space-x-2"
                          >
                            <span>Play</span>
                          </button>
                          <a
                            href={`http://localhost:5000/api/posts/${post.id}/download`}
                            className="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-green-500/25"
                          >
                            <span>Download</span>
                          </a>
                        </>
                      )}
                      {post.postType === 'YOUTUBE_LINK' && (
                        <a
                          href={post.youtubeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-red-500/25"
                        >
                          <span>Watch on YouTube</span>
                        </a>
                      )}
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-muted capitalize">
                        {post.postType.replace('_', ' ').toLowerCase()}
                      </span>
                      <Link
                        to={`/post/${post.id}`}
                        className="flex items-center space-x-1 px-3 py-2 bg-slate-600 hover:bg-slate-500 text-white text-sm rounded-lg transition-all duration-200 hover:shadow-lg"
                      >
                        <span>See More</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Remixes Tab */}
        {activeTab === 'remixes' && (
          <div className="space-y-4">
            {profile.remixes.length === 0 ? (
              <p className="text-muted text-center py-8">No remixes yet.</p>
            ) : (
              profile.remixes.map((remix) => (
                <div key={remix.id} className="post-card p-4 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-500/30 hover-lift">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="px-2 py-1 bg-purple-600/80 text-purple-200 text-xs rounded font-semibold">
                      🎵 REMIX
                    </span>
                    <span className="text-sm text-muted">{formatDate(remix.createdAt)}</span>
                  </div>
                  <Link 
                    to={`/post/${remix.remixPost.id}`}
                    className="text-lg font-semibold text-primary hover:text-accent block mb-2 transition-colors"
                  >
                    {remix.remixPost.title}
                  </Link>
                  <p className="text-sm text-secondary mb-3">
                    Remix of{' '}
                    <Link 
                      to={`/post/${remix.originalPost.id}`}
                      className="text-accent hover:text-blue-300 transition-colors"
                    >
                      "{remix.originalPost.title}"
                    </Link>
                    {' '}by{' '}
                    <Link 
                      to={`/profile/${remix.originalPost.user.id}`}
                      className="text-accent hover:text-blue-300 transition-colors"
                    >
                      {remix.originalPost.user.username}
                    </Link>
                  </p>
                  {remix.remixPost.filePath && (
                    <button
                      onClick={() => handlePlayRemix(remix)}
                      className="flex items-center space-x-1 px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/25"
                    >
                      <span>▶️</span>
                      <span>Play Remix</span>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Comments Tab */}
        {activeTab === 'comments' && (
          <div className="space-y-4">
            {profile.comments.length === 0 ? (
              <p className="text-muted text-center py-8">No recent comments.</p>
            ) : (
              profile.comments.map((comment) => (
                <div key={comment.id} className={`post-card p-4 hover-lift ${
                  comment.isRemix ? 'bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-500/30' : ''
                }`}>
                  <div className="flex items-center space-x-2 mb-2">
                    {comment.isRemix && (
                      <span className="px-2 py-1 bg-purple-600/80 text-purple-200 text-xs rounded font-semibold">
                        🎵 REMIX
                      </span>
                    )}
                    <span className="text-sm text-muted">{formatDate(comment.createdAt)}</span>
                  </div>
                  <p className="text-secondary mb-2">{comment.content}</p>
                  <p className="text-sm text-muted">
                    Comment on{' '}
                    <Link 
                      to={`/post/${comment.post.id}`}
                      className="text-accent hover:text-blue-300 transition-colors"
                    >
                      "{comment.post.title}"
                    </Link>
                    {' '}by{' '}
                    <Link 
                      to={`/profile/${comment.post.user.id}`}
                      className="text-accent hover:text-blue-300 transition-colors"
                    >
                      {comment.post.user.username}
                    </Link>
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
