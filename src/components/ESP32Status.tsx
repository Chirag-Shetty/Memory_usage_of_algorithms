import React, { useState, useEffect } from 'react';
import { Cpu, WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { loggingService } from '../services/LoggingService';

export const ESP32Status: React.FC = () => {
  const [status, setStatus] = useState<{ connected: boolean; port: string | null }>({
    connected: false,
    port: null
  });
  const [portInput, setPortInput] = useState<string>('COM3');
  const [showConnect, setShowConnect] = useState<boolean>(false);
  
  useEffect(() => {
    // Update status initially
    setStatus(loggingService.getESP32Status());
    
    // Set up interval to poll ESP32 status
    const interval = setInterval(() => {
      setStatus(loggingService.getESP32Status());
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  const handleConnect = () => {
    loggingService.connectToESP32(portInput);
  };
  
  const handleDisconnect = () => {
    loggingService.disconnectFromESP32();
  };
  
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-purple-400" />
          <h3 className="font-semibold text-white">ESP32 Serial Connection</h3>
        </div>
        
        <button 
          className="text-gray-400 hover:text-white"
          onClick={() => setShowConnect(!showConnect)}
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      
      {status.connected ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-green-400" />
            <span className="text-green-400">Connected to ESP32</span>
            <span className="text-xs text-gray-400">({status.port})</span>
          </div>
          
          <button
            className="text-xs bg-red-800 hover:bg-red-700 text-white px-2 py-1 rounded"
            onClick={handleDisconnect}
          >
            Disconnect
          </button>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <WifiOff className="w-4 h-4 text-red-400" />
            <span className="text-red-400">Not connected to ESP32</span>
          </div>
          
          {showConnect && (
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={portInput}
                onChange={(e) => setPortInput(e.target.value)}
                placeholder="COM3"
                className="bg-gray-800 border border-gray-700 text-white rounded-md px-3 py-1 text-sm flex-1"
              />
              <button
                className="text-xs bg-blue-700 hover:bg-blue-600 text-white px-3 py-1 rounded"
                onClick={handleConnect}
              >
                Connect
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};