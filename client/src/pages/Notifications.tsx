import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext.tsx';

const Notifications: React.FC = () => {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'POST_COMMENT':
        return '💬';
      case 'COMMENT_REPLY':
        return '↩️';
      default:
        return '🔔';
    }
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-primary">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-secondary mt-1">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="btn-secondary text-sm"
            >
              Mark All Read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔔</div>
            <h3 className="text-lg font-medium text-primary mb-2">No notifications yet</h3>
            <p className="text-secondary">
              When someone comments on your posts or replies to your comments, you'll see notifications here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`border rounded-lg p-4 transition-colors ${
                  notification.isRead 
                    ? 'notification-read' 
                    : 'notification-unread'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                        {notification.fromUser.username.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                        <h3 className={`font-medium ${
                          notification.isRead ? 'text-primary' : 'text-accent'
                        }`}>
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-secondary mb-2">{notification.message}</p>
                      <div className="flex items-center space-x-4 text-sm text-muted">
                        <span>{formatDate(notification.createdAt)}</span>
                        <span>by {notification.fromUser.username}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {notification.postId && (
                      <Link
                        to={`/post/${notification.postId}`}
                        onClick={() => handleNotificationClick(notification)}
                        className="btn-secondary text-sm"
                      >
                        View Post
                      </Link>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete notification"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                
                {/* Additional context for different notification types */}
                {notification.post && (
                  <div className="mt-3 p-3 bg-slate-700/50 rounded border-l-4 border-blue-500">
                    <p className="text-sm text-secondary">
                      <span className="font-medium text-accent">Post:</span> {notification.post.title}
                    </p>
                  </div>
                )}
                
                {notification.comment && (
                  <div className="mt-3 p-3 bg-slate-700/50 rounded border-l-4 border-green-500">
                    <p className="text-sm text-secondary">
                      <span className="font-medium text-green-400">Comment:</span> {notification.comment.content.substring(0, 100)}
                      {notification.comment.content.length > 100 && '...'}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
