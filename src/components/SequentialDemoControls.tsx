import React, { useState } from 'react';
import { PlayCircle, Gauge, Settings, Cpu, BarChart3 } from 'lucide-react';
import { WorkloadType } from '../types/allocator';

interface SequentialDemoControlsProps {
  onStartDemo: (workloadType: WorkloadType, operationCount: number) => void;
  demoProgress: number;
  demoPhase: 'individual' | 'smart' | 'complete' | null;
  currentDemoAllocator: string | null;
}

export const SequentialDemoControls: React.FC<SequentialDemoControlsProps> = ({
  onStartDemo,
  demoProgress,
  demoPhase,
  currentDemoAllocator
}) => {
  const [workloadType, setWorkloadType] = useState<WorkloadType>(WorkloadType.RANDOM);
  const [operationCount, setOperationCount] = useState<number>(1000);
  
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-purple-400" />
          Universal ESP32 Sequential Demo
        </h2>
      </div>
      
      {demoPhase === null ? (
        // Demo Setup Controls
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Workload Type
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
          
          <button
            onClick={() => onStartDemo(workloadType, operationCount)}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-md flex items-center justify-center gap-2"
          >
            <PlayCircle className="w-5 h-5" />
            Start Sequential Demo
          </button>
        </div>
      ) : (
        // Demo Progress Display
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-gray-300 mb-1">
            <span>Demo Progress</span>
            <span>{demoProgress.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-blue-600 transition-all duration-300"
              style={{ width: `${demoProgress}%` }}
            />
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Settings className={`w-5 h-5 ${demoPhase === 'individual' ? 'text-yellow-400' : 'text-gray-500'}`} />
              <h3 className="font-semibold text-white">
                Phase: {demoPhase === 'individual' ? 'Testing Individual Allocators' : 
                         demoPhase === 'smart' ? 'Testing SmartEdgeAlloc' : 'Complete'}
              </h3>
            </div>
            
            {demoPhase === 'individual' && currentDemoAllocator && (
              <div className="ml-7 text-gray-300 mt-1">
                Currently testing: <span className="text-blue-400 font-medium">{currentDemoAllocator} Allocator</span>
              </div>
            )}
            
            {demoPhase === 'smart' && (
              <div className="ml-7 text-gray-300 mt-1">
                Testing adaptive <span className="text-purple-400 font-medium">SmartEdgeAlloc</span> system
              </div>
            )}
            
            {demoPhase === 'complete' && (
              <div className="ml-7 text-gray-300 mt-1 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-green-400" />
                <span className="text-green-400 font-medium">Demo complete! View comparison results below.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};