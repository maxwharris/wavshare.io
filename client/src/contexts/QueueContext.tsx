import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { queueService, QueueItem, QueueSettings } from '../services/queueService.ts';
import { useAuth } from './AuthContext.tsx';
import { useAudio } from './AudioContext.tsx';
import { usePlaylist } from './PlaylistContext.tsx';
import { API_CONFIG } from '../config/api';

interface QueueContextType {
  // State
  queue: QueueItem[];
  settings: QueueSettings | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  loadQueue: () => Promise<void>;
  addToQueue: (postId: string) => Promise<{ message: string; queueItem: QueueItem }>;
  addToQueueNext: (postId: string) => Promise<{ message: string; queueItem: QueueItem }>;
  removeFromQueue: (postId: string) => Promise<void>;
  reorderQueue: (fromIndex: number, toIndex: number) => Promise<void>;
  clearQueue: () => Promise<void>;
  updateSettings: (newSettings: Partial<Pick<QueueSettings, 'shuffleMode' | 'repeatMode'>>) => Promise<QueueSettings>;
  
  // Utilities
  isInQueue: (postId: string) => boolean;
  getQueuePosition: (postId: string) => number | null;
  queueLength: number;
  isEmpty: boolean;
}

const QueueContext = createContext<QueueContextType | undefined>(undefined);

export const useQueue = () => {
  const context = useContext(QueueContext);
  if (context === undefined) {
    throw new Error('useQueue must be used within a QueueProvider');
  }
  return context;
};

interface QueueProviderProps {
  children: ReactNode;
}

