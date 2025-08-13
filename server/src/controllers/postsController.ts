import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/audio';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  // Accept only audio files
  if (file.mimetype.startsWith('audio/')) {
    cb(null, true);
  } else {
    cb(new Error('Only audio files are allowed!'), false);
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter
  // No file size limits - allows files of any size
});

// @desc    Get all posts
// @route   GET /api/posts
// @access  Public
export const getPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy as string || 'newest';

    // Define sorting options
    let orderBy: any = { createdAt: 'desc' }; // default to newest

    switch (sortBy) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'most_voted':
        // We'll need to calculate vote scores in a subquery
        orderBy = [
          { votes: { _count: 'desc' } },
          { createdAt: 'desc' }
        ];
        break;
      case 'most_commented':
        orderBy = [
          { comments: { _count: 'desc' } },
          { createdAt: 'desc' }
        ];
        break;
      case 'most_remixed':
        orderBy = [
          { originalRemixes: { _count: 'desc' } },
          { createdAt: 'desc' }
        ];
        break;
      case 'title_asc':
        orderBy = { title: 'asc' };
        break;
      case 'title_desc':
        orderBy = { title: 'desc' };
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    const posts = await prisma.post.findMany({
      skip,
      take: limit,
      orderBy,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilePhoto: true
          }
        },
        tags: true,
        remixPosts: {
          include: {
            originalPost: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true
                  }
                }
              }
            }
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
    });

    const total = await prisma.post.count();

    res.json({
      data: posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      sortBy
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a post
// @route   POST /api/posts
// @access  Private
export const createPost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
      return;
    }

    const { title, description, postType, youtubeUrl, tags } = req.body;
    const userId = req.user!.id;

    // Validate post type
    if (!['AUDIO_FILE', 'YOUTUBE_LINK'].includes(postType)) {
      res.status(400).json({ message: 'Invalid post type' });
      return;
    }

    // Validate based on post type
    if (postType === 'YOUTUBE_LINK' && !youtubeUrl) {
      res.status(400).json({ message: 'YouTube URL is required for YouTube posts' });
      return;
    }

    if (postType === 'AUDIO_FILE' && !req.file) {
      res.status(400).json({ message: 'Audio file is required for audio posts' });
      return;
    }

    // Create the post
    const postData: any = {
      title,
      description,
      postType,
      userId
    };

    if (postType === 'YOUTUBE_LINK') {
      postData.youtubeUrl = youtubeUrl;
    } else if (postType === 'AUDIO_FILE' && req.file) {
      postData.filePath = req.file.path;
    }

    const post = await prisma.post.create({
      data: postData,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilePhoto: true
          }
        },
        tags: true,
        _count: {
          select: {
            votes: true,
            comments: true,
            originalRemixes: true
          }
        }
      }
    });

    // Handle tags if provided
    if (tags && Array.isArray(tags) && tags.length > 0) {
      const tagConnections = [];
      
      for (const tagName of tags) {
        // Find or create tag
        let tag = await prisma.tag.findUnique({
          where: { name: tagName.toLowerCase().trim() }
        });

        if (!tag) {
          tag = await prisma.tag.create({
            data: { name: tagName.toLowerCase().trim() }
          });
        }

        tagConnections.push({
          postId: post.id,
          tagId: tag.id
        });
      }

      // Connect tags to post
      await prisma.postTag.createMany({
        data: tagConnections
      });

      // Fetch the updated post with tags
      const updatedPost = await prisma.post.findUnique({
        where: { id: post.id },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              profilePhoto: true
            }
          },
          tags: true,
          _count: {
            select: {
              votes: true,
              comments: true,
              originalRemixes: true
            }
          }
        }
      });

      res.status(201).json(updatedPost);
    } else {
      res.status(201).json(post);
    }
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get post by ID
// @route   GET /api/posts/:id
// @access  Public
export const getPostById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilePhoto: true,
            description: true
          }
        },
        tags: true,
        votes: {
          include: {
            user: {
              select: {
                id: true,
                username: true
              }
            }
          }
        },
        comments: {
          where: {
            parentCommentId: null // Only top-level comments
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                profilePhoto: true
              }
            },
            votes: true,
            replies: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    profilePhoto: true
                  }
                },
                votes: true,
                _count: {
                  select: {
                    votes: true,
                    replies: true
                  }
                }
              },
              orderBy: {
                createdAt: 'asc'
              }
            },
            _count: {
              select: {
                votes: true,
                replies: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
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
    });

    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }

    res.json(post);
  } catch (error) {
    console.error('Get post by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Private (only post owner)
export const updatePost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, tags } = req.body;
    const userId = req.user!.id;

    // Check if post exists and user owns it
    const existingPost = await prisma.post.findUnique({
      where: { id }
    });

    if (!existingPost) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }

    if (existingPost.userId !== userId) {
      res.status(403).json({ message: 'Not authorized to update this post' });
      return;
    }

    // Update the post
    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        title: title || existingPost.title,
        description: description !== undefined ? description : existingPost.description
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilePhoto: true
          }
        },
        tags: true,
        _count: {
          select: {
            votes: true,
            comments: true,
            originalRemixes: true
          }
        }
      }
    });

    // Handle tags update if provided
    if (tags && Array.isArray(tags)) {
      // Remove existing tag connections
      await prisma.postTag.deleteMany({
        where: { postId: id }
      });

      // Add new tag connections
      if (tags.length > 0) {
        const tagConnections = [];
        
        for (const tagName of tags) {
          // Find or create tag
          let tag = await prisma.tag.findUnique({
            where: { name: tagName.toLowerCase().trim() }
          });

          if (!tag) {
            tag = await prisma.tag.create({
              data: { name: tagName.toLowerCase().trim() }
            });
          }

          tagConnections.push({
            postId: id,
            tagId: tag.id
          });
        }

        await prisma.postTag.createMany({
          data: tagConnections
        });
      }

      // Fetch the updated post with new tags
      const finalPost = await prisma.post.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              profilePhoto: true
            }
          },
          tags: true,
          _count: {
            select: {
              votes: true,
              comments: true,
              originalRemixes: true
            }
          }
        }
      });

      res.json(finalPost);
    } else {
      res.json(updatedPost);
    }
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private (only post owner)
export const deletePost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if post exists and user owns it
    const existingPost = await prisma.post.findUnique({
      where: { id }
    });

    if (!existingPost) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }

    if (existingPost.userId !== userId) {
      res.status(403).json({ message: 'Not authorized to delete this post' });
      return;
    }

    // Delete associated file if it exists
    if (existingPost.filePath && fs.existsSync(existingPost.filePath)) {
      fs.unlinkSync(existingPost.filePath);
    }

    // Delete the post (cascade will handle related records)
    await prisma.post.delete({
      where: { id }
    });

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Download audio file
// @route   GET /api/posts/:id/download
// @access  Public
export const downloadAudioFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Get the post
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            username: true
          }
        }
      }
    });

    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }

    // Check if it's an audio file post
    if (post.postType !== 'AUDIO_FILE' || !post.filePath) {
      res.status(400).json({ message: 'This post does not have a downloadable audio file' });
      return;
    }

    // Check if file exists
    if (!fs.existsSync(post.filePath)) {
      res.status(404).json({ message: 'Audio file not found on server' });
      return;
    }

    // Get file info
    const fileExtension = path.extname(post.filePath);
    const fileName = `${post.user.username}_${post.title.replace(/[^a-zA-Z0-9]/g, '_')}${fileExtension}`;

    // Set headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'audio/mpeg');

    // Stream the file
    const fileStream = fs.createReadStream(post.filePath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('File stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error downloading file' });
      }
    });
  } catch (error) {
    console.error('Download audio file error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Server error' });
    }
  }
};
