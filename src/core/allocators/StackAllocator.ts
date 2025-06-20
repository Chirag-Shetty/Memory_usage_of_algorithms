import { AllocatorType, AllocationRequest, AllocationBlock } from '../../types/allocator';
import { BaseAllocator } from './BaseAllocator';

export class StackAllocator extends BaseAllocator {
  private stack: AllocationBlock[] = [];
  private currentTop: number = 0;

  get type(): AllocatorType {
    return AllocatorType.STACK;
  }

  protected initialize(): void {
    this.stack = [];
    this.currentTop = 0;
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
    if (this.currentTop + request.size > this.totalSize) {
      return null;
    }

    // Create allocation block
    const block: AllocationBlock = {
      id: request.id,
      address: this.currentTop,
      size: request.size,
      allocated: true,
      timestamp: request.timestamp
    };

    // Push to stack
    this.stack.push(block);
    this.currentTop += request.size;
    
    // Store the allocated block
    this.allocatedBlocks.set(request.id, block);
    
    // Update free space
    this.updateFreeBlocks();

    // Update metrics
    this.metrics.totalAllocations++;
    const allocationTime = performance.now() - startTime;
    this.metrics.averageAllocationTime = 
      (this.metrics.averageAllocationTime * (this.metrics.totalAllocations - 1) + allocationTime) / 
      this.metrics.totalAllocations;

    return block;
  }

  deallocate(blockId: string): boolean {
    const startTime = performance.now();
    
    // Stack allocator only allows deallocation from the top (LIFO)
    if (this.stack.length === 0) {
      return false;
    }

    const topBlock = this.stack[this.stack.length - 1];
    if (topBlock.id !== blockId) {
      // Can only deallocate the top block
      return false;
    }

    // Pop from stack
    this.stack.pop();
    this.currentTop -= topBlock.size;
    this.allocatedBlocks.delete(blockId);
    
    // Update free space
    this.updateFreeBlocks();

    // Update metrics
    this.metrics.totalDeallocations++;
    const deallocationTime = performance.now() - startTime;
    this.metrics.averageDeallocationTime = 
      (this.metrics.averageDeallocationTime * (this.metrics.totalDeallocations - 1) + deallocationTime) / 
      this.metrics.totalDeallocations;

    return true;
  }

  private updateFreeBlocks(): void {
    const remainingSize = this.totalSize - this.currentTop;
    if (remainingSize > 0) {
      this.freeBlocks = [{
        id: 'free-0',
        address: this.currentTop,
        size: remainingSize,
        allocated: false,
        timestamp: Date.now()
      }];
    } else {
      this.freeBlocks = [];
    }
  }
}