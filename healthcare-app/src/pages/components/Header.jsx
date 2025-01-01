// src/components/Header.js

import React from 'react';

const Header = ({ patientName, onLogout }) => {
  return (
    <header className="bg-blue-400 text-white shadow-md p-4 rounded-lg flex justify-between items-center my-5">
      {/* Patient Name */}
      <h1 className="text-xl font-semibold">👤 Welcome, {patientName || 'Patient'}</h1>

      {/* Logout Button */}
      <button
        onClick={onLogout}
        className="bg-red-500 px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition"
      >
        🚪 Logout
      </button>
    </header>
  );
};

export default Header;
