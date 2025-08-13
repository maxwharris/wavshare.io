import React from 'react';
import { Link } from 'react-router-dom';
import { useAudio } from '../contexts/AudioContext.tsx';

const AudioPlayer: React.FC = () => {
  const { 
    currentTrack, 
    isPlaying, 
    volume, 
    currentTime, 
    duration,
    pauseTrack,
    resumeTrack,
    setVolume,
    seekTo
  } = useAudio();

  if (!currentTrack) {
    return null;
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newTime = (clickX / width) * duration;
    seekTo(newTime);
  };

  return (
    <div className="audio-player audio-player-container shadow-2xl p-4">
      <div className="container mx-auto">
        <div className="flex items-center space-x-4">
          {/* Play/Pause Button */}
          <button
            onClick={isPlaying ? pauseTrack : resumeTrack}
            className="play-button"
          >
            {isPlaying ? '⏸️' : '▶️'}
          </button>

          {/* Track Info */}
          <div className="flex-1 min-w-0 text-left">
            <Link 
              to={`/post/${currentTrack.postId}`}
              className="text-sm font-medium text-primary truncate text-left hover:text-accent transition-colors block"
            >
              {currentTrack.title}
            </Link>
            <Link 
              to={`/profile/${currentTrack.userId}`}
              className="text-sm text-secondary truncate text-left hover:text-primary transition-colors block"
            >
              {currentTrack.artist}
            </Link>
          </div>

          {/* Progress Bar */}
          <div className="flex-1 max-w-md">
            <div className="flex items-center space-x-2 text-sm text-secondary">
              <span>{formatTime(currentTime)}</span>
              <div 
                className="progress-bar flex-1"
                onClick={handleProgressClick}
              >
                <div 
                  className="progress-fill"
                  style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Volume Control */}
          <div className="flex items-center space-x-2">
            <span className="text-sm">🔊</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="volume-slider"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
