import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import TrackUploader from '../components/Upload/TrackUploader';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

export default function Profile() {
  const { user, logout } = useAuth();
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
    <div className="p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl">Profile</h1>
        <button onClick={logout} className="w-20 bg-red-600 text-white px-3 py-1 border rounded">Logout</button>
      </div>

      <div className="mb-6">
        <h2 className="font-semibold">Account</h2>
        <pre className="mt-2 bg-gray-800 p-4 rounded shadow text-sm">{JSON.stringify({ uid: user?.uid, email: user?.email }, null, 2)}</pre>
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
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{t.title || t.name || 'Untitled'}</div>
                    <div className="text-sm text-gray-400">{t.artist || t.uploader || ''}</div>
                  </div>
                  {t.url && (
                    <audio controls src={t.url} className="w-48" />
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
