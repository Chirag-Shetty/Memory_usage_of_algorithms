import { AllocatorType, WorkloadType, AllocatorMetrics } from '../../types/allocator';

export interface AllocatorScore {
  allocator: AllocatorType;
  score: number;
  reasoning: string[];
}

export class SmartEdgeAlloc {
  private readonly WORKLOAD_WEIGHTS = {
    [WorkloadType.RANDOM]: {
      [AllocatorType.FREE_LIST]: 0.8,
      [AllocatorType.C_ALLOCATOR]: 0.9,
      [AllocatorType.RB_TREE]: 0.7,
      [AllocatorType.BUDDY]: 0.6,
      [AllocatorType.POOL]: 0.4,
      [AllocatorType.STACK]: 0.3,
      [AllocatorType.LINEAR]: 0.2
    },
    [WorkloadType.UNIFORM_SMALL]: {
      [AllocatorType.POOL]: 0.95,
      [AllocatorType.BUDDY]: 0.8,
      [AllocatorType.C_ALLOCATOR]: 0.7,
      [AllocatorType.FREE_LIST]: 0.6,
      [AllocatorType.RB_TREE]: 0.5,
      [AllocatorType.STACK]: 0.4,
      [AllocatorType.LINEAR]: 0.3
    },
    [WorkloadType.UNIFORM_LARGE]: {
      [AllocatorType.LINEAR]: 0.9,
      [AllocatorType.BUDDY]: 0.8,
      [AllocatorType.FREE_LIST]: 0.7,
      [AllocatorType.RB_TREE]: 0.7,
      [AllocatorType.C_ALLOCATOR]: 0.6,
      [AllocatorType.STACK]: 0.5,
      [AllocatorType.POOL]: 0.2
    },
    [WorkloadType.LIFO]: {
      [AllocatorType.STACK]: 0.95,
      [AllocatorType.LINEAR]: 0.8,
      [AllocatorType.POOL]: 0.6,
      [AllocatorType.FREE_LIST]: 0.5,
      [AllocatorType.C_ALLOCATOR]: 0.5,
      [AllocatorType.RB_TREE]: 0.4,
      [AllocatorType.BUDDY]: 0.4
    },
    [WorkloadType.SHORT_LIVED]: {
      [AllocatorType.STACK]: 0.9,
      [AllocatorType.LINEAR]: 0.85,
      [AllocatorType.POOL]: 0.8,
      [AllocatorType.FREE_LIST]: 0.6,
      [AllocatorType.C_ALLOCATOR]: 0.5,
      [AllocatorType.RB_TREE]: 0.5,
      [AllocatorType.BUDDY]: 0.4
    },
    [WorkloadType.LONG_LIVED]: {
      [AllocatorType.FREE_LIST]: 0.9,
      [AllocatorType.RB_TREE]: 0.85,
      [AllocatorType.C_ALLOCATOR]: 0.8,
      [AllocatorType.BUDDY]: 0.7,
      [AllocatorType.LINEAR]: 0.6,
      [AllocatorType.POOL]: 0.5,
      [AllocatorType.STACK]: 0.3
    },
    [WorkloadType.POWER_OF_TWO]: {
      [AllocatorType.BUDDY]: 0.95,
      [AllocatorType.POOL]: 0.8,
      [AllocatorType.FREE_LIST]: 0.7,
      [AllocatorType.RB_TREE]: 0.7,
      [AllocatorType.C_ALLOCATOR]: 0.6,
      [AllocatorType.STACK]: 0.4,
      [AllocatorType.LINEAR]: 0.3
    }
  };

