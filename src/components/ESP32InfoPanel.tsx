import React from 'react';
import { Cpu, AlertTriangle, Info } from 'lucide-react';
import { ESP32_HEAP_SIZE, formatBytes } from '../constants/ESP32Constants';

interface ESP32InfoPanelProps {
  currentMemoryUsage: number;
  peakMemoryUsage: number;
  fragmentation: number;
}

export const ESP32InfoPanel: React.FC<ESP32InfoPanelProps> = ({
  currentMemoryUsage,
  peakMemoryUsage,
  fragmentation
}) => {
  const memoryPercentage = (currentMemoryUsage / ESP32_HEAP_SIZE) * 100;
  const isMemoryWarning = memoryPercentage > 75;
  const isFragWarning = fragmentation > 20;
  
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl mb-6">
      <div className="p-1 bg-gradient-to-r from-indigo-500 to-cyan-600"></div>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Cpu className="w-6 h-6 text-cyan-400" />
          <h2 className="text-xl font-semibold text-white">ESP32 Device Simulation</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400 text-sm">Heap Memory</span>
              <span className="text-sm font-medium text-white">
                {formatBytes(currentMemoryUsage)}/{formatBytes(ESP32_HEAP_SIZE)}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5 mb-1">
              <div 
                className={`h-full rounded-full ${
                  memoryPercentage > 85 ? 'bg-red-600' : 
                  memoryPercentage > 65 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${memoryPercentage}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 flex justify-between">
              <span>0 bytes</span>
              <span>{formatBytes(ESP32_HEAP_SIZE)}</span>
            </div>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400 text-sm">Peak Usage</span>
              <span className={`text-sm font-medium ${
                peakMemoryUsage > ESP32_HEAP_SIZE * 0.85 ? 'text-red-400' : 
                peakMemoryUsage > ESP32_HEAP_SIZE * 0.65 ? 'text-yellow-400' : 'text-green-400'
              }`}>
                {formatBytes(peakMemoryUsage)} ({(peakMemoryUsage / ESP32_HEAP_SIZE * 100).toFixed(1)}%)
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div 
                className={`h-full rounded-full ${
                  peakMemoryUsage > ESP32_HEAP_SIZE * 0.85 ? 'bg-red-600' : 
                  peakMemoryUsage > ESP32_HEAP_SIZE * 0.65 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${(peakMemoryUsage / ESP32_HEAP_SIZE) * 100}%` }}
              ></div>
            </div>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400 text-sm">Fragmentation</span>
              <span className={`text-sm font-medium ${
                fragmentation > 30 ? 'text-red-400' : 
                fragmentation > 15 ? 'text-yellow-400' : 'text-green-400'
              }`}>
                {fragmentation.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div 
                className={`h-full rounded-full ${
                  fragmentation > 30 ? 'bg-red-600' : 
                  fragmentation > 15 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(fragmentation * 2, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        {(isMemoryWarning || isFragWarning) && (
          <div className="mt-4 bg-yellow-900/30 border border-yellow-800 rounded-md p-3 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-yellow-400 font-medium">ESP32 Memory Warning</h4>
              <p className="text-yellow-200/70 text-sm mt-1">
                {isMemoryWarning && `Memory usage is high (${memoryPercentage.toFixed(1)}%). ESP32 devices may experience instability above 80% heap usage.`}
                {isMemoryWarning && isFragWarning && ' '}
                {isFragWarning && `High memory fragmentation (${fragmentation.toFixed(1)}%). ESP32 allocation may fail even when total free memory is sufficient.`}
              </p>
            </div>
          </div>
        )}
        
        <div className="mt-4 bg-gray-800/50 rounded-md p-3 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-white font-medium">About ESP32 Memory</h4>
            <p className="text-gray-400 text-sm mt-1">
              ESP32 devices typically have 32KB-520KB of available heap memory depending on the model and firmware configuration. 
              This simulation uses a 32KB heap constraint to mimic resource-constrained IoT devices.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};