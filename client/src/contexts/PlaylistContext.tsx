import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext.tsx';
import { playlistService, Playlist } from '../services/playlistService.ts';

interface PlaylistContextType {
  playlists: Playlist[];
  loading: boolean;
  error: string | null;
  fetchPlaylists: () => Promise<void>;
  createPlaylist: (data: { name: string; description?: string }) => Promise<Playlist>;
  updatePlaylist: (playlistId: string, data: { name?: string; description?: string }) => Promise<Playlist>;
  deletePlaylist: (playlistId: string) => Promise<void>;
  addTrackToPlaylist: (playlistId: string, postId: string) => Promise<void>;
  removeTrackFromPlaylist: (playlistId: string, postId: string) => Promise<void>;
  addPlaylistToQueue: (playlistId: string, options?: { shuffle?: boolean; playNext?: boolean }) => Promise<{ message: string; addedCount: number; skippedCount: number }>;
  isTrackInPlaylist: (playlistId: string, postId: string) => boolean;
  getPlaylistsContainingTrack: (postId: string) => Playlist[];
}

const PlaylistContext = createContext<PlaylistContextType | undefined>(undefined);

export const usePlaylist = (): PlaylistContextType => {
  const context = useContext(PlaylistContext);
  if (!context) {
    throw new Error('usePlaylist must be used within a PlaylistProvider');
  }
  return context;
};

interface PlaylistProviderProps {
  children: ReactNode;
}

export const PlaylistProvider: React.FC<PlaylistProviderProps> = ({ children }) => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, token } = useAuth();

  const fetchPlaylists = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await playlistService.getUserPlaylists(token);
      setPlaylists(response.playlists);
    } catch (error) {
      console.error('Fetch playlists error:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch playlists');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch playlists when user logs in
  useEffect(() => {
    if (user && token) {
      fetchPlaylists();
    } else {
      setPlaylists([]);
    }
  }, [user, token, fetchPlaylists]);

  const createPlaylist = async (data: { name: string; description?: string }): Promise<Playlist> => {
    if (!token) {
      throw new Error('Authentication required');
    }

    try {
      const response = await playlistService.createPlaylist(data, token);
      const newPlaylist = response.playlist;
      
      // Add to local state
      setPlaylists(prev => [newPlaylist, ...prev]);
      
      return newPlaylist;
    } catch (error) {
      console.error('Create playlist error:', error);
      throw error;
    }
  };

  const updatePlaylist = async (playlistId: string, data: { name?: string; description?: string }): Promise<Playlist> => {
    if (!token) {
      throw new Error('Authentication required');
    }

    try {
      const response = await playlistService.updatePlaylist(playlistId, data, token);
      const updatedPlaylist = response.playlist;
      
      // Update local state
      setPlaylists(prev => prev.map(playlist => 
        playlist.id === playlistId ? updatedPlaylist : playlist
      ));
      
      return updatedPlaylist;
    } catch (error) {
      console.error('Update playlist error:', error);
      throw error;
    }
  };

  const deletePlaylist = async (playlistId: string): Promise<void> => {
    if (!token) {
      throw new Error('Authentication required');
    }

    try {
      await playlistService.deletePlaylist(playlistId, token);
      
      // Remove from local state
      setPlaylists(prev => prev.filter(playlist => playlist.id !== playlistId));
    } catch (error) {
      console.error('Delete playlist error:', error);
      throw error;
    }
  };

  const addTrackToPlaylist = async (playlistId: string, postId: string): Promise<void> => {
    if (!token) {
      throw new Error('Authentication required');
    }

    try {
      const response = await playlistService.addTrackToPlaylist(playlistId, postId, token);
      
      // Update local state
      setPlaylists(prev => prev.map(playlist => {
        if (playlist.id === playlistId) {
          return {
            ...playlist,
            tracks: [...playlist.tracks, response.playlistTrack],
            _count: {
              ...playlist._count,
              tracks: playlist._count.tracks + 1
            }
          };
        }
        return playlist;
      }));
    } catch (error) {
      console.error('Add track to playlist error:', error);
      throw error;
    }
  };

  const removeTrackFromPlaylist = async (playlistId: string, postId: string): Promise<void> => {
    if (!token) {
      throw new Error('Authentication required');
    }

    try {
      await playlistService.removeTrackFromPlaylist(playlistId, postId, token);
      
      // Update local state
      setPlaylists(prev => prev.map(playlist => {
        if (playlist.id === playlistId) {
          return {
            ...playlist,
            tracks: playlist.tracks.filter(track => track.post.id !== postId),
            _count: {
              ...playlist._count,
              tracks: playlist._count.tracks - 1
            }
          };
        }
        return playlist;
      }));
    } catch (error) {
      console.error('Remove track from playlist error:', error);
      throw error;
    }
  };

  const addPlaylistToQueue = async (playlistId: string, options: { shuffle?: boolean; playNext?: boolean } = {}): Promise<{ message: string; addedCount: number; skippedCount: number }> => {
    if (!token) {
      throw new Error('Authentication required');
    }

    try {
      const response = await playlistService.addPlaylistToQueue(playlistId, options, token);
      return response;
    } catch (error) {
      console.error('Add playlist to queue error:', error);
      throw error;
    }
  };

  const isTrackInPlaylist = (playlistId: string, postId: string): boolean => {
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return false;
    
    return playlist.tracks.some(track => track.post.id === postId);
  };

  const getPlaylistsContainingTrack = (postId: string): Playlist[] => {
    return playlists.filter(playlist => 
      playlist.tracks.some(track => track.post.id === postId)
    );
  };

  const value: PlaylistContextType = {
    playlists,
    loading,
    error,
    fetchPlaylists,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    addPlaylistToQueue,
    isTrackInPlaylist,
    getPlaylistsContainingTrack
  };

  return (
    <PlaylistContext.Provider value={value}>
      {children}
    </PlaylistContext.Provider>
  );
};
