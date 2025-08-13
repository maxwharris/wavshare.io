import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// Get user's queue
export const getUserQueue = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const queueItems = await prisma.userQueue.findMany({
      where: { userId },
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
            tags: true
          }
        }
      },
      orderBy: { position: 'asc' }
    });

    // Get queue settings
    const settings = await prisma.userQueueSettings.findUnique({
      where: { userId }
    });

    res.json({
      queue: queueItems,
      settings: settings || {
        shuffleMode: false,
        repeatMode: 'off'
      }
    });
  } catch (error) {
    console.error('Get queue error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Add track to queue
export const addToQueue = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const { postId } = req.body;
    if (!postId) {
      res.status(400).json({ message: 'Post ID is required' });
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
      res.status(400).json({ message: 'Only audio posts can be added to queue' });
      return;
    }

    // Check if already in queue
    const existingItem = await prisma.userQueue.findUnique({
      where: {
        userId_postId: {
          userId,
          postId
        }
      }
    });

    if (existingItem) {
      res.status(400).json({ message: 'Track already in queue' });
      return;
    }

    // Check queue size limit (100 tracks)
    const queueCount = await prisma.userQueue.count({
      where: { userId }
    });

    if (queueCount >= 100) {
      res.status(400).json({ message: 'Queue is full (maximum 100 tracks)' });
      return;
    }

    // Get next position
    const lastItem = await prisma.userQueue.findFirst({
      where: { userId },
      orderBy: { position: 'desc' }
    });

    const nextPosition = lastItem ? lastItem.position + 1 : 0;

    // Add to queue
    const queueItem = await prisma.userQueue.create({
      data: {
        userId,
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
            tags: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Track added to queue',
      queueItem
    });
  } catch (error) {
    console.error('Add to queue error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Add track to front of queue (play next)
export const addToQueueNext = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const { postId } = req.body;
    if (!postId) {
      res.status(400).json({ message: 'Post ID is required' });
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
      res.status(400).json({ message: 'Only audio posts can be added to queue' });
      return;
    }

    // Check if already in queue
    const existingItem = await prisma.userQueue.findUnique({
      where: {
        userId_postId: {
          userId,
          postId
        }
      }
    });

    if (existingItem) {
      res.status(400).json({ message: 'Track already in queue' });
      return;
    }

    // Check queue size limit (100 tracks)
    const queueCount = await prisma.userQueue.count({
      where: { userId }
    });

    if (queueCount >= 100) {
      res.status(400).json({ message: 'Queue is full (maximum 100 tracks)' });
      return;
    }

    // Shift all existing items down by 1 position
    await prisma.userQueue.updateMany({
      where: { userId },
      data: {
        position: {
          increment: 1
        }
      }
    });

    // Add to front of queue (position 0)
    const queueItem = await prisma.userQueue.create({
      data: {
        userId,
        postId,
        position: 0
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
            tags: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Track added to front of queue',
      queueItem
    });
  } catch (error) {
    console.error('Add to queue next error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Remove track from queue
export const removeFromQueue = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const { postId } = req.params;

    const queueItem = await prisma.userQueue.findUnique({
      where: {
        userId_postId: {
          userId,
          postId
        }
      }
    });

    if (!queueItem) {
      res.status(404).json({ message: 'Track not found in queue' });
      return;
    }

    // Remove the item
    await prisma.userQueue.delete({
      where: {
        userId_postId: {
          userId,
          postId
        }
      }
    });

    // Reorder remaining items to fill the gap
    await prisma.userQueue.updateMany({
      where: {
        userId,
        position: {
          gt: queueItem.position
        }
      },
      data: {
        position: {
          decrement: 1
        }
      }
    });

    res.json({ message: 'Track removed from queue' });
  } catch (error) {
    console.error('Remove from queue error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Reorder queue
export const reorderQueue = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const { fromIndex, toIndex } = req.body;

    if (typeof fromIndex !== 'number' || typeof toIndex !== 'number') {
      res.status(400).json({ message: 'Valid fromIndex and toIndex are required' });
      return;
    }

    if (fromIndex === toIndex) {
      res.json({ message: 'No change needed' });
      return;
    }

    // Get all queue items for this user
    const queueItems = await prisma.userQueue.findMany({
      where: { userId },
      orderBy: { position: 'asc' }
    });

    if (fromIndex < 0 || fromIndex >= queueItems.length || toIndex < 0 || toIndex >= queueItems.length) {
      res.status(400).json({ message: 'Invalid index values' });
      return;
    }

    // Reorder the array
    const [movedItem] = queueItems.splice(fromIndex, 1);
    queueItems.splice(toIndex, 0, movedItem);

    // Update positions in database
    const updatePromises = queueItems.map((item, index) =>
      prisma.userQueue.update({
        where: { id: item.id },
        data: { position: index }
      })
    );

    await Promise.all(updatePromises);

    res.json({ message: 'Queue reordered successfully' });
  } catch (error) {
    console.error('Reorder queue error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Clear entire queue
export const clearQueue = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    await prisma.userQueue.deleteMany({
      where: { userId }
    });

    res.json({ message: 'Queue cleared successfully' });
  } catch (error) {
    console.error('Clear queue error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get queue settings
export const getQueueSettings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    let settings = await prisma.userQueueSettings.findUnique({
      where: { userId }
    });

    if (!settings) {
      // Create default settings
      settings = await prisma.userQueueSettings.create({
        data: {
          userId,
          shuffleMode: false,
          repeatMode: 'off'
        }
      });
    }

    res.json(settings);
  } catch (error) {
    console.error('Get queue settings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update queue settings
export const updateQueueSettings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const { shuffleMode, repeatMode } = req.body;

    // Validate repeatMode
    if (repeatMode && !['off', 'one', 'all'].includes(repeatMode)) {
      res.status(400).json({ message: 'Invalid repeat mode. Must be "off", "one", or "all"' });
      return;
    }

    const updateData: any = {};
    if (typeof shuffleMode === 'boolean') {
      updateData.shuffleMode = shuffleMode;
    }
    if (repeatMode) {
      updateData.repeatMode = repeatMode;
    }

    const settings = await prisma.userQueueSettings.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        shuffleMode: shuffleMode ?? false,
        repeatMode: repeatMode ?? 'off'
      }
    });

    res.json(settings);
  } catch (error) {
    console.error('Update queue settings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
