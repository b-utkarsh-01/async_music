// src/features/mood/recommendations.js
import { db } from "../../services/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { fetchFreeTracks, transformJamendoTrack } from "../../services/jamendo";

// Map face-api expressions to playlist tags
const moodToTags = {
  happy: ["happy", "upbeat", "pop"],
  sad: ["sad", "acoustic", "mellow"],
  neutral: ["neutral", "chill", "lofi", "ambient"],
  surprised: ["surprised", "energetic", "electronic", "dance"],
  angry: ["angry", "intense", "rock", "metal"],
  fearful: ["fearful", "ambient", "calm", "chill"],
  disgusted: ["disgusted", "intense", "experimental"],
};

export async function getPlaylistsForMood(mood, max = 5) {
  try {
    const tags = moodToTags[mood] || [mood];
    const playlists = [];

    // Query playlists collection for any of the tags (array-contains-any)
    // If your Firestore rules / indexes don't allow array-contains-any, adjust accordingly.
    const col = collection(db, "playlists");
    const q = query(col, where("tags", "array-contains-any", tags), limit(max));
    const snap = await getDocs(q);
    snap.forEach((doc) => {
      playlists.push({ id: doc.id, ...doc.data() });
    });

    // Fallback: if none found, return a small default set (could be static)
    if (playlists.length === 0) {
      return [
        { id: "default-1", title: "Chill Hits", description: "Relaxed beats to match your mood" },
        { id: "default-2", title: "Top Vibes", description: "Popular tracks to lift spirits" },
      ];
    }

    return playlists;
  } catch (err) {
    console.error("getPlaylistsForMood error:", err);
    return [];
  }
}

export async function getTracksForMood(mood, max = 10) {
  try {
    const tags = moodToTags[mood] || [mood];

    // First try to get tracks from Firestore
    const tracksCol = collection(db, "tracks");
    const tracksQuery = query(tracksCol, where("tags", "array-contains-any", tags), limit(max));
    const tracksSnap = await getDocs(tracksQuery);
    const firestoreTracks = [];
    tracksSnap.forEach((doc) => {
      firestoreTracks.push({ id: doc.id, ...doc.data(), source: 'firestore' });
    });

    // If we have enough tracks from Firestore, return them
    if (firestoreTracks.length >= max) {
      return firestoreTracks.slice(0, max);
    }

    // Otherwise, supplement with API tracks
    const remaining = max - firestoreTracks.length;
    const apiTracks = await fetchFreeTracks(remaining, tags);
    const transformedApiTracks = apiTracks.map(transformJamendoTrack);

    return [...firestoreTracks, ...transformedApiTracks];
  } catch (err) {
    console.error("getTracksForMood error:", err);
    // Fallback to API tracks only
    try {
      const tags = moodToTags[mood] || [mood];
      const apiTracks = await fetchFreeTracks(max, tags);
      return apiTracks.map(transformJamendoTrack);
    } catch (apiErr) {
      console.error("API fallback failed:", apiErr);
      return [];
    }
  }
}

export default getPlaylistsForMood;
