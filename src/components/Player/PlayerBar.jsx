import React, { useState, useRef, useEffect } from 'react';

export const PlayerBar = () => {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

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

    window.addEventListener('playTrack', handlePlayTrack);
    return () => window.removeEventListener('playTrack', handlePlayTrack);
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

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e) => {
    if (audioRef.current) {
      const newTime = (e.target.value / 100) * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-md border-t border-gray-700 p-4">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => setDuration(audioRef.current.duration)}
        onEnded={() => setIsPlaying(false)}
      ></audio>

      {currentTrack ? (
        <div className="max-w-7xl mx-auto flex items-center space-x-4">
          {/* Track Info */}
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex-shrink-0"></div>
            <div className="min-w-0 flex-1">
              <h4 className="text-white font-medium truncate">{currentTrack.title}</h4>
              <p className="text-gray-400 text-sm truncate">{currentTrack.artist}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col items-center space-y-2 flex-1 max-w-md">
            <div className="flex items-center space-x-4">
              <button className="text-gray-400 hover:text-white transition-colors">
                <span className="text-xl">⏮</span>
              </button>
              <button
                onClick={handlePlayPause}
                className="bg-white text-black rounded-full w-10 h-10 flex items-center justify-center hover:scale-105 transition-transform"
              >
                <span className="text-lg">{isPlaying ? '⏸' : '▶'}</span>
              </button>
              <button className="text-gray-400 hover:text-white transition-colors">
                <span className="text-xl">⏭</span>
              </button>
            </div>

            {/* Progress Bar */}
            <div className="w-full flex items-center space-x-2">
              <span className="text-xs text-gray-400 w-10 text-right">{formatTime(currentTime)}</span>
              <div
                className="flex-1 h-1 bg-gray-700 rounded-full cursor-pointer relative"
                onClick={(e) => {
                  if (audioRef.current) {
                    const rect = e.target.getBoundingClientRect();
                    const percent = (e.clientX - rect.left) / rect.width;
                    audioRef.current.currentTime = percent * duration;
                  }
                }}
              >
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full relative"
                  style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                >
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg"></div>
                </div>
              </div>
              <span className="text-xs text-gray-400 w-10">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Volume & Additional Controls */}
          <div className="flex items-center space-x-2 flex-1 justify-end">
            <button className="text-gray-400 hover:text-white transition-colors">
              <span className="text-lg">🔊</span>
            </button>
            <div className="w-20 h-1 bg-gray-700 rounded-full">
              <div className="w-3/4 h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
            </div>
            <button className="text-gray-400 hover:text-white transition-colors">
              <span className="text-lg">🔁</span>
            </button>
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
