import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// @desc    Get user's notifications
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        fromUser: {
          select: {
            id: true,
            username: true,
            profilePhoto: true
          }
        },
        post: {
          select: {
            id: true,
            title: true
          }
        },
        comment: {
          select: {
            id: true,
            content: true
          }
        }
      }
    });

    const total = await prisma.notification.count({
      where: { userId }
    });

    const unreadCount = await prisma.notification.count({
      where: { 
        userId,
        isRead: false
      }
    });

    res.json({
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      unreadCount
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markNotificationAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if notification exists and belongs to user
    const notification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notification) {
      res.status(404).json({ message: 'Notification not found' });
      return;
    }

    if (notification.userId !== userId) {
      res.status(403).json({ message: 'Not authorized to access this notification' });
      return;
    }

    // Mark as read
    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
      include: {
        fromUser: {
          select: {
            id: true,
            username: true,
            profilePhoto: true
          }
        },
        post: {
          select: {
            id: true,
            title: true
          }
        },
        comment: {
          select: {
            id: true,
            content: true
          }
        }
      }
    });

    res.json(updatedNotification);
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllNotificationsAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    await prisma.notification.updateMany({
      where: { 
        userId,
        isRead: false
      },
      data: { isRead: true }
    });

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if notification exists and belongs to user
    const notification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notification) {
      res.status(404).json({ message: 'Notification not found' });
      return;
    }

    if (notification.userId !== userId) {
      res.status(403).json({ message: 'Not authorized to delete this notification' });
      return;
    }

    await prisma.notification.delete({
      where: { id }
    });

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
export const getUnreadNotificationCount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const unreadCount = await prisma.notification.count({
      where: { 
        userId,
        isRead: false
      }
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error('Get unread notification count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to create notifications
export const createNotification = async (
  userId: string,
  type: string,
  title: string,
  message: string,
  fromUserId: string,
  postId?: string,
  commentId?: string
): Promise<void> => {
  try {
    // Don't create notification if user is notifying themselves
    if (userId === fromUserId) {
      return;
    }

    await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        fromUserId,
        postId,
        commentId
      }
    });
  } catch (error) {
    console.error('Create notification error:', error);
    // Don't throw error to avoid breaking the main operation
  }
};
