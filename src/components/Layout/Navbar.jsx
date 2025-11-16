import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  return (
    <nav className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-700/50 px-6 py-4 sticky top-0 z-50">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          <Link to="/" className="">MusicApp</Link>
        </div>
        <div className="flex items-center space-x-4">
          {user ? (

            <div className='flex items-center gap-2 md:gap-4'>
              {location.pathname === '/' ? (
                <>
                  <Link
                    to="/chat"
                    className="-mt-3 px-2 md:px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 rounded-lg border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 text-sm md:text-base"
                  >
                    Chat
                  </Link>
                  <Link
                    to="/profile"
                    className="-mt-3 px-2 md:px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg text-gray-300 hover:text-white transition-all duration-300 border border-gray-600/50 hover:border-gray-500/50 text-sm md:text-base"
                  >
                    Profile
                  </Link>
                </>
              ) : location.pathname === '/chat' ? (
                <Link
                  to="/profile"
                  className="-mt-3 px-2 md:px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg text-gray-300 hover:text-white transition-all duration-300 border border-gray-600/50 hover:border-gray-500/50 text-sm md:text-base"
                >
                  Profile
                </Link>
              ) : (
                <Link
                  to="/chat"
                  className="-mt-3 px-2 md:px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 rounded-lg border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 text-sm md:text-base"
                >
                  Chat
                </Link>
              )}
              <button
                onClick={() => logout()}
                className=" px-2 md:px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 rounded-lg border border-red-500/30 hover:border-red-400/50 transition-all duration-300 text-sm md:text-base"
              >
                Logout
              </button>
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg text-gray-300 hover:text-white transition-all duration-300 border border-gray-600/50 hover:border-gray-500/50"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg text-white font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Signup
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
