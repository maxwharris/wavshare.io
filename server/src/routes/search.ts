import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/search - Search for posts, users, and tags
router.get('/', async (req, res): Promise<void> => {
  try {
    const { q, bpmMin, bpmMax, key } = req.query;

    // Check if we have at least one search parameter
    if ((!q || typeof q !== 'string' || q.trim().length === 0) && !bpmMin && !bpmMax && !key) {
      res.status(400).json({ message: 'At least one search parameter is required' });
      return;
    }

    const searchQuery = q && typeof q === 'string' ? q.trim() : '';
    const bpmMinNum = bpmMin && typeof bpmMin === 'string' ? parseInt(bpmMin) : null;
    const bpmMaxNum = bpmMax && typeof bpmMax === 'string' ? parseInt(bpmMax) : null;
    const keyFilter = key && typeof key === 'string' ? key : null;

    // Build where conditions for posts
    const whereConditions: any = {};
    const andConditions: any[] = [];

    // Text search conditions
    if (searchQuery) {
      andConditions.push({
        OR: [
          {
            title: {
              contains: searchQuery
            }
          },
          {
            description: {
              contains: searchQuery
            }
          },
          {
            user: {
              username: {
                contains: searchQuery
              }
            }
          },
          {
            postTags: {
              some: {
                tag: {
                  name: {
                    contains: searchQuery
                  }
                }
              }
            }
          }
        ]
      });
    }

    // Key filtering
    if (keyFilter) {
      andConditions.push({
        postTags: {
          some: {
            tag: {
              name: `key:${keyFilter}`
            }
          }
        }
      });
    }

    // Set up where clause
    if (andConditions.length > 0) {
      whereConditions.AND = andConditions;
    }

    // Search posts
    let posts = await prisma.post.findMany({
      where: whereConditions,
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
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limit results
    });

    // Search users by username or description
    const users = await prisma.user.findMany({
      where: {
        OR: [
          {
            username: {
              contains: searchQuery
            }
          },
          {
            description: {
              contains: searchQuery
            }
          }
        ]
      },
      select: {
        id: true,
        username: true,
        profilePhoto: true,
        description: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
            remixes: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20 // Limit results
    });

    // Search tags by name
    const tags = await prisma.tag.findMany({
      where: {
        name: {
          contains: searchQuery
        }
      },
      include: {
        _count: {
          select: {
            postTags: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      },
      take: 30 // Limit results
    });

    // Search playlists by name or description
    const playlists = await prisma.playlist.findMany({
      where: {
        OR: [
          {
            name: {
              contains: searchQuery
            }
          },
          {
            description: {
              contains: searchQuery
            }
          },
          {
            user: {
              username: {
                contains: searchQuery
              }
            }
          }
        ]
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
          select: {
            tracks: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 20 // Limit results
    });

    res.json({
      posts,
      users,
      tags,
      playlists
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
