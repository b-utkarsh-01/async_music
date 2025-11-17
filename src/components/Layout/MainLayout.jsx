import React from 'react';
import Navbar from './Navbar';

const MainLayout = ({ children }) => {
  return (
    <div className="flex flex-col">
      <Navbar />
      <main className="flex-grow p-4 pb-24 md:mb-90">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
