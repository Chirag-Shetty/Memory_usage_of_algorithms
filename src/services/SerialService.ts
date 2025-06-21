import { SerialPort } from 'serialport';

class SerialService {
  private port: SerialPort | null = null;
  private connected: boolean = false;
  
  async connectToESP32(portPath: string, baudRate: number = 115200): Promise<boolean> {
    try {
      this.port = new SerialPort({ path: portPath, baudRate });
      
      return new Promise((resolve) => {
        this.port!.on('open', () => {
          console.log(`Connected to ESP32 on ${portPath}`);
          this.connected = true;
          resolve(true);
        });
        
        this.port!.on('error', (err) => {
          console.error('ESP32 connection error:', err);
          this.connected = false;
          resolve(false);
        });
      });
    } catch (err) {
      console.error('Failed to connect to ESP32:', err);
      return false;
    }
  }
  
  isConnected(): boolean {
    return this.connected;
  }
  
  sendToESP32(message: string): void {
    if (!this.connected || !this.port) return;
    
    try {
      this.port.write(message + '\n');
    } catch (err) {
      console.error('Error sending to ESP32:', err);
    }
  }
  
  disconnect(): void {
    if (this.port) {
      this.port.close();
      this.connected = false;
    }
  }
}

export const serialService = new SerialService();