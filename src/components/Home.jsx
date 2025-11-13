import React from "react";
import { useAuth } from "../contexts/AuthContext";

export default function Home() {
  const { user, logout } = useAuth();

  return (
    <div className="text-center mt-20 text-white">
      <h1 className="text-4xl font-bold mb-4">🎵 Welcome to Async Music</h1>
      <p className="text-gray-400 mb-6">
        Your personal AI-powered mood-based music experience.
      </p>
      {user && (
        <div>
          <p className="mb-3">Logged in as: {user.email}</p>
          <button
            onClick={logout}
            className="bg-red-600 px-4 py-2 rounded text-white hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
