import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  return (
    <nav className="flex items-center justify-between p-4 ">
      <div className="text-xl font-bold"><Link to="/">MusicApp</Link></div>
      <div className="space-x-4">
        {user ? (
          <>
            <Link to="/profile" className="mr-2">Profile</Link>
            <button onClick={() => logout()} className="px-3 py-1 border rounded">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="px-3 py-1 border rounded">Login</Link>
            <Link to="/signup" className="px-3 py-1 border rounded">Signup</Link>
          </>
        )}
      </div>
    </nav>
  );
}
