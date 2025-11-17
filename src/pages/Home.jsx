import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MoodDetector from '../components/Mood/MoodDetector';
import { collection, query, orderBy, limit, getDocs, startAfter, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [freeTracks, setFreeTracks] = useState([]);
  const [recommendedTracks, setRecommendedTracks] = useState([]);
  const [likedTracks, setLikedTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recommendedLoading, setRecommendedLoading] = useState(false);
  const [likedLoading, setLikedLoading] = useState(false);
  const [freeLastDoc, setFreeLastDoc] = useState(null);
  const [recommendedLastDoc, setRecommendedLastDoc] = useState(null);
  const [freeHasMore, setFreeHasMore] = useState(true);
  const [recommendedHasMore, setRecommendedHasMore] = useState(true);



  const loadFreeTracks = useCallback(async (loadMore = false) => {
    if (loadMore && !freeHasMore) return;
    setLoading(true);
    try {
      const tracksCol = collection(db, 'tracks');
      let tracksQuery;
      if (loadMore && freeLastDoc) {
        tracksQuery = query(tracksCol, orderBy('createdAt', 'desc'), startAfter(freeLastDoc), limit(5));
      } else {
        tracksQuery = query(tracksCol, orderBy('createdAt', 'desc'), limit(5));
      }
      const tracksSnap = await getDocs(tracksQuery);
      const firestoreTracks = [];
      tracksSnap.forEach((doc) => {
        const trackData = doc.data();
        console.log('Firestore track:', trackData);
        firestoreTracks.push({ id: doc.id, ...trackData, source: 'firestore' });
      });

      if (firestoreTracks.length > 0) {
        if (loadMore) {
          setFreeTracks(prev => [...prev, ...firestoreTracks]);
        } else {
          setFreeTracks(firestoreTracks);
        }
        setFreeLastDoc(tracksSnap.docs[tracksSnap.docs.length - 1]);
        if (firestoreTracks.length < 5) {
          setFreeHasMore(false);
        }
      } else {
        if (!loadMore) {
          setFreeTracks([]);
        }
        setFreeHasMore(false);
      }
    } catch (error) {
      console.error('Failed to load free tracks:', error);
      if (!loadMore) {
        setFreeTracks([]);
      }
    } finally {
      setLoading(false);
    }
  }, [freeLastDoc, freeHasMore]);

  const loadRecommendedTracks = useCallback(async (loadMore = false) => {
    if (loadMore && !recommendedHasMore) return;
    setRecommendedLoading(true);
    try {
      const tracksCol = collection(db, 'tracks');
      let tracksQuery;
      if (loadMore && recommendedLastDoc) {
        tracksQuery = query(tracksCol, orderBy('createdAt', 'desc'), startAfter(recommendedLastDoc), limit(5));
      } else {
        tracksQuery = query(tracksCol, orderBy('createdAt', 'desc'), limit(5));
      }
      const tracksSnap = await getDocs(tracksQuery);
      const firestoreTracks = [];
      tracksSnap.forEach((doc) => {
        firestoreTracks.push({ id: doc.id, ...doc.data(), source: 'firestore' });
      });

      if (firestoreTracks.length > 0) {
        if (loadMore) {
          setRecommendedTracks(prev => [...prev, ...firestoreTracks]);
        } else {
          setRecommendedTracks(firestoreTracks);
        }
        setRecommendedLastDoc(tracksSnap.docs[tracksSnap.docs.length - 1]);
        if (firestoreTracks.length < 5) {
          setRecommendedHasMore(false);
        }
      } else {
        if (!loadMore) {
          setRecommendedTracks([]);
        }
        setRecommendedHasMore(false);
      }
    } catch (error) {
      console.error('Failed to load recommended tracks:', error);
      if (!loadMore) {
        setRecommendedTracks([]);
      }
    } finally {
      setRecommendedLoading(false);
    }
  }, [recommendedLastDoc, recommendedHasMore]);

  const loadLikedTracks = useCallback(async () => {
    if (!user) return;
    setLikedLoading(true);
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
          setLikedTracks(likedTracksData);
        } else {
          setLikedTracks([]);
        }
      }
    } catch (error) {
      console.error('Failed to load liked tracks:', error);
      setLikedTracks([]);
    } finally {
      setLikedLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadFreeTracks();
  }, []);

  useEffect(() => {
    loadRecommendedTracks();
  }, []);

  useEffect(() => {
    if (user) {
      loadLikedTracks();
    }
  }, [user, loadLikedTracks]);


  const handlePlayTrack = (track) => {
    // Dispatch custom event to player bar
    window.dispatchEvent(new CustomEvent('playTrack', { detail: track }));
  };

  const handlePlayPlaylist = (tracks, startIndex = 0) => {
    // Dispatch custom event to player bar with playlist
    window.dispatchEvent(new CustomEvent('playPlaylist', { detail: { tracks, startIndex } }));
  };

  const handleLikeTrack = async (trackId) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        likedTracks: arrayUnion(trackId)
      });
      // Reload liked tracks
      loadLikedTracks();
    } catch (error) {
      console.error('Error liking track:', error);
    }
  };

  const handleUnlikeTrack = async (trackId) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        likedTracks: arrayRemove(trackId)
      });
      // Reload liked tracks
      loadLikedTracks();
    } catch (error) {
      console.error('Error unliking track:', error);
    }
  };

  const navigateToLikedTracks = () => {
    navigate('/playlist/liked');
  };

  const isLiked = (trackId) => {
    return likedTracks.some(track => track.id === trackId);
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
              Available Music
            </h2>
            <div className="h-1 flex-1 bg-gradient-to-r from-green-400 to-blue-400 rounded ml-4"></div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400"></div>
            </div>
          ) : freeTracks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">No tracks available right now.</p>
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
                    {user && (
                      <button
                        onClick={() => isLiked(track.id) ? handleUnlikeTrack(track.id) : handleLikeTrack(track.id)}
                        className="absolute top-2 right-2 bg-gray-800/50 hover:bg-gray-700/50 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                      >
                        <span className="text-sm">{isLiked(track.id) ? '❤️' : '♡'}</span>
                      </button>
                    )}
                  </div>
                  <h3 className="font-bold text-lg mb-1 truncate group-hover:text-purple-300 transition-colors">
                    {track.title}
                  </h3>
                  <p className="text-sm text-gray-400 truncate">{track.artist}</p>
                </div>
              ))}
              {freeHasMore && (
                <div className="col-span-full flex justify-center py-8">
                  <button
                    onClick={() => loadFreeTracks(true)}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
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
                    {user && (
                      <button
                        onClick={() => isLiked(track.id) ? handleUnlikeTrack(track.id) : handleLikeTrack(track.id)}
                        className="absolute top-2 right-2 bg-gray-800/50 hover:bg-gray-700/50 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                      >
                        <span className="text-sm">{isLiked(track.id) ? '❤️' : '♡'}</span>
                      </button>
                    )}
                  </div>
                  <h3 className="font-bold text-lg mb-1 truncate group-hover:text-orange-300 transition-colors">
                    {track.title}
                  </h3>
                  <p className="text-sm text-gray-400 truncate">{track.artist}</p>
                </div>
              ))}
              {recommendedHasMore && (
                <div className="col-span-full flex justify-center py-8">
                  <button
                    onClick={() => loadRecommendedTracks(true)}
                    disabled={recommendedLoading}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                  >
                    {recommendedLoading ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </div>
          )}
        </section>



        {/* Your Playlists Section */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Your Liked Playlists
            </h2>
            <div className="h-1 flex-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded ml-4"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {user && (
              <div
                onClick={navigateToLikedTracks}
                className="group bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl hover:bg-gray-700/50 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl border border-gray-700/50 cursor-pointer"
              >
                <div className="w-full h-40 bg-gradient-to-br from-red-600 to-pink-600 rounded-lg mb-4 flex items-center justify-center group-hover:from-red-500 group-hover:to-pink-500 transition-all duration-300">
                  <span className="text-4xl">♥</span>
                </div>
                <h3 className="font-bold text-lg mb-1">Liked Tracks</h3>
                <p className="text-sm text-gray-400">{likedTracks.length} songs</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