  selectOptimalAllocator(
    workloadType: WorkloadType,
    metricsMap: Map<AllocatorType, AllocatorMetrics>
  ): AllocatorScore {
    const scores: AllocatorScore[] = [];

    for (const allocatorType of Object.values(AllocatorType)) {
      const baseScore = this.WORKLOAD_WEIGHTS[workloadType][allocatorType] || 0.5;
      const metrics = metricsMap.get(allocatorType);
      
      let adjustedScore = baseScore;
      const reasoning: string[] = [];

      if (metrics) {
        // Adjust score based on current performance
        
        // Fragmentation penalty
        if (metrics.fragmentation > 50) {
          adjustedScore *= 0.7;
          reasoning.push('High fragmentation penalty');
        } else if (metrics.fragmentation < 10) {
          adjustedScore *= 1.1;
          reasoning.push('Low fragmentation bonus');
        }

        // Success rate adjustment
        if (metrics.successRate < 90) {
          adjustedScore *= 0.8;
          reasoning.push('Low success rate penalty');
        } else if (metrics.successRate > 95) {
          adjustedScore *= 1.05;
          reasoning.push('High success rate bonus');
        }

        // Memory efficiency adjustment
        const memoryEfficiency = metrics.currentMemoryUsage / (metrics.currentMemoryUsage + metrics.wastedSpace || 1);
        if (memoryEfficiency > 0.9) {
          adjustedScore *= 1.1;
          reasoning.push('High memory efficiency bonus');
        } else if (memoryEfficiency < 0.7) {
          adjustedScore *= 0.9;
          reasoning.push('Low memory efficiency penalty');
        }

        // Performance adjustment (based on allocation time)
        if (metrics.averageAllocationTime < 0.1) {
          adjustedScore *= 1.05;
          reasoning.push('Fast allocation bonus');
        } else if (metrics.averageAllocationTime > 1.0) {
          adjustedScore *= 0.95;
          reasoning.push('Slow allocation penalty');
        }
      }

      // Add workload-specific reasoning
      reasoning.unshift(this.getWorkloadReasoning(workloadType, allocatorType));

      scores.push({
        allocator: allocatorType,
        score: Math.max(0, Math.min(1, adjustedScore)),
        reasoning
      });
    }

    // Return the highest scoring allocator
    scores.sort((a, b) => b.score - a.score);
    return scores[0];
  }

  private getWorkloadReasoning(workloadType: WorkloadType, allocatorType: AllocatorType): string {
    const reasoningMap: Record<WorkloadType, Record<AllocatorType, string>> = {
      [WorkloadType.RANDOM]: {
        [AllocatorType.C_ALLOCATOR]: 'General-purpose design handles random patterns well',
        [AllocatorType.FREE_LIST]: 'Flexible allocation suits random sizes',
        [AllocatorType.RB_TREE]: 'O(log n) search good for varied sizes',
        [AllocatorType.BUDDY]: 'Power-of-2 alignment creates waste',
        [AllocatorType.POOL]: 'Fixed sizes inefficient for random requests',
        [AllocatorType.STACK]: 'LIFO constraint limits random access',
        [AllocatorType.LINEAR]: 'No deallocation limits reuse'
      },
      [WorkloadType.UNIFORM_SMALL]: {
        [AllocatorType.POOL]: 'Perfect for uniform small allocations',
        [AllocatorType.BUDDY]: 'Power-of-2 works well for small blocks',
        [AllocatorType.C_ALLOCATOR]: 'Size classes handle small blocks efficiently',
        [AllocatorType.FREE_LIST]: 'Overhead high for small allocations',
        [AllocatorType.RB_TREE]: 'Tree overhead not justified for small blocks',
        [AllocatorType.STACK]: 'Simple but order-dependent',
        [AllocatorType.LINEAR]: 'Efficient but no individual deallocation'
      },
      [WorkloadType.UNIFORM_LARGE]: {
        [AllocatorType.LINEAR]: 'Excellent for large sequential allocations',
        [AllocatorType.BUDDY]: 'Handles large power-of-2 blocks well',
        [AllocatorType.FREE_LIST]: 'Good for varied large block management',
        [AllocatorType.RB_TREE]: 'Efficient search for large blocks',
        [AllocatorType.C_ALLOCATOR]: 'General purpose works adequately',
        [AllocatorType.STACK]: 'Order constraints limit flexibility',
        [AllocatorType.POOL]: 'Fixed sizes wasteful for large variance'
      },
      [WorkloadType.LIFO]: {
        [AllocatorType.STACK]: 'Perfect match for LIFO access pattern',
        [AllocatorType.LINEAR]: 'Natural fit for sequential allocation',
        [AllocatorType.POOL]: 'Simple deallocation works well',
        [AllocatorType.FREE_LIST]: 'Works but LIFO not optimized',
        [AllocatorType.C_ALLOCATOR]: 'General purpose handles LIFO adequately',
        [AllocatorType.RB_TREE]: 'Complex search not needed for LIFO',
        [AllocatorType.BUDDY]: 'Merging overhead unnecessary for LIFO'
      },
      [WorkloadType.SHORT_LIVED]: {
        [AllocatorType.STACK]: 'Excellent for short-lived allocations',
        [AllocatorType.LINEAR]: 'Minimal overhead, periodic reset',
        [AllocatorType.POOL]: 'Fast allocation/deallocation cycle',
        [AllocatorType.FREE_LIST]: 'Reasonable for temporary allocations',
        [AllocatorType.C_ALLOCATOR]: 'Adequate but higher overhead',
        [AllocatorType.RB_TREE]: 'Tree maintenance overhead',
        [AllocatorType.BUDDY]: 'Splitting/merging overhead'
      },
      [WorkloadType.LONG_LIVED]: {
        [AllocatorType.FREE_LIST]: 'Excellent fragmentation management',
        [AllocatorType.RB_TREE]: 'Efficient long-term block management',
        [AllocatorType.C_ALLOCATOR]: 'Mature long-term allocation strategy',
        [AllocatorType.BUDDY]: 'Good coalescing for long-term use',
        [AllocatorType.LINEAR]: 'Memory exhaustion risk',
        [AllocatorType.POOL]: 'Good if sizes match pool blocks',
        [AllocatorType.STACK]: 'Order constraints problematic'
      },
      [WorkloadType.POWER_OF_TWO]: {
        [AllocatorType.BUDDY]: 'Perfect alignment with power-of-2 sizes',
        [AllocatorType.POOL]: 'Works well if pool sizes are powers of 2',
        [AllocatorType.FREE_LIST]: 'Handles power-of-2 efficiently',
        [AllocatorType.RB_TREE]: 'Good search for power-of-2 blocks',
        [AllocatorType.C_ALLOCATOR]: 'Adequate general-purpose handling',
        [AllocatorType.STACK]: 'Simple but order-dependent',
        [AllocatorType.LINEAR]: 'Works but no size optimization'
      }
    };

    return reasoningMap[workloadType]?.[allocatorType] || 'Standard allocation behavior';
  }

