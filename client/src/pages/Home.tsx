import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useAudio } from '../contexts/AudioContext.tsx';
import ProfileAvatar from '../components/ProfileAvatar.tsx';

interface Post {
  id: string;
  title: string;
  description?: string;
  postType: 'AUDIO_FILE' | 'YOUTUBE_LINK';
  filePath?: string;
  youtubeUrl?: string;
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

  const { user } = useAuth();
  const { playTrack } = useAudio();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/posts');
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
  };

  const handlePlayAudio = (post: Post) => {
    if (post.postType === 'AUDIO_FILE' && post.filePath) {
      const audioUrl = `http://localhost:5000/${post.filePath}`;
      playTrack({
        id: post.id,
        title: post.title,
        artist: post.user.username,
        url: audioUrl,
        postId: post.id
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
        <h2 className="text-2xl font-bold mb-6 text-primary">Recent Posts</h2>
        
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
                          <span>▶️</span>
                          <span>Play</span>
                        </button>
                        <a
                          href={`http://localhost:5000/api/posts/${post.id}/download`}
                          className="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-green-500/25"
                        >
                          <span>⬇️</span>
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
                        <span>📺</span>
                        <span>Watch on YouTube</span>
                      </a>
                    )}
                  </div>
                  <span className="text-sm text-muted capitalize">
                    {post.postType.replace('_', ' ').toLowerCase()}
                  </span>
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
