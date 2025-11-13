import React from 'react';
import MoodDetector from '../components/Mood/MoodDetector';

export default function Home() {
  return (
    <div className="p-6 text-white">
      {/* Mood-based Playlist Section */}
      <div className="mb-10">
        <MoodDetector />
      </div>

      {/* Recommended For You Section */}
      <div className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Recommended For You</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Placeholder for recommended songs */}
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition duration-300">
              <div className="w-full h-32 bg-gray-700 rounded mb-2"></div>
              <h3 className="font-bold">Song Title {i + 1}</h3>
              <p className="text-sm text-gray-400">Artist Name</p>
            </div>
          ))}
        </div>
      </div>

      {/* Your Playlists Section */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Your Playlists</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Placeholder for user playlists */}
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition duration-300">
              <div className="w-full h-32 bg-gray-700 rounded mb-2"></div>
              <h3 className="font-bold">My Playlist #{i + 1}</h3>
              <p className="text-sm text-gray-400">X songs</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
