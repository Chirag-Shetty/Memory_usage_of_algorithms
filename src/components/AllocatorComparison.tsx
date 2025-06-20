import React from 'react';
import { Trophy, Target, Gauge } from 'lucide-react';
import { AllocatorType, AllocatorMetrics } from '../types/allocator';
import { AllocatorScore } from '../core/simulation/SmartEdgeAlloc';

interface AllocatorComparisonProps {
  metrics: Map<AllocatorType, AllocatorMetrics>;
  scores: AllocatorScore[];
  selectedAllocator: AllocatorType;
}

export const AllocatorComparison: React.FC<AllocatorComparisonProps> = ({
  metrics,
  scores,
  selectedAllocator
}) => {
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

  const getScoreColor = (score: number): string => {
    if (score >= 0.8) return 'text-green-400';
    if (score >= 0.6) return 'text-yellow-400';
    if (score >= 0.4) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreBarColor = (score: number): string => {
    if (score >= 0.8) return 'bg-green-500';
    if (score >= 0.6) return 'bg-yellow-500';
    if (score >= 0.4) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          Allocator Performance Comparison
        </h2>
        <div className="text-sm text-gray-400">
          SmartEdgeAlloc Recommendations
        </div>
      </div>

      <div className="space-y-4">
        {scores.map((score, index) => {
          const allocatorMetrics = metrics.get(score.allocator);
          const isSelected = score.allocator === selectedAllocator;
          const isTopChoice = index === 0;

          return (
            <div
              key={score.allocator}
              className={`relative bg-gray-800 rounded-lg p-4 border transition-all ${
                isSelected 
                  ? 'border-blue-500 bg-blue-900/20' 
                  : isTopChoice 
                    ? 'border-yellow-500/50' 
                    : 'border-gray-700'
              }`}
            >
              {isTopChoice && (
                <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full">
                  RECOMMENDED
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Allocator Info */}
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    isSelected ? 'bg-blue-500' : isTopChoice ? 'bg-yellow-500' : 'bg-gray-500'
                  }`} />
                  <div>
                    <h3 className="font-semibold text-white">{score.allocator}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Target className="w-3 h-3 text-gray-400" />
                      <span className={`text-sm font-medium ${getScoreColor(score.score)}`}>
                        {(score.score * 100).toFixed(0)}% match
                      </span>
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                {allocatorMetrics && (
                  <>
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">
                        {formatBytes(allocatorMetrics.currentMemoryUsage)}
                      </div>
                      <div className="text-xs text-gray-400">Memory Used</div>
                    </div>

                    <div className="text-center">
                      <div className={`text-lg font-bold ${
                        allocatorMetrics.fragmentation < 10 ? 'text-green-400' :
                        allocatorMetrics.fragmentation < 30 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {allocatorMetrics.fragmentation.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-400">Fragmentation</div>
                    </div>

                    <div className="text-center">
                      <div className={`text-lg font-bold ${
                        allocatorMetrics.successRate >= 95 ? 'text-green-400' :
                        allocatorMetrics.successRate >= 85 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {allocatorMetrics.successRate.toFixed(0)}%
                      </div>
                      <div className="text-xs text-gray-400">Success Rate</div>
                    </div>
                  </>
                )}
              </div>

              {/* Score Bar */}
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Gauge className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-300">Suitability Score</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${getScoreBarColor(score.score)}`}
                    style={{ width: `${score.score * 100}%` }}
                  />
                </div>
              </div>

              {/* Reasoning */}
              <div className="mt-3">
                <div className="text-xs text-gray-400 mb-1">Key Factors:</div>
                <div className="text-sm text-gray-300">
                  {score.reasoning[0]}
                </div>
                {score.reasoning.length > 1 && (
                  <div className="text-xs text-gray-500 mt-1">
                    +{score.reasoning.length - 1} more factors
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};