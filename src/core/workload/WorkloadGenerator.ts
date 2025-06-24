import { AllocationRequest, WorkloadType } from '../../types/allocator';

export class WorkloadGenerator {
  private requestCounter = 0;
  private preGeneratedWorkload: AllocationRequest[] = [];
  private workloadIndex: number = 0;
  private isUsingPregenerated: boolean = false;

  generateRequest(workloadType: WorkloadType): AllocationRequest {
    this.requestCounter++;
    const id = `req-${this.requestCounter}`;
    const timestamp = Date.now();

    switch (workloadType) {
      case WorkloadType.RANDOM:
        return {
          id,
          size: Math.floor(Math.random() * 1024) + 16,
          timestamp,
          duration: Math.floor(Math.random() * 5000) + 1000
        };

      case WorkloadType.UNIFORM_SMALL:
        return {
          id,
          size: 32 + Math.floor(Math.random() * 32), // 32-64 bytes
          timestamp,
          duration: Math.floor(Math.random() * 2000) + 500
        };

      case WorkloadType.UNIFORM_LARGE:
        return {
          id,
          size: 2048 + Math.floor(Math.random() * 2048), // 2-4KB
          timestamp,
          duration: Math.floor(Math.random() * 10000) + 2000
        };

      case WorkloadType.LIFO:
        return {
          id,
          size: Math.floor(Math.random() * 512) + 64,
          timestamp,
          duration: 100 + Math.floor(Math.random() * 200) // Short-lived for LIFO pattern
        };

      case WorkloadType.SHORT_LIVED:
        return {
          id,
          size: Math.floor(Math.random() * 256) + 32,
          timestamp,
          duration: Math.floor(Math.random() * 500) + 100 // Very short duration
        };

      case WorkloadType.LONG_LIVED:
        return {
          id,
          size: Math.floor(Math.random() * 2048) + 256,
          timestamp,
          duration: Math.floor(Math.random() * 30000) + 10000 // Long duration
        };

      case WorkloadType.POWER_OF_TWO:
        const powers = [16, 32, 64, 128, 256, 512, 1024, 2048];
        return {
          id,
          size: powers[Math.floor(Math.random() * powers.length)],
          timestamp,
          duration: Math.floor(Math.random() * 3000) + 1000
        };

      default:
        return {
          id,
          size: Math.floor(Math.random() * 512) + 64,
          timestamp,
          duration: Math.floor(Math.random() * 2000) + 1000
        };
    }
  }

  generateBurst(workloadType: WorkloadType, count: number = 10): AllocationRequest[] {
    const requests: AllocationRequest[] = [];
    for (let i = 0; i < count; i++) {
      requests.push(this.generateRequest(workloadType));
    }
    return requests;
  }

  // Pre-generate a consistent workload for benchmark testing
  preGenerateWorkload(workloadType: WorkloadType, count: number): void {
    this.preGeneratedWorkload = [];
    this.workloadIndex = 0;
    this.isUsingPregenerated = true;
    
    // Generate realistic workload based on pattern
    for (let i = 0; i < count; i++) {
      // Create allocation with realistic size and duration
      const size = this.getRequestSize(workloadType);
      const duration = this.getRequestDuration(workloadType);
      
      const request: AllocationRequest = {
        id: `benchmark-${i}`,
        size: size,
        timestamp: Date.now() + i * 10, // Spread out timestamps
        duration: duration
      };
      
      this.preGeneratedWorkload.push(request);
    }
    
    console.log(`Pre-generated ${count} operations for benchmark with ${workloadType} pattern`);
  }

  private getRequestSize(workloadType: WorkloadType): number {
    // Generate realistic sizes based on workload type
    switch (workloadType) {
      case WorkloadType.UNIFORM_SMALL:
        return 16 + Math.floor(Math.random() * 48); // 16-64 bytes
        
      case WorkloadType.UNIFORM_LARGE:
        return 1024 + Math.floor(Math.random() * 3072); // 1KB-4KB
        
      case WorkloadType.POWER_OF_TWO:
        const powers = [16, 32, 64, 128, 256, 512, 1024, 2048, 4096];
        return powers[Math.floor(Math.random() * powers.length)];
        
      case WorkloadType.LIFO:
      case WorkloadType.SHORT_LIVED:
      case WorkloadType.LONG_LIVED:
      case WorkloadType.RANDOM:
      default:
        // Exponential distribution - many small, few large
        return Math.min(16 + Math.floor(Math.random() * Math.random() * 4080), 4096);
    }
  }

  private getRequestDuration(workloadType: WorkloadType): number | undefined {
    // Generate realistic durations based on workload type
    switch (workloadType) {
      case WorkloadType.SHORT_LIVED:
        return 100 + Math.floor(Math.random() * 900); // 100-1000ms
        
      case WorkloadType.LONG_LIVED:
        return 5000 + Math.floor(Math.random() * 5000); // 5-10 seconds
        
      case WorkloadType.LIFO:
        // LIFO allocations should be deallocated in reverse order
        // So later allocations have shorter durations
        return 2000 - this.workloadIndex * (2000 / this.preGeneratedWorkload.length || 1);
        
      default:
        // Mix of durations, some null (manual deallocation)
        return Math.random() < 0.7 ? 
          500 + Math.floor(Math.random() * 2500) : // 500-3000ms 
          undefined; // Some allocations won't auto-deallocate
    }
  }

  resetWorkload(): void {
    this.workloadIndex = 0;
  }

  generate(workloadType: WorkloadType): AllocationRequest {
    if (this.isUsingPregenerated) {
      if (this.workloadIndex >= this.preGeneratedWorkload.length) {
        // Instead of returning null, create a fallback request
        return {
          id: `fallback-${Date.now()}`,
          size: 16, // Small default size
          timestamp: Date.now(),
          duration: 100 // Short duration
        };
      }

      return this.preGeneratedWorkload[this.workloadIndex++];
    } else {
      return this.generateRequest(workloadType);
    }
  }

  reset(): void {
    this.requestCounter = 0;
  }

  // Check if there are more operations in the sequence
  hasMoreOperations(): boolean {
    return this.isUsingPregenerated && this.workloadIndex < this.preGeneratedWorkload.length;
  }

  // Get the next pre-generated operation
  getNextOperation(): AllocationRequest {
    if (!this.isUsingPregenerated || this.workloadIndex >= this.preGeneratedWorkload.length) {
      // Fallback to random if no more pre-generated operations
      return this.generateRequest(WorkloadType.RANDOM);
    }

    const request = this.preGeneratedWorkload[this.workloadIndex++];
    return request;
  }

  // Calculate progress percentage through the workload
  getProgressPercentage(): number {
    if (!this.isUsingPregenerated || this.preGeneratedWorkload.length === 0) {
      return 0;
    }
    return Math.min(1, this.workloadIndex / this.preGeneratedWorkload.length);
  }

  // Add this method
  getCurrentRequest(): AllocationRequest | null {
    if (!this.isUsingPregenerated || this.workloadIndex <= 0 || this.workloadIndex > this.preGeneratedWorkload.length) {
      return null;
    }
    
    // Return the last processed request
    return this.preGeneratedWorkload[this.workloadIndex - 1];
  }
}