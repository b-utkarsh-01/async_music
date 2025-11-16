// src/services/youtube-music.js
// Service for fetching songs from YouTube Music using node-youtube-music

// Note: This package may not work in browser environment
// Let's use a different approach or remove it for now
// const ytmusic = require('node-youtube-music');

export async function searchYouTubeMusic(query, limit = 10) {
  try {
    // For now, return empty array since the package doesn't work in browser
    // TODO: Implement YouTube Music API using a different approach
    console.log('YouTube Music search not implemented yet:', query);
    return [];
  } catch (error) {
    console.error('Failed to search songs from YouTube Music:', error);
    return [];
  }
}

export async function getYouTubeMusicSong(videoId) {
  try {
    // For now, return null since the package doesn't work in browser
    // TODO: Implement YouTube Music API using a different approach
    console.log('YouTube Music get song not implemented yet:', videoId);
    return null;
  } catch (error) {
    console.error('Failed to get song details from YouTube Music:', error);
    return null;
  }
}

// Transform YouTube Music song data to our app's format
export function transformYouTubeMusicSong(song) {
  return {
    id: `youtube_${song.youtubeId}`,
    title: song.title,
    artist: song.artists?.[0]?.name || 'Unknown Artist',
    url: `https://www.youtube.com/watch?v=${song.youtubeId}`, // YouTube URL
    album: song.album || 'Unknown Album',
    duration: song.duration?.totalSeconds || 0,
    image: song.thumbnails?.[0]?.url || '',
    source: 'youtube-music',
    tags: song.tags || [],
  };
}

export default { searchYouTubeMusic, getYouTubeMusicSong, transformYouTubeMusicSong };
