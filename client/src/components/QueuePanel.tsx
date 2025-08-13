import React, { useState } from 'react';
import { useQueue } from '../contexts/QueueContext.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useAudio } from '../contexts/AudioContext.tsx';
import { API_CONFIG } from '../config/api';
import './QueuePanel.css';

interface QueuePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onTrackSelect: (postId: string) => void;
}

const QueuePanel: React.FC<QueuePanelProps> = ({ isOpen, onClose, onTrackSelect }) => {
  const { user } = useAuth();
  const { currentTrack } = useAudio();
  const {
    queue,
    settings,
    loading,
    error,
    removeFromQueue,
    reorderQueue,
    clearQueue,
    updateSettings,
    isEmpty
  } = useQueue();

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);


  if (!isOpen) return null;

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    try {
      await reorderQueue(draggedIndex, dropIndex);
    } catch (err) {
      console.error('Failed to reorder queue:', err);
    }
    
    setDraggedIndex(null);
  };

  const handleRemoveTrack = async (postId: string) => {
    try {
      await removeFromQueue(postId);
    } catch (err) {
      console.error('Failed to remove track:', err);
    }
  };

  const handleClearQueue = async () => {
    if (window.confirm('Are you sure you want to clear the entire queue?')) {
      try {
        await clearQueue();
      } catch (err) {
        console.error('Failed to clear queue:', err);
      }
    }
  };

  const handleShuffleToggle = async () => {
    try {
      await updateSettings({ shuffleMode: !settings?.shuffleMode });
    } catch (err) {
      console.error('Failed to update shuffle mode:', err);
    }
  };

  const handleRepeatToggle = async () => {
    const modes: Array<'off' | 'one' | 'all'> = ['off', 'one', 'all'];
    const currentIndex = modes.indexOf(settings?.repeatMode || 'off');
    const nextMode = modes[(currentIndex + 1) % modes.length];
    
    try {
      await updateSettings({ repeatMode: nextMode });
    } catch (err) {
      console.error('Failed to update repeat mode:', err);
    }
  };


  if (!user) {
    return (
      <div className="queue-panel">
        <div className="queue-header">
          <h3>Queue</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="queue-content">
          <div className="queue-empty">
            <p>Please log in to use the queue feature</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="queue-panel">
      <div className="queue-header">
        <h3>Queue ({queue.length})</h3>
        <div className="queue-controls">
          <button
            className={`control-btn ${settings?.shuffleMode ? 'active' : ''}`}
            onClick={handleShuffleToggle}
            title="Shuffle"
          >
            🔀
          </button>
          <button
            className={`control-btn ${settings?.repeatMode !== 'off' ? 'active' : ''}`}
            onClick={handleRepeatToggle}
            title={`Repeat: ${settings?.repeatMode || 'off'}`}
          >
            {settings?.repeatMode === 'one' ? '🔂' : '🔁'}
          </button>
          {!isEmpty && (
            <button
              className="control-btn clear-btn"
              onClick={handleClearQueue}
              title="Clear Queue"
            >
              🗑️
            </button>
          )}
        </div>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="queue-content">
        {loading && <div className="queue-loading">Loading queue...</div>}
        
        {error && <div className="queue-error">{error}</div>}
        
        
        {queue.length === 0 && !loading && (
          <div className="queue-empty">
            <p>Your queue is empty</p>
            <p>Add tracks by clicking the "Add to Queue" button on any audio post</p>
          </div>
        )}

        {queue.length > 0 && (
          <div className="queue-list">
            {queue.map((item, index) => {
              const isCurrentlyPlaying = currentTrack && currentTrack.postId === item.postId;
              
              return (
                <div
                  key={item.id}
                  className={`queue-item ${draggedIndex === index ? 'dragging' : ''} ${isCurrentlyPlaying ? 'now-playing' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  <div className="queue-item-number">
                    {index + 1}
                  </div>
                  
                  <div className="queue-item-drag-handle">⋮⋮</div>
                  
                  <div className="queue-item-info" onClick={() => onTrackSelect(item.postId)}>
                    <img
                      src={item.post?.coverArt ? `${API_CONFIG.SERVER_URL}/${item.post.coverArt}` : `${API_CONFIG.SERVER_URL}/uploads/covers/default.gif`}
                      alt={item.post?.title || 'Unknown'}
                      className="queue-item-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `${API_CONFIG.SERVER_URL}/uploads/covers/default.gif`;
                      }}
                    />
                    <div className="queue-item-details">
                      <div className="queue-item-title">
                        {item.post?.title || 'Unknown Title'}
                      </div>
                      <div className="queue-item-artist">
                        by {item.post?.user?.username || 'Unknown Artist'}
                      </div>
                    </div>
                  </div>

                  <div className="queue-item-actions">
                    <button
                      className="queue-item-remove"
                      onClick={() => handleRemoveTrack(item.postId)}
                      title="Remove from queue"
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default QueuePanel;
