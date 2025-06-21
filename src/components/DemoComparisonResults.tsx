import React from 'react';
import { BarChart3, Trophy, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { AllocatorType, AllocatorMetrics } from '../types/allocator';

interface DemoComparisonResultsProps {
  results: Map<AllocatorType, AllocatorMetrics>;
  smartMetrics: AllocatorMetrics | null;
  visible: boolean;
}

export const DemoComparisonResults: React.FC<DemoComparisonResultsProps> = ({
  results,
  smartMetrics,
  visible
}) => {
  if (!visible || !smartMetrics) return null;
  
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
  
  const compareMetric = (metric: number, smartMetric: number, isLowerBetter: boolean = false): JSX.Element => {
    const diff = ((smartMetric - metric) / metric * 100).toFixed(1);
    const isImproved = isLowerBetter ? smartMetric < metric : smartMetric > metric;
    const isSame = Math.abs(smartMetric - metric) < 0.01;
    
    if (isSame) {
      return <span className="text-gray-500 flex items-center gap-1"><Minus className="w-3 h-3" /> Same</span>;
    }
    
    return (
      <span className={`flex items-center gap-1 ${isImproved ? 'text-green-500' : 'text-red-500'}`}>
        {isImproved ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
        {isImproved ? '+' : ''}{diff}%
      </span>
    );
  };
  
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          ESP32 Allocator Comparison Results
        </h2>
        <div className="text-sm text-gray-400">
          SmartEdgeAlloc vs. Static Allocators
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
            {Array.from(results.entries()).map(([allocator, metrics]) => (
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
            
            {/* Smart Allocator Row */}
            <tr className="bg-blue-900/30 border-t-2 border-b-2 border-blue-500">
              <td className="px-4 py-3 text-sm text-white font-medium">
                SmartEdgeAlloc
              </td>
              <td className="px-4 py-3 text-sm text-white">
                {formatBytes(smartMetrics.currentMemoryUsage)}
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
            
            {/* Improvement Summary Row */}
            <tr className="bg-gray-900">
              <td className="px-4 py-3 text-sm text-gray-300 font-medium">
                Avg. Improvement
              </td>
              <td className="px-4 py-3 text-sm">
                {compareMetric(
                  Array.from(results.values()).reduce((sum, m) => sum + m.currentMemoryUsage, 0) / results.size,
                  smartMetrics.currentMemoryUsage,
                  true
                )}
              </td>
              <td className="px-4 py-3 text-sm">
                {compareMetric(
                  Array.from(results.values()).reduce((sum, m) => sum + m.fragmentation, 0) / results.size,
                  smartMetrics.fragmentation,
                  true
                )}
              </td>
              <td className="px-4 py-3 text-sm">
                {compareMetric(
                  Array.from(results.values()).reduce((sum, m) => sum + m.successRate, 0) / results.size,
                  smartMetrics.successRate
                )}
              </td>
              <td className="px-4 py-3 text-sm">
                {compareMetric(
                  Array.from(results.values()).reduce((sum, m) => sum + m.averageAllocationTime, 0) / results.size,
                  smartMetrics.averageAllocationTime,
                  true
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};