  getAllocatorScores(
    workloadType: WorkloadType,
    metricsMap: Map<AllocatorType, AllocatorMetrics>
  ): AllocatorScore[] {
    const scores: AllocatorScore[] = [];

    for (const allocatorType of Object.values(AllocatorType)) {
      const baseScore = this.WORKLOAD_WEIGHTS[workloadType][allocatorType] || 0.5;
      const metrics = metricsMap.get(allocatorType);
      
      let adjustedScore = baseScore;
      const reasoning: string[] = [this.getWorkloadReasoning(workloadType, allocatorType)];

      if (metrics) {
        // Apply same adjustments as selectOptimalAllocator
        if (metrics.fragmentation > 50) {
          adjustedScore *= 0.7;
          reasoning.push('High fragmentation penalty');
        } else if (metrics.fragmentation < 10) {
          adjustedScore *= 1.1;
          reasoning.push('Low fragmentation bonus');
        }

        if (metrics.successRate < 90) {
          adjustedScore *= 0.8;
          reasoning.push('Low success rate penalty');
        } else if (metrics.successRate > 95) {
          adjustedScore *= 1.05;
          reasoning.push('High success rate bonus');
        }

        const memoryEfficiency = metrics.currentMemoryUsage / (metrics.currentMemoryUsage + metrics.wastedSpace || 1);
        if (memoryEfficiency > 0.9) {
          adjustedScore *= 1.1;
          reasoning.push('High memory efficiency bonus');
        } else if (memoryEfficiency < 0.7) {
          adjustedScore *= 0.9;
          reasoning.push('Low memory efficiency penalty');
        }

        if (metrics.averageAllocationTime < 0.1) {
          adjustedScore *= 1.05;
          reasoning.push('Fast allocation bonus');
        } else if (metrics.averageAllocationTime > 1.0) {
          adjustedScore *= 0.95;
          reasoning.push('Slow allocation penalty');
        }
      }

      scores.push({
        allocator: allocatorType,
        score: Math.max(0, Math.min(1, adjustedScore)),
        reasoning
      });
    }

    return scores.sort((a, b) => b.score - a.score);
  }
}