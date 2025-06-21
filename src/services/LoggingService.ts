import { io, Socket } from 'socket.io-client';
import { AllocatorType, AllocationBlock, AllocatorMetrics } from '../types/allocator';
import { formatBytes } from '../constants/ESP32Constants';

class LoggingService {
  private socket: Socket | null = null;
  private outputChannels = {
    console: true,
    web: true,
    esp32: false
  };
  
  private esp32Status: { connected: boolean; port: string | null } = {
    connected: false,
    port: null
  };

  constructor() {
    this.socket = io('http://localhost:3001');
    
    if (this.socket) { // Add this null check
      this.socket.on('connect', () => {
        console.log('Connected to logging server');
        
        // Request ESP32 status after connection
        if (this.socket) {
          this.socket.on('esp32-status', (status) => {
            this.esp32Status = status;
            this.outputChannels.esp32 = status.connected;
            console.log(`ESP32 status updated: ${status.connected ? 'Connected' : 'Disconnected'}`);
          });
        }
      });
    }
  }
  
  setOutputChannels(channels: {console?: boolean, web?: boolean, esp32?: boolean}): void {
    if (channels.console !== undefined) this.outputChannels.console = channels.console;
    if (channels.web !== undefined) this.outputChannels.web = channels.web;
    if (channels.esp32 !== undefined) this.outputChannels.esp32 = channels.esp32;
  }
  
  private formatESP32Address(address: number): string {
    return `0x${address.toString(16).padStart(8, '0')}`;
  }
  
  private getTimestamp(): string {
    return new Date().toISOString().split('T')[1].split('.')[0];
  }
  
  private multiChannelLog(message: string): void {
    // Send to all enabled channels
    if (this.outputChannels.console) {
      console.log(message);
    }
    
    if (this.outputChannels.web && this.socket) {
      this.socket.emit('simulation-log', { message });
    }
    
    // Removed direct serialport usage
  }
  
  logBoot(message: string): void {
    const formatted = `[${this.getTimestamp()}][I][BOOT] ${message}`;
    this.multiChannelLog(formatted);
  }
  
  logAllocation(allocator: AllocatorType, block: AllocationBlock, time: number, fragmentation: number, usedMemory: number): void {
    const formatted = `[${this.getTimestamp()}][I][ALLOC][${allocator}] Allocated ${formatBytes(block.size)} at ${this.formatESP32Address(block.address)} (Time: ${time.toFixed(3)}ms, Fragmentation: ${fragmentation.toFixed(1)}%, Heap: ${formatBytes(usedMemory)})`;
    this.multiChannelLog(formatted);
    
    if (this.socket) {
      this.socket.emit('simulation-log', { 
        type: 'allocation',
        allocator,
        id: block.id,
        size: block.size,
        address: block.address,
        time,
        fragmentation,
        usedMemory
      });
    }
  }
  
  logDeallocation(allocator: AllocatorType, blockId: string, address: number, time: number): void {
    const formatted = `[${this.getTimestamp()}][I][FREE][${allocator}] Freed block ${blockId} at ${this.formatESP32Address(address)} (Time: ${time.toFixed(3)}ms)`;
    this.multiChannelLog(formatted);
    
    if (this.socket) {
      this.socket.emit('simulation-log', { 
        type: 'deallocation',
        allocator,
        id: blockId,
        address,
        time
      });
    }
  }
  
  logRecommendation(recommendation: { allocator: AllocatorType, score: number, reasoning: string[] }): void {
    const formatted = `[${this.getTimestamp()}][S][SMART][EdgeAlloc] Recommended: ${recommendation.allocator} (Score: ${(recommendation.score * 100).toFixed(0)}%, Reason: ${recommendation.reasoning[0]})`;
    this.multiChannelLog(formatted);
    
    if (this.socket) {
      this.socket.emit('simulation-log', {
        type: 'recommendation',
        allocator: recommendation.allocator,
        score: recommendation.score,
        reason: recommendation.reasoning[0]
      });
    }
  }
  
  logEvent(message: string): void {
    const formatted = `[${this.getTimestamp()}][I][EVENT] ${message}`;
    this.multiChannelLog(formatted);
    
    if (this.socket) {
      this.socket.emit('simulation-log', { 
        type: 'event',
        message
      });
    }
  }
  
  logMetrics(allocator: AllocatorType, metrics: AllocatorMetrics): void {
    const formatted = `[${this.getTimestamp()}][I][METRICS][${allocator}] Memory: ${formatBytes(metrics.currentMemoryUsage)}/${formatBytes(metrics.peakMemoryUsage)}, Frag: ${metrics.fragmentation.toFixed(1)}%, Success: ${metrics.successRate.toFixed(1)}%`;
    this.multiChannelLog(formatted);
    
    if (this.socket) {
      this.socket.emit('simulation-log', { 
        type: 'metrics',
        allocator,
        metrics
      });
    }
  }
  
  logDemo(message: string): void {
    const formatted = `[${this.getTimestamp()}][D][DEMO] ${message}`;
    this.multiChannelLog(formatted);
    
    if (this.socket) {
      this.socket.emit('simulation-log', {
        type: 'demo',
        message
      });
    }
  }
  
  logComparison(comparisonTable: string): void {
    const formatted = `[${this.getTimestamp()}][D][COMPARISON] ${comparisonTable}`;
    this.multiChannelLog(formatted);
    
    if (this.socket) {
      this.socket.emit('simulation-log', {
        type: 'comparison',
        table: comparisonTable
      });
    }
  }

  getESP32Status(): { connected: boolean; port: string | null } {
    return { ...this.esp32Status };
  }

  connectToESP32(port: string): void {
    if (this.socket) {
      this.socket.emit('connect-esp32', { port });
    }
  }

  disconnectFromESP32(): void {
    if (this.socket) {
      this.socket.emit('disconnect-esp32');
    }
  }
}

export const loggingService = new LoggingService();