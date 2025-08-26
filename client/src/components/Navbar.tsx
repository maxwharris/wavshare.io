import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useNotifications } from '../contexts/NotificationContext.tsx';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="remix-logo text-2xl">
            wavshare
          </Link>
          
          <div className="flex items-center space-x-6">
            <Link to="/" className="nav-link">
              home
            </Link>
            <Link to="/search" className="nav-link">
              search
            </Link>
            
            {user ? (
              <>
                <Link to="/create" className="nav-link">
                  create post
                </Link>
                <Link to="/notifications" className="relative nav-link">
                  <span className="text-xl">🔔</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center notification-badge">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
                <Link to={`/profile/${user.id}`} className="nav-link">
                  profile
                </Link>
                <button
                  onClick={logout}
                  className="text-gray-600 hover:text-red-500 transition-colors font-medium"
                >
                  logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link">
                  login
                </Link>
                <Link to="/register" className="btn-primary hover-glow">
                  sign up
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
