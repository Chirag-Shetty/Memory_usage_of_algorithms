import { 
  AllocatorType, 
  WorkloadType, 
  AllocationRequest, 
  AllocatorMetrics,
  SimulationState
} from '../../types/allocator';
import { 
  BaseAllocator,
  LinearAllocator,
  StackAllocator,
  PoolAllocator,
  FreeListAllocator,
  RBTreeAllocator,
  BuddyAllocator,
  CAllocator
} from '../allocators';
import { WorkloadGenerator } from '../workload/WorkloadGenerator';
import { SmartEdgeAlloc, AllocatorScore } from './SmartEdgeAlloc';
import { loggingService } from '../../services/LoggingService';
import { ESP32_HEAP_SIZE, formatBytes } from '../../constants/ESP32Constants';

export class SimulationEngine {
  private allocators: Map<AllocatorType, BaseAllocator>;
  private workloadGenerator: WorkloadGenerator;
  private smartEdgeAlloc: SmartEdgeAlloc;
  private activeRequests: Map<string, { request: AllocationRequest; expiryTime: number }>;
  private simulationState: SimulationState;
  private intervalId: number | null = null;

  constructor() {
    // Initialize all maps before use
    this.allocators = new Map();
    this.activeRequests = new Map();
    
    // Create instances
    this.workloadGenerator = new WorkloadGenerator();
    this.smartEdgeAlloc = new SmartEdgeAlloc();
    
    // Initialize simulation state
    this.simulationState = {
      isRunning: false,
      currentTime: 0,
      workloadType: WorkloadType.RANDOM,
      selectedAllocator: AllocatorType.FREE_LIST,
      smartMode: true,
      speed: 1
    };
    
    // Initialize allocators last
    this.initializeAllocators();
  }

  private initializeAllocators(): void {
    const memorySize = ESP32_HEAP_SIZE; // Use ESP32 heap size (32KB)
    
    this.allocators.set(AllocatorType.LINEAR, new LinearAllocator(memorySize));
    this.allocators.set(AllocatorType.STACK, new StackAllocator(memorySize));
    this.allocators.set(AllocatorType.POOL, new PoolAllocator(memorySize, 64));
    this.allocators.set(AllocatorType.FREE_LIST, new FreeListAllocator(memorySize));
    this.allocators.set(AllocatorType.RB_TREE, new RBTreeAllocator(memorySize));
    this.allocators.set(AllocatorType.BUDDY, new BuddyAllocator(memorySize));
    this.allocators.set(AllocatorType.C_ALLOCATOR, new CAllocator(memorySize));
    
    // Log initialization messages
    loggingService.logBoot(`Device boot complete. Maximum allocatable memory (heap): ${formatBytes(memorySize, true)}`);
    loggingService.logBoot(`Initializing allocators...`);
    
    // Log each allocator initialization
    this.allocators.forEach((allocator, type) => {
      loggingService.logBoot(`${type} Allocator initialized (heap: 0/${formatBytes(memorySize, true)})`);
    });
  }

  start(): void {
    if (this.simulationState.isRunning) return;
    
    this.simulationState.isRunning = true;
    const interval = Math.max(50, 1000 / this.simulationState.speed);
    
    loggingService.logEvent(`Simulation started with ${this.simulationState.workloadType} workload at ${this.simulationState.speed}x speed`);
    
    this.intervalId = window.setInterval(() => {
      this.simulationStep();
    }, interval);
  }

