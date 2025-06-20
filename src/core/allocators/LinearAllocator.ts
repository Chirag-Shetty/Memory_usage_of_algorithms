import { AllocatorType, AllocationRequest, AllocationBlock } from '../../types/allocator';
import { BaseAllocator } from './BaseAllocator';

export class LinearAllocator extends BaseAllocator {
  private currentOffset: number = 0;

  get type(): AllocatorType {
    return AllocatorType.LINEAR;
  }

  protected initialize(): void {
    this.currentOffset = 0;
    // Create one large free block representing the entire memory space
    this.freeBlocks = [{
      id: 'free-0',
      address: 0,
      size: this.totalSize,
      allocated: false,
      timestamp: Date.now()
    }];
  }

  allocate(request: AllocationRequest): AllocationBlock | null {
    const startTime = performance.now();
    
    // Check if we have enough space
    if (this.currentOffset + request.size > this.totalSize) {
      return null;
    }

    // Create allocation block
    const block: AllocationBlock = {
      id: request.id,
      address: this.currentOffset,
      size: request.size,
      allocated: true,
      timestamp: request.timestamp
    };

    // Update offset
    this.currentOffset += request.size;
    
    // Store the allocated block
    this.allocatedBlocks.set(request.id, block);
    
    // Update free blocks - linear allocator just reduces the single free block
    if (this.freeBlocks.length > 0) {
      this.freeBlocks[0].address = this.currentOffset;
      this.freeBlocks[0].size = this.totalSize - this.currentOffset;
      
      if (this.freeBlocks[0].size <= 0) {
        this.freeBlocks = [];
      }
    }

    // Update metrics
    this.metrics.totalAllocations++;
    const allocationTime = performance.now() - startTime;
    this.metrics.averageAllocationTime = 
      (this.metrics.averageAllocationTime * (this.metrics.totalAllocations - 1) + allocationTime) / 
      this.metrics.totalAllocations;

    return block;
  }

  deallocate(blockId: string): boolean {
    // Linear allocator doesn't support individual deallocation
    // This is a fundamental characteristic of linear allocators
    return false;
  }

  // Special method to reset the entire linear allocator
  resetLinear(): void {
    this.currentOffset = 0;
    this.allocatedBlocks.clear();
    this.initialize();
  }
}