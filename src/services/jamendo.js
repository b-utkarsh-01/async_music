// src/services/jamendo.js
// Jamendo API service for fetching free music tracks
// Jamendo offers a free API tier with no authentication required for basic usage

const JAMENDO_API_BASE = 'https://api.jamendo.com/v3.0';

export async function fetchFreeTracks(limit = 10, tags = []) {
  try {
    // Jamendo API doesn't require client_id for basic usage
    const params = new URLSearchParams({
      format: 'json',
      limit: limit.toString(),
      include: 'musicinfo',
      order: 'popularity_total',
      audioformat: 'mp32',
    });

    if (tags.length > 0) {
      params.append('tags', tags.join(','));
    }

    const response = await fetch(`${JAMENDO_API_BASE}/tracks?${params}`);
    if (!response.ok) {
      throw new Error(`Jamendo API error: ${response.status}`);
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Failed to fetch tracks from Jamendo:', error);
    return [];
  }
}

export async function searchTracks(query, limit = 10) {
  try {
    const params = new URLSearchParams({
      format: 'json',
      limit: limit.toString(),
      include: 'musicinfo',
      search: query,
      audioformat: 'mp32',
    });

    const response = await fetch(`${JAMENDO_API_BASE}/tracks?${params}`);
    if (!response.ok) {
      throw new Error(`Jamendo API error: ${response.status}`);
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Failed to search tracks from Jamendo:', error);
    return [];
  }
}

// Transform Jamendo track data to our app's format
export function transformJamendoTrack(track) {
  return {
    id: `jamendo_${track.id}`,
    title: track.name,
    artist: track.artist_name,
    url: track.audio, // Direct audio URL
    album: track.album_name,
    duration: track.duration,
    image: track.image,
    source: 'jamendo', // To distinguish from uploaded tracks
    tags: track.tags || [],
  };
}

export default { fetchFreeTracks, searchTracks, transformJamendoTrack };
