import { io, Socket } from 'socket.io-client';
import { AllocatorType, AllocationBlock, AllocatorMetrics } from '../types/allocator';
import { AllocatorScore } from '../core/simulation/SmartEdgeAlloc';
import { formatESP32Address, formatBytes, ESP32_HEAP_SIZE } from '../constants/ESP32Constants';

class LoggingService {
  private socket: Socket | null = null;
  private connected: boolean = false;
  private queue: any[] = [];
  private logToConsole: boolean = true;

  constructor() {
    this.connect();
  }

  private connect(): void {
    try {
      // Configure socket with reconnection options
      this.socket = io('http://localhost:3001', {
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000
      });
      
      this.socket.on('connect', () => {
        this.connected = true;
        console.log('Connected to logging server');
        
        // Send any queued logs
        if (this.queue.length > 0) {
          this.queue.forEach(log => this.socket?.emit('simulation-log', log));
          this.queue = [];
        }
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
      });

      this.socket.on('disconnect', (reason) => {
        this.connected = false;
        console.log('Disconnected from logging server:', reason);
        
        // If the disconnection was initiated by the server, try to reconnect
        if (reason === 'io server disconnect') {
          this.socket?.connect();
        }
      });
    } catch (error) {
      console.error('Failed to connect to logging server:', error);
      this.connected = false;
    }
  }

  private sendLog(logData: any): void {
    if (this.logToConsole) {
      console.log('[Simulation]', logData);
    }
    
    if (this.connected && this.socket) {
      this.socket.emit('simulation-log', logData);
    } else {
      // Queue the log for when we reconnect
      this.queue.push(logData);
    }
  }

  logAllocation(
    allocator: AllocatorType, 
    block: AllocationBlock, 
    time: number, 
    fragmentation: number,
    usedMemory: number
  ): void {
    this.sendLog({
      type: 'allocation',
      allocator,
      id: block.id,
      size: block.size,
      address: block.address,
      time,
      fragmentation,
      used: usedMemory,
      message: `[${this.getTimestamp()}][I][ALLOC][${allocator}] Alloc ${block.size} bytes @ ${formatESP32Address(block.address)} | Time: ${time.toFixed(3)}ms | Heap: ${formatBytes(usedMemory)}/${formatBytes(ESP32_HEAP_SIZE)} (${(usedMemory/ESP32_HEAP_SIZE*100).toFixed(1)}%) | Frag: ${fragmentation.toFixed(1)}%`
    });
  }

  logDeallocation(allocator: AllocatorType, block: AllocationBlock, time: number): void {
    this.sendLog({
      type: 'deallocation',
      allocator,
      id: block.id,
      address: block.address,
      size: block.size,
      time
    });
  }

  logRecommendation(score: AllocatorScore): void {
    this.sendLog({
      type: 'recommendation',
      allocator: score.allocator,
      score: score.score,
      reason: score.reasoning[0]
    });
  }

  logMetrics(allocator: AllocatorType, metrics: AllocatorMetrics): void {
    this.sendLog({
      type: 'metrics',
      allocator,
      used: metrics.currentMemoryUsage,
      // Fix: Replace metrics.totalMemory with the constant value or metrics.wastedSpace
      free: 1024 * 1024 - metrics.currentMemoryUsage, // Assuming 1MB total memory
      fragmentation: metrics.fragmentation,
      successRate: metrics.successRate
    });
  }

  logEvent(message: string): void {
    this.sendLog({
      type: 'event',
      message
    });
  }

  logBoot(message: string): void {
    this.sendLog({
      type: 'boot',
      message
    });
  }

  logError(allocator: AllocatorType, message: string): void {
    this.sendLog({
      type: 'error',
      allocator,
      message
    });
  }

  // This should be called when the app is closing/changing routes
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Add getTimestamp helper
  private getTimestamp(): string {
    const now = new Date();
    return now.toISOString().split('T')[1].split('Z')[0];
  }
}

// Create a singleton instance
const loggingServiceInstance = new LoggingService();
export { loggingServiceInstance as loggingService };