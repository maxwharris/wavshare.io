import { Router } from 'express';
import { body } from 'express-validator';
import { auth } from '../middleware/auth';
import { 
  getComments, 
  createComment, 
  updateComment, 
  deleteComment, 
  createReply,
  voteOnComment,
  getCommentVotes,
  upload, 
  downloadRemixComment 
} from '../controllers/commentController';

const router = Router();

// @route   GET /api/comments/:postId
// @desc    Get comments for a post
// @access  Public
router.get('/:postId', getComments);

// @route   POST /api/comments/:postId
// @desc    Create a comment (with optional remix audio)
// @access  Private
router.post('/:postId', 
  auth,
  upload.single('audioFile'),
  [
    body('content')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Comment content must be less than 1000 characters')
  ],
  createComment
);

// @route   PUT /api/comments/:id
// @desc    Update a comment
// @access  Private (only comment owner)
router.put('/:id',
  auth,
  [
    body('content')
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Comment content must be between 1 and 1000 characters')
  ],
  updateComment
);

// @route   DELETE /api/comments/:id
// @desc    Delete a comment
// @access  Private (only comment owner)
router.delete('/:id', auth, deleteComment);

// @route   POST /api/comments/:commentId/replies
// @desc    Create a reply to a comment (with optional remix audio)
// @access  Private
router.post('/:commentId/replies',
  auth,
  upload.single('audioFile'),
  [
    body('content')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Reply content must be less than 1000 characters')
  ],
  createReply
);

// @route   POST /api/comments/:commentId/vote
// @desc    Vote on a comment
// @access  Private
router.post('/:commentId/vote',
  auth,
  [
    body('voteType')
      .isIn(['UPVOTE', 'DOWNVOTE'])
      .withMessage('Vote type must be UPVOTE or DOWNVOTE')
  ],
  voteOnComment
);

// @route   GET /api/comments/:commentId/votes
// @desc    Get comment vote status
// @access  Public
router.get('/:commentId/votes', getCommentVotes);

// @route   GET /api/comments/:id/download
// @desc    Download remix audio from comment
// @access  Public
router.get('/:id/download', downloadRemixComment);

export default router;
