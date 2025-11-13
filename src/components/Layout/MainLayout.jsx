import React from 'react';
import Navbar from './Navbar';
import { PlayerBar } from '../Player/PlayerBar';

const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <Navbar />
      <main className="flex-grow p-4">
        {children}
      </main>
      <PlayerBar />
    </div>
  );
};

export default MainLayout;
