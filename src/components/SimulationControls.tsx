import React from 'react';
import { Play, Pause, RotateCcw, Zap, Settings } from 'lucide-react';
import { AllocatorType, WorkloadType, SimulationState } from '../types/allocator';

interface SimulationControlsProps {
  simulationState: SimulationState;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onWorkloadChange: (workload: WorkloadType) => void;
  onAllocatorChange: (allocator: AllocatorType) => void;
  onSmartModeToggle: (enabled: boolean) => void;
  onSpeedChange: (speed: number) => void;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  simulationState,
  onStart,
  onStop,
  onReset,
  onWorkloadChange,
  onAllocatorChange,
  onSmartModeToggle,
  onSpeedChange
}) => {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-400" />
          Simulation Controls
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={simulationState.isRunning ? onStop : onStart}
            className={`px-4 py-2 rounded-md flex items-center gap-2 font-medium transition-colors ${
              simulationState.isRunning
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {simulationState.isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {simulationState.isRunning ? 'Pause' : 'Start'}
          </button>
          <button
            onClick={onReset}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md flex items-center gap-2 font-medium transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Workload Type */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Workload Pattern
          </label>
          <select
            value={simulationState.workloadType}
            onChange={(e) => onWorkloadChange(e.target.value as WorkloadType)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.values(WorkloadType).map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Smart Mode Toggle */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Allocation Mode
          </label>
          <div className="flex items-center gap-3">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={simulationState.smartMode}
                onChange={(e) => onSmartModeToggle(e.target.checked)}
                className="sr-only"
              />
              <div className={`relative w-12 h-6 rounded-full transition-colors ${
                simulationState.smartMode ? 'bg-blue-600' : 'bg-gray-600'
              }`}>
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  simulationState.smartMode ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </div>
              <span className="ml-2 text-sm text-gray-300 flex items-center gap-1">
                <Zap className="w-4 h-4 text-yellow-400" />
                SmartEdgeAlloc
              </span>
            </label>
          </div>
        </div>

        {/* Manual Allocator Selection */}
        {!simulationState.smartMode && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Manual Allocator
            </label>
            <select
              value={simulationState.selectedAllocator}
              onChange={(e) => onAllocatorChange(e.target.value as AllocatorType)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.values(AllocatorType).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Speed Control */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Speed: {simulationState.speed}x
          </label>
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={simulationState.speed}
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>
      </div>

      {/* Current Status */}
      <div className="mt-6 p-4 bg-gray-800 rounded-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Status:</span>
            <span className={`ml-2 font-medium ${
              simulationState.isRunning ? 'text-green-400' : 'text-gray-300'
            }`}>
              {simulationState.isRunning ? 'Running' : 'Stopped'}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Workload:</span>
            <span className="ml-2 font-medium text-blue-400">
              {simulationState.workloadType}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Mode:</span>
            <span className="ml-2 font-medium text-yellow-400">
              {simulationState.smartMode ? 'Smart' : 'Manual'}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Allocator:</span>
            <span className="ml-2 font-medium text-purple-400">
              {simulationState.selectedAllocator}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};