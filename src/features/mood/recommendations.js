// src/features/mood/recommendations.js
import { db } from "../../services/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";

// Map face-api expressions to playlist tags
const moodToTags = {
  happy: ["happy", "upbeat", "pop"],
  sad: ["sad", "acoustic", "mellow"],
  neutral: ["chill", "lofi", "ambient"],
  surprised: ["energetic", "electronic", "dance"],
  angry: ["intense", "rock", "metal"],
  fearful: ["ambient", "calm", "chill"],
  disgusted: ["intense", "experimental"],
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

export default getPlaylistsForMood;
