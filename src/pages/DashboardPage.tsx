import React from 'react';
import { SimulationControls } from '../components/SimulationControls';
import { MemoryVisualization } from '../components/MemoryVisualization';
import { MetricsOverview } from '../components/MetricsOverview';
import { ESP32InfoPanel } from '../components/ESP32InfoPanel';
import { AllocatorType, SimulationState, WorkloadType, AllocatorMetrics } from '../types/allocator';
import { motion } from 'framer-motion';

interface DashboardPageProps {
  simulationState: SimulationState;
  metrics: Map<AllocatorType, AllocatorMetrics>;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onWorkloadChange: (workload: WorkloadType) => void;
  onAllocatorChange: (allocator: AllocatorType) => void;
  onSmartModeToggle: (enabled: boolean) => void;
  onSpeedChange: (speed: number) => void;
  getCurrentAllocator: () => any;
}

const DashboardPage: React.FC<DashboardPageProps> = ({
  simulationState,
  metrics,
  onStart,
  onPause,
  onReset,
  onWorkloadChange,
  onAllocatorChange,
  onSmartModeToggle,
  onSpeedChange,
  getCurrentAllocator,
}) => {
  const currentAllocator = getCurrentAllocator();
  const currentMetrics = metrics.get(simulationState.selectedAllocator) || {
    currentMemoryUsage: 0,
    peakMemoryUsage: 0,
    fragmentation: 0
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Memory Allocation Dashboard</h1>
        <p className="text-gray-400">ESP32 memory allocation simulation with realistic device constraints</p>
      </div>
      
      {/* Add ESP32 Info Panel */}
      <ESP32InfoPanel 
        currentMemoryUsage={currentMetrics.currentMemoryUsage}
        peakMemoryUsage={currentMetrics.peakMemoryUsage}
        fragmentation={currentMetrics.fragmentation}
      />

      {/* Simulation Controls */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl mb-8">
        <div className="p-1 bg-gradient-to-r from-blue-500 to-purple-600"></div>
        <div className="p-6">
          <SimulationControls
            simulationState={simulationState}
            onStart={onStart}
            onStop={onPause} // Fixed: renamed from onPause to onStop
            onReset={onReset}
            onWorkloadChange={onWorkloadChange}
            onAllocatorChange={onAllocatorChange}
            onSmartModeToggle={onSmartModeToggle}
            onSpeedChange={onSpeedChange}
          />
        </div>
      </div>

      {/* Primary Dashboard Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Current Allocator Metrics */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl">
          <div className="p-6">
            <MetricsOverview
              metrics={metrics}
              selectedAllocator={simulationState.selectedAllocator}
            />
          </div>
        </div>

        {/* Memory Visualization */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl">
          <div className="p-6">
            <MemoryVisualization
              allocator={getCurrentAllocator()}
              title={simulationState.selectedAllocator}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DashboardPage;