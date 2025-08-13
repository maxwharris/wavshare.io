import { Router } from 'express';
import { body } from 'express-validator';
import { auth } from '../middleware/auth';
import { voteOnPost, removeVote, getVoteStatus } from '../controllers/voteController';

const router = Router();

// @route   POST /api/votes/:postId
// @desc    Vote on a post
// @access  Private
router.post('/:postId', 
  auth,
  [
    body('voteType')
      .isIn(['UPVOTE', 'DOWNVOTE'])
      .withMessage('Vote type must be UPVOTE or DOWNVOTE')
  ],
  voteOnPost
);

// @route   DELETE /api/votes/:postId
// @desc    Remove vote from a post
// @access  Private
router.delete('/:postId', auth, removeVote);

// @route   GET /api/votes/:postId
// @desc    Get vote status for a post
// @access  Public
router.get('/:postId', getVoteStatus);

export default router;
