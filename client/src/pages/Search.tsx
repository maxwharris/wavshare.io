import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useAudio } from '../contexts/AudioContext.tsx';
import { useQueue } from '../contexts/QueueContext.tsx';
import ProfileAvatar from '../components/ProfileAvatar.tsx';
import { API_ENDPOINTS, buildServerUrl } from '../config/api';

interface SearchResults {
  posts: Array<{
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
    _count: {
      votes: number;
      comments: number;
      originalRemixes: number;
    };
  }>;
  users: Array<{
    id: string;
    username: string;
    profilePhoto?: string;
    description?: string;
    createdAt: string;
    _count: {
      posts: number;
      remixes: number;
    };
  }>;
  tags: Array<{
    id: string;
    name: string;
    _count: {
      posts: number;
    };
  }>;
}

const Search: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'users' | 'tags'>('posts');
  const [bpmMin, setBpmMin] = useState('');
  const [bpmMax, setBpmMax] = useState('');
  const [selectedKey, setSelectedKey] = useState('');

  const { user } = useAuth();
  const { playTrack } = useAudio();
  const { addToQueue, addToQueueNext, isInQueue } = useQueue();

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() && !bpmMin && !bpmMax && !selectedKey) {
      setResults(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) {
        params.append('q', searchQuery.trim());
      }
      if (bpmMin) {
        params.append('bpmMin', bpmMin);
      }
      if (bpmMax) {
        params.append('bpmMax', bpmMax);
      }
      if (selectedKey) {
        params.append('key', selectedKey);
      }

      const response = await fetch(`${API_ENDPOINTS.SEARCH}?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setResults(data);
      } else {
        setError(data.message || 'Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [bpmMin, bpmMax, selectedKey]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(query);
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [query, handleSearch]);

  const handlePlayAudio = (post: any) => {
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

  // Filter posts by BPM range on the client side
  const getFilteredPosts = () => {
    if (!results?.posts) return [];
    
    let filteredPosts = results.posts;
    
    // Apply BPM filtering
    if (bpmMin || bpmMax) {
      filteredPosts = filteredPosts.filter(post => {
        const bpmTag = post.tags.find(tag => tag.name.startsWith('bpm:'));
        if (!bpmTag) return false;
        
        const bpm = parseInt(bpmTag.name.replace('bpm:', ''));
        if (isNaN(bpm)) return false;
        
        if (bpmMin && bpm < parseInt(bpmMin)) return false;
        if (bpmMax && bpm > parseInt(bpmMax)) return false;
        
        return true;
      });
    }
    
    return filteredPosts;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="card mb-6">
        <h1 className="text-3xl font-bold text-primary mb-6">Search</h1>
        
        {/* Search Input */}
        <div className="relative mb-6">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for songs, users, or tags..."
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-primary placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400">
            🔍
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="mb-6 p-4 bg-slate-700/30 border border-slate-600 rounded-lg">
          <h3 className="text-lg font-semibold text-primary mb-3">Advanced Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* BPM Range */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">BPM Range</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={bpmMin}
                  onChange={(e) => setBpmMin(e.target.value)}
                  placeholder="Min"
                  min="60"
                  max="200"
                  className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-primary placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-secondary self-center">-</span>
                <input
                  type="number"
                  value={bpmMax}
                  onChange={(e) => setBpmMax(e.target.value)}
                  placeholder="Max"
                  min="60"
                  max="200"
                  className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-primary placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Musical Key */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">Musical Key</label>
              <select
                value={selectedKey}
                onChange={(e) => setSelectedKey(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Any Key</option>
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
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setBpmMin('');
                  setBpmMax('');
                  setSelectedKey('');
                }}
                className="w-full px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Search Tips */}
        {!query && (
          <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-primary mb-2">Search Tips:</h3>
            <ul className="text-secondary space-y-1">
              <li>• Search for song titles, descriptions, or artist names</li>
              <li>• Find users by their username</li>
              <li>• Discover content by searching for tags (e.g., "hip-hop", "remix")</li>
              <li>• Use specific keywords for better results</li>
            </ul>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="card text-center">
          <div className="spinner h-8 w-8 mx-auto"></div>
          <p className="text-secondary mt-2">Searching...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="card text-center">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Results */}
      {results && !loading && (
        <div className="card">
          {/* Results Tabs */}
          <div className="flex border-b border-slate-600 mb-6">
            <button
              onClick={() => setActiveTab('posts')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'posts'
                  ? 'border-blue-500 text-accent'
                  : 'border-transparent text-secondary hover:text-primary'
              }`}
            >
              Songs ({getFilteredPosts().length})
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'users'
                  ? 'border-blue-500 text-accent'
                  : 'border-transparent text-secondary hover:text-primary'
              }`}
            >
              Users ({results.users.length})
            </button>
            <button
              onClick={() => setActiveTab('tags')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'tags'
                  ? 'border-blue-500 text-accent'
                  : 'border-transparent text-secondary hover:text-primary'
              }`}
            >
              Tags ({results.tags.length})
            </button>
          </div>

          {/* Posts Results */}
          {activeTab === 'posts' && (
            <div className="space-y-4">
              {getFilteredPosts().length === 0 ? (
                <p className="text-muted text-center py-8">No songs found matching your criteria</p>
              ) : (
                getFilteredPosts().map((post) => (
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
                              href={API_ENDPOINTS.POST_DOWNLOAD(post.id)}
                              className="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-green-500/25"
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
                                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                                    isInQueue(post.id)
                                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                      : 'bg-orange-600 hover:bg-orange-500 text-white hover:shadow-lg hover:shadow-orange-500/25'
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
                                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                                    isInQueue(post.id)
                                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                      : 'bg-purple-600 hover:bg-purple-500 text-white hover:shadow-lg hover:shadow-purple-500/25'
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

          {/* Users Results */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              {results.users.length === 0 ? (
                <p className="text-muted text-center py-8">No users found for "{query}"</p>
              ) : (
                results.users.map((searchUser) => (
                  <div key={searchUser.id} className="post-card p-6 hover-lift">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <ProfileAvatar user={searchUser} size="xl" />
                        <div>
                          <Link 
                            to={`/profile/${searchUser.id}`}
                            className="text-xl font-semibold text-primary hover:text-accent transition-colors"
                          >
                            {searchUser.username}
                          </Link>
                          <p className="text-sm text-muted">Member since {formatDate(searchUser.createdAt)}</p>
                          {searchUser.description && (
                            <p className="text-secondary mt-1 max-w-md">{searchUser.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex space-x-4 text-sm text-muted">
                          <span>{searchUser._count.posts} posts</span>
                          <span>{searchUser._count.remixes} remixes</span>
                        </div>
                        <Link
                          to={`/profile/${searchUser.id}`}
                          className="btn-secondary mt-2 inline-block"
                        >
                          View Profile
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tags Results */}
          {activeTab === 'tags' && (
            <div className="space-y-4">
              {results.tags.length === 0 ? (
                <p className="text-muted text-center py-8">No tags found for "{query}"</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.tags.map((tag) => (
                    <div key={tag.id} className="post-card p-4 hover-lift text-center">
                      <div className="text-2xl font-bold text-accent mb-2">#{tag.name}</div>
                      <p className="text-sm text-muted">
                        {tag._count.posts} post{tag._count.posts !== 1 ? 's' : ''}
                      </p>
                      <button
                        onClick={() => setQuery(`#${tag.name}`)}
                        className="btn-secondary mt-3 text-sm"
                      >
                        Search Posts
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Search;
