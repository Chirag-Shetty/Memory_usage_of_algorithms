import React from 'react';
import { AllocatorComparison } from '../components/AllocatorComparison';
import { motion } from 'framer-motion';
import { Cpu, Info } from 'lucide-react';
import { AllocatorType, AllocatorMetrics } from '../types/allocator';
import { AllocatorScore } from '../core/simulation/SmartEdgeAlloc';

interface AllocatorsPageProps {
  metrics: Map<AllocatorType, AllocatorMetrics>;
  scores: AllocatorScore[];
  selectedAllocator: AllocatorType;
}

const AllocatorsPage: React.FC<AllocatorsPageProps> = ({
  metrics,
  scores,
  selectedAllocator,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Allocator Comparison</h1>
        <p className="text-gray-400">Compare different memory allocation strategies and their performance</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl mb-8">
        <div className="p-1 bg-gradient-to-r from-yellow-500 to-orange-600"></div>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6 text-white">
            <Cpu className="w-6 h-6 text-yellow-500" />
            <h2 className="text-xl font-semibold">Available Allocators</h2>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-4 mb-6 border border-gray-700">
            <div className="flex gap-2 items-start">
              <Info className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <h3 className="font-medium text-white">About Memory Allocators</h3>
                <p className="text-gray-300 text-sm mt-1">
                  Memory allocators are responsible for managing memory in a program. Different allocators use different strategies
                  for finding free memory blocks, which can significantly impact performance depending on the workload.
                </p>
              </div>
            </div>
          </div>
          
          <AllocatorComparison
            metrics={metrics}
            scores={scores}
            selectedAllocator={selectedAllocator}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default AllocatorsPage;