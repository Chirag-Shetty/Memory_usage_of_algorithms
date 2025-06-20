import { AllocatorType, AllocationRequest, AllocationBlock } from '../../types/allocator';
import { BaseAllocator } from './BaseAllocator';

// Simplified C malloc/free simulation
export class CAllocator extends BaseAllocator {
  private freeListBySizeClass: Map<number, AllocationBlock[]> = new Map();
  
  get type(): AllocatorType {
    return AllocatorType.C_ALLOCATOR;
  }

  protected initialize(): void {
    // Fix: Initialize the map
    this.freeListBySizeClass = new Map();
    
    this.freeBlocks = [{
      id: 'free-0',
      address: 0,
      size: this.totalSize,
      allocated: false,
      timestamp: Date.now()
    }];
    
    // Define SIZE_CLASSES locally to avoid static initialization issues
    const SIZE_CLASSES = [16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192];
    
    // Initialize size class lists
    SIZE_CLASSES.forEach(size => {
      this.freeListBySizeClass.set(size, []);
    });
  }

  allocate(request: AllocationRequest): AllocationBlock | null {
    const startTime = performance.now();
    
    // Add header overhead (simulate malloc header)
    const totalSize = request.size + 16; // 16 bytes for malloc header
    
    // Find appropriate size class
    const sizeClass = this.findSizeClass(totalSize);
    
    // Try to find a block in the appropriate size class first
    let block = this.findInSizeClass(sizeClass);
    
    if (!block) {
      // Try to find any suitable block in free list
      block = this.findInFreeList(totalSize);
    }
    
    if (!block) {
      return null;
    }

    // Create allocation block
    const allocatedBlock: AllocationBlock = {
      id: request.id,
      address: block.address,
      size: request.size, // Return actual requested size, not total with header
      allocated: true,
      timestamp: request.timestamp
    };
    
    // Store the allocated block with total size for bookkeeping
    this.allocatedBlocks.set(request.id, {
      ...allocatedBlock,
      size: totalSize // Store with header for proper deallocation
    });

    // Update metrics
    this.metrics.totalAllocations++;
    this.metrics.wastedSpace += (totalSize - request.size); // Header overhead
    const allocationTime = performance.now() - startTime;
    this.metrics.averageAllocationTime = 
      (this.metrics.averageAllocationTime * (this.metrics.totalAllocations - 1) + allocationTime) / 
      this.metrics.totalAllocations;

    return allocatedBlock;
  }

  deallocate(blockId: string): boolean {
    const startTime = performance.now();
    
    const block = this.allocatedBlocks.get(blockId);
    if (!block) {
      return false;
    }

    this.allocatedBlocks.delete(blockId);

    // Create free block
    const freeBlock: AllocationBlock = {
      id: `free-${Date.now()}`,
      address: block.address,
      size: block.size, // Use size with header
      allocated: false,
      timestamp: Date.now()
    };

    // Add to appropriate size class or general free list
    const sizeClass = this.findSizeClass(block.size);
    if (sizeClass && this.freeListBySizeClass.has(sizeClass)) {
      this.freeListBySizeClass.get(sizeClass)!.push(freeBlock);
    } else {
      // Add to general free list and try to coalesce
      this.insertAndCoalesce(freeBlock);
    }

    // Update metrics
    this.metrics.totalDeallocations++;
    const deallocationTime = performance.now() - startTime;
    this.metrics.averageDeallocationTime = 
      (this.metrics.averageDeallocationTime * (this.metrics.totalDeallocations - 1) + deallocationTime) / 
      this.metrics.totalDeallocations;

    return true;
  }

  private findSizeClass(size: number): number | null {
    // Define SIZE_CLASSES locally here as well
    const SIZE_CLASSES = [16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192];
    return SIZE_CLASSES.find(sc => sc >= size) || null;
  }

  private findInSizeClass(sizeClass: number | null): AllocationBlock | null {
    if (!sizeClass || !this.freeListBySizeClass.has(sizeClass)) {
      return null;
    }
    
    const blocks = this.freeListBySizeClass.get(sizeClass)!;
    return blocks.length > 0 ? blocks.pop()! : null;
  }

  private findInFreeList(size: number): AllocationBlock | null {
    // Find first fit in main free list
    const blockIndex = this.freeBlocks.findIndex(block => block.size >= size);
    
    if (blockIndex === -1) {
      return null;
    }

    const freeBlock = this.freeBlocks[blockIndex];
    
    // Split block if necessary
    if (freeBlock.size > size) {
      const newFreeBlock: AllocationBlock = {
        id: `free-${Date.now()}`,
        address: freeBlock.address + size,
        size: freeBlock.size - size,
        allocated: false,
        timestamp: Date.now()
      };
      
      this.freeBlocks.push(newFreeBlock);
      freeBlock.size = size;
    }
    
    // Remove from free list
    this.freeBlocks.splice(blockIndex, 1);
    
    return freeBlock;
  }

  private insertAndCoalesce(newBlock: AllocationBlock): void {
    // Simple coalescing implementation
    let insertIndex = 0;
    while (insertIndex < this.freeBlocks.length && 
           this.freeBlocks[insertIndex].address < newBlock.address) {
      insertIndex++;
    }

    // Try to coalesce with previous block
    if (insertIndex > 0) {
      const prevBlock = this.freeBlocks[insertIndex - 1];
      if (prevBlock.address + prevBlock.size === newBlock.address) {
        prevBlock.size += newBlock.size;
        newBlock = prevBlock;
        insertIndex--;
      }
    }

    // Try to coalesce with next block
    if (insertIndex < this.freeBlocks.length) {
      const nextBlock = this.freeBlocks[insertIndex];
      if (newBlock.address + newBlock.size === nextBlock.address) {
        newBlock.size += nextBlock.size;
        this.freeBlocks.splice(insertIndex, 1);
      }
    }

    // Insert if not coalesced with previous
    if (insertIndex >= this.freeBlocks.length || this.freeBlocks[insertIndex] !== newBlock) {
      this.freeBlocks.splice(insertIndex, 0, newBlock);
    }
  }
}