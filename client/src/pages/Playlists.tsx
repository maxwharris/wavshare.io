import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { usePlaylist } from '../contexts/PlaylistContext.tsx';
import { useToast } from '../contexts/ToastContext.tsx';
import { Playlist } from '../services/playlistService.ts';

const Playlists: React.FC = () => {
  const { user } = useAuth();
  const { playlists, loading, createPlaylist, deletePlaylist, addPlaylistToQueue } = usePlaylist();
  const { showNotification } = useToast();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-white mb-4">Please log in to view your playlists</h2>
        <p className="text-secondary">You need to be logged in to create and manage playlists.</p>
      </div>
    );
  }

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPlaylistName.trim()) {
      showNotification('Playlist name is required', 'error');
      return;
    }

    setIsCreating(true);
    try {
      await createPlaylist({
        name: newPlaylistName.trim(),
        description: newPlaylistDescription.trim() || undefined
      });
      
      showNotification('Playlist created successfully!', 'success');
      setShowCreateModal(false);
      setNewPlaylistName('');
      setNewPlaylistDescription('');
    } catch (error) {
      console.error('Create playlist error:', error);
      showNotification(error instanceof Error ? error.message : 'Failed to create playlist', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeletePlaylist = async (playlistId: string, playlistName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${playlistName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deletePlaylist(playlistId);
      showNotification('Playlist deleted successfully', 'success');
    } catch (error) {
      console.error('Delete playlist error:', error);
      showNotification(error instanceof Error ? error.message : 'Failed to delete playlist', 'error');
    }
  };

  const handleAddToQueue = async (playlist: Playlist, shuffle: boolean = false) => {
    try {
      const result = await addPlaylistToQueue(playlist.id, { shuffle, playNext: false });
      showNotification(result.message, 'success');
    } catch (error) {
      console.error('Add playlist to queue error:', error);
      showNotification(error instanceof Error ? error.message : 'Failed to add playlist to queue', 'error');
    }
  };

  const formatDuration = (tracks: any[]) => {
    const totalTracks = tracks?.length || 0;
    if (totalTracks === 0) return 'Empty playlist';
    if (totalTracks === 1) return '1 track';
    return `${totalTracks} tracks`;
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
      <div className="text-center py-12">
        <div className="spinner h-12 w-12 mx-auto mb-4"></div>
        <p className="text-secondary">Loading playlists...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Your Playlists</h1>
          <p className="text-secondary">Create and manage your music collections</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          Create Playlist
        </button>
      </div>

      {/* Playlists Grid */}
      {playlists.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎵</div>
          <h2 className="text-2xl font-bold text-white mb-4">No playlists yet</h2>
          <p className="text-secondary mb-6">Create your first playlist to start organizing your favorite tracks</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Create Your First Playlist
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {playlists.map((playlist) => (
            <div key={playlist.id} className="bg-slate-800 rounded-lg p-6 hover:bg-slate-700 transition-colors">
              {/* Playlist Cover */}
              <div className="w-full h-48 bg-slate-700 rounded-lg mb-4 flex items-center justify-center">
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

              {/* Playlist Info */}
              <div className="mb-4">
                <h3 className="text-xl font-bold text-white mb-2 truncate">{playlist.name}</h3>
                {playlist.description && (
                  <p className="text-secondary text-sm mb-2 line-clamp-2">{playlist.description}</p>
                )}
                <p className="text-xs text-slate-400">
                  {formatDuration(playlist.tracks)} • Created {formatDate(playlist.createdAt)}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleAddToQueue(playlist)}
                  disabled={(playlist.tracks?.length || 0) === 0}
                  className="flex-1 bg-primary hover:bg-primary-dark disabled:bg-slate-600 disabled:cursor-not-allowed text-white py-2 px-3 rounded text-sm font-medium transition-colors"
                >
                  Play
                </button>
                <button
                  onClick={() => handleAddToQueue(playlist, true)}
                  disabled={(playlist.tracks?.length || 0) === 0}
                  className="flex-1 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white py-2 px-3 rounded text-sm font-medium transition-colors"
                >
                  Shuffle
                </button>
                <button
                  onClick={() => handleDeletePlaylist(playlist.id, playlist.name)}
                  className="bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded text-sm font-medium transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Playlist Modal */}
      {showCreateModal && (
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
                    setShowCreateModal(false);
                    setNewPlaylistName('');
                    setNewPlaylistDescription('');
                  }}
                  className="flex-1 bg-slate-600 hover:bg-slate-500 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newPlaylistName.trim()}
                  className="flex-1 bg-primary hover:bg-primary-dark disabled:bg-slate-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  {isCreating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Playlists;