  stop(): void {
    this.simulationState.isRunning = false;
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      loggingService.logEvent('Simulation stopped');
    }
  }

  reset(): void {
    this.stop();
    this.allocators.forEach(allocator => allocator.reset());
    this.activeRequests.clear();
    this.workloadGenerator.reset();
    this.simulationState.currentTime = 0;
    loggingService.logEvent('Simulation reset');
  }

  private simulationStep(): void {
    this.simulationState.currentTime = Date.now();

    // Clean up expired requests
    this.cleanupExpiredRequests();

    // Generate new allocation requests
    if (Math.random() < 0.3) { // 30% chance per step
      const request = this.workloadGenerator.generateRequest(this.simulationState.workloadType);
      this.processAllocationRequest(request);
    }

    // Update smart allocator selection if in smart mode
    if (this.simulationState.smartMode) {
      this.updateSmartSelection();
    }
  }

  private cleanupExpiredRequests(): void {
    const now = Date.now();
    for (const [requestId, { expiryTime }] of this.activeRequests) {
      if (now >= expiryTime) {
        // Deallocate the block from all allocators
        this.allocators.forEach((allocator, type) => {
          const startTime = performance.now();
          const block = Array.from(allocator.getAllocatedBlocks()).find(b => b.id === requestId);
          
          if (block) {
            const success = allocator.deallocate(requestId);
            const endTime = performance.now();
            
            if (success) {
              loggingService.logDeallocation(
                type,
                block,
                endTime - startTime
              );
            }
          }
        });
        
        this.activeRequests.delete(requestId);
        loggingService.logEvent(`Request ${requestId} expired and deallocated`);
      }
    }
  }

  private processAllocationRequest(request: AllocationRequest): void {
    // Try to allocate in all allocators for comparison
    this.allocators.forEach((allocator, type) => {
      const startTime = performance.now();
      const block = allocator.allocate(request);
      const endTime = performance.now();
      const metrics = allocator.getMetrics();
      
      if (block) {
        // Log successful allocation
        loggingService.logAllocation(
          type,
          block,
          endTime - startTime,
          metrics.fragmentation,
          metrics.currentMemoryUsage  // Add the missing usedMemory parameter
        );
      }
    });

    // Add to active requests if it has a duration
    if (request.duration) {
      this.activeRequests.set(request.id, {
        request,
        expiryTime: request.timestamp + request.duration
      });
      
      // Log event
      loggingService.logEvent(`Request ${request.id} added with duration ${request.duration}ms`);
    }
  }

  private updateSmartSelection(): void {
    const metricsMap = new Map<AllocatorType, AllocatorMetrics>();
    this.allocators.forEach((allocator, type) => {
      const metrics = allocator.getMetrics();
      metricsMap.set(type, metrics);
      
      // Log metrics periodically (not on every update to avoid spam)
      if (Math.random() < 0.1) { // 10% chance to log metrics
        loggingService.logMetrics(type, metrics);
      }
    });

    const optimalSelection = this.smartEdgeAlloc.selectOptimalAllocator(
      this.simulationState.workloadType,
      metricsMap
    );

    // If selection changed, log it
    if (this.simulationState.selectedAllocator !== optimalSelection.allocator) {
      loggingService.logRecommendation(optimalSelection);
      this.simulationState.selectedAllocator = optimalSelection.allocator;
    }
  }

  // Public API methods
  getSimulationState(): SimulationState {
    return { ...this.simulationState };
  }

  setWorkloadType(workloadType: WorkloadType): void {
    this.simulationState.workloadType = workloadType;
  }

  setSelectedAllocator(allocator: AllocatorType): void {
    this.simulationState.selectedAllocator = allocator;
  }

  setSmartMode(enabled: boolean): void {
    this.simulationState.smartMode = enabled;
  }

  setSpeed(speed: number): void {
    this.simulationState.speed = Math.max(0.1, Math.min(10, speed));
    if (this.simulationState.isRunning) {
      this.stop();
      this.start();
    }
  }

  getAllocatorMetrics(): Map<AllocatorType, AllocatorMetrics> {
    const metricsMap = new Map<AllocatorType, AllocatorMetrics>();
    this.allocators.forEach((allocator, type) => {
      metricsMap.set(type, allocator.getMetrics());
    });
    return metricsMap;
  }

  getAllocatorScores(): AllocatorScore[] {
    const metricsMap = this.getAllocatorMetrics();
    return this.smartEdgeAlloc.getAllocatorScores(this.simulationState.workloadType, metricsMap);
  }

  getCurrentAllocator(): BaseAllocator | undefined {
    return this.allocators.get(this.simulationState.selectedAllocator);
  }

  getAllocators(): Map<AllocatorType, BaseAllocator> {
    return new Map(this.allocators);
  }
}