import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// @desc    Vote on a post
// @route   POST /api/posts/:postId/vote
// @access  Private
export const voteOnPost = async (req: AuthRequest, res: Response): Promise<void> => {
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
    const { voteType } = req.body;
    const userId = req.user!.id;

    // Validate vote type
    if (!['UPVOTE', 'DOWNVOTE'].includes(voteType)) {
      res.status(400).json({ message: 'Invalid vote type. Must be UPVOTE or DOWNVOTE' });
      return;
    }

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }

    // Check if user already voted on this post
    const existingVote = await prisma.vote.findUnique({
      where: {
        userId_postId: {
          userId,
          postId
        }
      }
    });

    if (existingVote) {
      // If same vote type, remove the vote (toggle off)
      if (existingVote.voteType === voteType) {
        await prisma.vote.delete({
          where: {
            userId_postId: {
              userId,
              postId
            }
          }
        });

        // Get updated vote counts
        const voteCounts = await getVoteCounts(postId);
        
        res.json({
          message: 'Vote removed',
          userVote: null,
          voteCounts
        });
        return;
      } else {
        // Different vote type, update the existing vote
        await prisma.vote.update({
          where: {
            userId_postId: {
              userId,
              postId
            }
          },
          data: {
            voteType
          }
        });

        // Get updated vote counts
        const voteCounts = await getVoteCounts(postId);

        res.json({
          message: 'Vote updated',
          userVote: voteType,
          voteCounts
        });
        return;
      }
    }

    // Create new vote
    await prisma.vote.create({
      data: {
        userId,
        postId,
        voteType
      }
    });

    // Get updated vote counts
    const voteCounts = await getVoteCounts(postId);

    res.json({
      message: 'Vote created',
      userVote: voteType,
      voteCounts
    });
  } catch (error) {
    console.error('Vote on post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Remove vote from a post
// @route   DELETE /api/posts/:postId/vote
// @access  Private
export const removeVote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { postId } = req.params;
    const userId = req.user!.id;

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }

    // Check if user has voted on this post
    const existingVote = await prisma.vote.findUnique({
      where: {
        userId_postId: {
          userId,
          postId
        }
      }
    });

    if (!existingVote) {
      res.status(404).json({ message: 'Vote not found' });
      return;
    }

    // Remove the vote
    await prisma.vote.delete({
      where: {
        userId_postId: {
          userId,
          postId
        }
      }
    });

    // Get updated vote counts
    const voteCounts = await getVoteCounts(postId);

    res.json({
      message: 'Vote removed',
      userVote: null,
      voteCounts
    });
  } catch (error) {
    console.error('Remove vote error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get vote status for a post
// @route   GET /api/posts/:postId/vote
// @access  Public (but returns user vote only if authenticated)
export const getVoteStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { postId } = req.params;
    const userId = req.user?.id;

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }

    // Get vote counts
    const voteCounts = await getVoteCounts(postId);

    // Get user's vote if authenticated
    let userVote = null;
    if (userId) {
      const vote = await prisma.vote.findUnique({
        where: {
          userId_postId: {
            userId,
            postId
          }
        }
      });
      userVote = vote?.voteType || null;
    }

    res.json({
      userVote,
      voteCounts
    });
  } catch (error) {
    console.error('Get vote status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to get vote counts
const getVoteCounts = async (postId: string) => {
  const upvotes = await prisma.vote.count({
    where: {
      postId,
      voteType: 'UPVOTE'
    }
  });

  const downvotes = await prisma.vote.count({
    where: {
      postId,
      voteType: 'DOWNVOTE'
    }
  });

  return {
    upvotes,
    downvotes,
    total: upvotes - downvotes
  };
};
