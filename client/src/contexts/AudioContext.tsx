import React, { createContext, useContext, useState, useRef, ReactNode } from 'react';

interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  url: string;
  duration?: number;
  postId: string;
}

interface AudioContextType {
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  playlist: AudioTrack[];
  playTrack: (track: AudioTrack) => void;
  pauseTrack: () => void;
  resumeTrack: () => void;
  setVolume: (volume: number) => void;
  seekTo: (time: number) => void;
  addToPlaylist: (track: AudioTrack) => void;
  removeFromPlaylist: (trackId: string) => void;
  clearPlaylist: () => void;
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
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playTrack = (track: AudioTrack) => {
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
    });

    setCurrentTrack(track);
    setIsPlaying(true);
    audio.play().catch(console.error);
  };

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
  };

  const value = {
    currentTrack,
    isPlaying,
    volume,
    currentTime,
    duration,
    playlist,
    playTrack,
    pauseTrack,
    resumeTrack,
    setVolume,
    seekTo,
    addToPlaylist,
    removeFromPlaylist,
    clearPlaylist,
  };

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
};
