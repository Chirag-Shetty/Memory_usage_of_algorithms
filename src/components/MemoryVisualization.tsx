import React, { useEffect, useRef } from 'react';
import { Monitor, Activity, Cpu } from 'lucide-react';
import { AllocatorMetrics, AllocationBlock } from '../types/allocator';
import { ESP32_HEAP_SIZE, formatBytes } from '../constants/ESP32Constants';

interface MemoryVisualizationProps {
  allocator: any; 
  title: string;
}

export const MemoryVisualization: React.FC<MemoryVisualizationProps> = ({
  allocator,
  title
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!allocator || !canvasRef.current) return;
    
    // Only try to draw if allocator has the required methods
    if (typeof allocator.getAllocatedBlocks !== 'function' || 
        typeof allocator.getFreeBlocks !== 'function') return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw memory blocks
    try {
      const allocatedBlocks = allocator.getAllocatedBlocks();
      const freeBlocks = allocator.getFreeBlocks();
      
      // Draw allocated blocks in blue
      allocatedBlocks.forEach((block: AllocationBlock) => {
        const x = (block.address / allocator.size) * canvas.width;
        const width = (block.size / allocator.size) * canvas.width;
        
        ctx.fillStyle = 'rgba(59, 130, 246, 0.8)';
        ctx.fillRect(x, 0, width, canvas.height);
      });
      
      // Draw free blocks with striped pattern
      freeBlocks.forEach((block: AllocationBlock) => {
        const x = (block.address / allocator.size) * canvas.width;
        const width = (block.size / allocator.size) * canvas.width;
        
        ctx.fillStyle = 'rgba(209, 213, 219, 0.2)';
        ctx.fillRect(x, 0, width, canvas.height);
      });
    } catch (e) {
      console.error("Error drawing memory blocks:", e);
    }
  }, [allocator]);

  // Check if allocator is properly initialized with required methods
  const isValidAllocator = allocator && 
    typeof allocator.getAllocatedBlocks === 'function' && 
    typeof allocator.getFreeBlocks === 'function';

  if (!isValidAllocator) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
        <div className="text-center text-gray-500">
          Allocator not initialized or missing required methods
        </div>
      </div>
    );
  }

  // Use a safer approach to get metrics
  const getMetricValue = (metric: keyof AllocatorMetrics, defaultValue: number): number => {
    try {
      if (allocator.getMetrics && typeof allocator.getMetrics === 'function') {
        const metrics = allocator.getMetrics();
        return metrics[metric] !== undefined ? metrics[metric] : defaultValue;
      }
      return defaultValue;
    } catch (e) {
      console.error("Error getting metrics:", e);
      return defaultValue;
    }
  };

  const fragmentation = getMetricValue('fragmentation', 0);
  const currentMemoryUsage = getMetricValue('currentMemoryUsage', 0);

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Monitor className="w-5 h-5 text-green-400" />
            {title} Memory Layout
          </h2>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Activity className="w-4 h-4" />
            Live View
          </div>
        </div>
        
        {/* ESP32 Memory Constraints Banner */}
        <div className="bg-blue-900/30 border border-blue-800 rounded-md px-3 py-2 text-sm flex items-center gap-2">
          <Cpu className="w-4 h-4 text-blue-400" />
          <span className="text-blue-300">ESP32 Device Simulation: {formatBytes(ESP32_HEAP_SIZE)} Maximum Heap</span>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className="w-full h-24 rounded-lg border border-gray-700"
        style={{ imageRendering: 'pixelated' }}
        width="600"
        height="50"
      />

      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div className="text-center">
          <div className="text-blue-400 font-semibold">
            {allocator.getAllocatedBlocks ? allocator.getAllocatedBlocks().length : 0}
          </div>
          <div className="text-gray-400">Active Blocks</div>
        </div>
        <div className="text-center">
          <div className="text-gray-400 font-semibold">
            {allocator.getFreeBlocks ? allocator.getFreeBlocks().length : 0}
          </div>
          <div className="text-gray-400">Free Blocks</div>
        </div>
        <div className="text-center">
          <div className={`font-semibold ${
            fragmentation < 10 ? 'text-green-400' :
            fragmentation < 30 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {fragmentation.toFixed(1)}%
          </div>
          <div className="text-gray-400">Fragmentation</div>
        </div>
      </div>

      {/* ESP32 Heap Usage Bar */}
      <div className="mt-4">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>ESP32 Heap Usage</span>
          <span>{formatBytes(currentMemoryUsage)} / {formatBytes(ESP32_HEAP_SIZE)} ({(currentMemoryUsage / ESP32_HEAP_SIZE * 100).toFixed(1)}%)</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
          <div 
            className={`h-full rounded-full ${
              currentMemoryUsage / ESP32_HEAP_SIZE > 0.8 ? 'bg-red-600' : 
              currentMemoryUsage / ESP32_HEAP_SIZE > 0.6 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${(currentMemoryUsage / ESP32_HEAP_SIZE * 100).toFixed(1)}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};