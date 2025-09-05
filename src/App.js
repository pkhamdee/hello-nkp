import './App.css';
import nutanix from './nutanix.png'
import React, { useState, useEffect } from 'react';

export  function App() {
  const [ipAddress, setIpAddress] = useState('Loading...');
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch the user's IP address from a public API
    const fetchIP = async () => {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        if (!response.ok) {
          throw new Error('Failed to fetch IP address');
        }
        const data = await response.json();
        setIpAddress(data.ip);
      } catch (err) {
        setError('Unable to fetch IP address');
        setIpAddress('Unknown');
      }
    };

    fetchIP();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Hello NKP!</h1>
          <div className="w-16 h-1 bg-blue-500 mx-auto rounded"><img src={nutanix} alt="nutanix"/></div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Your IP Address:</h2>
          <div className="font-mono text-xl text-blue-600 bg-white rounded px-4 py-2 border-2 border-blue-100">
            {ipAddress}
          </div>
          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}
        </div>
        
        <div className="text-gray-500 text-sm">
          <p>This is your public IP address as seen by external services.</p>
        </div>
      </div>
    </div>
  );
}


export default App;
