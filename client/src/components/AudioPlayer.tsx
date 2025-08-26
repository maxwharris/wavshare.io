import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAudio } from '../contexts/AudioContext.tsx';
import { useQueue } from '../contexts/QueueContext.tsx';
import QueuePanel from './QueuePanel.tsx';
import { API_CONFIG } from '../config/api';

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
    <div className="audio-player audio-player-enhanced shadow-2xl p-6">
      <div className="container mx-auto">
        <div className="flex items-center space-x-6">
          {/* Enhanced Control Buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={playPrevious}
              className="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 border border-emerald-500"
              title="Previous Track"
              disabled={!hasTrack}
            >
              ⏮️
            </button>

            {/* Enhanced Play/Pause Button */}
            <button
              onClick={isPlaying ? pauseTrack : resumeTrack}
              className="flex items-center justify-center w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!hasTrack}
            >
              <span className="text-xl">{isPlaying ? '⏸️' : '▶️'}</span>
            </button>

            <button
              onClick={playNext}
              className="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 border border-emerald-500"
              title="Next Track"
              disabled={!hasTrack}
            >
              ⏭️
            </button>
          </div>

          {/* Enhanced Track Info with Album Art */}
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            {hasTrack && (
              <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-300 flex-shrink-0">
                {currentTrack.coverArt ? (
                  <img
                    src={`${API_CONFIG.SERVER_URL}/${currentTrack.coverArt}`}
                    alt={`Cover art for ${currentTrack.title}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `${API_CONFIG.SERVER_URL}/uploads/covers/default.gif`;
                    }}
                  />
                ) : (
                  <img
                    src={`${API_CONFIG.SERVER_URL}/uploads/covers/default.gif`}
                    alt={`Default cover art for ${currentTrack.title}`}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            )}
            <div className="flex-1 min-w-0 text-left">
              {hasTrack ? (
                <>
                  <Link 
                    to={`/post/${currentTrack.postId}`}
                    className="text-base font-semibold text-primary truncate text-left hover:text-accent transition-colors block"
                  >
                    {currentTrack.title}
                  </Link>
                  <Link 
                    to={`/profile/${currentTrack.userId}`}
                    className="text-sm text-secondary truncate text-left hover:text-primary transition-colors block"
                  >
                    by {currentTrack.artist}
                  </Link>
                </>
              ) : (
                <>
                  <div className="text-base font-medium text-muted truncate text-left">
                    no track selected
                  </div>
                  <div className="text-sm text-muted truncate text-left">
                    add songs to queue or play a track
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Enhanced Progress Bar */}
          <div className="flex-1 max-w-md">
            <div className="flex items-center space-x-3 text-sm text-secondary">
              <span className="font-mono text-xs w-10 text-right">{formatTime(currentTime)}</span>
              <div 
                className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden cursor-pointer hover:h-3 transition-all duration-200"
                onClick={handleProgressClick}
              >
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-150 ease-out rounded-full"
                  style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>
              <span className="font-mono text-xs w-10 text-left">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Enhanced Volume Control */}
          <div className="flex items-center space-x-3">
            <span className="text-lg">🔊</span>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #10b981 0%, #10b981 ${volume * 100}%, #e5e7eb ${volume * 100}%, #e5e7eb 100%)`
                }}
              />
              <span className="text-xs text-muted w-8 text-center">{Math.round(volume * 100)}</span>
            </div>
          </div>

          {/* Enhanced Queue Button */}
          <button
            onClick={() => setIsQueueOpen(!isQueueOpen)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 ${
              isQueueOpen 
                ? 'bg-emerald-500 text-white border border-emerald-600' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-emerald-500'
            }`}
            title="View Queue"
          >
            <span>📋</span>
            <span className="text-sm font-medium">queue</span>
            {queueLength > 0 && (
              <span className="text-xs bg-emerald-600 text-white rounded-full px-2 py-0.5 min-w-[20px] text-center font-bold">
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
