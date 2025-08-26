import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useAudio } from '../contexts/AudioContext.tsx';
import { useQueue } from '../contexts/QueueContext.tsx';
import { usePlaylist } from '../contexts/PlaylistContext.tsx';
import { useToast } from '../contexts/ToastContext.tsx';
import ProfileAvatar from '../components/ProfileAvatar.tsx';
import { API_ENDPOINTS, buildServerUrl } from '../config/api';

interface Post {
  id: string;
  title: string;
  description?: string;
  postType: 'AUDIO_FILE' | 'YOUTUBE_LINK';
  filePath?: string;
  youtubeUrl?: string;
  coverArt?: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    profilePhoto?: string;
  };
  postTags: Array<{
    tag: {
      id: string;
      name: string;
    };
  }>;
  remixPosts?: Array<{
    originalPost: {
      id: string;
      title: string;
      user: {
        id: string;
        username: string;
      };
    };
  }>;
  _count: {
    votes: number;
    comments: number;
    originalRemixes: number;
  };
}

const Home: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('most_remixed');
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const { user } = useAuth();
  const { playTrack } = useAudio();
  const { addToQueue, addToQueueNext, isInQueue } = useQueue();
  const { playlists, addTrackToPlaylist, removeTrackFromPlaylist, isTrackInPlaylist } = usePlaylist();
  const { showNotification } = useToast();

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.POSTS}?sortBy=${sortBy}`);
      const data = await response.json();

      if (response.ok) {
        setPosts(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch posts');
      }
    } catch (error) {
      console.error('Fetch posts error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [sortBy]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy);
  };

  const handlePlayAudio = (post: Post) => {
    if (post.postType === 'AUDIO_FILE' && post.filePath) {
      const audioUrl = buildServerUrl(post.filePath);
      playTrack({
        id: post.id,
        title: post.title,
        artist: post.user.username,
        url: audioUrl,
        postId: post.id,
        userId: post.user.id
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handlePlaylistToggle = async (playlistId: string, postId: string) => {
    try {
      const isInPlaylist = isTrackInPlaylist(playlistId, postId);
      
      if (isInPlaylist) {
        await removeTrackFromPlaylist(playlistId, postId);
        showNotification('Track removed from playlist', 'success');
      } else {
        await addTrackToPlaylist(playlistId, postId);
        showNotification('Track added to playlist', 'success');
      }
    } catch (error) {
      console.error('Playlist toggle error:', error);
      showNotification(error instanceof Error ? error.message : 'Failed to update playlist', 'error');
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="remix-logo text-6xl mb-4">wavshare</h1>
        <p className="text-xl text-secondary mb-8">
          a music collaboration platform for sharing and remixing audio content
        </p>
        <div className="flex justify-center space-x-4">
          {user ? (
            <Link to="/create" className="btn-primary">
              create post
            </Link>
          ) : (
            <Link to="/register" className="btn-primary">
              get started
            </Link>
          )}
          <button 
            className="btn-secondary"
            onClick={() => document.getElementById('posts-section')?.scrollIntoView({ behavior: 'smooth' })}
          >
            browse posts
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="card text-center hover-lift">
          <div className="text-4xl mb-4">🎵</div>
          <h3 className="text-xl font-semibold mb-2 text-primary">share your music</h3>
          <p className="text-secondary">
            upload your original samples or share youtube links with the community
          </p>
        </div>
        
        <div className="card text-center hover-lift">
          <div className="text-4xl mb-4">🎧</div>
          <h3 className="text-xl font-semibold mb-2 text-primary">discover & listen</h3>
          <p className="text-secondary">
            browse through amazing tracks with seamless audio playback
          </p>
        </div>
        
        <div className="card text-center hover-lift">
          <div className="text-4xl mb-4">🎛️</div>
          <h3 className="text-xl font-semibold mb-2 text-primary">remix & collaborate</h3>
          <p className="text-secondary">
            download tracks, create remixes, and build on others' work
          </p>
        </div>
      </div>

      <div id="posts-section" className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-primary">recent posts</h2>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-secondary">sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="form-select"
            >
              <option value="newest">newest first</option>
              <option value="oldest">oldest first</option>
              <option value="most_voted">most voted</option>
              <option value="most_commented">most commented</option>
              <option value="most_remixed">most remixed</option>
              <option value="title_asc">title a-z</option>
              <option value="title_desc">title z-a</option>
            </select>
          </div>
        </div>
        
        {loading && (
          <div className="text-center py-8">
            <div className="spinner h-12 w-12 mx-auto"></div>
            <p className="text-secondary mt-4">loading posts...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <p className="text-red-500">{error}</p>
            <button 
              onClick={fetchPosts}
              className="btn-secondary mt-4"
            >
              try again
            </button>
          </div>
        )}

        {!loading && !error && posts.length === 0 && (
          <div className="text-center text-muted py-8">
            <p>no posts yet. be the first to share your music!</p>
            {user && (
              <Link to="/create" className="btn-primary mt-4 inline-block hover-glow">
                create first post
              </Link>
            )}
          </div>
        )}

        {!loading && !error && posts.length > 0 && (
          <div className="space-y-6">
            {posts.map((post) => (
              <div key={post.id} className="post-card p-6 hover-lift">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <ProfileAvatar user={post.user} size="lg" />
                    <div>
                      <Link 
                        to={`/profile/${post.user.id}`}
                        className="font-semibold text-primary hover:text-accent transition-colors"
                      >
                        {post.user.username}
                      </Link>
                      <p className="text-sm text-muted">{formatDate(post.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-muted">
                    <span>💬 {post._count.comments}</span>
                    <span>👍 {post._count.votes}</span>
                    <span>🎵 {post._count.originalRemixes}</span>
                  </div>
                </div>

                {/* Show remix information if this is a remix */}
                {post.remixPosts && post.remixPosts.length > 0 && (
                  <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="text-emerald-600">🎵 remix of:</span>
                      <Link 
                        to={`/post/${post.remixPosts[0].originalPost.id}`}
                        className="text-emerald-700 hover:text-emerald-800 font-medium transition-colors"
                      >
                        "{post.remixPosts[0].originalPost.title}" by {post.remixPosts[0].originalPost.user.username}
                      </Link>
                    </div>
                  </div>
                )}

                <div className="flex gap-4 mb-4">
                  {/* Cover Art */}
                  <div className="flex-shrink-0">
                    <img
                      src={post.coverArt ? buildServerUrl(post.coverArt) : buildServerUrl('uploads/covers/default.gif')}
                      alt={`Cover art for ${post.title}`}
                      className="w-24 h-24 object-cover rounded-lg border border-gray-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = buildServerUrl('uploads/covers/default.gif');
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
                        <div className="flex items-center space-x-1 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                          <span className="font-semibold">bpm:</span>
                          <span>{post.postTags.find(postTag => postTag.tag.name.startsWith('bpm:'))?.tag.name.replace('bpm:', '')}</span>
                        </div>
                      )}
                      {post.postTags.find(postTag => postTag.tag.name.startsWith('key:')) && (
                        <div className="flex items-center space-x-1 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                          <span className="font-semibold">key:</span>
                          <span>{post.postTags.find(postTag => postTag.tag.name.startsWith('key:'))?.tag.name.replace('key:', '')}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {post.postType === 'AUDIO_FILE' && post.filePath && (
                      <>
                        <button
                          onClick={() => handlePlayAudio(post)}
                          className="btn-primary hover-glow flex items-center space-x-2"
                        >
                          <span>play</span>
                        </button>
                        <a
                          href={API_ENDPOINTS.POST_DOWNLOAD(post.id)}
                          className="flex items-center space-x-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/25"
                        >
                          <span>download</span>
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
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-lg hover:shadow-emerald-500/25'
                              }`}
                            >
                              <span>{isInQueue(post.id) ? 'in queue' : 'play next'}</span>
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
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  : 'bg-emerald-700 hover:bg-emerald-600 text-white hover:shadow-lg hover:shadow-emerald-600/25'
                              }`}
                            >
                              <span>{isInQueue(post.id) ? 'in queue' : 'add to queue'}</span>
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
                        <span>watch on youtube</span>
                      </a>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-muted capitalize">
                      {post.postType.replace('_', ' ').toLowerCase()}
                    </span>
                    <Link
                      to={`/post/${post.id}`}
                      className="flex items-center space-x-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm rounded-lg transition-all duration-200 hover:shadow-lg"
                    >
                      <span>see more</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Playlist Modal */}
      {showPlaylistModal && selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-96 overflow-y-auto shadow-xl border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">add to playlist</h2>
              <button
                onClick={() => {
                  setShowPlaylistModal(false);
                  setSelectedPost(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-medium text-gray-800 truncate">{selectedPost.title}</h3>
              <p className="text-sm text-gray-600">by {selectedPost.user.username}</p>
            </div>

            {playlists.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">you don't have any playlists yet.</p>
                <Link
                  to="/playlists"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  onClick={() => {
                    setShowPlaylistModal(false);
                    setSelectedPost(null);
                  }}
                >
                  create your first playlist
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {playlists.map((playlist) => {
                  const isInPlaylist = isTrackInPlaylist(playlist.id, selectedPost.id);
                  return (
                    <div
                      key={playlist.id}
                      className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800 truncate">{playlist.name}</h4>
                        <p className="text-sm text-gray-600">
                          {playlist.tracks?.length || 0} track{(playlist.tracks?.length || 0) !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => handlePlaylistToggle(playlist.id, selectedPost.id)}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          isInPlaylist
                            ? 'bg-red-500 hover:bg-red-600 text-white'
                            : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                        }`}
                      >
                        {isInPlaylist ? 'remove' : 'add'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setShowPlaylistModal(false);
                  setSelectedPost(null);
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
