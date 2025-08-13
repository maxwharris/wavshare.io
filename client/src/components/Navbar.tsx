import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useNotifications } from '../contexts/NotificationContext.tsx';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();

  return (
    <nav className="bg-slate-800 shadow-xl border-b border-slate-700">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="remix-logo text-2xl">
            RemixThis
          </Link>
          
          <div className="flex items-center space-x-6">
            <Link to="/" className="nav-link">
              Home
            </Link>
            
            {user ? (
              <>
                <Link to="/create" className="nav-link">
                  Create Post
                </Link>
                <Link to="/notifications" className="relative nav-link">
                  <span className="text-xl">🔔</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center notification-badge">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
                <Link to={`/profile/${user.id}`} className="nav-link">
                  Profile
                </Link>
                <button
                  onClick={logout}
                  className="text-slate-300 hover:text-red-400 transition-colors font-medium"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link">
                  Login
                </Link>
                <Link to="/register" className="btn-primary hover-glow">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
