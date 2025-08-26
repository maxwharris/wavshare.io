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
  playlists: Array<{
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
    user: {
      id: string;
      username: string;
      profilePhoto?: string;
    };
    _count: {
      tracks: number;
    };
  }>;
}

const Search: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'users' | 'playlists'>('posts');
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
        userId: post.user.id,
        coverArt: post.coverArt
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
        const bpmTag = post.postTags.find(postTag => postTag.tag.name.startsWith('bpm:'));
        if (!bpmTag) return false;
        
        const bpm = parseInt(bpmTag.tag.name.replace('bpm:', ''));
        if (isNaN(bpm)) return false;
        
        if (bpmMin && bpm < parseInt(bpmMin)) return false;
        if (bpmMax && bpm > parseInt(bpmMax)) return false;
        
        return true;
      });
    }
    
    return filteredPosts;
  };

  return (
    <div className="max-w-6xl mx-auto navbar-spacing audio-player-spacing">
      <div className="card mb-6">
        <h1 className="text-3xl font-bold text-primary mb-6">Search</h1>
        
        {/* Search Input */}
        <div className="relative mb-6">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for songs, users, or tags..."
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                  className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-secondary self-center">-</span>
                <input
                  type="number"
                  value={bpmMax}
                  onChange={(e) => setBpmMax(e.target.value)}
                  placeholder="Max"
                  min="60"
                  max="200"
                  className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Musical Key */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">Musical Key</label>
              <select
                value={selectedKey}
                onChange={(e) => setSelectedKey(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                  ? 'border-emerald-500 text-accent'
                  : 'border-transparent text-secondary hover:text-primary'
              }`}
            >
              Songs ({getFilteredPosts().length})
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'users'
                  ? 'border-emerald-500 text-accent'
                  : 'border-transparent text-secondary hover:text-primary'
              }`}
            >
              Users ({results.users.length})
            </button>
            <button
              onClick={() => setActiveTab('playlists')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'playlists'
                  ? 'border-emerald-500 text-accent'
                  : 'border-transparent text-secondary hover:text-primary'
              }`}
            >
              Playlists ({results.playlists?.length || 0})
            </button>
          </div>

          {/* Posts Results */}
          {activeTab === 'posts' && (
            <div className="space-y-4">
              {getFilteredPosts().length === 0 ? (
                <p className="text-muted text-center py-8">No songs found matching your criteria</p>
              ) : (
                getFilteredPosts().map((post) => (
                  <Link key={post.id} to={`/post/${post.id}`} className="block">
                    <div className="post-card p-6 hover-lift cursor-pointer">
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

                    <div className="mb-4">
                      <h3 className="text-xl font-semibold text-primary hover:text-accent mb-2 transition-colors">
                        {post.title}
                      </h3>
                      {post.description && (
                        <p className="text-secondary mb-3">{post.description}</p>
                      )}
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
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handlePlayAudio(post);
                              }}
                              className="btn-primary hover-glow flex items-center justify-center px-4 py-2 min-w-[80px]"
                            >
                              <span>Play</span>
                            </button>
                            <a
                              href={API_ENDPOINTS.POST_DOWNLOAD(post.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center justify-center px-4 py-2 min-w-[80px] bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all duration-200 hover:shadow-lg border border-emerald-500"
                            >
                              <span>Download</span>
                            </a>
                            {user && (
                              <>
                                <button
                                  onClick={async (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
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
                                  onClick={async (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
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
                            onClick={(e) => e.stopPropagation()}
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
                      </div>
                    </div>
                    </div>
                  </Link>
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


          {/* Playlists Results */}
          {activeTab === 'playlists' && (
            <div className="space-y-4">
              {(results.playlists?.length || 0) === 0 ? (
                <p className="text-muted text-center py-8">No playlists found for "{query}"</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.playlists?.map((playlist) => (
                    <div key={playlist.id} className="post-card p-6 hover-lift">
                      <div className="flex items-start space-x-4">
                        {/* Playlist Cover */}
                        <div className="flex-shrink-0">
                          <div className="w-16 h-16 bg-slate-700 rounded-lg flex items-center justify-center">
                            <div className="text-2xl text-slate-500">🎵</div>
                          </div>
                        </div>

                        {/* Playlist Info */}
                        <div className="flex-1 min-w-0">
                          <Link 
                            to={`/playlist/${playlist.id}`}
                            className="block font-bold text-lg text-primary hover:text-accent transition-colors truncate mb-1"
                          >
                            {playlist.name}
                          </Link>
                          {playlist.description && (
                            <p className="text-secondary text-sm mb-2 line-clamp-2">{playlist.description}</p>
                          )}
                          <div className="flex items-center space-x-2 text-sm text-muted">
                            <Link 
                              to={`/profile/${playlist.user.id}`}
                              className="flex items-center space-x-1 hover:text-primary transition-colors"
                            >
                              <ProfileAvatar user={playlist.user} size="sm" />
                              <span>{playlist.user.username}</span>
                            </Link>
                            <span>•</span>
                            <span>{playlist._count.tracks} track{playlist._count.tracks !== 1 ? 's' : ''}</span>
                            <span>•</span>
                            <span>Updated {formatDate(playlist.updatedAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between mt-4">
                        <Link
                          to={`/playlist/${playlist.id}`}
                          className="btn-primary text-sm"
                        >
                          View Playlist
                        </Link>
                        <div className="text-xs text-muted">
                          Created {formatDate(playlist.createdAt)}
                        </div>
                      </div>
                    </div>
                  )) || []}
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
