// src/services/pagalworld.js
// Service for fetching songs from PagalWorld API

const PAGALWORLD_BASE = 'https://pagalworld-api.vercel.app';

export async function searchPagalWorldSongs(query, limit = 10) {
  try {
    const response = await fetch(`${PAGALWORLD_BASE}/search?query=${encodeURIComponent(query)}&limit=${limit}`);
    if (!response.ok) {
      throw new Error(`PagalWorld API error: ${response.status}`);
    }
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Failed to search songs from PagalWorld:', error);
    return [];
  }
}

export async function getPagalWorldSongDetails(songId) {
  try {
    const response = await fetch(`${PAGALWORLD_BASE}/song/${songId}`);
    if (!response.ok) {
      throw new Error(`PagalWorld API error: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to get song details from PagalWorld:', error);
    return null;
  }
}

// Transform PagalWorld song data to our app's format
export function transformPagalWorldSong(song) {
  return {
    id: `pagalworld_${song.id}`,
    title: song.name,
    artist: song.artist,
    url: song.downloadUrl?.[0]?.url || song.url, // Use download URL if available
    album: song.album,
    duration: song.duration,
    image: song.image,
    source: 'pagalworld',
    tags: song.tags || [],
  };
}

export default { searchPagalWorldSongs, getPagalWorldSongDetails, transformPagalWorldSong };
