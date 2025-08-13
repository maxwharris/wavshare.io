import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useAudio } from '../contexts/AudioContext.tsx';
import { useQueue } from '../contexts/QueueContext.tsx';
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
  tags: Array<{
    id: string;
    name: string;
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

  const { user } = useAuth();
  const { playTrack } = useAudio();
  const { addToQueue, isInQueue } = useQueue();

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

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="remix-logo text-6xl mb-4">RemixThis</h1>
        <p className="text-xl text-secondary mb-8">
          A music collaboration platform for sharing and remixing audio content
        </p>
        <div className="flex justify-center space-x-4">
          {user ? (
            <Link to="/create" className="btn-primary">
              Create Post
            </Link>
          ) : (
            <Link to="/register" className="btn-primary">
              Get Started
            </Link>
          )}
          <button 
            className="btn-secondary"
            onClick={() => document.getElementById('posts-section')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Browse Posts
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="card text-center hover-lift">
          <div className="text-4xl mb-4">🎵</div>
          <h3 className="text-xl font-semibold mb-2 text-primary">Share Your Music</h3>
          <p className="text-secondary">
            Upload your original samples or share YouTube links with the community
          </p>
        </div>
        
        <div className="card text-center hover-lift">
          <div className="text-4xl mb-4">🎧</div>
          <h3 className="text-xl font-semibold mb-2 text-primary">Discover & Listen</h3>
          <p className="text-secondary">
            Browse through amazing tracks with seamless audio playback
          </p>
        </div>
        
        <div className="card text-center hover-lift">
          <div className="text-4xl mb-4">🎛️</div>
          <h3 className="text-xl font-semibold mb-2 text-primary">Remix & Collaborate</h3>
          <p className="text-secondary">
            Download tracks, create remixes, and build on others' work
          </p>
        </div>
      </div>

      <div id="posts-section" className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-primary">Recent Posts</h2>
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
        
        {loading && (
          <div className="text-center py-8">
            <div className="spinner h-12 w-12 mx-auto"></div>
            <p className="text-secondary mt-4">Loading posts...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <p className="text-red-400">{error}</p>
            <button 
              onClick={fetchPosts}
              className="btn-secondary mt-4"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && posts.length === 0 && (
          <div className="text-center text-muted py-8">
            <p>No posts yet. Be the first to share your music!</p>
            {user && (
              <Link to="/create" className="btn-primary mt-4 inline-block hover-glow">
                Create First Post
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
                  <div className="mb-3 p-3 bg-purple-600/10 border border-purple-500/30 rounded-lg">
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="text-purple-400">🎵 Remix of:</span>
                      <Link 
                        to={`/post/${post.remixPosts[0].originalPost.id}`}
                        className="text-purple-300 hover:text-purple-200 font-medium transition-colors"
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
                      className="w-24 h-24 object-cover rounded-lg border border-slate-600"
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
                          <span>▶️</span>
                          <span>Play</span>
                        </button>
                        <a
                          href={API_ENDPOINTS.POST_DOWNLOAD(post.id)}
                          className="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-green-500/25"
                        >
                          <span>⬇️</span>
                          <span>Download</span>
                        </a>
                        {user && (
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
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
