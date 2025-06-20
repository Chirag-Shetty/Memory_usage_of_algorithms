import { AllocatorType, AllocationRequest, AllocationBlock } from '../../types/allocator';
import { BaseAllocator } from './BaseAllocator';

// Simplified Red-Black Tree implementation for memory allocation
// In a real implementation, this would use a proper RB tree data structure
export class RBTreeAllocator extends BaseAllocator {
  private sortedFreeBlocks: AllocationBlock[] = [];

  get type(): AllocatorType {
    return AllocatorType.RB_TREE;
  }

  protected initialize(): void {
    this.sortedFreeBlocks = [{
      id: 'free-0',
      address: 0,
      size: this.totalSize,
      allocated: false,
      timestamp: Date.now()
    }];
    this.freeBlocks = [...this.sortedFreeBlocks];
  }

  allocate(request: AllocationRequest): AllocationBlock | null {
    const startTime = performance.now();
    
    // Find best fit block (smallest block that can satisfy the request)
    // This simulates O(log n) search in RB tree
    let bestFitIndex = -1;
    let bestFitSize = Infinity;
    
    for (let i = 0; i < this.sortedFreeBlocks.length; i++) {
      const block = this.sortedFreeBlocks[i];
      if (block.size >= request.size && block.size < bestFitSize) {
        bestFitIndex = i;
        bestFitSize = block.size;
      }
    }
    
    if (bestFitIndex === -1) {
      return null;
    }

    const freeBlock = this.sortedFreeBlocks[bestFitIndex];
    
    // Create allocation block
    const block: AllocationBlock = {
      id: request.id,
      address: freeBlock.address,
      size: request.size,
      allocated: true,
      timestamp: request.timestamp
    };

    // Store the allocated block
    this.allocatedBlocks.set(request.id, block);

    // Update free block or remove it
    if (freeBlock.size > request.size) {
      freeBlock.address += request.size;
      freeBlock.size -= request.size;
    } else {
      this.sortedFreeBlocks.splice(bestFitIndex, 1);
    }

    // Update free blocks list
    this.freeBlocks = [...this.sortedFreeBlocks];

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
    
    const block = this.allocatedBlocks.get(blockId);
    if (!block) {
      return false;
    }

    this.allocatedBlocks.delete(blockId);

    // Create a new free block
    const newFreeBlock: AllocationBlock = {
      id: `free-${Date.now()}`,
      address: block.address,
      size: block.size,
      allocated: false,
      timestamp: Date.now()
    };

    // Insert in sorted order and coalesce
    this.insertSortedAndCoalesce(newFreeBlock);
    this.freeBlocks = [...this.sortedFreeBlocks];

    // Update metrics
    this.metrics.totalDeallocations++;
    const deallocationTime = performance.now() - startTime;
    this.metrics.averageDeallocationTime = 
      (this.metrics.averageDeallocationTime * (this.metrics.totalDeallocations - 1) + deallocationTime) / 
      this.metrics.totalDeallocations;

    return true;
  }

  private insertSortedAndCoalesce(newBlock: AllocationBlock): void {
    // Find position to insert based on address
    let insertIndex = 0;
    while (insertIndex < this.sortedFreeBlocks.length && 
           this.sortedFreeBlocks[insertIndex].address < newBlock.address) {
      insertIndex++;
    }
    
    // Try to coalesce with previous block
    if (insertIndex > 0) {
      const prevBlock = this.sortedFreeBlocks[insertIndex - 1];
      if (prevBlock.address + prevBlock.size === newBlock.address) {
        prevBlock.size += newBlock.size;
        newBlock = prevBlock;
        // Don't increment insertIndex since we're using the previous block
        insertIndex--;
      }
    }
    
    // Try to coalesce with next block
    if (insertIndex < this.sortedFreeBlocks.length) {
      const nextBlock = this.sortedFreeBlocks[insertIndex];
      if (newBlock.address + newBlock.size === nextBlock.address) {
        newBlock.size += nextBlock.size;
        this.sortedFreeBlocks.splice(insertIndex, 1);
      }
    }
    
    // If new block wasn't merged with previous, insert it
    if (insertIndex >= this.sortedFreeBlocks.length || 
        this.sortedFreeBlocks[insertIndex] !== newBlock) {
      this.sortedFreeBlocks.splice(insertIndex, 0, newBlock);
    }
  }
}