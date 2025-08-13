// API Configuration - Using Create React App's built-in environment variable support
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api',
  SERVER_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  ENVIRONMENT: process.env.REACT_APP_ENVIRONMENT || 'development'
};

// Helper functions for building API URLs
export const buildApiUrl = (endpoint) => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_CONFIG.BASE_URL}/${cleanEndpoint}`;
};

export const buildServerUrl = (path) => {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_CONFIG.SERVER_URL}/${cleanPath}`;
};

// Common API endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: buildApiUrl('auth/login'),
  REGISTER: buildApiUrl('auth/register'),
  VERIFY_EMAIL: (token) => buildApiUrl(`auth/verify-email/${token}`),
  
  // Posts
  POSTS: buildApiUrl('posts'),
  POST_BY_ID: (id) => buildApiUrl(`posts/${id}`),
  POST_DOWNLOAD: (id) => buildApiUrl(`posts/${id}/download`),
  
  // Comments
  COMMENTS: (postId) => buildApiUrl(`comments/${postId}`),
  COMMENT_BY_ID: (id) => buildApiUrl(`comments/${id}`),
  COMMENT_DOWNLOAD: (id) => buildApiUrl(`comments/${id}/download`),
  COMMENT_REPLIES: (commentId) => buildApiUrl(`comments/${commentId}/replies`),
  COMMENT_VOTE: (commentId) => buildApiUrl(`comments/${commentId}/vote`),
  COMMENT_DELETE: (id) => buildApiUrl(`comments/${id}`),
  
  // Votes
  VOTE: (postId) => buildApiUrl(`votes/${postId}`),
  
  // Users
  USER_PROFILE: buildApiUrl('users/profile'),
  USER_PROFILE_BY_ID: (userId) => buildApiUrl(`users/profile/${userId}`),
  USER_PROFILE_PHOTO: buildApiUrl('users/profile/photo'),
  
  // Notifications
  NOTIFICATIONS: buildApiUrl('notifications'),
  NOTIFICATIONS_UNREAD_COUNT: buildApiUrl('notifications/unread-count'),
  NOTIFICATION_READ: (id) => buildApiUrl(`notifications/${id}/read`),
  NOTIFICATIONS_READ_ALL: buildApiUrl('notifications/read-all'),
  NOTIFICATION_DELETE: (id) => buildApiUrl(`notifications/${id}`),
  
  // Search
  SEARCH: buildApiUrl('search')
};
