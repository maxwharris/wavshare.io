import { Router } from 'express';
import { body } from 'express-validator';
import { auth } from '../middleware/auth';
import { 
  getPosts, 
  createPost, 
  getPostById, 
  updatePost, 
  deletePost,
  downloadAudioFile,
  upload 
} from '../controllers/postsController';

const router = Router();

// @route   GET /api/posts
// @desc    Get all posts
// @access  Public
router.get('/', getPosts);

// @route   POST /api/posts
// @desc    Create a post
// @access  Private (no email verification required for now)
router.post(
  '/',
  auth,
  upload.fields([
    { name: 'audioFile', maxCount: 1 },
    { name: 'coverArt', maxCount: 1 }
  ]),
  [
    body('title')
      .isLength({ min: 1, max: 200 })
      .withMessage('Title must be between 1 and 200 characters'),
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Description must be less than 1000 characters'),
    body('postType')
      .isIn(['AUDIO_FILE', 'YOUTUBE_LINK'])
      .withMessage('Post type must be either AUDIO_FILE or YOUTUBE_LINK'),
    body('youtubeUrl')
      .optional()
      .isURL()
      .withMessage('Please provide a valid YouTube URL'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array'),
    body('originalPostId')
      .optional()
      .isString()
      .withMessage('Original post ID must be a string')
  ],
  createPost
);

// @route   GET /api/posts/:id
// @desc    Get post by ID
// @access  Public
router.get('/:id', getPostById);

// @route   PUT /api/posts/:id
// @desc    Update post
// @access  Private (only post owner)
router.put(
  '/:id',
  auth,
  [
    body('title')
      .optional()
      .isLength({ min: 1, max: 200 })
      .withMessage('Title must be between 1 and 200 characters'),
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Description must be less than 1000 characters'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array')
  ],
  updatePost
);

// @route   DELETE /api/posts/:id
// @desc    Delete post
// @access  Private (only post owner)
router.delete('/:id', auth, deletePost);

// @route   GET /api/posts/:id/download
// @desc    Download audio file
// @access  Public
router.get('/:id/download', downloadAudioFile);

export default router;
