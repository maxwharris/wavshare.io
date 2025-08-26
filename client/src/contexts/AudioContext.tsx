import React, { createContext, useContext, useState, useRef, ReactNode, useCallback } from 'react';

interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  url: string;
  duration?: number;
  postId: string;
  userId: string;
  coverArt?: string;
}

interface AudioContextType {
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  playlist: AudioTrack[];
  currentTrackIndex: number;
  playTrack: (track: AudioTrack, fromQueue?: boolean) => void;
  pauseTrack: () => void;
  resumeTrack: () => void;
  setVolume: (volume: number) => void;
  seekTo: (time: number) => void;
  addToPlaylist: (track: AudioTrack) => void;
  removeFromPlaylist: (trackId: string) => void;
  clearPlaylist: () => void;
  playNext: () => void;
  playPrevious: () => void;
  setQueue: (tracks: AudioTrack[]) => void;
  playFromQueue: (trackIndex: number) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};

interface AudioProviderProps {
  children: ReactNode;
}

export const AudioProvider: React.FC<AudioProviderProps> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.7);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playlist, setPlaylist] = useState<AudioTrack[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(-1);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playNext = useCallback(() => {
    if (playlist.length === 0) return;
    
    const nextIndex = currentTrackIndex + 1;
    if (nextIndex < playlist.length) {
      const nextTrack = playlist[nextIndex];
      setCurrentTrackIndex(nextIndex);
      playTrack(nextTrack, true);
    }
  }, [playlist, currentTrackIndex]);

  const playTrack = useCallback((track: AudioTrack, fromQueue: boolean = false) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(track.url);
    audioRef.current = audio;
    
    audio.volume = volume;
    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
    });
    
    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
    });
    
    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentTime(0);
      // Auto-play next track in queue
      setTimeout(() => {
        playNext();
      }, 100);
    });

    setCurrentTrack(track);
    setIsPlaying(true);
    
    // Update current track index if playing from queue
    if (fromQueue && playlist.length > 0) {
      const trackIndex = playlist.findIndex(t => t.postId === track.postId);
      if (trackIndex !== -1) {
        setCurrentTrackIndex(trackIndex);
      }
    }
    
    audio.play().catch(console.error);
  }, [volume, playlist, playNext]);

  const pauseTrack = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const resumeTrack = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(console.error);
      setIsPlaying(true);
    }
  };

  const setVolume = (newVolume: number) => {
    setVolumeState(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const addToPlaylist = (track: AudioTrack) => {
    setPlaylist(prev => [...prev, track]);
  };

  const removeFromPlaylist = (trackId: string) => {
    setPlaylist(prev => prev.filter(track => track.id !== trackId));
  };

  const clearPlaylist = () => {
    setPlaylist([]);
    setCurrentTrackIndex(-1);
  };

  const playPrevious = useCallback(() => {
    if (playlist.length === 0) return;
    
    const prevIndex = currentTrackIndex - 1;
    if (prevIndex >= 0) {
      const prevTrack = playlist[prevIndex];
      setCurrentTrackIndex(prevIndex);
      playTrack(prevTrack, true);
    }
  }, [playlist, currentTrackIndex, playTrack]);

  const setQueue = useCallback((tracks: AudioTrack[]) => {
    setPlaylist(tracks);
    setCurrentTrackIndex(-1);
  }, []);

  const playFromQueue = useCallback((trackIndex: number) => {
    if (trackIndex >= 0 && trackIndex < playlist.length) {
      const track = playlist[trackIndex];
      setCurrentTrackIndex(trackIndex);
      playTrack(track, true);
    }
  }, [playlist, playTrack]);

  const value = {
    currentTrack,
    isPlaying,
    volume,
    currentTime,
    duration,
    playlist,
    currentTrackIndex,
    playTrack,
    pauseTrack,
    resumeTrack,
    setVolume,
    seekTo,
    addToPlaylist,
    removeFromPlaylist,
    clearPlaylist,
    playNext,
    playPrevious,
    setQueue,
    playFromQueue,
  };

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
};
