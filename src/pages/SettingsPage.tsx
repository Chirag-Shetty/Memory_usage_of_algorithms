import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, RotateCcw } from 'lucide-react';

interface SettingsPageProps {
  onReset: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onReset }) => {
  const [darkMode, setDarkMode] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [memorySize, setMemorySize] = useState(1024);
  const [simulationSpeed, setSimulationSpeed] = useState(1.0);
  
  const handleReset = () => {
    if (confirm('Are you sure you want to reset all simulation data? This cannot be undone.')) {
      onReset();
    }
  };
  
  const handleSaveSettings = () => {
    // Placeholder for saving settings
    alert('Settings saved!');
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">Configure application preferences and simulation parameters</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl">
          <div className="p-1 bg-gradient-to-r from-green-500 to-teal-600"></div>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6 text-white">
              <Settings className="w-6 h-6 text-green-500" />
              <h2 className="text-xl font-semibold">Application Settings</h2>
            </div>
            
            <div className="space-y-6">
              {/* Dark Mode Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-gray-300">Dark Mode</label>
                <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full bg-gray-700">
                  <input
                    type="checkbox"
                    className="absolute w-6 h-6 opacity-0 z-10 cursor-pointer"
                    checked={darkMode}
                    onChange={() => setDarkMode(!darkMode)}
                  />
                  <div
                    className={`absolute left-0 w-6 h-6 transition duration-200 ease-in-out transform ${
                      darkMode ? 'translate-x-6 bg-green-500' : 'translate-x-0 bg-gray-400'
                    } rounded-full`}
                  ></div>
                </div>
              </div>
              
              {/* Notifications Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-gray-300">Enable Notifications</label>
                <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full bg-gray-700">
                  <input
                    type="checkbox"
                    className="absolute w-6 h-6 opacity-0 z-10 cursor-pointer"
                    checked={notificationsEnabled}
                    onChange={() => setNotificationsEnabled(!notificationsEnabled)}
                  />
                  <div
                    className={`absolute left-0 w-6 h-6 transition duration-200 ease-in-out transform ${
                      notificationsEnabled ? 'translate-x-6 bg-green-500' : 'translate-x-0 bg-gray-400'
                    } rounded-full`}
                  ></div>
                </div>
              </div>
              
              {/* Auto Save Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-gray-300">Auto Save Results</label>
                <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full bg-gray-700">
                  <input
                    type="checkbox"
                    className="absolute w-6 h-6 opacity-0 z-10 cursor-pointer"
                    checked={autoSave}
                    onChange={() => setAutoSave(!autoSave)}
                  />
                  <div
                    className={`absolute left-0 w-6 h-6 transition duration-200 ease-in-out transform ${
                      autoSave ? 'translate-x-6 bg-green-500' : 'translate-x-0 bg-gray-400'
                    } rounded-full`}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl">
          <div className="p-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6 text-white">
              <Settings className="w-6 h-6 text-blue-500" />
              <h2 className="text-xl font-semibold">Simulation Parameters</h2>
            </div>
            
            <div className="space-y-6">
              {/* Memory Size Slider */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Memory Size: {memorySize} KB
                </label>
                <input
                  type="range"
                  min="256"
                  max="4096"
                  step="128"
                  value={memorySize}
                  onChange={(e) => setMemorySize(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              
              {/* Simulation Speed Slider */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Default Simulation Speed: {simulationSpeed}x
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={simulationSpeed}
                  onChange={(e) => setSimulationSpeed(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 mt-8">
        <button
          onClick={handleSaveSettings}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
        >
          <Save className="w-5 h-5" />
          Save Settings
        </button>
        
        <button
          onClick={handleReset}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
          Reset Simulation Data
        </button>
      </div>
    </motion.div>
  );
};

export default SettingsPage;