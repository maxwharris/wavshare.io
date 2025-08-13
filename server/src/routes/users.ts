import { Router } from 'express';
import { body } from 'express-validator';
import { auth } from '../middleware/auth';
import { 
  getUserProfile, 
  updateUserProfile, 
  getCurrentUserProfile,
  getUserPosts,
  getUserRemixes
} from '../controllers/userController';

const router = Router();

// @route   GET /api/users/me
// @desc    Get current user's profile (with private info)
// @access  Private
router.get('/me', auth, getCurrentUserProfile);

// @route   GET /api/users/profile/:id
// @desc    Get user profile by ID
// @access  Public
router.get('/profile/:id', getUserProfile);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', 
  auth,
  [
    body('username')
      .optional()
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters')
  ],
  updateUserProfile
);

// @route   GET /api/users/:id/posts
// @desc    Get user's posts
// @access  Public
router.get('/:id/posts', getUserPosts);

// @route   GET /api/users/:id/remixes
// @desc    Get user's remixes
// @access  Public
router.get('/:id/remixes', getUserRemixes);

export default router;
