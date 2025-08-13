import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { createNotification } from './notificationController';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

// Configure multer for audio file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/audio');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'remix-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept audio files only
  if (file.mimetype.startsWith('audio/')) {
    cb(null, true);
  } else {
    cb(new Error('Only audio files are allowed!'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 250 * 1024 * 1024 // 250MB limit
  }
});

// @desc    Get comments for a post (hierarchical with replies)
// @route   GET /api/posts/:postId/comments
// @access  Public
export const getComments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { postId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }

    // Get top-level comments (no parent) with their replies
    const comments = await prisma.comment.findMany({
      where: { 
        postId,
        parentCommentId: null // Only top-level comments
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilePhoto: true
          }
        },
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
        votes: true,
        _count: {
          select: {
            votes: true,
            replies: true
          }
        }
      }
    });

    const total = await prisma.comment.count({
      where: { 
        postId,
        parentCommentId: null
      }
    });

    res.json({
      data: comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a comment (with optional remix audio)
// @route   POST /api/posts/:postId/comments
// @access  Private
export const createComment = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user!.id;
    const audioFile = req.file;

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }

    // Prepare comment data
    const commentData: any = {
      content: content || '',
      userId,
      postId
    };

    // If audio file is uploaded, this is a remix comment
    if (audioFile) {
      const relativePath = path.relative(
        path.join(__dirname, '../../'),
        audioFile.path
      ).replace(/\\/g, '/');
      
      commentData.filePath = relativePath;
      commentData.isRemix = true;

      // Create a corresponding post for the remix
      const remixPost = await prisma.post.create({
        data: {
          userId,
          title: `Remix of "${post.title}"`,
          description: content || `Remix by ${req.user!.username}`,
          filePath: relativePath,
          postType: 'AUDIO_FILE'
        }
      });

      // Create remix relationship
      await prisma.remix.create({
        data: {
          originalPostId: postId,
          remixPostId: remixPost.id,
          userId
        }
      });
    }

    // Create the comment
    const comment = await prisma.comment.create({
      data: commentData,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilePhoto: true
          }
        }
      }
    });

    // Create notification for post owner (if not commenting on own post)
    if (post.userId !== userId) {
      const notificationTitle = audioFile ? 'New remix on your post' : 'New comment on your post';
      const notificationMessage = audioFile 
        ? `${req.user!.username} created a remix on your post "${post.title}"`
        : `${req.user!.username} commented on your post "${post.title}"`;

      await createNotification(
        post.userId,
        'POST_COMMENT',
        notificationTitle,
        notificationMessage,
        userId,
        postId,
        comment.id
      );
    }

    res.status(201).json(comment);
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a comment
// @route   PUT /api/comments/:id
// @access  Private (only comment owner)
export const updateComment = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user!.id;

    // Check if comment exists and user owns it
    const existingComment = await prisma.comment.findUnique({
      where: { id }
    });

    if (!existingComment) {
      res.status(404).json({ message: 'Comment not found' });
      return;
    }

    if (existingComment.userId !== userId) {
      res.status(403).json({ message: 'Not authorized to update this comment' });
      return;
    }

    // Update the comment
    const updatedComment = await prisma.comment.update({
      where: { id },
      data: { content },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilePhoto: true
          }
        }
      }
    });

    res.json(updatedComment);
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Private (comment owner or post owner)
export const deleteComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if comment exists and get post info
    const existingComment = await prisma.comment.findUnique({
      where: { id },
      include: {
        post: {
          select: {
            userId: true
          }
        }
      }
    });

    if (!existingComment) {
      res.status(404).json({ message: 'Comment not found' });
      return;
    }

    // Allow deletion if user is comment owner OR post owner
    if (existingComment.userId !== userId && existingComment.post.userId !== userId) {
      res.status(403).json({ message: 'Not authorized to delete this comment' });
      return;
    }

    // Delete associated audio file if it exists
    if (existingComment.filePath && fs.existsSync(path.join(__dirname, '../../', existingComment.filePath))) {
      fs.unlinkSync(path.join(__dirname, '../../', existingComment.filePath));
    }

    // Delete the comment (cascade will handle related records like votes and replies)
    await prisma.comment.delete({
      where: { id }
    });

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a reply to a comment
// @route   POST /api/comments/:commentId/replies
// @access  Private
export const createReply = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user!.id;
    const audioFile = req.file;

    // Check if parent comment exists
    const parentComment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        post: true
      }
    });

    if (!parentComment) {
      res.status(404).json({ message: 'Parent comment not found' });
      return;
    }

    // Prepare reply data
    const replyData: any = {
      content: content || '',
      userId,
      postId: parentComment.postId,
      parentCommentId: commentId
    };

    // If audio file is uploaded, this is a remix reply
    if (audioFile) {
      const relativePath = path.relative(
        path.join(__dirname, '../../'),
        audioFile.path
      ).replace(/\\/g, '/');
      
      replyData.filePath = relativePath;
      replyData.isRemix = true;

      // Create a corresponding post for the remix
      const remixPost = await prisma.post.create({
        data: {
          userId,
          title: `Remix reply to "${parentComment.post.title}"`,
          description: content || `Remix reply by ${req.user!.username}`,
          filePath: relativePath,
          postType: 'AUDIO_FILE'
        }
      });

      // Create remix relationship
      await prisma.remix.create({
        data: {
          originalPostId: parentComment.postId,
          remixPostId: remixPost.id,
          userId
        }
      });
    }

    // Create the reply
    const reply = await prisma.comment.create({
      data: replyData,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilePhoto: true
          }
        }
      }
    });

    // Create notification for parent comment owner (if not replying to own comment)
    if (parentComment.userId !== userId) {
      const notificationTitle = audioFile ? 'New remix reply to your comment' : 'New reply to your comment';
      const notificationMessage = audioFile 
        ? `${req.user!.username} created a remix reply to your comment on "${parentComment.post.title}"`
        : `${req.user!.username} replied to your comment on "${parentComment.post.title}"`;

      await createNotification(
        parentComment.userId,
        'COMMENT_REPLY',
        notificationTitle,
        notificationMessage,
        userId,
        parentComment.postId,
        reply.id
      );
    }

    res.status(201).json(reply);
  } catch (error) {
    console.error('Create reply error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Vote on a comment
// @route   POST /api/comments/:commentId/vote
// @access  Private
export const voteOnComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { commentId } = req.params;
    const { voteType } = req.body;
    const userId = req.user!.id;

    // Validate vote type
    if (!['UPVOTE', 'DOWNVOTE'].includes(voteType)) {
      res.status(400).json({ message: 'Invalid vote type. Must be UPVOTE or DOWNVOTE' });
      return;
    }

    // Check if comment exists
    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      res.status(404).json({ message: 'Comment not found' });
      return;
    }

    // Check if user has already voted on this comment
    const existingVote = await prisma.commentVote.findUnique({
      where: {
        userId_commentId: {
          userId,
          commentId
        }
      }
    });

    if (existingVote) {
      if (existingVote.voteType === voteType) {
        // Same vote type - remove the vote (toggle off)
        await prisma.commentVote.delete({
          where: { id: existingVote.id }
        });
      } else {
        // Different vote type - update the vote
        await prisma.commentVote.update({
          where: { id: existingVote.id },
          data: { voteType }
        });
      }
    } else {
      // No existing vote - create new vote
      await prisma.commentVote.create({
        data: {
          userId,
          commentId,
          voteType
        }
      });
    }

    // Get updated vote counts and user's current vote
    const votes = await prisma.commentVote.findMany({
      where: { commentId }
    });

    const upvotes = votes.filter(v => v.voteType === 'UPVOTE').length;
    const downvotes = votes.filter(v => v.voteType === 'DOWNVOTE').length;
    const userVote = votes.find(v => v.userId === userId)?.voteType || null;

    res.json({
      userVote,
      voteCounts: {
        upvotes,
        downvotes,
        total: upvotes - downvotes
      }
    });
  } catch (error) {
    console.error('Vote on comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get comment vote status
// @route   GET /api/comments/:commentId/votes
// @access  Public (but shows user vote if authenticated)
export const getCommentVotes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { commentId } = req.params;
    const userId = req.user?.id;

    // Check if comment exists
    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      res.status(404).json({ message: 'Comment not found' });
      return;
    }

    // Get all votes for this comment
    const votes = await prisma.commentVote.findMany({
      where: { commentId }
    });

    const upvotes = votes.filter(v => v.voteType === 'UPVOTE').length;
    const downvotes = votes.filter(v => v.voteType === 'DOWNVOTE').length;
    const userVote = userId ? votes.find(v => v.userId === userId)?.voteType || null : null;

    res.json({
      userVote,
      voteCounts: {
        upvotes,
        downvotes,
        total: upvotes - downvotes
      }
    });
  } catch (error) {
    console.error('Get comment votes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Download remix audio from comment
// @route   GET /api/comments/:id/download
// @access  Public
export const downloadRemixComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Get the comment with user info
    const comment = await prisma.comment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            username: true
          }
        },
        post: {
          select: {
            title: true
          }
        }
      }
    });

    if (!comment) {
      res.status(404).json({ message: 'Comment not found' });
      return;
    }

    if (!comment.filePath || !comment.isRemix) {
      res.status(404).json({ message: 'No audio file found for this comment' });
      return;
    }

    const filePath = path.join(__dirname, '../../', comment.filePath);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ message: 'Audio file not found' });
      return;
    }

    // Generate a clean filename
    const fileExtension = path.extname(comment.filePath);
    const cleanFilename = `${comment.user.username}_remix_of_${comment.post.title}${fileExtension}`
      .replace(/[^a-zA-Z0-9._-]/g, '_');

    // Set headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${cleanFilename}"`);
    res.setHeader('Content-Type', 'audio/mpeg');

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Download remix comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
