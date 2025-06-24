import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Trophy, BarChart3, PlayCircle, Clock, Cpu, Settings, Zap, CheckCircle, 
         Activity, TrendingUp, TrendingDown, FileBarChart } from 'lucide-react';
import { AllocatorType, WorkloadType, AllocatorMetrics } from '../types/allocator';
import { SimulationEngine } from '../core/simulation/SimulationEngine';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { formatBytes, ESP32_HEAP_SIZE } from '../constants/ESP32Constants';

interface BenchmarkPageProps {
  simulationEngine: SimulationEngine;
}

const BenchmarkPage: React.FC<BenchmarkPageProps> = ({ simulationEngine }) => {
  const [demoMode, setDemoMode] = useState<boolean>(false);
  const [demoPhase, setDemoPhase] = useState<'individual' | 'smart' | 'complete' | null>(null);
  const [demoProgress, setDemoProgress] = useState<number>(0);
  const [demoResults, setDemoResults] = useState<Map<AllocatorType, AllocatorMetrics>>(new Map());
  const [workloadType, setWorkloadType] = useState<WorkloadType>(WorkloadType.RANDOM);
  const [operationCount, setOperationCount] = useState<number>(500);
  const [updateTrigger, setUpdateTrigger] = useState(0);
  
  // Add comparison states
  const [showMemoryComparison, setShowMemoryComparison] = useState<boolean>(true);
  const [showFragmentationComparison, setShowFragmentationComparison] = useState<boolean>(true);
  const [showSuccessRateComparison, setShowSuccessRateComparison] = useState<boolean>(true);
  const [showTimeComparison, setShowTimeComparison] = useState<boolean>(true);

  // Add a "Fast Mode" option
  const [fastMode, setFastMode] = useState<boolean>(true);

  // Setup update interval
  useEffect(() => {
    const interval = setInterval(() => {
      setUpdateTrigger(prev => prev + 1);
    }, 100);
    
    return () => clearInterval(interval);
  }, []);

  // Update demo state from simulation engine
  useEffect(() => {
    if (!simulationEngine) return;
    
    const interval = setInterval(() => {
      const state = simulationEngine.getSimulationState();
      setDemoMode(state.demoMode);
      setDemoPhase(state.demoPhase);
      setDemoProgress(state.demoProgress);
      
      if (state.demoPhase === 'complete') {
        // Get results when complete
        const results = simulationEngine.getDemoResults();
        setDemoResults(results);
        console.log("Benchmark complete, results:", results);
        
        // Clear interval once complete
        clearInterval(interval);
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [simulationEngine]);

  // Add this effect to update benchmark progress
  useEffect(() => {
    if (!simulationEngine) return;
    
    const interval = setInterval(() => {
      const state = simulationEngine.getSimulationState();
      
      if (state.demoMode) {
        setDemoMode(true);
        setDemoPhase(state.demoPhase);
        setDemoProgress(state.demoProgress);
        
        // When complete, get the final results ONCE
        if (state.demoPhase === 'complete' && demoResults.size === 0) {
          const results = simulationEngine.getDemoResults();
          console.log("Benchmark complete, storing final results:", results);
          setDemoResults(new Map(results));
        }
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [simulationEngine, demoResults.size]);

  // Helper functions
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

  const getAverageSuccessRate = () => {
    let total = 0;
    let count = 0;
    demoResults.forEach((metrics) => {
      total += metrics.successRate;
      count++;
    });
    return count ? total / count : 0;
  };

  // Calculate improvement percentage
  const getImprovementPercent = (smartValue: number | undefined, avgValue: number | undefined, lowerIsBetter = true): string => {
    if (smartValue === undefined || avgValue === undefined || avgValue === 0) return "0";
    
    if (lowerIsBetter) {
      return ((avgValue - smartValue) / avgValue * 100).toFixed(1);
    } else {
      return ((smartValue - avgValue) / avgValue * 100).toFixed(1);
    }
  };

  // Calculate efficiency percentage for progress bars
  const getSmartEfficiencyPercent = (smartValue: number | undefined, avgValue: number | undefined, lowerIsBetter = false): number => {
    if (smartValue === undefined || avgValue === undefined || avgValue === 0) return 0;
    
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

  // Start the benchmark
  const handleStartBenchmark = () => {
    if (!simulationEngine) return;
    
    // Reset any previous demo results
    setDemoResults(new Map());
    
    // Configure fast mode if needed
    simulationEngine.setFastBenchmarkMode?.(fastMode);
    
    // Start with smaller operation count if in fast mode
    const actualOperationCount = fastMode ? Math.min(500, operationCount) : operationCount;
    
    // Start the sequential demo
    simulationEngine.startSequentialDemo(workloadType, actualOperationCount);
    
    // Update UI state
    setDemoMode(true);
    setDemoPhase('individual');
    setDemoProgress(0);
  };

  // Get smart metrics
  const smartMetrics = demoPhase === 'complete' && demoResults.size > 0 ? 
    Array.from(demoResults.values())[demoResults.size - 1] : 
    undefined;

  // Prepare data for charts
  const prepareChartData = () => {
    if (demoResults.size === 0) return [];
    
    return Array.from(demoResults.entries()).map(([allocator, metrics]) => ({
      name: allocator,
      memoryUsage: metrics.currentMemoryUsage / 1024,  // KB
      fragmentation: metrics.fragmentation,
      successRate: metrics.successRate,
      allocationTime: metrics.averageAllocationTime
    }));
  };
  
  const chartData = prepareChartData();
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="pb-16"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Allocator Benchmark Suite</h1>
        <p className="text-gray-400">Compare all allocators side-by-side with standardized workloads</p>
      </div>
      
      {/* Benchmark Configuration */}
      {!demoMode && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl mb-8">
          <div className="p-1 bg-gradient-to-r from-yellow-500 to-purple-600"></div>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-yellow-400" />
              Benchmark Configuration
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <div className="text-xs text-gray-500 mt-1">
                  Select the allocation pattern to test with
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Operation Count
                </label>
                <input
                  type="number"
                  value={operationCount}
                  onChange={(e) => setOperationCount(Number(e.target.value))}
                  min="100"
                  max="5000"
                  className="bg-gray-800 border border-gray-700 text-white rounded-md px-3 py-2 w-full"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Higher values provide more accurate results but take longer
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <button
                onClick={handleStartBenchmark}
                className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-purple-600 hover:from-yellow-600 hover:to-purple-700 text-white rounded-md flex items-center gap-2 font-medium"
              >
                <PlayCircle className="w-5 h-5" />
                Run Benchmark
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Benchmark in Progress - New Section */}
      {demoMode && demoPhase !== 'complete' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl mb-8">
          <div className="p-1 bg-gradient-to-r from-yellow-500 to-purple-600"></div>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                Benchmark in Progress
              </h2>
              <div className="text-sm text-blue-400">
                {demoPhase === 'individual' 
                  ? 'Testing Standard Allocators' 
                  : 'Testing SmartEdgeAlloc'}
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm text-gray-300 mb-2">
              <span>Progress</span>
              <span>{demoProgress.toFixed(0)}%</span>
            </div>
            
            <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden mb-4">
              <div
                className="h-full bg-gradient-to-r from-yellow-500 to-purple-600 transition-all duration-300"
                style={{ width: `${demoProgress}%` }}
              />
            </div>
            
            {demoPhase === 'individual' && (
              <div className="text-gray-400 text-sm">
                Running all allocators through identical workload patterns...
              </div>
            )}
            
            {demoPhase === 'smart' && (
              <div className="text-gray-400 text-sm">
                Testing SmartEdgeAlloc's adaptive strategy...
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Rest of your existing benchmark page code... */}
      {demoPhase === 'complete' && demoResults.size > 0 && (
        <>
          {/* Summary Stats */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl mb-8">
            <div className="p-1 bg-gradient-to-r from-green-500 to-blue-600"></div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    SmartEdgeAlloc Performance Summary
                  </h2>
                  <div className="text-sm text-gray-400 mt-1">
                    Comparative analysis with {demoResults.size} allocator strategies
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-gray-400 bg-gray-800 px-3 py-1 rounded-lg text-sm">
                  <Cpu className="w-4 h-4" />
                  <span>ESP32 {formatBytes(ESP32_HEAP_SIZE)} Memory</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                {/* Memory Usage */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Activity className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-300">Memory Usage</h3>
                      <div className="text-xl font-bold text-white">
                        {formatBytes(smartMetrics?.currentMemoryUsage ?? 0)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Avg: {formatBytes(getAverageMemoryUsage())}</span>
                    <span className={parseFloat(getImprovementPercent(smartMetrics?.currentMemoryUsage, getAverageMemoryUsage(), true)) > 0 ? 'text-green-400' : 'text-red-400'}>
                      {parseFloat(getImprovementPercent(smartMetrics?.currentMemoryUsage, getAverageMemoryUsage(), true)) > 0 ? '+' : ''}
                      {getImprovementPercent(smartMetrics?.currentMemoryUsage, getAverageMemoryUsage(), true)}%
                    </span>
                  </div>
                </div>
                
                {/* Fragmentation */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <TrendingDown className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-300">Fragmentation</h3>
                      <div className="text-xl font-bold text-white">
                        {smartMetrics?.fragmentation.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Avg: {getAverageFragmentation().toFixed(1)}%</span>
                    <span className={parseFloat(getImprovementPercent(smartMetrics?.fragmentation, getAverageFragmentation(), true)) > 0 ? 'text-green-400' : 'text-red-400'}>
                      {parseFloat(getImprovementPercent(smartMetrics?.fragmentation, getAverageFragmentation(), true)) > 0 ? '+' : ''}
                      {getImprovementPercent(smartMetrics?.fragmentation, getAverageFragmentation(), true)}%
                    </span>
                  </div>
                </div>
                
                {/* Success Rate */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-yellow-500/10 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-300">Success Rate</h3>
                      <div className="text-xl font-bold text-white">
                        {smartMetrics?.successRate.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Avg: {getAverageSuccessRate().toFixed(1)}%</span>
                    <span className={parseFloat(getImprovementPercent(smartMetrics?.successRate, getAverageSuccessRate(), false)) > 0 ? 'text-green-400' : 'text-red-400'}>
                      {parseFloat(getImprovementPercent(smartMetrics?.successRate, getAverageSuccessRate(), false)) > 0 ? '+' : ''}
                      {getImprovementPercent(smartMetrics?.successRate, getAverageSuccessRate(), false)}%
                    </span>
                  </div>
                </div>
                
                {/* Allocation Speed */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                      <Clock className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-300">Alloc Time</h3>
                      <div className="text-xl font-bold text-white">
                        {smartMetrics?.averageAllocationTime.toFixed(3)} ms
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Avg: {getAverageAllocationTime().toFixed(3)} ms</span>
                    <span className={parseFloat(getImprovementPercent(smartMetrics?.averageAllocationTime, getAverageAllocationTime(), true)) > 0 ? 'text-green-400' : 'text-red-400'}>
                      {parseFloat(getImprovementPercent(smartMetrics?.averageAllocationTime, getAverageAllocationTime(), true)) > 0 ? '+' : ''}
                      {getImprovementPercent(smartMetrics?.averageAllocationTime, getAverageAllocationTime(), true)}%
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4 mt-4">
                <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-400" />
                  SmartEdgeAlloc Advantages
                </h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
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
          </div>

          {/* Visualization Controls */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl mb-8">
            <div className="p-1 bg-gradient-to-r from-purple-500 to-blue-600"></div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  Performance Visualization
                </h2>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowMemoryComparison(!showMemoryComparison)}
                    className={`px-3 py-1 rounded-md text-sm ${showMemoryComparison ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-800 text-gray-400'}`}
                  >
                    Memory
                  </button>
                  <button 
                    onClick={() => setShowFragmentationComparison(!showFragmentationComparison)}
                    className={`px-3 py-1 rounded-md text-sm ${showFragmentationComparison ? 'bg-green-500/20 text-green-400' : 'bg-gray-800 text-gray-400'}`}
                  >
                    Fragmentation
                  </button>
                  <button 
                    onClick={() => setShowSuccessRateComparison(!showSuccessRateComparison)}
                    className={`px-3 py-1 rounded-md text-sm ${showSuccessRateComparison ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-800 text-gray-400'}`}
                  >
                    Success Rate
                  </button>
                  <button 
                    onClick={() => setShowTimeComparison(!showTimeComparison)}
                    className={`px-3 py-1 rounded-md text-sm ${showTimeComparison ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-800 text-gray-400'}`}
                  >
                    Allocation Time
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Memory Usage Chart */}
                {showMemoryComparison && (
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-400" />
                      Memory Usage (KB)
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fill: '#9CA3AF' }} 
                            axisLine={{ stroke: '#4B5563' }}
                          />
                          <YAxis 
                            tick={{ fill: '#9CA3AF' }} 
                            axisLine={{ stroke: '#4B5563' }}
                            unit=" KB"
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1F2937', 
                              border: '1px solid #374151',
                              borderRadius: '6px',
                              color: '#E5E7EB'
                            }}
                          />
                          <Bar 
                            dataKey="memoryUsage" 
                            fill="#3B82F6" 
                            radius={[4, 4, 0, 0]}
                            name="Memory Usage"
                          >
                            {chartData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.name === 'C Allocator' ? '#8B5CF6' : '#3B82F6'} 
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
                
                {/* Fragmentation Chart */}
                {showFragmentationComparison && (
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-green-400" />
                      Fragmentation (%)
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fill: '#9CA3AF' }} 
                            axisLine={{ stroke: '#4B5563' }}
                          />
                          <YAxis 
                            tick={{ fill: '#9CA3AF' }} 
                            axisLine={{ stroke: '#4B5563' }}
                            unit="%"
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1F2937', 
                              border: '1px solid #374151',
                              borderRadius: '6px',
                              color: '#E5E7EB'
                            }}
                          />
                          <Bar 
                            dataKey="fragmentation" 
                            fill="#10B981" 
                            radius={[4, 4, 0, 0]}
                            name="Fragmentation"
                          >
                            {chartData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.name === 'C Allocator' ? '#8B5CF6' : '#10B981'} 
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
                
                {/* Success Rate Chart */}
                {showSuccessRateComparison && (
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-yellow-400" />
                      Success Rate (%)
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fill: '#9CA3AF' }} 
                            axisLine={{ stroke: '#4B5563' }}
                          />
                          <YAxis 
                            tick={{ fill: '#9CA3AF' }} 
                            axisLine={{ stroke: '#4B5563' }}
                            unit="%"
                            domain={[0, 100]}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1F2937', 
                              border: '1px solid #374151',
                              borderRadius: '6px',
                              color: '#E5E7EB'
                            }}
                          />
                          <Bar 
                            dataKey="successRate" 
                            fill="#F59E0B" 
                            radius={[4, 4, 0, 0]}
                            name="Success Rate"
                          >
                            {chartData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.name === 'C Allocator' ? '#8B5CF6' : '#F59E0B'} 
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
                
                {/* Allocation Time Chart */}
                {showTimeComparison && (
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-purple-400" />
                      Allocation Time (ms)
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fill: '#9CA3AF' }} 
                            axisLine={{ stroke: '#4B5563' }}
                          />
                          <YAxis 
                            tick={{ fill: '#9CA3AF' }} 
                            axisLine={{ stroke: '#4B5563' }}
                            unit=" ms"
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1F2937', 
                              border: '1px solid #374151',
                              borderRadius: '6px',
                              color: '#E5E7EB'
                            }}
                          />
                          <Bar 
                            dataKey="allocationTime" 
                            fill="#8B5CF6" 
                            radius={[4, 4, 0, 0]}
                            name="Allocation Time"
                          >
                            {chartData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.name === 'C Allocator' ? '#8B5CF6' : '#8B5CF6'} 
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Detailed Results Table */}
          {demoPhase === 'complete' && demoResults.size > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl mb-8">
              <div className="p-1 bg-gradient-to-r from-yellow-500 to-blue-600"></div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <FileBarChart className="w-5 h-5 text-yellow-400" />
                  <h2 className="text-xl font-semibold text-white">Detailed Benchmark Results</h2>
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
                            {formatBytes(metrics.currentMemoryUsage)}
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
                      
                      {/* SmartEdgeAlloc Row - Highlighted */}
                      <tr className="bg-blue-900/30 border-t-2 border-b-2 border-blue-500">
                        <td className="px-4 py-3 text-sm text-white font-medium">
                          SmartEdgeAlloc
                        </td>
                        <td className="px-4 py-3 text-sm text-white">
                          {formatBytes(smartMetrics?.currentMemoryUsage ?? 0)}
                        </td>
                        <td className="px-4 py-3 text-sm text-white">
                          {smartMetrics?.fragmentation.toFixed(1)}%
                        </td>
                        <td className="px-4 py-3 text-sm text-white">
                          {smartMetrics?.successRate.toFixed(1)}%
                        </td>
                        <td className="px-4 py-3 text-sm text-white">
                          {smartMetrics?.averageAllocationTime.toFixed(3)} ms
                        </td>
                      </tr>
                      
                      {/* Improvement Summary Row */}
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
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default BenchmarkPage;