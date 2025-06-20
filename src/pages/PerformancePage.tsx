import React from 'react';
import { PerformanceChart } from '../components/PerformanceChart';
import { motion } from 'framer-motion';
import { BarChart2, TrendingUp, Clock } from 'lucide-react';
import { AllocatorType, AllocatorMetrics } from '../types/allocator';

interface PerformancePageProps {
  metrics: Map<AllocatorType, AllocatorMetrics>;
}

const PerformancePage: React.FC<PerformancePageProps> = ({ metrics }) => {
  // Calculate overall statistics across all allocators
  const calculateAverages = () => {
    let totalFragmentation = 0;
    let totalSuccessRate = 0;
    let totalAllocTime = 0;
    let count = 0;
    
    metrics.forEach((metric) => {
      totalFragmentation += metric.fragmentation;
      totalSuccessRate += metric.successRate;
      totalAllocTime += metric.averageAllocationTime;
      count++;
    });
    
    return {
      avgFragmentation: count ? (totalFragmentation / count).toFixed(1) : '0',
      avgSuccessRate: count ? (totalSuccessRate / count).toFixed(1) : '0',
      avgAllocTime: count ? (totalAllocTime / count).toFixed(3) : '0',
    };
  };
  
  const averages = calculateAverages();
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Performance Analytics</h1>
        <p className="text-gray-400">Detailed performance metrics across all memory allocators</p>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Average Fragmentation</p>
              <h3 className="text-2xl font-bold text-white mt-1">{averages.avgFragmentation}%</h3>
            </div>
            <div className="p-3 bg-red-500/10 rounded-lg">
              <BarChart2 className="w-6 h-6 text-red-500" />
            </div>
          </div>
        </div>
        
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Average Success Rate</p>
              <h3 className="text-2xl font-bold text-white mt-1">{averages.avgSuccessRate}%</h3>
            </div>
            <div className="p-3 bg-green-500/10 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>
        
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Average Allocation Time</p>
              <h3 className="text-2xl font-bold text-white mt-1">{averages.avgAllocTime} ms</h3>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Clock className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Detailed Charts */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl mb-8">
        <div className="p-1 bg-gradient-to-r from-purple-500 to-blue-600"></div>
        <div className="p-6">
          <PerformanceChart metrics={metrics} />
        </div>
      </div>
    </motion.div>
  );
};

export default PerformancePage;