


import React, { useState, useRef, useEffect } from 'react';

export const PlayerBar = () => {
  const [currentTrack, setCurrentTrack] = useState(() => {
    const saved = localStorage.getItem('player_currentTrack');
    return saved ? JSON.parse(saved) : null;
  });
  const [isPlaying, setIsPlaying] = useState(() => {
    const saved = localStorage.getItem('player_isPlaying');
    return saved ? JSON.parse(saved) : false;
  });
  const [currentTime, setCurrentTime] = useState(() => {
    const saved = localStorage.getItem('player_currentTime');
    return saved ? parseFloat(saved) : 0;
  });
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('player_volume');
    return saved ? parseFloat(saved) : 1;
  });
  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem('player_isMuted');
    return saved ? JSON.parse(saved) : false;
  });
  const [playlist, setPlaylist] = useState(() => {
    const saved = localStorage.getItem('player_playlist');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentIndex, setCurrentIndex] = useState(() => {
    const saved = localStorage.getItem('player_currentIndex');
    return saved ? parseInt(saved) : -1;
  });
  const audioRef = useRef(null);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('player_currentTrack', JSON.stringify(currentTrack));
  }, [currentTrack]);

  useEffect(() => {
    localStorage.setItem('player_isPlaying', JSON.stringify(isPlaying));
  }, [isPlaying]);

  useEffect(() => {
    localStorage.setItem('player_currentTime', currentTime.toString());
  }, [currentTime]);

  useEffect(() => {
    localStorage.setItem('player_volume', volume.toString());
  }, [volume]);

  useEffect(() => {
    localStorage.setItem('player_isMuted', JSON.stringify(isMuted));
  }, [isMuted]);

  useEffect(() => {
    localStorage.setItem('player_playlist', JSON.stringify(playlist));
  }, [playlist]);

  useEffect(() => {
    localStorage.setItem('player_currentIndex', currentIndex.toString());
  }, [currentIndex]);

  // Restore playback state on mount
  useEffect(() => {
    if (currentTrack && audioRef.current) {
      audioRef.current.src = currentTrack.url;
      audioRef.current.currentTime = currentTime;
      audioRef.current.volume = isMuted ? 0 : volume;
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      }
    }
  }, [currentTrack, currentTime, volume, isMuted, isPlaying]);

  // Listen for track play events from other components
  useEffect(() => {
    const handlePlayTrack = async (event) => {
      const track = event.detail;
      console.log('Playing track:', track);
      console.log('Track URL:', track.url);
      console.log('Track source:', track.source);

      let finalUrl = track.url;

      // Check if this is a Firebase Storage track
      if (track.source === 'firestore' && track.url) {
        // Firebase Storage URLs should be accessible
        console.log('Firebase Storage URL detected');
      }

      setCurrentTrack(track);
      setIsPlaying(true);
      if (audioRef.current) {
        audioRef.current.src = finalUrl;
        audioRef.current.load(); // Force reload of audio source
        audioRef.current.play().catch((error) => {
          console.error('Error playing audio:', error);
          console.error('Track details:', track);
          console.error('Audio src after error:', audioRef.current.src);
        });
      }
    };

    const handlePlayPlaylist = async (event) => {
      const { tracks, startIndex } = event.detail;
      setPlaylist(tracks);
      setCurrentIndex(startIndex);
      const track = tracks[startIndex];
      setCurrentTrack(track);
      setIsPlaying(true);
      if (audioRef.current) {
        audioRef.current.src = track.url;
        audioRef.current.load();
        audioRef.current.play().catch(console.error);
      }
    };

    window.addEventListener('playTrack', handlePlayTrack);
    window.addEventListener('playPlaylist', handlePlayPlaylist);
    return () => {
      window.removeEventListener('playTrack', handlePlayTrack);
      window.removeEventListener('playPlaylist', handlePlayPlaylist);
    };
  }, []);

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    if (playlist.length > 0 && currentIndex < playlist.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      const nextTrack = playlist[nextIndex];
      setCurrentTrack(nextTrack);
      setIsPlaying(true);
      if (audioRef.current) {
        audioRef.current.src = nextTrack.url;
        audioRef.current.load();
        audioRef.current.play().catch(console.error);
      }
    }
  };

  const handlePrevious = () => {
    if (playlist.length > 0 && currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      const prevTrack = playlist[prevIndex];
      setCurrentTrack(prevTrack);
      setIsPlaying(true);
      if (audioRef.current) {
        audioRef.current.src = prevTrack.url;
        audioRef.current.load();
        audioRef.current.play().catch(console.error);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e) => {
    if (audioRef.current && duration) {
      const newTime = (e.target.value / 100) * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (e) => {
    const inputValue = e.target.value / 100;
    // Snap to nearest volume level: 20%, 40%, 60%, 70%, 80%, 100%
    const volumeLevels = [0.2, 0.4, 0.6, 0.7, 0.8, 1.0];
    const newVolume = volumeLevels.reduce((prev, curr) =>
      Math.abs(curr - inputValue) < Math.abs(prev - inputValue) ? curr : prev
    );
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-md border-t border-gray-700 p-2 md:p-4  ">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => setDuration(audioRef.current.duration)}
        onEnded={() => setIsPlaying(false)}
      ></audio>

      {currentTrack ? (
        <div className="max-w-7xl mx-auto flex flex-col space-y-2">
          {/* Desktop Layout */}
          <div className="hidden md:flex flex-col space-y-2">
            {/* Top row: Track Info, Progress Bar, Volume */}
            <div className="flex items-center gap-4 justify-between w-full">
              <div className="flex items-center space-x-3 min-w-0 flex-none max-w-xs">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex-shrink-0"></div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-white font-medium text-base truncate">{currentTrack.title}</h4>
                  <p className="text-gray-400 text-sm truncate">{currentTrack.artist}</p>
                </div>
              </div>

              <div className="flex flex-col w-full">
                {/* Bottom row: Controls centered */}
                <div className="flex justify-center">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={handlePrevious}
                      className={`text-gray-400 hover:text-white transition-colors text-xl ${playlist.length === 0 || currentIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={playlist.length === 0 || currentIndex === 0}
                    >
                      <span>⏮</span>
                    </button>
                    <button
                      onClick={handlePlayPause}
                      className="bg-white text-black rounded-full w-10 h-10 flex items-center justify-center hover:scale-105 transition-transform text-lg"
                    >
                      <span>{isPlaying ? '⏸' : '▶'}</span>
                    </button>
                    <button
                      onClick={handleNext}
                      className={`text-gray-400 hover:text-white transition-colors text-xl ${playlist.length === 0 || currentIndex === playlist.length - 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={playlist.length === 0 || currentIndex === playlist.length - 1}
                    >
                      <span>⏭</span>
                    </button>
                  </div>
                </div>
                <div className="flex-1 flex items-center space-x-2 w-full">
                  <span className="text-xs text-gray-400 w-10 text-right">{formatTime(currentTime)}</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={duration ? (currentTime / duration) * 100 : 0}
                    onChange={handleSeek}
                    className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #8b5cf6 0%, #ec4899 ${(currentTime / duration) * 100}%, #374151 ${(currentTime / duration) * 100}%, #374151 100%)`
                    }}
                  />
                  <span className="text-xs text-gray-400 w-10">{formatTime(duration)}</span>
                </div>
              </div>

              <div className="flex items-center flex-none">
                <div className="w-60 flex items-center gap-2 justify-center">
                  <button
                    onClick={toggleMute}
                    className="w-20 text-gray-400 hover:text-white transition-colors text-lg flex-shrink-0"
                  >
                    <span>{isMuted || volume === 0 ? '🔇' : volume > 0.5 ? '🔊' : '🔉'}</span>
                  </button>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    step="20"
                    value={isMuted ? 0 : volume * 100}
                    onChange={handleVolumeChange}
                    className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="flex flex-col space-y-3 md:hidden w-full">
            {/* Track Info - Centered */}
            <div className="flex items-center justify-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex-shrink-0"></div>
              <div className="text-center min-w-0 flex-1">
                <h4 className="text-white font-medium text-base truncate">{currentTrack.title}</h4>
                <p className="text-gray-400 text-sm truncate">{currentTrack.artist}</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full flex items-center space-x-2">
              <span className="text-xs text-gray-400 w-10 text-right">{formatTime(currentTime)}</span>
              <input
                type="range"
                min="0"
                max="100"
                value={duration ? (currentTime / duration) * 100 : 0}
                onChange={handleSeek}
                className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #8b5cf6 0%, #ec4899 ${(currentTime / duration) * 100}%, #374151 ${(currentTime / duration) * 100}%, #374151 100%)`
                }}
              />
              <span className="text-xs text-gray-400 w-10">{formatTime(duration)}</span>
            </div>

            {/* Controls and Volume - Side by Side */}
            <div className="flex justify-between items-center w-full">
              {/* Controls - Left */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={handlePrevious}
                  className={`text-gray-400 hover:text-white transition-colors text-xl ${playlist.length === 0 || currentIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={playlist.length === 0 || currentIndex === 0}
                >
                  <span>⏮</span>
                </button>
                <button
                  onClick={handlePlayPause}
                  className="bg-white text-black rounded-full w-10 h-10 flex items-center justify-center hover:scale-105 transition-transform text-lg"
                >
                  <span>{isPlaying ? '⏸' : '▶'}</span>
                </button>
                <button
                  onClick={handleNext}
                  className={`text-gray-400 hover:text-white transition-colors text-xl ${playlist.length === 0 || currentIndex === playlist.length - 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={playlist.length === 0 || currentIndex === playlist.length - 1}
                >
                  <span>⏭</span>
                </button>
              </div>

              {/* Volume Controls - Right */}
              <div className="w-32 flex items-center space-x-2">
                <button
                  onClick={toggleMute}
                  className="text-gray-400 hover:text-white transition-colors text-lg w-10"
                >
                  <span>{isMuted || volume === 0 ? '🔇' : volume > 0.5 ? '🔊' : '🔉'}</span>
                </button>
                <input
                  type="range"
                  min="20"
                  max="100"
                  step="20"
                  value={isMuted ? 0 : volume * 100}
                  onChange={handleVolumeChange}
                  className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center text-gray-400">
          <span className="text-sm">No track selected</span>
        </div>
      )}
    </div>
  );
};

export default PlayerBar;
