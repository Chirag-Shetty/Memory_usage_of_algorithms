import { AllocatorType, AllocationRequest, AllocationBlock } from '../../types/allocator';
import { BaseAllocator } from './BaseAllocator';

export class FreeListAllocator extends BaseAllocator {
  get type(): AllocatorType {
    return AllocatorType.FREE_LIST;
  }

  protected initialize(): void {
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
    
    // Find first fit free block
    const freeBlockIndex = this.freeBlocks.findIndex(block => block.size >= request.size);
    
    if (freeBlockIndex === -1) {
      return null;
    }

    const freeBlock = this.freeBlocks[freeBlockIndex];
    
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
      // Split the free block
      freeBlock.address += request.size;
      freeBlock.size -= request.size;
    } else {
      // Remove the free block entirely
      this.freeBlocks.splice(freeBlockIndex, 1);
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

    // Insert and coalesce with adjacent free blocks
    this.insertAndCoalesce(newFreeBlock);

    // Update metrics
    this.metrics.totalDeallocations++;
    const deallocationTime = performance.now() - startTime;
    this.metrics.averageDeallocationTime = 
      (this.metrics.averageDeallocationTime * (this.metrics.totalDeallocations - 1) + deallocationTime) / 
      this.metrics.totalDeallocations;

    return true;
  }

  private insertAndCoalesce(newBlock: AllocationBlock): void {
    // Find the correct position to insert the block (keep list sorted by address)
    let insertIndex = 0;
    while (insertIndex < this.freeBlocks.length && 
           this.freeBlocks[insertIndex].address < newBlock.address) {
      insertIndex++;
    }

    // Check for coalescing with previous block
    if (insertIndex > 0) {
      const prevBlock = this.freeBlocks[insertIndex - 1];
      if (prevBlock.address + prevBlock.size === newBlock.address) {
        // Coalesce with previous block
        prevBlock.size += newBlock.size;
        newBlock = prevBlock;
        insertIndex--;
      }
    }

    // Check for coalescing with next block
    if (insertIndex < this.freeBlocks.length) {
      const nextBlock = this.freeBlocks[insertIndex];
      if (newBlock.address + newBlock.size === nextBlock.address) {
        // Coalesce with next block
        newBlock.size += nextBlock.size;
        this.freeBlocks.splice(insertIndex, 1);
      }
    }

    // Insert the block if it wasn't coalesced with previous block
    if (insertIndex >= this.freeBlocks.length || this.freeBlocks[insertIndex] !== newBlock) {
      this.freeBlocks.splice(insertIndex, 0, newBlock);
    }
  }
}