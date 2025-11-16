import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import TrackUploader from '../components/Upload/TrackUploader';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

export default function Profile() {
  const { user, userProfile, logout } = useAuth();
  const [tracks, setTracks] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);

  // load assets (tracks + playlists) so we can call this after uploads
  const loadAssets = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const tCol = collection(db, 'tracks');
      const tq = query(tCol, where('ownerId', '==', user.uid));
      const tSnap = await getDocs(tq);
      const tList = [];
      tSnap.forEach((d) => tList.push({ id: d.id, ...d.data() }));

      const pCol = collection(db, 'playlists');
      const pq = query(pCol, where('ownerId', '==', user.uid));
      const pSnap = await getDocs(pq);
      const pList = [];
      pSnap.forEach((d) => pList.push({ id: d.id, ...d.data() }));

      setTracks(tList);
      setPlaylists(pList);
    } catch (err) {
      console.error('Failed to load user assets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    loadAssets();
    return () => {
      mounted = false;
    };
  }, [user]);

  if (!user) {
    return (
      <div className="p-6 text-white">
        <h1 className="text-2xl mb-4">Profile</h1>
        <p className="mb-4">You are not logged in. Please <Link to="/login" className="underline">login</Link> or <Link to="/signup" className="underline">signup</Link> to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 text-white">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
        <h1 className="text-xl md:text-2xl">Profile</h1>
        <button onClick={logout} className="w-full sm:w-20 bg-red-600 text-white px-3 py-1 border rounded text-sm md:text-base">Logout</button>
      </div>

      <div className="mb-6">
        <h2 className="font-semibold mb-3">Account Information</h2>
        <div className="bg-gray-800/50 backdrop-blur-sm p-4 md:p-6 rounded-xl border border-gray-700/50 shadow-lg">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-gray-400 font-medium min-w-[60px]">Email:</span>
              <span className="text-white break-all">{user?.email}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-gray-400 font-medium min-w-[60px]">User ID:</span>
              <span className="text-gray-300 text-sm font-mono break-all">{user?.uid}</span>
            </div>
            {userProfile?.username && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="text-gray-400 font-medium min-w-[60px]">Username:</span>
                <span className="text-white">{userProfile.username}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <TrackUploader onUploaded={loadAssets} />
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Your Tracks</h2>
        {loading ? (
          <p>Loading...</p>
        ) : tracks.length === 0 ? (
          <p className="text-gray-400">No uploaded tracks found.</p>
        ) : (
          <ul className="divide-y divide-gray-700">
            {tracks.map((t) => (
              <li key={t.id} className="py-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{t.title || t.name || 'Untitled'}</div>
                    <div className="text-sm text-gray-400 truncate">{t.artist || t.uploader || ''}</div>
                  </div>
                  {t.url && (
                    <audio controls src={t.url} className="w-full sm:w-48" />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Your Playlists</h2>
        {loading ? (
          <p>Loading...</p>
        ) : playlists.length === 0 ? (
          <p className="text-gray-400">No playlists found.</p>
        ) : (
          <ul className="divide-y divide-gray-700">
            {playlists.map((p) => (
              <li key={p.id} className="py-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{p.title || p.name || 'Untitled Playlist'}</div>
                    <div className="text-sm text-gray-400">{p.description || ''}</div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
