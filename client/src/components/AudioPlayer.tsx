import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAudio } from '../contexts/AudioContext.tsx';
import { useQueue } from '../contexts/QueueContext.tsx';
import QueuePanel from './QueuePanel.tsx';

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
    seekTo,
    playNext,
    playPrevious,
    playFromQueue
  } = useAudio();

  const { queue, queueLength } = useQueue();
  const [isQueueOpen, setIsQueueOpen] = useState(false);


  const handleTrackSelect = (postId: string) => {
    const queueIndex = queue.findIndex(item => item.postId === postId);
    if (queueIndex !== -1) {
      playFromQueue(queueIndex);
    }
    setIsQueueOpen(false);
  };

  // Show player by default, but with different content when no track is playing
  const hasTrack = !!currentTrack;

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
          {/* Previous Button */}
          <button
            onClick={playPrevious}
            className="control-button"
            title="Previous Track"
          >
            ⏮️
          </button>

          {/* Play/Pause Button */}
          <button
            onClick={isPlaying ? pauseTrack : resumeTrack}
            className="play-button"
          >
            {isPlaying ? '⏸️' : '▶️'}
          </button>

          {/* Next Button */}
          <button
            onClick={playNext}
            className="control-button"
            title="Next Track"
          >
            ⏭️
          </button>

          {/* Track Info */}
          <div className="flex-1 min-w-0 text-left">
            {hasTrack ? (
              <>
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
              </>
            ) : (
              <>
                <div className="text-sm font-medium text-muted truncate text-left">
                  No track selected
                </div>
                <div className="text-sm text-muted truncate text-left">
                  Add songs to queue or play a track
                </div>
              </>
            )}
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

          {/* Queue Button */}
          <button
            onClick={() => setIsQueueOpen(!isQueueOpen)}
            className="flex items-center space-x-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            title="View Queue"
          >
            <span>📋</span>
            {queueLength > 0 && (
              <span className="text-xs bg-blue-600 text-white rounded-full px-2 py-0.5 min-w-[20px] text-center">
                {queueLength}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Queue Panel */}
      <QueuePanel
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
        onTrackSelect={handleTrackSelect}
      />
    </div>
  );
};

export default AudioPlayer;