export const QueueProvider: React.FC<QueueProviderProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { setQueue: setAudioQueue, currentTrack, isPlaying } = useAudio();
  const { setQueueRefreshCallback } = usePlaylist();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [settings, setSettings] = useState<QueueSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load queue from server
  const loadQueue = useCallback(async () => {
    if (!user) {
      setQueue([]);
      setSettings(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await queueService.getUserQueue();
      setQueue(response.queue);
      setSettings(response.settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load queue');
      console.error('Failed to load queue:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Add track to queue
  const addToQueue = useCallback(async (postId: string) => {
    if (!user) {
      throw new Error('Must be logged in to add to queue');
    }

    setError(null);

    try {
      console.log('Adding to queue:', postId);
      const response = await queueService.addToQueue(postId);
      console.log('Add to queue response:', response);
      
      setQueue(prev => {
        const newQueue = [...prev, response.queueItem];
        console.log('Queue state updated. Old length:', prev.length, 'New length:', newQueue.length);
        console.log('New queue:', newQueue);
        return newQueue;
      });
      
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add to queue';
      setError(errorMessage);
      console.error('Add to queue error:', err);
      throw new Error(errorMessage);
    }
  }, [user]);

  // Add track to front of queue (play next)
  const addToQueueNext = useCallback(async (postId: string) => {
    if (!user) {
      throw new Error('Must be logged in to add to queue');
    }

    setError(null);

    try {
      console.log('Adding to queue next:', postId);
      const response = await queueService.addToQueueNext(postId);
      console.log('Add to queue next response:', response);
      
      setQueue(prev => {
        const newQueue = [response.queueItem, ...prev];
        console.log('Queue state updated. Old length:', prev.length, 'New length:', newQueue.length);
        console.log('New queue:', newQueue);
        return newQueue;
      });
      
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add to queue next';
      setError(errorMessage);
      console.error('Add to queue next error:', err);
      throw new Error(errorMessage);
    }
  }, [user]);

  // Remove track from queue
  const removeFromQueue = useCallback(async (postId: string) => {
    if (!user) {
      throw new Error('Must be logged in to modify queue');
    }

    setError(null);

    try {
      await queueService.removeFromQueue(postId);
      setQueue(prev => prev.filter(item => item.postId !== postId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove from queue';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user]);

  // Reorder queue
  const reorderQueue = useCallback(async (fromIndex: number, toIndex: number) => {
    if (!user) {
      throw new Error('Must be logged in to modify queue');
    }

    // Optimistically update UI
    const newQueue = [...queue];
    const [movedItem] = newQueue.splice(fromIndex, 1);
    newQueue.splice(toIndex, 0, movedItem);
    setQueue(newQueue);

    setError(null);

    try {
      await queueService.reorderQueue(fromIndex, toIndex);
    } catch (err) {
      // Revert on error
      setQueue(queue);
      const errorMessage = err instanceof Error ? err.message : 'Failed to reorder queue';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user, queue]);

  // Clear entire queue
  const clearQueue = useCallback(async () => {
    if (!user) {
      throw new Error('Must be logged in to modify queue');
    }

    setError(null);

    try {
      await queueService.clearQueue();
      setQueue([]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear queue';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user]);

  // Update queue settings
  const updateSettings = useCallback(async (newSettings: Partial<Pick<QueueSettings, 'shuffleMode' | 'repeatMode'>>) => {
    if (!user) {
      throw new Error('Must be logged in to modify settings');
    }

    setError(null);

    try {
      const updatedSettings = await queueService.updateQueueSettings(newSettings);
      setSettings(updatedSettings);
      return updatedSettings;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update settings';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user]);

  // Check if track is in queue
  const isInQueue = useCallback((postId: string) => {
    return queue.some(item => item.postId === postId);
  }, [queue]);

  // Get queue position of track
  const getQueuePosition = useCallback((postId: string) => {
    const index = queue.findIndex(item => item.postId === postId);
    return index >= 0 ? index : null;
  }, [queue]);

  // Load queue when user changes (but only after auth loading is complete)
  useEffect(() => {
    if (!authLoading) {
      loadQueue();
    }
  }, [user, authLoading, loadQueue]);

  // Register loadQueue callback with PlaylistContext
  useEffect(() => {
    setQueueRefreshCallback(loadQueue);
    return () => setQueueRefreshCallback(null);
  }, [loadQueue, setQueueRefreshCallback]);

  // Sync queue with audio player
  useEffect(() => {
    if (queue.length > 0) {
      const audioTracks = queue.map(item => ({
        id: item.post.id,
        title: item.post.title,
        artist: item.post.user.username,
        url: `${API_CONFIG.SERVER_URL}/${item.post.filePath}`,
        postId: item.post.id,
        userId: item.post.user.id
      }));
      setAudioQueue(audioTracks);
    } else {
      setAudioQueue([]);
    }
  }, [queue, setAudioQueue]);

  // Auto-remove completed tracks from queue
  useEffect(() => {
    let previousTrack: typeof currentTrack = null;
    let wasPlaying = false;

    const checkTrackCompletion = () => {
      if (previousTrack && wasPlaying && !isPlaying && currentTrack !== previousTrack) {
        // Track has finished playing, remove it from queue
        const completedTrackPostId = previousTrack.postId;
        if (isInQueue(completedTrackPostId)) {
          removeFromQueue(completedTrackPostId).catch(err => {
            console.error('Failed to auto-remove completed track:', err);
          });
        }
      }
      
      previousTrack = currentTrack;
      wasPlaying = isPlaying;
    };

    const interval = setInterval(checkTrackCompletion, 1000);
    return () => clearInterval(interval);
  }, [currentTrack, isPlaying, isInQueue, removeFromQueue]);

  const value: QueueContextType = {
    // State
    queue,
    settings,
    loading,
    error,
    
    // Actions
    loadQueue,
    addToQueue,
    addToQueueNext,
    removeFromQueue,
    reorderQueue,
    clearQueue,
    updateSettings,
    
    // Utilities
    isInQueue,
    getQueuePosition,
    queueLength: queue.length,
    isEmpty: queue.length === 0
  };

  return (
    <QueueContext.Provider value={value}>
      {children}
    </QueueContext.Provider>
  );
};
