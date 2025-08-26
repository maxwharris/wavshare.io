import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useAudio } from '../contexts/AudioContext.tsx';
import { useQueue } from '../contexts/QueueContext.tsx';
import { usePlaylist } from '../contexts/PlaylistContext.tsx';
import { useToast } from '../contexts/ToastContext.tsx';
import ProfileAvatar from '../components/ProfileAvatar.tsx';
import { API_ENDPOINTS, API_CONFIG } from '../config/api';

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
    coverArt?: string;
    createdAt: string;
    postTags: Array<{
      tag: {
        id: string;
        name: string;
      };
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
  const [activeTab, setActiveTab] = useState<'posts' | 'remixes' | 'comments' | 'upvoted' | 'playlists'>('posts');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    description: ''
  });
  const [updating, setUpdating] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [sortBy, setSortBy] = useState('most_remixed');
  const [sortedPosts, setSortedPosts] = useState<UserProfile['posts']>([]);
  const [upvotedPosts, setUpvotedPosts] = useState<any[]>([]);
  const [upvotedLoading, setUpvotedLoading] = useState(false);
  const [showCreatePlaylistModal, setShowCreatePlaylistModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [profilePlaylists, setProfilePlaylists] = useState<any[]>([]);
  const [profilePlaylistsLoading, setProfilePlaylistsLoading] = useState(false);

  const { user, token } = useAuth();
  const { playTrack } = useAudio();
  const { addToQueue, addToQueueNext, isInQueue } = useQueue();
  const { playlists: userPlaylists, loading: userPlaylistsLoading, createPlaylist, deletePlaylist, addPlaylistToQueue } = usePlaylist();
  const { showNotification } = useToast();

  const isOwnProfile = user && userId === user.id;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) {
        setError('No user ID provided');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(API_ENDPOINTS.USER_PROFILE_BY_ID(userId));
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

  const fetchUpvotedPosts = async () => {
    if (!userId) return;

    setUpvotedLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.USER_UPVOTED_POSTS(userId));
      const data = await response.json();

      if (response.ok) {
        setUpvotedPosts(data.data || []);
      } else {
        console.error('Failed to fetch upvoted posts:', data.message);
        setUpvotedPosts([]);
      }
    } catch (error) {
      console.error('Fetch upvoted posts error:', error);
      setUpvotedPosts([]);
    } finally {
      setUpvotedLoading(false);
    }
  };

  // Fetch upvoted posts when the upvoted tab is selected
  useEffect(() => {
    if (activeTab === 'upvoted' && userId && upvotedPosts.length === 0) {
      fetchUpvotedPosts();
    }
  }, [activeTab, userId, fetchUpvotedPosts, upvotedPosts.length]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !token) return;

    setUpdating(true);

    try {
      const response = await fetch(API_ENDPOINTS.USER_PROFILE, {
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
      const audioUrl = `${API_CONFIG.SERVER_URL}/${post.filePath}`;
      playTrack({
        id: post.id,
        title: post.title,
        artist: profile?.username || 'Unknown',
        url: audioUrl,
        postId: post.id,
        userId: profile?.id || '',
        coverArt: post.coverArt
      });
    }
  };

  const handlePlayRemix = (remix: any) => {
    if (remix.remixPost.filePath) {
      const audioUrl = `${API_CONFIG.SERVER_URL}/${remix.remixPost.filePath}`;
      playTrack({
        id: remix.remixPost.id,
        title: remix.remixPost.title,
        artist: profile?.username || 'Unknown',
        url: audioUrl,
        postId: remix.remixPost.id,
        userId: profile?.id || ''
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

      const response = await fetch(API_ENDPOINTS.USER_PROFILE_PHOTO, {
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
      const response = await fetch(API_ENDPOINTS.USER_PROFILE_PHOTO, {
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

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPlaylistName.trim()) {
      showNotification('Playlist name is required', 'error');
      return;
    }

    setIsCreatingPlaylist(true);
    try {
      await createPlaylist({
        name: newPlaylistName.trim(),
        description: newPlaylistDescription.trim() || undefined
      });
      
      showNotification('Playlist created successfully!', 'success');
      setShowCreatePlaylistModal(false);
      setNewPlaylistName('');
      setNewPlaylistDescription('');
    } catch (error) {
      console.error('Create playlist error:', error);
      showNotification(error instanceof Error ? error.message : 'Failed to create playlist', 'error');
    } finally {
      setIsCreatingPlaylist(false);
    }
  };

  const fetchProfilePlaylists = async () => {
    if (!userId) return;

    setProfilePlaylistsLoading(true);
    try {
      // Fetch playlists for any user using the public endpoint
      const response = await fetch(API_ENDPOINTS.PLAYLISTS_BY_USER(userId));
      const data = await response.json();

      if (response.ok) {
        setProfilePlaylists(data.playlists || []);
      } else {
        console.error('Failed to fetch playlists:', data.message);
        setProfilePlaylists([]);
      }
    } catch (error) {
      console.error('Fetch profile playlists error:', error);
      setProfilePlaylists([]);
    } finally {
      setProfilePlaylistsLoading(false);
    }
  };

  // Fetch playlists when playlists tab is selected
  useEffect(() => {
    if (activeTab === 'playlists' && userId) {
      fetchProfilePlaylists();
    }
  }, [activeTab, userId, userPlaylists, isOwnProfile]);

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
    <div className="max-w-4xl mx-auto space-y-6 navbar-spacing audio-player-spacing">
      {/* Profile Header */}
      <div className="card">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              {profile.profilePhoto ? (
                <img
                  src={`${API_CONFIG.SERVER_URL}/${profile.profilePhoto}`}
                  alt={`${profile.username}'s profile`}
                  className="w-20 h-20 rounded-full object-cover border-2 border-slate-600"
                />
              ) : (
                  <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-2xl border-2 border-emerald-300">
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
                      className="w-8 h-8 bg-emerald-600 hover:bg-emerald-700 rounded-full flex items-center justify-center text-white text-sm transition-colors disabled:opacity-50"
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

        {/* Enhanced Stats with Social Proof */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 bg-gray-50 rounded-xl border border-gray-200">
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-600 mb-1">{profile.stats.posts}</div>
            <div className="text-sm text-secondary font-medium">posts</div>
            {profile.stats.posts > 10 && (
              <div className="mt-1">
                <span className="popular-indicator">prolific</span>
              </div>
            )}
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-700 mb-1">{profile.stats.remixes}</div>
            <div className="text-sm text-secondary font-medium">remixes</div>
            {profile.stats.remixes > 5 && (
              <div className="mt-1">
                <span className="trending-indicator">creative</span>
              </div>
            )}
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-500 mb-1">{profile.stats.karmaScore}</div>
            <div className="text-sm text-secondary font-medium">karma</div>
            {profile.stats.karmaScore > 100 && (
              <div className="mt-1">
                <span className="new-indicator">respected</span>
              </div>
            )}
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-800 mb-1">{profile.stats.remixedFromUser}</div>
            <div className="text-sm text-secondary font-medium">times remixed</div>
            {profile.stats.remixedFromUser > 20 && (
              <div className="mt-1">
                <span className="popular-indicator">influential</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="card">
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'posts'
                ? 'border-emerald-500 text-accent'
                : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            posts ({profile.stats.posts})
          </button>
          <button
            onClick={() => setActiveTab('remixes')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'remixes'
                ? 'border-emerald-500 text-accent'
                : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            remixes ({profile.stats.remixes})
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'comments'
                ? 'border-emerald-500 text-accent'
                : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            recent comments ({profile.comments.length})
          </button>
          <button
            onClick={() => setActiveTab('upvoted')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'upvoted'
                ? 'border-emerald-500 text-accent'
                : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            upvoted ({upvotedPosts.length})
          </button>
          <button
            onClick={() => setActiveTab('playlists')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'playlists'
                ? 'border-emerald-500 text-accent'
                : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            playlists
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
                    className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                <Link key={post.id} to={`/post/${post.id}`} className="block">
                  <div className="post-card p-6 hover-lift cursor-pointer">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <ProfileAvatar user={profile} size="md" />
                        <div>
                          <div className="font-semibold text-primary">
                            {profile?.username}
                          </div>
                          <p className="text-sm text-muted">{formatDate(post.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-1 text-gray-600">
                          <span>💬</span>
                          <span className="font-medium">{post._count.comments}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button className="vote-button-up">
                            <span>👍</span>
                          </button>
                          <span className="font-medium text-green-600">{post._count.votes}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-purple-600">
                          <span>🎵</span>
                          <span className="font-medium">{post._count.originalRemixes}</span>
                        </div>
                        {post._count.originalRemixes > 10 && (
                          <span className="trending-indicator">trending</span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-4 mb-4">
                      {/* Cover Art Thumbnail */}
                      <div className="flex-shrink-0">
                        <img
                          src={post.coverArt ? `${API_CONFIG.SERVER_URL}/${post.coverArt}` : `${API_CONFIG.SERVER_URL}/uploads/covers/default.gif`}
                          alt={`Cover art for ${post.title}`}
                          className="w-16 h-16 object-cover rounded-lg border border-slate-600 shadow-md"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `${API_CONFIG.SERVER_URL}/uploads/covers/default.gif`;
                          }}
                        />
                      </div>
                      
                      {/* Post Content */}
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-primary hover:text-accent mb-2 transition-colors">
                          {post.title}
                        </h3>
                        {post.description && (
                          <p className="text-secondary mb-3">{post.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Tags, BPM, and Key */}
                    <div className="mb-4">
                      {/* Regular Tags */}
                      {post.postTags.filter(postTag => !postTag.tag.name.startsWith('bpm:') && !postTag.tag.name.startsWith('key:')).length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {post.postTags
                            .filter(postTag => !postTag.tag.name.startsWith('bpm:') && !postTag.tag.name.startsWith('key:'))
                            .map((postTag) => (
                              <span 
                                key={postTag.tag.id}
                                className="tag"
                              >
                                #{postTag.tag.name}
                              </span>
                            ))}
                        </div>
                      )}
                      
                      {/* BPM and Key Info */}
                      {(post.postTags.find(postTag => postTag.tag.name.startsWith('bpm:')) || post.postTags.find(postTag => postTag.tag.name.startsWith('key:'))) && (
                        <div className="flex flex-wrap gap-2 text-sm">
                          {post.postTags.find(postTag => postTag.tag.name.startsWith('bpm:')) && (
                            <div className="flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 rounded-full border border-blue-300 shadow-sm">
                              <span className="font-bold text-xs">BPM</span>
                              <span className="font-mono font-bold">{post.postTags.find(postTag => postTag.tag.name.startsWith('bpm:'))?.tag.name.replace('bpm:', '')}</span>
                            </div>
                          )}
                          {post.postTags.find(postTag => postTag.tag.name.startsWith('key:')) && (
                            <div className="flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-purple-50 to-purple-100 text-purple-800 rounded-full border border-purple-300 shadow-sm">
                              <span className="font-bold text-xs">KEY</span>
                              <span className="font-mono font-bold">{post.postTags.find(postTag => postTag.tag.name.startsWith('key:'))?.tag.name.replace('key:', '')}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center space-x-3">
                        {post.postType === 'AUDIO_FILE' && post.filePath && (
                          <>
                            <button
                              onClick={() => handlePlayAudio(post)}
                              className="btn-primary hover-glow flex items-center justify-center px-4 py-2 min-w-[80px]"
                            >
                              <span>Play</span>
                            </button>
                            <a
                              href={API_ENDPOINTS.POST_DOWNLOAD(post.id)}
                              className="flex items-center justify-center px-4 py-2 min-w-[80px] bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all duration-200 hover:shadow-lg border border-emerald-500"
                            >
                              <span>Download</span>
                            </a>
                            {user && (
                              <>
                                <button
                                  onClick={async () => {
                                    try {
                                      await addToQueueNext(post.id);
                                    } catch (error) {
                                      alert(error instanceof Error ? error.message : 'Failed to add to queue next');
                                    }
                                  }}
                                  disabled={isInQueue(post.id)}
                                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 border ${
                                    isInQueue(post.id)
                                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-400'
                                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:shadow-lg border-emerald-500'
                                  }`}
                                >
                                  <span>{isInQueue(post.id) ? 'In Queue' : 'Play Next'}</span>
                                </button>
                                <button
                                  onClick={async () => {
                                    try {
                                      await addToQueue(post.id);
                                    } catch (error) {
                                      alert(error instanceof Error ? error.message : 'Failed to add to queue');
                                    }
                                  }}
                                  disabled={isInQueue(post.id)}
                                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 border ${
                                    isInQueue(post.id)
                                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-400'
                                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:shadow-lg border-emerald-500'
                                  }`}
                                >
                                  <span>{isInQueue(post.id) ? 'In Queue' : 'Add to Queue'}</span>
                                </button>
                              </>
                            )}
                          </>
                        )}
                        {post.postType === 'YOUTUBE_LINK' && (
                          <a
                            href={post.youtubeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-red-500/25"
                          >
                            <span>📺</span>
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
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span>See More</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </Link>
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
                      className="text-accent hover:text-emerald-300 transition-colors"
                    >
                      "{remix.originalPost.title}"
                    </Link>
                    {' '}by{' '}
                    <Link 
                      to={`/profile/${remix.originalPost.user.id}`}
                      className="text-accent hover:text-emerald-300 transition-colors"
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
                      className="text-accent hover:text-emerald-300 transition-colors"
                    >
                      "{comment.post.title}"
                    </Link>
                    {' '}by{' '}
                    <Link 
                      to={`/profile/${comment.post.user.id}`}
                      className="text-accent hover:text-emerald-300 transition-colors"
                    >
                      {comment.post.user.username}
                    </Link>
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Upvoted Tab */}
        {activeTab === 'upvoted' && (
          <div className="space-y-4">
            {upvotedLoading ? (
              <div className="text-center py-8">
                <div className="spinner h-8 w-8 mx-auto"></div>
                <p className="text-secondary mt-2">Loading upvoted posts...</p>
              </div>
            ) : upvotedPosts.length === 0 ? (
              <p className="text-muted text-center py-8">No upvoted posts yet.</p>
            ) : (
              <>
                <div className="text-sm text-secondary mb-4">
                  {upvotedPosts.length} upvoted post{upvotedPosts.length !== 1 ? 's' : ''}
                </div>
                {upvotedPosts.map((post) => (
                  <div key={post.id} className="post-card p-6 hover-lift bg-gradient-to-r from-green-900/10 to-blue-900/10 border-green-500/20">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <ProfileAvatar user={post.user} size="md" />
                        <div>
                          <div className="font-semibold text-primary">
                            {post.user?.username}
                          </div>
                          <p className="text-sm text-muted">
                            Posted {formatDate(post.createdAt)}
                            {post.upvotedAt && (
                              <span className="text-green-400 ml-2">
                                • Upvoted {formatDate(post.upvotedAt)}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted">
                        <span>💬 {post._count.comments}</span>
                        <span className="text-green-400">👍 {post._count.votes}</span>
                        <span>🎵 {post._count.originalRemixes}</span>
                      </div>
                    </div>

                    <div className="flex gap-4 mb-4">
                      {/* Cover Art Thumbnail */}
                      <div className="flex-shrink-0">
                        <img
                          src={post.coverArt ? `${API_CONFIG.SERVER_URL}/${post.coverArt}` : `${API_CONFIG.SERVER_URL}/uploads/covers/default.gif`}
                          alt={`Cover art for ${post.title}`}
                          className="w-16 h-16 object-cover rounded-lg border border-slate-600 shadow-md"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `${API_CONFIG.SERVER_URL}/uploads/covers/default.gif`;
                          }}
                        />
                      </div>
                      
                      {/* Post Content */}
                      <div className="flex-1">
                        <Link to={`/post/${post.id}`} className="block">
                          <h3 className="text-xl font-semibold text-primary hover:text-accent mb-2 transition-colors">
                            {post.title}
                          </h3>
                          {post.description && (
                            <p className="text-secondary mb-3">{post.description}</p>
                          )}
                        </Link>
                      </div>
                    </div>

                    {/* Tags, BPM, and Key for upvoted posts */}
                    {post.postTags && post.postTags.length > 0 && (
                      <div className="mb-4">
                        {/* Regular Tags */}
                        {post.postTags.filter((postTag: any) => !postTag.tag.name.startsWith('bpm:') && !postTag.tag.name.startsWith('key:')).length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {post.postTags
                              .filter((postTag: any) => !postTag.tag.name.startsWith('bpm:') && !postTag.tag.name.startsWith('key:'))
                              .map((postTag: any) => (
                                <span 
                                  key={postTag.tag.id}
                                  className="tag"
                                >
                                  #{postTag.tag.name}
                                </span>
                              ))}
                          </div>
                        )}
                        
                        {/* BPM and Key Info */}
                        {(post.postTags.find((postTag: any) => postTag.tag.name.startsWith('bpm:')) || post.postTags.find((postTag: any) => postTag.tag.name.startsWith('key:'))) && (
                          <div className="flex flex-wrap gap-2 text-sm">
                            {post.postTags.find((postTag: any) => postTag.tag.name.startsWith('bpm:')) && (
                              <div className="flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 rounded-full border border-blue-300 shadow-sm">
                                <span className="text-xs">🎵</span>
                                <span className="font-bold text-xs">BPM</span>
                                <span className="font-mono font-bold">{post.postTags.find((postTag: any) => postTag.tag.name.startsWith('bpm:'))?.tag.name.replace('bpm:', '')}</span>
                              </div>
                            )}
                            {post.postTags.find((postTag: any) => postTag.tag.name.startsWith('key:')) && (
                              <div className="flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-purple-50 to-purple-100 text-purple-800 rounded-full border border-purple-300 shadow-sm">
                                <span className="text-xs">🎹</span>
                                <span className="font-bold text-xs">KEY</span>
                                <span className="font-mono font-bold">{post.postTags.find((postTag: any) => postTag.tag.name.startsWith('key:'))?.tag.name.replace('key:', '')}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {post.postType === 'AUDIO_FILE' && post.filePath && (
                          <>
                            <button
                              onClick={() => handlePlayAudio(post)}
                              className="btn-primary hover-glow flex items-center justify-center px-4 py-2 min-w-[80px]"
                            >
                              <span>▶️</span>
                              <span>Play</span>
                            </button>
                            <a
                              href={API_ENDPOINTS.POST_DOWNLOAD(post.id)}
                              className="flex items-center justify-center px-4 py-2 min-w-[80px] bg-green-600 hover:bg-green-500 text-white rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-green-500/25"
                            >
                              <span>⬇️</span>
                              <span>Download</span>
                            </a>
                            {user && (
                              <>
                                <button
                                  onClick={async () => {
                                    try {
                                      await addToQueueNext(post.id);
                                    } catch (error) {
                                      alert(error instanceof Error ? error.message : 'Failed to add to queue next');
                                    }
                                  }}
                                  disabled={isInQueue(post.id)}
                                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                                    isInQueue(post.id)
                                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                      : 'bg-orange-600 hover:bg-orange-500 text-white hover:shadow-lg hover:shadow-orange-500/25'
                                  }`}
                                >
                                  <span>⏭️</span>
                                  <span>{isInQueue(post.id) ? 'In Queue' : 'Play Next'}</span>
                                </button>
                                <button
                                  onClick={async () => {
                                    try {
                                      await addToQueue(post.id);
                                    } catch (error) {
                                      alert(error instanceof Error ? error.message : 'Failed to add to queue');
                                    }
                                  }}
                                  disabled={isInQueue(post.id)}
                                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                                    isInQueue(post.id)
                                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                      : 'bg-purple-600 hover:bg-purple-500 text-white hover:shadow-lg hover:shadow-purple-500/25'
                                  }`}
                                >
                                  <span>📋</span>
                                  <span>{isInQueue(post.id) ? 'In Queue' : 'Add to Queue'}</span>
                                </button>
                              </>
                            )}
                          </>
                        )}
                        {post.postType === 'YOUTUBE_LINK' && (
                          <a
                            href={post.youtubeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-red-500/25"
                          >
                            <span>📺</span>
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
                ))}
              </>
            )}
          </div>
        )}

        {/* Playlists Tab */}
        {activeTab === 'playlists' && (
          <div className="space-y-4">
            {profilePlaylistsLoading ? (
              <div className="text-center py-8">
                <div className="spinner h-8 w-8 mx-auto"></div>
                <p className="text-secondary mt-2">Loading playlists...</p>
              </div>
            ) : profilePlaylists.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎵</div>
                <h3 className="text-xl font-bold text-white mb-4">No playlists yet</h3>
                <p className="text-secondary mb-6">Create your first playlist to start organizing your favorite tracks</p>
                <button
                  onClick={() => setShowCreatePlaylistModal(true)}
                  className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Create Your First Playlist
                </button>
              </div>
            ) : (
              <>
                <div className="text-sm text-secondary mb-4">
                  {profilePlaylists.length} playlist{profilePlaylists.length !== 1 ? 's' : ''}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profilePlaylists.map((playlist) => (
                    <div key={playlist.id} className="bg-slate-800 rounded-lg p-4 hover:bg-slate-700 transition-colors">
                      {/* Playlist Cover */}
                      <div className="w-full h-32 bg-slate-700 rounded-lg mb-3 flex items-center justify-center">
                        {playlist.coverImage ? (
                          <img
                            src={playlist.coverImage}
                            alt={playlist.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <div className="text-4xl text-slate-500">🎵</div>
                        )}
                      </div>

                      {/* Playlist Info */}
                      <div className="mb-3">
                        <Link 
                          to={`/playlist/${playlist.id}`}
                          className="block hover:text-primary transition-colors"
                        >
                          <h4 className="text-lg font-bold text-white mb-1 truncate hover:text-primary transition-colors">{playlist.name}</h4>
                        </Link>
                        {playlist.description && (
                          <p className="text-secondary text-sm mb-2 line-clamp-2">{playlist.description}</p>
                        )}
                        <p className="text-xs text-slate-400">
                          {playlist.tracks?.length || 0} track{(playlist.tracks?.length || 0) !== 1 ? 's' : ''} • Created {formatDate(playlist.createdAt)}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            try {
                              const result = await addPlaylistToQueue(playlist.id, { shuffle: false, playNext: false });
                              showNotification(result.message, 'success');
                            } catch (error) {
                              console.error('Add playlist to queue error:', error);
                              const errorMessage = error instanceof Error ? error.message : 'Failed to add playlist to queue';
                              // Handle "already in queue" as a warning instead of error
                              if (errorMessage.includes('already in your queue')) {
                                showNotification(errorMessage, 'warning');
                              } else {
                                showNotification(errorMessage, 'error');
                              }
                            }
                          }}
                          disabled={(playlist.tracks?.length || 0) === 0}
                          className="flex-1 bg-primary hover:bg-primary-dark disabled:bg-slate-600 disabled:cursor-not-allowed text-white py-2 px-3 rounded text-sm font-medium transition-colors"
                        >
                          Play
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const result = await addPlaylistToQueue(playlist.id, { shuffle: true, playNext: false });
                              showNotification(result.message, 'success');
                            } catch (error) {
                              console.error('Add playlist to queue error:', error);
                              const errorMessage = error instanceof Error ? error.message : 'Failed to add playlist to queue';
                              // Handle "already in queue" as a warning instead of error
                              if (errorMessage.includes('already in your queue')) {
                                showNotification(errorMessage, 'warning');
                              } else {
                                showNotification(errorMessage, 'error');
                              }
                            }
                          }}
                          disabled={(playlist.tracks?.length || 0) === 0}
                          className="flex-1 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white py-2 px-3 rounded text-sm font-medium transition-colors"
                        >
                          Shuffle
                        </button>
                        <button
                          onClick={async () => {
                            if (!window.confirm(`Are you sure you want to delete "${playlist.name}"? This action cannot be undone.`)) {
                              return;
                            }
                            try {
                              await deletePlaylist(playlist.id);
                              showNotification('Playlist deleted successfully', 'success');
                            } catch (error) {
                              console.error('Delete playlist error:', error);
                              showNotification(error instanceof Error ? error.message : 'Failed to delete playlist', 'error');
                            }
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded text-sm font-medium transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Create Playlist Modal */}
      {showCreatePlaylistModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-white mb-4">Create New Playlist</h2>
            
            <form onSubmit={handleCreatePlaylist}>
              <div className="mb-4">
                <label htmlFor="playlistName" className="block text-sm font-medium text-secondary mb-2">
                  Playlist Name *
                </label>
                <input
                  type="text"
                  id="playlistName"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter playlist name"
                  maxLength={100}
                  required
                />
              </div>

              <div className="mb-6">
                <label htmlFor="playlistDescription" className="block text-sm font-medium text-secondary mb-2">
                  Description (Optional)
                </label>
                <textarea
                  id="playlistDescription"
                  value={newPlaylistDescription}
                  onChange={(e) => setNewPlaylistDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  placeholder="Describe your playlist"
                  rows={3}
                  maxLength={500}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreatePlaylistModal(false);
                    setNewPlaylistName('');
                    setNewPlaylistDescription('');
                  }}
                  className="flex-1 bg-slate-600 hover:bg-slate-500 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingPlaylist || !newPlaylistName.trim()}
                  className="flex-1 bg-primary hover:bg-primary-dark disabled:bg-slate-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  {isCreatingPlaylist ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
