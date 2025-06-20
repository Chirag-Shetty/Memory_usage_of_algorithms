import React from 'react';
import { BarChart3, TrendingUp, Zap, AlertTriangle } from 'lucide-react';
import { AllocatorType, AllocatorMetrics } from '../types/allocator';

interface MetricsOverviewProps {
  metrics: Map<AllocatorType, AllocatorMetrics>;
  selectedAllocator: AllocatorType;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({
  metrics,
  selectedAllocator
}) => {
  const currentMetrics = metrics.get(selectedAllocator);

  if (!currentMetrics) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
        <div className="text-center text-gray-500">
          No metrics available for {selectedAllocator}
        </div>
      </div>
    );
  }

  const formatBytes = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const formatTime = (ms: number): string => {
    if (ms < 1) return `${(ms * 1000).toFixed(1)}μs`;
    if (ms < 1000) return `${ms.toFixed(2)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getFragmentationColor = (fragmentation: number): string => {
    if (fragmentation < 10) return 'text-green-400';
    if (fragmentation < 30) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getSuccessRateColor = (rate: number): string => {
    if (rate >= 95) return 'text-green-400';
    if (rate >= 85) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-400" />
          {selectedAllocator} Metrics
        </h2>
        <div className="text-sm text-gray-400">
          Real-time Performance
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {/* Memory Usage */}
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-medium text-gray-300">Memory Usage</h3>
          </div>
          <div className="text-2xl font-bold text-white">
            {formatBytes(currentMetrics.currentMemoryUsage)}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Peak: {formatBytes(currentMetrics.peakMemoryUsage)}
          </div>
        </div>

        {/* Fragmentation */}
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <h3 className="text-sm font-medium text-gray-300">Fragmentation</h3>
          </div>
          <div className={`text-2xl font-bold ${getFragmentationColor(currentMetrics.fragmentation)}`}>
            {currentMetrics.fragmentation.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Wasted: {formatBytes(currentMetrics.wastedSpace)}
          </div>
        </div>

        {/* Success Rate */}
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-green-400" />
            <h3 className="text-sm font-medium text-gray-300">Success Rate</h3>
          </div>
          <div className={`text-2xl font-bold ${getSuccessRateColor(currentMetrics.successRate)}`}>
            {currentMetrics.successRate.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {currentMetrics.totalAllocations} allocations
          </div>
        </div>

        {/* Performance */}
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-medium text-gray-300">Avg Alloc Time</h3>
          </div>
          <div className="text-2xl font-bold text-white">
            {formatTime(currentMetrics.averageAllocationTime)}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Dealloc: {formatTime(currentMetrics.averageDeallocationTime)}
          </div>
        </div>
      </div>

      {/* Operations Summary */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        <div className="grid grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-400">
              {currentMetrics.totalAllocations}
            </div>
            <div className="text-sm text-gray-400">Total Allocations</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">
              {currentMetrics.totalDeallocations}
            </div>
            <div className="text-sm text-gray-400">Total Deallocations</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-400">
              {currentMetrics.totalAllocations - currentMetrics.totalDeallocations}
            </div>
            <div className="text-sm text-gray-400">Active Blocks</div>
          </div>
        </div>
      </div>
    </div>
  );
};