import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, orderBy, limit, getDocs, startAfter, doc, getDoc, updateDoc, arrayRemove } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';

export default function PlaylistPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [playlistName, setPlaylistName] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (id === 'liked') {
      setPlaylistName('Liked Tracks');
      loadLikedTracks();
    } else {
      // For other playlists, implement later
      setPlaylistName('Playlist');
    }
  }, [id, user, navigate]);

  const loadLikedTracks = async (loadMore = false) => {
    if (loadMore && !hasMore) return;
    setLoading(true);
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const likedTrackIds = userData.likedTracks || [];
        if (likedTrackIds.length > 0) {
          const tracksCol = collection(db, 'tracks');
          const likedTracksData = [];
          for (const trackId of likedTrackIds) {
            const trackDoc = await getDoc(doc(tracksCol, trackId));
            if (trackDoc.exists()) {
              likedTracksData.push({ id: trackDoc.id, ...trackDoc.data(), source: 'firestore' });
            }
          }
          setTracks(likedTracksData);
        } else {
          setTracks([]);
        }
      }
    } catch (error) {
      console.error('Failed to load liked tracks:', error);
      setTracks([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayTrack = (track) => {
    // Dispatch custom event to player bar
    window.dispatchEvent(new CustomEvent('playTrack', { detail: track }));
  };

  const handleUnlikeTrack = async (trackId) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        likedTracks: arrayRemove(trackId)
      });
      // Reload tracks
      loadLikedTracks();
    } catch (error) {
      console.error('Error unliking track:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            ← Back to Home
          </button>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">
            {playlistName}
          </h1>
          <p className="text-gray-400 mt-2">{tracks.length} tracks</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-400"></div>
          </div>
        ) : tracks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No tracks in this playlist yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {tracks.map((track) => (
              <div
                key={track.id}
                className="group bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl hover:bg-gray-700/50 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl border border-gray-700/50"
              >
                <div className="relative mb-4">
                  <div className="w-full h-40 bg-gradient-to-br from-red-600 to-pink-600 rounded-lg flex items-center justify-center group-hover:from-red-500 group-hover:to-pink-500 transition-all duration-300">
                    <button
                      onClick={() => handlePlayTrack(track)}
                      className="bg-white/20 backdrop-blur-sm rounded-full w-16 h-16 flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300 group-hover:scale-110"
                    >
                      <span className="text-2xl">▶</span>
                    </button>
                  </div>
                  <button
                    onClick={() => handleUnlikeTrack(track.id)}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                  >
                    <span className="text-sm">♥</span>
                  </button>
                </div>
                <h3 className="font-bold text-lg mb-1 truncate group-hover:text-red-300 transition-colors">
                  {track.title}
                </h3>
                <p className="text-sm text-gray-400 truncate">{track.artist}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
