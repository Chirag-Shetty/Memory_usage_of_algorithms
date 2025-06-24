import React, { useEffect, useState, useRef } from 'react';
import { SimulationControls } from '../components/SimulationControls';
import { MemoryVisualization } from '../components/MemoryVisualization';
import { MetricsOverview } from '../components/MetricsOverview';
import { ESP32InfoPanel } from '../components/ESP32InfoPanel';
import { SequentialDemoControls } from '../components/SequentialDemoControls';
import { DemoComparisonResults } from '../components/DemoComparisonResults';
import { AllocatorType, SimulationState, WorkloadType, AllocatorMetrics } from '../types/allocator';
import { motion } from 'framer-motion';
import { SimulationEngine } from '../core/simulation/SimulationEngine';
import { ESP32Status } from '../components/ESP32Status';
import { Trophy, PlayCircle, Settings, Cpu, Zap, CheckCircle } from 'lucide-react';

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
  const [demoMode, setDemoMode] = useState<boolean>(false);
  const [demoPhase, setDemoPhase] = useState<'individual' | 'smart' | 'complete' | null>(null);
  const [demoProgress, setDemoProgress] = useState<number>(0);
  const [demoResults, setDemoResults] = useState<Map<AllocatorType, AllocatorMetrics>>(new Map());
  const [workloadType, setWorkloadType] = useState<WorkloadType>(WorkloadType.RANDOM);
  const [operationCount, setOperationCount] = useState<number>(1000);
  
  const simulationEngineRef = useRef<SimulationEngine | null>(null);
  const [updateTrigger, setUpdateTrigger] = useState(0);

  const currentAllocator = getCurrentAllocator();
  const currentMetrics = metrics.get(simulationState.selectedAllocator) || {
    currentMemoryUsage: 0,
    peakMemoryUsage: 0,
    fragmentation: 0,
    totalAllocations: 0,
    totalDeallocations: 0,
    averageAllocationTime: 0,
    averageDeallocationTime: 0,
    wastedSpace: 0,
    successRate: 0
  };

  // Initialize simulationEngine if not already done
  useEffect(() => {
    if (!simulationEngineRef.current) {
      simulationEngineRef.current = new SimulationEngine();
    }
    
    const interval = setInterval(() => {
      setUpdateTrigger(prev => prev + 1);
    }, 100);
    
    return () => clearInterval(interval);
  }, []);

  const simulationEngine = simulationEngineRef.current;

  useEffect(() => {
    if (!simulationEngine) return;
    
    const state = simulationEngine.getSimulationState();
    if (state.demoMode) {
      setDemoMode(true);
      setDemoPhase(state.demoPhase);
      setDemoProgress(state.demoProgress);
      
      if (state.demoPhase === 'complete') {
        // Get final results
        setDemoResults(simulationEngine.getDemoResults());
      }
    } else {
      setDemoMode(false);
      setDemoPhase(null);
    }
  }, [simulationEngine, updateTrigger]);
  
  const handleStartDemo = (workloadType: WorkloadType, operationCount: number) => {
    if (!simulationEngineRef.current) return;
    
    // Reset any previous demo results
    setDemoResults(new Map());
    
    // Start the sequential demo
    simulationEngineRef.current.startSequentialDemo(workloadType, operationCount);
    
    // Update UI state
    setDemoMode(true);
    setDemoPhase('individual');
    setDemoProgress(0);
  };

  // Add these helper functions to DashboardPage.tsx
  const getAverageMemoryUsage = () => {
    let total = 0;
    let count = 0;
    demoResults.forEach((metrics) => {
      total += metrics.currentMemoryUsage;
      count++;
    });
    return count ? total / count : 0;
  };

  const getAverageFragmentation = () => {
    let total = 0;
    let count = 0;
    demoResults.forEach((metrics) => {
      total += metrics.fragmentation;
      count++;
    });
    return count ? total / count : 0;
  };

  const getAverageAllocationTime = () => {
    let total = 0;
    let count = 0;
    demoResults.forEach((metrics) => {
      total += metrics.averageAllocationTime;
      count++;
    });
    return count ? total / count : 0;
  };

  // Add this function with your other helper functions
  const getAverageSuccessRate = () => {
    let total = 0;
    let count = 0;
    demoResults.forEach((metrics) => {
      total += metrics.successRate;
      count++;
    });
    return count ? total / count : 0;
  };

  // Calculate improvement percentage (positive = better)
  const getImprovementPercent = (smartValue: number | undefined, avgValue: number | undefined, lowerIsBetter = true): string => {
    if (!smartValue || !avgValue) return "0";
    
    if (lowerIsBetter) {
      return ((avgValue - smartValue) / avgValue * 100).toFixed(1);
    } else {
      return ((smartValue - avgValue) / avgValue * 100).toFixed(1);
    }
  };

  // Calculate efficiency percentage for progress bars (0-100)
  const getSmartEfficiencyPercent = (smartValue: number | undefined, avgValue: number | undefined, lowerIsBetter = false): number => {
    if (!smartValue || !avgValue) return 0;
    
    if (lowerIsBetter) {
      // For metrics where lower is better (fragmentation, allocation time)
      const improvement = (avgValue - smartValue) / avgValue;
      return Math.min(Math.max(50 + improvement * 50, 0), 100);
    } else {
      // For metrics where higher is better (success rate)
      const improvement = (smartValue - avgValue) / avgValue;
      return Math.min(Math.max(50 + improvement * 50, 0), 100);
    }
  };

  // Get the metrics for SmartEdgeAlloc after demo completes
  const smartMetrics = demoPhase === 'complete' && demoResults.size > 0 ? 
    Array.from(demoResults.values())[demoResults.size - 1] : 
    currentMetrics;

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

      {/* ESP32 Status - New Component Added */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl mb-8">
        <div className="p-6">
          <ESP32Status />
        </div>
      </div>

      {/* Benchmark Suite - Replaces SequentialDemoControls */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl mb-8">
        <div className="p-1 bg-gradient-to-r from-yellow-500 to-purple-600"></div>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              Allocator Benchmark Suite
            </h2>
          </div>
          
          {demoPhase === null ? (
            // Setup controls when no benchmark is running
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Workload Pattern
                </label>
                <select
                  value={workloadType}
                  onChange={(e) => setWorkloadType(e.target.value as WorkloadType)}
                  className="bg-gray-800 border border-gray-700 text-white rounded-md px-3 py-2 w-full"
                >
                  {Object.values(WorkloadType).map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Operation Count
                </label>
                <input
                  type="number"
                  min="100"
                  max="10000"
                  step="100"
                  value={operationCount}
                  onChange={(e) => setOperationCount(parseInt(e.target.value))}
                  className="bg-gray-800 border border-gray-700 text-white rounded-md px-3 py-2 w-full"
                />
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={() => handleStartDemo(workloadType, operationCount)}
                  className="w-full bg-gradient-to-r from-yellow-500 to-purple-600 hover:from-yellow-600 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-md flex items-center justify-center gap-2"
                >
                  <PlayCircle className="w-5 h-5" />
                  Run Complete Benchmark
                </button>
              </div>
            </div>
          ) : (
            // Benchmark progress display
            <div>
              <div className="flex items-center justify-between text-sm text-gray-300 mb-1">
                <span>Benchmark Progress</span>
                <span>{demoProgress.toFixed(0)}%</span>
              </div>
              
              <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden mb-4">
                <div
                  className="h-full bg-gradient-to-r from-yellow-500 to-purple-600 transition-all duration-300"
                  style={{ width: `${demoProgress}%` }}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Settings className={`w-5 h-5 ${demoPhase === 'individual' ? 'text-yellow-400' : 'text-gray-500'}`} />
                    <h3 className="font-semibold text-white">
                      Current Phase: {demoPhase === 'individual' ? 'Testing Standard Allocators' : 
                                demoPhase === 'smart' ? 'Testing SmartEdgeAlloc' : 'Complete'}
                    </h3>
                  </div>
                  
                  {demoPhase === 'individual' && simulationState.currentDemoAllocator && (
                    <div className="text-gray-300 mt-1 flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-blue-400" />
                      Currently testing: <span className="text-blue-400 font-medium">{simulationState.currentDemoAllocator}</span>
                      <span className="text-xs text-gray-500">({Object.values(AllocatorType).indexOf(simulationState.currentDemoAllocator as AllocatorType) + 1}/{Object.values(AllocatorType).length})</span>
                    </div>
                  )}
                  
                  {demoPhase === 'smart' && (
                    <div className="text-gray-300 mt-1 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-purple-400" />
                      Testing adaptive <span className="text-purple-400 font-medium">SmartEdgeAlloc</span> system
                    </div>
                  )}
                </div>
                
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="text-sm text-gray-300">
                    <p><span className="text-yellow-400">Standard Allocators:</span> Each allocator processes the identical workload pattern independently.</p>
                    <p className="mt-2"><span className="text-purple-400">SmartEdgeAlloc:</span> Adaptively chooses the best allocator for current workload conditions.</p>
                    {demoPhase === 'complete' && (
                      <p className="mt-2 text-green-400 font-medium">Benchmark complete! View comprehensive results below.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Demo Comparison Results - Only show when demo is complete */}
      {demoPhase === 'complete' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl mb-8">
          <div className="p-1 bg-gradient-to-r from-green-500 to-blue-600"></div>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  ESP32 Allocator Benchmark Results
                </h2>
                <div className="text-sm text-gray-400 mt-1">
                  Comparative analysis of all allocators on identical workload
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-gray-400 bg-gray-800 px-3 py-1 rounded-lg text-sm">
                <Cpu className="w-4 h-4" />
                <span>ESP32 32KB Memory Constraint</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-medium text-white mb-4">Key Performance Metrics</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="text-gray-400">Memory Efficiency</span>
                      <span className="text-green-400 font-medium">
                        {getImprovementPercent(smartMetrics?.currentMemoryUsage, getAverageMemoryUsage())}% better
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${getSmartEfficiencyPercent(smartMetrics?.currentMemoryUsage, getAverageMemoryUsage())}%` }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="text-gray-400">Fragmentation Reduction</span>
                      <span className="text-blue-400 font-medium">
                        {getImprovementPercent(smartMetrics?.fragmentation, getAverageFragmentation())}% better
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${getSmartEfficiencyPercent(smartMetrics?.fragmentation, getAverageFragmentation(), true)}%` }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="text-gray-400">Allocation Speed</span>
                      <span className="text-purple-400 font-medium">
                        {getImprovementPercent(smartMetrics?.averageAllocationTime, getAverageAllocationTime())}% better
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${getSmartEfficiencyPercent(smartMetrics?.averageAllocationTime, getAverageAllocationTime(), true)}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-medium text-white mb-4">SmartEdgeAlloc Advantages</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">Adaptive selection of optimal allocator based on workload pattern</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">Real-time analysis of memory usage patterns</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">Dynamic response to changing allocation requirements</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">Optimized for ESP32's limited memory constraints</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                      Allocator
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                      Memory Usage
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                      Fragmentation
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                      Success Rate
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                      Allocation Time
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {Array.from(demoResults.entries()).map(([allocator, metrics]) => (
                    <tr key={allocator} className="bg-gray-800">
                      <td className="px-4 py-3 text-sm text-white font-medium">
                        {allocator}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {(metrics.currentMemoryUsage / 1024).toFixed(1)} KB
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {metrics.fragmentation.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {metrics.successRate.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {metrics.averageAllocationTime.toFixed(3)} ms
                      </td>
                    </tr>
                  ))}
                  
                  {/* Smart Allocator Row */}
                  {demoPhase === 'complete' && (
                    <tr className="bg-blue-900/30 border-t-2 border-b-2 border-blue-500">
                      <td className="px-4 py-3 text-sm text-white font-medium">
                        SmartEdgeAlloc
                      </td>
                      <td className="px-4 py-3 text-sm text-white">
                        {(smartMetrics.currentMemoryUsage / 1024).toFixed(1)} KB
                      </td>
                      <td className="px-4 py-3 text-sm text-white">
                        {smartMetrics.fragmentation.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-sm text-white">
                        {smartMetrics.successRate.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-sm text-white">
                        {smartMetrics.averageAllocationTime.toFixed(3)} ms
                      </td>
                    </tr>
                  )}
                  
                  {/* Improvement Summary Row */}
                  {demoPhase === 'complete' && (
                    <tr className="bg-gray-900">
                      <td className="px-4 py-3 text-sm text-gray-300 font-medium">
                        Avg. Improvement
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`flex items-center gap-1 ${parseFloat(getImprovementPercent(smartMetrics?.currentMemoryUsage, getAverageMemoryUsage(), true)) > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {parseFloat(getImprovementPercent(smartMetrics?.currentMemoryUsage, getAverageMemoryUsage(), true)) > 0 ? '+' : ''}
                          {getImprovementPercent(smartMetrics?.currentMemoryUsage, getAverageMemoryUsage(), true)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`flex items-center gap-1 ${parseFloat(getImprovementPercent(smartMetrics?.fragmentation, getAverageFragmentation(), true)) > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {parseFloat(getImprovementPercent(smartMetrics?.fragmentation, getAverageFragmentation(), true)) > 0 ? '+' : ''}
                          {getImprovementPercent(smartMetrics?.fragmentation, getAverageFragmentation(), true)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`flex items-center gap-1 ${parseFloat(getImprovementPercent(smartMetrics?.successRate, getAverageSuccessRate(), false)) > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {parseFloat(getImprovementPercent(smartMetrics?.successRate, getAverageSuccessRate(), false)) > 0 ? '+' : ''}
                          {getImprovementPercent(smartMetrics?.successRate, getAverageSuccessRate(), false)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`flex items-center gap-1 ${parseFloat(getImprovementPercent(smartMetrics?.averageAllocationTime, getAverageAllocationTime(), true)) > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {parseFloat(getImprovementPercent(smartMetrics?.averageAllocationTime, getAverageAllocationTime(), true)) > 0 ? '+' : ''}
                          {getImprovementPercent(smartMetrics?.averageAllocationTime, getAverageAllocationTime(), true)}%
                        </span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default DashboardPage;