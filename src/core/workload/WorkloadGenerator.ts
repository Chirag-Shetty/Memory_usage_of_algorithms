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

  preGenerateWorkload(workloadType: WorkloadType, count: number): void {
    this.preGeneratedWorkload = [];
    this.workloadIndex = 0;

    for (let i = 0; i < count; i++) {
      const request = this.generateRequest(workloadType);
      this.preGeneratedWorkload.push(request);
    }

    this.isUsingPregenerated = true;
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
}