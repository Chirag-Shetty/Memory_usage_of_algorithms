import { AllocatorType, AllocationRequest, AllocationBlock } from '../../types/allocator';
import { BaseAllocator } from './BaseAllocator';

export class PoolAllocator extends BaseAllocator {
  private blockSize: number;
  private totalBlocks: number;
  private freeBlockIndices: Set<number> = new Set();

  constructor(totalSize: number = 1024 * 1024, blockSize: number = 64) {
    super(totalSize);
    this.blockSize = blockSize;
    this.totalBlocks = Math.floor(totalSize / blockSize);
  }

  get type(): AllocatorType {
    return AllocatorType.POOL;
  }

  protected initialize(): void {
    this.freeBlockIndices = new Set();
    this.freeBlocks = [];
    
    // Initialize all blocks as free
    for (let i = 0; i < this.totalBlocks; i++) {
      this.freeBlockIndices.add(i);
      this.freeBlocks.push({
        id: `free-${i}`,
        address: i * this.blockSize,
        size: this.blockSize,
        allocated: false,
        timestamp: Date.now()
      });
    }
  }

  allocate(request: AllocationRequest): AllocationBlock | null {
    const startTime = performance.now();
    
    // Pool allocator can only allocate fixed-size blocks
    // If request is larger than block size, fail
    if (request.size > this.blockSize) {
      return null;
    }

    // Find a free block
    if (this.freeBlockIndices.size === 0) {
      return null;
    }

    const blockIndex = this.freeBlockIndices.values().next().value;
    this.freeBlockIndices.delete(blockIndex);

    // Create allocation block
    const block: AllocationBlock = {
      id: request.id,
      address: blockIndex * this.blockSize,
      size: this.blockSize, // Pool allocator always allocates full block size
      allocated: true,
      timestamp: request.timestamp
    };

    // Store the allocated block
    this.allocatedBlocks.set(request.id, block);
    
    // Remove from free blocks
    this.freeBlocks = this.freeBlocks.filter(b => b.address !== block.address);

    // Update metrics
    this.metrics.totalAllocations++;
    this.metrics.wastedSpace += (this.blockSize - request.size); // Track internal fragmentation
    const allocationTime = performance.now() - startTime;
    this.metrics.averageAllocationTime = 
      (this.metrics.averageAllocationTime * (this.metrics.totalAllocations - 1) + allocationTime) / 
      this.metrics.totalAllocations;

    return block;
  }

  deallocate(blockId: string): boolean {
    const startTime = performance.now();
    
    const block = this.allocatedBlocks.get(blockId);
    if (!block) {
      return false;
    }

    const blockIndex = Math.floor(block.address / this.blockSize);
    
    // Return block to free pool
    this.freeBlockIndices.add(blockIndex);
    this.allocatedBlocks.delete(blockId);
    
    // Add back to free blocks
    this.freeBlocks.push({
      id: `free-${blockIndex}`,
      address: block.address,
      size: this.blockSize,
      allocated: false,
      timestamp: Date.now()
    });

    // Update metrics
    this.metrics.totalDeallocations++;
    const deallocationTime = performance.now() - startTime;
    this.metrics.averageDeallocationTime = 
      (this.metrics.averageDeallocationTime * (this.metrics.totalDeallocations - 1) + deallocationTime) / 
      this.metrics.totalDeallocations;

    return true;
  }

  getBlockSize(): number {
    return this.blockSize;
  }

  getTotalBlocks(): number {
    return this.totalBlocks;
  }

  getFreeBlockCount(): number {
    return this.freeBlockIndices.size;
  }
}