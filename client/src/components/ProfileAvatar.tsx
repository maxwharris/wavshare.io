import React from 'react';
import { buildServerUrl } from '../config/api';
import { Link } from 'react-router-dom';

interface ProfileAvatarProps {
  user: {
    id: string;
    username: string;
    profilePhoto?: string;
  };
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLink?: boolean;
  className?: string;
}

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ 
  user, 
  size = 'md', 
  showLink = true,
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-20 h-20 text-2xl'
  };

  const avatarElement = (
    <div className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-semibold ${className}`}>
      {user.profilePhoto ? (
        <img
          src={buildServerUrl(user.profilePhoto)}
          alt={`${user.username}'s profile`}
          className={`${sizeClasses[size]} rounded-full object-cover border border-slate-600`}
        />
      ) : (
        <div className={`${sizeClasses[size]} bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold border border-slate-600`}>
          {user.username.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );

  if (showLink) {
    return (
      <Link 
        to={`/profile/${user.id}`}
        className="hover:opacity-80 transition-opacity"
        title={`View ${user.username}'s profile`}
      >
        {avatarElement}
      </Link>
    );
  }

  return avatarElement;
};

export default ProfileAvatar;
