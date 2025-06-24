export enum AllocatorType {
  LINEAR = 'Linear',
  STACK = 'Stack',
  POOL = 'Pool',
  FREE_LIST = 'Free List',
  RB_TREE = 'RB Tree',
  BUDDY = 'Buddy',
  C_ALLOCATOR = 'C Allocator',
  SMART_EDGE_ALLOC = 'SmartEdgeAlloc'
}

export enum WorkloadType {
  RANDOM = 'Random',
  UNIFORM_SMALL = 'Uniform Small',
  UNIFORM_LARGE = 'Uniform Large',
  LIFO = 'LIFO',
  SHORT_LIVED = 'Short Lived',
  LONG_LIVED = 'Long Lived',
  POWER_OF_TWO = 'Power of Two'
}

export interface AllocationRequest {
  id: string;
  size: number;
  timestamp: number;
  duration?: number;
}

export interface AllocationBlock {
  id: string;
  address: number;
  size: number;
  allocated: boolean;
  timestamp: number;
}

export interface AllocatorMetrics {
  totalAllocations: number;
  totalDeallocations: number;
  currentMemoryUsage: number;
  peakMemoryUsage: number;
  fragmentation: number;
  averageAllocationTime: number;
  averageDeallocationTime: number;
  wastedSpace: number;
  successRate: number;
}

export interface SimulationState {
  isRunning: boolean;
  currentTime: number;
  workloadType: WorkloadType;
  selectedAllocator: AllocatorType;
  smartMode: boolean;
  speed: number;
  demoMode: boolean;
  currentDemoAllocator: AllocatorType | null;
  demoPhase: 'individual' | 'smart' | 'complete';
  demoProgress: number;
}