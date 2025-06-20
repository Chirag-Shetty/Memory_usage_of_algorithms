import { AllocatorType, AllocationRequest, AllocationBlock } from '../../types/allocator';
import { BaseAllocator } from './BaseAllocator';

export class BuddyAllocator extends BaseAllocator {
  private minBlockSize: number = 16; // Minimum block size
  private maxLevel: number;
  private freeList: Map<number, AllocationBlock[]>;

  constructor(totalSize: number = 1024 * 1024) {
    // Ensure total size is a power of 2
    const powerOfTwo = Math.pow(2, Math.ceil(Math.log2(totalSize)));
    super(powerOfTwo);
    this.maxLevel = Math.log2(this.totalSize / this.minBlockSize);
    // Initialize freeList in constructor
    this.freeList = new Map();
  }

  get type(): AllocatorType {
    return AllocatorType.BUDDY;
  }

  protected initialize(): void {
    // Make sure freeList is initialized
    if (!this.freeList) {
      this.freeList = new Map();
    } else {
      this.freeList.clear();
    }
    
    this.freeBlocks = [];
    
    // Initialize with one large free block at the maximum level
    const initialBlock: AllocationBlock = {
      id: 'free-0',
      address: 0,
      size: this.totalSize,
      allocated: false,
      timestamp: Date.now()
    };
    
    this.freeList.set(this.maxLevel, [initialBlock]);
    this.freeBlocks.push(initialBlock);
  }

  allocate(request: AllocationRequest): AllocationBlock | null {
    const startTime = performance.now();
    
    // Find the appropriate block size (round up to next power of 2)
    const requiredSize = Math.max(this.minBlockSize, Math.pow(2, Math.ceil(Math.log2(request.size))));
    const level = Math.log2(this.totalSize / requiredSize);
    
    if (level < 0 || level > this.maxLevel) {
      return null;
    }

    // Find a free block at the appropriate level or split a larger block
    const block = this.findOrSplitBlock(level);
    if (!block) {
      return null;
    }

    // Create allocation block
    const allocatedBlock: AllocationBlock = {
      id: request.id,
      address: block.address,
      size: requiredSize,
      allocated: true,
      timestamp: request.timestamp
    };

    // Store the allocated block
    this.allocatedBlocks.set(request.id, allocatedBlock);
    
    // Update waste tracking
    this.metrics.wastedSpace += (requiredSize - request.size);

    // Update metrics
    this.metrics.totalAllocations++;
    const allocationTime = performance.now() - startTime;
    this.metrics.averageAllocationTime = 
      (this.metrics.averageAllocationTime * (this.metrics.totalAllocations - 1) + allocationTime) / 
      this.metrics.totalAllocations;

    this.updateFreeBlocksList();
    return allocatedBlock;
  }

  deallocate(blockId: string): boolean {
    const startTime = performance.now();
    
    const block = this.allocatedBlocks.get(blockId);
    if (!block) {
      return false;
    }

    this.allocatedBlocks.delete(blockId);
    
    // Find the level for this block size
    const level = Math.log2(this.totalSize / block.size);
    
    // Create free block
    const freeBlock: AllocationBlock = {
      id: `free-${Date.now()}`,
      address: block.address,
      size: block.size,
      allocated: false,
      timestamp: Date.now()
    };

    // Try to merge with buddy
    this.mergeWithBuddy(freeBlock, level);

    // Update metrics
    this.metrics.totalDeallocations++;
    const deallocationTime = performance.now() - startTime;
    this.metrics.averageDeallocationTime = 
      (this.metrics.averageDeallocationTime * (this.metrics.totalDeallocations - 1) + deallocationTime) / 
      this.metrics.totalDeallocations;

    this.updateFreeBlocksList();
    return true;
  }

  private findOrSplitBlock(targetLevel: number): AllocationBlock | null {
    // Try to find a block at the target level
    for (let level = targetLevel; level <= this.maxLevel; level++) {
      const blocks = this.freeList.get(level);
      if (blocks && blocks.length > 0) {
        const block = blocks.pop()!;
        
        // Split the block down to the target level
        while (level > targetLevel) {
          level--;
          const buddySize = Math.pow(2, Math.log2(this.totalSize) - level);
          
          // Create buddy block
          const buddy: AllocationBlock = {
            id: `free-${Date.now()}-${Math.random()}`,
            address: block.address + buddySize,
            size: buddySize,
            allocated: false,
            timestamp: Date.now()
          };
          
          // Add buddy to free list
          if (!this.freeList.has(level)) {
            this.freeList.set(level, []);
          }
          this.freeList.get(level)!.push(buddy);
          
          // Reduce original block size
          block.size = buddySize;
        }
        
        return block;
      }
    }
    
    return null;
  }

  private mergeWithBuddy(block: AllocationBlock, level: number): void {
    // Calculate buddy address
    const blockSize = block.size;
    const buddyAddress = block.address ^ blockSize; // XOR to find buddy
    
    // Look for buddy in the free list
    const blocks = this.freeList.get(level);
    if (!blocks) {
      // No blocks at this level, just add the block
      this.freeList.set(level, [block]);
      return;
    }
    
    const buddyIndex = blocks.findIndex(b => b.address === buddyAddress && b.size === blockSize);
    
    if (buddyIndex !== -1) {
      // Found buddy, merge them
      const buddy = blocks.splice(buddyIndex, 1)[0];
      
      const mergedBlock: AllocationBlock = {
        id: `free-${Date.now()}`,
        address: Math.min(block.address, buddy.address),
        size: block.size * 2,
        allocated: false,
        timestamp: Date.now()
      };
      
      // Recursively try to merge at the next level
      if (level < this.maxLevel) {
        this.mergeWithBuddy(mergedBlock, level + 1);
      } else {
        // At max level, just add to free list
        if (!this.freeList.has(level + 1)) {
          this.freeList.set(level + 1, []);
        }
        this.freeList.get(level + 1)!.push(mergedBlock);
      }
    } else {
      // No buddy found, just add the block
      blocks.push(block);
    }
  }

  private updateFreeBlocksList(): void {
    this.freeBlocks = [];
    for (const blocks of this.freeList.values()) {
      this.freeBlocks.push(...blocks);
    }
    this.freeBlocks.sort((a, b) => a.address - b.address);
  }
}