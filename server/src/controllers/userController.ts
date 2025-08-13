import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

// Configure multer for profile photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/profiles');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept image files only
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

export const uploadProfilePhoto = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// @desc    Get user profile by ID
// @route   GET /api/users/profile/:id
// @access  Public
export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Get user with their posts, comments, and stats
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: false, // Don't expose email publicly
        profilePhoto: true,
        description: true,
        createdAt: true,
        posts: {
          include: {
            tags: true,
            votes: true,
            comments: true,
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
          }
        },
        comments: {
          include: {
            post: {
              select: {
                id: true,
                title: true,
                user: {
                  select: {
                    id: true,
                    username: true
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10 // Limit recent comments
        },
        remixes: {
          include: {
            originalPost: {
              select: {
                id: true,
                title: true,
                user: {
                  select: {
                    id: true,
                    username: true
                  }
                }
              }
            },
            remixPost: {
              select: {
                id: true,
                title: true,
                filePath: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            posts: true,
            comments: true,
            remixes: true,
            votes: true
          }
        }
      }
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Calculate additional stats
    const totalUpvotes = await prisma.vote.count({
      where: {
        post: {
          userId: id
        },
        voteType: 'UPVOTE'
      }
    });

    const totalDownvotes = await prisma.vote.count({
      where: {
        post: {
          userId: id
        },
        voteType: 'DOWNVOTE'
      }
    });

    const totalCommentVotes = await prisma.commentVote.count({
      where: {
        comment: {
          userId: id
        },
        voteType: 'UPVOTE'
      }
    });

    // Get posts that were remixed from this user
    const remixedFromUser = await prisma.remix.count({
      where: {
        originalPost: {
          userId: id
        }
      }
    });

    const profileData = {
      ...user,
      stats: {
        ...user._count,
        totalUpvotes,
        totalDownvotes,
        totalCommentVotes,
        remixedFromUser,
        karmaScore: totalUpvotes - totalDownvotes + totalCommentVotes
      }
    };

    res.json(profileData);
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const userId = req.user!.id;
    const { username, description } = req.body;

    // Check if username is already taken (if changing)
    if (username) {
      const existingUser = await prisma.user.findUnique({
        where: { username }
      });

      if (existingUser && existingUser.id !== userId) {
        res.status(400).json({ message: 'Username is already taken' });
        return;
      }
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(username && { username }),
        ...(description !== undefined && { description })
      },
      select: {
        id: true,
        username: true,
        email: true,
        profilePhoto: true,
        description: true,
        createdAt: true
      }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get current user's own profile (with private info)
// @route   GET /api/users/me
// @access  Private
export const getCurrentUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        profilePhoto: true,
        description: true,
        emailVerified: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
            comments: true,
            remixes: true,
            votes: true
          }
        }
      }
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Get current user profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user's posts
// @route   GET /api/users/:id/posts
// @access  Public
export const getUserPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy as string || 'newest';

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, username: true }
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Define sorting options
    let orderBy: any = { createdAt: 'desc' }; // default to newest

    switch (sortBy) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'most_voted':
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
      where: { userId: id },
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
        _count: {
          select: {
            votes: true,
            comments: true,
            originalRemixes: true
          }
        }
      }
    });

    const total = await prisma.post.count({
      where: { userId: id }
    });

    res.json({
      data: posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      user: {
        id: user.id,
        username: user.username
      },
      sortBy
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user's remixes
// @route   GET /api/users/:id/remixes
// @access  Public
export const getUserRemixes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, username: true }
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const remixes = await prisma.remix.findMany({
      where: { userId: id },
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        originalPost: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                profilePhoto: true
              }
            }
          }
        },
        remixPost: {
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
                votes: true,
                comments: true
              }
            }
          }
        }
      }
    });

    const total = await prisma.remix.count({
      where: { userId: id }
    });

    res.json({
      data: remixes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      user: {
        id: user.id,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Get user remixes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Upload profile photo
// @route   POST /api/users/profile/photo
// @access  Private
export const uploadUserProfilePhoto = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    if (!req.file) {
      res.status(400).json({ message: 'No image file provided' });
      return;
    }

    // Get current user to check for existing profile photo
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { profilePhoto: true }
    });

    // Delete old profile photo if it exists
    if (currentUser?.profilePhoto) {
      const oldPhotoPath = path.join(__dirname, '../../', currentUser.profilePhoto);
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
    }

    // Update user with new profile photo path
    const relativePath = `uploads/profiles/${req.file.filename}`;
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { profilePhoto: relativePath },
      select: {
        id: true,
        username: true,
        email: true,
        profilePhoto: true,
        description: true,
        createdAt: true
      }
    });

    res.json({
      message: 'Profile photo uploaded successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Upload profile photo error:', error);
    
    // Clean up uploaded file if there was an error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete profile photo
// @route   DELETE /api/users/profile/photo
// @access  Private
export const deleteUserProfilePhoto = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Get current user to check for existing profile photo
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { profilePhoto: true }
    });

    if (!currentUser?.profilePhoto) {
      res.status(404).json({ message: 'No profile photo to delete' });
      return;
    }

    // Delete the file
    const photoPath = path.join(__dirname, '../../', currentUser.profilePhoto);
    if (fs.existsSync(photoPath)) {
      fs.unlinkSync(photoPath);
    }

    // Update user to remove profile photo
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { profilePhoto: null },
      select: {
        id: true,
        username: true,
        email: true,
        profilePhoto: true,
        description: true,
        createdAt: true
      }
    });

    res.json({
      message: 'Profile photo deleted successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Delete profile photo error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
