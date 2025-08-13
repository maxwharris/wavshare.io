import { API_ENDPOINTS } from '../config/api';

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
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

export interface PlaylistTrack {
  id: string;
  position: number;
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
  };
}

export const playlistService = {
  // Get user's playlists
  async getUserPlaylists(token: string): Promise<{ playlists: Playlist[] }> {
    const response = await fetch(API_ENDPOINTS.PLAYLISTS, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch playlists');
    }

    return response.json();
  },

  // Get playlist by ID
  async getPlaylistById(playlistId: string, token: string): Promise<{ playlist: Playlist }> {
    const response = await fetch(API_ENDPOINTS.PLAYLIST_BY_ID(playlistId), {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch playlist');
    }

    return response.json();
  },

  // Create new playlist
  async createPlaylist(data: { name: string; description?: string }, token: string): Promise<{ playlist: Playlist; message: string }> {
    const response = await fetch(API_ENDPOINTS.PLAYLISTS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create playlist');
    }

    return response.json();
  },

  // Update playlist
  async updatePlaylist(playlistId: string, data: { name?: string; description?: string }, token: string): Promise<{ playlist: Playlist; message: string }> {
    const response = await fetch(API_ENDPOINTS.PLAYLIST_BY_ID(playlistId), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update playlist');
    }

    return response.json();
  },

  // Delete playlist
  async deletePlaylist(playlistId: string, token: string): Promise<{ message: string }> {
    const response = await fetch(API_ENDPOINTS.PLAYLIST_BY_ID(playlistId), {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete playlist');
    }

    return response.json();
  },

  // Add track to playlist
  async addTrackToPlaylist(playlistId: string, postId: string, token: string): Promise<{ playlistTrack: PlaylistTrack; message: string }> {
    const response = await fetch(API_ENDPOINTS.PLAYLIST_TRACKS(playlistId), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ postId })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add track to playlist');
    }

    return response.json();
  },

  // Remove track from playlist
  async removeTrackFromPlaylist(playlistId: string, postId: string, token: string): Promise<{ message: string }> {
    const response = await fetch(API_ENDPOINTS.PLAYLIST_TRACK_REMOVE(playlistId, postId), {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to remove track from playlist');
    }

    return response.json();
  },

  // Reorder playlist tracks
  async reorderPlaylistTracks(playlistId: string, fromIndex: number, toIndex: number, token: string): Promise<{ message: string }> {
    const response = await fetch(API_ENDPOINTS.PLAYLIST_TRACKS_REORDER(playlistId), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ fromIndex, toIndex })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to reorder playlist tracks');
    }

    return response.json();
  },

  // Add playlist to queue
  async addPlaylistToQueue(playlistId: string, options: { shuffle?: boolean; playNext?: boolean }, token: string): Promise<{ message: string; addedCount: number; skippedCount: number }> {
    const response = await fetch(API_ENDPOINTS.PLAYLIST_TO_QUEUE(playlistId), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(options)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add playlist to queue');
    }

    return response.json();
  }
};
