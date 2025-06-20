import { AllocatorType, AllocationRequest, AllocationBlock, AllocatorMetrics } from '../../types/allocator';
import { ESP32_HEAP_SIZE, formatBytes } from '../../constants/ESP32Constants';
import { loggingService } from '../../services/LoggingService';

export abstract class BaseAllocator {
  protected blocks: AllocationBlock[] = [];
  protected freeBlocks: AllocationBlock[] = [];
  protected allocatedBlocks: Map<string, AllocationBlock> = new Map();
  protected totalSize: number;
  protected metrics: AllocatorMetrics;

  // Add a method to check for out of memory condition
  protected isOutOfMemory(requestSize: number): boolean {
    const currentUsage = this.metrics.currentMemoryUsage;
    const wouldExceed = currentUsage + requestSize > this.totalSize;

    if (wouldExceed) {
      const remaining = this.totalSize - currentUsage;
      loggingService.logError(
        this.type,
        `Out of memory! Requested ${formatBytes(requestSize)}, but only ${formatBytes(remaining)} bytes remain`
      );
    }

    return wouldExceed;
  }

  constructor(totalSize: number = ESP32_HEAP_SIZE) {
    this.totalSize = totalSize;
    this.metrics = {
      totalAllocations: 0,
      totalDeallocations: 0,
      currentMemoryUsage: 0,
      peakMemoryUsage: 0,
      fragmentation: 0,
      averageAllocationTime: 0,
      averageDeallocationTime: 0,
      wastedSpace: 0,
      successRate: 0
    };
    this.initialize();
  }

  abstract get type(): AllocatorType;
  abstract allocate(request: AllocationRequest): AllocationBlock | null;
  abstract deallocate(blockId: string): boolean;

  protected abstract initialize(): void;

  getMetrics(): AllocatorMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  protected updateMetrics(): void {
    this.metrics.currentMemoryUsage = Array.from(this.allocatedBlocks.values())
      .reduce((sum, block) => sum + block.size, 0);

    this.metrics.peakMemoryUsage = Math.max(this.metrics.peakMemoryUsage, this.metrics.currentMemoryUsage);

    // Calculate fragmentation as percentage of unusable space
    const freeSpace = this.freeBlocks.reduce((sum, block) => sum + block.size, 0);
    const largestFreeBlock = Math.max(...this.freeBlocks.map(b => b.size), 0);
    this.metrics.fragmentation = freeSpace > 0 ? ((freeSpace - largestFreeBlock) / freeSpace) * 100 : 0;

    // Calculate success rate
    const totalRequests = this.metrics.totalAllocations + this.metrics.totalDeallocations;
    this.metrics.successRate = totalRequests > 0 ? (this.metrics.totalAllocations / totalRequests) * 100 : 100;
  }

  getAllocatedBlocks(): AllocationBlock[] {
    return Array.from(this.allocatedBlocks.values());
  }

  getFreeBlocks(): AllocationBlock[] {
    return [...this.freeBlocks];
  }

  reset(): void {
    this.blocks = [];
    this.freeBlocks = [];
    this.allocatedBlocks.clear();
    this.metrics = {
      totalAllocations: 0,
      totalDeallocations: 0,
      currentMemoryUsage: 0,
      peakMemoryUsage: 0,
      fragmentation: 0,
      averageAllocationTime: 0,
      averageDeallocationTime: 0,
      wastedSpace: 0,
      successRate: 0
    };
    this.initialize();
  }
}
