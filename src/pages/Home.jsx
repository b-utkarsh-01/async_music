import { useState, useEffect } from 'react';
import MoodDetector from '../components/Mood/MoodDetector';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

export default function Home() {
  const [freeTracks, setFreeTracks] = useState([]);
  const [recommendedTracks, setRecommendedTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recommendedLoading, setRecommendedLoading] = useState(false);

  useEffect(() => {
    const loadFreeTracks = async () => {
      setLoading(true);
      try {
        // First try to get user's uploaded tracks from Firestore
        const tracksCol = collection(db, 'tracks');
        const tracksQuery = query(tracksCol, orderBy('createdAt', 'desc'), limit(10));
        const tracksSnap = await getDocs(tracksQuery);
        const firestoreTracks = [];
        tracksSnap.forEach((doc) => {
          const trackData = doc.data();
          console.log('Firestore track:', trackData);
          firestoreTracks.push({ id: doc.id, ...trackData, source: 'firestore' });
        });

        if (firestoreTracks.length > 0) {
          setFreeTracks(firestoreTracks);
        } else {
          // No fallback - just show empty state
          setFreeTracks([]);
        }
      } catch (error) {
        console.error('Failed to load free tracks:', error);
        setFreeTracks([]);
      } finally {
        setLoading(false);
      }
    };
    loadFreeTracks();
  }, []);

  useEffect(() => {
    const loadRecommendedTracks = async () => {
      setRecommendedLoading(true);
      try {
        // First try to get user's uploaded tracks from Firestore
        const tracksCol = collection(db, 'tracks');
        const tracksQuery = query(tracksCol, orderBy('createdAt', 'desc'), limit(10));
        const tracksSnap = await getDocs(tracksQuery);
        const firestoreTracks = [];
        tracksSnap.forEach((doc) => {
          firestoreTracks.push({ id: doc.id, ...doc.data(), source: 'firestore' });
        });

        if (firestoreTracks.length > 0) {
          setRecommendedTracks(firestoreTracks);
        } else {
          // No fallback - just show empty state
          setRecommendedTracks([]);
        }
      } catch (error) {
        console.error('Failed to load recommended tracks:', error);
        setRecommendedTracks([]);
      } finally {
        setRecommendedLoading(false);
      }
    };
    loadRecommendedTracks();
  }, []);


  const handlePlayTrack = (track) => {
    // Dispatch custom event to player bar
    window.dispatchEvent(new CustomEvent('playTrack', { detail: track }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      <div className="container mx-auto px-6 py-8">
        {/* Mood-based Playlist Section */}
        <div className="mb-16">
          <MoodDetector />
        </div>

        {/* Free Music Section */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              Free Music
            </h2>
            <div className="h-1 flex-1 bg-gradient-to-r from-green-400 to-blue-400 rounded ml-4"></div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400"></div>
            </div>
          ) : freeTracks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">No free tracks available right now.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {freeTracks.map((track) => (
                <div
                  key={track.id}
                  className="group bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl hover:bg-gray-700/50 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl border border-gray-700/50"
                >
                  <div className="relative mb-4">
                    <div className="w-full h-40 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center group-hover:from-purple-500 group-hover:to-pink-500 transition-all duration-300">
                      <button
                        onClick={() => handlePlayTrack(track)}
                        className="bg-white/20 backdrop-blur-sm rounded-full w-16 h-16 flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300 group-hover:scale-110"
                      >
                        <span className="text-2xl">▶</span>
                      </button>
                    </div>
                  </div>
                  <h3 className="font-bold text-lg mb-1 truncate group-hover:text-purple-300 transition-colors">
                    {track.title}
                  </h3>
                  <p className="text-sm text-gray-400 truncate">{track.artist}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recommended For You Section */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
              Recommended For You
            </h2>
            <div className="h-1 flex-1 bg-gradient-to-r from-orange-400 to-red-400 rounded ml-4"></div>
          </div>

          {recommendedLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400"></div>
            </div>
          ) : recommendedTracks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">No recommendations available right now.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {recommendedTracks.map((track) => (
                <div
                  key={track.id}
                  className="group bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl hover:bg-gray-700/50 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl border border-gray-700/50"
                >
                  <div className="relative mb-4">
                    <div className="w-full h-40 bg-gradient-to-br from-orange-600 to-red-600 rounded-lg flex items-center justify-center group-hover:from-orange-500 group-hover:to-red-500 transition-all duration-300">
                      <button
                        onClick={() => handlePlayTrack(track)}
                        className="bg-white/20 backdrop-blur-sm rounded-full w-16 h-16 flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300 group-hover:scale-110"
                      >
                        <span className="text-2xl">▶</span>
                      </button>
                    </div>
                  </div>
                  <h3 className="font-bold text-lg mb-1 truncate group-hover:text-orange-300 transition-colors">
                    {track.title}
                  </h3>
                  <p className="text-sm text-gray-400 truncate">{track.artist}</p>
                </div>
              ))}
            </div>
          )}
        </section>



        {/* Your Playlists Section */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Your Playlists
            </h2>
            <div className="h-1 flex-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded ml-4"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl hover:bg-gray-700/50 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl border border-gray-700/50"
              >
                <div className="w-full h-40 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-4xl">🎵</span>
                </div>
                <h3 className="font-bold text-lg mb-1">My Playlist #{i + 1}</h3>
                <p className="text-sm text-gray-400">{Math.floor(Math.random() * 20) + 5} songs</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
