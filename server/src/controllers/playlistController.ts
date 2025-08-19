import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// Get user's playlists (authenticated)
export const getUserPlaylists = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const playlists = await prisma.playlist.findMany({
      where: { userId },
      include: {
        tracks: {
          include: {
            post: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    profilePhoto: true
                  }
                },
                postTags: {
                  include: {
                    tag: true
                  }
                }
              }
            }
          },
          orderBy: { position: 'asc' }
        },
        _count: {
          select: { tracks: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({ playlists });
  } catch (error) {
    console.error('Get playlists error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get playlists by user ID (public access)
export const getPlaylistsByUserId = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({ message: 'User ID is required' });
      return;
    }

    const playlists = await prisma.playlist.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilePhoto: true
          }
        },
        tracks: {
          include: {
            post: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    profilePhoto: true
                  }
                },
                postTags: {
                  include: {
                    tag: true
                  }
                }
              }
            }
          },
          orderBy: { position: 'asc' }
        },
        _count: {
          select: { tracks: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({ playlists });
  } catch (error) {
    console.error('Get playlists by user ID error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get playlist by ID (public access)
export const getPlaylistById = async (req: AuthRequest, res: Response) => {
  try {
    const { playlistId } = req.params;

    const playlist = await prisma.playlist.findUnique({
      where: {
        id: playlistId
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilePhoto: true
          }
        },
        tracks: {
          include: {
            post: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    profilePhoto: true
                  }
                },
                postTags: {
                  include: {
                    tag: true
                  }
                },
                _count: {
                  select: {
                    votes: true,
                    comments: true,
                    originalRemixes: true
                  }
                }
              }
            }
          },
          orderBy: { position: 'asc' }
        },
        _count: {
          select: { tracks: true }
        }
      }
    });

    if (!playlist) {
      res.status(404).json({ message: 'Playlist not found' });
      return;
    }

    res.json({ playlist });
  } catch (error) {
    console.error('Get playlist error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create new playlist
export const createPlaylist = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const { name, description } = req.body;

    if (!name || name.trim().length === 0) {
      res.status(400).json({ message: 'Playlist name is required' });
      return;
    }

    if (name.length > 100) {
      res.status(400).json({ message: 'Playlist name must be 100 characters or less' });
      return;
    }

    if (description && description.length > 500) {
      res.status(400).json({ message: 'Description must be 500 characters or less' });
      return;
    }

    // Check playlist limit (50 playlists per user)
    const playlistCount = await prisma.playlist.count({
      where: { userId }
    });

    if (playlistCount >= 50) {
      res.status(400).json({ message: 'Maximum 50 playlists allowed per user' });
      return;
    }

    const playlist = await prisma.playlist.create({
      data: {
        userId,
        name: name.trim(),
        description: description?.trim() || null
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilePhoto: true
          }
        },
        _count: {
          select: { tracks: true }
        }
      }
    });

    res.status(201).json({
      message: 'Playlist created successfully',
      playlist
    });
  } catch (error) {
    console.error('Create playlist error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update playlist
export const updatePlaylist = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { playlistId } = req.params;
    const { name, description } = req.body;

    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    // Check if playlist exists and belongs to user
    const existingPlaylist = await prisma.playlist.findFirst({
      where: {
        id: playlistId,
        userId
      }
    });

    if (!existingPlaylist) {
      res.status(404).json({ message: 'Playlist not found' });
      return;
    }

    if (name && name.trim().length === 0) {
      res.status(400).json({ message: 'Playlist name cannot be empty' });
      return;
    }

    if (name && name.length > 100) {
      res.status(400).json({ message: 'Playlist name must be 100 characters or less' });
      return;
    }

    if (description && description.length > 500) {
      res.status(400).json({ message: 'Description must be 500 characters or less' });
      return;
    }

    const updateData: any = {};
    if (name !== undefined) {
      updateData.name = name.trim();
    }
    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    const playlist = await prisma.playlist.update({
      where: { id: playlistId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilePhoto: true
          }
        },
        _count: {
          select: { tracks: true }
        }
      }
    });

    res.json({
      message: 'Playlist updated successfully',
      playlist
    });
  } catch (error) {
    console.error('Update playlist error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete playlist
export const deletePlaylist = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { playlistId } = req.params;

    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    // Check if playlist exists and belongs to user
    const playlist = await prisma.playlist.findFirst({
      where: {
        id: playlistId,
        userId
      }
    });

    if (!playlist) {
      res.status(404).json({ message: 'Playlist not found' });
      return;
    }

    // Delete playlist (tracks will be deleted automatically due to cascade)
    await prisma.playlist.delete({
      where: { id: playlistId }
    });

    res.json({ message: 'Playlist deleted successfully' });
  } catch (error) {
    console.error('Delete playlist error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Add track to playlist
export const addTrackToPlaylist = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { playlistId } = req.params;
    const { postId } = req.body;

    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    if (!postId) {
      res.status(400).json({ message: 'Post ID is required' });
      return;
    }

    // Check if playlist exists and belongs to user
    const playlist = await prisma.playlist.findFirst({
      where: {
        id: playlistId,
        userId
      }
    });

    if (!playlist) {
      res.status(404).json({ message: 'Playlist not found' });
      return;
    }

    // Check if post exists and is audio
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }

    if (post.postType !== 'AUDIO_FILE' || !post.filePath) {
      res.status(400).json({ message: 'Only audio posts can be added to playlists' });
      return;
    }

    // Check if track already in playlist
    const existingTrack = await prisma.playlistTrack.findUnique({
      where: {
        playlistId_postId: {
          playlistId,
          postId
        }
      }
    });

    if (existingTrack) {
      res.status(400).json({ message: 'Track already in playlist' });
      return;
    }

    // Check playlist size limit (500 tracks)
    const trackCount = await prisma.playlistTrack.count({
      where: { playlistId }
    });

    if (trackCount >= 500) {
      res.status(400).json({ message: 'Playlist is full (maximum 500 tracks)' });
      return;
    }

    // Get next position
    const lastTrack = await prisma.playlistTrack.findFirst({
      where: { playlistId },
      orderBy: { position: 'desc' }
    });

    const nextPosition = lastTrack ? lastTrack.position + 1 : 0;

    // Add track to playlist
    const playlistTrack = await prisma.playlistTrack.create({
      data: {
        playlistId,
        postId,
        position: nextPosition
      },
      include: {
        post: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                profilePhoto: true
              }
            },
            postTags: {
              include: {
                tag: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      message: 'Track added to playlist',
      playlistTrack
    });
  } catch (error) {
    console.error('Add track to playlist error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Remove track from playlist
export const removeTrackFromPlaylist = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { playlistId, postId } = req.params;

    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    // Check if playlist exists and belongs to user
    const playlist = await prisma.playlist.findFirst({
      where: {
        id: playlistId,
        userId
      }
    });

    if (!playlist) {
      res.status(404).json({ message: 'Playlist not found' });
      return;
    }

    // Check if track exists in playlist
    const playlistTrack = await prisma.playlistTrack.findUnique({
      where: {
        playlistId_postId: {
          playlistId,
          postId
        }
      }
    });

    if (!playlistTrack) {
      res.status(404).json({ message: 'Track not found in playlist' });
      return;
    }

    // Remove the track
    await prisma.playlistTrack.delete({
      where: {
        playlistId_postId: {
          playlistId,
          postId
        }
      }
    });

    // Reorder remaining tracks to fill the gap
    await prisma.playlistTrack.updateMany({
      where: {
        playlistId,
        position: {
          gt: playlistTrack.position
        }
      },
      data: {
        position: {
          decrement: 1
        }
      }
    });

    res.json({ message: 'Track removed from playlist' });
  } catch (error) {
    console.error('Remove track from playlist error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Reorder playlist tracks
export const reorderPlaylistTracks = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { playlistId } = req.params;
    const { fromIndex, toIndex } = req.body;

    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    if (typeof fromIndex !== 'number' || typeof toIndex !== 'number') {
      res.status(400).json({ message: 'Valid fromIndex and toIndex are required' });
      return;
    }

    if (fromIndex === toIndex) {
      res.json({ message: 'No change needed' });
      return;
    }

    // Check if playlist exists and belongs to user
    const playlist = await prisma.playlist.findFirst({
      where: {
        id: playlistId,
        userId
      }
    });

    if (!playlist) {
      res.status(404).json({ message: 'Playlist not found' });
      return;
    }

    // Get all tracks for this playlist
    const tracks = await prisma.playlistTrack.findMany({
      where: { playlistId },
      orderBy: { position: 'asc' }
    });

    if (fromIndex < 0 || fromIndex >= tracks.length || toIndex < 0 || toIndex >= tracks.length) {
      res.status(400).json({ message: 'Invalid index values' });
      return;
    }

    // Reorder the array
    const [movedTrack] = tracks.splice(fromIndex, 1);
    tracks.splice(toIndex, 0, movedTrack);

    // Update positions in database
    const updatePromises = tracks.map((track, index) =>
      prisma.playlistTrack.update({
        where: { id: track.id },
        data: { position: index }
      })
    );

    await Promise.all(updatePromises);

    res.json({ message: 'Playlist tracks reordered successfully' });
  } catch (error) {
    console.error('Reorder playlist tracks error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Add entire playlist to queue
export const addPlaylistToQueue = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { playlistId } = req.params;
    const { shuffle = false, playNext = false } = req.body;

    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    // Check if playlist exists and user has access
    const playlist = await prisma.playlist.findFirst({
      where: {
        id: playlistId,
        OR: [
          { userId }, // User's own playlist
          { isPublic: true } // Public playlist
        ]
      },
      include: {
        tracks: {
          include: {
            post: true
          },
          orderBy: { position: 'asc' }
        }
      }
    });

    if (!playlist) {
      res.status(404).json({ message: 'Playlist not found' });
      return;
    }

    if (playlist.tracks.length === 0) {
      res.status(400).json({ message: 'Playlist is empty' });
      return;
    }

    // Filter only audio tracks
    const audioTracks = playlist.tracks.filter(
      track => track.post.postType === 'AUDIO_FILE' && track.post.filePath
    );

    if (audioTracks.length === 0) {
      res.status(400).json({ message: 'No audio tracks found in playlist' });
      return;
    }

    // Check current queue size
    const currentQueueCount = await prisma.userQueue.count({
      where: { userId }
    });

    if (currentQueueCount + audioTracks.length > 100) {
      res.status(400).json({ 
        message: `Cannot add playlist. Queue would exceed maximum of 100 tracks (current: ${currentQueueCount}, adding: ${audioTracks.length})` 
      });
      return;
    }

    // Remove tracks already in queue
    const existingQueueItems = await prisma.userQueue.findMany({
      where: {
        userId,
        postId: {
          in: audioTracks.map(track => track.postId)
        }
      }
    });

    const existingPostIds = new Set(existingQueueItems.map(item => item.postId));
    const tracksToAdd = audioTracks.filter(track => !existingPostIds.has(track.postId));

    if (tracksToAdd.length === 0) {
      res.status(400).json({ message: 'All tracks from this playlist are already in your queue' });
      return;
    }

    // Shuffle if requested
    if (shuffle) {
      for (let i = tracksToAdd.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tracksToAdd[i], tracksToAdd[j]] = [tracksToAdd[j], tracksToAdd[i]];
      }
    }

    let startPosition: number;

    if (playNext) {
      // Add to front of queue - shift existing items
      await prisma.userQueue.updateMany({
        where: { userId },
        data: {
          position: {
            increment: tracksToAdd.length
          }
        }
      });
      startPosition = 0;
    } else {
      // Add to end of queue
      const lastItem = await prisma.userQueue.findFirst({
        where: { userId },
        orderBy: { position: 'desc' }
      });
      startPosition = lastItem ? lastItem.position + 1 : 0;
    }

    // Create queue items
    const queueItems = tracksToAdd.map((track, index) => ({
      userId,
      postId: track.postId,
      position: startPosition + index
    }));

    await prisma.userQueue.createMany({
      data: queueItems
    });

    res.json({
      message: `Added ${tracksToAdd.length} tracks from playlist to queue${shuffle ? ' (shuffled)' : ''}`,
      addedCount: tracksToAdd.length,
      skippedCount: audioTracks.length - tracksToAdd.length
    });
  } catch (error) {
    console.error('Add playlist to queue error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
