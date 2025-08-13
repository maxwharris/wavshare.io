import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useAudio } from '../contexts/AudioContext.tsx';
import { useQueue } from '../contexts/QueueContext.tsx';
import { usePlaylist } from '../contexts/PlaylistContext.tsx';
import { useToast } from '../contexts/ToastContext.tsx';
import ProfileAvatar from '../components/ProfileAvatar.tsx';
import { API_ENDPOINTS, API_CONFIG } from '../config/api';

interface PlaylistTrack {
  id: string;
  addedAt: string;
  post: {
    id: string;
    title: string;
    description?: string;
    filePath?: string;
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
    _count: {
      votes: number;
      comments: number;
      originalRemixes: number;
    };
  };
}

interface PlaylistDetail {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
    profilePhoto?: string;
  };
  tracks: PlaylistTrack[];
  _count: {
    tracks: number;
  };
}

const PlaylistDetail: React.FC = () => {
  const { playlistId } = useParams<{ playlistId: string }>();
  const [playlist, setPlaylist] = useState<PlaylistDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const { playTrack } = useAudio();
  const { addToQueue, addToQueueNext, isInQueue } = useQueue();
  const { addPlaylistToQueue, removeTrackFromPlaylist } = usePlaylist();
  const { showNotification } = useToast();

  const isOwner = user && playlist && user.id === playlist.user.id;

  useEffect(() => {
    const fetchPlaylist = async () => {
      if (!playlistId) {
        setError('No playlist ID provided');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(API_ENDPOINTS.PLAYLIST_DETAIL(playlistId));
        const data = await response.json();

        if (response.ok) {
          setPlaylist(data.playlist);
        } else {
          setError(data.message || 'Failed to fetch playlist');
        }
      } catch (error) {
        console.error('Fetch playlist error:', error);
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylist();
  }, [playlistId]);

  const handlePlayTrack = (track: PlaylistTrack) => {
    if (track.post.filePath) {
      const audioUrl = `${API_CONFIG.SERVER_URL}/${track.post.filePath}`;
      playTrack({
        id: track.post.id,
        title: track.post.title,
        artist: track.post.user.username,
        url: audioUrl,
        postId: track.post.id,
        userId: track.post.user.id
      });
    }
  };

  const handleRemoveTrack = async (trackId: string, postId: string) => {
    if (!playlist || !isOwner) return;

    try {
      await removeTrackFromPlaylist(playlist.id, postId);
      setPlaylist(prev => prev ? {
        ...prev,
        tracks: prev.tracks.filter(track => track.id !== trackId),
        _count: {
          ...prev._count,
          tracks: prev._count.tracks - 1
        }
      } : null);
      showNotification('Track removed from playlist', 'success');
    } catch (error) {
      console.error('Remove track error:', error);
      showNotification(error instanceof Error ? error.message : 'Failed to remove track', 'error');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDuration = (tracks: PlaylistTrack[]) => {
    const totalTracks = tracks.length;
    if (totalTracks === 0) return 'Empty playlist';
    if (totalTracks === 1) return '1 track';
    return `${totalTracks} tracks`;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card text-center">
          <div className="spinner h-12 w-12 mx-auto"></div>
          <p className="text-secondary mt-4">Loading playlist...</p>
        </div>
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card text-center">
          <p className="text-red-400">{error || 'Playlist not found'}</p>
          <Link to="/" className="btn-secondary mt-4 inline-block">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Playlist Header */}
      <div className="card">
        <div className="flex gap-6 mb-6">
          {/* Playlist Cover */}
          <div className="flex-shrink-0">
            <div className="w-48 h-48 bg-slate-700 rounded-lg flex items-center justify-center">
              {playlist.coverImage ? (
                <img
                  src={playlist.coverImage}
                  alt={playlist.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="text-6xl text-slate-500">🎵</div>
              )}
            </div>
          </div>

          {/* Playlist Info */}
          <div className="flex-1">
            <div className="mb-2">
              <span className="text-sm text-secondary uppercase tracking-wide">Playlist</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">{playlist.name}</h1>
            {playlist.description && (
              <p className="text-secondary mb-4">{playlist.description}</p>
            )}
            <div className="flex items-center space-x-2 text-sm text-secondary mb-4">
              <Link 
                to={`/profile/${playlist.user.id}`}
                className="flex items-center space-x-2 hover:text-primary transition-colors"
              >
                <ProfileAvatar user={playlist.user} size="sm" />
                <span className="font-medium">{playlist.user.username}</span>
              </Link>
              <span>•</span>
              <span>{formatDuration(playlist.tracks)}</span>
              <span>•</span>
              <span>Created {formatDate(playlist.createdAt)}</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              <button
                onClick={async () => {
                  try {
                    const result = await addPlaylistToQueue(playlist.id, { shuffle: false, playNext: false });
                    showNotification(result.message, 'success');
                  } catch (error) {
                    console.error('Add playlist to queue error:', error);
                    showNotification(error instanceof Error ? error.message : 'Failed to add playlist to queue', 'error');
                  }
                }}
                disabled={playlist.tracks.length === 0}
                className="bg-primary hover:bg-primary-dark disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-full font-medium transition-colors flex items-center space-x-2"
              >
                <span>▶️</span>
                <span>Play</span>
              </button>
              <button
                onClick={async () => {
                  try {
                    const result = await addPlaylistToQueue(playlist.id, { shuffle: true, playNext: false });
                    showNotification(result.message, 'success');
                  } catch (error) {
                    console.error('Add playlist to queue error:', error);
                    showNotification(error instanceof Error ? error.message : 'Failed to add playlist to queue', 'error');
                  }
                }}
                disabled={playlist.tracks.length === 0}
                className="bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white px-6 py-3 rounded-full font-medium transition-colors flex items-center space-x-2"
              >
                <span>🔀</span>
                <span>Shuffle</span>
              </button>
              <button
                onClick={() => {
                  const playlistUrl = `${window.location.origin}/playlist/${playlist.id}`;
                  navigator.clipboard.writeText(playlistUrl).then(() => {
                    showNotification('Playlist link copied to clipboard!', 'success');
                  }).catch(() => {
                    showNotification('Failed to copy link', 'error');
                  });
                }}
                className="bg-slate-600 hover:bg-slate-500 text-white px-6 py-3 rounded-full font-medium transition-colors flex items-center space-x-2"
              >
                <span>🔗</span>
                <span>Copy Link</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tracks List */}
      <div className="card">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Tracks</h2>
          {playlist.tracks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎵</div>
              <h3 className="text-xl font-bold text-white mb-4">No tracks yet</h3>
              <p className="text-secondary">This playlist is empty. Add some tracks to get started!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {playlist.tracks.map((track, index) => (
                <div
                  key={track.id}
                  className="flex items-center space-x-4 p-3 hover:bg-slate-700/50 rounded-lg transition-colors group"
                >
                  {/* Track Number */}
                  <div className="w-8 text-center">
                    <span className="text-secondary group-hover:hidden">{index + 1}</span>
                    <button
                      onClick={() => handlePlayTrack(track)}
                      className="hidden group-hover:block text-white hover:text-primary transition-colors"
                    >
                      ▶️
                    </button>
                  </div>

                  {/* Cover Art */}
                  <div className="flex-shrink-0">
                    <img
                      src={track.post.coverArt ? `${API_CONFIG.SERVER_URL}/${track.post.coverArt}` : `${API_CONFIG.SERVER_URL}/uploads/covers/default.gif`}
                      alt={`Cover art for ${track.post.title}`}
                      className="w-12 h-12 object-cover rounded border border-slate-600"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `${API_CONFIG.SERVER_URL}/uploads/covers/default.gif`;
                      }}
                    />
                  </div>

                  {/* Track Info */}
                  <div className="flex-1 min-w-0">
                    <Link 
                      to={`/post/${track.post.id}`}
                      className="block font-medium text-white hover:text-primary transition-colors truncate"
                    >
                      {track.post.title}
                    </Link>
                    <Link 
                      to={`/profile/${track.post.user.id}`}
                      className="text-sm text-secondary hover:text-primary transition-colors"
                    >
                      {track.post.user.username}
                    </Link>
                  </div>

                  {/* Track Stats */}
                  <div className="hidden md:flex items-center space-x-4 text-sm text-secondary">
                    <span>💬 {track.post._count.comments}</span>
                    <span>👍 {track.post._count.votes}</span>
                    <span>🎵 {track.post._count.originalRemixes}</span>
                  </div>

                  {/* Added Date */}
                  <div className="hidden lg:block text-sm text-secondary">
                    {formatDate(track.addedAt)}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    {user && (
                      <>
                        <button
                          onClick={async () => {
                            try {
                              await addToQueueNext(track.post.id);
                            } catch (error) {
                              showNotification(error instanceof Error ? error.message : 'Failed to add to queue next', 'error');
                            }
                          }}
                          disabled={isInQueue(track.post.id)}
                          className={`p-2 rounded transition-colors ${
                            isInQueue(track.post.id)
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-secondary hover:text-orange-400'
                          }`}
                          title="Play Next"
                        >
                          ⏭️
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await addToQueue(track.post.id);
                            } catch (error) {
                              showNotification(error instanceof Error ? error.message : 'Failed to add to queue', 'error');
                            }
                          }}
                          disabled={isInQueue(track.post.id)}
                          className={`p-2 rounded transition-colors ${
                            isInQueue(track.post.id)
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-secondary hover:text-purple-400'
                          }`}
                          title="Add to Queue"
                        >
                          📋
                        </button>
                      </>
                    )}
                    <a
                      href={API_ENDPOINTS.POST_DOWNLOAD(track.post.id)}
                      className="p-2 text-secondary hover:text-green-400 transition-colors"
                      title="Download"
                    >
                      ⬇️
                    </a>
                    {isOwner && (
                      <button
                        onClick={() => handleRemoveTrack(track.id, track.post.id)}
                        className="p-2 text-secondary hover:text-red-400 transition-colors"
                        title="Remove from playlist"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlaylistDetail;
