import { Router } from 'express';
import { auth } from '../middleware/auth';
import { 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadNotificationCount
} from '../controllers/notificationController';

const router = Router();

// @route   GET /api/notifications
// @desc    Get user's notifications
// @access  Private
router.get('/', auth, getNotifications);

// @route   GET /api/notifications/unread-count
// @desc    Get unread notification count
// @access  Private
router.get('/unread-count', auth, getUnreadNotificationCount);

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read-all', auth, markAllNotificationsAsRead);

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', auth, markNotificationAsRead);

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
// @access  Private
router.delete('/:id', auth, deleteNotification);

export default router;
